# Marketplace Foundation — Completion Report

## Status: In Progress

## Completed This Phase

- Captured Arabic-first trade marketplace blueprint:
  - `docs/architecture/01-product-blueprint-arabic-marketplace.md`
- Added marketplace foundation database migration:
  - `supabase/migrations/0002_trade_marketplace_foundation.sql`
- Added rollback runbook:
  - `docs/runbooks/rollback-0002.md`

## Remaining This Phase

- Seed Arabic category taxonomy.
- Generate TypeScript Supabase types from the database after migrations are applied.
- Add repository/service/API functions for special opportunities.
- Add read/search APIs for general opportunities.
- Add marketplace UI routes.
- Add tests for RLS and opportunity lifecycle rules.

## Database Changes

New enums:

- `opportunity_kind`
- `special_opportunity_type`
- `general_opportunity_status`
- `special_opportunity_status`
- `trust_level`
- `activity_type`

New tables:

- `trade_categories`
- `general_opportunities`
- `special_opportunities`
- `saved_general_opportunities`
- `favorite_special_opportunities`
- `opportunity_activities`

Indexes:

- Status/published-date indexes for marketplace feeds.
- Country/city/category filters.
- GIN full-text indexes.
- pgvector ivfflat indexes for semantic search.
- Activity timeline indexes.

RLS policies:

- Public read for active categories.
- Public read for published, non-expired general opportunities.
- No user write policies for general opportunities.
- Public read for published special opportunities.
- Owner read/insert/update for special opportunities.
- No delete policy for special opportunities.
- Own access policies for saves/favorites.
- Timeline read policies for public/general and related special opportunities.

## API Changes

- None yet.

## Background Jobs

- None added.
- Opportunity Radar workers remain blocked by queue/execution provider confirmation.

## Blocking Items

- Queue provider/execution path for Opportunity Radar.
- Storage bucket strategy and Supabase Storage policies before document uploads.
- Notification provider decisions for WhatsApp/Telegram.
- Full AI provider cost/usage policy before automated scoring at scale.

## Security Review

- General opportunities are read-only to users by absence of authenticated write policies.
- Special opportunities have owner-based RLS for write operations.
- Special opportunities intentionally do not expose a DELETE policy; archive/soft-delete must be handled by application logic.
- Activity timeline insertion is restricted to owners for special opportunities.
- Public read policies expose only published/non-expired marketplace data.

## Performance Considerations

- Feed queries are indexed by status and published date.
- Search vectors are maintained by triggers.
- Vector indexes are included for semantic search, but query tuning is still required.
- pgvector ivfflat indexes need adequate data volume and ANALYZE after large imports.

## Tests Required

- [ ] RLS tests for general opportunity read-only behavior
- [ ] RLS tests for special opportunity owner write behavior
- [ ] RLS tests for favorites/saves ownership
- [ ] Search trigger tests
- [ ] Migration application test in staging

## Production Readiness Estimate

Feature Completion: 18%
Test Coverage (estimated): 0%
Security Controls: 35%
Documentation: 30%
Overall: 12%

These estimates are directional based on code inspection and generated artifacts. They are not automated scan results.

## Next Phase

Build the marketplace service/API layer after applying migrations and regenerating Supabase types.
