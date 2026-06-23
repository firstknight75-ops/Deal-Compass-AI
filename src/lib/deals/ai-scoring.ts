import { z } from "zod";
import { getServerEnv } from "@/lib/config";
import { ExternalServiceError, ValidationError } from "@/lib/errors";
import { createLogger } from "@/lib/logging";
import type { DealPipelineRow } from "./types";

const logger = createLogger("deal-ai-scoring");

const dealHealthSchema = z.object({
  score: z.number().int().min(0).max(100),
  explainer_ar: z.string().min(20).max(1200),
  risks_ar: z.array(z.string().min(2).max(180)).min(1).max(5),
  next_actions_ar: z.array(z.string().min(2).max(180)).min(1).max(5),
});

export interface DealHealthScore {
  readonly score: number;
  readonly explainer_ar: string;
  readonly risks_ar: readonly string[];
  readonly next_actions_ar: readonly string[];
}

export function parseDealHealthScore(value: unknown): DealHealthScore {
  return dealHealthSchema.parse(value);
}

function buildPrompt(deal: DealPipelineRow): string {
  return `
قيّم صحة صفقة مبيعات B2B داخل خط أنابيب تجاري.

بيانات الصفقة:
- الاسم: ${deal.name}
- الشركة: ${deal.company ?? "غير محددة"}
- المرحلة: ${deal.stage}
- القيمة: ${deal.value_cents / 100} ${deal.currency}
- احتمالية الفوز الحالية: ${deal.probability}%
- تاريخ الإغلاق المتوقع: ${deal.expected_close_date ?? "غير محدد"}
- المالك: ${deal.owner ?? "غير محدد"}
- الملاحظات: ${deal.notes ?? "لا توجد"}

قيّم الصفقة بناءً على:
1. المرحلة مقابل احتمالية الفوز.
2. اكتمال معلومات الشركة والقيمة وتاريخ الإغلاق.
3. المخاطر التجارية والتشغيلية.
4. الإجراءات التالية التي تزيد احتمال الإغلاق.

اكتب بالعربية فقط ولا تخترع معلومات غير موجودة.`;
}

const jsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["score", "explainer_ar", "risks_ar", "next_actions_ar"],
  properties: {
    score: { type: "integer", minimum: 0, maximum: 100 },
    explainer_ar: { type: "string" },
    risks_ar: { type: "array", minItems: 1, maxItems: 5, items: { type: "string" } },
    next_actions_ar: { type: "array", minItems: 1, maxItems: 5, items: { type: "string" } },
  },
} satisfies Record<string, unknown>;

/**
 * Scores deal health using OpenAI structured outputs and validates the response.
 */
export async function scoreDealHealthWithAI(deal: DealPipelineRow): Promise<DealHealthScore> {
  const env = getServerEnv();
  if (!env.OPENAI_API_KEY) throw new ValidationError("OPENAI_API_KEY is required for deal scoring");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "أنت محلل صفقات B2B. قيّم صحة الصفقة بدقة وبالعربية فقط، ولا تخترع معلومات غير موجودة.",
        },
        { role: "user", content: buildPrompt(deal) },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "deal_health_score", strict: true, schema: jsonSchema },
      },
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    logger.warn("OpenAI deal scoring failed", { status: response.status });
    throw new ExternalServiceError("openai", "Deal health scoring failed");
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string | null } }[];
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new ExternalServiceError("openai", "Deal scoring returned no content");

  return parseDealHealthScore(JSON.parse(content) as unknown);
}
