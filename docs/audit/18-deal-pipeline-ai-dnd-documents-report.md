# Deal Pipeline AI, Drag-and-Drop, and Documents — Completion Report

## Status: In Progress

## Completed This Phase

- Added migration for deal AI scoring columns and deal document metadata:
  - `supabase/migrations/0006_deal_pipeline_ai_documents.sql`
- Added rollback runbook:
  - `docs/runbooks/rollback-0006.md`
- Added Deal AI health scoring service with OpenAI structured outputs:
  - `src/lib/deals/ai-scoring.ts`
- Added Deal AI validation tests:
  - `src/lib/deals/ai-scoring.test.ts`
- Added typed deal pipeline row/document contracts:
  - `src/lib/deals/types.ts`
- Added server functions:
  - `scoreDealHealth`
  - `registerDealDocument`
  - `listDealDocuments`
  - `createDealDocumentSignedUrl`
- Added drag-and-drop movement between pipeline stages with persisted `updateDeal` mutations.
- Added AI health score badges on deal cards.
- Added AI scoring and Arabic explainer display in the deal dialog.
- Added document upload, recent document list, and signed document open links in the deal dialog.

## Remaining This Phase

- Apply migration `0006` to Supabase before runtime use.
- Regenerate authoritative Supabase types after migrations are applied.
- Add deal activity timeline for score/document/stage events if required.
- Add rate limiting around AI scoring calls.
- Add e2e tests for drag-and-drop and document uploads.

## Database Changes

Updated table:

- `deals`
  - `ai_health_score`
  - `ai_health_explainer_ar`
  - `ai_health_scored_at`

New table:

- `deal_documents`

RLS:

- deal document read/insert/update policies are owner-scoped.
- storage object policies for `trade-documents` are idempotently ensured.

## API Changes

New server functions:

- `scoreDealHealth`
- `registerDealDocument`
- `listDealDocuments`
- `createDealDocumentSignedUrl`

## Background Jobs

- None. Deal scoring is user-triggered only.

## Blocking Items

- Migrations must be applied to Supabase.
- Supabase generated types must be refreshed.
- AI scoring requires `OPENAI_API_KEY` in server environment.

## Security Review

- AI scoring is authenticated and owner-scoped.
- Deal document metadata insert requires ownership of the deal.
- Storage paths are constrained to the authenticated user's prefix.
- Signed document URLs expire after 300 seconds.

## Performance Considerations

- Deal documents list is capped at 10 recent files.
- AI scoring is not triggered on dashboard list load.
- Drag-and-drop stage updates use a single persisted mutation per drop.

## Tests Required

- [x] Unit tests for deal AI schema validation
- [ ] Integration test for owner-scoped deal scoring
- [ ] Integration test for deal document metadata registration
- [ ] E2E test for drag-and-drop stage updates
- [ ] E2E test for deal document upload and signed URL open

## Production Readiness Estimate

Feature Completion: 58%
Test Coverage (estimated): 3%
Security Controls: 60%
Documentation: 58%
Overall: 38%

These are directional estimates based on code inspection and generated artifacts.
