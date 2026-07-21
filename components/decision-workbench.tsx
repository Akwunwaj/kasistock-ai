"use client";

import { useMemo, useState } from "react";
import type { CanonicalProduct } from "@/modules/catalogue/domain/product";
import type { AcceptedEvidenceSnapshot } from "@/modules/evidence/domain/contracts";
import type { OptimisationResult } from "@/modules/optimisation/domain/types";
import type {
  AcceptedProductMappingSet,
  ProductMatchProposal,
} from "@/modules/reconciliation/domain/contracts";
import type { RestockInputBuildResult } from "@/modules/restocking/domain/types";
import type {
  SignedApprovedOrderBundle,
  SignedPurchaseOrderDraft,
} from "@/modules/purchasing/domain/contracts";

interface ProposalResponse {
  snapshots?: AcceptedEvidenceSnapshot[];
  products?: CanonicalProduct[];
  proposals?: ProductMatchProposal[];
  mode?: string;
  model?: string;
  responseId?: string;
  error?: { message?: string };
}

interface CalculationResponse {
  inputs?: RestockInputBuildResult;
  optimisation?: OptimisationResult;
  error?: { message?: string };
}

interface DraftResponse {
  envelope?: SignedPurchaseOrderDraft;
  error?: { message?: string };
}

interface ApprovalResponse {
  envelope?: SignedApprovedOrderBundle;
  error?: { message?: string };
}

interface EvaluationResponse {
  totalCases: number;
  productAccuracyPercent: number;
  authorityAccuracyPercent: number;
  unsafeAutoMergeCount: number;
  passedCases: number;
}

