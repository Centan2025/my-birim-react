-- ============================================================
-- BIRIM MOBILYA - SEÇKİM / PROJELERİM & LEAD DATABASE SCHEMA
-- ============================================================

-- 1. USER_SELECTIONS (Kullanıcı Seçkisi)
CREATE TABLE IF NOT EXISTS public.user_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- RLS: user_selections
ALTER TABLE public.user_selections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS Users can view own selections ON public.user_selections;
CREATE POLICY Users can view own selections
  ON public.user_selections FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS Users can insert own selections ON public.user_selections;
CREATE POLICY Users can insert own selections
  ON public.user_selections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS Users can delete own selections ON public.user_selections;
CREATE POLICY Users can delete own selections
  ON public.user_selections FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_selections_user ON public.user_selections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_selections_product ON public.user_selections(product_id);


-- 2. PROJECTS (Kullanıcı Projeleri: Örn. İstanbul Villa, Bodrum Residence)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  share_token TEXT UNIQUE,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS Users can view own projects or public projects ON public.projects;
CREATE POLICY Users can view own projects or public projects
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

DROP POLICY IF EXISTS Users can insert own projects ON public.projects;
CREATE POLICY Users can insert own projects
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS Users can update own projects ON public.projects;
CREATE POLICY Users can update own projects
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS Users can delete own projects ON public.projects;
CREATE POLICY Users can delete own projects
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_projects_user ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_share_token ON public.projects(share_token);


-- 3. PROJECT_PRODUCTS (Projeye Eklenen Ürünler)
CREATE TABLE IF NOT EXISTS public.project_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, product_id)
);

-- RLS: project_products
ALTER TABLE public.project_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS Users can view products of accessible projects ON public.project_products;
CREATE POLICY Users can view products of accessible projects
  ON public.project_products FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_products.project_id
        AND (p.user_id = auth.uid() OR p.is_public = true)
    )
  );

DROP POLICY IF EXISTS Users can insert products into own projects ON public.project_products;
CREATE POLICY Users can insert products into own projects
  ON public.project_products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_products.project_id
        AND p.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS Users can delete products from own projects ON public.project_products;
CREATE POLICY Users can delete products from own projects
  ON public.project_products FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_products.project_id
        AND p.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_project_products_project ON public.project_products(project_id);
CREATE INDEX IF NOT EXISTS idx_project_products_product ON public.project_products(product_id);


-- 4. INQUIRIES (Teklif / Bilgi Talepleri / Leads)
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  project_name TEXT,
  message TEXT,
  selected_products JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'quoting', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: inquiries
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS Anyone can insert inquiries ON public.inquiries;
CREATE POLICY Anyone can insert inquiries
  ON public.inquiries FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS Users can view own inquiries ON public.inquiries;
CREATE POLICY Users can view own inquiries
  ON public.inquiries FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON public.inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_email ON public.inquiries(email);
