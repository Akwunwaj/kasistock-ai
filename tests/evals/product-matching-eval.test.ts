import { describe, expect, it } from "vitest";
import cases from "@/evals/product-matching-cases.json";
import { canonicalProducts } from "@/fixtures/catalogue/canonical-products";
import { scoreProductMatchingCases } from "@/modules/reconciliation/application/score-product-matching";

describe("KasiStock AI product-matching evaluation", () => {
  it("meets the release threshold without unsafe automatic merges", () => {
    const result = scoreProductMatchingCases(cases, canonicalProducts);
    expect(result.totalCases).toBe(12);
    expect(result.productAccuracyPercent).toBeGreaterThanOrEqual(90);
    expect(result.authorityAccuracyPercent).toBeGreaterThanOrEqual(90);
    expect(result.unsafeAutoMergeCount).toBe(0);
  });
});
