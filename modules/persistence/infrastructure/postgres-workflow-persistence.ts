import { createHash, randomUUID } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import { canonicalProducts } from "@/fixtures/catalogue/canonical-products";
import { canonicalJson } from "@/modules/evidence/application/canonical-json";
import type {
  ExtractionEnvelope,
  AcceptedEvidenceSnapshot,
} from "@/modules/evidence/domain/contracts";
import type {
  ApprovedOrderBundle,
  PurchaseOrderDraft,
} from "@/modules/purchasing/domain/contracts";
import type { AcceptedProductMappingSet } from "@/modules/reconciliation/domain/contracts";
import type {
  PersistenceReceipt,
  RestockScenarioRecord,
  WorkflowPersistence,
} from "../application/workflow-persistence";
import { WorkflowPersistenceError } from "../application/workflow-persistence";

const PROTOTYPE_MERCHANT_ID = "00000000-0000-4000-8000-000000000001";
const CATALOGUE_VERSION = "build-week-v1";

export class PostgresWorkflowPersistence implements WorkflowPersistence {
  readonly mode = "postgresql" as const;

  constructor(private readonly pool: Pool) {}

  async ping(): Promise<boolean> {
    await this.pool.query("select 1");
    return true;
  }

  async recordExtraction(envelope: ExtractionEnvelope): Promise<PersistenceReceipt> {
    await this.transaction(async (client) => {
      await this.ensureMerchant(client, "KasiStock merchant");
      await this.insertExtraction(client, envelope);
    });
    return this.receipt();
  }

  async recordAcceptedEvidence(
    envelope: ExtractionEnvelope,
    snapshot: AcceptedEvidenceSnapshot,
  ): Promise<PersistenceReceipt> {
    await this.transaction(async (client) => {
      await this.ensureMerchant(client, snapshot.acceptedBy);
      await this.insertExtraction(client, envelope);
      await this.insertAcceptedSnapshot(client, snapshot);
    });
    return this.receipt();
  }

  async recordProductMappingSet(
    mappingSet: AcceptedProductMappingSet,
    snapshots: readonly AcceptedEvidenceSnapshot[] = [],
  ): Promise<PersistenceReceipt> {
    await this.transaction(async (client) => {
      await this.ensureMerchant(client, mappingSet.acceptedBy);
      for (const snapshot of snapshots) await this.insertPreparedSnapshot(client, snapshot);
      await this.insertMappingSet(client, mappingSet);
    });
    return this.receipt();
  }

  async recordRestockScenario(record: RestockScenarioRecord): Promise<PersistenceReceipt> {
    const scenarioId = randomUUID();
    await this.transaction(async (client) => {
      await this.ensureMerchant(client, record.mappingSet.acceptedBy);
      for (const snapshot of record.snapshots) await this.insertPreparedSnapshot(client, snapshot);
      await this.insertMappingSet(client, record.mappingSet);
      const mappingSetId = await this.mappingSetId(client, record.mappingSet.mappingHash);
      await client.query(
        `insert into restock_scenarios (
          id, merchant_id, mapping_set_id, source_evidence_hashes, budget_cents,
          calculation_version, optimiser_version, status
        ) values ($1, $2, $3, $4, $5, $6, $7, 'calculated')`,
        [
          scenarioId,
          PROTOTYPE_MERCHANT_ID,
          mappingSetId,
          [...record.inputs.sourceEvidenceHashes].sort(),
          centsParameter(record.budgetCents),
          "restock-inputs-v1",
          "stable-utility-v1",
        ],
      );

      const calculationVersionId = randomUUID();
      await client.query(
        `insert into restock_calculation_versions (
          id, scenario_id, version, mapping_hash, evidence_hashes,
          calculation_payload, optimiser_input_payload
        ) values ($1, $2, 1, $3, $4, $5, $6)`,
        [
          calculationVersionId,
          scenarioId,
          record.inputs.mappingHash,
          [...record.inputs.sourceEvidenceHashes].sort(),
          jsonParameter(record.inputs),
          jsonParameter(record.inputs.candidates),
        ],
      );
      await client.query(
        `insert into recommendation_versions (
          id, scenario_id, calculation_version_id, version, result_payload,
          total_cost_cents, explanation_payload
        ) values ($1, $2, $3, 1, $4, $5, $6)`,
        [
          randomUUID(),
          scenarioId,
          calculationVersionId,
          jsonParameter(record.optimisation),
          centsParameter(record.optimisation.totalCostCents),
          jsonParameter({ source: "deterministic", optimiserVersion: "stable-utility-v1" }),
        ],
      );
    });
    return this.receipt(scenarioId);
  }

