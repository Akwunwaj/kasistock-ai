import { NextResponse } from "next/server";
import { z } from "zod";
import { verifySignedApprovedOrderBundle } from "@/modules/purchasing/application/order-envelope-signature";
import {
  computeApprovedOrderBundleHash,
  computeSupplierPurchaseOrderHash,
} from "@/modules/purchasing/application/purchase-order-hashes";
import { signedApprovedOrderBundleSchema } from "@/modules/purchasing/domain/contracts";
import { generatePurchaseOrderPdf } from "@/modules/purchasing/infrastructure/purchase-order-pdf";

export const runtime = "nodejs";

const requestSchema = z.object({
  envelope: signedApprovedOrderBundleSchema,
  purchaseOrderId: z.uuid(),
});

export async function POST(request: Request) {
  try {
    const input = requestSchema.parse(await request.json());
    if (!verifySignedApprovedOrderBundle(input.envelope)) {
      return errorResponse(
        400,
        "INVALID_BUNDLE_SIGNATURE",
        "The approved order bundle could not be verified.",
      );
    }
    if (
      computeApprovedOrderBundleHash(input.envelope.bundle) !== input.envelope.bundle.bundleHash
    ) {
      return errorResponse(
        400,
        "INVALID_BUNDLE_HASH",
        "The approved order bundle failed its integrity check.",
      );
    }
    const order = input.envelope.bundle.purchaseOrders.find(
      (candidate) => candidate.purchaseOrderId === input.purchaseOrderId,
    );
    if (!order)
      return errorResponse(404, "PURCHASE_ORDER_NOT_FOUND", "The purchase order was not found.");
    if (computeSupplierPurchaseOrderHash(order) !== order.purchaseOrderHash) {
      return errorResponse(
        400,
        "INVALID_PURCHASE_ORDER_HASH",
        "The purchase order failed its integrity check.",
      );
    }
    const bytes = await generatePurchaseOrderPdf(order);
    return new NextResponse(Buffer.from(bytes), {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${order.purchaseOrderNumber}.pdf"`,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    console.error("Purchase-order PDF generation failed", safeErrorMetadata(error));
    return errorResponse(400, "INVALID_PDF_REQUEST", "The purchase-order PDF request is invalid.");
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
