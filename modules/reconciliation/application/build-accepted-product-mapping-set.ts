import { randomUUID } from "node:crypto";
import type { CanonicalProduct } from "@/modules/catalogue/domain/product";
import type { AcceptedEvidenceSnapshot } from "@/modules/evidence/domain/contracts";
import {
  acceptedProductMappingSetSchema,
  productMappingDecisionSchema,
  type AcceptedProductMappingSet,
} from "../domain/contracts";
import { extractSourceProductRecords } from "./source-product-records";
import { computeProductMappingHash } from "./product-mapping-hash";

export class ProductMappingAcceptanceError extends Error {
  constructor(
    public readonly code:
      | "INCOMPLETE_MAPPING"
      | "UNKNOWN_SOURCE"
      | "UNKNOWN_PRODUCT"
      | "DUPLICATE_DECISION"
      | "INVALID_DECISION",
    message: string,
    public readonly sourceKey?: string,
    public readonly field?: string,
  ) {
    super(message);
    this.name = "ProductMappingAcceptanceError";
  }
}

interface BuildMappingSetInput {
  snapshots: readonly AcceptedEvidenceSnapshot[];
  decisions: unknown;
  products: readonly CanonicalProduct[];
  acceptedBy: string;
  now?: Date;
}

export function buildAcceptedProductMappingSet(
  input: BuildMappingSetInput,
): AcceptedProductMappingSet {
  const records = extractSourceProductRecords(input.snapshots);
  const parsedDecisions = productMappingDecisionSchema.array().safeParse(input.decisions);
  if (!parsedDecisions.success) {
    const issue = parsedDecisions.error.issues[0];
    const decisionIndex = typeof issue?.path[0] === "number" ? issue.path[0] : undefined;
    const sourceKey =
      decisionIndex === undefined || !Array.isArray(input.decisions)
        ? undefined
        : sourceKeyAt(input.decisions[decisionIndex]);
    const source = records.find((record) => record.sourceKey === sourceKey);
    const pathTail = issue?.path.at(-1);
    const field = typeof pathTail === "string" ? pathTail : "decision";
    const mappingLabel = source
      ? `the mapping for “${source.rawProductName}”`
      : decisionIndex === undefined
        ? "the mapping request"
        : `mapping row ${decisionIndex + 1}`;

    throw new ProductMappingAcceptanceError(
      "INVALID_DECISION",
      `${mappingLabel} has an invalid ${field}: ${issue?.message ?? "invalid value"}.`,
      sourceKey,
      field,
    );
  }
  const decisions = parsedDecisions.data;
  const sourceKeys = new Set(records.map((record) => record.sourceKey));
  const productIds = new Set(input.products.map((product) => product.productId));
  const seen = new Set<string>();

  for (const decision of decisions) {
    if (seen.has(decision.sourceKey)) {
      throw new ProductMappingAcceptanceError(
        "DUPLICATE_DECISION",
        `A mapping decision was supplied more than once for ${decision.sourceKey}.`,
      );
    }
    seen.add(decision.sourceKey);
    if (!sourceKeys.has(decision.sourceKey)) {
      throw new ProductMappingAcceptanceError(
        "UNKNOWN_SOURCE",
        `Unknown reconciliation source: ${decision.sourceKey}.`,
      );
    }
    if (decision.productId !== null && !productIds.has(decision.productId)) {
      throw new ProductMappingAcceptanceError(
        "UNKNOWN_PRODUCT",
        `Unknown canonical product: ${decision.productId}.`,
      );
    }
    if (decision.decision === "unmatched" && decision.productId !== null) {
      throw new ProductMappingAcceptanceError(
        "UNKNOWN_PRODUCT",
        "An unmatched decision cannot assign a canonical product.",
      );
    }
  }

  const missing = records.filter((record) => !seen.has(record.sourceKey));
  if (missing.length > 0) {
    throw new ProductMappingAcceptanceError(
      "INCOMPLETE_MAPPING",
      `${missing.length} product identity record(s) remain unresolved.`,
    );
  }

  const acceptedAt = (input.now ?? new Date()).toISOString();
  const hashSource = {
    sourceEvidenceHashes: [
      ...new Set(input.snapshots.map((snapshot) => snapshot.evidenceHash)),
    ].sort(),
    decisions: [...decisions].sort((a, b) => a.sourceKey.localeCompare(b.sourceKey)),
    acceptedBy: input.acceptedBy,
    acceptedAt,
  };

  return acceptedProductMappingSetSchema.parse({
    mappingSetId: randomUUID(),
    version: 1,
    ...hashSource,
    mappingHash: computeProductMappingHash(hashSource),
  });
}

function sourceKeyAt(value: unknown): string | undefined {
  if (
    typeof value === "object" &&
    value !== null &&
    "sourceKey" in value &&
    typeof value.sourceKey === "string"
  ) {
    return value.sourceKey;
  }
  return undefined;
}
