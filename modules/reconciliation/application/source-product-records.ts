import {
  acceptedEvidenceSnapshotSchema,
  type AcceptedEvidenceSnapshot,
} from "@/modules/evidence/domain/contracts";
import { verifyAcceptedEvidenceSnapshotHash } from "@/modules/evidence/application/accepted-evidence-hash";
import type { SourceProductRecord } from "../domain/contracts";

export class ReconciliationEvidenceError extends Error {
  constructor(
    public readonly code: "INVALID_EVIDENCE_HASH" | "DUPLICATE_SOURCE_KEY",
    message: string,
  ) {
    super(message);
    this.name = "ReconciliationEvidenceError";
  }
}

export function parseAndVerifyAcceptedSnapshots(values: unknown): AcceptedEvidenceSnapshot[] {
  const snapshots = acceptedEvidenceSnapshotSchema.array().min(1).parse(values);
  for (const snapshot of snapshots) {
    if (!verifyAcceptedEvidenceSnapshotHash(snapshot)) {
      throw new ReconciliationEvidenceError(
        "INVALID_EVIDENCE_HASH",
        `Accepted evidence snapshot ${snapshot.snapshotId} failed its integrity check.`,
      );
    }
  }
  return snapshots;
}

export function extractSourceProductRecords(
  snapshots: readonly AcceptedEvidenceSnapshot[],
): SourceProductRecord[] {
  const records: SourceProductRecord[] = [];

  for (const snapshot of snapshots) {
    switch (snapshot.kind) {
      case "shelf_image":
        snapshot.acceptedPayload.observedProducts.forEach((product, index) => {
          records.push({
            sourceKey: `${snapshot.snapshotId}:/observedProducts/${index}`,
            snapshotId: snapshot.snapshotId,
            evidenceHash: snapshot.evidenceHash,
            kind: snapshot.kind,
            sourcePath: `/observedProducts/${index}`,
            rawProductName: product.rawProductName,
            barcode: null,
            sourceLabel: "Accepted shelf count",
          });
        });
        break;
      case "supplier_catalogue":
        snapshot.acceptedPayload.offers.forEach((offer, index) => {
          records.push({
            sourceKey: `${snapshot.snapshotId}:/offers/${index}`,
            snapshotId: snapshot.snapshotId,
            evidenceHash: snapshot.evidenceHash,
            kind: snapshot.kind,
            sourcePath: `/offers/${index}`,
            rawProductName: offer.rawProductName,
            barcode: offer.barcode,
            sourceLabel: snapshot.acceptedPayload.supplierName,
          });
        });
        break;
      case "sales_history":
        snapshot.acceptedPayload.lines.forEach((line, index) => {
          records.push({
            sourceKey: `${snapshot.snapshotId}:/lines/${index}`,
            snapshotId: snapshot.snapshotId,
            evidenceHash: snapshot.evidenceHash,
            kind: snapshot.kind,
            sourcePath: `/lines/${index}`,
            rawProductName: line.rawProductName,
            barcode: line.barcode,
            sourceLabel: `${snapshot.acceptedPayload.periodStart} to ${snapshot.acceptedPayload.periodEnd}`,
          });
        });
        break;
    }
  }

  const seen = new Set<string>();
  for (const record of records) {
    if (seen.has(record.sourceKey)) {
      throw new ReconciliationEvidenceError(
        "DUPLICATE_SOURCE_KEY",
        `Duplicate reconciliation source key: ${record.sourceKey}.`,
      );
    }
    seen.add(record.sourceKey);
  }
  return records;
}
