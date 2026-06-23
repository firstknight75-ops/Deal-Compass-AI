# Rollback Runbook — 0001 Platform Foundation

Date: 2026-06-23

## Scope

Migration: `supabase/migrations/0001_platform_foundation.sql`

## Rollback Strategy

This migration creates foundation tables and policies. Production rollback should avoid destructive drops unless a database backup has been verified and the migration has not received production user data.

## Safer Rollback

1. Disable application code that depends on the new foundation tables.
2. Leave tables in place.
3. If a policy causes access issues, drop or replace only that specific policy.
4. Restore from backup only if data corruption occurred.

## Destructive Rollback for Non-Production Only

```sql
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
DROP TRIGGER IF EXISTS update_org_members_updated_at ON public.organization_members;
DROP TRIGGER IF EXISTS update_organizations_updated_at ON public.organizations;
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP TABLE IF EXISTS public.audit_logs;
DROP TABLE IF EXISTS public.user_profiles;
DROP TABLE IF EXISTS public.organization_members;
DROP TABLE IF EXISTS public.organizations;
DROP TABLE IF EXISTS public.health_check;
```

Do not run destructive rollback in production without human DBA approval.
