import { describe, expect, it } from "vitest";
import {
  normaliseProductName,
  tokenSimilarityBasisPoints,
} from "@/modules/reconciliation/application/normalise-product-name";

describe("product-name normalisation", () => {
  it("normalises common retail size and brand variants", () => {
    expect(normaliseProductName("Coca-Cola Original Taste 2 Litre PET")).toBe(
      "cocacola original 2l",
    );
    expect(normaliseProductName("Albany White 700 gram")).toBe("albany white 700g");
  });

  it("scores similar product labels above unrelated labels", () => {
    const similar = tokenSimilarityBasisPoints(
      "Clover UHT Fullcream 2 Litre 6 Pack",
      "Clover Full Cream Milk 2L",
    );
    const unrelated = tokenSimilarityBasisPoints(
      "Clover UHT Fullcream 2 Litre 6 Pack",
      "Super Maize Meal 5kg",
    );

    expect(similar).toBeGreaterThan(unrelated);
    expect(similar).toBeGreaterThan(5000);
  });
});
