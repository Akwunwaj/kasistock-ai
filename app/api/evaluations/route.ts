import { NextResponse } from "next/server";
import cases from "@/evals/product-matching-cases.json";
import { canonicalProducts } from "@/fixtures/catalogue/canonical-products";
import { scoreProductMatchingCases } from "@/modules/reconciliation/application/score-product-matching";

export async function GET() {
  return NextResponse.json(scoreProductMatchingCases(cases, canonicalProducts));
}
