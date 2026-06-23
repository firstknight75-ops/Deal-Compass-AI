# Security Findings

Date: 2026-06-23
Commit: 6ede6796302a8ee0913b3dde23653f5fd72ef2c4

This document is based on static repository inspection only. No secret scanning, SAST, DAST, dependency vulnerability scan, or penetration test was run.

## Critical (block deployment)

### `.env` was tracked by git — current-index remediation applied

- **Location:** `.env` was present in `git ls-files .env` during the initial audit.
- **Description:** Environment files should not be committed. The audit intentionally does not reproduce values, but tracked environment variables must be treated as exposed until rotated and git history is reviewed.
- **Impact:** Potential disclosure of Supabase project identifiers and API keys. If any sensitive keys have been committed, they must be rotated.
- **Remediation status:** Current-index remediation applied on 2026-06-23: `.env` added to `.gitignore`, `.env.example` created, and `git rm --cached .env` run. Remaining actions: commit the removal, rotate any exposed credentials, and run a full git-history secret scan.

### No rate limiting on auth or server functions

- **Location:** `src/routes/auth.tsx`, `src/lib/deals.functions.ts`.
- **Description:** Login/signup flows and authenticated mutation endpoints have no application-level rate limiting.
- **Impact:** Higher exposure to credential stuffing, abuse, and denial of service.
- **Remediation:** Implement provider-neutral rate limiting after Phase 1 environment/config foundation is approved. Auth endpoints need stricter limits.

## High (fix within current sprint)

### Raw database errors are thrown from server functions

- **Location:** `src/lib/deals.functions.ts` lines handling `if (error) throw new Error(error.message)`.
- **Description:** Supabase error messages are propagated via generic errors.
- **Impact:** Internal implementation details may be exposed to clients and logs are not structured.
- **Remediation:** Add typed error framework and map database errors to safe client responses.

### Direct database access from server functions

- **Location:** `src/lib/deals.functions.ts`.
- **Description:** Server functions call Supabase directly instead of using a repository layer.
- **Impact:** Authorization, audit logging, validation, and transaction patterns are harder to enforce consistently.
- **Remediation:** Introduce repository/service layers after framework direction is confirmed.

### Console logging in production code

- **Location:** `src/integrations/supabase/client.ts`, `src/integrations/supabase/client.server.ts`, `src/integrations/supabase/auth-middleware.ts`, `src/routes/__root.tsx`, `src/server.ts`, `src/start.ts`.
- **Description:** `console.error` is used instead of structured logger.
- **Impact:** Logs may be inconsistent, hard to aggregate, and could accidentally include sensitive details.
- **Remediation:** Replace with structured logger that redacts PII and secrets.

### Hard delete for deals

- **Location:** `src/lib/deals.functions.ts`, deals migration.
- **Description:** Deal records are deleted rather than soft-deleted.
- **Impact:** Reduces auditability and can complicate recovery/compliance.
- **Remediation:** Add `deleted_at` and update read filters. Do not drop existing data.

## Medium (fix within 30 days)

### Client-side route protection is not sufficient by itself

- **Location:** `src/routes/_authenticated/route.tsx`.
- **Description:** Client route guard redirects unauthenticated users. Server functions do also require middleware, which is positive, but future protected routes must not rely only on frontend checks.
- **Remediation:** Enforce authorization server-side for every data access path.

### Missing CSP/security headers configuration

- **Location:** No Next.js middleware/config or equivalent header config found.
- **Description:** No content security policy or standard security headers found in repository.
- **Remediation:** Add CSP and security headers in the hosting/framework layer after architecture decision.

### Migration lacks directive-required metadata

- **Location:** `supabase/migrations/20260623182244_97d10051-d8ee-4510-a6c4-0665d8130cac.sql`.
- **Description:** Migration lacks required header, rollback instructions, and sequential naming style.
- **Remediation:** Preserve existing applied migration if already run; add future migrations using directive format.

## Low (track in backlog)

### Password-only auth UX

- **Location:** `src/routes/auth.tsx`.
- **Description:** Google Workspace OAuth, Microsoft Entra ID, and SAML are not implemented.
- **Remediation:** Implement after provider confirmations.

## Security Controls Checklist

- [ ] RLS enabled on all user tables — deals table has RLS; future user tables missing.
- [ ] No secrets in codebase — current-index `.env` tracking remediated, but full git-history secret scan and credential rotation are still required.
- [ ] Input validation on all API endpoints — partial; deal mutations use Zod, auth form relies on Supabase/client constraints.
- [ ] Rate limiting implemented — missing.
- [ ] CORS configured correctly — not assessed; no explicit config found.
- [ ] CSP headers present — missing.
- [ ] Authentication required on all protected routes — partial.
- [ ] Authorization checked server-side — partial; Supabase RLS and server middleware used for deals.
- [ ] SQL injection not possible — partial; Supabase client parameterization is used, but directive requires Drizzle repository layer.
- [ ] XSS protection in place — partial; React escaping applies to rendered text, but CSP missing.
