import type { RestockCandidate } from "@/modules/optimisation/domain/types";

export interface SupplierCostOption {
  sourceKey: string;
  supplierName: string;
  rawProductName: string;
  packQuantity: number;
  packCostCents: number;
  effectiveUnitCostCents: number;
  promotion: string | null;
}

export interface ProductRestockCalculation {
  productId: string;
  productName: string;
  currentStockUnits: number;
  unitsSold: number;
  grossRevenueCents: number;
  salesPeriodDays: number;
  averageDailySales: number;
  averageSellPriceCents: number | null;
  daysOfCover: number | null;
  targetStockUnits: number;
  reorderUnits: number;
  cheapestOffer: SupplierCostOption | null;
  alternativeOffers: SupplierCostOption[];
  sourceKeys: string[];
  blockers: string[];
}

export interface RestockInputBuildResult {
  sourceEvidenceHashes: string[];
  mappingHash: string;
  calculations: ProductRestockCalculation[];
  candidates: RestockCandidate[];
  blockedProducts: Array<{ productId: string; reasons: string[] }>;
}
