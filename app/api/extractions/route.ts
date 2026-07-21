import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getExtractionModel, getOpenAIClient } from "@/lib/openai/server-client";
import {
  validateEvidenceFile,
  EvidenceFileError,
} from "@/modules/extraction/application/evidence-file";
import { parseSalesCsv, SalesCsvError } from "@/modules/extraction/application/sales-csv";
import { collectReviewIssues } from "@/modules/extraction/application/review-issues";
import {
  evidenceKindSchema,
  EXTRACTION_CONTRACT_VERSION,
  type EvidenceKind,
  type ExtractionOutput,
} from "@/modules/extraction/domain/contracts";
import { OpenAIExtractionGateway } from "@/modules/extraction/infrastructure/openai-extraction-gateway";
import { extractionEnvelopeSchema } from "@/modules/evidence/domain/contracts";
import { signExtractionEnvelope } from "@/modules/evidence/application/extraction-signature";
import {
  demoMetroSupplierExtraction,
  demoSalesCsv,
  demoSalesHistory,
  demoShelfExtraction,
  demoUbuntuSupplierExtraction,
} from "@/fixtures/extraction/demo-extractions";
import { getWorkflowPersistence } from "@/lib/persistence/server-workflow-persistence";
import { WorkflowPersistenceError } from "@/modules/persistence/application/workflow-persistence";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawKind = url.searchParams.get("kind") ?? "shelf_image";
  const parsedKind = evidenceKindSchema.safeParse(rawKind);
  if (!parsedKind.success) {
    return errorResponse(
      400,
      "INVALID_KIND",
      "Choose shelf_image, supplier_catalogue or sales_history.",
    );
  }

  const kind = parsedKind.data;
  const supplier = url.searchParams.get("supplier") === "metro" ? "metro" : "ubuntu";
  const output = demoOutput(kind, supplier);
  const filename =
    kind === "shelf_image"
      ? "demo-shelf.jpg"
      : kind === "sales_history"
        ? "demo-sales-history.csv"
        : supplier === "metro"
          ? "demo-metro-price-list.pdf"
          : "demo-ubuntu-price-list.pdf";
  const mediaType =
    kind === "shelf_image"
      ? "image/jpeg"
      : kind === "sales_history"
        ? "text/csv"
        : "application/pdf";
  const sizeBytes =
    kind === "shelf_image"
      ? 421_307
      : kind === "sales_history"
        ? Buffer.byteLength(demoSalesCsv)
        : 188_420;
  const envelope = createEnvelope({
    kind,
    filename,
    mediaType,
    sha256: createHash("sha256").update(`${kind}:${supplier}:${filename}`).digest("hex"),
    sizeBytes,
    model: kind === "sales_history" ? "deterministic-csv-parser-v1" : getExtractionModel(),
    responseId: `demo_${randomUUID()}`,
    mode: "demo",
    output,
  });
  const persistence = await getWorkflowPersistence().recordExtraction(envelope);
  return NextResponse.json({ envelope, ...signExtractionEnvelope(envelope), persistence });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const parsedKind = evidenceKindSchema.safeParse(formData.get("kind"));
    const file = formData.get("file");

    if (!parsedKind.success) {
      return errorResponse(
        400,
        "INVALID_KIND",
        "Choose shelf_image, supplier_catalogue or sales_history.",
      );
    }
    if (!(file instanceof File)) {
      return errorResponse(400, "FILE_REQUIRED", "Attach one evidence file.");
    }

    const validated = await validateEvidenceFile(parsedKind.data, file);
    if (parsedKind.data === "sales_history") {
      const output = parseSalesCsv(Buffer.from(validated.bytes).toString("utf8"));
      const envelope = createEnvelope({
        kind: parsedKind.data,
        filename: validated.filename,
        mediaType: validated.mimeType,
        sha256: validated.sha256,
        sizeBytes: validated.sizeBytes,
        model: "deterministic-csv-parser-v1",
        responseId: `csv_${randomUUID()}`,
        mode: "live",
        output,
      });
      const persistence = await getWorkflowPersistence().recordExtraction(envelope);
      return NextResponse.json({ envelope, ...signExtractionEnvelope(envelope), persistence });
    }

    const model = getExtractionModel();
    const gateway = new OpenAIExtractionGateway(getOpenAIClient(), model);
    const result =
      parsedKind.data === "shelf_image"
        ? await gateway.extractShelf({
            filename: validated.filename,
            mimeType: validated.mimeType as "image/jpeg" | "image/png" | "image/webp",
            base64Data: validated.base64Data,
          })
        : await gateway.extractSupplierCatalogue({
            filename: validated.filename,
            mimeType: validated.mimeType as
              "application/pdf" | "image/jpeg" | "image/png" | "image/webp",
            base64Data: validated.base64Data,
          });

    const envelope = createEnvelope({
      kind: parsedKind.data,
      filename: validated.filename,
      mediaType: validated.mimeType,
      sha256: validated.sha256,
      sizeBytes: validated.sizeBytes,
      model: result.model,
      responseId: result.responseId,
      mode: "live",
      output: result.output,
    });

    const persistence = await getWorkflowPersistence().recordExtraction(envelope);
    return NextResponse.json({ envelope, ...signExtractionEnvelope(envelope), persistence });
  } catch (error) {
    if (error instanceof WorkflowPersistenceError) {
      return errorResponse(503, "PERSISTENCE_UNAVAILABLE", error.message);
    }
    if (error instanceof EvidenceFileError || error instanceof SalesCsvError) {
      return errorResponse(400, error.code, error.message);
    }
    if (error instanceof Error && error.message.includes("OPENAI_API_KEY")) {
      return errorResponse(503, "OPENAI_NOT_CONFIGURED", error.message);
    }
    console.error("Evidence extraction failed", safeErrorMetadata(error));
    return errorResponse(
      502,
      "EXTRACTION_FAILED",
      "The evidence could not be processed. Try a clearer file or the prepared demo.",
    );
  }
}

function demoOutput(kind: EvidenceKind, supplier: "ubuntu" | "metro"): ExtractionOutput {
  switch (kind) {
    case "shelf_image":
      return demoShelfExtraction;
    case "supplier_catalogue":
      return supplier === "metro" ? demoMetroSupplierExtraction : demoUbuntuSupplierExtraction;
    case "sales_history":
      return demoSalesHistory;
  }
}

function createEnvelope(input: {
  kind: EvidenceKind;
  filename: string;
  mediaType: string;
  sha256: string;
  sizeBytes: number;
  model: string;
  responseId: string;
  mode: "live" | "demo";
  output: ExtractionOutput;
}) {
  return extractionEnvelopeSchema.parse({
    extractionId: randomUUID(),
    kind: input.kind,
    filename: input.filename,
    mediaType: input.mediaType,
    sha256: input.sha256,
    sizeBytes: input.sizeBytes,
    model: input.model,
    responseId: input.responseId,
    contractVersion: EXTRACTION_CONTRACT_VERSION,
    createdAt: new Date().toISOString(),
    mode: input.mode,
    output: input.output,
    reviewIssues: collectReviewIssues(input.kind, input.output),
  });
}

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

function safeErrorMetadata(error: unknown) {
  return error instanceof Error
    ? { name: error.name, message: error.message }
    : { name: "Unknown" };
}
