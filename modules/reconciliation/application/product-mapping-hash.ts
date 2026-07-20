import { createHash } from "node:crypto";
import type { AcceptedProductMappingSet } from "../domain/contracts";
import { canonicalJson } from "@/modules/evidence/application/canonical-json";

export type ProductMappingHashSource = Omit<
  AcceptedProductMappingSet,
  "mappingSetId" | "version" | "mappingHash"
>;

export function productMappingHashSource(
  mappingSet: AcceptedProductMappingSet,
): ProductMappingHashSource {
  return {
    sourceEvidenceHashes: [...mappingSet.sourceEvidenceHashes].sort(),
    decisions: [...mappingSet.decisions].sort((a, b) => a.sourceKey.localeCompare(b.sourceKey)),
    acceptedBy: mappingSet.acceptedBy,
    acceptedAt: mappingSet.acceptedAt,
  };
}

export function computeProductMappingHash(source: ProductMappingHashSource): string {
  return createHash("sha256").update(canonicalJson(source)).digest("hex");
}

export function verifyAcceptedProductMappingSetHash(
  mappingSet: AcceptedProductMappingSet,
): boolean {
  return computeProductMappingHash(productMappingHashSource(mappingSet)) === mappingSet.mappingHash;
}
