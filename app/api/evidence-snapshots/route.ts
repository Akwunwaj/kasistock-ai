import { NextResponse } from "next/server";
import {
  buildAcceptedEvidenceSnapshot,
  EvidenceAcceptanceError,
} from "@/modules/evidence/application/build-accepted-evidence-snapshot";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const snapshot = buildAcceptedEvidenceSnapshot({
      envelope: body.envelope,
      token: typeof body.token === "string" ? body.token : "",
      acceptedPayload: body.acceptedPayload,
      reviewDecisions: body.reviewDecisions,
      acceptedBy: typeof body.acceptedBy === "string" ? body.acceptedBy : "demo-merchant",
    });
    return NextResponse.json({ snapshot }, { status: 201 });
  } catch (error) {
    if (error instanceof EvidenceAcceptanceError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: 400 },
      );
    }
    console.error("Evidence acceptance failed", safeErrorMetadata(error));
    return NextResponse.json(
      {
        error: {
          code: "INVALID_ACCEPTANCE_REQUEST",
          message: "The evidence acceptance request is invalid.",
        },
      },
      { status: 400 },
    );
  }
}

function safeErrorMetadata(error: unknown) {
  return error instanceof Error
    ? { name: error.name, message: error.message }
    : { name: "Unknown" };
}
