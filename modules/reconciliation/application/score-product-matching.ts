import { z } from "zod";
import type { CanonicalProduct } from "@/modules/catalogue/domain/product";
import { proposeProductMatches } from "./propose-product-matches";

export const productMatchingEvalCaseSchema = z.object({
  caseId: z.string().min(1),
  rawProductName: z.string().min(1),
  barcode: z.string().nullable(),
  expectedProductId: z.string().nullable(),
  expectedStatus: z.enum(["auto_confirmed", "requires_confirmation", "unmatched"]),
});

export type ProductMatchingEvalCase = z.infer<typeof productMatchingEvalCaseSchema>;

export interface ProductMatchingEvalResult {
  datasetVersion: "product-matching-v1";
  totalCases: number;
  productAccuracyPercent: number;
  authorityAccuracyPercent: number;
  unsafeAutoMergeCount: number;
  passedCases: number;
  cases: Array<{
    caseId: string;
    expectedProductId: string | null;
    actualProductId: string | null;
    expectedStatus: ProductMatchingEvalCase["expectedStatus"];
    actualStatus: ProductMatchingEvalCase["expectedStatus"];
    passed: boolean;
  }>;
}

export function scoreProductMatchingCases(
  rawCases: unknown,
  products: readonly CanonicalProduct[],
): ProductMatchingEvalResult {
  const cases = productMatchingEvalCaseSchema.array().min(1).parse(rawCases);
  const outcomes = cases.map((evalCase, index) => {
    const source = {
      sourceKey: `eval:${evalCase.caseId}`,
      snapshotId: `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      evidenceHash: "a".repeat(64),
      kind: "supplier_catalogue" as const,
      sourcePath: `/cases/${index}`,
      rawProductName: evalCase.rawProductName,
      barcode: evalCase.barcode,
      sourceLabel: "KasiStock AI evaluation dataset",
    };
    const proposal = proposeProductMatches([source], products)[0];
    if (!proposal) throw new Error(`No proposal was returned for ${evalCase.caseId}.`);
    const actualProductId = proposal.recommendedProductId;
    const productPassed = actualProductId === evalCase.expectedProductId;
    const authorityPassed = proposal.status === evalCase.expectedStatus;
    return {
      caseId: evalCase.caseId,
      expectedProductId: evalCase.expectedProductId,
      actualProductId,
      expectedStatus: evalCase.expectedStatus,
      actualStatus: proposal.status,
      passed: productPassed && authorityPassed,
      productPassed,
      authorityPassed,
      unsafeAutoMerge:
        proposal.status === "auto_confirmed" && actualProductId !== evalCase.expectedProductId,
    };
  });

  return {
    datasetVersion: "product-matching-v1",
    totalCases: outcomes.length,
    productAccuracyPercent: percent(
      outcomes.filter((item) => item.productPassed).length,
      outcomes.length,
    ),
    authorityAccuracyPercent: percent(
      outcomes.filter((item) => item.authorityPassed).length,
      outcomes.length,
    ),
    unsafeAutoMergeCount: outcomes.filter((item) => item.unsafeAutoMerge).length,
    passedCases: outcomes.filter((item) => item.passed).length,
    cases: outcomes.map((item) => ({
      caseId: item.caseId,
      expectedProductId: item.expectedProductId,
      actualProductId: item.actualProductId,
      expectedStatus: item.expectedStatus,
      actualStatus: item.actualStatus,
      passed: item.passed,
    })),
  };
}

function percent(passed: number, total: number): number {
  return Math.round((passed / total) * 10_000) / 100;
}
