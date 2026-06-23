import { describe, expect, it } from "vitest";
import { parseOpportunityAiScore } from "./ai-scoring";

describe("parseOpportunityAiScore", () => {
  it("accepts a valid Arabic structured scoring payload", () => {
    const parsed = parseOpportunityAiScore({
      score: 82,
      explainer_ar: "الفرصة واضحة وتحتوي على معلومات كافية حول المنتج والسوق المستهدف.",
      strengths_ar: ["عنوان واضح", "وصف مناسب"],
      risks_ar: ["تحتاج تفاصيل أكثر عن الشحن"],
      next_actions_ar: ["إضافة صور أو مستندات داعمة"],
    });

    expect(parsed.score).toBe(82);
    expect(parsed.strengths_ar).toContain("عنوان واضح");
  });

  it("rejects scores outside the allowed 0-100 range", () => {
    expect(() =>
      parseOpportunityAiScore({
        score: 101,
        explainer_ar: "هذه نتيجة يجب رفضها لأنها خارج النطاق المسموح.",
        strengths_ar: ["قوة"],
        risks_ar: ["مخاطرة"],
        next_actions_ar: ["إجراء"],
      }),
    ).toThrow();
  });
});
