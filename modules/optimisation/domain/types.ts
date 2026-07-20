import type { MoneyCents } from "@/modules/shared/domain/money";

export interface RestockCandidate {
  productId: string;
  productName: string;
  supplierId: string;
  supplierName: string;
  packQuantity: number;
  packCostCents: MoneyCents;
  maximumPacks: number;
  expectedMarginPerPackCents: MoneyCents;
  stockOutRiskScore: number;
  essentialityScore: number;
  expiryRiskScore: number;
}

export interface SelectedRestockLine extends RestockCandidate {
  selectedPacks: number;
  selectedUnits: number;
  lineCostCents: MoneyCents;
  objectiveContribution: number;
}

export interface OptimisationResult {
  budgetCents: MoneyCents;
  totalCostCents: MoneyCents;
  remainingCents: MoneyCents;
  lines: SelectedRestockLine[];
}
