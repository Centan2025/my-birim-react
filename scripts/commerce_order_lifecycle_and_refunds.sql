-- ============================================================
-- BİRİM WEB COMMERCE — PHASE 6A.5: ORDER LIFECYCLE & REFUND SCHEMA
-- Target: Supabase PostgreSQL (Refunds, Order Events & Atomic RPCs)
-- ============================================================

-- 1. REFUNDS TABLOSU
CREATE TABLE IF NOT EXISTS public.refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE RESTRICT NOT NULL,
  payment_transaction_id UUID REFERENCES public.payment_transactions(id) ON DELETE SET NULL,
  idempotency_key TEXT,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'TRY' CHECK (currency IN ('TRY', 'USD', 'EUR')),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (
    status IN ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED')
  ),
  provider TEXT NOT NULL DEFAULT 'mock' CHECK (
    provider IN ('mock', 'test', 'iyzico', 'paytr', 'stripe', 'custom')
  ),
  provider_refund_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Idempotency key benzersizlik indeksi
CREATE UNIQUE INDEX IF NOT EXISTS idx_refunds_idempotency_key 
  ON public.refunds(idempotency_key) 
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_refunds_order_id 
  ON public.refunds(order_id);

CREATE INDEX IF NOT EXISTS idx_refunds_created_at 
  ON public.refunds(created_at DESC);

-- Updated_at tetikleyicisi
DROP TRIGGER IF EXISTS on_refunds_updated ON public.refunds;
CREATE TRIGGER on_refunds_updated
  BEFORE UPDATE ON public.refunds
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 2. COMMERCE ORDER EVENTS TABLOSU (Audit Trail)
CREATE TABLE IF NOT EXISTS public.commerce_order_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'ORDER_CREATED',
      'ORDER_CANCELLED',
      'PAYMENT_INITIALIZED',
      'PAYMENT_SUCCEEDED',
      'PAYMENT_FAILED',
      'REFUND_REQUESTED',
      'REFUND_SUCCEEDED',
      'REFUND_FAILED'
    )
  ),
  actor_type TEXT NOT NULL CHECK (actor_type IN ('system', 'customer', 'admin')),
  actor_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_events_order_id 
  ON public.commerce_order_events(order_id);

CREATE INDEX IF NOT EXISTS idx_order_events_created_at 
  ON public.commerce_order_events(created_at DESC);

-- 3. RLS POLİTİKALARI
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commerce_order_events ENABLE ROW LEVEL SECURITY;

-- İstemciden doğrudan erişim engellenir; yalnızca service_role sunucu üzerinden erişebilir.

-- 4. ATOMIC ORDER CANCELLATION RPC
CREATE OR REPLACE FUNCTION public.cancel_commerce_order_atomic(
  p_cancel JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order_id UUID;
  v_actor_type TEXT;
  v_actor_id TEXT;
  v_reason TEXT;
  v_order_record RECORD;
BEGIN
  v_order_id := (p_cancel->>'order_id')::uuid;
  v_actor_type := COALESCE(p_cancel->>'actor_type', 'admin');
  v_actor_id := p_cancel->>'actor_id';
  v_reason := p_cancel->>'reason';

  -- 1. Sipariş kilitle ve kontrol et
  SELECT * INTO v_order_record
  FROM public.orders
  WHERE id = v_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  -- 2. İdempotency: Zaten iptal edilmişse no-op 200 döner
  IF v_order_record.status = 'CANCELLED' THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_cancelled', true,
      'order_id', v_order_id,
      'status', 'CANCELLED'
    );
  END IF;

  -- 3. Geçerli iptal durumu kontrolü: Yalnızca PENDING_PAYMENT veya PAYMENT_FAILED iptal edilebilir
  IF v_order_record.status NOT IN ('PENDING_PAYMENT', 'PAYMENT_FAILED') THEN
    RAISE EXCEPTION 'ORDER_NOT_CANCELLABLE' USING ERRCODE = 'P0004';
  END IF;

  -- 4. Sipariş durumunu güncelle
  UPDATE public.orders
  SET 
    status = 'CANCELLED',
    updated_at = NOW()
  WHERE id = v_order_id;

  -- 5. Audit Trail kaydı oluştur
  INSERT INTO public.commerce_order_events (
    order_id,
    event_type,
    actor_type,
    actor_id,
    metadata
  ) VALUES (
    v_order_id,
    'ORDER_CANCELLED',
    v_actor_type,
    v_actor_id,
    jsonb_strip_nulls(jsonb_build_object(
      'previous_status', v_order_record.status,
      'reason', v_reason
    ))
  );

  RETURN jsonb_build_object(
    'success', true,
    'already_cancelled', false,
    'order_id', v_order_id,
    'status', 'CANCELLED'
  );
END;
$$;

