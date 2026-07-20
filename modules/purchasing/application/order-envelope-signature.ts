import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { canonicalJson } from "@/modules/evidence/application/canonical-json";
import type {
  ApprovedOrderBundle,
  PurchaseOrderDraft,
  SignedApprovedOrderBundle,
  SignedPurchaseOrderDraft,
} from "../domain/contracts";

interface SigningContext {
  secret: string;
  scope: "configured" | "ephemeral";
}

let ephemeralSecret: string | null = null;

function signingContext(): SigningContext {
  const configured = process.env.EVIDENCE_SIGNING_SECRET?.trim();
  if (configured && configured.length >= 32) return { secret: configured, scope: "configured" };
  ephemeralSecret ??= randomBytes(48).toString("hex");
  return { secret: ephemeralSecret, scope: "ephemeral" };
}

function tokenFor(scope: string, value: unknown, secret: string): string {
  return createHmac("sha256", secret)
    .update(`${scope}:${canonicalJson(value)}`)
    .digest("hex");
}

function equalTokens(actual: string, expected: string): boolean {
  const left = Buffer.from(actual, "hex");
  const right = Buffer.from(expected, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}

export function signPurchaseOrderDraft(draft: PurchaseOrderDraft): SignedPurchaseOrderDraft {
  const context = signingContext();
  return {
    draft,
    token: tokenFor("purchase-order-draft-v1", draft, context.secret),
    signatureScope: context.scope,
  };
}

export function verifySignedPurchaseOrderDraft(envelope: SignedPurchaseOrderDraft): boolean {
  const context = signingContext();
  return equalTokens(
    envelope.token,
    tokenFor("purchase-order-draft-v1", envelope.draft, context.secret),
  );
}

export function signApprovedOrderBundle(bundle: ApprovedOrderBundle): SignedApprovedOrderBundle {
  const context = signingContext();
  return {
    bundle,
    token: tokenFor("approved-order-bundle-v1", bundle, context.secret),
    signatureScope: context.scope,
  };
}

export function verifySignedApprovedOrderBundle(envelope: SignedApprovedOrderBundle): boolean {
  const context = signingContext();
  return equalTokens(
    envelope.token,
    tokenFor("approved-order-bundle-v1", envelope.bundle, context.secret),
  );
}
