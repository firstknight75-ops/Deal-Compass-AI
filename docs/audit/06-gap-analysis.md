# Gap Analysis

Date: 2026-06-23
Commit: 6ede6796302a8ee0913b3dde23653f5fd72ef2c4

## Executive Summary

The current repository is an early prototype: a TanStack Start/Vite application with Supabase authentication and basic user-owned deal CRUD. It does not yet match the Engineering Master Directive's required Next.js 14 monorepo architecture or production foundation.

## Major Gaps Against Directive

| Directive Requirement               | Current State                 | Gap                                                           | Severity |
| ----------------------------------- | ----------------------------- | ------------------------------------------------------------- | -------- |
| Next.js 14 App Router in `apps/web` | TanStack Start/Vite in `src/` | Framework and structure mismatch                              | Critical |
| Monorepo packages                   | No `packages/*`               | Missing shared config/core/domain architecture                | Critical |
| Drizzle ORM repository layer        | Direct Supabase client calls  | Data access pattern mismatch                                  | High     |
| Environment validation              | Scattered env reads           | Missing fail-fast startup validation                          | Critical |
| Typed error framework               | Generic errors                | Missing safe error mapping                                    | High     |
| Structured logger                   | Console logging               | Missing production logging strategy                           | High     |
| Rate limiting                       | None                          | Public/auth/API abuse risk                                    | Critical |
| Health endpoint                     | None                          | Missing operational readiness endpoint                        | High     |
| Platform schema                     | Only `deals` table            | Missing orgs, members, profiles, audit logs, health table     | Critical |
| RLS                                 | Present on `deals` only       | Future user/org tables missing                                | High     |
| Tests                               | None found                    | No executable validation                                      | Critical |
| CI/CD                               | None found                    | No automated quality gates                                    | Critical |
| AI/crawler/compliance/payments      | Missing                       | Expected for later phases, many blocked by provider decisions | High     |

## Existing Assets Worth Preserving

- Basic landing page copy and visual direction.
- shadcn/ui component set.
- Supabase client integration patterns, with caveats.
- Basic deals schema and per-user RLS policy as a prototype/reference.
- Deal dashboard UX concept.

## Recommended Path

1. Resolve framework direction immediately.
2. Remediate tracked `.env` and rotate exposed keys if needed.
3. Create directive-compliant repository structure if Next.js monorepo is confirmed.
4. Implement Phase 1 platform foundation only after unresolved provider decisions are documented and framework direction is confirmed.
5. Migrate prototype deal functionality into service/repository layers after Phase 1 and Phase 2 foundations.

## Blockers

- Human confirmation is required for framework direction.
- Human confirmation is required for queue, crawler execution, secrets, metrics/logs, compliance, SAML, and storage strategy before related code can be implemented.
