import { z } from "zod";
import { getServerEnv } from "@/lib/config";
import { ExternalServiceError, ValidationError } from "@/lib/errors";
import { createLogger } from "@/lib/logging";
import type { SpecialOpportunityRow } from "./types";

const scoringLogger = createLogger("marketplace-ai-scoring");

const aiScoreSchema = z.object({
  score: z.number().int().min(0).max(100),
  explainer_ar: z.string().min(20).max(1200),
  strengths_ar: z.array(z.string().min(2).max(180)).min(1).max(5),
  risks_ar: z.array(z.string().min(2).max(180)).min(1).max(5),
  next_actions_ar: z.array(z.string().min(2).max(180)).min(1).max(5),
});

interface OpenAIMessage {
  readonly role: "system" | "user";
  readonly content: string;
}

interface OpenAIChatRequest {
  readonly model: string;
  readonly messages: readonly OpenAIMessage[];
  readonly temperature: number;
  readonly response_format: {
    readonly type: "json_schema";
    readonly json_schema: {
      readonly name: string;
      readonly strict: boolean;
      readonly schema: Record<string, unknown>;
    };
  };
}

interface OpenAIChatResponse {
  readonly choices?: readonly {
    readonly message?: {
      readonly content?: string | null;
    };
  }[];
}

export interface OpportunityAiScore {
  readonly score: number;
  readonly explainer_ar: string;
  readonly strengths_ar: readonly string[];
  readonly risks_ar: readonly string[];
  readonly next_actions_ar: readonly string[];
}

/**
 * Validates unknown OpenAI JSON into a typed AI score payload.
 */
export function parseOpportunityAiScore(value: unknown): OpportunityAiScore {
  return aiScoreSchema.parse(value);
}

function buildPrompt(opportunity: SpecialOpportunityRow): string {
  return `
قيّم صحة وجودة فرصة تجارية في سوق B2B للشرق الأوسط.

السياق:
- المنصة عربية أولاً وتخدم العراق، تركيا، إيران، الخليج، والتجارة العالمية.
- هذه فرصة خاصة مملوكة لمستخدم، وليست فرصة عامة خارجية.
- المطلوب تقييم جودة الفرصة كإعلان تجاري قابل للتفاوض والتنفيذ.

بيانات الفرصة:
- النوع: ${opportunity.type}
- الحالة: ${opportunity.status}
- العنوان العربي: ${opportunity.title_ar}
- الوصف العربي: ${opportunity.description_ar}
- الدولة: ${opportunity.country ?? "غير محددة"}
- المدينة: ${opportunity.city ?? "غير محددة"}
- السعر: ${opportunity.price_amount ?? "غير محدد"} ${opportunity.currency}
- الكمية: ${opportunity.quantity ?? "غير محددة"} ${opportunity.unit ?? ""}
- شرط التجارة الدولية: ${opportunity.incoterm ?? "غير محدد"}

معايير التقييم:
1. وضوح العنوان والوصف.
2. اكتمال السعر والكمية والموقع.
3. قابلية التحقق التجاري.
4. جاذبية الفرصة للمشترين أو الموردين.
5. المخاطر المحتملة مثل نقص التفاصيل أو غموض المصدر.
6. ملاءمة الفرصة للتجارة عبر الحدود.

أعد النتيجة بالعربية فقط.`;
}

const jsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["score", "explainer_ar", "strengths_ar", "risks_ar", "next_actions_ar"],
  properties: {
    score: { type: "integer", minimum: 0, maximum: 100 },
    explainer_ar: { type: "string" },
    strengths_ar: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: { type: "string" },
    },
    risks_ar: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: { type: "string" },
    },
    next_actions_ar: {
      type: "array",
      minItems: 1,
      maxItems: 5,
      items: { type: "string" },
    },
  },
} satisfies Record<string, unknown>;

/**
 * Scores a special marketplace opportunity using OpenAI structured outputs.
 * The result is Arabic-only and must pass local Zod validation before persistence.
 */
export async function scoreSpecialOpportunityWithAI(
  opportunity: SpecialOpportunityRow,
): Promise<OpportunityAiScore> {
  const env = getServerEnv();
  if (!env.OPENAI_API_KEY) {
    throw new ValidationError("OPENAI_API_KEY is required for AI opportunity scoring");
  }

  const requestBody: OpenAIChatRequest = {
    model: env.OPENAI_MODEL,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "أنت محلل تجارة B2B خبير. قيّم الفرص التجارية بدقة، واكتب بالعربية الفصحى الواضحة، ولا تخترع معلومات غير موجودة.",
      },
      { role: "user", content: buildPrompt(opportunity) },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "special_opportunity_ai_score",
        strict: true,
        schema: jsonSchema,
      },
    },
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    scoringLogger.warn("OpenAI scoring request failed", { status: response.status });
    throw new ExternalServiceError("openai", "Opportunity scoring failed");
  }

  const payload = (await response.json()) as OpenAIChatResponse;
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new ExternalServiceError("openai", "Opportunity scoring returned no content");
  }

  const parsedJson = JSON.parse(content) as unknown;
  const parsed = aiScoreSchema.safeParse(parsedJson);
  if (!parsed.success) {
    scoringLogger.warn("OpenAI scoring response failed validation", {
      fieldErrors: parsed.error.flatten().fieldErrors,
    });
    throw new ExternalServiceError("openai", "Opportunity scoring response was invalid");
  }

  return parsed.data;
}
