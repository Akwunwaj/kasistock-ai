import { NextResponse } from "next/server";
import { z } from "zod";
import {
  approvePurchaseOrder,
  PurchaseOrderApprovalError,
} from "@/modules/purchasing/application/approve-purchase-order";
import {
  signApprovedOrderBundle,
  verifySignedPurchaseOrderDraft,
} from "@/modules/purchasing/application/order-envelope-signature";
import { signedPurchaseOrderDraftSchema } from "@/modules/purchasing/domain/contracts";
import { verifyPurchaseOrderDraftHash } from "@/modules/purchasing/application/purchase-order-hashes";
import { getWorkflowPersistence } from "@/lib/persistence/server-workflow-persistence";
import { WorkflowPersistenceError } from "@/modules/persistence/application/workflow-persistence";

export const runtime = "nodejs";

const requestSchema = z.object({
  envelope: signedPurchaseOrderDraftSchema,
  approvedBy: z.string().min(2).max(120),
  confirmed: z.literal(true),
});

export async function POST(request: Request) {
  try {
    const input = requestSchema.parse(await request.json());
    if (!verifySignedPurchaseOrderDraft(input.envelope)) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_DRAFT_SIGNATURE",
            message: "The signed purchase-order draft could not be verified.",
          },
        },
        { status: 400 },
      );
    }
    if (!verifyPurchaseOrderDraftHash(input.envelope.draft)) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_DRAFT_HASH",
            message: "The purchase-order draft failed its integrity check.",
          },
        },
        { status: 400 },
      );
    }
    const bundle = approvePurchaseOrder({
      draft: input.envelope.draft,
      approvedBy: input.approvedBy,
      confirmed: input.confirmed,
    });
    const persistence = await getWorkflowPersistence().recordApprovedOrderBundle(bundle);
    return NextResponse.json(
      { envelope: signApprovedOrderBundle(bundle), persistence },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof WorkflowPersistenceError) {
      return NextResponse.json(
        { error: { code: "PERSISTENCE_UNAVAILABLE", message: error.message } },
        { status: 503 },
      );
    }
    if (error instanceof PurchaseOrderApprovalError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: 400 },
      );
    }
    console.error("Purchase-order approval failed", safeErrorMetadata(error));
    return NextResponse.json(
      {
        error: {
          code: "INVALID_APPROVAL_REQUEST",
          message: "The purchase-order approval request is invalid.",
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
