-- ============================================================
-- BIRIM WEB - SUPABASE DATABASE SCHEMA & RLS POLICIES
-- Proje: https://supabase.com/dashboard/project/rkmpfxervwqleibhbiqv
-- ============================================================

-- 1. PROFILES TABLOSU (auth.users ile 1-e-1 ilişkili)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'architect', 'admin')),
  company TEXT,
  profession TEXT,
  phone TEXT,
  tax_id TEXT,
  architect_verification_status TEXT DEFAULT 'none' CHECK (architect_verification_status IN ('none', 'pending', 'approved', 'rejected')),
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RLS (ROW LEVEL SECURITY) ETKİNLEŞTİRME
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Kendi profilini okuma kuralı
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Kendi profilini güncelleme kuralı
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Onaylı mimarları herkese açık kılma (Mimar vitrini / rehberi için)
CREATE POLICY "Public can view approved architects"
  ON public.profiles FOR SELECT
  USING (role = 'architect' AND architect_verification_status = 'approved');

-- 3. YENİ KULLANICI KAYDOLDUĞUNDA OTOMATİK PROFİL OLUŞTURMA TETİKLEYİCİSİ (TRIGGER)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, first_name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. FAVORİLER TABLOSU (Kullanıcı ürün beğenileri)
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);

-- 5. GÜNCELLEME ZAMANI TETİKLEYİCİSİ
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 6. KULLANICI AKTİVİTE & ANALİTİK TABLOSU (Sayfa kalma süresi, ziyaretler, indirmeler)
CREATE TABLE IF NOT EXISTS public.user_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_email TEXT,
  session_id TEXT NOT NULL,
  activity_type TEXT NOT NULL, -- 'session_start', 'page_view', 'page_dwell', 'download', 'session_end'
  page_url TEXT,
  page_title TEXT,
  duration_seconds INTEGER DEFAULT 0,
  download_file_name TEXT,
  download_file_type TEXT,
  platform TEXT, -- 'Desktop', 'Mobile', 'Tablet'
  os TEXT,       -- 'Windows', 'macOS', 'iOS', 'Android', 'Linux'
  browser TEXT,  -- 'Chrome', 'Safari', 'Firefox', 'Edge', etc.
  referrer TEXT,
  ip_address TEXT,
  city TEXT,
  country TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hızlı Analitik & Sorgu İndeksleri
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON public.user_activities (user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON public.user_activities (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON public.user_activities (activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_session ON public.user_activities (session_id);

-- RLS (Row Level Security)
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar kendi aktivitelerini ekleyebilir
CREATE POLICY "Users can insert own activities"
  ON public.user_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Kullanıcılar kendi aktivitelerini görebilir
CREATE POLICY "Users can view own activities"
  ON public.user_activities FOR SELECT
  USING (auth.uid() = user_id);

-- Hizmet anahtarı (Service Role / Admin) tüm aktiviteleri okuyabilir ve analiz edebilir
-- Not: Supabase service_role key zaten RLS'i bypass eder.
