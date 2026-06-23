-- Date: 2026-06-23
-- Author: AI Engineering Assistant
-- Description: Supabase Storage document metadata, company intelligence, recommendations, and Opportunity Radar registry foundation
-- Rollback: See /docs/runbooks/rollback-0004.md

-- ============================================================
-- STORAGE BUCKET
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'trade-documents',
  'trade-documents',
  false,
  26214400,
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 26214400,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "trade_documents_authenticated_insert_own_prefix" ON storage.objects;
CREATE POLICY "trade_documents_authenticated_insert_own_prefix"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'trade-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "trade_documents_authenticated_read_own_prefix" ON storage.objects;
CREATE POLICY "trade_documents_authenticated_read_own_prefix"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'trade-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "trade_documents_authenticated_delete_own_prefix" ON storage.objects;
CREATE POLICY "trade_documents_authenticated_delete_own_prefix"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'trade-documents'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================
-- OPPORTUNITY DOCUMENT METADATA
-- ============================================================

CREATE TABLE IF NOT EXISTS public.opportunity_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_kind public.opportunity_kind NOT NULL,
  general_opportunity_id UUID REFERENCES public.general_opportunities(id) ON DELETE CASCADE,
  special_opportunity_id UUID REFERENCES public.special_opportunities(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES auth.users(id),
  bucket_id TEXT NOT NULL DEFAULT 'trade-documents',
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0),
  document_type TEXT NOT NULL DEFAULT 'attachment',
  title_ar TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT opportunity_documents_exactly_one_target CHECK (
    (general_opportunity_id IS NOT NULL AND special_opportunity_id IS NULL AND opportunity_kind = 'general')
    OR
    (general_opportunity_id IS NULL AND special_opportunity_id IS NOT NULL AND opportunity_kind = 'special')
  )
);

