# Rollback Runbook — 0006 Deal Pipeline AI and Documents

Date: 2026-06-23

## Safer Rollback

- Hide deal AI scoring controls.
- Hide deal document upload UI.
- Preserve uploaded documents and metadata for audit/recovery.

## Destructive Non-Production Rollback

```sql
DROP TABLE IF EXISTS public.deal_documents;
ALTER TABLE public.deals
  DROP COLUMN IF EXISTS ai_health_scored_at,
  DROP COLUMN IF EXISTS ai_health_explainer_ar,
  DROP COLUMN IF EXISTS ai_health_score;
```

Do not run destructive rollback in production without DBA approval.
