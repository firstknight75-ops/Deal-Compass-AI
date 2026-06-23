# Marketplace Detail and Timeline — Completion Report

## Status: In Progress

## Completed This Phase

- Added activity and opportunity detail TypeScript row types.
- Added server functions for:
  - special opportunity detail fetch
  - special opportunity update
  - special opportunity archive
  - special opportunity activity list
  - special opportunity comments
- Added activity creation when a special opportunity is created.
- Added Arabic RTL special opportunity detail route:
  - `src/routes/_authenticated/marketplace.$opportunityId.tsx`
- Linked marketplace special opportunity cards to detail pages.

## Remaining This Phase

- Add edit form on detail page using `updateSpecialOpportunity`.
- Add public detail handling for non-authenticated marketplace browsing if required.
- Add general opportunity detail page.
- Add timeline filters and richer activity labels.
- Add document upload integration after storage strategy is confirmed.
- Add tests for timeline permissions.

## Database Changes

- No new schema migration in this increment.
- Uses `opportunity_activities` from migration `0002`.

## API Changes

New server functions:

- `getSpecialOpportunity`
- `updateSpecialOpportunity`
- `archiveSpecialOpportunity`
- `listSpecialOpportunityActivities`
- `addSpecialOpportunityComment`

## Background Jobs

- None.

## Blocking Items

- Storage bucket strategy for documents.
- Queue/provider confirmation for Opportunity Radar.
- Generated Supabase types after migrations are applied.

## Security Review

- Archive/update functions set owner constraints server-side using `context.userId`.
- Comment insertion uses authenticated actor ID from server context.
- RLS still provides database-level enforcement.
- Server functions still need centralized rate limiting and safer error mapping.

## Performance Considerations

- Timeline list is capped at 100 activities.
- Detail fetch uses primary-key lookup.

## Tests Required

- [ ] Integration test for detail read access
- [ ] Integration test for owner-only archive/update
- [ ] Integration test for comments
- [ ] RLS test for activity timeline visibility

## Production Readiness Estimate

Feature Completion: 30%
Test Coverage (estimated): 0%
Security Controls: 40%
Documentation: 38%
Overall: 18%

These are directional estimates based on code inspection only.
