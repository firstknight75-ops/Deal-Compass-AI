-- Marketplace RLS Contract Tests
-- These SQL assertions are intended for Supabase database test execution after migrations are applied.
-- They are not executed by npm test.

BEGIN;

-- General opportunities must not expose authenticated user write policies.
SELECT CASE
  WHEN EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'general_opportunities'
      AND roles::text LIKE '%authenticated%'
      AND (cmd = 'INSERT' OR cmd = 'UPDATE' OR cmd = 'DELETE' OR cmd = 'ALL')
  )
  THEN raise_exception('general_opportunities must remain read-only for authenticated users')
  ELSE true
END;

-- Special opportunities must not allow physical DELETE through RLS.
SELECT CASE
  WHEN EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'special_opportunities'
      AND (cmd = 'DELETE' OR cmd = 'ALL')
  )
  THEN raise_exception('special_opportunities must not expose DELETE policies')
  ELSE true
END;

-- Document metadata must be protected by RLS.
SELECT CASE
  WHEN NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = 'opportunity_documents'
      AND c.relrowsecurity = true
  )
  THEN raise_exception('opportunity_documents must have RLS enabled')
  ELSE true
END;

ROLLBACK;
