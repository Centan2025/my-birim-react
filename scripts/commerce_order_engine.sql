-- ============================================================
-- BİRİM WEB COMMERCE — PHASE 5: ORDER ENGINE & INITIALIZATION
-- Target: Supabase PostgreSQL (Atomic Order Engine, Scoped Idempotency & Concurrency Safety)
-- ============================================================

-- 1. ORDERS TABLOSUNA EKLENEN KOLONLAR VE İNDEKSLER
ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS customer_type TEXT DEFAULT 'INDIVIDUAL' CHECK (customer_type IN ('INDIVIDUAL', 'CORPORATE')),
  ADD COLUMN IF NOT EXISTS customer_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_email TEXT,
  ADD COLUMN IF NOT EXISTS customer_phone TEXT,
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS request_fingerprint TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Scoped Idempotency key benzersizlik indeksi
-- Format: 'auth:<user_id>:<key>' veya 'guest:<email>:<key>'
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_idempotency_key 
  ON public.orders(idempotency_key) 
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_customer_email 
  ON public.orders(customer_email);

-- 2. ATOMIC ORDER CREATION RPC (PostgreSQL Transactional Stored Procedure)
-- Sipariş (orders) ve sipariş kalemleri (order_items) tek bir transaction (BEGIN ... COMMIT) içinde atomik olarak yazılır.
-- Eşzamanlı (concurrent) aynı key ile gelen isteklerde race-condition'a karşı EXCEPTION WHEN unique_violation koruması içerir.
CREATE OR REPLACE FUNCTION public.create_commerce_order_atomic(
  p_order JSONB,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order_id UUID;
  v_order_record RECORD;
  v_item JSONB;
  v_idempotency_key TEXT;
  v_request_fingerprint TEXT;
BEGIN
  v_idempotency_key := NULLIF(TRIM(p_order->>'idempotency_key'), '');
  v_request_fingerprint := NULLIF(TRIM(p_order->>'request_fingerprint'), '');

  -- 1. Ön Idempotency Kontrolü (Hızlı okuma)
  IF v_idempotency_key IS NOT NULL THEN
    SELECT * INTO v_order_record
    FROM public.orders
    WHERE idempotency_key = v_idempotency_key;
    
    IF FOUND THEN
      -- Eğer aynı idempotency key farklı istek parmak iziyle kullanılmışsa 409 Conflict oluştur
      IF v_order_record.request_fingerprint IS NOT NULL AND 
         v_order_record.request_fingerprint <> v_request_fingerprint THEN
        RAISE EXCEPTION 'IDEMPOTENCY_KEY_REUSED' USING ERRCODE = 'P0001';
      END IF;
      
      -- Aynı istek tekrarlandıysa mevcut siparişi döndür (Replay)
      RETURN jsonb_build_object(
        'is_existing', true,
        'order_id', v_order_record.id,
        'order_number', v_order_record.order_number,
        'status', v_order_record.status,
        'payment_status', v_order_record.payment_status,
        'currency', v_order_record.currency,
        'subtotal', v_order_record.subtotal,
        'discount_total', v_order_record.discount_total,
        'shipping_total', v_order_record.shipping_total,
        'tax_total', v_order_record.tax_total,
        'grand_total', v_order_record.grand_total,
        'created_at', v_order_record.created_at
      );
    END IF;
  END IF;

  -- 2. Orders Tablosuna INSERT (Eşzamanlı race condition korumalı)
  BEGIN
    INSERT INTO public.orders (
      order_number,
      user_id,
      status,
      payment_status,
      currency,
      subtotal,
      discount_total,
      shipping_total,
      tax_total,
      grand_total,
      customer_type,
      customer_name,
      customer_email,
      customer_phone,
      billing_address_snapshot,
      shipping_address_snapshot,
      idempotency_key,
      request_fingerprint,
      notes
    ) VALUES (
      p_order->>'order_number',
      CASE WHEN (p_order->>'user_id') IS NOT NULL AND (p_order->>'user_id') <> '' THEN (p_order->>'user_id')::uuid ELSE NULL END,
      COALESCE(p_order->>'status', 'PENDING_PAYMENT'),
      COALESCE(p_order->>'payment_status', 'PENDING'),
      COALESCE(p_order->>'currency', 'TRY'),
      ROUND((p_order->>'subtotal')::numeric, 2),
      COALESCE(ROUND((p_order->>'discount_total')::numeric, 2), 0),
      COALESCE(ROUND((p_order->>'shipping_total')::numeric, 2), 0),
      COALESCE(ROUND((p_order->>'tax_total')::numeric, 2), 0),
      ROUND((p_order->>'grand_total')::numeric, 2),
      COALESCE(p_order->>'customer_type', 'INDIVIDUAL'),
      p_order->>'customer_name',
      p_order->>'customer_email',
      p_order->>'customer_phone',
      COALESCE(p_order->'billing_address_snapshot', '{}'::jsonb),
      COALESCE(p_order->'shipping_address_snapshot', '{}'::jsonb),
      v_idempotency_key,
      v_request_fingerprint,
      p_order->>'notes'
    )
    RETURNING id INTO v_order_id;
  EXCEPTION
    WHEN unique_violation THEN
      -- İki istek tam aynı anda geldiğinde (race condition), ilk INSERT başarılı olmuşsa
      -- ikinci istek unique index ihlali alır. Bu durumda mevcut kaydı çekip replay yapıyoruz.
      IF v_idempotency_key IS NOT NULL THEN
        SELECT * INTO v_order_record
        FROM public.orders
        WHERE idempotency_key = v_idempotency_key;
        
        IF FOUND THEN
          IF v_order_record.request_fingerprint IS NOT NULL AND 
             v_order_record.request_fingerprint <> v_request_fingerprint THEN
            RAISE EXCEPTION 'IDEMPOTENCY_KEY_REUSED' USING ERRCODE = 'P0001';
          END IF;
          
          RETURN jsonb_build_object(
            'is_existing', true,
            'order_id', v_order_record.id,
            'order_number', v_order_record.order_number,
            'status', v_order_record.status,
            'payment_status', v_order_record.payment_status,
            'currency', v_order_record.currency,
            'subtotal', v_order_record.subtotal,
            'discount_total', v_order_record.discount_total,
            'shipping_total', v_order_record.shipping_total,
            'tax_total', v_order_record.tax_total,
            'grand_total', v_order_record.grand_total,
            'created_at', v_order_record.created_at
          );
        END IF;
      END IF;
      RAISE;
  END;

  -- 3. Order Items Tablosuna Toplu INSERT (Her kalem doğrulanmış snapshot verisidir)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.order_items (
      order_id,
      product_id,
      variant_id,
      product_name_snapshot,
      sku_snapshot,
      selected_options_snapshot,
      quantity,
      unit_price,
      total_price
    ) VALUES (
      v_order_id,
      v_item->>'product_id',
      v_item->>'variant_id',
      v_item->>'product_name_snapshot',
      v_item->>'sku_snapshot',
      COALESCE(v_item->'selected_options_snapshot', '{}'::jsonb),
      (v_item->>'quantity')::integer,
      ROUND((v_item->>'unit_price')::numeric, 2),
      ROUND((v_item->>'total_price')::numeric, 2)
    );
  END LOOP;

  -- 4. Başarılı Sonuç Döndürme
  RETURN jsonb_build_object(
    'is_existing', false,
    'order_id', v_order_id,
    'order_number', p_order->>'order_number',
    'status', COALESCE(p_order->>'status', 'PENDING_PAYMENT'),
    'payment_status', COALESCE(p_order->>'payment_status', 'PENDING'),
    'currency', COALESCE(p_order->>'currency', 'TRY'),
    'subtotal', ROUND((p_order->>'subtotal')::numeric, 2),
    'discount_total', COALESCE(ROUND((p_order->>'discount_total')::numeric, 2), 0),
    'shipping_total', COALESCE(ROUND((p_order->>'shipping_total')::numeric, 2), 0),
    'tax_total', COALESCE(ROUND((p_order->>'tax_total')::numeric, 2), 0),
    'grand_total', ROUND((p_order->>'grand_total')::numeric, 2),
    'created_at', NOW()
  );
END;
$$;
