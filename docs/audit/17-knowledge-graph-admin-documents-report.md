# Knowledge Graph, Admin Radar, Recommendations, and Document Links — Completion Report

## Status: In Progress

## Completed This Phase

- Added migration for app RBAC and company-opportunity Knowledge Graph edges:
  - `supabase/migrations/0005_knowledge_graph_rbac_radar_admin.sql`
- Added rollback runbook:
  - `docs/runbooks/rollback-0005.md`
- Added `user_roles` RBAC table and admin/moderator policies.
- Added `company_opportunity_edges` table for company ↔ opportunity relationships.
- Added admin/moderator RLS policies for Radar source insert/update.
- Added server functions:
  - `listMyRoles`
  - `createRadarSource`
  - `updateRadarSource`
  - `listCompanyOpportunityEdges`
  - `createSpecialOpportunityDocumentSignedUrl`
- Added recommendation dismissal UI.
- Added company-related opportunity relationship display on company detail page.
- Added admin-only Radar source creation UI gated by user roles.
- Added signed document open/view links for uploaded special opportunity documents.

## Remaining This Phase

- Apply migrations to Supabase and regenerate authoritative Supabase types.
- Seed first `super_admin` role manually through a secure SQL/admin process.
- Add Radar source edit dialog; create flow is implemented.
- Add richer company edge cards that fetch and show opportunity titles.
- Add signed URL audit logging.
- Add E2E tests for admin Radar source creation and document signed URL generation.

## Database Changes

New enums:

- `app_role`
- `company_opportunity_relationship`

New tables:

- `user_roles`
- `company_opportunity_edges`

New/updated RLS:

- users can read their own roles.
- super admins can manage roles.
- company-opportunity edges are publicly readable and admin/moderator writable.
- radar sources can be inserted/updated by admin/moderator roles.

## API Changes

New server functions:

- `listMyRoles`
- `createRadarSource`
- `updateRadarSource`
- `listCompanyOpportunityEdges`
- `createSpecialOpportunityDocumentSignedUrl`

## Background Jobs

- None added.
- Radar ingestion remains intentionally unimplemented until queue/execution provider confirmation.

## Blocking Items

- Supabase migrations must be applied.
- A first super admin must be bootstrapped securely outside the app.
- Queue/execution provider remains required for actual Opportunity Radar ingestion.

## Security Review

- Radar source creation UI is client-gated by role and server/database-enforced by RLS.
- Document signed URLs are generated only for documents uploaded by the authenticated user and expire after 300 seconds.
- Company-opportunity edge writes require admin/moderator roles.
- No Radar ingestion worker or unauthorized crawler was added.

## Performance Considerations

- Company relationship list is capped at 50 edges.
- Radar source list remains capped at 100 rows.
- Document signed URL generation is on-demand only.

## Tests Required

- [ ] RLS tests for `user_roles`
- [ ] RLS tests for Radar source admin writes
- [ ] RLS tests for company-opportunity edge writes
- [ ] Integration test for signed document URL generation
- [ ] E2E test for recommendation dismissal

## Production Readiness Estimate

Feature Completion: 54%
Test Coverage (estimated): 2%
Security Controls: 58%
Documentation: 55%
Overall: 34%

These are directional estimates based on code inspection and generated artifacts.
