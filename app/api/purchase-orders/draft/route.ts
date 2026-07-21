import { NextResponse } from "next/server";
import { z } from "zod";
import { acceptedEvidenceSnapshotSchema } from "@/modules/evidence/domain/contracts";
import { acceptedProductMappingSetSchema } from "@/modules/reconciliation/domain/contracts";
import {
  buildPurchaseOrderDraft,
  PurchaseOrderDraftError,
} from "@/modules/purchasing/application/build-purchase-order-draft";
import { signPurchaseOrderDraft } from "@/modules/purchasing/application/order-envelope-signature";
import {
  editableOrderSelectionSchema,
  merchantOrderProfileSchema,
  orderFulfilmentSchema,
} from "@/modules/purchasing/domain/contracts";
import { getWorkflowPersistence } from "@/lib/persistence/server-workflow-persistence";
import { WorkflowPersistenceError } from "@/modules/persistence/application/workflow-persistence";

export const runtime = "nodejs";

const requestSchema = z.object({
  snapshots: acceptedEvidenceSnapshotSchema.array().min(1),
  mappingSet: acceptedProductMappingSetSchema,
  budgetCents: z.number().int().positive().max(10_000_000),
  merchant: merchantOrderProfileSchema,
  fulfilment: orderFulfilmentSchema,
  selections: editableOrderSelectionSchema.array().min(1),
});

export async function POST(request: Request) {
  try {
    const input = requestSchema.parse(await request.json());
    const draft = buildPurchaseOrderDraft(input);
    const persistence = await getWorkflowPersistence().recordPurchaseOrderDraft(draft);
    return NextResponse.json(
      { envelope: signPurchaseOrderDraft(draft), persistence },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof WorkflowPersistenceError) {
      return NextResponse.json(
        { error: { code: "PERSISTENCE_UNAVAILABLE", message: error.message } },
        { status: 503 },
      );
    }
    if (error instanceof PurchaseOrderDraftError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: 400 },
      );
    }
    console.error("Purchase-order draft generation failed", safeErrorMetadata(error));
    return NextResponse.json(
      {
        error: {
          code: "INVALID_DRAFT_REQUEST",
          message: "The purchase-order draft request is invalid.",
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