export function DecisionWorkbench() {
  const [snapshots, setSnapshots] = useState<AcceptedEvidenceSnapshot[]>([]);
  const [products, setProducts] = useState<CanonicalProduct[]>([]);
  const [proposals, setProposals] = useState<ProductMatchProposal[]>([]);
  const [selections, setSelections] = useState<Record<string, string | null>>({});
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
  const [mappingSet, setMappingSet] = useState<AcceptedProductMappingSet | null>(null);
  const [calculation, setCalculation] = useState<CalculationResponse | null>(null);
  const [budgetRand, setBudgetRand] = useState(1500);
  const [status, setStatus] = useState<"idle" | "loading" | "gpt" | "accepting" | "calculating">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [proposalMode, setProposalMode] = useState<string>("deterministic");
  const [orderSelections, setOrderSelections] = useState<Record<string, number>>({});
  const [draftEnvelope, setDraftEnvelope] = useState<SignedPurchaseOrderDraft | null>(null);
  const [approvedEnvelope, setApprovedEnvelope] = useState<SignedApprovedOrderBundle | null>(null);
  const [merchantName, setMerchantName] = useState("Thandi's Corner Shop");
  const [tradingAddress, setTradingAddress] = useState("12 Demo Street, Khayelitsha, Cape Town");
  const [contactName, setContactName] = useState("Thandi Mokoena");
  const [contactPhone, setContactPhone] = useState("+27 82 555 0142");
  const [fulfilmentMethod, setFulfilmentMethod] = useState<"collection" | "delivery">("collection");
  const [requestedDate, setRequestedDate] = useState("2026-07-22");
  const [approvalConfirmed, setApprovalConfirmed] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationResponse | null>(null);

  const editableOrderTotalCents = useMemo(() => {
    if (!calculation?.optimisation) return 0;
    return calculation.optimisation.lines.reduce((total, line) => {
      const key = `${line.supplierId}:${line.productId}`;
      return total + (orderSelections[key] ?? line.selectedPacks) * line.packCostCents;
    }, 0);
  }, [calculation, orderSelections]);

  const pendingConfirmations = useMemo(
    () =>
      proposals.filter(
        (proposal) =>
          proposal.status !== "auto_confirmed" && !confirmed.has(proposal.source.sourceKey),
      ).length,
    [confirmed, proposals],
  );

  async function loadPreparedEvidence() {
    setStatus("loading");
    setError(null);
    try {
      const response = await fetch("/api/reconciliation/proposals");
      const body = (await response.json()) as ProposalResponse;
      if (!response.ok || !body.snapshots || !body.products || !body.proposals) {
        throw new Error(body.error?.message ?? "Prepared evidence could not be loaded.");
      }
      applyProposalResponse(body.snapshots, body.products, body.proposals, body.mode ?? "demo");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Prepared evidence could not be loaded.");
    } finally {
      setStatus("idle");
    }
  }

  async function loadBrowserEvidence() {
    setStatus("loading");
    setError(null);
    try {
      const stored = JSON.parse(
        window.localStorage.getItem("kasistock.acceptedSnapshots") ?? "[]",
      ) as AcceptedEvidenceSnapshot[];
      if (stored.length === 0) {
        throw new Error("No accepted evidence snapshots are stored in this browser.");
      }
      const response = await fetch("/api/reconciliation/proposals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ snapshots: stored, useGpt: false }),
      });
      const body = (await response.json()) as ProposalResponse;
      if (!response.ok || !body.products || !body.proposals) {
        throw new Error(body.error?.message ?? "Stored evidence could not be reconciled.");
      }
      applyProposalResponse(stored, body.products, body.proposals, body.mode ?? "deterministic");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Stored evidence could not be loaded.");
    } finally {
      setStatus("idle");
    }
  }

  function applyProposalResponse(
    nextSnapshots: AcceptedEvidenceSnapshot[],
    nextProducts: CanonicalProduct[],
    nextProposals: ProductMatchProposal[],
    mode: string,
  ) {
    setSnapshots(nextSnapshots);
    setProducts(nextProducts);
    setProposals(nextProposals);
    setProposalMode(mode);
    setMappingSet(null);
    setCalculation(null);
    resetPurchaseOrderState();
    setConfirmed(
      new Set(
        nextProposals
          .filter((proposal) => proposal.status === "auto_confirmed")
          .map((proposal) => proposal.source.sourceKey),
      ),
    );
    setSelections(
      Object.fromEntries(
        nextProposals.map((proposal) => [
          proposal.source.sourceKey,
          proposal.recommendedProductId ?? proposal.candidates[0]?.productId ?? null,
        ]),
      ),
    );
  }

  async function requestGptSuggestions() {
    if (snapshots.length === 0) return;
    setStatus("gpt");
    setError(null);
    try {
      const response = await fetch("/api/reconciliation/proposals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ snapshots, useGpt: true }),
      });
      const body = (await response.json()) as ProposalResponse;
      if (!response.ok || !body.products || !body.proposals) {
        throw new Error(body.error?.message ?? "GPT-5.6 could not propose product matches.");
      }
      applyProposalResponse(snapshots, body.products, body.proposals, body.mode ?? "gpt_assisted");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "GPT-5.6 matching failed.");
    } finally {
      setStatus("idle");
    }
  }

  async function acceptMappings() {
    if (pendingConfirmations > 0) return;
    setStatus("accepting");
    setError(null);
    try {
      const decisions = proposals.map((proposal) => {
        const productId = selections[proposal.source.sourceKey] ?? null;
        const selectedCandidate = proposal.candidates.find(
          (candidate) => candidate.productId === productId,
        );
        return {
          sourceKey: proposal.source.sourceKey,
          productId,
          decision:
            productId === null
              ? "unmatched"
              : productId === proposal.recommendedProductId
                ? "accepted"
                : "corrected",
          proposedProductId: proposal.recommendedProductId,
          method: selectedCandidate?.method ?? "unmatched",
          confirmed: true,
          note:
            proposal.status === "auto_confirmed"
              ? "Deterministic exact match accepted under catalogue policy."
              : "Human confirmed the product identity mapping.",
        };
      });
      const response = await fetch("/api/product-mappings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          snapshots,
          decisions,
          acceptedBy: "KasiStock AI demo merchant",
        }),
      });
      const body = (await response.json()) as {
        mappingSet?: AcceptedProductMappingSet;
        error?: { message?: string };
      };
      if (!response.ok || !body.mappingSet) {
        throw new Error(body.error?.message ?? "Product mappings could not be accepted.");
      }
      setMappingSet(body.mappingSet);
      setCalculation(null);
      resetPurchaseOrderState();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Product mappings could not be accepted.",
      );
    } finally {
      setStatus("idle");
    }
  }

  async function calculateRestockInputs() {
    if (!mappingSet) return;
    setStatus("calculating");
    setError(null);
    try {
      const response = await fetch("/api/restock-inputs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          snapshots,
          mappingSet,
          budgetCents: Math.round(budgetRand * 100),
        }),
      });
      const body = (await response.json()) as CalculationResponse;
      if (!response.ok || !body.inputs || !body.optimisation) {
        throw new Error(body.error?.message ?? "Restocking calculations failed.");
      }
      setCalculation(body);
      setOrderSelections(
        Object.fromEntries(
          body.optimisation.lines.map((line) => [
            `${line.supplierId}:${line.productId}`,
            line.selectedPacks,
          ]),
        ),
      );
      setDraftEnvelope(null);
      setApprovedEnvelope(null);
      setApprovalConfirmed(false);
      void loadEvaluation();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Restocking calculations failed.");
    } finally {
      setStatus("idle");
    }
  }

  function resetPurchaseOrderState() {
    setOrderSelections({});
    setDraftEnvelope(null);
    setApprovedEnvelope(null);
    setApprovalConfirmed(false);
    setCopiedMessage(null);
  }

  async function loadEvaluation() {
    try {
      const response = await fetch("/api/evaluations");
      if (!response.ok) return;
      setEvaluation((await response.json()) as EvaluationResponse);
    } catch {
      // Evaluation evidence is supplemental and must not block the purchasing workflow.
    }
  }

  async function createApprovalDraft() {
    if (!mappingSet || !calculation?.optimisation) return;
    setStatus("calculating");
    setError(null);
    try {
      const selections = calculation.optimisation.lines.map((line) => ({
        productId: line.productId,
        supplierId: line.supplierId,
        selectedPacks:
          orderSelections[`${line.supplierId}:${line.productId}`] ?? line.selectedPacks,
      }));
      const response = await fetch("/api/purchase-orders/draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          snapshots,
          mappingSet,
          budgetCents: Math.round(budgetRand * 100),
          merchant: {
            displayName: merchantName,
            tradingAddress,
            contactName,
            contactPhone,
          },
          fulfilment: {
            method: fulfilmentMethod,
            requestedDate,
            note: "Confirm stock availability and final total before fulfilment.",
          },
          selections,
        }),
      });
      const body = (await response.json()) as DraftResponse;
      if (!response.ok || !body.envelope) {
        throw new Error(body.error?.message ?? "The approval draft could not be created.");
      }
      setDraftEnvelope(body.envelope);
      setApprovedEnvelope(null);
      setApprovalConfirmed(false);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "The approval draft could not be created.",
      );
    } finally {
      setStatus("idle");
    }
  }

  async function approveOrder() {
    if (!draftEnvelope || !approvalConfirmed) return;
    setStatus("accepting");
    setError(null);
    try {
      const response = await fetch("/api/purchase-orders/approve", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          envelope: draftEnvelope,
          approvedBy: contactName,
          confirmed: true,
        }),
      });
      const body = (await response.json()) as ApprovalResponse;
      if (!response.ok || !body.envelope) {
        throw new Error(body.error?.message ?? "The purchase order could not be approved.");
      }
      setApprovedEnvelope(body.envelope);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "The purchase order could not be approved.",
      );
    } finally {
      setStatus("idle");
    }
  }

  async function downloadPurchaseOrder(purchaseOrderId: string, purchaseOrderNumber: string) {
    if (!approvedEnvelope) return;
    setError(null);
    try {
      const response = await fetch("/api/purchase-orders/pdf", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ envelope: approvedEnvelope, purchaseOrderId }),
      });
      if (!response.ok) {
        const body = (await response.json()) as { error?: { message?: string } };
        throw new Error(body.error?.message ?? "The purchase-order PDF could not be generated.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${purchaseOrderNumber}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "The purchase-order PDF could not be generated.",
      );
    }
  }

  async function copySupplierMessage(supplierId: string, body: string) {
    await navigator.clipboard.writeText(body);
    setCopiedMessage(supplierId);
    window.setTimeout(() => setCopiedMessage(null), 1800);
  }

  return (
    <section
      className="decisionWorkbench"
      aria-label="Product reconciliation and restocking workspace"
    >
      <div className="decisionToolbar">
        <div>
          <p className="step">01 · LOAD ACCEPTED EVIDENCE</p>
          <h2>Evidence-bound decision inputs</h2>
          <p>
            Only hash-valid, human-accepted snapshots can enter product reconciliation and stock
            calculations.
          </p>
        </div>
        <div className="actionRow">
          <button
            type="button"
            className="button primary"
            disabled={status !== "idle"}
            onClick={() => void loadPreparedEvidence()}
          >
            {status === "loading" ? "Loading…" : "Load prepared accepted evidence"}
          </button>
          <button
            type="button"
            className="button secondary"
            disabled={status !== "idle"}
            onClick={() => void loadBrowserEvidence()}
          >
            Use browser snapshots
          </button>
        </div>
      </div>

      {error ? (
        <div className="errorNotice decisionError" role="alert">
          {error}
        </div>
      ) : null}

      {snapshots.length > 0 ? (
        <div className="authorityStrip">
          <div>
            <strong>{snapshots.length}</strong>
            <span>accepted snapshots</span>
          </div>
          <div>
            <strong>{proposals.length}</strong>
            <span>source product labels</span>
          </div>
          <div>
            <strong>{pendingConfirmations}</strong>
            <span>human confirmations pending</span>
          </div>
          <div>
            <strong>{proposalMode.replaceAll("_", " ")}</strong>
            <span>proposal mode</span>
          </div>
        </div>
      ) : null}

      {proposals.length > 0 ? (
        <section className="decisionStage">
          <div className="stageHeader">
            <div>
              <p className="step">02 · RECONCILE PRODUCT IDENTITY</p>
              <h2>Map every source label to the canonical catalogue</h2>
            </div>
            <button
              type="button"
              className="button secondary"
              disabled={status !== "idle"}
              onClick={() => void requestGptSuggestions()}
            >
              {status === "gpt" ? "Asking GPT-5.6…" : "Ask GPT-5.6 for uncertain matches"}
            </button>
          </div>
          <div className="mappingTable" role="table" aria-label="Product identity proposals">
            <div className="mappingHeader" role="row">
              <span>Evidence source</span>
              <span>Source label</span>
              <span>Canonical product</span>
              <span>Authority</span>
            </div>
            {proposals.map((proposal) => {
              const requiresConfirmation = proposal.status !== "auto_confirmed";
              const selected = selections[proposal.source.sourceKey] ?? "";
              const lead = proposal.candidates.find(
                (candidate) => candidate.productId === selected,
              );
              return (
                <article className="mappingRow" role="row" key={proposal.source.sourceKey}>
                  <div>
                    <span className={`sourceKind ${proposal.source.kind}`}>
                      {sourceKindLabel(proposal.source.kind)}
                    </span>
                    <small>{proposal.source.sourceLabel}</small>
                  </div>
                  <div>
                    <strong>{proposal.source.rawProductName}</strong>
                    <small>
                      {proposal.source.barcode
                        ? `Barcode ${proposal.source.barcode}`
                        : "No barcode"}
                    </small>
                  </div>
                  <div>
                    <select
                      aria-label={`Canonical product for ${proposal.source.rawProductName}`}
                      value={selected ?? ""}
                      disabled={mappingSet !== null}
                      onChange={(event) => {
                        const productId = event.target.value || null;
                        setSelections((current) => ({
                          ...current,
                          [proposal.source.sourceKey]: productId,
                        }));
                        if (requiresConfirmation) {
                          setConfirmed((current) => {
                            const next = new Set(current);
                            next.delete(proposal.source.sourceKey);
                            return next;
                          });
                        }
                      }}
                    >
                      <option value="">Mark as unmatched</option>
                      {products.map((product) => (
                        <option value={product.productId} key={product.productId}>
                          {product.displayName}
                        </option>
                      ))}
                    </select>
                    <small>
                      {lead
                        ? `${matchMethodLabel(lead.method)} · ${(lead.scoreBasisPoints / 100).toFixed(1)}%`
                        : "Human marked unmatched"}
                    </small>
                  </div>
                  <div>
                    {requiresConfirmation ? (
                      <label className="mappingConfirm">
                        <input
                          type="checkbox"
                          disabled={mappingSet !== null}
                          checked={confirmed.has(proposal.source.sourceKey)}
                          onChange={(event) => {
                            setConfirmed((current) => {
                              const next = new Set(current);
                              if (event.target.checked) next.add(proposal.source.sourceKey);
                              else next.delete(proposal.source.sourceKey);
                              return next;
                            });
                          }}
                        />
                        Human confirmed
                      </label>
                    ) : (
                      <span className="readyBadge">Exact policy match</span>
                    )}
                    <small>{lead?.explanation ?? "No candidate selected."}</small>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="mappingGate">
            <div>
              <span>Identity authority gate</span>
              <strong>
                {pendingConfirmations === 0
                  ? "Every source record has an explicit decision"
                  : `${pendingConfirmations} uncertain record(s) still need human confirmation`}
              </strong>
            </div>
            <button
              type="button"
              className="button primary"
              disabled={status !== "idle" || pendingConfirmations > 0 || mappingSet !== null}
              onClick={() => void acceptMappings()}
            >
              {status === "accepting" ? "Freezing mappings…" : "Accept product mapping set"}
            </button>
          </div>
        </section>
      ) : null}

      {mappingSet ? (
        <section className="decisionStage calculationStage">
          <div className="stageHeader">
            <div>
              <p className="step">03 · CALCULATE RESTOCK INPUTS</p>
              <h2>Derive demand and supplier economics</h2>
              <p className="hashSummary">Mapping hash: {mappingSet.mappingHash}</p>
            </div>
            <div className="budgetControl">
              <label>
                Cash budget (R)
                <input
                  type="number"
                  min="100"
                  step="100"
                  value={budgetRand}
                  onChange={(event) => setBudgetRand(Number(event.target.value))}
                />
              </label>
              <button
                type="button"
                className="button primary"
                disabled={status !== "idle"}
                onClick={() => void calculateRestockInputs()}
              >
                {status === "calculating" ? "Calculating…" : "Build and optimise plan"}
              </button>
            </div>
          </div>

          {calculation?.inputs && calculation.optimisation ? (
            <>
              <div className="calculationGrid">
                {calculation.inputs.calculations.map((item) => (
                  <article className="calculationCard" key={item.productId}>
                    <div className="calculationTitle">
                      <strong>{item.productName}</strong>
                      <span
                        className={
                          item.daysOfCover !== null && item.daysOfCover < 2
                            ? "riskHigh"
                            : "riskNormal"
                        }
                      >
                        {item.daysOfCover === null
                          ? "No velocity"
                          : `${item.daysOfCover} days cover`}
                      </span>
                    </div>
                    <dl>
                      <div>
                        <dt>Current stock</dt>
                        <dd>{item.currentStockUnits} units</dd>
                      </div>
                      <div>
                        <dt>30-day velocity</dt>
                        <dd>{item.averageDailySales} units/day</dd>
                      </div>
                      <div>
                        <dt>Target stock</dt>
                        <dd>{item.targetStockUnits} units</dd>
                      </div>
                      <div>
                        <dt>Reorder need</dt>
                        <dd>{item.reorderUnits} units</dd>
                      </div>
                      <div>
                        <dt>Best supplier</dt>
                        <dd>{item.cheapestOffer?.supplierName ?? "Unavailable"}</dd>
                      </div>
                      <div>
                        <dt>Effective unit cost</dt>
                        <dd>
                          {item.cheapestOffer
                            ? formatCents(item.cheapestOffer.effectiveUnitCostCents)
                            : "—"}
                        </dd>
                      </div>
                    </dl>
                    <small>
                      {item.sourceKeys.length} accepted evidence line(s) support this calculation.
                    </small>
                  </article>
                ))}
              </div>

              <div className="optimisationResult">
                <div>
                  <p className="step">BUDGET-CONSTRAINED OUTPUT</p>
                  <h3>{formatCents(calculation.optimisation.totalCostCents)} allocated</h3>
                  <p>
                    {formatCents(calculation.optimisation.remainingCents)} remains from a{" "}
                    {formatCents(calculation.optimisation.budgetCents)} budget.
                  </p>
                </div>
                <div className="optimisationLines">
                  {calculation.optimisation.lines.map((line) => (
                    <article key={`${line.productId}-${line.supplierId}`}>
                      <div>
                        <strong>{line.productName}</strong>
                        <span>{line.supplierName}</span>
                      </div>
                      <div>
                        <strong>{line.selectedUnits} units</strong>
                        <span>{line.selectedPacks} pack(s)</span>
                      </div>
                      <strong>{formatCents(line.lineCostCents)}</strong>
                    </article>
                  ))}
                </div>
              </div>

              <section className="purchaseStage" aria-label="Purchase order approval workflow">
                <div className="stageHeader purchaseStageHeader">
                  <div>
                    <p className="step">04 · EDIT AND LOCK THE FINAL ORDER</p>
                    <h2>Merchant-controlled purchase order</h2>
                    <p>
                      Pack quantities remain editable until the server rebuilds and signs the
                      approval draft from the accepted evidence and mapping hashes.
                    </p>
                  </div>
                  <div
                    className={`budgetBadge ${editableOrderTotalCents > budgetRand * 100 ? "overBudget" : ""}`}
                  >
                    <span>Edited order</span>
                    <strong>{formatCents(editableOrderTotalCents)}</strong>
                    <small>of {formatCents(Math.round(budgetRand * 100))}</small>
                  </div>
                </div>

                <div className="orderEditorGrid">
                  <div className="orderLineEditor">
                    <div className="orderLineHeader">
                      <span>Product and supplier</span>
                      <span>Packs</span>
                      <span>Units</span>
                      <span>Line total</span>
                    </div>
                    {calculation.optimisation.lines.map((line) => {
                      const key = `${line.supplierId}:${line.productId}`;
                      const selectedPacks = orderSelections[key] ?? line.selectedPacks;
                      return (
                        <article className="orderEditRow" key={key}>
                          <div>
                            <strong>{line.productName}</strong>
                            <small>
                              {line.supplierName} · {line.packQuantity} units per pack · maximum{" "}
                              {line.maximumPacks}
                            </small>
                          </div>
                          <input
                            aria-label={`Packs of ${line.productName}`}
                            type="number"
                            min="0"
                            max={line.maximumPacks}
                            value={selectedPacks}
                            disabled={draftEnvelope !== null}
                            onChange={(event) => {
                              const packs = Math.max(
                                0,
                                Math.min(line.maximumPacks, Number(event.target.value) || 0),
                              );
                              setOrderSelections((current) => ({ ...current, [key]: packs }));
                              setDraftEnvelope(null);
                              setApprovedEnvelope(null);
                              setApprovalConfirmed(false);
                            }}
                          />
                          <strong>{selectedPacks * line.packQuantity}</strong>
                          <strong>{formatCents(selectedPacks * line.packCostCents)}</strong>
                        </article>
                      );
                    })}
                  </div>

                  <div className="merchantForm">
                    <h3>Buyer and fulfilment details</h3>
                    <label>
                      Trading name
                      <input
                        value={merchantName}
                        disabled={draftEnvelope !== null}
                        onChange={(event) => setMerchantName(event.target.value)}
                      />
                    </label>
                    <label>
                      Trading address
                      <textarea
                        value={tradingAddress}
                        disabled={draftEnvelope !== null}
                        onChange={(event) => setTradingAddress(event.target.value)}
                      />
                    </label>
                    <div className="formPair">
                      <label>
                        Contact name
                        <input
                          value={contactName}
                          disabled={draftEnvelope !== null}
                          onChange={(event) => setContactName(event.target.value)}
                        />
                      </label>
                      <label>
                        Contact phone
                        <input
                          value={contactPhone}
                          disabled={draftEnvelope !== null}
                          onChange={(event) => setContactPhone(event.target.value)}
                        />
                      </label>
                    </div>
                    <div className="formPair">
                      <label>
                        Fulfilment
                        <select
                          value={fulfilmentMethod}
                          disabled={draftEnvelope !== null}
                          onChange={(event) =>
                            setFulfilmentMethod(event.target.value as "collection" | "delivery")
                          }
                        >
                          <option value="collection">Collection</option>
                          <option value="delivery">Delivery</option>
                        </select>
                      </label>
                      <label>
                        Requested date
                        <input
                          type="date"
                          value={requestedDate}
                          disabled={draftEnvelope !== null}
                          onChange={(event) => setRequestedDate(event.target.value)}
                        />
                      </label>
                    </div>
                    <button
                      type="button"
                      className="button primary fullButton"
                      disabled={
                        status !== "idle" ||
                        editableOrderTotalCents <= 0 ||
                        editableOrderTotalCents > budgetRand * 100 ||
                        draftEnvelope !== null
                      }
                      onClick={() => void createApprovalDraft()}
                    >
                      {status === "calculating" ? "Locking draft…" : "Create signed approval draft"}
                    </button>
                    {editableOrderTotalCents > budgetRand * 100 ? (
                      <small className="inlineError">
                        Reduce quantities before locking the draft.
                      </small>
                    ) : null}
                  </div>
                </div>

                {draftEnvelope ? (
                  <div className="approvalGate">
                    <div>
                      <p className="step">05 · EXPLICIT MERCHANT APPROVAL</p>
                      <h3>Review the immutable draft</h3>
                      <p className="hashSummary">Draft hash: {draftEnvelope.draft.draftHash}</p>
                      <dl className="approvalSummary">
                        <div>
                          <dt>Order total</dt>
                          <dd>{formatCents(draftEnvelope.draft.totalCostCents)}</dd>
                        </div>
                        <div>
                          <dt>Budget remaining</dt>
                          <dd>{formatCents(draftEnvelope.draft.remainingCents)}</dd>
                        </div>
                        <div>
                          <dt>Expected margin</dt>
                          <dd>{formatCents(draftEnvelope.draft.expectedMarginCents)}</dd>
                        </div>
                        <div>
                          <dt>Supplier groups</dt>
                          <dd>
                            {new Set(draftEnvelope.draft.lines.map((line) => line.supplierId)).size}
                          </dd>
                        </div>
                      </dl>
                    </div>
                    <div className="approvalAction">
                      <label className="approvalCheck">
                        <input
                          type="checkbox"
                          checked={approvalConfirmed}
                          disabled={approvedEnvelope !== null}
                          onChange={(event) => setApprovalConfirmed(event.target.checked)}
                        />
                        <span>
                          I reviewed this order and authorise the supplier purchase orders shown.
                        </span>
                      </label>
                      <button
                        type="button"
                        className="button primary fullButton"
                        disabled={
                          status !== "idle" || !approvalConfirmed || approvedEnvelope !== null
                        }
                        onClick={() => void approveOrder()}
                      >
                        {status === "accepting"
                          ? "Approving…"
                          : "Approve and generate purchase orders"}
                      </button>
                      {!approvedEnvelope ? (
                        <button
                          type="button"
                          className="textButton"
                          onClick={() => {
                            setDraftEnvelope(null);
                            setApprovalConfirmed(false);
                          }}
                        >
                          Unlock and edit quantities
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {approvedEnvelope ? (
                  <div className="approvedOutput">
                    <div className="approvedBanner">
                      <div>
                        <span className="readyBadge">Approved</span>
                        <h2>Supplier orders are ready</h2>
                        <p>
                          Approval hash:{" "}
                          <code>{approvedEnvelope.bundle.approval.approvalHash}</code>
                        </p>
                      </div>
                      {evaluation ? (
                        <div className="evaluationCard">
                          <span>Identity evaluation</span>
                          <strong>
                            {evaluation.passedCases}/{evaluation.totalCases} cases passed
                          </strong>
                          <small>
                            {evaluation.productAccuracyPercent}% product accuracy ·{" "}
                            {evaluation.unsafeAutoMergeCount} unsafe auto-merges
                          </small>
                        </div>
                      ) : null}
                    </div>

                    <div className="purchaseOrderCards">
                      {approvedEnvelope.bundle.purchaseOrders.map((order) => {
                        const message = approvedEnvelope.bundle.supplierMessages.find(
                          (candidate) => candidate.purchaseOrderId === order.purchaseOrderId,
                        );
                        return (
                          <article className="purchaseOrderCard" key={order.purchaseOrderId}>
                            <div className="purchaseOrderHeading">
                              <div>
                                <span>{order.purchaseOrderNumber}</span>
                                <h3>{order.supplierName}</h3>
                              </div>
                              <strong>{formatCents(order.totalCents)}</strong>
                            </div>
                            <div className="purchaseOrderLines">
                              {order.lines.map((line) => (
                                <div key={line.productId}>
                                  <span>{line.productName}</span>
                                  <span>{line.selectedPacks} pack(s)</span>
                                  <strong>{formatCents(line.lineCostCents)}</strong>
                                </div>
                              ))}
                            </div>
                            <button
                              type="button"
                              className="button primary fullButton"
                              onClick={() =>
                                void downloadPurchaseOrder(
                                  order.purchaseOrderId,
                                  order.purchaseOrderNumber,
                                )
                              }
                            >
                              Download approved PDF
                            </button>
                            {message ? (
                              <div className="supplierMessage">
                                <div>
                                  <strong>WhatsApp-ready supplier message</strong>
                                  <button
                                    type="button"
                                    className="textButton"
                                    onClick={() =>
                                      void copySupplierMessage(message.supplierId, message.body)
                                    }
                                  >
                                    {copiedMessage === message.supplierId
                                      ? "Copied"
                                      : "Copy message"}
                                  </button>
                                </div>
                                <pre>{message.body}</pre>
                              </div>
                            ) : null}
                          </article>
                        );
                      })}
                    </div>

                    <div className="auditTimeline">
                      <p className="step">06 · IMMUTABLE AUDIT TIMELINE</p>
                      {approvedEnvelope.bundle.auditEvents.map((event) => (
                        <article key={event.id}>
                          <span>{formatAuditTime(event.occurredAt)}</span>
                          <div>
                            <strong>{auditEventLabel(event.eventType)}</strong>
                            <small>
                              {event.actorType} · {event.actorId}
                            </small>
                          </div>
                          <code>{event.outputVersion?.slice(0, 16) ?? "recorded"}</code>
                        </article>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>
            </>
          ) : null}
        </section>
      ) : null}
    </section>
  );
}

function sourceKindLabel(kind: ProductMatchProposal["source"]["kind"]): string {
  if (kind === "shelf_image") return "SHELF";
  if (kind === "supplier_catalogue") return "SUPPLIER";
  return "SALES";
}

function matchMethodLabel(method: ProductMatchProposal["candidates"][number]["method"]): string {
  return method.replaceAll("_", " ");
}

function formatAuditTime(value: string): string {
  return new Intl.DateTimeFormat("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Johannesburg",
  }).format(new Date(value));
}

function auditEventLabel(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/^./, (character) => character.toUpperCase());
}

function formatCents(value: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(value / 100);
}
