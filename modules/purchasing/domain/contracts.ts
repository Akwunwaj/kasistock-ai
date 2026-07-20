import { z } from "zod";
import { auditEventSchema } from "@/modules/audit/domain/audit-event";

export const merchantOrderProfileSchema = z.object({
  displayName: z.string().min(2).max(120),
  tradingAddress: z.string().min(5).max(300),
  contactName: z.string().min(2).max(120),
  contactPhone: z.string().min(7).max(40),
});

export const orderFulfilmentSchema = z.object({
  method: z.enum(["collection", "delivery"]),
  requestedDate: z.iso.date(),
  note: z.string().max(500).nullable(),
});

export const editableOrderSelectionSchema = z.object({
  productId: z.string().min(1),
  supplierId: z.string().min(1),
  selectedPacks: z.number().int().min(0).max(10_000),
});

export const purchaseOrderDraftLineSchema = z.object({
  productId: z.string().min(1),
  productName: z.string().min(1),
  supplierId: z.string().min(1),
  supplierName: z.string().min(1),
  packQuantity: z.number().int().positive(),
  selectedPacks: z.number().int().positive(),
  selectedUnits: z.number().int().positive(),
  packCostCents: z.number().int().positive(),
  lineCostCents: z.number().int().positive(),
  expectedMarginCents: z.number().int(),
  maximumPacks: z.number().int().positive(),
});

export const purchaseOrderDraftSchema = z.object({
  draftId: z.uuid(),
  version: z.literal(1),
  status: z.literal("pending_approval"),
  merchant: merchantOrderProfileSchema,
  fulfilment: orderFulfilmentSchema,
  sourceEvidenceHashes: z.array(z.string().regex(/^[a-f0-9]{64}$/)).min(1),
  mappingHash: z.string().regex(/^[a-f0-9]{64}$/),
  budgetCents: z.number().int().positive(),
  recommendationHash: z.string().regex(/^[a-f0-9]{64}$/),
  calculationVersion: z.literal("restock-inputs-v1"),
  optimiserVersion: z.literal("stable-utility-v1"),
  lines: z.array(purchaseOrderDraftLineSchema).min(1),
  totalCostCents: z.number().int().positive(),
  remainingCents: z.number().int().nonnegative(),
  expectedMarginCents: z.number().int(),
  createdAt: z.iso.datetime(),
  draftHash: z.string().regex(/^[a-f0-9]{64}$/),
});

export const signedPurchaseOrderDraftSchema = z.object({
  draft: purchaseOrderDraftSchema,
  token: z.string().min(32),
  signatureScope: z.enum(["configured", "ephemeral"]),
});

export const approvalRecordSchema = z.object({
  approvalId: z.uuid(),
  status: z.literal("approved"),
  draftHash: z.string().regex(/^[a-f0-9]{64}$/),
  recommendationHash: z.string().regex(/^[a-f0-9]{64}$/),
  evidenceHashes: z.array(z.string().regex(/^[a-f0-9]{64}$/)).min(1),
  mappingHash: z.string().regex(/^[a-f0-9]{64}$/),
  approvedBy: z.string().min(2).max(120),
  approvedAt: z.iso.datetime(),
  confirmationText: z.string().min(20).max(500),
  approvalHash: z.string().regex(/^[a-f0-9]{64}$/),
});

export const supplierPurchaseOrderLineSchema = purchaseOrderDraftLineSchema.pick({
  productId: true,
  productName: true,
  packQuantity: true,
  selectedPacks: true,
  selectedUnits: true,
  packCostCents: true,
  lineCostCents: true,
});

export const supplierPurchaseOrderSchema = z.object({
  purchaseOrderId: z.uuid(),
  purchaseOrderNumber: z.string().regex(/^KSI-[0-9]{8}-[A-Z0-9-]+-[0-9]{2}$/),
  supplierId: z.string().min(1),
  supplierName: z.string().min(1),
  merchant: merchantOrderProfileSchema,
  fulfilment: orderFulfilmentSchema,
  lines: z.array(supplierPurchaseOrderLineSchema).min(1),
  subtotalCents: z.number().int().positive(),
  totalCents: z.number().int().positive(),
  currency: z.literal("ZAR"),
  draftHash: z.string().regex(/^[a-f0-9]{64}$/),
  approvalHash: z.string().regex(/^[a-f0-9]{64}$/),
  generatedAt: z.iso.datetime(),
  purchaseOrderHash: z.string().regex(/^[a-f0-9]{64}$/),
});

export const supplierMessageSchema = z.object({
  supplierId: z.string().min(1),
  supplierName: z.string().min(1),
  purchaseOrderId: z.uuid(),
  channel: z.literal("whatsapp_ready"),
  body: z.string().min(20).max(4_000),
});

export const approvedOrderBundleSchema = z.object({
  bundleId: z.uuid(),
  version: z.literal(1),
  draft: purchaseOrderDraftSchema,
  approval: approvalRecordSchema,
  purchaseOrders: z.array(supplierPurchaseOrderSchema).min(1),
  supplierMessages: z.array(supplierMessageSchema).min(1),
  auditEvents: z.array(auditEventSchema).min(1),
  generatedAt: z.iso.datetime(),
  bundleHash: z.string().regex(/^[a-f0-9]{64}$/),
});

export const signedApprovedOrderBundleSchema = z.object({
  bundle: approvedOrderBundleSchema,
  token: z.string().min(32),
  signatureScope: z.enum(["configured", "ephemeral"]),
});

export type MerchantOrderProfile = z.infer<typeof merchantOrderProfileSchema>;
export type OrderFulfilment = z.infer<typeof orderFulfilmentSchema>;
export type EditableOrderSelection = z.infer<typeof editableOrderSelectionSchema>;
export type PurchaseOrderDraftLine = z.infer<typeof purchaseOrderDraftLineSchema>;
export type PurchaseOrderDraft = z.infer<typeof purchaseOrderDraftSchema>;
export type SignedPurchaseOrderDraft = z.infer<typeof signedPurchaseOrderDraftSchema>;
export type ApprovalRecord = z.infer<typeof approvalRecordSchema>;
export type SupplierPurchaseOrder = z.infer<typeof supplierPurchaseOrderSchema>;
export type SupplierMessage = z.infer<typeof supplierMessageSchema>;
export type ApprovedOrderBundle = z.infer<typeof approvedOrderBundleSchema>;
export type SignedApprovedOrderBundle = z.infer<typeof signedApprovedOrderBundleSchema>;
