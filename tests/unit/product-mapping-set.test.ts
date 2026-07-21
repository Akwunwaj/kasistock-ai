import { describe, expect, it } from "vitest";
import { canonicalProducts } from "@/fixtures/catalogue/canonical-products";
import { createDemoAcceptedEvidenceBundle } from "@/fixtures/decision/demo-accepted-evidence";
import {
  buildAcceptedProductMappingSet,
  ProductMappingAcceptanceError,
} from "@/modules/reconciliation/application/build-accepted-product-mapping-set";
import { verifyAcceptedProductMappingSetHash } from "@/modules/reconciliation/application/product-mapping-hash";
import { proposeProductMatches } from "@/modules/reconciliation/application/propose-product-matches";
import { extractSourceProductRecords } from "@/modules/reconciliation/application/source-product-records";

function acceptedDecisions() {
  const snapshots = createDemoAcceptedEvidenceBundle();
  return proposeProductMatches(extractSourceProductRecords(snapshots), canonicalProducts).map(
    (proposal) => ({
      sourceKey: proposal.source.sourceKey,
      productId: proposal.recommendedProductId ?? proposal.candidates[0]?.productId ?? null,
      decision: proposal.recommendedProductId ? ("accepted" as const) : ("corrected" as const),
      proposedProductId: proposal.recommendedProductId,
      method: proposal.candidates[0]?.method ?? ("unmatched" as const),
      confirmed: true as const,
      note: "Human confirmed the identity mapping.",
    }),
  );
}

describe("buildAcceptedProductMappingSet", () => {
  it("creates a hash-bound mapping set for every source record", () => {
    const snapshots = createDemoAcceptedEvidenceBundle();
    const mappingSet = buildAcceptedProductMappingSet({
      snapshots,
      decisions: acceptedDecisions(),
      products: canonicalProducts,
      acceptedBy: "merchant",
      now: new Date("2026-07-18T11:00:00.000Z"),
    });

    expect(mappingSet.decisions).toHaveLength(16);
    expect(verifyAcceptedProductMappingSetHash(mappingSet)).toBe(true);
  });

  it("rejects incomplete human mapping authority", () => {
    const snapshots = createDemoAcceptedEvidenceBundle();
    expect(() =>
      buildAcceptedProductMappingSet({
        snapshots,
        decisions: acceptedDecisions().slice(0, 2),
        products: canonicalProducts,
        acceptedBy: "merchant",
      }),
    ).toThrowError(ProductMappingAcceptanceError);
  });

  it("identifies the source product when a mapping field is invalid", () => {
    const snapshots = createDemoAcceptedEvidenceBundle();
    const decisions = acceptedDecisions();
    const firstDecision = decisions[0];
    if (!firstDecision) throw new Error("Expected a demo mapping decision.");
    const invalidDecisions: unknown[] = [
      { ...firstDecision, confirmed: false },
      ...decisions.slice(1),
    ];

    try {
      buildAcceptedProductMappingSet({
        snapshots,
        decisions: invalidDecisions,
        products: canonicalProducts,
        acceptedBy: "merchant",
      });
      throw new Error("Expected mapping validation to fail.");
    } catch (error) {
      expect(error).toBeInstanceOf(ProductMappingAcceptanceError);
      const mappingError = error as ProductMappingAcceptanceError;
      expect(mappingError.code).toBe("INVALID_DECISION");
      expect(mappingError.sourceKey).toBe(firstDecision.sourceKey);
      expect(mappingError.field).toBe("confirmed");
    }
  });
});
