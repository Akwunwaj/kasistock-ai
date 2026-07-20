import type { CanonicalProduct } from "@/modules/catalogue/domain/product";
import type { AcceptedEvidenceSnapshot } from "@/modules/evidence/domain/contracts";
import { verifyAcceptedEvidenceSnapshotHash } from "@/modules/evidence/application/accepted-evidence-hash";
import type { RestockCandidate } from "@/modules/optimisation/domain/types";
import { cents } from "@/modules/shared/domain/money";
import {
  acceptedProductMappingSetSchema,
  type AcceptedProductMappingSet,
} from "@/modules/reconciliation/domain/contracts";
import { verifyAcceptedProductMappingSetHash } from "@/modules/reconciliation/application/product-mapping-hash";
import type {
  ProductRestockCalculation,
  RestockInputBuildResult,
  SupplierCostOption,
} from "../domain/types";

export class RestockInputError extends Error {
  constructor(
    public readonly code:
      | "INVALID_EVIDENCE_HASH"
      | "INVALID_MAPPING_HASH"
      | "MAPPING_EVIDENCE_MISMATCH"
      | "MISSING_SALES_HISTORY",
    message: string,
  ) {
    super(message);
    this.name = "RestockInputError";
  }
}

interface ProductAccumulator {
  sourceKeys: Set<string>;
  currentStockUnits: number;
  unitsSold: number;
  grossRevenueCents: number;
  salesPeriodDays: number;
  supplierOffers: SupplierCostOption[];
}

export function buildRestockInputs(input: {
  snapshots: readonly AcceptedEvidenceSnapshot[];
  mappingSet: AcceptedProductMappingSet;
  products: readonly CanonicalProduct[];
}): RestockInputBuildResult {
  const mappingSet = acceptedProductMappingSetSchema.parse(input.mappingSet);
  verifyAuthority(input.snapshots, mappingSet);

  const mappingBySource = new Map(
    mappingSet.decisions.map((decision) => [decision.sourceKey, decision.productId]),
  );
  const accumulators = new Map<string, ProductAccumulator>();
  for (const product of input.products) {
    accumulators.set(product.productId, {
      sourceKeys: new Set(),
      currentStockUnits: 0,
      unitsSold: 0,
      grossRevenueCents: 0,
      salesPeriodDays: 0,
      supplierOffers: [],
    });
  }

  let salesSnapshotCount = 0;
  for (const snapshot of input.snapshots) {
    if (snapshot.kind === "shelf_image") {
      snapshot.acceptedPayload.observedProducts.forEach((observation, index) => {
        const sourceKey = `${snapshot.snapshotId}:/observedProducts/${index}`;
        const productId = mappingBySource.get(sourceKey);
        if (!productId) return;
        const accumulator = accumulators.get(productId);
        if (!accumulator) return;
        accumulator.sourceKeys.add(sourceKey);
        accumulator.currentStockUnits += observation.estimatedQuantity ?? 0;
      });
    } else if (snapshot.kind === "supplier_catalogue") {
      snapshot.acceptedPayload.offers.forEach((offer, index) => {
        const sourceKey = `${snapshot.snapshotId}:/offers/${index}`;
        const productId = mappingBySource.get(sourceKey);
        if (!productId) return;
        const accumulator = accumulators.get(productId);
        if (!accumulator) return;
        accumulator.sourceKeys.add(sourceKey);
        const cost = supplierCostOption(
          sourceKey,
          snapshot.acceptedPayload.supplierName,
          offer.rawProductName,
          offer.unitPriceCents,
          offer.casePriceCents,
          offer.caseQuantity,
          offer.minimumOrderQuantity,
          offer.promotion,
        );
        if (cost) accumulator.supplierOffers.push(cost);
      });
    } else {
      salesSnapshotCount += 1;
      const periodDays = inclusiveDays(
        snapshot.acceptedPayload.periodStart,
        snapshot.acceptedPayload.periodEnd,
      );
      snapshot.acceptedPayload.lines.forEach((line, index) => {
        const sourceKey = `${snapshot.snapshotId}:/lines/${index}`;
        const productId = mappingBySource.get(sourceKey);
        if (!productId) return;
        const accumulator = accumulators.get(productId);
        if (!accumulator) return;
        accumulator.sourceKeys.add(sourceKey);
        accumulator.unitsSold += line.unitsSold;
        accumulator.grossRevenueCents += line.grossRevenueCents;
        accumulator.salesPeriodDays = Math.max(accumulator.salesPeriodDays, periodDays);
      });
    }
  }

  if (salesSnapshotCount === 0) {
    throw new RestockInputError(
      "MISSING_SALES_HISTORY",
      "At least one accepted sales-history snapshot is required for restocking calculations.",
    );
  }

  const calculations = input.products.map((product) =>
    calculateProduct(product, accumulators.get(product.productId) as ProductAccumulator),
  );
  const candidates = calculations.flatMap((calculation) =>
    candidateFromCalculation(
      calculation,
      input.products.find(
        (product) => product.productId === calculation.productId,
      ) as CanonicalProduct,
    ),
  );

  return {
    sourceEvidenceHashes: [
      ...new Set(input.snapshots.map((snapshot) => snapshot.evidenceHash)),
    ].sort(),
    mappingHash: mappingSet.mappingHash,
    calculations,
    candidates,
    blockedProducts: calculations
      .filter((calculation) => calculation.blockers.length > 0)
      .map((calculation) => ({
        productId: calculation.productId,
        reasons: calculation.blockers,
      })),
  };
}

