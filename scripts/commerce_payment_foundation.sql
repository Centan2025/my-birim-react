-- ============================================================
-- BİRİM WEB COMMERCE — PHASE 6A: PAYMENT FOUNDATION SCHEMA
-- Target: Supabase PostgreSQL (Payment Transactions & Idempotency)
-- ============================================================

-- 1. PAYMENT TRANSACTIONS TABLOSUNA EKLENEN KOLONLAR VE İNDEKSLER
ALTER TABLE public.payment_transactions 
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS provider_event_id TEXT;

-- Provider constraint'ini genişlet (mock, test, iyzico, paytr, stripe vb. provider-neutral mimari için)
ALTER TABLE public.payment_transactions 
  DROP CONSTRAINT IF EXISTS payment_transactions_provider_check;

ALTER TABLE public.payment_transactions 
  ADD CONSTRAINT payment_transactions_provider_check 
  CHECK (provider IN ('mock', 'test', 'iyzico', 'paytr', 'stripe', 'custom'));

-- Idempotency key benzersizlik indeksi
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_tx_idempotency_key 
  ON public.payment_transactions(idempotency_key) 
  WHERE idempotency_key IS NOT NULL;

-- Provider event ID benzersizlik indeksi (Tekrarlanan callback / webhook'lara karşı koruma)
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_tx_provider_event 
  ON public.payment_transactions(provider_event_id) 
  WHERE provider_event_id IS NOT NULL;

-- 2. ATOMIC PAYMENT TRANSACTION INITIALIZATION RPC
-- Bir sipariş için ödeme denemesi başlatıldığında atomik olarak transaction oluşturulur.
-- Eşzamanlı duplicate isteklerde race condition koruması sağlar.
CREATE OR REPLACE FUNCTION public.create_payment_transaction_atomic(
  p_transaction JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_tx_id UUID;
  v_existing_record RECORD;
  v_order_record RECORD;
  v_idempotency_key TEXT;
  v_order_id UUID;
BEGIN
  v_idempotency_key := NULLIF(TRIM(p_transaction->>'idempotency_key'), '');
  v_order_id := (p_transaction->>'order_id')::uuid;

  -- 1. Sipariş Durumu Kontrolü
  SELECT * INTO v_order_record
  FROM public.orders
  WHERE id = v_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PAYMENT_ORDER_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  IF v_order_record.status = 'PAID' OR v_order_record.payment_status = 'PAID' THEN
    RAISE EXCEPTION 'PAYMENT_ALREADY_PAID' USING ERRCODE = 'P0003';
  END IF;

  IF v_order_record.status <> 'PENDING_PAYMENT' THEN
    RAISE EXCEPTION 'PAYMENT_ORDER_NOT_PAYABLE' USING ERRCODE = 'P0004';
  END IF;

  -- 2. Idempotency Kontrolü
  IF v_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_existing_record
    FROM public.payment_transactions
    WHERE idempotency_key = v_idempotency_key;

    IF FOUND THEN
      IF v_existing_record.order_id <> v_order_id THEN
        RAISE EXCEPTION 'PAYMENT_IDEMPOTENCY_KEY_REUSED' USING ERRCODE = 'P0001';
      END IF;

      RETURN jsonb_build_object(
        'is_existing', true,
        'transaction_id', v_existing_record.id,
        'order_id', v_existing_record.order_id,
        'provider', v_existing_record.provider,
        'amount', v_existing_record.amount,
        'currency', v_existing_record.currency,
        'status', v_existing_record.status,
        'provider_transaction_id', v_existing_record.provider_transaction_id,
        'provider_payment_id', v_existing_record.provider_payment_id,
        'created_at', v_existing_record.created_at
      );
    END IF;
  END IF;

  -- 3. Payment Transaction INSERT
  BEGIN
    INSERT INTO public.payment_transactions (
      order_id,
      provider,
      provider_payment_id,
      provider_transaction_id,
      provider_token,
      conversation_id,
      amount,
      currency,
      status,
      installment,
      metadata,
      idempotency_key
    ) VALUES (
      v_order_id,
      COALESCE(p_transaction->>'provider', 'mock'),
      p_transaction->>'provider_payment_id',
      p_transaction->>'provider_transaction_id',
      p_transaction->>'provider_token',
      p_transaction->>'conversation_id',
      ROUND((p_transaction->>'amount')::numeric, 2),
      COALESCE(p_transaction->>'currency', v_order_record.currency),
      COALESCE(p_transaction->>'status', 'PENDING'),
      COALESCE((p_transaction->>'installment')::integer, 1),
      COALESCE(p_transaction->'metadata', '{}'::jsonb),
      v_idempotency_key
    )
    RETURNING id INTO v_tx_id;
  EXCEPTION
    WHEN unique_violation THEN
      IF v_idempotency_key IS NOT NULL THEN
        SELECT * INTO v_existing_record
        FROM public.payment_transactions
        WHERE idempotency_key = v_idempotency_key;

        IF FOUND THEN
          IF v_existing_record.order_id <> v_order_id THEN
            RAISE EXCEPTION 'PAYMENT_IDEMPOTENCY_KEY_REUSED' USING ERRCODE = 'P0001';
          END IF;

          RETURN jsonb_build_object(
            'is_existing', true,
            'transaction_id', v_existing_record.id,
            'order_id', v_existing_record.order_id,
            'provider', v_existing_record.provider,
            'amount', v_existing_record.amount,
            'currency', v_existing_record.currency,
            'status', v_existing_record.status,
            'provider_transaction_id', v_existing_record.provider_transaction_id,
            'provider_payment_id', v_existing_record.provider_payment_id,
            'created_at', v_existing_record.created_at
          );
        END IF;
      END IF;
      RAISE;
  END;

  RETURN jsonb_build_object(
    'is_existing', false,
    'transaction_id', v_tx_id,
    'order_id', v_order_id,
    'provider', COALESCE(p_transaction->>'provider', 'mock'),
    'amount', ROUND((p_transaction->>'amount')::numeric, 2),
    'currency', COALESCE(p_transaction->>'currency', v_order_record.currency),
    'status', COALESCE(p_transaction->>'status', 'PENDING'),
    'provider_transaction_id', p_transaction->>'provider_transaction_id',
    'provider_payment_id', p_transaction->>'provider_payment_id',
    'created_at', NOW()
  );
END;
$$;

-- 3. ATOMIC PAYMENT EVENT RESOLUTION RPC (Sipariş & Ödeme Durumunu Birlikte Güncelleme)
CREATE OR REPLACE FUNCTION public.resolve_payment_event_atomic(
  p_event JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_tx_id UUID;
  v_order_id UUID;
  v_new_status TEXT;
  v_provider_event_id TEXT;
  v_existing_tx RECORD;
BEGIN
  v_tx_id := (p_event->>'transaction_id')::uuid;
  v_new_status := p_event->>'status';
  v_provider_event_id := NULLIF(TRIM(p_event->>'provider_event_id'), '');

  SELECT * INTO v_existing_tx
  FROM public.payment_transactions
  WHERE id = v_tx_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'PAYMENT_TRANSACTION_NOT_FOUND' USING ERRCODE = 'P0005';
  END IF;

  v_order_id := v_existing_tx.order_id;

  -- 1. Callback Idempotency (Aynı event tekrar geldiyse no-op 200 OK)
  IF v_provider_event_id IS NOT NULL AND v_existing_tx.provider_event_id = v_provider_event_id THEN
    RETURN jsonb_build_object(
      'is_duplicate', true,
      'transaction_id', v_tx_id,
      'order_id', v_order_id,
      'status', v_existing_tx.status
    );
  END IF;

  -- 2. Güncelleme
  UPDATE public.payment_transactions
  SET 
    status = v_new_status,
    provider_event_id = COALESCE(v_provider_event_id, provider_event_id),
    provider_transaction_id = COALESCE(p_event->>'provider_transaction_id', provider_transaction_id),
    error_code = p_event->>'error_code',
    error_message = p_event->>'error_message',
    updated_at = NOW()
  WHERE id = v_tx_id;

  -- 3. Sipariş Durumunu Senkronize Et
  IF v_new_status = 'PAID' OR v_new_status = 'SUCCESS' THEN
    UPDATE public.orders
    SET 
      status = 'PAID',
      payment_status = 'PAID',
      updated_at = NOW()
    WHERE id = v_order_id;
  ELSIF v_new_status = 'FAILED' THEN
    UPDATE public.orders
    SET 
      status = 'PAYMENT_FAILED',
      payment_status = 'FAILED',
      updated_at = NOW()
    WHERE id = v_order_id AND status = 'PENDING_PAYMENT';
  END IF;

  RETURN jsonb_build_object(
    'is_duplicate', false,
    'transaction_id', v_tx_id,
    'order_id', v_order_id,
    'status', v_new_status
  );
END;
$$;
