import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { scoreDealHealthWithAI } from "@/lib/deals/ai-scoring";
import type { DealDocumentRow, DealPipelineDatabase, DealPipelineRow } from "@/lib/deals/types";

export const DEAL_STAGES = ["lead", "qualified", "proposal", "negotiation", "won", "lost"] as const;
export type DealStage = (typeof DEAL_STAGES)[number];

type DealPipelineClient = SupabaseClient<DealPipelineDatabase>;

function asDealClient(client: unknown): DealPipelineClient {
  return client as DealPipelineClient;
}

const dealInput = z.object({
  name: z.string().min(1).max(200),
  company: z.string().max(200).optional().nullable(),
  stage: z.enum(DEAL_STAGES),
  value_cents: z.number().int().min(0),
  currency: z.string().length(3).default("USD"),
  probability: z.number().int().min(0).max(100),
  expected_close_date: z.string().nullable().optional(),
  owner: z.string().max(200).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

const idInput = z.object({ id: z.string().uuid() });

const dealDocumentInput = z.object({
  dealId: z.string().uuid(),
  storage_path: z.string().min(3).max(600),
  file_name: z.string().min(1).max(255),
  mime_type: z.string().min(3).max(160),
  file_size_bytes: z.number().int().positive().max(26_214_400),
  title_ar: z.string().max(220).optional().nullable(),
});

export const listDeals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = asDealClient(context.supabase);
    const { data, error } = await supabase
      .from("deals")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createDeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => dealInput.parse(d))
  .handler(async ({ data, context }) => {
    const supabase = asDealClient(context.supabase);
    const { data: row, error } = await supabase
      .from("deals")
      .insert({ ...data, user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateDeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), patch: dealInput.partial() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const supabase = asDealClient(context.supabase);
    const { data: row, error } = await supabase
      .from("deals")
      .update(data.patch)
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteDeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const supabase = asDealClient(context.supabase);
    const { error } = await supabase.from("deals").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const scoreDealHealth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idInput.parse(input))
  .handler(async ({ data, context }) => {
    const supabase = asDealClient(context.supabase);
    const { data: deal, error: fetchError } = await supabase
      .from("deals")
      .select("*")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .single();

    if (fetchError) throw new Error("تعذر تحميل الصفقة قبل التقييم");

    const result = await scoreDealHealthWithAI(deal as DealPipelineRow);
    const explainer = [
      result.explainer_ar,
      "",
      "المخاطر:",
      ...result.risks_ar.map((item) => `- ${item}`),
      "",
      "الإجراءات المقترحة:",
      ...result.next_actions_ar.map((item) => `- ${item}`),
    ].join("\n");

    const { data: row, error: updateError } = await supabase
      .from("deals")
      .update({
        ai_health_score: result.score,
        ai_health_explainer_ar: explainer,
        ai_health_scored_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .select()
      .single();

    if (updateError) throw new Error("تعذر حفظ تقييم الصفقة");
    return row as DealPipelineRow;
  });

export const registerDealDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => dealDocumentInput.parse(input))
  .handler(async ({ data, context }) => {
    const supabase = asDealClient(context.supabase);
    const { data: row, error } = await supabase
      .from("deal_documents")
      .insert({
        deal_id: data.dealId,
        user_id: context.userId,
        bucket_id: "trade-documents",
        storage_path: data.storage_path,
        file_name: data.file_name,
        mime_type: data.mime_type,
        file_size_bytes: data.file_size_bytes,
        title_ar: data.title_ar,
      })
      .select()
      .single();

    if (error) throw new Error("تعذر تسجيل مستند الصفقة");
    return row as DealDocumentRow;
  });

export const listDealDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idInput.parse(input))
  .handler(async ({ data, context }) => {
    const supabase = asDealClient(context.supabase);
    const { data: rows, error } = await supabase
      .from("deal_documents")
      .select(
        "id, deal_id, user_id, bucket_id, storage_path, file_name, mime_type, file_size_bytes, title_ar, created_at, deleted_at",
      )
      .eq("deal_id", data.id)
      .eq("user_id", context.userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) throw new Error("تعذر تحميل مستندات الصفقة");
    return (rows ?? []) as DealDocumentRow[];
  });

export const createDealDocumentSignedUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => idInput.parse(input))
  .handler(async ({ data, context }) => {
    const supabase = asDealClient(context.supabase);
    const { data: document, error: documentError } = await supabase
      .from("deal_documents")
      .select("id, bucket_id, storage_path")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .is("deleted_at", null)
      .single();

    if (documentError) throw new Error("تعذر تحميل المستند");

    const { data: signed, error: signedError } = await supabase.storage
      .from(document.bucket_id)
      .createSignedUrl(document.storage_path, 300);

    if (signedError || !signed?.signedUrl) throw new Error("تعذر إنشاء رابط المستند");
    return { signedUrl: signed.signedUrl, expiresInSeconds: 300 };
  });
