# Rollback Runbook — 0005 Knowledge Graph RBAC and Radar Admin

Date: 2026-06-23

## Safer Rollback

- Hide Radar source admin UI.
- Revoke user roles by setting `revoked_at`.
- Leave company-opportunity edge data in place for audit continuity.

## Destructive Non-Production Rollback

```sql
DROP POLICY IF EXISTS "radar_sources_admin_update" ON public.radar_sources;
DROP POLICY IF EXISTS "radar_sources_admin_insert" ON public.radar_sources;
DROP TABLE IF EXISTS public.company_opportunity_edges;
DROP TABLE IF EXISTS public.user_roles;
DROP TYPE IF EXISTS public.company_opportunity_relationship;
DROP TYPE IF EXISTS public.app_role;
```

Only use destructive rollback in non-production or with DBA approval.
