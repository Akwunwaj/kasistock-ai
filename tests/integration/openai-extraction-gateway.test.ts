import { describe, expect, it, vi } from "vitest";
import type OpenAI from "openai";
import {
  demoShelfExtraction,
  demoUbuntuSupplierExtraction,
} from "@/fixtures/extraction/demo-extractions";
import { OpenAIExtractionGateway } from "@/modules/extraction/infrastructure/openai-extraction-gateway";

describe("OpenAIExtractionGateway", () => {
  it("uses the Responses API with structured output, image detail, and storage disabled", async () => {
    const parse = vi.fn().mockResolvedValue({
      id: "resp_123",
      output_parsed: demoShelfExtraction,
    });
    const client = { responses: { parse } } as unknown as OpenAI;
    const gateway = new OpenAIExtractionGateway(client, "gpt-5.6-sol");

    const result = await gateway.extractShelf({
      filename: "shelf.png",
      mimeType: "image/png",
      base64Data: "iVBORw0KGgo=",
    });

    expect(result.output).toEqual(demoShelfExtraction);
    expect(result.responseId).toBe("resp_123");
    expect(parse).toHaveBeenCalledOnce();
    const request = parse.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(request.model).toBe("gpt-5.6-sol");
    expect(request.store).toBe(false);
    expect(request.text).toBeDefined();
    expect(JSON.stringify(request.input)).toContain("data:image/png;base64,iVBORw0KGgo=");
  });

  it("encodes PDF evidence as a data URI for the Responses API", async () => {
    const parse = vi.fn().mockResolvedValue({
      id: "resp_pdf_123",
      output_parsed: demoUbuntuSupplierExtraction,
    });
    const client = { responses: { parse } } as unknown as OpenAI;
    const gateway = new OpenAIExtractionGateway(client, "gpt-5.6-sol");

    const result = await gateway.extractSupplierCatalogue({
      filename: "catalogue.pdf",
      mimeType: "application/pdf",
      base64Data: "JVBERi0xLjQ=",
    });

    expect(result.output).toEqual(demoUbuntuSupplierExtraction);
    expect(result.responseId).toBe("resp_pdf_123");
    const request = parse.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(JSON.stringify(request.input)).toContain("data:application/pdf;base64,JVBERi0xLjQ=");
  });
});
