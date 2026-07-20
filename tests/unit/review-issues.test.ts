import { describe, expect, it } from "vitest";
import { collectReviewIssues } from "@/modules/extraction/application/review-issues";
import {
  demoShelfExtraction,
  demoSupplierExtraction,
} from "@/fixtures/extraction/demo-extractions";

describe("collectReviewIssues", () => {
  it("flags non-high-confidence shelf observations", () => {
    const issues = collectReviewIssues("shelf_image", demoShelfExtraction);

    expect(issues.map((issue) => issue.path)).toEqual([
      "/observedProducts/0",
      "/observedProducts/2",
    ]);
  });

  it("flags uncertain supplier offers", () => {
    const issues = collectReviewIssues("supplier_catalogue", demoSupplierExtraction);

    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("/offers/2");
  });
});
