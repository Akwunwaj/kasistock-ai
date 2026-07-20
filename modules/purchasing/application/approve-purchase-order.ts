import { randomUUID } from "node:crypto";
import type { AuditEvent } from "@/modules/audit/domain/audit-event";
import {
  approvedOrderBundleSchema,
  approvalRecordSchema,
  supplierMessageSchema,
  supplierPurchaseOrderSchema,
  type ApprovedOrderBundle,
  type ApprovalRecord,
  type PurchaseOrderDraft,
  type SupplierMessage,
  type SupplierPurchaseOrder,
} from "../domain/contracts";
import {
  computeApprovalHash,
  computeApprovedOrderBundleHash,
  computeSupplierPurchaseOrderHash,
  verifyPurchaseOrderDraftHash,
} from "./purchase-order-hashes";

export const APPROVAL_CONFIRMATION_TEXT =
  "I confirm that I reviewed this order and authorise the supplier purchase orders shown.";

export class PurchaseOrderApprovalError extends Error {
  constructor(
    public readonly code: "INVALID_DRAFT_HASH" | "APPROVAL_NOT_CONFIRMED",
    message: string,
  ) {
    super(message);
    this.name = "PurchaseOrderApprovalError";
  }
}

interface ApproveInput {
  draft: PurchaseOrderDraft;
  approvedBy: string;
  confirmed: true;
  now?: string;
  ids?: {
    approvalId?: string;
    bundleId?: string;
    purchaseOrderIds?: readonly string[];
    auditEventIds?: readonly string[];
  };
}

export function approvePurchaseOrder(input: ApproveInput): ApprovedOrderBundle {
  if (input.confirmed !== true) {
    throw new PurchaseOrderApprovalError(
      "APPROVAL_NOT_CONFIRMED",
      "Explicit merchant confirmation is required before purchase orders are generated.",
    );
  }
  if (!verifyPurchaseOrderDraftHash(input.draft)) {
    throw new PurchaseOrderApprovalError(
      "INVALID_DRAFT_HASH",
      "The purchase-order draft failed its integrity check.",
    );
  }

  const approvedAt = input.now ?? new Date().toISOString();
  const approvalInitial = approvalRecordSchema.parse({
    approvalId: input.ids?.approvalId ?? randomUUID(),
    status: "approved",
    draftHash: input.draft.draftHash,
    recommendationHash: input.draft.recommendationHash,
    evidenceHashes: [...input.draft.sourceEvidenceHashes].sort(),
    mappingHash: input.draft.mappingHash,
    approvedBy: input.approvedBy,
    approvedAt,
    confirmationText: APPROVAL_CONFIRMATION_TEXT,
    approvalHash: "0".repeat(64),
  });
  const approval = approvalRecordSchema.parse({
    ...approvalInitial,
    approvalHash: computeApprovalHash(approvalInitial),
  });

  const purchaseOrders = buildSupplierPurchaseOrders(
    input.draft,
    approval,
    approvedAt,
    input.ids?.purchaseOrderIds,
  );
  const supplierMessages = purchaseOrders.map(buildSupplierMessage);
  const auditEvents = buildAuditEvents(
    input.draft,
    approval,
    purchaseOrders,
    approvedAt,
    input.ids?.auditEventIds,
  );

  const initial = approvedOrderBundleSchema.parse({
    bundleId: input.ids?.bundleId ?? randomUUID(),
    version: 1,
    draft: input.draft,
    approval,
    purchaseOrders,
    supplierMessages,
    auditEvents,
    generatedAt: approvedAt,
    bundleHash: "0".repeat(64),
  });
  return approvedOrderBundleSchema.parse({
    ...initial,
    bundleHash: computeApprovedOrderBundleHash(initial),
  });
}

function buildSupplierPurchaseOrders(
  draft: PurchaseOrderDraft,
  approval: ApprovalRecord,
  generatedAt: string,
  purchaseOrderIds: readonly string[] | undefined,
): SupplierPurchaseOrder[] {
  const groups = new Map<string, PurchaseOrderDraft["lines"]>();
  for (const line of draft.lines) {
    const current = groups.get(line.supplierId) ?? [];
    groups.set(line.supplierId, [...current, line]);
  }

  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([supplierId, lines], index) => {
      const supplierName = lines[0]?.supplierName;
      if (!supplierName) throw new Error("Supplier group unexpectedly contained no lines.");
      const date = johannesburgDateStamp(generatedAt);
      const initial = supplierPurchaseOrderSchema.parse({
        purchaseOrderId: purchaseOrderIds?.[index] ?? randomUUID(),
        purchaseOrderNumber: `KSI-${date}-${supplierCode(supplierId)}-${String(index + 1).padStart(2, "0")}`,
        supplierId,
        supplierName,
        merchant: draft.merchant,
        fulfilment: draft.fulfilment,
        lines: lines.map((line) => ({
          productId: line.productId,
          productName: line.productName,
          packQuantity: line.packQuantity,
          selectedPacks: line.selectedPacks,
          selectedUnits: line.selectedUnits,
          packCostCents: line.packCostCents,
          lineCostCents: line.lineCostCents,
        })),
        subtotalCents: lines.reduce((total, line) => total + line.lineCostCents, 0),
        totalCents: lines.reduce((total, line) => total + line.lineCostCents, 0),
        currency: "ZAR",
        draftHash: draft.draftHash,
        approvalHash: approval.approvalHash,
        generatedAt,
        purchaseOrderHash: "0".repeat(64),
      });
      return supplierPurchaseOrderSchema.parse({
        ...initial,
        purchaseOrderHash: computeSupplierPurchaseOrderHash(initial),
      });
    });
}

