import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import type { SupplierPurchaseOrder } from "../domain/contracts";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 46;

export async function generatePurchaseOrderPdf(order: SupplierPurchaseOrder): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Purchase Order ${order.purchaseOrderNumber}`);
  pdf.setAuthor("KasiStock AI");
  pdf.setSubject(`Approved supplier purchase order for ${order.merchant.displayName}`);
  pdf.setProducer("KasiStock AI using pdf-lib");
  pdf.setCreationDate(new Date(order.generatedAt));
  pdf.setModificationDate(new Date(order.generatedAt));

  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - 112,
    width: PAGE_WIDTH,
    height: 112,
    color: rgb(0.055, 0.31, 0.22),
  });
  page.drawText("KasiStock AI", {
    x: MARGIN,
    y: PAGE_HEIGHT - 60,
    size: 12,
    font: bold,
    color: rgb(0.86, 1, 0.93),
  });
  page.drawText("PURCHASE ORDER", {
    x: MARGIN,
    y: PAGE_HEIGHT - 90,
    size: 25,
    font: bold,
    color: rgb(1, 1, 1),
  });
  page.drawText(order.purchaseOrderNumber, {
    x: PAGE_WIDTH - MARGIN - bold.widthOfTextAtSize(order.purchaseOrderNumber, 11),
    y: PAGE_HEIGHT - 88,
    size: 11,
    font: bold,
    color: rgb(1, 1, 1),
  });
  y = PAGE_HEIGHT - 146;

  drawLabelValue(page, bold, regular, "BUYER", order.merchant.displayName, MARGIN, y);
  drawLabelValue(page, bold, regular, "SUPPLIER", order.supplierName, 320, y);
  y -= 43;
  drawWrappedValue(
    page,
    bold,
    regular,
    "TRADING ADDRESS",
    order.merchant.tradingAddress,
    MARGIN,
    y,
    220,
  );
  drawWrappedValue(
    page,
    bold,
    regular,
    "FULFILMENT",
    `${capitalise(order.fulfilment.method)} on ${order.fulfilment.requestedDate}`,
    320,
    y,
    220,
  );
  y -= 66;
  drawLabelValue(
    page,
    bold,
    regular,
    "CONTACT",
    `${order.merchant.contactName} | ${order.merchant.contactPhone}`,
    MARGIN,
    y,
  );
  drawLabelValue(page, bold, regular, "GENERATED", formatDateTime(order.generatedAt), 320, y);
  y -= 52;

  ({ page, y } = drawTableHeader(page, bold, y));
  for (const line of order.lines) {
    if (y < 130) {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
      ({ page, y } = drawTableHeader(page, bold, y));
    }
    const descriptionLines = wrapText(line.productName, regular, 9, 190);
    const rowHeight = Math.max(34, descriptionLines.length * 11 + 14);
    page.drawRectangle({
      x: MARGIN,
      y: y - rowHeight + 8,
      width: PAGE_WIDTH - MARGIN * 2,
      height: rowHeight,
      color: rgb(0.975, 0.983, 0.979),
      borderColor: rgb(0.87, 0.9, 0.88),
      borderWidth: 0.5,
    });
    drawLines(page, descriptionLines, MARGIN + 8, y - 8, regular, 9, rgb(0.1, 0.15, 0.12));
    drawRight(page, `${line.selectedPacks}`, 318, y - 8, regular, 9);
    drawRight(page, `${line.packQuantity}`, 378, y - 8, regular, 9);
    drawRight(page, `${line.selectedUnits}`, 444, y - 8, regular, 9);
    drawRight(page, formatCents(line.lineCostCents), PAGE_WIDTH - MARGIN - 8, y - 8, bold, 9);
    y -= rowHeight + 3;
  }

  y -= 16;
  page.drawLine({
    start: { x: 340, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 1,
    color: rgb(0.1, 0.5, 0.35),
  });
  y -= 26;
  page.drawText("TOTAL", { x: 340, y, size: 11, font: bold, color: rgb(0.2, 0.25, 0.22) });
  drawRight(page, formatCents(order.totalCents), PAGE_WIDTH - MARGIN, y, bold, 15);
  y -= 55;

  if (order.fulfilment.note) {
    page.drawText("FULFILMENT NOTE", {
      x: MARGIN,
      y,
      size: 8,
      font: bold,
      color: rgb(0.1, 0.5, 0.35),
    });
    y -= 15;
    const noteLines = wrapText(order.fulfilment.note, regular, 9, PAGE_WIDTH - MARGIN * 2);
    drawLines(page, noteLines, MARGIN, y, regular, 9, rgb(0.18, 0.22, 0.2));
    y -= noteLines.length * 11 + 20;
  }

  page.drawText("APPROVAL AND INTEGRITY", {
    x: MARGIN,
    y,
    size: 8,
    font: bold,
    color: rgb(0.1, 0.5, 0.35),
  });
  y -= 15;
  const approvalLines = [
    `Approval hash: ${order.approvalHash}`,
    `Purchase-order hash: ${order.purchaseOrderHash}`,
    "This document was generated only after explicit merchant approval.",
  ];
  drawLines(page, approvalLines, MARGIN, y, regular, 7.5, rgb(0.35, 0.39, 0.37), 10);

  const pages = pdf.getPages();
  pages.forEach((pdfPage, index) => {
    pdfPage.drawText(
      `KasiStock AI | ${order.purchaseOrderNumber} | Page ${index + 1} of ${pages.length}`,
      {
        x: MARGIN,
        y: 24,
        size: 7,
        font: regular,
        color: rgb(0.45, 0.5, 0.47),
      },
    );
  });

  return pdf.save({ useObjectStreams: false });
}

function drawTableHeader(page: PDFPage, font: PDFFont, y: number) {
  page.drawRectangle({
    x: MARGIN,
    y: y - 20,
    width: PAGE_WIDTH - MARGIN * 2,
    height: 25,
    color: rgb(0.11, 0.18, 0.14),
  });
  page.drawText("PRODUCT", { x: MARGIN + 8, y: y - 11, size: 7.5, font, color: rgb(1, 1, 1) });
  drawRight(page, "PACKS", 318, y - 11, font, 7.5, rgb(1, 1, 1));
  drawRight(page, "PACK SIZE", 378, y - 11, font, 7.5, rgb(1, 1, 1));
  drawRight(page, "UNITS", 444, y - 11, font, 7.5, rgb(1, 1, 1));
  drawRight(page, "LINE TOTAL", PAGE_WIDTH - MARGIN - 8, y - 11, font, 7.5, rgb(1, 1, 1));
  return { page, y: y - 34 };
}

function drawLabelValue(
  page: PDFPage,
  bold: PDFFont,
  regular: PDFFont,
  label: string,
  value: string,
  x: number,
  y: number,
) {
  page.drawText(label, { x, y, size: 7.5, font: bold, color: rgb(0.1, 0.5, 0.35) });
  page.drawText(value, { x, y: y - 16, size: 10, font: regular, color: rgb(0.1, 0.14, 0.12) });
}

function drawWrappedValue(
  page: PDFPage,
  bold: PDFFont,
  regular: PDFFont,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
) {
  page.drawText(label, { x, y, size: 7.5, font: bold, color: rgb(0.1, 0.5, 0.35) });
  drawLines(
    page,
    wrapText(value, regular, 9.5, width),
    x,
    y - 16,
    regular,
    9.5,
    rgb(0.1, 0.14, 0.12),
  );
}

function drawRight(
  page: PDFPage,
  text: string,
  right: number,
  y: number,
  font: PDFFont,
  size: number,
  color = rgb(0.1, 0.14, 0.12),
) {
  page.drawText(text, { x: right - font.widthOfTextAtSize(text, size), y, size, font, color });
}

function drawLines(
  page: PDFPage,
  lines: readonly string[],
  x: number,
  y: number,
  font: PDFFont,
  size: number,
  color: ReturnType<typeof rgb>,
  lineHeight = 11,
) {
  lines.forEach((line, index) => {
    page.drawText(line, { x, y: y - index * lineHeight, size, font, color });
  });
}

function wrapText(text: string, font: PDFFont, size: number, width: number): string[] {
  const words = text.replaceAll("\n", " ").split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= width) current = candidate;
    else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

function formatCents(value: number): string {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(value / 100);
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-ZA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Johannesburg",
  }).format(new Date(value));
}

function capitalise(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
