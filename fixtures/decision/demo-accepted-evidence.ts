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
      snapshotId: "11111111-1111-4111-8111-111111111111",
      sourceExtractionId: "11111111-1111-4111-8111-111111111112",
      sourceSha256: "1".repeat(64),
      kind: "shelf_image",
      acceptedPayload: demoShelfExtraction,
      reviewDecisions: [verified("/observedProducts/0"), verified("/observedProducts/2")],
    }),
    createSnapshot({
      snapshotId: "22222222-2222-4222-8222-222222222222",
      sourceExtractionId: "22222222-2222-4222-8222-222222222223",
      sourceSha256: "2".repeat(64),
      kind: "supplier_catalogue",
      acceptedPayload: demoUbuntuSupplierExtraction,
      reviewDecisions: [verified("/offers/2")],
    }),
    createSnapshot({
      snapshotId: "33333333-3333-4333-8333-333333333333",
      sourceExtractionId: "33333333-3333-4333-8333-333333333334",
      sourceSha256: "3".repeat(64),
      kind: "supplier_catalogue",
      acceptedPayload: demoMetroSupplierExtraction,
      reviewDecisions: [],
    }),
    createSnapshot({
      snapshotId: "44444444-4444-4444-8444-444444444444",
      sourceExtractionId: "44444444-4444-4444-8444-444444444445",
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