function verifyAuthority(
  snapshots: readonly AcceptedEvidenceSnapshot[],
  mappingSet: AcceptedProductMappingSet,
): void {
  for (const snapshot of snapshots) {
    if (!verifyAcceptedEvidenceSnapshotHash(snapshot)) {
      throw new RestockInputError(
        "INVALID_EVIDENCE_HASH",
        `Accepted evidence snapshot ${snapshot.snapshotId} failed its integrity check.`,
      );
    }
  }
  if (!verifyAcceptedProductMappingSetHash(mappingSet)) {
    throw new RestockInputError(
      "INVALID_MAPPING_HASH",
      "The accepted product mapping set failed its integrity check.",
    );
  }

  const expected = [...new Set(snapshots.map((snapshot) => snapshot.evidenceHash))].sort();
  const actual = [...mappingSet.sourceEvidenceHashes].sort();
  if (expected.length !== actual.length || expected.some((hash, index) => hash !== actual[index])) {
    throw new RestockInputError(
      "MAPPING_EVIDENCE_MISMATCH",
      "The product mapping set was not accepted against this exact evidence bundle.",
    );
  }
}

function calculateProduct(
  product: CanonicalProduct,
  accumulator: ProductAccumulator,
): ProductRestockCalculation {
  const salesPeriodDays = accumulator.salesPeriodDays;
  const averageDailySales =
    salesPeriodDays > 0 ? round(accumulator.unitsSold / salesPeriodDays, 3) : 0;
  const averageSellPriceCents =
    accumulator.unitsSold > 0
      ? Math.round(accumulator.grossRevenueCents / accumulator.unitsSold)
      : null;
  const daysOfCover =
    averageDailySales > 0 ? round(accumulator.currentStockUnits / averageDailySales, 2) : null;
  const targetStockUnits = Math.ceil(
    averageDailySales * product.targetDaysCover + product.safetyStockUnits,
  );
  const reorderUnits = Math.max(0, targetStockUnits - accumulator.currentStockUnits);
  const sortedOffers = [...accumulator.supplierOffers].sort(compareSupplierCost);
  const cheapestOffer = sortedOffers[0] ?? null;
  const blockers: string[] = [];

  if (averageDailySales <= 0) blockers.push("No mapped sales velocity is available.");
  if (averageSellPriceCents === null)
    blockers.push("No mapped selling-price evidence is available.");
  if (!cheapestOffer) blockers.push("No mapped supplier price is available.");
  if (reorderUnits === 0) blockers.push("Current stock already satisfies the target cover policy.");

  return {
    productId: product.productId,
    productName: product.displayName,
    currentStockUnits: accumulator.currentStockUnits,
    unitsSold: accumulator.unitsSold,
    grossRevenueCents: accumulator.grossRevenueCents,
    salesPeriodDays,
    averageDailySales,
    averageSellPriceCents,
    daysOfCover,
    targetStockUnits,
    reorderUnits,
    cheapestOffer,
    alternativeOffers: sortedOffers.slice(1),
    sourceKeys: [...accumulator.sourceKeys].sort(),
    blockers,
  };
}

function candidateFromCalculation(
  calculation: ProductRestockCalculation,
  product: CanonicalProduct,
): RestockCandidate[] {
  const offer = calculation.cheapestOffer;
  const sellPrice = calculation.averageSellPriceCents;
  if (!offer || sellPrice === null || calculation.reorderUnits <= 0) return [];

  const maximumPacks = Math.ceil(calculation.reorderUnits / offer.packQuantity);
  return [
    {
      productId: product.productId,
      productName: product.displayName,
      supplierId: slugify(offer.supplierName),
      supplierName: offer.supplierName,
      packQuantity: offer.packQuantity,
      packCostCents: cents(offer.packCostCents),
      maximumPacks,
      expectedMarginPerPackCents: cents(sellPrice * offer.packQuantity - offer.packCostCents),
      stockOutRiskScore: stockOutRisk(calculation.daysOfCover),
      essentialityScore: product.essentialityScore,
      expiryRiskScore: product.expiryRiskScore,
    },
  ];
}

function supplierCostOption(
  sourceKey: string,
  supplierName: string,
  rawProductName: string,
  unitPriceCents: number | null,
  casePriceCents: number | null,
  caseQuantity: number | null,
  minimumOrderQuantity: number,
  promotion: string | null,
): SupplierCostOption | null {
  const options: SupplierCostOption[] = [];
  if (unitPriceCents !== null) {
    options.push({
      sourceKey,
      supplierName,
      rawProductName,
      packQuantity: minimumOrderQuantity,
      packCostCents: unitPriceCents * minimumOrderQuantity,
      effectiveUnitCostCents: unitPriceCents,
      promotion,
    });
  }
  if (casePriceCents !== null && caseQuantity !== null) {
    options.push({
      sourceKey,
      supplierName,
      rawProductName,
      packQuantity: caseQuantity * minimumOrderQuantity,
      packCostCents: casePriceCents * minimumOrderQuantity,
      effectiveUnitCostCents: Math.round(casePriceCents / caseQuantity),
      promotion,
    });
  }
  return options.sort(compareSupplierCost)[0] ?? null;
}

function compareSupplierCost(left: SupplierCostOption, right: SupplierCostOption): number {
  const cross = left.packCostCents * right.packQuantity - right.packCostCents * left.packQuantity;
  return cross || left.supplierName.localeCompare(right.supplierName);
}

function inclusiveDays(start: string, end: string): number {
  const milliseconds = Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`);
  return Math.floor(milliseconds / 86_400_000) + 1;
}

function stockOutRisk(daysOfCover: number | null): number {
  if (daysOfCover === null) return 0;
  if (daysOfCover <= 1) return 10;
  if (daysOfCover <= 2) return 8;
  if (daysOfCover <= 4) return 6;
  if (daysOfCover <= 7) return 3;
  return 1;
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
