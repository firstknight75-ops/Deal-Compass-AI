# Documents, Company Intelligence, Recommendations, and Radar Registry — Completion Report

## Status: In Progress

## Completed This Phase

- Added migration for Supabase Storage document bucket and policies:
  - `supabase/migrations/0004_documents_company_recommendations_radar.sql`
- Added document metadata table and RLS policies.
- Added company intelligence table, search vector trigger, pgvector column, and RLS.
- Added recommendations table and user-scoped RLS.
- Added Opportunity Radar source registry and raw document registry without workers.
- Added rollback runbook:
  - `docs/runbooks/rollback-0004.md`
- Added server functions for:
  - registering special opportunity documents
  - listing special opportunity documents
  - listing company profiles
  - listing recommendations
- Added document upload UI to special opportunity detail page.
- Added intelligence route for company profiles and recommendations:
  - `src/routes/_authenticated/intelligence.tsx`
- Added AppShell navigation link for intelligence.

## Remaining This Phase

- Apply migrations to Supabase before using uploads in production.
- Regenerate authoritative Supabase types after migrations are applied.
- Add signed download/view URLs for documents after access rules are finalized.
- Add company detail pages.
- Add recommendation generation jobs after queue/provider confirmation.
- Add Opportunity Radar workers after queue/execution provider confirmation.

## Database Changes

New storage bucket:

- `trade-documents`

New tables:

- `opportunity_documents`
- `companies`
- `recommendations`
- `radar_sources`
- `radar_raw_documents`

## API Changes

New server functions:

- `registerSpecialOpportunityDocument`
- `listSpecialOpportunityDocuments`
- `listCompanies`
- `listRecommendations`

## Background Jobs

- None added. Radar and recommendations remain schema-ready but worker-blocked.

## Blocking Items

- Migrations must be applied before runtime use.
- Supabase generated types must be refreshed after migration application.
- Queue/execution provider still required for Radar ingestion and recommendation generation.

## Security Review

- Storage object policies restrict document paths to the authenticated user's own prefix.
- Document metadata insert requires ownership of the special opportunity.
- Document reads are owner-scoped for special opportunities.
- Radar raw documents have no authenticated write policy.

## Performance Considerations

- Document lists are capped at 10 recent files.
- Company list is capped at 50 rows and indexed by search vector, country/city, industry, and trust score.
- Recommendation list is capped at 20 rows and indexed by user/score.

## Tests Required

- [ ] Storage policy tests for own-prefix upload/read/delete
- [ ] RLS tests for document metadata ownership
- [ ] Integration test for document registration after storage upload
- [ ] Company list server function test
- [ ] Recommendation list server function test

## Production Readiness Estimate

Feature Completion: 45%
Test Coverage (estimated): 0%
Security Controls: 52%
Documentation: 48%
Overall: 28%

These are directional estimates based on code inspection only.
