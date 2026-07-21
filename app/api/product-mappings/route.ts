import { NextResponse } from "next/server";
import { z } from "zod";
import { canonicalProducts } from "@/fixtures/catalogue/canonical-products";
import {
  buildAcceptedProductMappingSet,
  ProductMappingAcceptanceError,
} from "@/modules/reconciliation/application/build-accepted-product-mapping-set";
import {
  parseAndVerifyAcceptedSnapshots,
  ReconciliationEvidenceError,
} from "@/modules/reconciliation/application/source-product-records";
import { getWorkflowPersistence } from "@/lib/persistence/server-workflow-persistence";
import {
  WorkflowPersistenceConflictError,
  WorkflowPersistenceError,
} from "@/modules/persistence/application/workflow-persistence";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const snapshots = parseAndVerifyAcceptedSnapshots(body.snapshots);
    const mappingSet = buildAcceptedProductMappingSet({
      snapshots,
      decisions: body.decisions,
      products: canonicalProducts,
      acceptedBy:
        typeof body.acceptedBy === "string" ? body.acceptedBy : "KasiStock AI demo merchant",
    });
    const persistence = await getWorkflowPersistence().recordProductMappingSet(
      mappingSet,
      snapshots,
    );
    return NextResponse.json({ mappingSet, persistence }, { status: 201 });
  } catch (error) {
    if (error instanceof WorkflowPersistenceError) {
      return errorResponse(503, "PERSISTENCE_UNAVAILABLE", error.message);
    }
    if (error instanceof WorkflowPersistenceConflictError) {
      return errorResponse(409, "IMMUTABLE_EVIDENCE_CONFLICT", error.message);
    }
    if (
      error instanceof ReconciliationEvidenceError ||
      error instanceof ProductMappingAcceptanceError
    ) {
      return errorResponse(
        400,
        error.code,
        error.message,
        error instanceof ProductMappingAcceptanceError && error.sourceKey
          ? { sourceKey: error.sourceKey, field: error.field }
          : undefined,
      );
    }
    if (error instanceof z.ZodError) {
      const issue = error.issues[0];
      const path = issue?.path.join(".") || "request";
      return errorResponse(
        400,
        "INVALID_MAPPING_REQUEST",
        `The ${path} field is invalid: ${issue?.message ?? "invalid value"}.`,
      );
    }
    console.error("Product mapping acceptance failed", safeErrorMetadata(error));
    return errorResponse(
      500,
      "MAPPING_ACCEPTANCE_FAILED",
      "Product mappings could not be accepted due to an unexpected server error. Retry once, then contact support with the error time.",
    );
  }
}

function errorResponse(
  status: number,
  code: string,
  message: string,
  details?: { sourceKey: string; field?: string },
) {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

function safeErrorMetadata(error: unknown) {
  return error instanceof Error
    ? { name: error.name, message: error.message }
    : { name: "Unknown" };
}
