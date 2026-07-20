import { describe, expect, it } from "vitest";
import {
  EvidenceFileError,
  validateEvidenceFile,
} from "@/modules/extraction/application/evidence-file";

describe("validateEvidenceFile", () => {
  it("accepts a PNG whose content signature matches its media type", async () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1]);
    const file = new File([bytes], "shelf.png", { type: "image/png" });

    const result = await validateEvidenceFile("shelf_image", file);

    expect(result.filename).toBe("shelf.png");
    expect(result.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(result.base64Data).toBe(Buffer.from(bytes).toString("base64"));
  });

  it("rejects a file whose bytes do not match its declared media type", async () => {
    const file = new File([new Uint8Array([1, 2, 3, 4])], "fake.pdf", {
      type: "application/pdf",
    });

    await expect(validateEvidenceFile("supplier_catalogue", file)).rejects.toMatchObject({
      code: "SIGNATURE_MISMATCH",
    } satisfies Partial<EvidenceFileError>);
  });

  it("rejects PDFs for shelf-image extraction", async () => {
    const file = new File(["%PDF-1.7"], "shelf.pdf", { type: "application/pdf" });

    await expect(validateEvidenceFile("shelf_image", file)).rejects.toMatchObject({
      code: "UNSUPPORTED_MEDIA_TYPE",
    } satisfies Partial<EvidenceFileError>);
  });
});
