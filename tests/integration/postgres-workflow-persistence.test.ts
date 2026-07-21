import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { canonicalProducts } from "@/fixtures/catalogue/canonical-products";
import { createDemoAcceptedEvidenceBundle } from "@/fixtures/decision/demo-accepted-evidence";
import type { ExtractionEnvelope } from "@/modules/evidence/domain/contracts";
import { optimiseRestockPlan } from "@/modules/optimisation/domain/optimise-restock-plan";
import { PostgresWorkflowPersistence } from "@/modules/persistence/infrastructure/postgres-workflow-persistence";
import { approvePurchaseOrder } from "@/modules/purchasing/application/approve-purchase-order";
import { buildPurchaseOrderDraft } from "@/modules/purchasing/application/build-purchase-order-draft";
import { buildAcceptedProductMappingSet } from "@/modules/reconciliation/application/build-accepted-product-mapping-set";
import { proposeProductMatches } from "@/modules/reconciliation/application/propose-product-matches";
import { extractSourceProductRecords } from "@/modules/reconciliation/application/source-product-records";
import { buildRestockInputs } from "@/modules/restocking/application/build-restock-inputs";

const databaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;

describeWithDatabase("PostgreSQL workflow persistence", () => {
  const pool = new Pool({ connectionString: databaseUrl, max: 2 });
  const persistence = new PostgresWorkflowPersistence(pool);

  beforeAll(async () => {
    await pool.query(`truncate table
      audit_events,
      supplier_messages,
      supplier_purchase_order_lines,
      supplier_purchase_orders,
      approval_records,
      purchase_order_drafts,
      recommendation_versions,
      restock_calculation_versions,
      restock_scenarios,
      accepted_product_mapping_sets,
      accepted_evidence_snapshots,
      extraction_jobs,
      evidence_uploads,
      product_aliases,
      canonical_products,
      merchants
      restart identity cascade`);
  });

  afterAll(async () => {
    await pool.end();
  });

  it("atomically records the accepted evidence-to-approved-order authority chain", async () => {
    const snapshots = createDemoAcceptedEvidenceBundle();
    for (const snapshot of snapshots) {
      await persistence.recordAcceptedEvidence(envelopeFor(snapshot), snapshot);
    }

    const proposals = proposeProductMatches(
      extractSourceProductRecords(snapshots),
      canonicalProducts,
    );
    const mappingSet = buildAcceptedProductMappingSet({
      snapshots,
      decisions: proposals.map((proposal) => ({
        sourceKey: proposal.source.sourceKey,
        productId: proposal.recommendedProductId ?? proposal.candidates[0]?.productId ?? null,
        decision: proposal.recommendedProductId ? ("accepted" as const) : ("corrected" as const),
        proposedProductId: proposal.recommendedProductId,
        method: proposal.candidates[0]?.method ?? ("unmatched" as const),
        confirmed: true as const,
        note: "Human confirmed the identity mapping.",
      })),
      products: canonicalProducts,
      acceptedBy: "Thandi Mokoena",
      now: new Date("2026-07-18T11:00:00.000Z"),
    });
    await persistence.recordProductMappingSet(mappingSet);

    const inputs = buildRestockInputs({ snapshots, mappingSet, products: canonicalProducts });
    const optimisation = optimiseRestockPlan(inputs.candidates, 150_000);
    const scenarioReceipt = await persistence.recordRestockScenario({
      snapshots,
      mappingSet,
      budgetCents: 150_000,
      inputs,
      optimisation,
    });

    const draft = buildPurchaseOrderDraft({
      snapshots,
      mappingSet,
      budgetCents: 150_000,
      merchant: {
        displayName: "Thandi's Corner Shop",
        tradingAddress: "12 Demo Street, Khayelitsha, Cape Town",
        contactName: "Thandi Mokoena",
        contactPhone: "+27 82 555 0142",
      },
      fulfilment: {
        method: "collection",
        requestedDate: "2026-07-22",
        note: "Confirm stock availability before collection.",
      },
      now: "2026-07-18T12:00:00.000Z",
      draftId: "55555555-5555-4555-8555-555555555555",
    });
    const draftReceipt = await persistence.recordPurchaseOrderDraft(draft);
    const bundle = approvePurchaseOrder({
      draft,
      approvedBy: "Thandi Mokoena",
      confirmed: true,
      now: "2026-07-18T12:05:00.000Z",
    });
    const approvalReceipt = await persistence.recordApprovedOrderBundle(bundle);

    expect(scenarioReceipt).toMatchObject({ mode: "postgresql", durable: true });
    expect(draftReceipt.scenarioId).toBe(scenarioReceipt.scenarioId);
    expect(approvalReceipt.scenarioId).toBe(scenarioReceipt.scenarioId);

    const counts = await pool.query<{
      snapshots: string;
      mappings: string;
      scenarios: string;
      drafts: string;
      approvals: string;
      orders: string;
      messages: string;
      events: string;
    }>(`select
      (select count(*) from accepted_evidence_snapshots) as snapshots,
      (select count(*) from accepted_product_mapping_sets) as mappings,
      (select count(*) from restock_scenarios where status = 'approved') as scenarios,
      (select count(*) from purchase_order_drafts where status = 'approved') as drafts,
      (select count(*) from approval_records) as approvals,
      (select count(*) from supplier_purchase_orders) as orders,
      (select count(*) from supplier_messages) as messages,
      (select count(*) from audit_events) as events`);
    expect(counts.rows[0]).toEqual({
      snapshots: "4",
      mappings: "1",
      scenarios: "1",
      drafts: "1",
      approvals: "1",
      orders: String(bundle.purchaseOrders.length),
      messages: String(bundle.supplierMessages.length),
      events: "6",
    });
  });
});

function envelopeFor(
  snapshot: ReturnType<typeof createDemoAcceptedEvidenceBundle>[number],
): ExtractionEnvelope {
  return {
    extractionId: snapshot.sourceExtractionId,
    kind: snapshot.kind,
    filename: `prepared-${snapshot.kind}`,
    mediaType: snapshot.kind === "sales_history" ? "text/csv" : "application/octet-stream",
    sha256: snapshot.sourceSha256,
    sizeBytes: 1,
    model: snapshot.kind === "sales_history" ? "deterministic-csv-parser-v1" : "prepared-demo",
    responseId: `prepared_${snapshot.sourceExtractionId}`,
    contractVersion: "retail-evidence-v1",
    createdAt: snapshot.acceptedAt,
    mode: "demo",
    output: snapshot.acceptedPayload,
    reviewIssues: [],
  } as ExtractionEnvelope;
}
