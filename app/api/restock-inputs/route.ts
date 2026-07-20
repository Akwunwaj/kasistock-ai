import { NextResponse } from "next/server";
import { z } from "zod";
import { canonicalProducts } from "@/fixtures/catalogue/canonical-products";
import { optimiseRestockPlan } from "@/modules/optimisation/domain/optimise-restock-plan";
import { acceptedProductMappingSetSchema } from "@/modules/reconciliation/domain/contracts";
import {
  parseAndVerifyAcceptedSnapshots,
  ReconciliationEvidenceError,
} from "@/modules/reconciliation/application/source-product-records";
import {
  buildRestockInputs,
  RestockInputError,
} from "@/modules/restocking/application/build-restock-inputs";

export const runtime = "nodejs";

const budgetSchema = z.number().int().positive().max(10_000_000);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const snapshots = parseAndVerifyAcceptedSnapshots(body.snapshots);
    const mappingSet = acceptedProductMappingSetSchema.parse(body.mappingSet);
    const budgetCents = budgetSchema.parse(body.budgetCents);
    const inputs = buildRestockInputs({ snapshots, mappingSet, products: canonicalProducts });
    const optimisation = optimiseRestockPlan(inputs.candidates, budgetCents);
    return NextResponse.json({ inputs, optimisation });
  } catch (error) {
    if (error instanceof ReconciliationEvidenceError || error instanceof RestockInputError) {
      return errorResponse(400, error.code, error.message);
    }
    console.error("Restock input generation failed", safeErrorMetadata(error));
    return errorResponse(
      400,
      "INVALID_RESTOCK_REQUEST",
      "The restock calculation request is invalid.",
    );
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
