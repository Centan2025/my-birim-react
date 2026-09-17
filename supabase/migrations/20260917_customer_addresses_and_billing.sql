-- ============================================================
-- BİRİM UNIFIED CUSTOMER ACCOUNT — PHASE 2
-- Migration: Additive Customer Addresses, Billing Profiles & RPCs
-- Target: Supabase PostgreSQL (Public Schema)
-- ============================================================

-- 1. ADDITIVE PROFILE ENHANCEMENT
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS newsletter_subscribed BOOLEAN DEFAULT false;

-- 2. CUSTOMER ADDRESSES TABLE
CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL DEFAULT 'Ev',
  recipient_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'TR',
  is_default_shipping BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partial Unique Index: At most one default shipping address per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_addresses_default_shipping 
  ON public.customer_addresses(user_id) 
  WHERE is_default_shipping = true;

CREATE INDEX IF NOT EXISTS idx_customer_addresses_user_id 
  ON public.customer_addresses(user_id);

-- 3. CUSTOMER BILLING PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.customer_billing_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  billing_type TEXT NOT NULL DEFAULT 'individual' CHECK (billing_type IN ('individual', 'company')),
  label TEXT NOT NULL DEFAULT 'Bireysel Fatura',
  full_name TEXT,
  company_name TEXT,
  tax_office TEXT,
  tax_number TEXT,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  district TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'TR',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partial Unique Index: At most one default billing profile per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_billing_default 
  ON public.customer_billing_profiles(user_id) 
  WHERE is_default = true;

CREATE INDEX IF NOT EXISTS idx_customer_billing_user_id 
  ON public.customer_billing_profiles(user_id);

-- 4. UPDATED_AT TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_customer_address_updated ON public.customer_addresses;
CREATE TRIGGER on_customer_address_updated
  BEFORE UPDATE ON public.customer_addresses
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS on_customer_billing_updated ON public.customer_billing_profiles;
CREATE TRIGGER on_customer_billing_updated
  BEFORE UPDATE ON public.customer_billing_profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 5. ROW LEVEL SECURITY (Defense-in-Depth)
ALTER TABLE public.customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_billing_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own addresses" ON public.customer_addresses;
CREATE POLICY "Users can manage own addresses"
  ON public.customer_addresses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own billing profiles" ON public.customer_billing_profiles;
CREATE POLICY "Users can manage own billing profiles"
  ON public.customer_billing_profiles FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. ATOMIC DEFAULT SWITCHING RPCs
CREATE OR REPLACE FUNCTION public.set_default_customer_address(
  p_user_id UUID,
  p_address_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Validate target record exists and strictly belongs to p_user_id
  IF NOT EXISTS (
    SELECT 1 FROM public.customer_addresses 
    WHERE id = p_address_id AND user_id = p_user_id
  ) THEN
    RETURN FALSE;
  END IF;

  -- Clear previous default for this user
  UPDATE public.customer_addresses 
  SET is_default_shipping = false 
  WHERE user_id = p_user_id AND is_default_shipping = true AND id <> p_address_id;

  -- Set new default
  UPDATE public.customer_addresses 
  SET is_default_shipping = true 
  WHERE user_id = p_user_id AND id = p_address_id;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_default_customer_billing_profile(
  p_user_id UUID,
  p_billing_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Validate target record exists and strictly belongs to p_user_id
  IF NOT EXISTS (
    SELECT 1 FROM public.customer_billing_profiles 
    WHERE id = p_billing_id AND user_id = p_user_id
  ) THEN
    RETURN FALSE;
  END IF;

  -- Clear previous default for this user
  UPDATE public.customer_billing_profiles 
  SET is_default = false 
  WHERE user_id = p_user_id AND is_default = true AND id <> p_billing_id;

  -- Set new default
  UPDATE public.customer_billing_profiles 
  SET is_default = true 
  WHERE user_id = p_user_id AND id = p_billing_id;

  RETURN TRUE;
END;
$$;

-- Revoke public execution to prevent browser/anon abuse; grant exclusively to service_role
REVOKE ALL ON FUNCTION public.set_default_customer_address(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_default_customer_address(UUID, UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_default_customer_address(UUID, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.set_default_customer_address(UUID, UUID) TO service_role;

REVOKE ALL ON FUNCTION public.set_default_customer_billing_profile(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_default_customer_billing_profile(UUID, UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.set_default_customer_billing_profile(UUID, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.set_default_customer_billing_profile(UUID, UUID) TO service_role;
