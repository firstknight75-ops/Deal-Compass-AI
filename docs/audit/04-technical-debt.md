# Technical Debt

Date: 2026-06-23
Commit: 6ede6796302a8ee0913b3dde23653f5fd72ef2c4

## Debt Register

| ID     | Category           | Issue                                                          | Root Cause                                                                  | Impact                                                                             | Proposed Fix                                                                                                                                                | Priority |
| ------ | ------------------ | -------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| TD-001 | Architecture       | Repository does not follow required monorepo/Next.js contract. | Existing app generated as TanStack Start/Vite project.                      | Blocks directive-compliant Phase 1 implementation.                                 | Human decision: migrate to Next.js monorepo or revise directive.                                                                                            | Critical |
| TD-002 | Security           | `.env` was tracked in git.                                     | `.gitignore` excluded `*.local` but not `.env`; environment file committed. | Potential secret exposure and deployment block.                                    | Current-index fix applied: `.env` ignored, `.env.example` created, `git rm --cached .env` run. Remaining: commit fix, rotate exposed keys, run secret scan. | Critical |
| TD-003 | Backend layering   | Direct Supabase calls in server functions.                     | Prototype implementation skipped repository/service layers.                 | Harder to enforce authorization, audit logging, transactions, and error mapping.   | Introduce domain/repository/service layers after framework decision.                                                                                        | High     |
| TD-004 | Error handling     | Raw database errors thrown to caller.                          | No typed error framework.                                                   | Information disclosure and inconsistent UX/logging.                                | Add `AppError` framework and safe error handler.                                                                                                            | High     |
| TD-005 | Logging            | Console logging in application/integration files.              | No structured logging abstraction.                                          | Poor observability and possible sensitive data leakage.                            | Add logger and replace console usage.                                                                                                                       | High     |
| TD-006 | Testing            | No tests found.                                                | Prototype stage.                                                            | Regressions likely; CI gates impossible.                                           | Add unit, integration, RLS, and e2e tests as modules are refactored.                                                                                        | Critical |
| TD-007 | CI/CD              | No GitHub Actions workflows.                                   | Prototype stage.                                                            | No automated validation.                                                           | Add lint/typecheck/test workflow once architecture is confirmed.                                                                                            | Critical |
| TD-008 | Database lifecycle | Deals are hard-deleted.                                        | Initial schema lacks `deleted_at`.                                          | Auditability and recovery gaps.                                                    | Add soft-delete migration and update reads/mutations.                                                                                                       | High     |
| TD-009 | Config             | Env reads scattered in Supabase clients.                       | No config package.                                                          | Startup failures occur at runtime paths; inconsistent variable names vs directive. | Add centralized env validation.                                                                                                                             | Critical |
| TD-010 | Performance        | Dashboard loads all deals and computes aggregate client-side.  | Prototype read model.                                                       | Poor scaling for large accounts.                                                   | Add paginated queries/read-model aggregates.                                                                                                                | Medium   |

## Fix Protocol Template

For each debt item fixed:

1. Root cause confirmed.
2. Impact assessed for data integrity, security, UX, and performance.
3. Fix generated in the correct layer.
4. Regression test generated.
5. Commit message documents what changed and why.

## Commit Message Template

```text
fix(scope): short description

Root cause:
- ...

Impact:
- ...

Changes:
- ...

Tests:
- Added/updated executable tests. Not claiming pass status until CI/human execution.

Security notes:
- ...
```