  async recordPurchaseOrderDraft(draft: PurchaseOrderDraft): Promise<PersistenceReceipt> {
    let scenarioId: string | undefined;
    await this.transaction(async (client) => {
      await this.ensureMerchant(client, draft.merchant.displayName);
      scenarioId = await this.findScenarioId(client, draft);
      await client.query(
        `insert into purchase_order_drafts (
          id, scenario_id, merchant_id, version, status, source_evidence_hashes,
          mapping_hash, recommendation_hash, calculation_version, optimiser_version,
          budget_cents, merchant_profile, fulfilment, lines, total_cost_cents,
          remaining_cents, expected_margin_cents, draft_hash, created_at
        ) values (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15, $16, $17, $18, $19
        ) on conflict (draft_hash) do nothing`,
        [
          draft.draftId,
          scenarioId ?? null,
          PROTOTYPE_MERCHANT_ID,
          draft.version,
          draft.status,
          [...draft.sourceEvidenceHashes].sort(),
          draft.mappingHash,
          draft.recommendationHash,
          draft.calculationVersion,
          draft.optimiserVersion,
          centsParameter(draft.budgetCents),
          jsonParameter(draft.merchant),
          jsonParameter(draft.fulfilment),
          jsonParameter(draft.lines),
          centsParameter(draft.totalCostCents),
          centsParameter(draft.remainingCents),
          centsParameter(draft.expectedMarginCents),
          draft.draftHash,
          draft.createdAt,
        ],
      );
    });
    return this.receipt(scenarioId);
  }

