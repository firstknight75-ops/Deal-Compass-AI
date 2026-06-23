# Critical Fixes Log

Date: 2026-06-23
Commit inspected before fixes: 6ede6796302a8ee0913b3dde23653f5fd72ef2c4

## CF-001 — Remove tracked `.env` from version control

### Root Cause

The repository `.gitignore` ignored `*.local` but did not ignore `.env` or `.env.*`, and `.env` had been committed.

### Impact

- Potential exposure of environment-specific configuration and publishable keys.
- If any secret values were ever committed, they must be treated as exposed until a full git-history secret scan and rotation are completed.

### Changes Made

- Added `.env` and `.env.*` to `.gitignore`.
- Added `!.env.example` exception for safe examples.
- Created `.env.example` with blank variable placeholders.
- Ran `git rm --cached .env` so `.env` remains available locally but is staged for removal from version control.

### Remaining Human/CI Actions

- Commit the staged `.env` deletion and `.gitignore` update.
- Rotate any Supabase or other credentials that may have appeared in committed `.env` history.
- Run a full secret scan over git history, such as gitleaks or an approved equivalent.
- If history contains secrets, follow the team's incident response and key rotation process. Do not rewrite published history without coordinating with Lovable, per `AGENTS.md`.

### Tests / Verification Performed

- Verified `git ls-files` no longer lists `.env` after the index removal.
- Verified `git check-ignore -v .env` reports `.env` is ignored by `.gitignore`.
- No security scanner was run.

## CF-002 — Set Arabic as the default application language

### Root Cause

The app defaulted to English copy, `lang="en"`, and LTR document direction.

### Impact

Arabic-speaking users did not receive the requested default language experience.

### Changes Made

- Set root document language and direction to `lang="ar" dir="rtl"`.
- Set body direction to RTL.
- Translated default user-facing copy on landing, authentication, dashboard, app shell, not-found, error, and deal dialog screens.
- Changed default number/currency formatting locale to `ar-IQ` for the dashboard.
- Moved toast placement to the top-left, which is more natural for RTL UI.
- Added Arabic-friendly font fallbacks and RTL base CSS.

### Remaining Human/CI Actions

- Product review of Arabic translations.
- UX review of RTL layout details across all shadcn/ui components.
- Add formal i18n architecture if multiple languages will be supported later.

### Tests / Verification Performed

- `npm run lint` completed with 0 errors and 6 pre-existing Fast Refresh warnings in shadcn/ui component files.
- `npm run build` completed successfully. Build emitted warnings about `vite-tsconfig-paths`, deprecated `createServerFn().inputValidator()`, and a large client chunk.
- No unit/integration/e2e tests were added or run for this change.

## Validation Command Log

- `npm install --package-lock=false --ignore-scripts` completed, with Node engine warnings because some TanStack packages declare Node `>=22.12.0` while the workspace runtime is Node `v20.20.2`.
- `npm run format` completed.
- `npm run lint` completed with warnings only.
- `npm run build` completed successfully with non-blocking warnings.
