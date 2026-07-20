import { randomUUID } from "node:crypto";
import { canonicalProducts } from "@/fixtures/catalogue/canonical-products";
import type { AcceptedEvidenceSnapshot } from "@/modules/evidence/domain/contracts";
import { optimiseRestockPlan } from "@/modules/optimisation/domain/optimise-restock-plan";
import type { RestockCandidate } from "@/modules/optimisation/domain/types";
import type { AcceptedProductMappingSet } from "@/modules/reconciliation/domain/contracts";
import { buildRestockInputs } from "@/modules/restocking/application/build-restock-inputs";
import {
  editableOrderSelectionSchema,
  merchantOrderProfileSchema,
  orderFulfilmentSchema,
  purchaseOrderDraftSchema,
  type EditableOrderSelection,
  type MerchantOrderProfile,
  type OrderFulfilment,
  type PurchaseOrderDraft,
  type PurchaseOrderDraftLine,
} from "../domain/contracts";
import { computePurchaseOrderDraftHash, recommendationHash } from "./purchase-order-hashes";

export class PurchaseOrderDraftError extends Error {
  constructor(
    public readonly code:
      | "DUPLICATE_ORDER_SELECTION"
      | "UNKNOWN_ORDER_CANDIDATE"
      | "PACK_LIMIT_EXCEEDED"
      | "EMPTY_ORDER"
      | "BUDGET_EXCEEDED",
    message: string,
  ) {
    super(message);
    this.name = "PurchaseOrderDraftError";
  }
}

interface BuildDraftInput {
  snapshots: readonly AcceptedEvidenceSnapshot[];
  mappingSet: AcceptedProductMappingSet;
  budgetCents: number;
  merchant: MerchantOrderProfile;
  fulfilment: OrderFulfilment;
  selections?: readonly EditableOrderSelection[];
  now?: string;
  draftId?: string;
}

export function buildPurchaseOrderDraft(input: BuildDraftInput): PurchaseOrderDraft {
  const merchant = merchantOrderProfileSchema.parse(input.merchant);
  const fulfilment = orderFulfilmentSchema.parse(input.fulfilment);
  const restockInputs = buildRestockInputs({
    snapshots: input.snapshots,
    mappingSet: input.mappingSet,
    products: canonicalProducts,
  });
  const optimisation = optimiseRestockPlan(restockInputs.candidates, input.budgetCents);
  const selections = input.selections
    ? editableOrderSelectionSchema.array().parse(input.selections)
    : optimisation.lines.map((line) => ({
        productId: line.productId,
        supplierId: line.supplierId,
        selectedPacks: line.selectedPacks,
      }));

  const candidates = new Map(
    restockInputs.candidates.map((candidate) => [candidateKey(candidate), candidate]),
  );
  const seen = new Set<string>();
  const lines: PurchaseOrderDraftLine[] = [];

  for (const selection of selections) {
    const key = `${selection.supplierId}:${selection.productId}`;
    if (seen.has(key)) {
      throw new PurchaseOrderDraftError(
        "DUPLICATE_ORDER_SELECTION",
        `The order contains a duplicate selection for ${selection.productId}.`,
      );
    }
    seen.add(key);
    if (selection.selectedPacks === 0) continue;

    const candidate = candidates.get(key);
    if (!candidate) {
      throw new PurchaseOrderDraftError(
        "UNKNOWN_ORDER_CANDIDATE",
        `The order selection ${key} is not present in the accepted calculation inputs.`,
      );
    }
    if (selection.selectedPacks > candidate.maximumPacks) {
      throw new PurchaseOrderDraftError(
        "PACK_LIMIT_EXCEEDED",
        `${candidate.productName} exceeds the accepted demand ceiling of ${candidate.maximumPacks} pack(s).`,
      );
    }
    lines.push(lineFromCandidate(candidate, selection.selectedPacks));
  }

  if (lines.length === 0) {
    throw new PurchaseOrderDraftError(
      "EMPTY_ORDER",
      "At least one purchase-order line is required.",
    );
  }

  const totalCostCents = lines.reduce((total, line) => total + line.lineCostCents, 0);
  if (totalCostCents > input.budgetCents) {
    throw new PurchaseOrderDraftError(
      "BUDGET_EXCEEDED",
      `The edited order exceeds the approved cash budget by ${totalCostCents - input.budgetCents} cents.`,
    );
  }

  const createdAt = input.now ?? new Date().toISOString();
  const initial = {
    draftId: input.draftId ?? randomUUID(),
    version: 1 as const,
    status: "pending_approval" as const,
    merchant,
    fulfilment,
    sourceEvidenceHashes: [...restockInputs.sourceEvidenceHashes].sort(),
    mappingHash: restockInputs.mappingHash,
    budgetCents: input.budgetCents,
    recommendationHash: recommendationHash({
      sourceEvidenceHashes: restockInputs.sourceEvidenceHashes,
      mappingHash: restockInputs.mappingHash,
      budgetCents: input.budgetCents,
      lines: optimisation.lines,
    }),
    calculationVersion: "restock-inputs-v1" as const,
    optimiserVersion: "stable-utility-v1" as const,
    lines: lines.sort((a, b) =>
      `${a.supplierId}:${a.productId}`.localeCompare(`${b.supplierId}:${b.productId}`),
    ),
    totalCostCents,
    remainingCents: input.budgetCents - totalCostCents,
    expectedMarginCents: lines.reduce((total, line) => total + line.expectedMarginCents, 0),
    createdAt,
    draftHash: "0".repeat(64),
  };
  const draft = purchaseOrderDraftSchema.parse(initial);
  return purchaseOrderDraftSchema.parse({
    ...draft,
    draftHash: computePurchaseOrderDraftHash(draft),
  });
}

function lineFromCandidate(
  candidate: RestockCandidate,
  selectedPacks: number,
): PurchaseOrderDraftLine {
  return {
    productId: candidate.productId,
    productName: candidate.productName,
    supplierId: candidate.supplierId,
    supplierName: candidate.supplierName,
    packQuantity: candidate.packQuantity,
    selectedPacks,
    selectedUnits: selectedPacks * candidate.packQuantity,
    packCostCents: candidate.packCostCents,
    lineCostCents: selectedPacks * candidate.packCostCents,
    expectedMarginCents: selectedPacks * candidate.expectedMarginPerPackCents,
    maximumPacks: candidate.maximumPacks,
  };
}

function candidateKey(candidate: RestockCandidate): string {
  return `${candidate.supplierId}:${candidate.productId}`;
}
