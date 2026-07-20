import { randomUUID } from "node:crypto";
import {
  acceptedEvidenceSnapshotSchema,
  extractionEnvelopeSchema,
  reviewDecisionSchema,
  type AcceptedEvidenceSnapshot,
} from "../domain/contracts";
import { parseExtractionOutput } from "@/modules/extraction/domain/contracts";
import { verifyExtractionEnvelope } from "./extraction-signature";
import { computeAcceptedEvidenceHash } from "./accepted-evidence-hash";

export class EvidenceAcceptanceError extends Error {
  constructor(
    public readonly code:
      "INVALID_SIGNATURE" | "UNRESOLVED_REVIEW_ISSUES" | "INVALID_ACCEPTED_PAYLOAD",
    message: string,
  ) {
    super(message);
    this.name = "EvidenceAcceptanceError";
  }
}

interface BuildSnapshotInput {
  envelope: unknown;
  token: string;
  acceptedPayload: unknown;
  reviewDecisions: unknown;
  acceptedBy: string;
  now?: Date;
}

export function buildAcceptedEvidenceSnapshot(input: BuildSnapshotInput): AcceptedEvidenceSnapshot {
  const envelope = extractionEnvelopeSchema.parse(input.envelope);
  if (!verifyExtractionEnvelope(envelope, input.token)) {
    throw new EvidenceAcceptanceError(
      "INVALID_SIGNATURE",
      "The extraction evidence was changed after the server signed it.",
    );
  }

  let acceptedPayload: ReturnType<typeof parseExtractionOutput>;
  try {
    acceptedPayload = parseExtractionOutput(envelope.kind, input.acceptedPayload);
  } catch {
    throw new EvidenceAcceptanceError(
      "INVALID_ACCEPTED_PAYLOAD",
      "The corrected evidence does not satisfy the extraction contract.",
    );
  }

  const decisions = reviewDecisionSchema.array().parse(input.reviewDecisions);
  const reviewedPaths = new Set(decisions.map((decision) => decision.path));
  const unresolved = envelope.reviewIssues.filter((issue) => !reviewedPaths.has(issue.path));
  if (unresolved.length > 0) {
    throw new EvidenceAcceptanceError(
      "UNRESOLVED_REVIEW_ISSUES",
      `${unresolved.length} required review issue(s) remain unresolved.`,
    );
  }

  const acceptedAt = (input.now ?? new Date()).toISOString();
  const hashSource = {
    kind: envelope.kind,
    sourceExtractionId: envelope.extractionId,
    sourceSha256: envelope.sha256,
    acceptedPayload,
    reviewDecisions: decisions,
    acceptedBy: input.acceptedBy,
    acceptedAt,
  };

  return acceptedEvidenceSnapshotSchema.parse({
    snapshotId: randomUUID(),
    version: 1,
    ...hashSource,
    evidenceHash: computeAcceptedEvidenceHash(hashSource),
  });
}
