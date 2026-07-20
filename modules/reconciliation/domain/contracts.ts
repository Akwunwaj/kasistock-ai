import { z } from "zod";

export const matchMethodSchema = z.enum([
  "barcode",
  "exact_alias",
  "normalised_name",
  "token_similarity",
  "gpt_proposal",
  "unmatched",
]);

export const sourceProductRecordSchema = z.object({
  sourceKey: z.string().min(1),
  snapshotId: z.uuid(),
  evidenceHash: z.string().regex(/^[a-f0-9]{64}$/),
  kind: z.enum(["shelf_image", "supplier_catalogue", "sales_history"]),
  sourcePath: z.string().min(1),
  rawProductName: z.string().min(1),
  barcode: z.string().nullable(),
  sourceLabel: z.string().min(1),
});

export const matchCandidateSchema = z.object({
  productId: z.string().min(1),
  displayName: z.string().min(1),
  method: matchMethodSchema.exclude(["unmatched"]),
  scoreBasisPoints: z.number().int().min(0).max(10_000),
  explanation: z.string().min(1),
});

export const productMatchProposalSchema = z.object({
  proposalId: z.string().min(1),
  source: sourceProductRecordSchema,
  candidates: z.array(matchCandidateSchema).max(3),
  recommendedProductId: z.string().nullable(),
  status: z.enum(["auto_confirmed", "requires_confirmation", "unmatched"]),
  proposer: z.enum(["deterministic", "gpt"]),
});

export const productMappingDecisionSchema = z.object({
  sourceKey: z.string().min(1),
  productId: z.string().nullable(),
  decision: z.enum(["accepted", "corrected", "unmatched"]),
  proposedProductId: z.string().nullable(),
  method: matchMethodSchema,
  confirmed: z.literal(true),
  note: z.string().max(500).nullable(),
});

export const acceptedProductMappingSetSchema = z.object({
  mappingSetId: z.uuid(),
  version: z.literal(1),
  sourceEvidenceHashes: z.array(z.string().regex(/^[a-f0-9]{64}$/)).min(1),
  decisions: z.array(productMappingDecisionSchema).min(1),
  acceptedBy: z.string().min(1).max(120),
  acceptedAt: z.iso.datetime(),
  mappingHash: z.string().regex(/^[a-f0-9]{64}$/),
});

export type MatchMethod = z.infer<typeof matchMethodSchema>;
export type SourceProductRecord = z.infer<typeof sourceProductRecordSchema>;
export type MatchCandidate = z.infer<typeof matchCandidateSchema>;
export type ProductMatchProposal = z.infer<typeof productMatchProposalSchema>;
export type ProductMappingDecision = z.infer<typeof productMappingDecisionSchema>;
export type AcceptedProductMappingSet = z.infer<typeof acceptedProductMappingSetSchema>;
