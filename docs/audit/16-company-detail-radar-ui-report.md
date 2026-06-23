# Company Detail and Radar UI — Completion Report

## Status: In Progress

## Completed This Phase

- Added company detail server function: `getCompany`.
- Added recommendation dismiss server function: `dismissRecommendation`.
- Added Radar source list server function: `listRadarSources`.
- Added Arabic RTL company detail route:
  - `src/routes/_authenticated/intelligence.$companyId.tsx`
- Added Arabic RTL Radar source registry route:
  - `src/routes/_authenticated/radar.tsx`
- Linked company cards to company detail pages.
- Added AppShell navigation link for Radar.

## Remaining This Phase

- Add source creation/editing only after admin RBAC is completed.
- Add actual Radar ingestion workers only after queue/execution provider confirmation.
- Add company opportunity relationship views after Knowledge Graph edges are implemented.
- Add recommendation dismissal UI.

## Database Changes

- None in this increment.

## API Changes

New server functions:

- `getCompany`
- `dismissRecommendation`
- `listRadarSources`

## Background Jobs

- None.

## Blocking Items

- Queue/execution provider for Radar ingestion.
- Admin RBAC for Radar source management.
- Knowledge Graph edge tables for company relationships.

## Security Review

- Company detail uses public RLS and only returns non-deleted companies.
- Radar source registry is authenticated-read only.
- No Radar source write UI or API was added.

## Performance Considerations

- Company detail is a primary-key read.
- Radar source list is capped at 100 rows.

## Tests Required

- [ ] Integration test for company detail read
- [ ] Integration test for Radar authenticated read
- [ ] E2E test for navigating from intelligence list to company detail

## Production Readiness Estimate

Feature Completion: 48%
Test Coverage (estimated): 2%
Security Controls: 54%
Documentation: 50%
Overall: 30%

These are directional estimates based on code inspection and generated artifacts.
