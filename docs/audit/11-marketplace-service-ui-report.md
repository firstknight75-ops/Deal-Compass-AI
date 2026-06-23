# Marketplace Service and UI — Completion Report

## Status: In Progress

## Completed This Phase

- Added Arabic trade category seed migration:
  - `supabase/migrations/0003_trade_categories_seed.sql`
- Added category seed rollback runbook:
  - `docs/runbooks/rollback-0003.md`
- Added typed marketplace domain constants and row types:
  - `src/lib/marketplace/types.ts`
- Added TanStack Start server functions for marketplace operations:
  - `src/lib/marketplace.functions.ts`
- Added authenticated Arabic RTL marketplace route:
  - `src/routes/_authenticated/marketplace.tsx`
- Added AppShell navigation link to the marketplace.

## Remaining This Phase

- Apply migrations to Supabase and regenerate authoritative Supabase types.
- Replace local marketplace table typings with generated database types after migration.
- Add update/archive operations for special opportunities.
- Add detail pages for general and special opportunities.
- Add activity timeline UI and comments.
- Add RLS tests and server function tests.
- Add public marketplace route if unauthenticated browsing is desired.

## Database Changes

- New seed data for Arabic-first categories.
- No additional schema changes beyond migration `0002`.

## API Changes

New server functions:

- `listTradeCategories`
- `listGeneralOpportunities`
- `listSpecialOpportunities`
- `createSpecialOpportunity`
- `saveGeneralOpportunity`
- `favoriteSpecialOpportunity`

## Background Jobs

- None added.

## Blocking Items

- Opportunity Radar ingestion remains blocked by queue/execution provider confirmation.
- Document uploads remain blocked by storage bucket strategy and storage policy review.
- AI scoring at scale remains blocked by cost/usage policy and moderation workflow.

## Security Review

- General opportunities remain read-only; UI only supports save/follow behavior.
- Special opportunities are created through authenticated server functions and owner_user_id is taken from server auth context, not client input.
- Server functions still need centralized error handling and rate limiting integration from Phase 1.

## Performance Considerations

- Marketplace list calls cap results at 50 rows.
- Search uses database full-text search when a query is provided.
- Category data should later be cached because it changes infrequently.

## Tests Required

- [ ] Unit tests for Zod validation schemas
- [ ] Integration tests for server functions
- [ ] RLS tests for all marketplace tables
- [ ] E2E test for creating a special opportunity
- [ ] E2E test for saving/favoriting opportunities

## Production Readiness Estimate

Feature Completion: 25%
Test Coverage (estimated): 0%
Security Controls: 38%
Documentation: 35%
Overall: 15%

These are directional estimates based on code inspection only.

## Next Phase

Add detail pages, timeline/comment service, and update/archive workflows for special opportunities after migrations are applied.
