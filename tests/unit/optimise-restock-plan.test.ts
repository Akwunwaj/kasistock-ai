import { describe, expect, it } from "vitest";
import { optimiseRestockPlan } from "@/modules/optimisation/domain/optimise-restock-plan";
import type { RestockCandidate } from "@/modules/optimisation/domain/types";
import { cents } from "@/modules/shared/domain/money";

const candidates: RestockCandidate[] = [
  {
    productId: "bread",
    productName: "Bread",
    supplierId: "supplier-a",
    supplierName: "Supplier A",
    packQuantity: 12,
    packCostCents: cents(12_000),
    maximumPacks: 3,
    expectedMarginPerPackCents: cents(2_400),
    stockOutRiskScore: 5,
    essentialityScore: 5,
    expiryRiskScore: 1,
  },
  {
    productId: "cereal",
    productName: "Premium cereal",
    supplierId: "supplier-b",
    supplierName: "Supplier B",
    packQuantity: 6,
    packCostCents: cents(15_000),
    maximumPacks: 2,
    expectedMarginPerPackCents: cents(3_000),
    stockOutRiskScore: 1,
    essentialityScore: 1,
    expiryRiskScore: 2,
  },
];

describe("optimiseRestockPlan", () => {
  it("never spends more than the available budget", () => {
    const result = optimiseRestockPlan(candidates, 25_000);
    expect(result.totalCostCents).toBeLessThanOrEqual(result.budgetCents);
    expect(result.remainingCents).toBe(result.budgetCents - result.totalCostCents);
  });

  it("is deterministic for identical inputs", () => {
    expect(optimiseRestockPlan(candidates, 25_000)).toEqual(
      optimiseRestockPlan(candidates, 25_000),
    );
  });

  it("respects maximum pack quantities", () => {
    const result = optimiseRestockPlan(candidates, 100_000);
    for (const line of result.lines) {
      expect(line.selectedPacks).toBeLessThanOrEqual(line.maximumPacks);
      expect(line.selectedUnits).toBe(line.selectedPacks * line.packQuantity);
    }
  });
});
