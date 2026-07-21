import { describe, expect, it } from "vitest";
import { canonicalProducts } from "@/fixtures/catalogue/canonical-products";
import { createDemoAcceptedEvidenceBundle } from "@/fixtures/decision/demo-accepted-evidence";
import { approvePurchaseOrder } from "@/modules/purchasing/application/approve-purchase-order";
import {
  buildPurchaseOrderDraft,
  PurchaseOrderDraftError,
} from "@/modules/purchasing/application/build-purchase-order-draft";
import {
  computeApprovedOrderBundleHash,
  computeSupplierPurchaseOrderHash,
  verifyPurchaseOrderDraftHash,
} from "@/modules/purchasing/application/purchase-order-hashes";
import { buildAcceptedProductMappingSet } from "@/modules/reconciliation/application/build-accepted-product-mapping-set";
import { proposeProductMatches } from "@/modules/reconciliation/application/propose-product-matches";
import { extractSourceProductRecords } from "@/modules/reconciliation/application/source-product-records";

function authoritySetup() {
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
      note: "Human confirmed the identity mapping.",
    })),
    products: canonicalProducts,
    acceptedBy: "Thandi Mokoena",
    now: new Date("2026-07-18T11:00:00.000Z"),
  });
  return { snapshots, mappingSet };
}

function draftInput() {
  const authority = authoritySetup();
  return {
    ...authority,
    budgetCents: 150_000,
    merchant: {
      displayName: "Thandi's Corner Shop",
      tradingAddress: "12 Demo Street, Khayelitsha, Cape Town",
      contactName: "Thandi Mokoena",
      contactPhone: "+27 82 555 0142",
    },
    fulfilment: {
      method: "collection" as const,
      requestedDate: "2026-07-22",
      note: "Confirm stock availability before collection.",
    },
    now: "2026-07-18T12:00:00.000Z",
    draftId: "55555555-5555-4555-8555-555555555555",
  };
}

describe("approval-controlled purchase-order workflow", () => {
  it("rebuilds a budget-safe draft from accepted authority and locks its hash", () => {
    const draft = buildPurchaseOrderDraft(draftInput());

    expect(draft.lines.length).toBeGreaterThan(0);
    expect(draft.totalCostCents).toBeLessThanOrEqual(draft.budgetCents);
    expect(draft.remainingCents).toBe(draft.budgetCents - draft.totalCostCents);
    expect(verifyPurchaseOrderDraftHash(draft)).toBe(true);
  });

  it("rejects an edited quantity above the accepted demand ceiling", () => {
    const base = buildPurchaseOrderDraft(draftInput());
    const first = base.lines[0];
    expect(first).toBeDefined();

    expect(() =>
      buildPurchaseOrderDraft({
        ...draftInput(),
        selections: [
          {
            productId: first!.productId,
            supplierId: first!.supplierId,
            selectedPacks: first!.maximumPacks + 1,
          },
        ],
      }),
    ).toThrowError(PurchaseOrderDraftError);
  });

  it("creates supplier-specific approved orders, messages, hashes and audit records", () => {
    const draft = buildPurchaseOrderDraft(draftInput());
    const bundle = approvePurchaseOrder({
      draft,
      approvedBy: "Thandi Mokoena",
      confirmed: true,
      now: "2026-07-18T12:05:00.000Z",
      ids: {
        approvalId: "66666666-6666-4666-8666-666666666666",
        bundleId: "77777777-7777-4777-8777-777777777777",
        purchaseOrderIds: [
          "88888888-8888-4888-8888-888888888888",
          "99999999-9999-4999-8999-999999999999",
        ],
        auditEventIds: [
          "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
          "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
          "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3",
        ],
      },
    });

    expect(bundle.purchaseOrders.length).toBeGreaterThanOrEqual(1);
    expect(bundle.supplierMessages).toHaveLength(bundle.purchaseOrders.length);
    expect(bundle.auditEvents).toHaveLength(6);
    expect(computeApprovedOrderBundleHash(bundle)).toBe(bundle.bundleHash);
    for (const order of bundle.purchaseOrders) {
      expect(computeSupplierPurchaseOrderHash(order)).toBe(order.purchaseOrderHash);
      expect(order.totalCents).toBe(
        order.lines.reduce((total, line) => total + line.lineCostCents, 0),
      );
    }
  });

  it("creates distinct purchase-order numbers for different drafts approved on the same day", () => {
    const firstDraft = buildPurchaseOrderDraft(draftInput());
    const secondDraft = buildPurchaseOrderDraft({
      ...draftInput(),
      now: "2026-07-18T13:00:00.000Z",
      draftId: "55555555-5555-4555-8555-555555555556",
    });
    const first = approvePurchaseOrder({
      draft: firstDraft,
      approvedBy: "Thandi Mokoena",
      confirmed: true,
      now: "2026-07-18T14:00:00.000Z",
    });
    const second = approvePurchaseOrder({
      draft: secondDraft,
      approvedBy: "Thandi Mokoena",
      confirmed: true,
      now: "2026-07-18T15:00:00.000Z",
    });

    expect(firstDraft.draftHash).not.toBe(secondDraft.draftHash);
    expect(first.purchaseOrders.map((order) => order.purchaseOrderNumber)).not.toEqual(
      second.purchaseOrders.map((order) => order.purchaseOrderNumber),
    );
  });

  it("rejects a draft modified after the server locked it", () => {
    const draft = buildPurchaseOrderDraft(draftInput());
    const tampered = { ...draft, totalCostCents: draft.totalCostCents + 100 };

    expect(() =>
      approvePurchaseOrder({
        draft: tampered,
        approvedBy: "Thandi Mokoena",
        confirmed: true,
      }),
    ).toThrowError("The purchase-order draft failed its integrity check.");
  });
});