  async recordApprovedOrderBundle(bundle: ApprovedOrderBundle): Promise<PersistenceReceipt> {
    let scenarioId: string | undefined;
    await this.transaction(async (client) => {
      await this.ensureMerchant(client, bundle.draft.merchant.displayName);
      await this.ensureCatalogue(client);
      const storedDraft = await client.query<{ id: string; scenario_id: string | null }>(
        `select id, scenario_id from purchase_order_drafts
         where draft_hash = $1 and mapping_hash = $2 and recommendation_hash = $3
         for update`,
        [bundle.draft.draftHash, bundle.draft.mappingHash, bundle.draft.recommendationHash],
      );
      const draftRow = storedDraft.rows[0];
      if (!draftRow) {
        throw new Error("The approved draft was not durably recorded before approval.");
      }
      scenarioId = draftRow.scenario_id ?? undefined;
      await client.query(
        `insert into approval_records (
          id, scenario_id, purchase_order_draft_id, status, actor_id, draft_hash,
          recommendation_hash, evidence_hashes, mapping_hash, confirmation_text,
          approval_hash, decided_at
        ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        on conflict (approval_hash) do nothing`,
        [
          bundle.approval.approvalId,
          scenarioId ?? null,
          draftRow.id,
          bundle.approval.status,
          bundle.approval.approvedBy,
          bundle.approval.draftHash,
          bundle.approval.recommendationHash,
          [...bundle.approval.evidenceHashes].sort(),
          bundle.approval.mappingHash,
          bundle.approval.confirmationText,
          bundle.approval.approvalHash,
          bundle.approval.approvedAt,
        ],
      );

      const approvalId = await this.approvalId(client, bundle.approval.approvalHash);
      for (const order of bundle.purchaseOrders) {
        await client.query(
          `insert into supplier_purchase_orders (
            id, purchase_order_draft_id, approval_record_id, purchase_order_number,
            supplier_id, supplier_name, merchant_profile, fulfilment, subtotal_cents,
            total_cents, currency, draft_hash, approval_hash, purchase_order_hash, generated_at
          ) values (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
          ) on conflict (purchase_order_hash) do nothing`,
          [
            order.purchaseOrderId,
            draftRow.id,
            approvalId,
            order.purchaseOrderNumber,
            order.supplierId,
            order.supplierName,
            jsonParameter(order.merchant),
            jsonParameter(order.fulfilment),
            centsParameter(order.subtotalCents),
            centsParameter(order.totalCents),
            order.currency,
            order.draftHash,
            order.approvalHash,
            order.purchaseOrderHash,
            order.generatedAt,
          ],
        );
        const storedOrderId = await this.purchaseOrderId(client, order.purchaseOrderHash);
        for (const line of order.lines) {
          await client.query(
            `insert into supplier_purchase_order_lines (
              supplier_purchase_order_id, product_id, product_name, pack_quantity,
              selected_packs, selected_units, pack_cost_cents, line_cost_cents
            ) values ($1, $2, $3, $4, $5, $6, $7, $8)
            on conflict (supplier_purchase_order_id, product_id) do nothing`,
            [
              storedOrderId,
              line.productId,
              line.productName,
              line.packQuantity,
              line.selectedPacks,
              line.selectedUnits,
              centsParameter(line.packCostCents),
              centsParameter(line.lineCostCents),
            ],
          );
        }
        const message = bundle.supplierMessages.find(
          (candidate) => candidate.purchaseOrderId === order.purchaseOrderId,
        );
        if (message) {
          await client.query(
            `insert into supplier_messages (
              supplier_purchase_order_id, channel, body
            ) values ($1, $2, $3)
            on conflict (supplier_purchase_order_id, channel) do nothing`,
            [storedOrderId, message.channel, message.body],
          );
        }
      }

      for (const event of bundle.auditEvents) {
        await client.query(
          `insert into audit_events (
            id, scenario_id, actor_type, actor_id, event_type, input_version,
            output_version, metadata, occurred_at
          ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          on conflict (id) do nothing`,
          [
            event.id,
            scenarioId ?? null,
            event.actorType,
            event.actorId,
            event.eventType,
            event.inputVersion,
            event.outputVersion,
            jsonParameter(event.metadata),
            event.occurredAt,
          ],
        );
      }
      await client.query("update purchase_order_drafts set status = 'approved' where id = $1", [
        draftRow.id,
      ]);
      if (scenarioId) {
        await client.query("update restock_scenarios set status = 'approved' where id = $1", [
          scenarioId,
        ]);
      }
    });
    return this.receipt(scenarioId);
  }

  private async transaction<T>(operation: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await operation(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch {
        // Preserve the original persistence failure while still releasing the client.
      }
      throw error instanceof WorkflowPersistenceError
        ? error
        : new WorkflowPersistenceError({ cause: error });
    } finally {
      client.release();
    }
  }

  private async ensureMerchant(client: PoolClient, displayName: string): Promise<void> {
    await client.query(
      `insert into merchants (id, display_name, country_code)
       values ($1, $2, 'ZA') on conflict (id) do nothing`,
      [PROTOTYPE_MERCHANT_ID, displayName],
    );
  }

