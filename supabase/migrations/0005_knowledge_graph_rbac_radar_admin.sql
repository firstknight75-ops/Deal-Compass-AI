-- Date: 2026-06-23
-- Author: AI Engineering Assistant
-- Description: Knowledge graph company-opportunity edges and admin RBAC for Radar source management
-- Rollback: See /docs/runbooks/rollback-0005.md

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('user', 'verified_user', 'analyst', 'moderator', 'enterprise_admin', 'admin', 'super_admin');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'company_opportunity_relationship') THEN
    CREATE TYPE public.company_opportunity_relationship AS ENUM (
      'posted_by',
      'buyer',
      'seller',
      'supplier',
      'manufacturer',
      'distributor',
      'mentioned_in',
      'recommended_for'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_active ON public.user_roles(user_id, role) WHERE revoked_at IS NULL;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_roles_read_own" ON public.user_roles;
CREATE POLICY "user_roles_read_own"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_roles_super_admin_manage" ON public.user_roles;
CREATE POLICY "user_roles_super_admin_manage"
ON public.user_roles FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'super_admin'
      AND ur.revoked_at IS NULL
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'super_admin'
      AND ur.revoked_at IS NULL
  )
);

CREATE TABLE IF NOT EXISTS public.company_opportunity_edges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  opportunity_kind public.opportunity_kind NOT NULL,
  general_opportunity_id UUID REFERENCES public.general_opportunities(id) ON DELETE CASCADE,
  special_opportunity_id UUID REFERENCES public.special_opportunities(id) ON DELETE CASCADE,
  relationship public.company_opportunity_relationship NOT NULL,
  confidence_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  source TEXT NOT NULL DEFAULT 'system',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT company_opportunity_edges_exactly_one_target CHECK (
    (opportunity_kind = 'general' AND general_opportunity_id IS NOT NULL AND special_opportunity_id IS NULL)
    OR
    (opportunity_kind = 'special' AND general_opportunity_id IS NULL AND special_opportunity_id IS NOT NULL)
  ),
  UNIQUE(company_id, opportunity_kind, general_opportunity_id, special_opportunity_id, relationship)
);

CREATE INDEX IF NOT EXISTS idx_company_edges_company ON public.company_opportunity_edges(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_company_edges_general ON public.company_opportunity_edges(general_opportunity_id) WHERE general_opportunity_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_company_edges_special ON public.company_opportunity_edges(special_opportunity_id) WHERE special_opportunity_id IS NOT NULL;

ALTER TABLE public.company_opportunity_edges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "company_edges_public_read" ON public.company_opportunity_edges;
CREATE POLICY "company_edges_public_read"
ON public.company_opportunity_edges FOR SELECT
USING (true);

DROP POLICY IF EXISTS "company_edges_admin_write" ON public.company_opportunity_edges;
CREATE POLICY "company_edges_admin_write"
ON public.company_opportunity_edges FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'super_admin', 'moderator')
      AND ur.revoked_at IS NULL
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'super_admin', 'moderator')
      AND ur.revoked_at IS NULL
  )
);

DROP POLICY IF EXISTS "radar_sources_admin_insert" ON public.radar_sources;
CREATE POLICY "radar_sources_admin_insert"
ON public.radar_sources FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'super_admin', 'moderator')
      AND ur.revoked_at IS NULL
  )
);

DROP POLICY IF EXISTS "radar_sources_admin_update" ON public.radar_sources;
CREATE POLICY "radar_sources_admin_update"
ON public.radar_sources FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'super_admin', 'moderator')
      AND ur.revoked_at IS NULL
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'super_admin', 'moderator')
      AND ur.revoked_at IS NULL
  )
);
