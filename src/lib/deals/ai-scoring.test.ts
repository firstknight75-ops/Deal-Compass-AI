import { describe, expect, it } from "vitest";
import { parseDealHealthScore } from "./ai-scoring";

describe("parseDealHealthScore", () => {
  it("accepts a valid deal health payload", () => {
    const parsed = parseDealHealthScore({
      score: 74,
      explainer_ar: "الصفقة جيدة لكنها تحتاج إلى تفاصيل إضافية حول تاريخ الإغلاق والخطوة التالية.",
      risks_ar: ["احتمالية الفوز غير مدعومة بملاحظات كافية"],
      next_actions_ar: ["تحديد موعد متابعة واضح مع العميل"],
    });

    expect(parsed.score).toBe(74);
  });

  it("rejects missing Arabic explainer", () => {
    expect(() =>
      parseDealHealthScore({ score: 70, risks_ar: ["مخاطرة"], next_actions_ar: ["إجراء"] }),
    ).toThrow();
  });
});
