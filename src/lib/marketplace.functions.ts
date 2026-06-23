import { createServerFn } from "@tanstack/react-start";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getServerEnv } from "@/lib/config";
import {
  SPECIAL_OPPORTUNITY_TYPES,
  type GeneralOpportunityRow,
  type MarketplaceDatabase,
  type OpportunityActivityRow,
  type SpecialOpportunityRow,
  type TradeCategoryRow,
} from "@/lib/marketplace/types";

const marketplaceFilterSchema = z.object({
  query: z.string().max(120).optional(),
  country: z.string().max(80).optional(),
  categoryId: z.string().uuid().optional(),
  limit: z.number().int().min(1).max(50).default(24),
});

const specialOpportunityInput = z.object({
  type: z.enum(SPECIAL_OPPORTUNITY_TYPES),
  title_ar: z.string().min(3).max(220),
  title_en: z.string().max(220).optional().nullable(),
  description_ar: z.string().min(10).max(5000),
  description_en: z.string().max(5000).optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  country: z.string().max(80).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  price_amount: z.number().nonnegative().optional().nullable(),
  currency: z.string().length(3).default("USD"),
  quantity: z.number().nonnegative().optional().nullable(),
  unit: z.string().max(40).optional().nullable(),
  incoterm: z.string().max(20).optional().nullable(),
  publish: z.boolean().default(true),
});

const idInput = z.object({ id: z.string().uuid() });

const specialUpdateInput = z.object({
  id: z.string().uuid(),
  title_ar: z.string().min(3).max(220).optional(),
  description_ar: z.string().min(10).max(5000).optional(),
  category_id: z.string().uuid().optional().nullable(),
  country: z.string().max(80).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  price_amount: z.number().nonnegative().optional().nullable(),
  currency: z.string().length(3).optional(),
  quantity: z.number().nonnegative().optional().nullable(),
  unit: z.string().max(40).optional().nullable(),
  incoterm: z.string().max(20).optional().nullable(),
});

const commentInput = z.object({
  opportunityId: z.string().uuid(),
  body_ar: z.string().min(1).max(2000),
});

type MarketplaceClient = SupabaseClient<MarketplaceDatabase>;

let publicMarketplaceClient: MarketplaceClient | undefined;

function asMarketplaceClient(client: unknown): MarketplaceClient {
  return client as MarketplaceClient;
}

function getPublicMarketplaceClient(): MarketplaceClient {
  if (publicMarketplaceClient) return publicMarketplaceClient;

  const env = getServerEnv();
  publicMarketplaceClient = createClient<MarketplaceDatabase>(
    env.SUPABASE_URL,
    env.SUPABASE_PUBLISHABLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
  return publicMarketplaceClient;
}

/**
 * Lists active Arabic-first trade categories for marketplace filters.
 */
export const listTradeCategories = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = getPublicMarketplaceClient();
  const { data, error } = await supabase
    .from("trade_categories")
    .select("id, slug, name_ar, name_en, description_ar, icon, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw new Error("تعذر تحميل التصنيفات");
  return (data ?? []) as TradeCategoryRow[];
});

/**
 * Lists published external general opportunities. These are read-only market-intelligence leads.
 */
export const listGeneralOpportunities = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => marketplaceFilterSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    const supabase = getPublicMarketplaceClient();
    let query = supabase
      .from("general_opportunities")
      .select(
        "id, title, title_ar, description, summary_ar, detected_language, country, city, category_id, source_name, source_url, confidence_score, risk_score, ai_explainer_ar, published_at, expires_at",
      )
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(data.limit);

    if (data.country) query = query.eq("country", data.country);
    if (data.categoryId) query = query.eq("category_id", data.categoryId);
    if (data.query) query = query.textSearch("search_vector", data.query, { type: "websearch" });

    const { data: rows, error } = await query;
    if (error) throw new Error("تعذر تحميل الفرص العامة");
    return (rows ?? []) as GeneralOpportunityRow[];
  });

/**
 * Lists published user-owned special marketplace opportunities.
 */
