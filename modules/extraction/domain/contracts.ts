import { z } from "zod";

export const EXTRACTION_CONTRACT_VERSION = "2026-07-18.2";

export const confidenceLevelSchema = z.enum(["high", "medium", "low"]);

export const shelfObservationSchema = z.object({
  rawProductName: z.string().min(1),
  visibleBrand: z.string().nullable(),
  visiblePackSize: z.string().nullable(),
  estimatedQuantity: z.number().int().nonnegative().nullable(),
  confidence: confidenceLevelSchema,
  evidenceDescription: z.string().min(1),
  uncertaintyReason: z.string().nullable(),
});

export const shelfExtractionSchema = z.object({
  observedProducts: z.array(shelfObservationSchema).min(1),
  imageQuality: confidenceLevelSchema,
  notes: z.array(z.string()),
});

export const supplierOfferExtractionSchema = z.object({
  rawProductName: z.string().min(1),
  barcode: z.string().nullable(),
  unitPriceCents: z.number().int().nonnegative().nullable(),
  casePriceCents: z.number().int().nonnegative().nullable(),
  caseQuantity: z.number().int().positive().nullable(),
  minimumOrderQuantity: z.number().int().positive().default(1),
  promotion: z.string().nullable(),
  confidence: confidenceLevelSchema,
});

export const supplierCatalogueExtractionSchema = z.object({
  supplierName: z.string().min(1),
  catalogueDate: z.iso.date().nullable(),
  currency: z.literal("ZAR"),
  offers: z.array(supplierOfferExtractionSchema).min(1),
  warnings: z.array(z.string()),
});

export const salesHistoryLineSchema = z.object({
  rawProductName: z.string().min(1),
  barcode: z.string().nullable(),
  unitsSold: z.number().int().nonnegative(),
  grossRevenueCents: z.number().int().nonnegative(),
  transactionCount: z.number().int().nonnegative(),
});

export const salesHistorySchema = z
  .object({
    periodStart: z.iso.date(),
    periodEnd: z.iso.date(),
    currency: z.literal("ZAR"),
    lines: z.array(salesHistoryLineSchema).min(1),
    warnings: z.array(z.string()),
  })
  .refine((value) => value.periodStart <= value.periodEnd, {
    message: "Sales period start must not be after period end.",
    path: ["periodStart"],
  });

export const evidenceKindSchema = z.enum(["shelf_image", "supplier_catalogue", "sales_history"]);

export type ConfidenceLevel = z.infer<typeof confidenceLevelSchema>;
export type EvidenceKind = z.infer<typeof evidenceKindSchema>;
export type ShelfExtraction = z.infer<typeof shelfExtractionSchema>;
export type SupplierCatalogueExtraction = z.infer<typeof supplierCatalogueExtractionSchema>;
export type SalesHistory = z.infer<typeof salesHistorySchema>;
export type ExtractionOutput = ShelfExtraction | SupplierCatalogueExtraction | SalesHistory;

export function parseExtractionOutput(kind: EvidenceKind, value: unknown): ExtractionOutput {
  switch (kind) {
    case "shelf_image":
      return shelfExtractionSchema.parse(value);
    case "supplier_catalogue":
      return supplierCatalogueExtractionSchema.parse(value);
    case "sales_history":
      return salesHistorySchema.parse(value);
  }
}
