# DealCompass AI+ Arabic-First Trade Intelligence Marketplace Blueprint

Date: 2026-06-23
Prepared by: AI Engineering Assistant
Framework decision: Keep current TanStack Start/Vite architecture.

## Product Definition

DealCompass AI+ is an Arabic-first, RTL-first B2B trade intelligence marketplace for Iraq, Türkiye, Iran, GCC, and global trade.

It combines:

1. Marketplace listings
2. AI-generated external opportunity leads
3. Company intelligence
4. Market intelligence
5. Recommendations
6. Trade execution workflows
7. Enterprise collaboration

## Non-Negotiable Domain Separation

| Area          | General Opportunities                                                                       | Special Opportunities                                           |
| ------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Purpose       | External lead generation and market intelligence                                            | User-owned marketplace inventory                                |
| Source        | Public/authorized external sources, partner feeds, admin uploads                            | Users and organizations                                         |
| Ownership     | No user owner                                                                               | Owned by user, optionally organization-linked                   |
| Editability   | Read-only to users                                                                          | Editable by owner/authorized org role                           |
| Monetization  | Free intelligence                                                                           | Premium workflows and monetization                              |
| Negotiation   | Not allowed                                                                                 | Allowed                                                         |
| Trust default | Level 0 external unverified                                                                 | Level 3 user verified, subject to verification                  |
| Lifecycle     | Discovered → Extracted → Deduplicated → Scored → Moderated → Published → Expired → Archived | Draft → Published → Negotiating → Active → Completed → Archived |

This separation must remain visible in database schema, APIs, business logic, permissions, analytics, search, recommendations, and billing.

## Current Repository Architecture Evidence

- Current app: TanStack Start/Vite, TypeScript, Tailwind, shadcn/ui.
- Auth/data: Supabase client and RLS.
- Confirmed user decision: keep TanStack Start/Vite instead of migrating to Next.js App Router.
- Phase 1 foundation partially added: environment validation, errors, logging, health route, rate-limit service, foundation migration.

## Implementation Dependency Graph

### Foundation

- Phase 1 platform foundation must be completed.
- Existing `.env` tracking issue has current-index remediation but still requires external git-history secret scan.

### Marketplace Foundation

Depends on:

- Supabase Auth
- RLS
- Organizations migration
- pgvector extension
- Arabic-first UI shell

Unblocked work:

- Database schema for general/special opportunities
- Category taxonomy
- Save/favorite tables
- Activity timeline schema
- Search vector columns

Blocked work:

- Opportunity Radar workers until queue/provider execution path is confirmed.
- Document upload UI/API until storage bucket strategy and Supabase Storage policies are reviewed.
- WhatsApp/Telegram notifications until provider/account strategy is confirmed.

## Module Build Order

1. Marketplace data model and RLS
2. Arabic taxonomy seed data
3. Special opportunity create/list/edit/archive services
4. General opportunity read/search/save services
5. Marketplace UI shell and search filters
6. Activity timeline and comments
7. Document storage policies and upload flow
8. AI scoring/explainer service
9. Recommendations
10. Company intelligence
11. Negotiation workspace
12. Trade documents
13. Enterprise collaboration and audit surfaces

## RTL UX Rules

- Arabic is native, not a translation afterthought.
- Use logical layout concepts: start/end, inline-start/inline-end.
- Runtime LTR support may be added later, but Arabic remains default.
- Charts and tables must be reviewed in RTL.

## AI Rules

- AI scores must store score, explainer, model name, timestamp, and source inputs summary.
- Never represent AI extracted external opportunities as verified user listings.
- AI output must pass schema validation before persistence.
- External leads need moderation gates before publishing.
