-- ==============================================================================
-- BİRİM SHOP — ZERO-PII ANALYTICS EVENTS MIGRATION
-- Status: MIGRATION REQUIRED (DO NOT RUN AUTOMATICALLY ON PRODUCTION)
--
-- Privacy & Compliance:
-- 1. Strictly ZERO-PII: No customer names, emails, phones, addresses, IP addresses, or auth tokens.
-- 2. Non-Authoritative Price: The `price` column is purely informational for client engagement analytics.
--    Authoritative revenue, order totals, and financial metrics MUST ALWAYS be computed
--    from `commerce_orders` / `commerce_order_items`.
-- 3. Row-Level Security: Enabled by default. No public/anon direct write access.
--    Ingestion happens via authenticated server API using service role.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.shop_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  product_id TEXT,
  slug TEXT,
  category_slug TEXT,
  variant_id TEXT,
  currency TEXT,
  price NUMERIC, -- Non-authoritative informational field only
  quantity INTEGER,
  source TEXT,
  session_id TEXT, -- Anonymous memory-only session UUID (no PII)
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performant aggregation by date range, product, and event type
CREATE INDEX IF NOT EXISTS idx_shop_events_created_at ON public.shop_analytics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shop_events_product_id ON public.shop_analytics_events (product_id);
CREATE INDEX IF NOT EXISTS idx_shop_events_event_name ON public.shop_analytics_events (event_name);
CREATE INDEX IF NOT EXISTS idx_shop_events_name_created ON public.shop_analytics_events (event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shop_events_product_name ON public.shop_analytics_events (product_id, event_name);

-- Row Level Security (RLS)
ALTER TABLE public.shop_analytics_events ENABLE ROW LEVEL SECURITY;

-- Note: No public INSERT or SELECT policies are granted to anon/public roles.
-- Ingestion is executed exclusively through the backend API using getSafeSupabaseAdmin (service role).