-- 5. ATOMIC ORDER REFUND RPC
CREATE OR REPLACE FUNCTION public.process_order_refund_atomic(
  p_refund JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order_id UUID;
  v_payment_tx_id UUID;
  v_idempotency_key TEXT;
  v_refund_amount NUMERIC(12,2);
  v_reason TEXT;
  v_actor_type TEXT;
  v_actor_id TEXT;
  v_provider TEXT;
  v_provider_refund_id TEXT;
  v_order_record RECORD;
  v_existing_refund RECORD;
  v_already_refunded NUMERIC(12,2);
  v_remaining_refundable NUMERIC(12,2);
  v_new_order_status TEXT;
  v_refund_id UUID;
  v_req_fingerprint TEXT;
BEGIN
  v_order_id := (p_refund->>'order_id')::uuid;
  v_idempotency_key := NULLIF(TRIM(p_refund->>'idempotency_key'), '');
  v_refund_amount := ROUND((p_refund->>'amount')::numeric, 2);
  v_reason := TRIM(COALESCE(p_refund->>'reason', ''));
  v_actor_type := COALESCE(p_refund->>'actor_type', 'admin');
  v_actor_id := p_refund->>'actor_id';
  v_provider := COALESCE(p_refund->>'provider', 'mock');
  v_provider_refund_id := p_refund->>'provider_refund_id';

  IF v_refund_amount <= 0 THEN
    RAISE EXCEPTION 'REFUND_AMOUNT_INVALID' USING ERRCODE = 'P0006';
  END IF;

  -- 1. Sipariş kilitle (Row-level lock prevents race conditions)
  SELECT * INTO v_order_record
  FROM public.orders
  WHERE id = v_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND' USING ERRCODE = 'P0002';
  END IF;

  -- 2. Sipariş durum kontrolü: Yalnızca PAID veya PARTIALLY_REFUNDED iade edilebilir
  IF v_order_record.status NOT IN ('PAID', 'PARTIALLY_REFUNDED') THEN
    RAISE EXCEPTION 'REFUND_NOT_ALLOWED' USING ERRCODE = 'P0007';
  END IF;

  -- 3. Idempotency kontrolü
  IF v_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_existing_refund
    FROM public.refunds
    WHERE idempotency_key = v_idempotency_key;

    IF FOUND THEN
      -- Eğer aynı idempotency key farklı sipariş veya tutar ile kullanıldıysa hata fırlat
      IF v_existing_refund.order_id <> v_order_id OR v_existing_refund.amount <> v_refund_amount THEN
        RAISE EXCEPTION 'REFUND_IDEMPOTENCY_KEY_REUSED' USING ERRCODE = 'P0001';
      END IF;

      -- Mevcut kalan tutarı hesapla
      SELECT COALESCE(SUM(amount), 0) INTO v_already_refunded
      FROM public.refunds
      WHERE order_id = v_order_id AND status = 'SUCCESS';

      v_remaining_refundable := GREATEST(0, v_order_record.grand_total - v_already_refunded);

      RETURN jsonb_build_object(
        'success', true,
        'is_existing', true,
        'refund_id', v_existing_refund.id,
        'order_id', v_order_id,
        'amount', v_existing_refund.amount,
        'currency', v_existing_refund.currency,
        'status', v_existing_refund.status,
        'reason', v_existing_refund.reason,
        'order_status', v_order_record.status,
        'remaining_refundable', v_remaining_refundable,
        'created_at', v_existing_refund.created_at
      );
    END IF;
  END IF;

  -- 4. Daha önce yapılan başarılı iadeleri topla
  SELECT COALESCE(SUM(amount), 0) INTO v_already_refunded
  FROM public.refunds
  WHERE order_id = v_order_id AND status = 'SUCCESS';

  v_remaining_refundable := v_order_record.grand_total - v_already_refunded;

  -- 5. Over-refund kontrolü (Minor unit karşılaştırması)
  IF (ROUND(v_refund_amount * 100)) > (ROUND(v_remaining_refundable * 100)) THEN
    RAISE EXCEPTION 'REFUND_AMOUNT_EXCEEDS_REMAINING' USING ERRCODE = 'P0008';
  END IF;

  -- 6. En son başarılı ödeme işlemini bul
  SELECT id INTO v_payment_tx_id
  FROM public.payment_transactions
  WHERE order_id = v_order_id AND status IN ('SUCCESS', 'PAID')
  ORDER BY created_at DESC
  LIMIT 1;

  -- 7. Refund kaydı ekle
  INSERT INTO public.refunds (
    order_id,
    payment_transaction_id,
    idempotency_key,
    amount,
    currency,
    reason,
    status,
    provider,
    provider_refund_id,
    metadata
  ) VALUES (
    v_order_id,
    v_payment_tx_id,
    v_idempotency_key,
    v_refund_amount,
    v_order_record.currency,
    v_reason,
    'SUCCESS',
    v_provider,
    v_provider_refund_id,
    jsonb_strip_nulls(jsonb_build_object(
      'actor_type', v_actor_type,
      'actor_id', v_actor_id
    ))
  )
  RETURNING id INTO v_refund_id;

  -- 8. Yeni kalan tutara göre sipariş durumunu belirle
  v_remaining_refundable := v_remaining_refundable - v_refund_amount;

  IF (ROUND(v_remaining_refundable * 100)) <= 0 THEN
    v_new_order_status := 'REFUNDED';
  ELSE
    v_new_order_status := 'PARTIALLY_REFUNDED';
  END IF;

  -- 9. Sipariş durumunu güncelle
  UPDATE public.orders
  SET 
    status = v_new_order_status,
    payment_status = v_new_order_status,
    updated_at = NOW()
  WHERE id = v_order_id;

  -- 10. Audit Trail kaydı ekle
  INSERT INTO public.commerce_order_events (
    order_id,
    event_type,
    actor_type,
    actor_id,
    metadata
  ) VALUES (
    v_order_id,
    'REFUND_SUCCEEDED',
    v_actor_type,
    v_actor_id,
    jsonb_strip_nulls(jsonb_build_object(
      'refund_id', v_refund_id,
      'amount', v_refund_amount,
      'currency', v_order_record.currency,
      'remaining_refundable', v_remaining_refundable,
      'new_order_status', v_new_order_status,
      'reason', v_reason
    ))
  );

  RETURN jsonb_build_object(
    'success', true,
    'is_existing', false,
    'refund_id', v_refund_id,
    'order_id', v_order_id,
    'amount', v_refund_amount,
    'currency', v_order_record.currency,
    'status', 'SUCCESS',
    'reason', v_reason,
    'order_status', v_new_order_status,
    'remaining_refundable', v_remaining_refundable,
    'created_at', NOW()
  );
END;
$$;
