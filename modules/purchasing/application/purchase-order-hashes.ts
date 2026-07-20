import { createHash } from "node:crypto";
import { canonicalJson } from "@/modules/evidence/application/canonical-json";
import type {
  ApprovedOrderBundle,
  ApprovalRecord,
  PurchaseOrderDraft,
  SupplierPurchaseOrder,
} from "../domain/contracts";

export function hashCanonical(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

export function recommendationHash(input: {
  sourceEvidenceHashes: readonly string[];
  mappingHash: string;
  budgetCents: number;
  lines: readonly {
    productId: string;
    supplierId: string;
    selectedPacks: number;
    packCostCents: number;
  }[];
}): string {
  return hashCanonical({
    sourceEvidenceHashes: [...input.sourceEvidenceHashes].sort(),
    mappingHash: input.mappingHash,
    budgetCents: input.budgetCents,
    lines: [...input.lines]
      .map((line) => ({ ...line }))
      .sort((a, b) =>
        `${a.supplierId}:${a.productId}`.localeCompare(`${b.supplierId}:${b.productId}`),
      ),
  });
}

export function purchaseOrderDraftHashSource(draft: PurchaseOrderDraft) {
  return {
    version: draft.version,
    status: draft.status,
    merchant: draft.merchant,
    fulfilment: draft.fulfilment,
    sourceEvidenceHashes: [...draft.sourceEvidenceHashes].sort(),
    mappingHash: draft.mappingHash,
    budgetCents: draft.budgetCents,
    recommendationHash: draft.recommendationHash,
    calculationVersion: draft.calculationVersion,
    optimiserVersion: draft.optimiserVersion,
    lines: [...draft.lines].sort((a, b) =>
      `${a.supplierId}:${a.productId}`.localeCompare(`${b.supplierId}:${b.productId}`),
    ),
    totalCostCents: draft.totalCostCents,
    remainingCents: draft.remainingCents,
    expectedMarginCents: draft.expectedMarginCents,
    createdAt: draft.createdAt,
  };
}

export function computePurchaseOrderDraftHash(draft: PurchaseOrderDraft): string {
  return hashCanonical(purchaseOrderDraftHashSource(draft));
}

export function verifyPurchaseOrderDraftHash(draft: PurchaseOrderDraft): boolean {
  return computePurchaseOrderDraftHash(draft) === draft.draftHash;
}

export function approvalHashSource(approval: ApprovalRecord) {
  return {
    status: approval.status,
    draftHash: approval.draftHash,
    recommendationHash: approval.recommendationHash,
    evidenceHashes: [...approval.evidenceHashes].sort(),
    mappingHash: approval.mappingHash,
    approvedBy: approval.approvedBy,
    approvedAt: approval.approvedAt,
    confirmationText: approval.confirmationText,
  };
}

export function computeApprovalHash(approval: ApprovalRecord): string {
  return hashCanonical(approvalHashSource(approval));
}

export function supplierPurchaseOrderHashSource(order: SupplierPurchaseOrder) {
  return {
    purchaseOrderNumber: order.purchaseOrderNumber,
    supplierId: order.supplierId,
    supplierName: order.supplierName,
    merchant: order.merchant,
    fulfilment: order.fulfilment,
    lines: [...order.lines].sort((a, b) => a.productId.localeCompare(b.productId)),
    subtotalCents: order.subtotalCents,
    totalCents: order.totalCents,
    currency: order.currency,
    draftHash: order.draftHash,
    approvalHash: order.approvalHash,
    generatedAt: order.generatedAt,
  };
}

export function computeSupplierPurchaseOrderHash(order: SupplierPurchaseOrder): string {
  return hashCanonical(supplierPurchaseOrderHashSource(order));
}

export function bundleHashSource(bundle: ApprovedOrderBundle) {
  return {
    version: bundle.version,
    draft: bundle.draft,
    approval: bundle.approval,
    purchaseOrders: [...bundle.purchaseOrders].sort((a, b) =>
      a.purchaseOrderNumber.localeCompare(b.purchaseOrderNumber),
    ),
    supplierMessages: [...bundle.supplierMessages].sort((a, b) =>
      a.supplierId.localeCompare(b.supplierId),
    ),
    auditEvents: [...bundle.auditEvents].sort((a, b) =>
      `${a.occurredAt}:${a.eventType}`.localeCompare(`${b.occurredAt}:${b.eventType}`),
    ),
    generatedAt: bundle.generatedAt,
  };
}

export function computeApprovedOrderBundleHash(bundle: ApprovedOrderBundle): string {
  return hashCanonical(bundleHashSource(bundle));
}
