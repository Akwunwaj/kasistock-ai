import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { demoShelfExtraction } from "@/fixtures/extraction/demo-extractions";
import { collectReviewIssues } from "@/modules/extraction/application/review-issues";
import { EXTRACTION_CONTRACT_VERSION } from "@/modules/extraction/domain/contracts";
import {
  buildAcceptedEvidenceSnapshot,
  EvidenceAcceptanceError,
} from "@/modules/evidence/application/build-accepted-evidence-snapshot";
import { signExtractionEnvelope } from "@/modules/evidence/application/extraction-signature";
import { extractionEnvelopeSchema } from "@/modules/evidence/domain/contracts";

function signedShelfExtraction() {
  const envelope = extractionEnvelopeSchema.parse({
    extractionId: randomUUID(),
    kind: "shelf_image",
    filename: "shelf.jpg",
    mediaType: "image/jpeg",
    sha256: "a".repeat(64),
    sizeBytes: 1234,
    model: "gpt-5.6-sol",
    responseId: "resp_test",
    contractVersion: EXTRACTION_CONTRACT_VERSION,
    createdAt: "2026-07-18T12:00:00.000Z",
    mode: "demo",
    output: demoShelfExtraction,
    reviewIssues: collectReviewIssues("shelf_image", demoShelfExtraction),
  });
  return { envelope, ...signExtractionEnvelope(envelope) };
}

describe("buildAcceptedEvidenceSnapshot", () => {
  it("blocks acceptance while required review paths are unresolved", () => {
    const signed = signedShelfExtraction();

    expect(() =>
      buildAcceptedEvidenceSnapshot({
        ...signed,
        acceptedPayload: demoShelfExtraction,
        reviewDecisions: [],
        acceptedBy: "merchant",
      }),
    ).toThrowError(EvidenceAcceptanceError);
  });

  it("creates a reproducible evidence hash after human review", () => {
    const signed = signedShelfExtraction();
    const now = new Date("2026-07-18T12:30:00.000Z");
    const input = {
      ...signed,
      acceptedPayload: demoShelfExtraction,
      reviewDecisions: [
        { path: "/observedProducts/0", decision: "accepted", note: null },
        { path: "/observedProducts/2", decision: "accepted", note: null },
      ],
      acceptedBy: "merchant",
      now,
    } as const;

    const first = buildAcceptedEvidenceSnapshot(input);
    const second = buildAcceptedEvidenceSnapshot(input);

    expect(first.evidenceHash).toBe(second.evidenceHash);
    expect(first.sourceExtractionId).toBe(signed.envelope.extractionId);
    expect(first.acceptedPayload).toEqual(demoShelfExtraction);
  });

  it("detects tampering with a signed extraction", () => {
    const signed = signedShelfExtraction();
    const tampered = {
      ...signed.envelope,
      filename: "changed.jpg",
    };

    expect(() =>
      buildAcceptedEvidenceSnapshot({
        envelope: tampered,
        token: signed.token,
        acceptedPayload: demoShelfExtraction,
        reviewDecisions: [
          { path: "/observedProducts/0", decision: "accepted", note: null },
          { path: "/observedProducts/2", decision: "accepted", note: null },
        ],
        acceptedBy: "merchant",
      }),
    ).toThrowError(/changed after the server signed/);
  });
});
