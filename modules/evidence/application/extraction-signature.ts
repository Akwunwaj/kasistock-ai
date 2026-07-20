import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { ExtractionEnvelope } from "../domain/contracts";
import { canonicalJson } from "./canonical-json";

const configuredSecret = process.env.EVIDENCE_SIGNING_SECRET;
const ephemeralSecret = randomBytes(32).toString("base64url");

export function signExtractionEnvelope(envelope: ExtractionEnvelope): {
  token: string;
  signatureScope: "configured" | "ephemeral";
} {
  return {
    token: createSignature(envelope),
    signatureScope: configuredSecret && configuredSecret.length >= 32 ? "configured" : "ephemeral",
  };
}

export function verifyExtractionEnvelope(envelope: ExtractionEnvelope, token: string): boolean {
  const expected = Buffer.from(createSignature(envelope));
  const supplied = Buffer.from(token);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

function createSignature(envelope: ExtractionEnvelope): string {
  return createHmac("sha256", signingSecret()).update(canonicalJson(envelope)).digest("base64url");
}

function signingSecret(): string {
  return configuredSecret && configuredSecret.length >= 32 ? configuredSecret : ephemeralSecret;
}
