import type {
  EvidenceKind,
  ExtractionOutput,
  ShelfExtraction,
  SupplierCatalogueExtraction,
} from "../domain/contracts";

export type ReviewIssueCode = "NON_HIGH_CONFIDENCE" | "QUANTITY_MISSING" | "PRICE_MISSING";

export interface ReviewIssue {
  path: string;
  code: ReviewIssueCode;
  message: string;
  required: true;
}

export function collectReviewIssues(kind: EvidenceKind, output: ExtractionOutput): ReviewIssue[] {
  switch (kind) {
    case "shelf_image":
      return collectShelfIssues(output as ShelfExtraction);
    case "supplier_catalogue":
      return collectSupplierIssues(output as SupplierCatalogueExtraction);
    case "sales_history":
      return collectSalesIssues();
  }
}

function collectShelfIssues(output: ShelfExtraction): ReviewIssue[] {
  return output.observedProducts.flatMap((product, index) => {
    const path = `/observedProducts/${index}`;
    const issues: ReviewIssue[] = [];
    if (product.confidence !== "high") {
      issues.push({
        path,
        code: "NON_HIGH_CONFIDENCE",
        message: `${product.rawProductName} requires human confirmation because confidence is ${product.confidence}.`,
        required: true,
      });
    }
    if (product.estimatedQuantity === null) {
      issues.push({
        path,
        code: "QUANTITY_MISSING",
        message: `${product.rawProductName} has no estimated quantity.`,
        required: true,
      });
    }
    return issues;
  });
}

function collectSupplierIssues(output: SupplierCatalogueExtraction): ReviewIssue[] {
  return output.offers.flatMap((offer, index) => {
    const path = `/offers/${index}`;
    const issues: ReviewIssue[] = [];
    if (offer.confidence !== "high") {
      issues.push({
        path,
        code: "NON_HIGH_CONFIDENCE",
        message: `${offer.rawProductName} requires human confirmation because confidence is ${offer.confidence}.`,
        required: true,
      });
    }
    if (offer.unitPriceCents === null && offer.casePriceCents === null) {
      issues.push({
        path,
        code: "PRICE_MISSING",
        message: `${offer.rawProductName} has no extractable unit or case price.`,
        required: true,
      });
    }
    return issues;
  });
}

function collectSalesIssues(): ReviewIssue[] {
  // CSV ingestion is deterministic and schema-validated. Product identity remains
  // subject to the separate human-controlled reconciliation gate.
  return [];
}