function buildSupplierMessage(order: SupplierPurchaseOrder): SupplierMessage {
  const lines = order.lines
    .map(
      (line) =>
        `- ${line.productName}: ${line.selectedPacks} pack(s), ${line.selectedUnits} units - ${formatCents(line.lineCostCents)}`,
    )
    .join("\n");
  return supplierMessageSchema.parse({
    supplierId: order.supplierId,
    supplierName: order.supplierName,
    purchaseOrderId: order.purchaseOrderId,
    channel: "whatsapp_ready",
    body: `Hello ${order.supplierName},\n\nPlease prepare purchase order ${order.purchaseOrderNumber} for ${order.merchant.displayName}.\n\n${lines}\n\nOrder total: ${formatCents(order.totalCents)}\nFulfilment: ${order.fulfilment.method} on ${order.fulfilment.requestedDate}.\n\nPlease confirm stock availability and the final total before fulfilment.`,
  });
}

function buildAuditEvents(
  draft: PurchaseOrderDraft,
  approval: ApprovalRecord,
  purchaseOrders: readonly SupplierPurchaseOrder[],
  occurredAt: string,
  ids: readonly string[] | undefined,
): AuditEvent[] {
  const events: Array<Omit<AuditEvent, "id">> = [
    {
      scenarioId: draft.draftId,
      actorType: "system",
      actorId: "evidence-authority",
      eventType: "ACCEPTED_EVIDENCE_BOUND",
      occurredAt: draft.createdAt,
      inputVersion: null,
      outputVersion: draft.sourceEvidenceHashes.join(","),
      metadata: { evidenceSnapshotCount: draft.sourceEvidenceHashes.length },
    },
    {
      scenarioId: draft.draftId,
      actorType: "merchant",
      actorId: draft.merchant.contactName,
      eventType: "PRODUCT_MAPPING_SET_ACCEPTED",
      occurredAt: draft.createdAt,
      inputVersion: draft.sourceEvidenceHashes.join(","),
      outputVersion: draft.mappingHash,
      metadata: { mappingHash: draft.mappingHash },
    },
    {
      scenarioId: draft.draftId,
      actorType: "system",
      actorId: "restock-engine",
      eventType: "RESTOCK_SCENARIO_CALCULATED",
      occurredAt: draft.createdAt,
      inputVersion: draft.mappingHash,
      outputVersion: draft.recommendationHash,
      metadata: {
        budgetCents: draft.budgetCents,
        optimiserVersion: draft.optimiserVersion,
      },
    },
    {
      scenarioId: draft.draftId,
      actorType: "system",
      actorId: "restock-engine",
      eventType: "RECOMMENDATION_DRAFT_LOCKED",
      occurredAt: draft.createdAt,
      inputVersion: draft.recommendationHash,
      outputVersion: draft.draftHash,
      metadata: {
        totalCostCents: draft.totalCostCents,
        lineCount: draft.lines.length,
      },
    },
    {
      scenarioId: draft.draftId,
      actorType: "merchant",
      actorId: approval.approvedBy,
      eventType: "PURCHASE_ORDER_APPROVED",
      occurredAt,
      inputVersion: draft.draftHash,
      outputVersion: approval.approvalHash,
      metadata: { confirmationText: approval.confirmationText },
    },
    {
      scenarioId: draft.draftId,
      actorType: "system",
      actorId: "purchase-order-service",
      eventType: "SUPPLIER_PURCHASE_ORDERS_GENERATED",
      occurredAt,
      inputVersion: approval.approvalHash,
      outputVersion: purchaseOrders.map((order) => order.purchaseOrderHash).join(","),
      metadata: {
        purchaseOrderCount: purchaseOrders.length,
        purchaseOrderNumbers: purchaseOrders.map((order) => order.purchaseOrderNumber),
      },
    },
  ];
  return events.map((event, index) => ({ id: ids?.[index] ?? randomUUID(), ...event }));
}

function johannesburgDateStamp(value: string): string {
  const parts = new Intl.DateTimeFormat("en-ZA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((candidate) => candidate.type === type)?.value ?? "";
  return `${part("year")}${part("month")}${part("day")}`;
}

function supplierCode(supplierId: string): string {
  return supplierId
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 18);
}

function formatCents(value: number): string {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(value / 100);
}
