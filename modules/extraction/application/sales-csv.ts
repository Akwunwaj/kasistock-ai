import { salesHistorySchema, type SalesHistory } from "../domain/contracts";

export class SalesCsvError extends Error {
  constructor(
    public readonly code: "INVALID_HEADER" | "INVALID_ROW" | "INCONSISTENT_PERIOD",
    message: string,
  ) {
    super(message);
    this.name = "SalesCsvError";
  }
}

const requiredHeaders = [
  "product_name",
  "barcode",
  "units_sold",
  "gross_revenue_cents",
  "transaction_count",
  "period_start",
  "period_end",
] as const;

export function parseSalesCsv(csv: string): SalesHistory {
  const rows = parseRows(csv);
  if (rows.length < 2) {
    throw new SalesCsvError(
      "INVALID_ROW",
      "The sales CSV must include a header and at least one row.",
    );
  }

  const headers = rows[0]?.map((value) => value.trim().toLowerCase()) ?? [];
  const positions = new Map(headers.map((header, index) => [header, index]));
  const missing = requiredHeaders.filter((header) => !positions.has(header));
  if (missing.length > 0) {
    throw new SalesCsvError(
      "INVALID_HEADER",
      `The sales CSV is missing required column(s): ${missing.join(", ")}.`,
    );
  }

  const lines = rows.slice(1).filter((row) => row.some((value) => value.trim() !== ""));
  const periods = new Set<string>();
  const parsedLines = lines.map((row, index) => {
    const lineNumber = index + 2;
    const read = (header: (typeof requiredHeaders)[number]) =>
      row[positions.get(header) ?? -1]?.trim() ?? "";
    const periodStart = read("period_start");
    const periodEnd = read("period_end");
    periods.add(`${periodStart}|${periodEnd}`);

    return {
      rawProductName: requiredText(read("product_name"), "product_name", lineNumber),
      barcode: read("barcode") || null,
      unitsSold: requiredInteger(read("units_sold"), "units_sold", lineNumber),
      grossRevenueCents: requiredInteger(
        read("gross_revenue_cents"),
        "gross_revenue_cents",
        lineNumber,
      ),
      transactionCount: requiredInteger(read("transaction_count"), "transaction_count", lineNumber),
      periodStart,
      periodEnd,
    };
  });

  if (periods.size !== 1) {
    throw new SalesCsvError(
      "INCONSISTENT_PERIOD",
      "Every sales CSV row must use the same period_start and period_end.",
    );
  }

  const first = parsedLines[0];
  if (!first) {
    throw new SalesCsvError("INVALID_ROW", "The sales CSV contains no usable data rows.");
  }

  return salesHistorySchema.parse({
    periodStart: first.periodStart,
    periodEnd: first.periodEnd,
    currency: "ZAR",
    lines: parsedLines.map((line) => ({
      rawProductName: line.rawProductName,
      barcode: line.barcode,
      unitsSold: line.unitsSold,
      grossRevenueCents: line.grossRevenueCents,
      transactionCount: line.transactionCount,
    })),
    warnings: [],
  });
}

function requiredText(value: string, column: string, line: number): string {
  if (!value) throw new SalesCsvError("INVALID_ROW", `${column} is required on CSV line ${line}.`);
  return value;
}

function requiredInteger(value: string, column: string, line: number): number {
  if (!/^\d+$/.test(value)) {
    throw new SalesCsvError(
      "INVALID_ROW",
      `${column} must be a non-negative integer on CSV line ${line}.`,
    );
  }
  return Number(value);
}

function parseRows(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];
    if (char === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}
