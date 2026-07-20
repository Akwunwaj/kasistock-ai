import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import type { SupplierPurchaseOrder } from "@/modules/purchasing/domain/contracts";
import { generatePurchaseOrderPdf } from "@/modules/purchasing/infrastructure/purchase-order-pdf";

const order: SupplierPurchaseOrder = {
  purchaseOrderId: "88888888-8888-4888-8888-888888888888",
  purchaseOrderNumber: "KSI-20260718-DEMO-SUPPLIER-01",
  supplierId: "demo-supplier",
  supplierName: "Demo Supplier",
  merchant: {
    displayName: "Thandi's Corner Shop",
    tradingAddress: "12 Demo Street, Khayelitsha, Cape Town",
    contactName: "Thandi Mokoena",
    contactPhone: "+27 82 555 0142",
  },
  fulfilment: {
    method: "collection",
    requestedDate: "2026-07-22",
    note: "Confirm availability before collection.",
  },
  lines: [
    {
      productId: "bread-albany-white-700g",
      productName: "Albany Superior White Bread 700g",
      packQuantity: 12,
      selectedPacks: 2,
      selectedUnits: 24,
      packCostCents: 19_188,
      lineCostCents: 38_376,
    },
  ],
  subtotalCents: 38_376,
  totalCents: 38_376,
  currency: "ZAR",
  draftHash: "a".repeat(64),
  approvalHash: "b".repeat(64),
  generatedAt: "2026-07-18T12:05:00.000Z",
  purchaseOrderHash: "c".repeat(64),
};

describe("purchase-order PDF", () => {
  it("creates a readable PDF with stable metadata", async () => {
    const bytes = await generatePurchaseOrderPdf(order);
    expect(Buffer.from(bytes).subarray(0, 5).toString()).toBe("%PDF-");

    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBe(1);
    expect(pdf.getTitle()).toBe(`Purchase Order ${order.purchaseOrderNumber}`);
  });
});
