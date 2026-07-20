import { NextResponse } from "next/server";
import { canonicalProducts } from "@/fixtures/catalogue/canonical-products";
import { createDemoAcceptedEvidenceBundle } from "@/fixtures/decision/demo-accepted-evidence";
import { getExtractionModel, getOpenAIClient } from "@/lib/openai/server-client";
import { mergeGptProposals } from "@/modules/reconciliation/application/merge-gpt-proposals";
import { proposeProductMatches } from "@/modules/reconciliation/application/propose-product-matches";
import {
  extractSourceProductRecords,
  parseAndVerifyAcceptedSnapshots,
  ReconciliationEvidenceError,
} from "@/modules/reconciliation/application/source-product-records";
import { OpenAIProductMatchGateway } from "@/modules/reconciliation/infrastructure/openai-product-match-gateway";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  const snapshots = createDemoAcceptedEvidenceBundle();
  const records = extractSourceProductRecords(snapshots);
  const proposals = proposeProductMatches(records, canonicalProducts);
  return NextResponse.json({ snapshots, products: canonicalProducts, proposals, mode: "demo" });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const snapshots = parseAndVerifyAcceptedSnapshots(body.snapshots);
    const records = extractSourceProductRecords(snapshots);
    const deterministic = proposeProductMatches(records, canonicalProducts);
    const useGpt = body.useGpt === true;

    if (!useGpt || deterministic.every((proposal) => proposal.status === "auto_confirmed")) {
      return NextResponse.json({
        products: canonicalProducts,
        proposals: deterministic,
        mode: "deterministic",
      });
    }

    const unresolvedRecords = deterministic
      .filter((proposal) => proposal.status !== "auto_confirmed")
      .map((proposal) => proposal.source);
    const gateway = new OpenAIProductMatchGateway(getOpenAIClient(), getExtractionModel());
    const result = await gateway.propose(unresolvedRecords, canonicalProducts);
    return NextResponse.json({
      products: canonicalProducts,
      proposals: mergeGptProposals(deterministic, result.output, canonicalProducts),
      mode: "gpt_assisted",
      model: result.model,
      responseId: result.responseId,
    });
  } catch (error) {
    if (error instanceof ReconciliationEvidenceError) {
      return errorResponse(400, error.code, error.message);
    }
    if (error instanceof Error && error.message.includes("OPENAI_API_KEY")) {
      return errorResponse(503, "OPENAI_NOT_CONFIGURED", error.message);
    }
    console.error("Product reconciliation proposal failed", safeErrorMetadata(error));
    return errorResponse(400, "INVALID_RECONCILIATION_REQUEST", "The evidence bundle is invalid.");
  }
}

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function safeErrorMetadata(error: unknown) {
  return error instanceof Error
    ? { name: error.name, message: error.message }
    : { name: "Unknown" };
}