  private async insertExtraction(client: PoolClient, envelope: ExtractionEnvelope): Promise<void> {
    const uploadId = randomUUID();
    await client.query(
      `insert into evidence_uploads (
        id, merchant_id, kind, filename, media_type, sha256, storage_key, size_bytes
      ) values ($1, $2, $3, $4, $5, $6, $7, $8)
      on conflict (merchant_id, sha256) do nothing`,
      [
        uploadId,
        PROTOTYPE_MERCHANT_ID,
        envelope.kind,
        envelope.filename,
        envelope.mediaType,
        envelope.sha256,
        `evidence://${envelope.mode}/${envelope.sha256}`,
        centsParameter(envelope.sizeBytes),
      ],
    );
    const storedUpload = await client.query<{ id: string }>(
      "select id from evidence_uploads where merchant_id = $1 and sha256 = $2",
      [PROTOTYPE_MERCHANT_ID, envelope.sha256],
    );
    const storedUploadId = requiredId(storedUpload.rows[0]?.id, "evidence upload");
    await client.query(
      `insert into extraction_jobs (
        id, evidence_upload_id, processor_name, contract_version, response_id, status,
        raw_response, validated_output, review_issues, output_sha256, created_at, completed_at
      ) values ($1, $2, $3, $4, $5, 'completed', $6, $7, $8, $9, $10, $10)
      on conflict (id) do nothing`,
      [
        envelope.extractionId,
        storedUploadId,
        envelope.model,
        envelope.contractVersion,
        envelope.responseId,
        jsonParameter({
          responseId: envelope.responseId,
          model: envelope.model,
          output: envelope.output,
        }),
        jsonParameter(envelope.output),
        jsonParameter(envelope.reviewIssues),
        sha256(envelope.output),
        envelope.createdAt,
      ],
    );
  }

  private async insertPreparedSnapshot(
    client: PoolClient,
    snapshot: AcceptedEvidenceSnapshot,
  ): Promise<void> {
    const existing = await client.query(
      "select 1 from accepted_evidence_snapshots where evidence_hash = $1",
      [snapshot.evidenceHash],
    );
    if (existing.rowCount) return;

    const payloadBytes = Buffer.byteLength(canonicalJson(snapshot.acceptedPayload));
    const envelope = {
      extractionId: snapshot.sourceExtractionId,
      kind: snapshot.kind,
      filename: `prepared-${snapshot.kind}`,
      mediaType: snapshot.kind === "sales_history" ? "text/csv" : "application/octet-stream",
      sha256: snapshot.sourceSha256,
      sizeBytes: Math.max(1, payloadBytes),
      model:
        snapshot.kind === "sales_history" ? "deterministic-csv-parser-v1" : "prepared-demo-fixture",
      responseId: `prepared_${snapshot.sourceExtractionId}`,
      contractVersion: "prepared-evidence-v1",
      createdAt: snapshot.acceptedAt,
      mode: "demo",
      output: snapshot.acceptedPayload,
      reviewIssues: [],
    } as ExtractionEnvelope;
    await this.insertExtraction(client, envelope);
    await this.insertAcceptedSnapshot(client, snapshot);
  }

  private async insertAcceptedSnapshot(
    client: PoolClient,
    snapshot: AcceptedEvidenceSnapshot,
  ): Promise<void> {
    await client.query(
      `insert into accepted_evidence_snapshots (
        id, merchant_id, source_extraction_job_id, kind, version, source_sha256,
        accepted_payload, review_decisions, evidence_hash, accepted_by, accepted_at
      ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      on conflict (evidence_hash) do nothing`,
      [
        snapshot.snapshotId,
        PROTOTYPE_MERCHANT_ID,
        snapshot.sourceExtractionId,
        snapshot.kind,
        snapshot.version,
        snapshot.sourceSha256,
        jsonParameter(snapshot.acceptedPayload),
        jsonParameter(snapshot.reviewDecisions),
        snapshot.evidenceHash,
        snapshot.acceptedBy,
        snapshot.acceptedAt,
      ],
    );
  }

