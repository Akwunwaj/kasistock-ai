import { createHash } from "node:crypto";
import type { AcceptedEvidenceSnapshot } from "../domain/contracts";
import { canonicalJson } from "./canonical-json";

export type AcceptedEvidenceHashSource = Omit<
  AcceptedEvidenceSnapshot,
  "snapshotId" | "version" | "evidenceHash"
>;

export function acceptedEvidenceHashSource(
  snapshot: AcceptedEvidenceSnapshot,
): AcceptedEvidenceHashSource {
  return {
    kind: snapshot.kind,
    sourceExtractionId: snapshot.sourceExtractionId,
    sourceSha256: snapshot.sourceSha256,
    acceptedPayload: snapshot.acceptedPayload,
    reviewDecisions: snapshot.reviewDecisions,
    acceptedBy: snapshot.acceptedBy,
    acceptedAt: snapshot.acceptedAt,
  };
}

export function computeAcceptedEvidenceHash(source: AcceptedEvidenceHashSource): string {
  return createHash("sha256").update(canonicalJson(source)).digest("hex");
}

export function verifyAcceptedEvidenceSnapshotHash(snapshot: AcceptedEvidenceSnapshot): boolean {
  return (
    computeAcceptedEvidenceHash(acceptedEvidenceHashSource(snapshot)) === snapshot.evidenceHash
  );
}
