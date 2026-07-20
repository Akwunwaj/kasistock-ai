import { describe, expect, it } from "vitest";
import { canonicalProducts } from "@/fixtures/catalogue/canonical-products";
import { createDemoAcceptedEvidenceBundle } from "@/fixtures/decision/demo-accepted-evidence";
import { proposeProductMatches } from "@/modules/reconciliation/application/propose-product-matches";
import { extractSourceProductRecords } from "@/modules/reconciliation/application/source-product-records";

describe("proposeProductMatches", () => {
  it("auto-confirms exact barcodes and governed aliases", () => {
    const records = extractSourceProductRecords(createDemoAcceptedEvidenceBundle());
    const proposals = proposeProductMatches(records, canonicalProducts);
    const barcode = proposals.find((proposal) => proposal.source.barcode === "5449000000996");
    const alias = proposals.find(
      (proposal) => proposal.source.rawProductName === "Albany White Bread 700g",
    );

    expect(barcode?.status).toBe("auto_confirmed");
    expect(barcode?.candidates[0]?.method).toBe("barcode");
    expect(alias?.status).toBe("auto_confirmed");
    expect(alias?.recommendedProductId).toBe("bread-albany-white-700g");
  });

  it("requires human confirmation for fuzzy matches", () => {
    const records = extractSourceProductRecords(createDemoAcceptedEvidenceBundle());
    const proposals = proposeProductMatches(records, canonicalProducts);
    const fuzzy = proposals.find(
      (proposal) => proposal.source.rawProductName === "Clover UHT Fullcream 2 Litre 6 Pack",
    );

    expect(fuzzy?.status).toBe("requires_confirmation");
    expect(fuzzy?.recommendedProductId).toBe("milk-clover-fullcream-2l");
    expect(fuzzy?.candidates[0]?.method).toBe("token_similarity");
  });
});
