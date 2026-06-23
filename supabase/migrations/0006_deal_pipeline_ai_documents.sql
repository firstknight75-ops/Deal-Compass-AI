-- Date: 2026-06-23
-- Author: AI Engineering Assistant
-- Description: Deal pipeline AI health scoring and deal document metadata
-- Rollback: See /docs/runbooks/rollback-0006.md

ALTER TABLE public.deals
  ADD COLUMN IF NOT EXISTS ai_health_score NUMERIC(5,2) CHECK (ai_health_score IS NULL OR (ai_health_score >= 0 AND ai_health_score <= 100)),
  ADD COLUMN IF NOT EXISTS ai_health_explainer_ar TEXT,
  ADD COLUMN IF NOT EXISTS ai_health_scored_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_deals_ai_health_score ON public.deals(user_id, ai_health_score DESC) WHERE ai_health_score IS NOT NULL;

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

CREATE TABLE IF NOT EXISTS public.deal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bucket_id TEXT NOT NULL DEFAULT 'trade-documents',
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0),
  title_ar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_deal_documents_deal_created ON public.deal_documents(deal_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deal_documents_user_created ON public.deal_documents(user_id, created_at DESC);

ALTER TABLE public.deal_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deal_documents_owner_read" ON public.deal_documents;
CREATE POLICY "deal_documents_owner_read"
ON public.deal_documents FOR SELECT TO authenticated
USING (user_id = auth.uid() AND deleted_at IS NULL);

DROP POLICY IF EXISTS "deal_documents_owner_insert" ON public.deal_documents;
CREATE POLICY "deal_documents_owner_insert"
ON public.deal_documents FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND deal_id IN (SELECT id FROM public.deals WHERE user_id = auth.uid())
  AND bucket_id = 'trade-documents'
  AND storage_path LIKE auth.uid()::text || '/%'
);

DROP POLICY IF EXISTS "deal_documents_owner_update" ON public.deal_documents;
CREATE POLICY "deal_documents_owner_update"
ON public.deal_documents FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
