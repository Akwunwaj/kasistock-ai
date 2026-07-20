import type OpenAI from "openai";
import { describe, expect, it, vi } from "vitest";
import { canonicalProducts } from "@/fixtures/catalogue/canonical-products";
import { OpenAIProductMatchGateway } from "@/modules/reconciliation/infrastructure/openai-product-match-gateway";

const record = {
  sourceKey: "11111111-1111-4111-8111-111111111111:/offers/0",
  snapshotId: "11111111-1111-4111-8111-111111111111",
  evidenceHash: "a".repeat(64),
  kind: "supplier_catalogue" as const,
  sourcePath: "/offers/0",
  rawProductName: "Clover UHT Fullcream 2 Litre 6 Pack",
  barcode: null,
  sourceLabel: "Metro Cash & Carry",
};

describe("OpenAIProductMatchGateway", () => {
  it("uses strict structured output and never grants matching authority", async () => {
    const parse = vi.fn().mockResolvedValue({
      id: "resp_match_1",
      output_parsed: {
        suggestions: [
          {
            sourceKey: record.sourceKey,
            candidateProductId: "milk-clover-fullcream-2l",
            confidence: "medium",
            reasoning: "Brand, product type and pack size align.",
          },
        ],
      },
    });
    const gateway = new OpenAIProductMatchGateway(
      { responses: { parse } } as unknown as OpenAI,
      "gpt-5.6-sol",
    );

    const result = await gateway.propose([record], canonicalProducts);
    const request = parse.mock.calls[0]?.[0] as Record<string, unknown>;

    expect(result.output.suggestions[0]?.candidateProductId).toBe("milk-clover-fullcream-2l");
    expect(request.store).toBe(false);
    expect(request.text).toBeDefined();
    expect(JSON.stringify(request.input)).toContain("suggestions only");
  });
});
