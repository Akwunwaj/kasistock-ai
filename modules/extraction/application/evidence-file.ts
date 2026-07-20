import { createHash } from "node:crypto";
import type { EvidenceKind } from "../domain/contracts";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_DOCUMENT_BYTES = 12 * 1024 * 1024;
const MAX_CSV_BYTES = 2 * 1024 * 1024;

const supportedImageTypes = ["image/jpeg", "image/png", "image/webp"] as const;
const supportedDocumentTypes = ["application/pdf", ...supportedImageTypes] as const;
const supportedCsvTypes = ["text/csv", "application/vnd.ms-excel"] as const;

type SupportedMediaType =
  (typeof supportedDocumentTypes)[number] | (typeof supportedCsvTypes)[number];

export class EvidenceFileError extends Error {
  constructor(
    public readonly code:
      "EMPTY_FILE" | "FILE_TOO_LARGE" | "UNSUPPORTED_MEDIA_TYPE" | "SIGNATURE_MISMATCH",
    message: string,
  ) {
    super(message);
    this.name = "EvidenceFileError";
  }
}

export interface ValidatedEvidenceFile {
  filename: string;
  mimeType: SupportedMediaType;
  bytes: Uint8Array;
  base64Data: string;
  sha256: string;
  sizeBytes: number;
}

export async function validateEvidenceFile(
  kind: EvidenceKind,
  file: File,
): Promise<ValidatedEvidenceFile> {
  if (file.size === 0) {
    throw new EvidenceFileError("EMPTY_FILE", "The selected evidence file is empty.");
  }

  const allowed =
    kind === "shelf_image"
      ? supportedImageTypes
      : kind === "sales_history"
        ? supportedCsvTypes
        : supportedDocumentTypes;
  if (!(allowed as readonly string[]).includes(file.type)) {
    throw new EvidenceFileError(
      "UNSUPPORTED_MEDIA_TYPE",
      `Unsupported media type: ${file.type || "unknown"}.`,
    );
  }

  const maximum =
    kind === "shelf_image"
      ? MAX_IMAGE_BYTES
      : kind === "sales_history"
        ? MAX_CSV_BYTES
        : MAX_DOCUMENT_BYTES;
  if (file.size > maximum) {
    throw new EvidenceFileError(
      "FILE_TOO_LARGE",
      `The file exceeds the ${maximum / 1024 / 1024} MB application limit.`,
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!signatureMatches(file.type, bytes)) {
    throw new EvidenceFileError(
      "SIGNATURE_MISMATCH",
      "The file content does not match its declared media type.",
    );
  }

  return {
    filename: sanitiseFilename(file.name),
    mimeType: file.type as SupportedMediaType,
    bytes,
    base64Data: Buffer.from(bytes).toString("base64"),
    sha256: createHash("sha256").update(bytes).digest("hex"),
    sizeBytes: bytes.byteLength,
  };
}

function signatureMatches(mimeType: string, bytes: Uint8Array): boolean {
  if (mimeType === "text/csv" || mimeType === "application/vnd.ms-excel") {
    return !bytes.includes(0) && isMostlyPrintableText(bytes);
  }
  if (mimeType === "application/pdf") {
    return textPrefix(bytes, 5) === "%PDF-";
  }
  if (mimeType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === "image/png") {
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }
  if (mimeType === "image/webp") {
    return textPrefix(bytes, 4) === "RIFF" && textSlice(bytes, 8, 12) === "WEBP";
  }
  return false;
}

function isMostlyPrintableText(bytes: Uint8Array): boolean {
  const sample = bytes.slice(0, Math.min(bytes.length, 4096));
  if (sample.length === 0) return false;
  const printable = sample.filter(
    (value) => value === 9 || value === 10 || value === 13 || (value >= 32 && value <= 126),
  ).length;
  return printable / sample.length > 0.95;
}

function textPrefix(bytes: Uint8Array, length: number): string {
  return textSlice(bytes, 0, length);
}

function textSlice(bytes: Uint8Array, start: number, end: number): string {
  return String.fromCharCode(...bytes.slice(start, end));
}

function sanitiseFilename(filename: string): string {
  const cleaned = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  return cleaned || "evidence";
}
