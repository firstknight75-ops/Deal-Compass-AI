# Dependency Graph

Date: 2026-06-23
Commit: 6ede6796302a8ee0913b3dde23653f5fd72ef2c4

This graph maps directive modules to the current repository state.

## Module: Platform Foundation

### Depends On

- None.

### Required Database Tables

- `health_check` ❌
- `organizations` ❌
- `organization_members` ❌
- `user_profiles` ❌
- `audit_logs` ❌

### Required Background Jobs

- None for initial foundation.
- Queue/event bus work is blocked by provider confirmation.

### Required External Services

- Supabase ✅ partially configured
- Upstash Redis ❌ missing
- OpenAI ❌ missing for health check AI probe
- Stripe ❌ missing for billing phases
- Sentry ❌ missing

### Events Emitted

- None required initially.

### Events Consumed

- None required initially.

### Implementation Order

This module cannot be built directive-compliantly until:

1. Framework direction is confirmed: Next.js monorepo migration vs directive revision ❌
2. Environment variable naming is standardized ❌
3. `.env` tracked-file issue is remediated or explicitly accepted for local-only prototype ❌

## Module: Authentication and Enterprise Identity

### Depends On

- Platform Foundation
- Supabase Auth
- SAML provider confirmation for enterprise SSO

### Required Database Tables

- `user_profiles` ❌
- `organizations` ❌
- `organization_members` ❌
- Current `deals` table references `auth.users` ✅

### Required Background Jobs

- Invitation expiration/cleanup worker ❌ blocked by queue provider

### Required External Services

- Supabase Auth ✅ basic email/password present
- Google Workspace OAuth ❌
- Microsoft Entra ID ❌
- SAML provider ❌ unconfirmed

### Events Emitted

- `user.created` ❌
- `organization.created` ❌
- `member.invited` ❌

### Events Consumed

- None currently.

### Implementation Order

1. Platform foundation schema exists ❌
2. Auth provider configuration confirmed ⚠️ partial
3. SAML provider confirmed ❌

## Module: Deal Pipeline (Current Prototype)

### Depends On

- Supabase Auth ✅
- `deals` table ✅
- RLS policy ✅

### Required Database Tables

- `deals` ✅
- Future directive-compliant organization ownership tables ❌
- Audit logs ❌

### Required Background Jobs

- None currently.

### Required External Services

- Supabase ✅

### Events Emitted

- `deal.created` ❌
- `deal.updated` ❌
- `deal.deleted` ❌

### Events Consumed

- None currently.

### Implementation Order

Current prototype works conceptually only after Supabase auth/session exists. Directive-compliant version cannot be completed until:

1. Repository/service architecture exists ❌
2. Organization model exists ❌
3. Audit logging exists ❌
4. Error/rate-limit foundations exist ❌

## Module: Trade Radar Engine (Crawler)

### Depends On

- Phase 1 Platform Foundation ❌
- Phase 2 Backend Core Services ❌
- Queue provider confirmation ❌
- Crawler execution environment confirmation ❌

### Required Database Tables

- `crawl_sources` ❌
- `crawl_runs` ❌
- `raw_documents` ❌
- `crawl_results` ❌

### Required Background Jobs

- `crawler-scheduler` ❌
- `crawler-worker` ❌

### Required External Services

- Playwright/Cheerio runtime ❌
- Execution provider ❌ unconfirmed

### Events Emitted

- `crawl.result.created` ❌
- `crawl.run.completed` ❌

### Events Consumed

- `crawl.source.scheduled` ❌

### Implementation Order

Blocked until provider decisions are confirmed.

## Module: AI Normalization Engine

### Depends On

- Crawler raw documents ❌
- AI provider config ❌
- Queue/event bus ❌

### Required Database Tables

- `raw_documents` ❌
- `normalized_documents` ❌
- `ai_processing_runs` ❌

### Required Background Jobs

- `normalization-worker` ❌

### Required External Services

- OpenAI API ❌
- Vercel AI SDK ❌

### Events Emitted

- `normalization.complete` ❌
- `normalization.failed` ❌

### Events Consumed

- `crawl.result.created` ❌

### Implementation Order

Cannot be built until crawler and AI config foundations exist.

## Module: Opportunity Intelligence Engine

### Depends On

- Crawler ❌
- AI Normalization Engine ❌
- Company Intelligence ❌
- Market Intelligence ❌

### Required Database Tables

- `opportunities` ❌
- `opportunity_scores` ❌
- `companies` ❌
- `products` ❌
- `crawl_results` ❌

### Required Background Jobs

- `opportunity-scoring-worker` ❌
- `opportunity-expiry-worker` ❌

### Required External Services

- OpenAI API ❌

### Events Emitted

- `opportunity.created` ❌
- `opportunity.scored` ❌
- `opportunity.expired` ❌
- `opportunity.matched` ❌

### Events Consumed

- `crawl.result.created` ❌
- `normalization.complete` ❌

### Implementation Order

This module cannot be built until:

1. Database schema (`opportunities` table) exists ❌
2. Crawler framework produces crawl results ❌
3. AI Normalization Engine is operational ❌
4. Company Intelligence Engine is operational ❌

## Module: Observability Platform

### Depends On

- Structured logging foundation ❌
- Metrics provider confirmation ❌
- Logs provider confirmation ❌
- Sentry setup ❌

### Required Database Tables

- Optional operational tables TBD.

### Required Background Jobs

- Alert/event processors TBD, blocked by queue provider.

### Required External Services

- Sentry ❌
- Metrics provider ❌ unconfirmed
- Logs provider ❌ unconfirmed

### Events Emitted

- `observability.alert.created` ❌

### Events Consumed

- Application logs/errors/metrics ❌

### Implementation Order

Provider-neutral logging can start in Phase 1 after framework decision. Provider-specific metrics/log shipping is blocked.
