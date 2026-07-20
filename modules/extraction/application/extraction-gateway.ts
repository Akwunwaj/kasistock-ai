import type { ShelfExtraction, SupplierCatalogueExtraction } from "../domain/contracts";

export interface EvidenceImage {
  filename: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  base64Data: string;
}

export interface EvidenceDocument {
  filename: string;
  mimeType: "application/pdf" | "image/jpeg" | "image/png" | "image/webp";
  base64Data: string;
}

export interface ExtractionResult<T> {
  output: T;
  responseId: string;
  model: string;
}

export interface ExtractionGateway {
  extractShelf(image: EvidenceImage): Promise<ExtractionResult<ShelfExtraction>>;
  extractSupplierCatalogue(
    document: EvidenceDocument,
  ): Promise<ExtractionResult<SupplierCatalogueExtraction>>;
}
