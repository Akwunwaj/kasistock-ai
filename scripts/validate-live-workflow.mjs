import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const baseUrl = process.env.KASISTOCK_BASE_URL?.trim() || "http://127.0.0.1:3118";
const shelfPath = resolve("fixtures/live-validation/synthetic-shelf.png");
const cataloguePath = resolve("output/pdf/synthetic-supplier-catalogue.pdf");
const evidencePath = resolve("submission/qa/live-openai-validation.json");
const expectedCatalogueDate = "2026-07-20";

async function postExtraction(kind, path, filename, mediaType) {
  const bytes = await readFile(path);
  const form = new FormData();
  form.set("kind", kind);
  form.set("file", new File([bytes], filename, { type: mediaType }));
  const response = await fetch(`${baseUrl}/api/extractions`, { method: "POST", body: form });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(
      `${kind} extraction failed (${response.status}): ${JSON.stringify(body.error)}`,
    );
  }
  return { body, bytes };
}

async function acceptExtraction(extraction, acceptedPayload, reviewDecisions) {
  const response = await fetch(`${baseUrl}/api/evidence-snapshots`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      envelope: extraction.envelope,
      token: extraction.token,
      acceptedPayload,
      reviewDecisions,
      acceptedBy: "codex-live-validation-fixture-reviewer",
    }),
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(
      `Evidence acceptance failed (${response.status}): ${JSON.stringify(body.error)}`,
    );
  }
  return body;
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

const readinessResponse = await fetch(`${baseUrl}/api/readiness`);
const readiness = await readinessResponse.json();
if (!readinessResponse.ok || readiness.status !== "ready") {
  throw new Error(`KasiStock is not ready at ${baseUrl}: ${JSON.stringify(readiness)}`);
}
if (readiness.persistence?.mode !== "postgresql" || readiness.persistence?.reachable !== true) {
  throw new Error("Live workflow validation requires reachable PostgreSQL persistence.");
}

const shelf = await postExtraction("shelf_image", shelfPath, "synthetic-shelf.png", "image/png");
const shelfProducts = shelf.body.envelope.output.observedProducts;
const expectedShelfProducts = [
  { identityToken: "MAIZE", packSize: "1KG", estimatedQuantity: 4 },
  { identityToken: "BEANS", packSize: "410G", estimatedQuantity: 3 },
  { identityToken: "OIL", packSize: "750ML", estimatedQuantity: 2 },
];
for (const expected of expectedShelfProducts) {
  const observed = shelfProducts.find((product) =>
    product.rawProductName.toUpperCase().includes(expected.identityToken),
  );
  if (
    !observed ||
    observed.visiblePackSize?.replaceAll(" ", "").toUpperCase() !== expected.packSize ||
    observed.estimatedQuantity !== expected.estimatedQuantity
  ) {
    throw new Error(
      `Shelf evidence did not match ${expected.identityToken}: ${JSON.stringify(observed)}`,
    );
  }
}
const acceptedShelf = await acceptExtraction(shelf.body, shelf.body.envelope.output, [
  {
    path: "observedProducts",
    decision: "accepted",
    note: "Known synthetic fixture visually checked: four maize, three beans and two oil units.",
  },
]);

const catalogue = await postExtraction(
  "supplier_catalogue",
  cataloguePath,
  "synthetic-supplier-catalogue.pdf",
  "application/pdf",
);
const rawCatalogue = catalogue.body.envelope.output;
const expectedOffers = [
  ["Kasi Maize Meal 1kg", 18000, 10, 1800],
  ["Kasi Baked Beans 410g", 15600, 12, 1300],
  ["Kasi Sunflower Oil 750ml", 22800, 6, 3800],
];
const actualOffers = rawCatalogue.offers.map((offer) => [
  offer.rawProductName,
  offer.casePriceCents,
  offer.caseQuantity,
  offer.unitPriceCents,
]);
if (JSON.stringify(actualOffers) !== JSON.stringify(expectedOffers)) {
  throw new Error(`Unexpected supplier offers: ${JSON.stringify(actualOffers)}`);
}
const dateWasCorrected = rawCatalogue.catalogueDate !== expectedCatalogueDate;
const acceptedCataloguePayload = {
  ...rawCatalogue,
  catalogueDate: expectedCatalogueDate,
};
const acceptedCatalogue = await acceptExtraction(catalogue.body, acceptedCataloguePayload, [
  {
    path: "catalogueDate",
    decision: dateWasCorrected ? "corrected" : "accepted",
    note: dateWasCorrected
      ? `Visible fixture date is ${expectedCatalogueDate}; raw model returned ${rawCatalogue.catalogueDate}.`
      : `Visible fixture date ${expectedCatalogueDate} was confirmed.`,
  },
]);

const report = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  status: "passed",
  authorityNote:
    "Synthetic QA only: this script exercises the signed human-review endpoint with known fixture ground truth; it does not bypass acceptance in the product runtime.",
  readiness: {
    status: readiness.status,
    persistence: readiness.persistence,
  },
  model: shelf.body.envelope.model,
  shelf: {
    fixtureSha256: sha256(shelf.bytes),
    responseId: shelf.body.envelope.responseId,
    mode: shelf.body.envelope.mode,
    persistence: shelf.body.persistence,
    extractedProducts: shelfProducts.map(
      ({ rawProductName, visiblePackSize, estimatedQuantity, confidence }) => ({
        rawProductName,
        visiblePackSize,
        estimatedQuantity,
        confidence,
      }),
    ),
    reviewIssueCount: shelf.body.envelope.reviewIssues.length,
    acceptedSnapshotId: acceptedShelf.snapshot.snapshotId,
    acceptedEvidenceHash: acceptedShelf.snapshot.evidenceHash,
    acceptancePersistence: acceptedShelf.persistence,
  },
  supplierCatalogue: {
    fixtureSha256: sha256(catalogue.bytes),
    responseId: catalogue.body.envelope.responseId,
    mode: catalogue.body.envelope.mode,
    persistence: catalogue.body.persistence,
    supplierName: rawCatalogue.supplierName,
    rawCatalogueDate: rawCatalogue.catalogueDate,
    acceptedCatalogueDate: acceptedCatalogue.snapshot.acceptedPayload.catalogueDate,
    dateWasCorrected,
    extractedOffers: actualOffers,
    reviewIssueCount: catalogue.body.envelope.reviewIssues.length,
    acceptedSnapshotId: acceptedCatalogue.snapshot.snapshotId,
    acceptedEvidenceHash: acceptedCatalogue.snapshot.evidenceHash,
    acceptancePersistence: acceptedCatalogue.persistence,
  },
};

await mkdir(dirname(evidencePath), { recursive: true });
await writeFile(evidencePath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
