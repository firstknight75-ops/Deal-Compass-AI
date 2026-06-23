# Rollback Runbook — 0002 Trade Marketplace Foundation

Date: 2026-06-23

## Scope

Migration: `supabase/migrations/0002_trade_marketplace_foundation.sql`

## Production Rollback Strategy

Do not drop marketplace tables in production after data has been written. Prefer disabling application routes/features and preserving data for forensic review.

## Safer Rollback

1. Disable marketplace feature flags or routes.
2. Stop workers that write general opportunities.
3. Revoke application write paths for special opportunities if needed.
4. Preserve tables and data.
5. Patch RLS policies only if access behavior is the cause.

## Destructive Rollback for Non-Production Only

```sql
DROP TRIGGER IF EXISTS update_special_opportunities_updated_at ON public.special_opportunities;
DROP TRIGGER IF EXISTS update_general_opportunities_updated_at ON public.general_opportunities;
DROP TRIGGER IF EXISTS update_trade_categories_updated_at ON public.trade_categories;
DROP TRIGGER IF EXISTS update_special_opportunity_search_vector ON public.special_opportunities;
DROP TRIGGER IF EXISTS update_general_opportunity_search_vector ON public.general_opportunities;
DROP FUNCTION IF EXISTS public.update_special_opportunity_search_vector();
DROP FUNCTION IF EXISTS public.update_general_opportunity_search_vector();
DROP TABLE IF EXISTS public.opportunity_activities;
DROP TABLE IF EXISTS public.favorite_special_opportunities;
DROP TABLE IF EXISTS public.saved_general_opportunities;
DROP TABLE IF EXISTS public.special_opportunities;
DROP TABLE IF EXISTS public.general_opportunities;
DROP TABLE IF EXISTS public.trade_categories;
DROP TYPE IF EXISTS public.activity_type;
DROP TYPE IF EXISTS public.trust_level;
DROP TYPE IF EXISTS public.special_opportunity_status;
DROP TYPE IF EXISTS public.general_opportunity_status;
DROP TYPE IF EXISTS public.special_opportunity_type;
DROP TYPE IF EXISTS public.opportunity_kind;
```

Only use this in non-production databases or after explicit DBA approval.
