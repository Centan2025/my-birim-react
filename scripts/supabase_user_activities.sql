-- ==============================================================================
-- BIRIM WEB - KULLANICI AKTİVİTE & ANALİTİK TABLOSU
-- Supabase Dashboard SQL Editor'de (https://supabase.com/dashboard/project/rkmpfxervwqleibhbiqv/sql/new) çalıştırınız.
-- ==============================================================================

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

-- Hızlı Analitik & Filtreleme İndeksleri
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON public.user_activities (user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON public.user_activities (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON public.user_activities (activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_session ON public.user_activities (session_id);

-- Row Level Security (RLS)
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar kendi aktivitelerini ekleyebilir
CREATE POLICY "Users can insert own activities"
  ON public.user_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Kullanıcılar kendi aktivitelerini görebilir
CREATE POLICY "Users can view own activities"
  ON public.user_activities FOR SELECT
  USING (auth.uid() = user_id);
