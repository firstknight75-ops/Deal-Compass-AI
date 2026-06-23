# DealCompass AI+ Tech Stack Confirmation Checklist

Date: 2026-06-23
Owner: Principal Architect / Engineering Team
Prepared by: AI Engineering Assistant
Repository: https://github.com/firstknight75-ops/Deal-Compass-AI.git
Commit audited: 6ede6796302a8ee0913b3dde23653f5fd72ef2c4

## Purpose

This checklist is the required first deliverable from the Engineering Master Directive before Phase 1 implementation. Items marked **Unconfirmed** must be confirmed by the engineering team before code that depends on them is generated.

## Confirmed by Directive

| Area               | Decision                                   |                                                  Status | Notes                                                                               |
| ------------------ | ------------------------------------------ | ------------------------------------------------------: | ----------------------------------------------------------------------------------- |
| Frontend framework | Next.js 14 App Router                      |       Confirmed by directive, not matched by repository | Current repository uses TanStack Start + Vite, not Next.js.                         |
| Frontend language  | TypeScript 5.x                             |                                               Confirmed | Repository uses TypeScript 5.8.3.                                                   |
| Styling            | Tailwind CSS                               |                                               Confirmed | Repository uses Tailwind CSS 4.x.                                                   |
| State/query        | Zustand + TanStack Query                   |                                     Partially confirmed | Repository has TanStack Query; Zustand is not present.                              |
| Forms/validation   | React Hook Form + Zod                      |                                               Confirmed | Dependencies present. Current feature uses manual state plus Zod server validation. |
| UI components      | shadcn/ui                                  |                                               Confirmed | `components/ui` exists.                                                             |
| Backend runtime    | Node.js 20 LTS                             |                                  Confirmed by directive | Repository has no engines field.                                                    |
| Backend framework  | Next.js API Routes + tRPC                  |       Confirmed by directive, not matched by repository | Current repository uses TanStack Start server functions. tRPC is not present.       |
| ORM                | Drizzle ORM                                |           Confirmed by directive, missing in repository | Repository uses Supabase client directly.                                           |
| Database           | Supabase PostgreSQL 15                     |                                               Confirmed | Supabase config and migration exist.                                                |
| Vector             | pgvector                                   | Confirmed by directive, missing in repository migration | Current migration does not create vector extension.                                 |
| Cache              | Redis / Upstash                            |           Confirmed by directive, missing in repository | No Upstash dependency/config found.                                                 |
| Auth               | Supabase Auth                              |                                               Confirmed | Basic Supabase email/password flow exists.                                          |
| AI                 | OpenAI GPT-4o + embeddings + Vercel AI SDK |           Confirmed by directive, missing in repository | No OpenAI or Vercel AI SDK dependency found.                                        |
| Hosting            | Vercel frontend + API                      |                                  Confirmed by directive | Current TanStack/Vite structure requires migration or explicit exception.           |
| Error tracking     | Sentry                                     |           Confirmed by directive, missing in repository | No Sentry dependency/config found.                                                  |
| Payments           | Stripe                                     |           Confirmed by directive, missing in repository | No Stripe dependency/config found.                                                  |
| CI/CD              | GitHub Actions                             |           Confirmed by directive, missing in repository | No `.github/workflows` found.                                                       |
| Environments       | development, staging, production           |                                  Confirmed by directive | No environment validation package exists yet.                                       |

## Unconfirmed Provider Decisions

| Area                    | Options in Directive                        | Decision |      Status | Implementation Constraint                                                      |
| ----------------------- | ------------------------------------------- | -------- | ----------: | ------------------------------------------------------------------------------ |
| Enterprise SAML         | BoxyHQ or Auth0                             | TBD      | Unconfirmed | Do not implement enterprise SAML code.                                         |
| Additional LLM          | Claude in addition to OpenAI?               | TBD      | Unconfirmed | Do not implement provider routing beyond confirmed OpenAI defaults.            |
| Queue provider          | BullMQ + Redis, Inngest, or Trigger.dev     | TBD      | Unconfirmed | Do not implement queue, workers, event bus, or background job framework.       |
| Crawler execution       | Local workers, Modal, or AWS Lambda         | TBD      | Unconfirmed | Do not implement crawler execution code.                                       |
| Storage bucket strategy | Supabase Storage + S3 strategy              | TBD      | Unconfirmed | Do not implement storage abstractions that encode bucket/provider assumptions. |
| Secrets management      | Vercel env, Doppler, or AWS Secrets Manager | TBD      | Unconfirmed | Do not implement secret-management-specific code.                              |
| Metrics                 | Datadog, Grafana Cloud, or Vercel Analytics | TBD      | Unconfirmed | Do not implement metrics provider integration.                                 |
| Logs                    | Axiom, Datadog, or Logtail                  | TBD      | Unconfirmed | Structured logging can be provider-neutral only.                               |
| KYC/KYB                 | Persona, Onfido, or Sumsub                  | TBD      | Unconfirmed | Do not implement compliance provider code.                                     |
| Sanctions               | Dow Jones, ComplyAdvantage, or Chainalysis  | TBD      | Unconfirmed | Do not implement sanctions provider code.                                      |

## Immediate Architecture Decision Required

**Decision recorded before Phase 1 implementation:** Keep the current TanStack Start/Vite architecture and adapt implementation artifacts to this repository instead of migrating to Next.js 14 App Router at this time.

Current repository root does not match the required structure:

- No `apps/web` application.
- No `packages/core`, `packages/config`, `packages/ai`, `workers`, `tests`, `infrastructure`, or `.github/workflows` directories.
- App code currently lives under `src/` and uses TanStack Router/Start.

## Required Human Confirmation Record

| Item                                                                 | Confirmed By | Date       | Notes                                             |
| -------------------------------------------------------------------- | ------------ | ---------- | ------------------------------------------------- |
| Framework direction: migrate to Next.js monorepo vs revise directive | User         | 2026-06-23 | Confirmed: keep TanStack Start/Vite architecture. |
| Enterprise SAML provider                                             |              |            |                                                   |
| Queue provider                                                       |              |            |                                                   |
| Crawler execution environment                                        |              |            |                                                   |
| Secrets management system                                            |              |            |                                                   |
| Metrics provider                                                     |              |            |                                                   |
| Logs provider                                                        |              |            |                                                   |
| KYC/KYB provider                                                     |              |            |                                                   |
| Sanctions provider                                                   |              |            |                                                   |
| Storage bucket strategy                                              |              |            |                                                   |
| Additional LLM provider decision                                     |              |            |                                                   |

## Constraints Until Confirmed

- Documentation and audit work may continue.
- Critical security hygiene may be prepared for review.
- Do not implement queue, crawler execution, monitoring provider, compliance provider, storage-provider-specific, or secret-manager-specific code.
- Phase 1 code may proceed using TanStack Start/Vite architecture. Continue to block provider-specific queue, crawler execution, monitoring, compliance, storage-provider-specific, and secret-manager-specific code until providers are confirmed.
