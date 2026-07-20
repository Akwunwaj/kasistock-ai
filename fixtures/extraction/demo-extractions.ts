import type {
  SalesHistory,
  ShelfExtraction,
  SupplierCatalogueExtraction,
} from "@/modules/extraction/domain/contracts";

export const demoShelfExtraction: ShelfExtraction = {
  imageQuality: "medium",
  notes: [
    "The right side of the lower shelf is partly obscured.",
    "Quantities are visible-unit estimates, not a full stock count.",
  ],
  observedProducts: [
    {
      rawProductName: "Albany Superior White Bread 700g",
      visibleBrand: "Albany",
      visiblePackSize: "700g",
      estimatedQuantity: 5,
      confidence: "medium",
      evidenceDescription: "Five white Albany bread bags are visible in the front row.",
      uncertaintyReason: "One additional bag may be hidden behind the front row.",
    },
    {
      rawProductName: "Coca-Cola Original Taste 2L",
      visibleBrand: "Coca-Cola",
      visiblePackSize: "2L",
      estimatedQuantity: 8,
      confidence: "high",
      evidenceDescription: "Eight red-labelled 2L bottles are individually visible.",
      uncertaintyReason: null,
    },
    {
      rawProductName: "Clover Full Cream Milk 2L",
      visibleBrand: "Clover",
      visiblePackSize: "2L",
      estimatedQuantity: 2,
      confidence: "low",
      evidenceDescription: "Two green-and-white milk bottles are partially visible.",
      uncertaintyReason: "The labels and back row are partly occluded.",
    },
    {
      rawProductName: "Super Maize Meal 5kg",
      visibleBrand: "Super",
      visiblePackSize: "5kg",
      estimatedQuantity: 3,
      confidence: "high",
      evidenceDescription: "Three sealed 5kg maize meal bags are visible on the lower shelf.",
      uncertaintyReason: null,
    },
  ],
};

export const demoUbuntuSupplierExtraction: SupplierCatalogueExtraction = {
  supplierName: "Ubuntu Wholesale Foods",
  catalogueDate: "2026-07-18",
  currency: "ZAR",
  warnings: ["The promotional end date is not visible on the supplied page."],
  offers: [
    {
      rawProductName: "Albany White Bread 700g",
      barcode: null,
      unitPriceCents: 1649,
      casePriceCents: null,
      caseQuantity: null,
      minimumOrderQuantity: 10,
      promotion: "Buy 10 or more",
      confidence: "high",
    },
    {
      rawProductName: "Coke Original PET 2L x 6",
      barcode: null,
      unitPriceCents: null,
      casePriceCents: 10999,
      caseQuantity: 6,
      minimumOrderQuantity: 1,
      promotion: null,
      confidence: "high",
    },
    {
      rawProductName: "Clover Full Cream 2L x 6",
      barcode: null,
      unitPriceCents: null,
      casePriceCents: 14999,
      caseQuantity: 6,
      minimumOrderQuantity: 1,
      promotion: "Price appears to be promotional",
      confidence: "medium",
    },
    {
      rawProductName: "Super Maize Meal 5kg",
      barcode: "6001205005016",
      unitPriceCents: 5999,
      casePriceCents: null,
      caseQuantity: null,
      minimumOrderQuantity: 1,
      promotion: null,
      confidence: "high",
    },
  ],
};

export const demoMetroSupplierExtraction: SupplierCatalogueExtraction = {
  supplierName: "Metro Cash & Carry",
  catalogueDate: "2026-07-18",
  currency: "ZAR",
  warnings: [],
  offers: [
    {
      rawProductName: "Albany Superior White 700 gram x10",
      barcode: null,
      unitPriceCents: null,
      casePriceCents: 15990,
      caseQuantity: 10,
      minimumOrderQuantity: 1,
      promotion: null,
      confidence: "high",
    },
    {
      rawProductName: "Coca Cola Original 2000ml six pack",
      barcode: "5449000000996",
      unitPriceCents: null,
      casePriceCents: 10650,
      caseQuantity: 6,
      minimumOrderQuantity: 1,
      promotion: "Weekend price",
      confidence: "high",
    },
    {
      rawProductName: "Clover UHT Fullcream 2 Litre 6 Pack",
      barcode: null,
      unitPriceCents: null,
      casePriceCents: 14550,
      caseQuantity: 6,
      minimumOrderQuantity: 1,
      promotion: null,
      confidence: "high",
    },
    {
      rawProductName: "Maize Meal Super 5 KG",
      barcode: null,
      unitPriceCents: 6200,
      casePriceCents: null,
      caseQuantity: null,
      minimumOrderQuantity: 1,
      promotion: null,
      confidence: "high",
    },
  ],
};

export const demoSupplierExtraction = demoUbuntuSupplierExtraction;

export const demoSalesHistory: SalesHistory = {
  periodStart: "2026-06-18",
  periodEnd: "2026-07-17",
  currency: "ZAR",
  warnings: [],
  lines: [
    {
      rawProductName: "Albany Superior White 700g",
      barcode: "6001007001018",
      unitsSold: 240,
      grossRevenueCents: 599760,
      transactionCount: 222,
    },
    {
      rawProductName: "Coke Original PET 2L",
      barcode: null,
      unitsSold: 96,
      grossRevenueCents: 268704,
      transactionCount: 88,
    },
    {
      rawProductName: "Clover Milk Full Cream 2 litre",
      barcode: "6001299011023",
      unitsSold: 154,
      grossRevenueCents: 538846,
      transactionCount: 141,
    },
    {
      rawProductName: "Super Maize 5000g",
      barcode: null,
      unitsSold: 42,
      grossRevenueCents: 377958,
      transactionCount: 39,
    },
  ],
};

export const demoSalesCsv = `product_name,barcode,units_sold,gross_revenue_cents,transaction_count,period_start,period_end
Albany Superior White 700g,6001007001018,240,599760,222,2026-06-18,2026-07-17
Coke Original PET 2L,,96,268704,88,2026-06-18,2026-07-17
Clover Milk Full Cream 2 litre,6001299011023,154,538846,141,2026-06-18,2026-07-17
Super Maize 5000g,,42,377958,39,2026-06-18,2026-07-17
`;
