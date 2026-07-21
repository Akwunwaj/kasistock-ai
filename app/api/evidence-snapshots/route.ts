import { NextResponse } from "next/server";
import {
  buildAcceptedEvidenceSnapshot,
  EvidenceAcceptanceError,
} from "@/modules/evidence/application/build-accepted-evidence-snapshot";
import { extractionEnvelopeSchema } from "@/modules/evidence/domain/contracts";
import { getWorkflowPersistence } from "@/lib/persistence/server-workflow-persistence";
import {
  WorkflowPersistenceConflictError,
  WorkflowPersistenceError,
} from "@/modules/persistence/application/workflow-persistence";

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
    const envelope = extractionEnvelopeSchema.parse(body.envelope);
    const result = await getWorkflowPersistence().recordAcceptedEvidence(envelope, snapshot);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof WorkflowPersistenceConflictError) {
      return NextResponse.json(
        { error: { code: "EVIDENCE_ALREADY_ACCEPTED", message: error.message } },
        { status: 409 },
      );
    }
    if (error instanceof WorkflowPersistenceError) {
      console.error("Evidence persistence failed", safePersistenceErrorMetadata(error));
      return NextResponse.json(
        { error: { code: "PERSISTENCE_UNAVAILABLE", message: error.message } },
        { status: 503 },
      );
    }
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

function safePersistenceErrorMetadata(error: WorkflowPersistenceError) {
  const cause = error.cause;
  if (!(cause instanceof Error)) return { name: error.name };
  const databaseCause = cause as Error & { code?: string; constraint?: string };
  return {
    name: databaseCause.name,
    message: databaseCause.message,
    ...(databaseCause.code ? { code: databaseCause.code } : {}),
    ...(databaseCause.constraint ? { constraint: databaseCause.constraint } : {}),
  };
}

function safeErrorMetadata(error: unknown) {
  return error instanceof Error
    ? { name: error.name, message: error.message }
    : { name: "Unknown" };
}