CREATE INDEX IF NOT EXISTS idx_opportunity_documents_special ON public.opportunity_documents(special_opportunity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opportunity_documents_general ON public.opportunity_documents(general_opportunity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opportunity_documents_uploaded_by ON public.opportunity_documents(uploaded_by, created_at DESC);

ALTER TABLE public.opportunity_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "opportunity_documents_special_owner_read" ON public.opportunity_documents;
CREATE POLICY "opportunity_documents_special_owner_read"
ON public.opportunity_documents FOR SELECT TO authenticated
USING (
  opportunity_kind = 'special'
  AND deleted_at IS NULL
  AND special_opportunity_id IN (
    SELECT id FROM public.special_opportunities
    WHERE owner_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "opportunity_documents_special_owner_insert" ON public.opportunity_documents;
CREATE POLICY "opportunity_documents_special_owner_insert"
ON public.opportunity_documents FOR INSERT TO authenticated
WITH CHECK (
  opportunity_kind = 'special'
  AND uploaded_by = auth.uid()
  AND special_opportunity_id IN (
    SELECT id FROM public.special_opportunities
    WHERE owner_user_id = auth.uid()
  )
  AND bucket_id = 'trade-documents'
  AND storage_path LIKE auth.uid()::text || '/%'
);

DROP POLICY IF EXISTS "opportunity_documents_special_owner_soft_delete" ON public.opportunity_documents;
CREATE POLICY "opportunity_documents_special_owner_soft_delete"
ON public.opportunity_documents FOR UPDATE TO authenticated
USING (
  opportunity_kind = 'special'
  AND uploaded_by = auth.uid()
  AND special_opportunity_id IN (
    SELECT id FROM public.special_opportunities
    WHERE owner_user_id = auth.uid()
  )
)
WITH CHECK (deleted_at IS NOT NULL);

-- ============================================================
-- COMPANY INTELLIGENCE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_ar TEXT,
  country TEXT,
  city TEXT,
  website_url TEXT,
  industry TEXT,
  description_ar TEXT,
  trust_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (trust_score >= 0 AND trust_score <= 100),
  risk_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  trust_level public.trust_level NOT NULL DEFAULT 'level_0_external_unverified',
  website_verified_at TIMESTAMPTZ,
  import_export_summary JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  search_vector TSVECTOR,
  embedding VECTOR(3072),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_companies_country_city ON public.companies(country, city);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON public.companies(industry);
CREATE INDEX IF NOT EXISTS idx_companies_trust_score ON public.companies(trust_score DESC);
CREATE INDEX IF NOT EXISTS idx_companies_search_vector ON public.companies USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_companies_embedding ON public.companies USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "companies_public_read_active" ON public.companies;
CREATE POLICY "companies_public_read_active"
ON public.companies FOR SELECT
USING (deleted_at IS NULL);

CREATE OR REPLACE FUNCTION public.update_company_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector =
    setweight(to_tsvector('simple', coalesce(NEW.name_ar, NEW.name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.description_ar, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.country, '') || ' ' || coalesce(NEW.city, '') || ' ' || coalesce(NEW.industry, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_company_search_vector ON public.companies;
CREATE TRIGGER update_company_search_vector
  BEFORE INSERT OR UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_company_search_vector();

DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- RECOMMENDATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id),
  target_kind TEXT NOT NULL CHECK (target_kind IN ('general_opportunity', 'special_opportunity', 'company')),
  general_opportunity_id UUID REFERENCES public.general_opportunities(id) ON DELETE CASCADE,
  special_opportunity_id UUID REFERENCES public.special_opportunities(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  score NUMERIC(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  reason_ar TEXT NOT NULL,
  recommendation_type TEXT NOT NULL DEFAULT 'related',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  dismissed_at TIMESTAMPTZ,
  CONSTRAINT recommendations_exactly_one_target CHECK (
    (target_kind = 'general_opportunity' AND general_opportunity_id IS NOT NULL AND special_opportunity_id IS NULL AND company_id IS NULL)
    OR
    (target_kind = 'special_opportunity' AND general_opportunity_id IS NULL AND special_opportunity_id IS NOT NULL AND company_id IS NULL)
    OR
    (target_kind = 'company' AND general_opportunity_id IS NULL AND special_opportunity_id IS NULL AND company_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_recommendations_user_score ON public.recommendations(user_id, score DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_org_score ON public.recommendations(organization_id, score DESC, created_at DESC);

ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recommendations_own_user_read" ON public.recommendations;
CREATE POLICY "recommendations_own_user_read"
ON public.recommendations FOR SELECT TO authenticated
USING (user_id = auth.uid() AND dismissed_at IS NULL);

DROP POLICY IF EXISTS "recommendations_own_user_update" ON public.recommendations;
CREATE POLICY "recommendations_own_user_update"
ON public.recommendations FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================================
-- OPPORTUNITY RADAR SOURCE REGISTRY (NO WORKERS YET)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.radar_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('public_website', 'government_tender', 'rss', 'supplier_website', 'business_directory', 'public_telegram', 'partner_feed', 'admin_upload')),
  base_url TEXT,
  country TEXT,
  language TEXT NOT NULL DEFAULT 'ar',
  is_active BOOLEAN NOT NULL DEFAULT false,
  crawl_policy JSONB NOT NULL DEFAULT '{}',
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_radar_sources_active_type ON public.radar_sources(is_active, source_type);
CREATE INDEX IF NOT EXISTS idx_radar_sources_country ON public.radar_sources(country);

ALTER TABLE public.radar_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "radar_sources_authenticated_read" ON public.radar_sources;
CREATE POLICY "radar_sources_authenticated_read"
ON public.radar_sources FOR SELECT TO authenticated
USING (true);

CREATE TABLE IF NOT EXISTS public.radar_raw_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id UUID NOT NULL REFERENCES public.radar_sources(id) ON DELETE CASCADE,
  source_url TEXT,
  content_hash TEXT NOT NULL,
  title TEXT,
  raw_text TEXT NOT NULL,
  detected_language TEXT,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  UNIQUE(source_id, content_hash)
);

CREATE INDEX IF NOT EXISTS idx_radar_raw_documents_source ON public.radar_raw_documents(source_id, fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_radar_raw_documents_processed ON public.radar_raw_documents(processed_at) WHERE processed_at IS NULL;

ALTER TABLE public.radar_raw_documents ENABLE ROW LEVEL SECURITY;

-- No authenticated write policy. Radar ingestion requires service role or future confirmed worker provider.