export const listSpecialOpportunities = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => marketplaceFilterSchema.parse(input ?? {}))
  .handler(async ({ data }) => {
    const supabase = getPublicMarketplaceClient();
    let query = supabase
      .from("special_opportunities")
      .select(
        "id, owner_user_id, organization_id, type, status, title_ar, title_en, description_ar, description_en, category_id, country, city, price_amount, currency, quantity, unit, incoterm, ai_score, ai_explainer_ar, published_at, created_at, updated_at",
      )
      .in("status", ["published", "negotiating", "active", "completed"])
      .is("deleted_at", null)
      .order("published_at", { ascending: false })
      .limit(data.limit);

    if (data.country) query = query.eq("country", data.country);
    if (data.categoryId) query = query.eq("category_id", data.categoryId);
    if (data.query) query = query.textSearch("search_vector", data.query, { type: "websearch" });

    const { data: rows, error } = await query;
    if (error) throw new Error("تعذر تحميل فرص السوق");
    return (rows ?? []) as SpecialOpportunityRow[];
  });

/**
 * Creates a user-owned special marketplace opportunity.
 */
export const createSpecialOpportunity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => specialOpportunityInput.parse(input))
  .handler(async ({ data, context }) => {
    const supabase = asMarketplaceClient(context.supabase);
    const now = new Date().toISOString();
    const { data: row, error } = await supabase
      .from("special_opportunities")
      .insert({
        owner_user_id: context.userId,
        type: data.type,
        status: data.publish ? "published" : "draft",
        title_ar: data.title_ar,
        title_en: data.title_en,
        description_ar: data.description_ar,
        description_en: data.description_en,
        category_id: data.category_id,
        country: data.country,
        city: data.city,
        price_amount: data.price_amount,
        currency: data.currency,
        quantity: data.quantity,
        unit: data.unit,
        incoterm: data.incoterm,
        published_at: data.publish ? now : null,
      })
      .select()
      .single();

    if (error) throw new Error("تعذر إنشاء فرصة السوق");

    await supabase.from("opportunity_activities").insert({
      opportunity_kind: "special",
      special_opportunity_id: row.id,
      actor_user_id: context.userId,
      activity_type: data.publish ? "published" : "created",
      body_ar: data.publish ? "تم نشر الفرصة الخاصة." : "تم إنشاء مسودة فرصة خاصة.",
    });

    return row as SpecialOpportunityRow;
  });

/**
 * Saves a read-only general opportunity to the authenticated user's watchlist.
 */
export const saveGeneralOpportunity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idInput.parse(input))
  .handler(async ({ data, context }) => {
    const supabase = asMarketplaceClient(context.supabase);
    const { error } = await supabase
      .from("saved_general_opportunities")
      .upsert({ user_id: context.userId, opportunity_id: data.id });

    if (error) throw new Error("تعذر حفظ الفرصة");
    return { ok: true };
  });

/**
 * Favorites a user-owned special opportunity for the authenticated user.
 */
export const favoriteSpecialOpportunity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idInput.parse(input))
  .handler(async ({ data, context }) => {
    const supabase = asMarketplaceClient(context.supabase);
    const { error } = await supabase
      .from("favorite_special_opportunities")
      .upsert({ user_id: context.userId, opportunity_id: data.id });

    if (error) throw new Error("تعذر إضافة الفرصة إلى المفضلة");
    return { ok: true };
  });

/**
 * Fetches a single special opportunity that is visible to the authenticated user.
 */
export const getSpecialOpportunity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idInput.parse(input))
  .handler(async ({ data, context }) => {
    const supabase = asMarketplaceClient(context.supabase);
    const { data: row, error } = await supabase
      .from("special_opportunities")
      .select(
        "id, owner_user_id, organization_id, type, status, title_ar, title_en, description_ar, description_en, category_id, country, city, price_amount, currency, quantity, unit, incoterm, ai_score, ai_explainer_ar, published_at, created_at, updated_at",
      )
      .eq("id", data.id)
      .single();

    if (error) throw new Error("تعذر تحميل تفاصيل الفرصة");
    return row as SpecialOpportunityRow;
  });

/**
 * Updates an authenticated user's special opportunity.
 */
