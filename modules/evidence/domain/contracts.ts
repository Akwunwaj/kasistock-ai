import { z } from "zod";
import {
  evidenceKindSchema,
  salesHistorySchema,
  shelfExtractionSchema,
  supplierCatalogueExtractionSchema,
} from "@/modules/extraction/domain/contracts";

export const reviewIssueSchema = z.object({
  path: z.string().min(1),
  code: z.enum(["NON_HIGH_CONFIDENCE", "QUANTITY_MISSING", "PRICE_MISSING"]),
  message: z.string().min(1),
  required: z.literal(true),
});

const extractionMetadataSchema = z.object({
  extractionId: z.uuid(),
  kind: evidenceKindSchema,
  filename: z.string().min(1),
  mediaType: z.string().min(1),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  sizeBytes: z.number().int().positive(),
  model: z.string().min(1),
  responseId: z.string().min(1),
  contractVersion: z.string().min(1),
  createdAt: z.iso.datetime(),
  mode: z.enum(["live", "demo"]),
});

export const shelfExtractionEnvelopeSchema = extractionMetadataSchema.extend({
  kind: z.literal("shelf_image"),
  output: shelfExtractionSchema,
  reviewIssues: z.array(reviewIssueSchema),
});

export const supplierExtractionEnvelopeSchema = extractionMetadataSchema.extend({
  kind: z.literal("supplier_catalogue"),
  output: supplierCatalogueExtractionSchema,
  reviewIssues: z.array(reviewIssueSchema),
});

export const salesHistoryEnvelopeSchema = extractionMetadataSchema.extend({
  kind: z.literal("sales_history"),
  output: salesHistorySchema,
  reviewIssues: z.array(reviewIssueSchema),
});

export const extractionEnvelopeSchema = z.discriminatedUnion("kind", [
  shelfExtractionEnvelopeSchema,
  supplierExtractionEnvelopeSchema,
  salesHistoryEnvelopeSchema,
]);

export const signedExtractionSchema = z.object({
  envelope: extractionEnvelopeSchema,
  token: z.string().min(32),
  signatureScope: z.enum(["configured", "ephemeral"]),
});

export const reviewDecisionSchema = z.object({
  path: z.string().min(1),
  decision: z.enum(["accepted", "corrected"]),
  note: z.string().max(500).nullable(),
});

const acceptedEvidenceMetadataSchema = z.object({
  snapshotId: z.uuid(),
  version: z.literal(1),
  sourceExtractionId: z.uuid(),
  sourceSha256: z.string().regex(/^[a-f0-9]{64}$/),
  reviewDecisions: z.array(reviewDecisionSchema),
  acceptedBy: z.string().min(1).max(120),
  acceptedAt: z.iso.datetime(),
  evidenceHash: z.string().regex(/^[a-f0-9]{64}$/),
});

export const acceptedShelfEvidenceSnapshotSchema = acceptedEvidenceMetadataSchema.extend({
  kind: z.literal("shelf_image"),
  acceptedPayload: shelfExtractionSchema,
});

export const acceptedSupplierEvidenceSnapshotSchema = acceptedEvidenceMetadataSchema.extend({
  kind: z.literal("supplier_catalogue"),
  acceptedPayload: supplierCatalogueExtractionSchema,
});

export const acceptedSalesEvidenceSnapshotSchema = acceptedEvidenceMetadataSchema.extend({
  kind: z.literal("sales_history"),
  acceptedPayload: salesHistorySchema,
});

export const acceptedEvidenceSnapshotSchema = z.discriminatedUnion("kind", [
  acceptedShelfEvidenceSnapshotSchema,
  acceptedSupplierEvidenceSnapshotSchema,
  acceptedSalesEvidenceSnapshotSchema,
]);

export type ExtractionEnvelope = z.infer<typeof extractionEnvelopeSchema>;
export type SignedExtraction = z.infer<typeof signedExtractionSchema>;
export type ReviewDecision = z.infer<typeof reviewDecisionSchema>;
export type AcceptedEvidenceSnapshot = z.infer<typeof acceptedEvidenceSnapshotSchema>;
