# Rollback Runbook — 0004 Documents, Company Intelligence, Recommendations, Radar Registry

Date: 2026-06-23

## Production Rollback Strategy

Do not drop these tables in production after data exists. Disable UI/routes/workers first and preserve data.

## Safer Rollback

- Hide document upload UI.
- Disable company intelligence and recommendation UI routes.
- Deactivate Radar sources with `is_active = false`.
- Preserve `storage.objects` and metadata for audit review.

## Destructive Non-Production Rollback

```sql
DROP TABLE IF EXISTS public.radar_raw_documents;
DROP TABLE IF EXISTS public.radar_sources;
DROP TABLE IF EXISTS public.recommendations;
DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
DROP TRIGGER IF EXISTS update_company_search_vector ON public.companies;
DROP FUNCTION IF EXISTS public.update_company_search_vector();
DROP TABLE IF EXISTS public.companies;
DROP TABLE IF EXISTS public.opportunity_documents;
DELETE FROM storage.objects WHERE bucket_id = 'trade-documents';
DELETE FROM storage.buckets WHERE id = 'trade-documents';
```

Only use in non-production or with DBA approval.
