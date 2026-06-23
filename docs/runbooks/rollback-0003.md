# Rollback Runbook — 0003 Trade Categories Seed

Date: 2026-06-23

## Scope

Migration: `supabase/migrations/0003_trade_categories_seed.sql`

## Safe Rollback

Do not delete categories in production if opportunities reference them. Instead set `is_active = false` for categories that should be hidden.

```sql
UPDATE public.trade_categories
SET is_active = false, updated_at = NOW()
WHERE slug IN (
  'agriculture-food',
  'construction-materials',
  'machinery-equipment',
  'chemicals-plastics',
  'textiles-apparel',
  'medical-healthcare',
  'electronics-electrical',
  'logistics-transport',
  'energy-fuel',
  'business-services'
);
```

## Destructive Non-Production Rollback

```sql
DELETE FROM public.trade_categories
WHERE slug IN (
  'agriculture-food',
  'construction-materials',
  'machinery-equipment',
  'chemicals-plastics',
  'textiles-apparel',
  'medical-healthcare',
  'electronics-electrical',
  'logistics-transport',
  'energy-fuel',
  'business-services'
);
```
