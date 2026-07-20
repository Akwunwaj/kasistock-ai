import { cents } from "@/modules/shared/domain/money";

export const demoScenario = {
  summary: {
    budgetCents: cents(150_000),
    orderTotalCents: cents(148_260),
    remainingCents: cents(1_740),
    budgetUtilisationPercent: 98.84,
    stockOutsAvoided: 3,
    expectedGrossProfitCents: cents(28_600),
    supplierSavingsCents: cents(4_120),
    productsSelected: 7,
  },
  evidence: [
    { type: "IMG", name: "Shelf photo", detail: "18 products observed", needsReview: true },
    { type: "PDF", name: "Ubuntu Wholesale", detail: "24 offers extracted", needsReview: false },
    { type: "IMG", name: "Metro Cash & Carry", detail: "19 offers extracted", needsReview: false },
    { type: "CSV", name: "30-day sales history", detail: "612 transactions", needsReview: false },
  ],
  recommendations: [
    {
      rank: 1,
      productId: "bread-albany-700g",
      productName: "Albany Superior White 700g",
      quantity: 48,
      supplierName: "Ubuntu Wholesale",
      lineCostCents: cents(57_600),
      daysOfCover: 3.8,
      explanation:
        "Current stock covers less than one day and bread has the highest essential-item stock-out risk.",
    },
    {
      rank: 2,
      productId: "milk-fullcream-2l",
      productName: "Full-cream milk 2L",
      quantity: 24,
      supplierName: "Metro Cash & Carry",
      lineCostCents: cents(42_960),
      daysOfCover: 3.1,
      explanation:
        "Supplier B is cheaper per unit and expected demand would otherwise exhaust stock tomorrow.",
    },
    {
      rank: 3,
      productId: "maize-meal-5kg",
      productName: "Super Maize Meal 5kg",
      quantity: 12,
      supplierName: "Ubuntu Wholesale",
      lineCostCents: cents(30_000),
      daysOfCover: 5.4,
      explanation:
        "High velocity and strong contribution justify priority over slower premium grocery items.",
    },
    {
      rank: 4,
      productId: "coke-2l",
      productName: "Coca-Cola Original 2L",
      quantity: 12,
      supplierName: "Metro Cash & Carry",
      lineCostCents: cents(17_700),
      daysOfCover: 4.0,
      explanation:
        "Quantity is capped to avoid excess stock while preserving high-turnover weekend availability.",
    },
  ],
  audit: [
    { time: "09:02", event: "Shelf image and supplier evidence uploaded" },
    { time: "09:03", event: "GPT-5.6 structured extraction completed" },
    { time: "09:05", event: "Merchant review requested for one quantity" },
    { time: "09:07", event: "R1,500 deterministic scenario calculated" },
    { time: "09:08", event: "Recommendation version v1 generated" },
  ],
} as const;
