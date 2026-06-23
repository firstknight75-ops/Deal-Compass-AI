-- Date: 2026-06-23
-- Author: AI Engineering Assistant
-- Description: Arabic-first B2B trade marketplace foundation with separate general and special opportunities
-- Rollback: See /docs/runbooks/rollback-0002.md

-- ============================================================
-- ENUMS
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'opportunity_kind') THEN
    CREATE TYPE public.opportunity_kind AS ENUM ('general', 'special');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'special_opportunity_type') THEN
    CREATE TYPE public.special_opportunity_type AS ENUM (
      'sell_listing',
      'buy_request',
      'service_offer',
      'machinery_listing',
      'wholesale_lot',
      'import_request',
      'export_request',
      'verified_tender'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'general_opportunity_status') THEN
    CREATE TYPE public.general_opportunity_status AS ENUM (
      'discovered',
      'extracted',
      'deduplicated',
      'scored',
      'moderated',
      'published',
      'expired',
      'archived'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'special_opportunity_status') THEN
    CREATE TYPE public.special_opportunity_status AS ENUM (
      'draft',
      'published',
      'negotiating',
      'active',
      'completed',
      'archived'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trust_level') THEN
    CREATE TYPE public.trust_level AS ENUM (
      'level_0_external_unverified',
      'level_1_ai_validated',
      'level_2_source_verified',
      'level_3_user_verified',
      'level_4_trade_verified'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'activity_type') THEN
    CREATE TYPE public.activity_type AS ENUM (
      'created',
      'updated',
      'stage_changed',
      'commented',
      'published',
      'archived',
      'document_uploaded',
      'ai_score_updated'
    );
  END IF;
END $$;

-- ============================================================
-- CATEGORIES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.trade_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID REFERENCES public.trade_categories(id),
  slug TEXT NOT NULL UNIQUE,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  name_tr TEXT,
  name_fa TEXT,
  name_ku TEXT,
  description_ar TEXT,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trade_categories_parent_id ON public.trade_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_trade_categories_active_sort ON public.trade_categories(is_active, sort_order);

ALTER TABLE public.trade_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trade_categories_public_read" ON public.trade_categories;
CREATE POLICY "trade_categories_public_read"
ON public.trade_categories FOR SELECT
USING (is_active = true);

-- ============================================================
-- GENERAL OPPORTUNITIES (FREE, EXTERNAL, READ-ONLY)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.general_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  summary_ar TEXT,
  detected_language TEXT NOT NULL DEFAULT 'ar',
  country TEXT,
  city TEXT,
  category_id UUID REFERENCES public.trade_categories(id),
  source_name TEXT NOT NULL,
  source_url TEXT,
  source_published_at TIMESTAMPTZ,
  confidence_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  risk_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  trust_level public.trust_level NOT NULL DEFAULT 'level_0_external_unverified',
  status public.general_opportunity_status NOT NULL DEFAULT 'discovered',
  extracted_entities JSONB NOT NULL DEFAULT '{}',
  ai_explainer_ar TEXT,
  search_vector TSVECTOR,
  embedding VECTOR(3072),
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_general_opportunities_status_published ON public.general_opportunities(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_general_opportunities_country_city ON public.general_opportunities(country, city);
CREATE INDEX IF NOT EXISTS idx_general_opportunities_category ON public.general_opportunities(category_id);
CREATE INDEX IF NOT EXISTS idx_general_opportunities_expires_at ON public.general_opportunities(expires_at);
CREATE INDEX IF NOT EXISTS idx_general_opportunities_search_vector ON public.general_opportunities USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_general_opportunities_entities ON public.general_opportunities USING GIN(extracted_entities);
CREATE INDEX IF NOT EXISTS idx_general_opportunities_embedding ON public.general_opportunities USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

ALTER TABLE public.general_opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "general_opportunities_public_read_published" ON public.general_opportunities;
CREATE POLICY "general_opportunities_public_read_published"
ON public.general_opportunities FOR SELECT
USING (status = 'published' AND (expires_at IS NULL OR expires_at > NOW()));

-- No authenticated INSERT/UPDATE/DELETE policies: general opportunities are read-only external leads.

-- ============================================================
-- SPECIAL OPPORTUNITIES (PREMIUM, USER-OWNED MARKETPLACE)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.special_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id),
  type public.special_opportunity_type NOT NULL,
  status public.special_opportunity_status NOT NULL DEFAULT 'draft',
  title_ar TEXT NOT NULL,
  title_en TEXT,
  description_ar TEXT NOT NULL,
  description_en TEXT,
  category_id UUID REFERENCES public.trade_categories(id),
  country TEXT,
  city TEXT,
  price_amount NUMERIC(18,2),
  currency TEXT NOT NULL DEFAULT 'USD',
  quantity NUMERIC(18,3),
  unit TEXT,
  incoterm TEXT,
  minimum_order_quantity NUMERIC(18,3),
  available_from DATE,
  expires_at TIMESTAMPTZ,
  trust_level public.trust_level NOT NULL DEFAULT 'level_3_user_verified',
  ai_score NUMERIC(5,2) CHECK (ai_score IS NULL OR (ai_score >= 0 AND ai_score <= 100)),
  ai_explainer_ar TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  search_vector TSVECTOR,
  embedding VECTOR(3072),
  published_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_special_opportunities_owner ON public.special_opportunities(owner_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_special_opportunities_org ON public.special_opportunities(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_special_opportunities_status_published ON public.special_opportunities(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_special_opportunities_type ON public.special_opportunities(type);
CREATE INDEX IF NOT EXISTS idx_special_opportunities_country_city ON public.special_opportunities(country, city);
CREATE INDEX IF NOT EXISTS idx_special_opportunities_category ON public.special_opportunities(category_id);
CREATE INDEX IF NOT EXISTS idx_special_opportunities_search_vector ON public.special_opportunities USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_special_opportunities_embedding ON public.special_opportunities USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

ALTER TABLE public.special_opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "special_opportunities_public_read_published" ON public.special_opportunities;
CREATE POLICY "special_opportunities_public_read_published"
ON public.special_opportunities FOR SELECT
USING (
  status IN ('published', 'negotiating', 'active', 'completed')
  AND deleted_at IS NULL
  AND (expires_at IS NULL OR expires_at > NOW())
);

DROP POLICY IF EXISTS "special_opportunities_owner_read_all" ON public.special_opportunities;
CREATE POLICY "special_opportunities_owner_read_all"
ON public.special_opportunities FOR SELECT TO authenticated
USING (owner_user_id = auth.uid() AND deleted_at IS NULL);

DROP POLICY IF EXISTS "special_opportunities_owner_insert" ON public.special_opportunities;
CREATE POLICY "special_opportunities_owner_insert"
ON public.special_opportunities FOR INSERT TO authenticated
WITH CHECK (owner_user_id = auth.uid());

DROP POLICY IF EXISTS "special_opportunities_owner_update" ON public.special_opportunities;
CREATE POLICY "special_opportunities_owner_update"
ON public.special_opportunities FOR UPDATE TO authenticated
USING (owner_user_id = auth.uid() AND deleted_at IS NULL)
WITH CHECK (owner_user_id = auth.uid());

-- No DELETE policy. Use archive/deleted_at transitions through application logic.

-- ============================================================
-- SAVES / FAVORITES
-- ============================================================

CREATE TABLE IF NOT EXISTS public.saved_general_opportunities (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES public.general_opportunities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, opportunity_id)
);

ALTER TABLE public.saved_general_opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saved_general_own_access" ON public.saved_general_opportunities;
CREATE POLICY "saved_general_own_access"
ON public.saved_general_opportunities FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.favorite_special_opportunities (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES public.special_opportunities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, opportunity_id)
);

ALTER TABLE public.favorite_special_opportunities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "favorite_special_own_access" ON public.favorite_special_opportunities;
CREATE POLICY "favorite_special_own_access"
ON public.favorite_special_opportunities FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================================
-- ACTIVITY TIMELINE AND COMMENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.opportunity_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_kind public.opportunity_kind NOT NULL,
  general_opportunity_id UUID REFERENCES public.general_opportunities(id) ON DELETE CASCADE,
  special_opportunity_id UUID REFERENCES public.special_opportunities(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES auth.users(id),
  activity_type public.activity_type NOT NULL,
  body_ar TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT opportunity_activities_exactly_one_target CHECK (
    (general_opportunity_id IS NOT NULL AND special_opportunity_id IS NULL AND opportunity_kind = 'general')
    OR
    (general_opportunity_id IS NULL AND special_opportunity_id IS NOT NULL AND opportunity_kind = 'special')
  )
);

CREATE INDEX IF NOT EXISTS idx_opportunity_activities_general ON public.opportunity_activities(general_opportunity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opportunity_activities_special ON public.opportunity_activities(special_opportunity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opportunity_activities_actor ON public.opportunity_activities(actor_user_id, created_at DESC);

ALTER TABLE public.opportunity_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activities_general_public_read" ON public.opportunity_activities;
CREATE POLICY "activities_general_public_read"
ON public.opportunity_activities FOR SELECT
USING (
  opportunity_kind = 'general'
  AND general_opportunity_id IN (
    SELECT id FROM public.general_opportunities
    WHERE status = 'published' AND (expires_at IS NULL OR expires_at > NOW())
  )
);

DROP POLICY IF EXISTS "activities_special_related_read" ON public.opportunity_activities;
CREATE POLICY "activities_special_related_read"
ON public.opportunity_activities FOR SELECT TO authenticated
USING (
  opportunity_kind = 'special'
  AND special_opportunity_id IN (
    SELECT id FROM public.special_opportunities
    WHERE owner_user_id = auth.uid()
    OR status IN ('published', 'negotiating', 'active', 'completed')
  )
);

DROP POLICY IF EXISTS "activities_special_owner_insert" ON public.opportunity_activities;
CREATE POLICY "activities_special_owner_insert"
ON public.opportunity_activities FOR INSERT TO authenticated
WITH CHECK (
  opportunity_kind = 'special'
  AND actor_user_id = auth.uid()
  AND special_opportunity_id IN (
    SELECT id FROM public.special_opportunities
    WHERE owner_user_id = auth.uid()
  )
);

-- ============================================================
-- SEARCH VECTOR TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_general_opportunity_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector =
    setweight(to_tsvector('simple', coalesce(NEW.title_ar, NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.summary_ar, NEW.description, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.country, '') || ' ' || coalesce(NEW.city, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_general_opportunity_search_vector ON public.general_opportunities;
CREATE TRIGGER update_general_opportunity_search_vector
  BEFORE INSERT OR UPDATE ON public.general_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.update_general_opportunity_search_vector();

CREATE OR REPLACE FUNCTION public.update_special_opportunity_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector =
    setweight(to_tsvector('simple', coalesce(NEW.title_ar, '') || ' ' || coalesce(NEW.title_en, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.description_ar, '') || ' ' || coalesce(NEW.description_en, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.country, '') || ' ' || coalesce(NEW.city, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_special_opportunity_search_vector ON public.special_opportunities;
CREATE TRIGGER update_special_opportunity_search_vector
  BEFORE INSERT OR UPDATE ON public.special_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.update_special_opportunity_search_vector();

DROP TRIGGER IF EXISTS update_trade_categories_updated_at ON public.trade_categories;
CREATE TRIGGER update_trade_categories_updated_at
  BEFORE UPDATE ON public.trade_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_general_opportunities_updated_at ON public.general_opportunities;
CREATE TRIGGER update_general_opportunities_updated_at
  BEFORE UPDATE ON public.general_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_special_opportunities_updated_at ON public.special_opportunities;
CREATE TRIGGER update_special_opportunities_updated_at
  BEFORE UPDATE ON public.special_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