export const updateSpecialOpportunity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => specialUpdateInput.parse(input))
  .handler(async ({ data, context }) => {
    const supabase = asMarketplaceClient(context.supabase);
    const { id, ...patch } = data;
    const { data: row, error } = await supabase
      .from("special_opportunities")
      .update(patch)
      .eq("id", id)
      .eq("owner_user_id", context.userId)
      .select()
      .single();

    if (error) throw new Error("تعذر تحديث الفرصة");

    await supabase.from("opportunity_activities").insert({
      opportunity_kind: "special",
      special_opportunity_id: id,
      actor_user_id: context.userId,
      activity_type: "updated",
      body_ar: "تم تحديث بيانات الفرصة.",
    });

    return row as SpecialOpportunityRow;
  });

/**
 * Archives an authenticated user's special opportunity without deleting data.
 */
export const archiveSpecialOpportunity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idInput.parse(input))
  .handler(async ({ data, context }) => {
    const supabase = asMarketplaceClient(context.supabase);
    const { error } = await supabase
      .from("special_opportunities")
      .update({ status: "archived", archived_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("owner_user_id", context.userId);

    if (error) throw new Error("تعذر أرشفة الفرصة");

    await supabase.from("opportunity_activities").insert({
      opportunity_kind: "special",
      special_opportunity_id: data.id,
      actor_user_id: context.userId,
      activity_type: "archived",
      body_ar: "تمت أرشفة الفرصة.",
    });

    return { ok: true };
  });

/**
 * Lists the activity timeline for a special opportunity.
 */
export const listSpecialOpportunityActivities = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idInput.parse(input))
  .handler(async ({ data, context }) => {
    const supabase = asMarketplaceClient(context.supabase);
    const { data: rows, error } = await supabase
      .from("opportunity_activities")
      .select(
        "id, opportunity_kind, general_opportunity_id, special_opportunity_id, actor_user_id, activity_type, body_ar, metadata, created_at",
      )
      .eq("opportunity_kind", "special")
      .eq("special_opportunity_id", data.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw new Error("تعذر تحميل سجل النشاط");
    return (rows ?? []) as OpportunityActivityRow[];
  });

/**
 * Adds an Arabic comment to a special opportunity timeline.
 */
export const addSpecialOpportunityComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => commentInput.parse(input))
  .handler(async ({ data, context }) => {
    const supabase = asMarketplaceClient(context.supabase);
    const { data: row, error } = await supabase
      .from("opportunity_activities")
      .insert({
        opportunity_kind: "special",
        special_opportunity_id: data.opportunityId,
        actor_user_id: context.userId,
        activity_type: "commented",
        body_ar: data.body_ar,
      })
      .select()
      .single();

    if (error) throw new Error("تعذر إضافة التعليق");
    return row as OpportunityActivityRow;
  });

/**
 * Fetches a single published general opportunity. General opportunities are external read-only leads.
 */
export const getGeneralOpportunity = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => idInput.parse(input))
  .handler(async ({ data }) => {
    const supabase = getPublicMarketplaceClient();
    const { data: row, error } = await supabase
      .from("general_opportunities")
      .select(
        "id, title, title_ar, description, summary_ar, detected_language, country, city, category_id, source_name, source_url, confidence_score, risk_score, ai_explainer_ar, published_at, expires_at",
      )
      .eq("id", data.id)
      .eq("status", "published")
      .single();

    if (error) throw new Error("تعذر تحميل تفاصيل الفرصة العامة");
    return row as GeneralOpportunityRow;
  });

/**
 * Lists public activity records attached to a general opportunity.
 */
export const listGeneralOpportunityActivities = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => idInput.parse(input))
  .handler(async ({ data }) => {
    const supabase = getPublicMarketplaceClient();
    const { data: rows, error } = await supabase
      .from("opportunity_activities")
      .select(
        "id, opportunity_kind, general_opportunity_id, special_opportunity_id, actor_user_id, activity_type, body_ar, metadata, created_at",
      )
      .eq("opportunity_kind", "general")
      .eq("general_opportunity_id", data.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw new Error("تعذر تحميل سجل الفرصة العامة");
    return (rows ?? []) as OpportunityActivityRow[];
  });
