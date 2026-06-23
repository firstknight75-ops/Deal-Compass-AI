# Marketplace Edit and General Detail — Completion Report

## Status: In Progress

## Completed This Phase

- Added public client handling for unauthenticated/public marketplace read server functions.
- Added general opportunity detail server functions:
  - `getGeneralOpportunity`
  - `listGeneralOpportunityActivities`
- Added Arabic RTL general opportunity detail route:
  - `src/routes/_authenticated/marketplace.general.$opportunityId.tsx`
- Linked general opportunity cards to their detail route.
- Added special opportunity edit dialog on the special detail page.
- Added edit action wired to `updateSpecialOpportunity` with activity timeline invalidation.

## Remaining This Phase

- Convert marketplace server functions from deprecated `inputValidator()` to `validator()` after confirming TanStack Start version-specific API behavior.
- Add authoritative generated Supabase types after migrations are applied.
- Add RLS tests and integration tests.
- Add richer edit support for type/category/status transitions.
- Add document uploads after storage policy confirmation.

## Database Changes

- None in this increment.

## API Changes

- Added read functions for general opportunity details and public activities.
- Existing update function now has a UI consumer.

## Background Jobs

- None.

## Security Review

- Public marketplace reads now use a public Supabase client with RLS rather than relying on request context.
- Special opportunity edits still use authenticated Supabase context and owner-scoped update constraints.
- General detail route remains read-only and save-only.

## Performance Considerations

- General detail is a primary-key read.
- General activity timeline is capped at 100 records.

## Tests Required

- [ ] E2E test for opening general detail
- [ ] E2E test for editing a special opportunity
- [ ] Integration tests for public read client behavior
- [ ] RLS tests for general read-only behavior

## Production Readiness Estimate

Feature Completion: 34%
Test Coverage (estimated): 0%
Security Controls: 42%
Documentation: 40%
Overall: 20%

These are directional estimates based on code inspection only.
