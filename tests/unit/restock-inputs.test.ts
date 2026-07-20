import { describe, expect, it } from "vitest";
import { canonicalProducts } from "@/fixtures/catalogue/canonical-products";
import { createDemoAcceptedEvidenceBundle } from "@/fixtures/decision/demo-accepted-evidence";
import { buildAcceptedProductMappingSet } from "@/modules/reconciliation/application/build-accepted-product-mapping-set";
import { proposeProductMatches } from "@/modules/reconciliation/application/propose-product-matches";
import { extractSourceProductRecords } from "@/modules/reconciliation/application/source-product-records";
import {
  buildRestockInputs,
  RestockInputError,
} from "@/modules/restocking/application/build-restock-inputs";

function setup() {
  const snapshots = createDemoAcceptedEvidenceBundle();
  const proposals = proposeProductMatches(
    extractSourceProductRecords(snapshots),
    canonicalProducts,
  );
  const mappingSet = buildAcceptedProductMappingSet({
    snapshots,
    decisions: proposals.map((proposal) => ({
      sourceKey: proposal.source.sourceKey,
      productId: proposal.recommendedProductId ?? proposal.candidates[0]?.productId ?? null,
      decision: proposal.recommendedProductId ? ("accepted" as const) : ("corrected" as const),
      proposedProductId: proposal.recommendedProductId,
      method: proposal.candidates[0]?.method ?? ("unmatched" as const),
      confirmed: true as const,
      note: null,
    })),
    products: canonicalProducts,
    acceptedBy: "merchant",
    now: new Date("2026-07-18T11:00:00.000Z"),
  });
  return { snapshots, mappingSet };
}

describe("buildRestockInputs", () => {
  it("derives stock, velocity, cover, supplier costs and optimiser candidates from accepted evidence", () => {
    const { snapshots, mappingSet } = setup();
    const result = buildRestockInputs({ snapshots, mappingSet, products: canonicalProducts });
    const bread = result.calculations.find(
      (calculation) => calculation.productId === "bread-albany-white-700g",
    );

    expect(result.candidates).toHaveLength(4);
    expect(bread?.currentStockUnits).toBe(5);
    expect(bread?.averageDailySales).toBe(8);
    expect(bread?.daysOfCover).toBe(0.63);
    expect(bread?.cheapestOffer?.supplierName).toBe("Metro Cash & Carry");
    expect(bread?.cheapestOffer?.effectiveUnitCostCents).toBe(1599);
  });

  it("rejects a mapping set bound to a different evidence bundle", () => {
    const { snapshots, mappingSet } = setup();
    const reduced = snapshots.slice(0, -1);

    expect(() =>
      buildRestockInputs({ snapshots: reduced, mappingSet, products: canonicalProducts }),
    ).toThrowError(RestockInputError);
  });
});