  private async insertMappingSet(
    client: PoolClient,
    mappingSet: AcceptedProductMappingSet,
  ): Promise<void> {
    await client.query(
      `insert into accepted_product_mapping_sets (
        id, merchant_id, version, source_evidence_hashes, decisions,
        accepted_by, accepted_at, mapping_hash
      ) values ($1, $2, $3, $4, $5, $6, $7, $8)
      on conflict (mapping_hash) do nothing`,
      [
        mappingSet.mappingSetId,
        PROTOTYPE_MERCHANT_ID,
        mappingSet.version,
        [...mappingSet.sourceEvidenceHashes].sort(),
        jsonParameter(mappingSet.decisions),
        mappingSet.acceptedBy,
        mappingSet.acceptedAt,
        mappingSet.mappingHash,
      ],
    );
  }

  private async mappingSetId(client: PoolClient, mappingHash: string): Promise<string> {
    const result = await client.query<{ id: string }>(
      "select id from accepted_product_mapping_sets where mapping_hash = $1",
      [mappingHash],
    );
    return requiredId(result.rows[0]?.id, "accepted product mapping set");
  }

  private async findScenarioId(
    client: PoolClient,
    draft: PurchaseOrderDraft,
  ): Promise<string | undefined> {
    const result = await client.query<{ id: string }>(
      `select scenario.id
       from restock_scenarios scenario
       join accepted_product_mapping_sets mapping on mapping.id = scenario.mapping_set_id
       where mapping.mapping_hash = $1
         and scenario.source_evidence_hashes = $2::text[]
         and scenario.budget_cents = $3
       order by scenario.created_at desc
       limit 1`,
      [
        draft.mappingHash,
        [...draft.sourceEvidenceHashes].sort(),
        centsParameter(draft.budgetCents),
      ],
    );
    return result.rows[0]?.id;
  }

  private async approvalId(client: PoolClient, approvalHash: string): Promise<string> {
    const result = await client.query<{ id: string }>(
      "select id from approval_records where approval_hash = $1",
      [approvalHash],
    );
    return requiredId(result.rows[0]?.id, "approval record");
  }

  private async purchaseOrderId(client: PoolClient, orderHash: string): Promise<string> {
    const result = await client.query<{ id: string }>(
      "select id from supplier_purchase_orders where purchase_order_hash = $1",
      [orderHash],
    );
    return requiredId(result.rows[0]?.id, "supplier purchase order");
  }

  private async ensureCatalogue(client: PoolClient): Promise<void> {
    for (const product of canonicalProducts) {
      await client.query(
        `insert into canonical_products (
          id, display_name, unit_label, barcodes, target_days_cover,
          safety_stock_units, essentiality_score, expiry_risk_score, catalogue_version
        ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        on conflict (id) do nothing`,
        [
          product.productId,
          product.displayName,
          product.unitLabel,
          product.barcodes,
          product.targetDaysCover,
          product.safetyStockUnits,
          product.essentialityScore,
          product.expiryRiskScore,
          CATALOGUE_VERSION,
        ],
      );
      for (const alias of product.aliases) {
        await client.query(
          `insert into product_aliases (product_id, alias, normalised_alias)
           values ($1, $2, $3) on conflict (product_id, normalised_alias) do nothing`,
          [product.productId, alias, normaliseAlias(alias)],
        );
      }
    }
  }

  private receipt(scenarioId?: string): PersistenceReceipt {
    return { mode: this.mode, durable: true, ...(scenarioId ? { scenarioId } : {}) };
  }
}

function centsParameter(value: number): string {
  if (!Number.isSafeInteger(value)) throw new Error("PostgreSQL integer value is not safe.");
  return String(value);
}

function jsonParameter(value: unknown): string {
  return JSON.stringify(value);
}

function sha256(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

function requiredId(value: string | undefined, recordName: string): string {
  if (!value) throw new Error(`Failed to resolve the persisted ${recordName}.`);
  return value;
}

function normaliseAlias(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
