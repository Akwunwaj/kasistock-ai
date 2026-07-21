import type {
  ExtractionEnvelope,
  AcceptedEvidenceSnapshot,
} from "@/modules/evidence/domain/contracts";
import type { OptimisationResult } from "@/modules/optimisation/domain/types";
import type {
  ApprovedOrderBundle,
  PurchaseOrderDraft,
} from "@/modules/purchasing/domain/contracts";
import type { AcceptedProductMappingSet } from "@/modules/reconciliation/domain/contracts";
import type { RestockInputBuildResult } from "@/modules/restocking/domain/types";

export type PersistenceMode = "postgresql" | "prepared_fallback";

export interface PersistenceReceipt {
  mode: PersistenceMode;
  durable: boolean;
  scenarioId?: string;
}

export interface AcceptedEvidencePersistenceResult {
  snapshot: AcceptedEvidenceSnapshot;
  persistence: PersistenceReceipt;
}

export interface RestockScenarioRecord {
  snapshots: readonly AcceptedEvidenceSnapshot[];
  mappingSet: AcceptedProductMappingSet;
  budgetCents: number;
  inputs: RestockInputBuildResult;
  optimisation: OptimisationResult;
}

export interface WorkflowPersistence {
  readonly mode: PersistenceMode;
  ping(): Promise<boolean>;
  recordExtraction(envelope: ExtractionEnvelope): Promise<PersistenceReceipt>;
  recordAcceptedEvidence(
    envelope: ExtractionEnvelope,
    snapshot: AcceptedEvidenceSnapshot,
  ): Promise<AcceptedEvidencePersistenceResult>;
  recordProductMappingSet(
    mappingSet: AcceptedProductMappingSet,
    snapshots?: readonly AcceptedEvidenceSnapshot[],
  ): Promise<PersistenceReceipt>;
  recordRestockScenario(record: RestockScenarioRecord): Promise<PersistenceReceipt>;
  recordPurchaseOrderDraft(draft: PurchaseOrderDraft): Promise<PersistenceReceipt>;
  recordApprovedOrderBundle(bundle: ApprovedOrderBundle): Promise<PersistenceReceipt>;
}

export class WorkflowPersistenceError extends Error {
  constructor(options?: ErrorOptions) {
    super("Durable workflow persistence is temporarily unavailable.", options);
    this.name = "WorkflowPersistenceError";
  }
}

export class WorkflowPersistenceConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WorkflowPersistenceConflictError";
  }
}

export class PreparedFallbackPersistence implements WorkflowPersistence {
  readonly mode = "prepared_fallback" as const;

  async ping(): Promise<boolean> {
    return true;
  }

  async recordExtraction(): Promise<PersistenceReceipt> {
    return this.receipt();
  }

  async recordAcceptedEvidence(
    _envelope: ExtractionEnvelope,
    snapshot: AcceptedEvidenceSnapshot,
  ): Promise<AcceptedEvidencePersistenceResult> {
    return { snapshot, persistence: this.receipt() };
  }

  async recordProductMappingSet(): Promise<PersistenceReceipt> {
    return this.receipt();
  }

  async recordRestockScenario(): Promise<PersistenceReceipt> {
    return this.receipt();
  }

  async recordPurchaseOrderDraft(): Promise<PersistenceReceipt> {
    return this.receipt();
  }

  async recordApprovedOrderBundle(): Promise<PersistenceReceipt> {
    return this.receipt();
  }

  private receipt(): PersistenceReceipt {
    return { mode: this.mode, durable: false };
  }
}
