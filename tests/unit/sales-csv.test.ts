import { describe, expect, it } from "vitest";
import { demoSalesCsv } from "@/fixtures/extraction/demo-extractions";
import { parseSalesCsv, SalesCsvError } from "@/modules/extraction/application/sales-csv";

describe("parseSalesCsv", () => {
  it("parses a schema-valid sales period deterministically", () => {
    const result = parseSalesCsv(demoSalesCsv);

    expect(result.periodStart).toBe("2026-06-18");
    expect(result.periodEnd).toBe("2026-07-17");
    expect(result.lines).toHaveLength(4);
    expect(result.lines[0]?.grossRevenueCents).toBe(599760);
  });

  it("rejects missing required headers", () => {
    expect(() => parseSalesCsv("product_name,units_sold\nBread,2\n")).toThrowError(SalesCsvError);
  });
});
