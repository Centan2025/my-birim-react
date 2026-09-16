-- ============================================================
-- BİRİM WEB COMMERCE — PHASE 1: DATABASE SCHEMA & RLS POLICIES
-- Target: Supabase PostgreSQL (Foundation)
-- ============================================================

-- 1. ORDERS TABLOSU
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'PENDING_PAYMENT' CHECK (
    status IN (
      'PENDING_PAYMENT',
      'PAID',
      'PAYMENT_FAILED',
      'CANCELLED',
      'REFUNDED',
      'PARTIALLY_REFUNDED'
    )
  ),
  payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (
    payment_status IN (
      'PENDING',
      'AUTHORIZED',
      'PAID',
      'FAILED',
      'REFUNDED',
      'PARTIALLY_REFUNDED'
    )
  ),
  currency TEXT NOT NULL DEFAULT 'TRY' CHECK (currency IN ('TRY', 'USD', 'EUR')),
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  discount_total NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (discount_total >= 0),
  shipping_total NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (shipping_total >= 0),
  tax_total NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (tax_total >= 0),
  grand_total NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (grand_total >= 0),
  billing_address_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  shipping_address_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ORDER ITEMS TABLOSU (Sipariş Kalemleri Snapshot Modeli)
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT NOT NULL,
  variant_id TEXT,
  product_name_snapshot TEXT NOT NULL,
  sku_snapshot TEXT,
  selected_options_snapshot JSONB DEFAULT '{}'::jsonb,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  total_price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_price >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PAYMENT TRANSACTIONS TABLOSU (Ödeme İşlem Kayıtları)
-- GÜVENLİK NOTU: Kart numarası, CVV veya son kullanma tarihi KESİNLİKLE saklanmaz.
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('iyzico', 'paytr', 'test')),
  provider_payment_id TEXT,
  provider_transaction_id TEXT,
  provider_token TEXT,
  conversation_id TEXT,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'TRY' CHECK (currency IN ('TRY', 'USD', 'EUR')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (
    status IN (
      'PENDING',
      'PROCESSING',
      'SUCCESS',
      'FAILED',
      'CANCELLED',
      'REFUNDED',
      'PARTIALLY_REFUNDED'
    )
  ),
  installment INTEGER DEFAULT 1 CHECK (installment >= 1),
  error_code TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. İNDEKS TANIMLARI
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON public.payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider_tx ON public.payment_transactions(provider_transaction_id);

-- 5. UPDATED_AT TETİKLEYİCİLERİ (Geriye Dönük Uyumlu Fonksiyon)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_orders_updated ON public.orders;
CREATE TRIGGER on_orders_updated
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS on_payment_transactions_updated ON public.payment_transactions;
CREATE TRIGGER on_payment_transactions_updated
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 6. ROW LEVEL SECURITY (RLS) POLİTİKALARI
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- Orders: Kullanıcılar yalnızca kendi siparişlerini okuyabilir.
-- İstemciden doğrudan INSERT/UPDATE/DELETE izni VERİLMEZ (Sipariş değişiklikleri sadece serverless / service-role tarafından yapılır).
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

-- Order Items: Kullanıcılar yalnızca kendilerine ait siparişin kalemlerini okuyabilir.
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.user_id = auth.uid()
    )
  );

-- Payment Transactions: İstemci tarafı erişimi TAMAMEN KAPALIDIR.
-- Ödeme işlemleri yalnızca sunucu tarafında (service_role) okunur ve yazılır.
-- Bu nedenle public/authenticated için hiçbir SELECT/INSERT/UPDATE/DELETE politikası tanımlanmaz.
