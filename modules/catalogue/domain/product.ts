import { z } from "zod";

export const canonicalProductSchema = z.object({
  productId: z.string().regex(/^[a-z0-9-]+$/),
  displayName: z.string().min(1),
  unitLabel: z.string().min(1),
  barcodes: z.array(z.string().min(6)),
  aliases: z.array(z.string().min(1)),
  targetDaysCover: z.number().positive(),
  safetyStockUnits: z.number().int().nonnegative(),
  essentialityScore: z.number().int().min(0).max(10),
  expiryRiskScore: z.number().int().min(0).max(10),
});

export type CanonicalProduct = z.infer<typeof canonicalProductSchema>;
