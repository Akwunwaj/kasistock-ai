import { describe, expect, it } from "vitest";
import { shelfExtractionSchema } from "@/modules/extraction/domain/contracts";

describe("shelf extraction contract", () => {
  it("accepts a fully traceable observation", () => {
    const parsed = shelfExtractionSchema.parse({
      observedProducts: [
        {
          rawProductName: "Albany Superior White",
          visibleBrand: "Albany",
          visiblePackSize: "700g",
          estimatedQuantity: 4,
          confidence: "medium",
          evidenceDescription: "Four visible loaves on the second shelf.",
          uncertaintyReason: "One loaf may be partially obscured.",
        },
      ],
      imageQuality: "high",
      notes: [],
    });
    expect(parsed.observedProducts).toHaveLength(1);
  });

  it("rejects negative quantities", () => {
    const result = shelfExtractionSchema.safeParse({
      observedProducts: [
        {
          rawProductName: "Bread",
          visibleBrand: null,
          visiblePackSize: null,
          estimatedQuantity: -1,
          confidence: "low",
          evidenceDescription: "Invalid fixture",
          uncertaintyReason: null,
        },
      ],
      imageQuality: "low",
      notes: [],
    });
    expect(result.success).toBe(false);
  });
});
