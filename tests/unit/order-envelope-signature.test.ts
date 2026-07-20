import { describe, expect, it } from "vitest";
import { canonicalProducts } from "@/fixtures/catalogue/canonical-products";
import { createDemoAcceptedEvidenceBundle } from "@/fixtures/decision/demo-accepted-evidence";
import { buildPurchaseOrderDraft } from "@/modules/purchasing/application/build-purchase-order-draft";
import {
  signPurchaseOrderDraft,
  verifySignedPurchaseOrderDraft,
} from "@/modules/purchasing/application/order-envelope-signature";
import { buildAcceptedProductMappingSet } from "@/modules/reconciliation/application/build-accepted-product-mapping-set";
import { proposeProductMatches } from "@/modules/reconciliation/application/propose-product-matches";
import { extractSourceProductRecords } from "@/modules/reconciliation/application/source-product-records";

function draft() {
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
  return buildPurchaseOrderDraft({
    snapshots,
    mappingSet,
    budgetCents: 150_000,
    merchant: {
      displayName: "Thandi's Corner Shop",
      tradingAddress: "12 Demo Street, Khayelitsha, Cape Town",
      contactName: "Thandi Mokoena",
      contactPhone: "+27 82 555 0142",
    },
    fulfilment: {
      method: "collection",
      requestedDate: "2026-07-22",
      note: null,
    },
    now: "2026-07-18T12:00:00.000Z",
  });
}

describe("purchase-order signatures", () => {
  it("accepts the original signed draft and rejects browser-side mutation", () => {
    const envelope = signPurchaseOrderDraft(draft());
    expect(verifySignedPurchaseOrderDraft(envelope)).toBe(true);

    const tampered = {
      ...envelope,
      draft: { ...envelope.draft, totalCostCents: envelope.draft.totalCostCents + 1 },
    };
    expect(verifySignedPurchaseOrderDraft(tampered)).toBe(false);
  });
});
