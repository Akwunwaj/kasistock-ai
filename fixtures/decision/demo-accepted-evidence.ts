import {
  acceptedEvidenceSnapshotSchema,
  type AcceptedEvidenceSnapshot,
  type ReviewDecision,
} from "@/modules/evidence/domain/contracts";
import { computeAcceptedEvidenceHash } from "@/modules/evidence/application/accepted-evidence-hash";
import type { EvidenceKind, ExtractionOutput } from "@/modules/extraction/domain/contracts";
import {
  demoMetroSupplierExtraction,
  demoSalesHistory,
  demoShelfExtraction,
  demoUbuntuSupplierExtraction,
} from "@/fixtures/extraction/demo-extractions";

const acceptedAt = "2026-07-18T10:00:00.000Z";
const acceptedBy = "KasiStock AI demo merchant";

export function createDemoAcceptedEvidenceBundle(): AcceptedEvidenceSnapshot[] {
  return [
    createSnapshot({
      snapshotId: "55555555-5555-4555-8555-555555555555",
      sourceExtractionId: "55555555-5555-4555-8555-555555555556",
      sourceSha256: "1".repeat(64),
      kind: "shelf_image",
      acceptedPayload: demoShelfExtraction,
      reviewDecisions: [verified("/observedProducts/0"), verified("/observedProducts/2")],
    }),
    createSnapshot({
      snapshotId: "66666666-6666-4666-8666-666666666666",
      sourceExtractionId: "66666666-6666-4666-8666-666666666667",
      sourceSha256: "2".repeat(64),
      kind: "supplier_catalogue",
      acceptedPayload: demoUbuntuSupplierExtraction,
      reviewDecisions: [verified("/offers/2")],
    }),
    createSnapshot({
      snapshotId: "77777777-7777-4777-8777-777777777777",
      sourceExtractionId: "77777777-7777-4777-8777-777777777778",
      sourceSha256: "3".repeat(64),
      kind: "supplier_catalogue",
      acceptedPayload: demoMetroSupplierExtraction,
      reviewDecisions: [],
    }),
    createSnapshot({
      snapshotId: "88888888-8888-4888-8888-888888888888",
      sourceExtractionId: "88888888-8888-4888-8888-888888888889",
      sourceSha256: "4".repeat(64),
      kind: "sales_history",
      acceptedPayload: demoSalesHistory,
      reviewDecisions: [],
    }),
  ];
}

function verified(path: string): ReviewDecision {
  return {
    path,
    decision: "accepted",
    note: "Human verified against the prepared source evidence.",
  };
}

function createSnapshot(input: {
  snapshotId: string;
  sourceExtractionId: string;
  sourceSha256: string;
  kind: EvidenceKind;
  acceptedPayload: ExtractionOutput;
  reviewDecisions: ReviewDecision[];
}): AcceptedEvidenceSnapshot {
  const hashSource = {
    kind: input.kind,
    sourceExtractionId: input.sourceExtractionId,
    sourceSha256: input.sourceSha256,
    acceptedPayload: input.acceptedPayload,
    reviewDecisions: input.reviewDecisions,
    acceptedBy,
    acceptedAt,
  };
  return acceptedEvidenceSnapshotSchema.parse({
    snapshotId: input.snapshotId,
    version: 1,
    ...hashSource,
    evidenceHash: computeAcceptedEvidenceHash(hashSource),
  });
}
