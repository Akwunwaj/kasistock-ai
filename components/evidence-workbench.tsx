"use client";

import { useMemo, useState } from "react";
import type {
  EvidenceKind,
  SalesHistory,
  ShelfExtraction,
  SupplierCatalogueExtraction,
} from "@/modules/extraction/domain/contracts";
import type {
  AcceptedEvidenceSnapshot,
  SignedExtraction,
} from "@/modules/evidence/domain/contracts";

interface ApiErrorBody {
  error?: { code?: string; message?: string };
}

export function EvidenceWorkbench() {
  const [kind, setKind] = useState<EvidenceKind>("shelf_image");
  const [file, setFile] = useState<File | null>(null);
  const [signed, setSigned] = useState<SignedExtraction | null>(null);
  const [acceptedPayload, setAcceptedPayload] = useState<
    ShelfExtraction | SupplierCatalogueExtraction | SalesHistory | null
  >(null);
  const [reviewedPaths, setReviewedPaths] = useState<Set<string>>(new Set());
  const [snapshot, setSnapshot] = useState<AcceptedEvidenceSnapshot | null>(null);
  const [status, setStatus] = useState<"idle" | "extracting" | "accepting">("idle");
  const [error, setError] = useState<string | null>(null);

  const requiredPaths = useMemo(
    () => [...new Set(signed?.envelope.reviewIssues.map((issue) => issue.path) ?? [])],
    [signed],
  );
  const unresolvedCount = requiredPaths.filter((path) => !reviewedPaths.has(path)).length;

  function changeKind(nextKind: EvidenceKind) {
    setKind(nextKind);
    setFile(null);
    resetResult();
  }

  async function runExtraction(mode: "live" | "demo") {
    setError(null);
    setSnapshot(null);
    setStatus("extracting");
    try {
      const response =
        mode === "demo" ? await fetch(`/api/extractions?kind=${kind}`) : await postLiveExtraction();
      const body = (await response.json()) as SignedExtraction & ApiErrorBody;
      if (!response.ok) {
        throw new Error(body.error?.message ?? "Extraction failed.");
      }
      setSigned(body);
      setAcceptedPayload(clone(body.envelope.output));
      setReviewedPaths(new Set());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Extraction failed.");
    } finally {
      setStatus("idle");
    }
  }

  async function postLiveExtraction(): Promise<Response> {
    if (!file) {
      throw new Error("Choose an evidence file before starting live extraction.");
    }
    const formData = new FormData();
    formData.set("kind", kind);
    formData.set("file", file);
    return fetch("/api/extractions", { method: "POST", body: formData });
  }

  async function acceptEvidence() {
    if (!signed || !acceptedPayload) return;
    setError(null);
    setStatus("accepting");
    try {
      const reviewDecisions = requiredPaths.map((path) => ({
        path,
        decision: valuesEqualAtPath(signed.envelope.output, acceptedPayload, path)
          ? "accepted"
          : "corrected",
        note: valuesEqualAtPath(signed.envelope.output, acceptedPayload, path)
          ? "Human verified against the source evidence."
          : "Human corrected the extracted value after checking the source evidence.",
      }));
      const response = await fetch("/api/evidence-snapshots", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          envelope: signed.envelope,
          token: signed.token,
          acceptedPayload,
          reviewDecisions,
          acceptedBy: "KasiStock AI demo merchant",
        }),
      });
      const body = (await response.json()) as {
        snapshot?: AcceptedEvidenceSnapshot;
        error?: { message?: string };
      };
      if (!response.ok || !body.snapshot) {
        throw new Error(body.error?.message ?? "Evidence acceptance failed.");
      }
      setSnapshot(body.snapshot);
      rememberAcceptedSnapshot(body.snapshot);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Evidence acceptance failed.");
    } finally {
      setStatus("idle");
    }
  }

  function resetResult() {
    setSigned(null);
    setAcceptedPayload(null);
    setReviewedPaths(new Set());
    setSnapshot(null);
    setError(null);
  }

  return (
    <section className="evidenceWorkbench" aria-label="Live evidence extraction workspace">
      <div className="uploadCard">
        <div className="panelHeader">
          <div>
            <p className="step">01 · INGEST</p>
            <h2>Select evidence</h2>
          </div>
          <span className="versionBadge">Contract 2026-07-18.2</span>
        </div>

        <div className="kindSwitch" role="group" aria-label="Evidence type">
          <button
            type="button"
            className={kind === "shelf_image" ? "active" : ""}
            onClick={() => changeKind("shelf_image")}
          >
            Shelf image
          </button>
          <button
            type="button"
            className={kind === "supplier_catalogue" ? "active" : ""}
            onClick={() => changeKind("supplier_catalogue")}
          >
            Supplier list
          </button>
          <button
            type="button"
            className={kind === "sales_history" ? "active" : ""}
            onClick={() => changeKind("sales_history")}
          >
            Sales CSV
          </button>
        </div>

        <label className="dropZone">
          <input
            type="file"
            accept={
              kind === "shelf_image"
                ? "image/jpeg,image/png,image/webp"
                : kind === "sales_history"
                  ? "text/csv,application/vnd.ms-excel,.csv"
                  : "application/pdf,image/jpeg,image/png,image/webp"
            }
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              resetResult();
            }}
          />
          <span className="dropIcon">↑</span>
          <strong>{file ? file.name : "Choose a file"}</strong>
          <small>
            {kind === "shelf_image"
              ? "JPEG, PNG or WebP · maximum 8 MB"
              : kind === "sales_history"
                ? "CSV · maximum 2 MB"
                : "PDF, JPEG, PNG or WebP · maximum 12 MB"}
          </small>
        </label>

        <div className="actionRow">
          <button
            type="button"
            className="button primary"
            disabled={status !== "idle" || !file}
            onClick={() => void runExtraction("live")}
          >
            {status === "extracting"
              ? "Processing…"
              : kind === "sales_history"
                ? "Validate sales CSV"
                : "Run GPT-5.6 extraction"}
          </button>
          <button
            type="button"
            className="button secondary"
            disabled={status !== "idle"}
            onClick={() => void runExtraction("demo")}
          >
            Use prepared demo
          </button>
        </div>
        <p className="privacyNote">
          {kind === "sales_history" ? (
            <>Sales CSV rows are parsed deterministically and schema-validated on the server.</>
          ) : (
            <>
              API responses use <code>store: false</code>. Uploaded evidence is validated on the
              server and is not written into this source repository.
            </>
          )}
        </p>
        {error ? (
          <div className="errorNotice" role="alert">
            {error}
          </div>
        ) : null}
      </div>

      <div className="reviewCard">
        <div className="panelHeader">
          <div>
            <p className="step">02 · VERIFY</p>
            <h2>Human evidence review</h2>
          </div>
          {signed ? (
            <span className={unresolvedCount > 0 ? "reviewBadge" : "readyBadge"}>
              {unresolvedCount > 0 ? `${unresolvedCount} unresolved` : "Ready to accept"}
            </span>
          ) : null}
        </div>

        {!signed || !acceptedPayload ? (
          <div className="emptyState">
            <span>◎</span>
            <strong>No extraction loaded</strong>
            <p>Upload real evidence or load a prepared result to inspect the review workflow.</p>
          </div>
        ) : (
          <>
            <ExtractionMetadata signed={signed} />
            {signed.envelope.kind === "shelf_image" ? (
              <ShelfReview
                original={signed.envelope.output}
                value={acceptedPayload as ShelfExtraction}
                requiredPaths={new Set(requiredPaths)}
                reviewedPaths={reviewedPaths}
                onReview={setReviewedPaths}
                onChange={setAcceptedPayload}
              />
            ) : signed.envelope.kind === "supplier_catalogue" ? (
              <SupplierReview
                original={signed.envelope.output}
                value={acceptedPayload as SupplierCatalogueExtraction}
                requiredPaths={new Set(requiredPaths)}
                reviewedPaths={reviewedPaths}
                onReview={setReviewedPaths}
                onChange={setAcceptedPayload}
              />
            ) : (
              <SalesReview
                original={signed.envelope.output}
                value={acceptedPayload as SalesHistory}
                requiredPaths={new Set(requiredPaths)}
                reviewedPaths={reviewedPaths}
                onReview={setReviewedPaths}
                onChange={setAcceptedPayload}
              />
            )}
            <div className="acceptanceBar">
              <div>
                <span>Merchant authority gate</span>
                <strong>
                  {unresolvedCount === 0
                    ? "All required evidence reviewed"
                    : `${unresolvedCount} review item(s) still require confirmation`}
                </strong>
              </div>
              <button
                type="button"
                className="button primary"
                disabled={status !== "idle" || unresolvedCount > 0}
                onClick={() => void acceptEvidence()}
              >
                {status === "accepting" ? "Creating snapshot…" : "Accept evidence snapshot"}
              </button>
            </div>
          </>
        )}
      </div>

      <div className="snapshotCard">
        <div className="panelHeader">
          <div>
            <p className="step">03 · FREEZE</p>
            <h2>Accepted snapshot</h2>
          </div>
          {snapshot ? <span className="completion">Immutable v{snapshot.version}</span> : null}
        </div>
        {snapshot ? (
          <div className="snapshotContent">
            <div className="snapshotSuccess">
              ✓ Human-accepted evidence is ready for product reconciliation.
            </div>
            <a className="button secondary snapshotLink" href="/decision">
              Continue to product reconciliation
            </a>
            <dl>
              <div>
                <dt>Snapshot ID</dt>
                <dd>{snapshot.snapshotId}</dd>
              </div>
              <div>
                <dt>Source extraction</dt>
                <dd>{snapshot.sourceExtractionId}</dd>
              </div>
              <div>
                <dt>Accepted by</dt>
                <dd>{snapshot.acceptedBy}</dd>
              </div>
              <div>
                <dt>Evidence hash</dt>
                <dd className="hashValue">{snapshot.evidenceHash}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <div className="emptyState compactEmpty">
            <span>◇</span>
            <strong>No accepted snapshot</strong>
            <p>The optimiser remains blocked until required evidence is reviewed and frozen.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function ExtractionMetadata({ signed }: { signed: SignedExtraction }) {
  return (
    <div className="extractionMetadata">
      <span>{signed.envelope.mode === "live" ? "LIVE API" : "PREPARED DEMO"}</span>
      <div>
        <strong>{signed.envelope.filename}</strong>
        <small>{signed.envelope.model}</small>
      </div>
      <div>
        <strong>{formatBytes(signed.envelope.sizeBytes)}</strong>
        <small>{signed.envelope.mediaType}</small>
      </div>
      <div>
        <strong>{signed.envelope.reviewIssues.length}</strong>
        <small>review flags</small>
      </div>
    </div>
  );
}

interface ReviewProps<T> {
  original: T;
  value: T;
  requiredPaths: Set<string>;
  reviewedPaths: Set<string>;
  onReview: (paths: Set<string>) => void;
  onChange: (value: T) => void;
}

function ShelfReview(props: ReviewProps<ShelfExtraction>) {
  return (
    <div className="extractionRows">
      {props.value.observedProducts.map((product, index) => {
        const path = `/observedProducts/${index}`;
        const requiresReview = props.requiredPaths.has(path);
        return (
          <article
            className={requiresReview ? "extractionRow flagged" : "extractionRow"}
            key={`${path}-${product.rawProductName}`}
          >
            <div className="rowHeading">
              <span className={`confidence ${product.confidence}`}>{product.confidence}</span>
              <strong>{props.original.observedProducts[index]?.rawProductName}</strong>
              {!requiresReview ? <span className="readyBadge">Auto-ready</span> : null}
            </div>
            <div className="editorGrid">
              <label>
                Product name
                <input
                  value={product.rawProductName}
                  onChange={(event) =>
                    props.onChange(
                      updateShelf(props.value, index, { rawProductName: event.target.value }),
                    )
                  }
                />
              </label>
              <label>
                Visible pack
                <input
                  value={product.visiblePackSize ?? ""}
                  onChange={(event) =>
                    props.onChange(
                      updateShelf(props.value, index, {
                        visiblePackSize: event.target.value || null,
                      }),
                    )
                  }
                />
              </label>
              <label>
                Visible quantity
                <input
                  type="number"
                  min="0"
                  value={product.estimatedQuantity ?? ""}
                  onChange={(event) =>
                    props.onChange(
                      updateShelf(props.value, index, {
                        estimatedQuantity:
                          event.target.value === "" ? null : Number(event.target.value),
                      }),
                    )
                  }
                />
              </label>
            </div>
            <p className="evidenceDescription">{product.evidenceDescription}</p>
            {product.uncertaintyReason ? (
              <p className="uncertainty">Uncertainty: {product.uncertaintyReason}</p>
            ) : null}
            {requiresReview ? (
              <ReviewCheckbox
                path={path}
                reviewedPaths={props.reviewedPaths}
                onReview={props.onReview}
              />
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

function SupplierReview(props: ReviewProps<SupplierCatalogueExtraction>) {
  return (
    <div className="extractionRows">
      <div className="supplierHeaderEditor">
        <label>
          Supplier name
          <input
            value={props.value.supplierName}
            onChange={(event) =>
              props.onChange({ ...props.value, supplierName: event.target.value })
            }
          />
        </label>
        <label>
          Catalogue date
          <input
            type="date"
            value={props.value.catalogueDate ?? ""}
            onChange={(event) =>
              props.onChange({ ...props.value, catalogueDate: event.target.value || null })
            }
          />
        </label>
      </div>
      {props.value.offers.map((offer, index) => {
        const path = `/offers/${index}`;
        const requiresReview = props.requiredPaths.has(path);
        return (
          <article
            className={requiresReview ? "extractionRow flagged" : "extractionRow"}
            key={`${path}-${offer.rawProductName}`}
          >
            <div className="rowHeading">
              <span className={`confidence ${offer.confidence}`}>{offer.confidence}</span>
              <strong>{props.original.offers[index]?.rawProductName}</strong>
              {!requiresReview ? <span className="readyBadge">Auto-ready</span> : null}
            </div>
            <div className="editorGrid supplierEditor">
              <label>
                Source product
                <input
                  value={offer.rawProductName}
                  onChange={(event) =>
                    props.onChange(
                      updateOffer(props.value, index, { rawProductName: event.target.value }),
                    )
                  }
                />
              </label>
              <label>
                Unit price (R)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={centsAsInput(offer.unitPriceCents)}
                  onChange={(event) =>
                    props.onChange(
                      updateOffer(props.value, index, {
                        unitPriceCents: randInputToCents(event.target.value),
                      }),
                    )
                  }
                />
              </label>
              <label>
                Case price (R)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={centsAsInput(offer.casePriceCents)}
                  onChange={(event) =>
                    props.onChange(
                      updateOffer(props.value, index, {
                        casePriceCents: randInputToCents(event.target.value),
                      }),
                    )
                  }
                />
              </label>
              <label>
                Case quantity
                <input
                  type="number"
                  min="1"
                  value={offer.caseQuantity ?? ""}
                  onChange={(event) =>
                    props.onChange(
                      updateOffer(props.value, index, {
                        caseQuantity: event.target.value === "" ? null : Number(event.target.value),
                      }),
                    )
                  }
                />
              </label>
            </div>
            {offer.promotion ? (
              <p className="evidenceDescription">Promotion: {offer.promotion}</p>
            ) : null}
            {requiresReview ? (
              <ReviewCheckbox
                path={path}
                reviewedPaths={props.reviewedPaths}
                onReview={props.onReview}
              />
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

function SalesReview(props: ReviewProps<SalesHistory>) {
  return (
    <div className="extractionRows">
      <div className="supplierHeaderEditor">
        <label>
          Period start
          <input
            type="date"
            value={props.value.periodStart}
            onChange={(event) =>
              props.onChange({ ...props.value, periodStart: event.target.value })
            }
          />
        </label>
        <label>
          Period end
          <input
            type="date"
            value={props.value.periodEnd}
            onChange={(event) => props.onChange({ ...props.value, periodEnd: event.target.value })}
          />
        </label>
      </div>
      {props.value.lines.map((line, index) => (
        <article className="extractionRow" key={`/lines/${index}-${line.rawProductName}`}>
          <div className="rowHeading">
            <span className="confidence high">validated</span>
            <strong>{props.original.lines[index]?.rawProductName}</strong>
            <span className="readyBadge">Schema-valid</span>
          </div>
          <div className="editorGrid supplierEditor">
            <label>
              Product name
              <input
                value={line.rawProductName}
                onChange={(event) =>
                  props.onChange(
                    updateSalesLine(props.value, index, { rawProductName: event.target.value }),
                  )
                }
              />
            </label>
            <label>
              Units sold
              <input
                type="number"
                min="0"
                value={line.unitsSold}
                onChange={(event) =>
                  props.onChange(
                    updateSalesLine(props.value, index, { unitsSold: Number(event.target.value) }),
                  )
                }
              />
            </label>
            <label>
              Gross revenue (R)
              <input
                type="number"
                min="0"
                step="0.01"
                value={centsAsInput(line.grossRevenueCents)}
                onChange={(event) =>
                  props.onChange(
                    updateSalesLine(props.value, index, {
                      grossRevenueCents: randInputToCents(event.target.value) ?? 0,
                    }),
                  )
                }
              />
            </label>
            <label>
              Transactions
              <input
                type="number"
                min="0"
                value={line.transactionCount}
                onChange={(event) =>
                  props.onChange(
                    updateSalesLine(props.value, index, {
                      transactionCount: Number(event.target.value),
                    }),
                  )
                }
              />
            </label>
          </div>
        </article>
      ))}
    </div>
  );
}

function ReviewCheckbox({
  path,
  reviewedPaths,
  onReview,
}: {
  path: string;
  reviewedPaths: Set<string>;
  onReview: (paths: Set<string>) => void;
}) {
  return (
    <label className="reviewCheck">
      <input
        type="checkbox"
        checked={reviewedPaths.has(path)}
        onChange={(event) => {
          const next = new Set(reviewedPaths);
          if (event.target.checked) next.add(path);
          else next.delete(path);
          onReview(next);
        }}
      />
      I checked this item against the source evidence
    </label>
  );
}

function updateShelf(
  value: ShelfExtraction,
  index: number,
  patch: Partial<ShelfExtraction["observedProducts"][number]>,
): ShelfExtraction {
  return {
    ...value,
    observedProducts: value.observedProducts.map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...patch } : item,
    ),
  };
}

function updateOffer(
  value: SupplierCatalogueExtraction,
  index: number,
  patch: Partial<SupplierCatalogueExtraction["offers"][number]>,
): SupplierCatalogueExtraction {
  return {
    ...value,
    offers: value.offers.map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...patch } : item,
    ),
  };
}

function updateSalesLine(
  value: SalesHistory,
  index: number,
  patch: Partial<SalesHistory["lines"][number]>,
): SalesHistory {
  return {
    ...value,
    lines: value.lines.map((item, itemIndex) =>
      itemIndex === index ? { ...item, ...patch } : item,
    ),
  };
}

function valuesEqualAtPath(original: unknown, accepted: unknown, path: string): boolean {
  return JSON.stringify(readPath(original, path)) === JSON.stringify(readPath(accepted, path));
}

function readPath(value: unknown, path: string): unknown {
  return path
    .split("/")
    .filter(Boolean)
    .reduce<unknown>((current, segment) => {
      if (Array.isArray(current)) return current[Number(segment)];
      if (current && typeof current === "object")
        return (current as Record<string, unknown>)[segment];
      return undefined;
    }, value);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function centsAsInput(value: number | null): string {
  return value === null ? "" : (value / 100).toFixed(2);
}

function randInputToCents(value: string): number | null {
  if (value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function rememberAcceptedSnapshot(snapshot: AcceptedEvidenceSnapshot): void {
  try {
    const key = "kasistock.acceptedSnapshots";
    const existing = JSON.parse(
      window.localStorage.getItem(key) ?? "[]",
    ) as AcceptedEvidenceSnapshot[];
    const next = [...existing.filter((item) => item.snapshotId !== snapshot.snapshotId), snapshot];
    window.localStorage.setItem(key, JSON.stringify(next.slice(-12)));
  } catch {
    // Local persistence is a convenience only; server-side authority remains the snapshot hash.
  }
}
