import { NextResponse } from "next/server";
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
import { WorkflowPersistenceError } from "@/modules/persistence/application/workflow-persistence";

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
    if (
      error instanceof ReconciliationEvidenceError ||
      error instanceof ProductMappingAcceptanceError
    ) {
      return errorResponse(400, error.code, error.message);
    }
    console.error("Product mapping acceptance failed", safeErrorMetadata(error));
    return errorResponse(400, "INVALID_MAPPING_REQUEST", "The product mapping request is invalid.");
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
