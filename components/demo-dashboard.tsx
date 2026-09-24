"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useBudget } from "@/components/budget-context";
import { demoScenario } from "@/fixtures/demo-scenario";
import { cents, formatZar } from "@/modules/shared/domain/money";

export function DemoDashboard() {
  const { budgetRand, setBudgetRand } = useBudget();
  const { summary, evidence, recommendations, audit } = demoScenario;
  const budgetCents = Math.round(budgetRand * 100);
  const remainingCents = budgetCents - summary.orderTotalCents;
  const isOverBudget = remainingCents < 0;
  const budgetUtilisationPercent = useMemo(
    () =>
      Math.min(100, Math.round((summary.orderTotalCents / Math.max(1, budgetCents)) * 10000) / 100),
    [budgetCents, summary.orderTotalCents],
  );
  const budgetChanged = budgetCents !== summary.budgetCents;

  return (
    <section className="merchantWorkspace" aria-label="KasiStock demonstration workspace">
      <header className="overviewHeader">
        <div>
          <p className="pageKicker">Thursday, 24 September</p>
          <h1>Today&apos;s restock</h1>
          <p>One check is waiting before the supplier order can be approved.</p>
        </div>
        <Link className="button primary" href="/evidence">
          Review the outstanding check
        </Link>
      </header>

      <div className="attentionStrip" role="status">
        <span className="attentionMark">1</span>
        <div>
          <strong>Albany bread quantity needs your confirmation</strong>
          <p>The shelf photo was readable, but the estimated quantity has medium confidence.</p>
        </div>
        <Link href="/evidence">
          Check quantity <span aria-hidden="true">→</span>
        </Link>
      </div>

      <div className="overviewGrid">
        <section className="workSection proposedOrder">
          <div className="sectionHeading">
            <div>
              <p className="step">Proposed order</p>
              <h2>What to buy</h2>
            </div>
            <span className="plainStatus">4 products · 2 suppliers</span>
          </div>
          <div className="orderTable" role="table" aria-label="Proposed purchase order">
            <div className="orderTableHeader" role="row">
              <span role="columnheader">Product</span>
              <span role="columnheader">Supplier</span>
              <span role="columnheader">Order</span>
              <span role="columnheader">Cover</span>
              <span role="columnheader">Cost</span>
            </div>
            {recommendations.map((line) => (
              <article className="orderTableRow" role="row" key={line.productId}>
                <div role="cell">
                  <span className="productThumb" aria-hidden="true">
                    {line.rank}
                  </span>
                  <div>
                    <strong>{line.productName}</strong>
                    <small>{line.explanation}</small>
                  </div>
                </div>
                <span role="cell">{line.supplierName}</span>
                <strong role="cell">{line.quantity} units</strong>
                <span role="cell">{line.daysOfCover.toFixed(1)} days</span>
                <strong role="cell">{formatZar(line.lineCostCents)}</strong>
              </article>
            ))}
          </div>
          <div className="orderTableFooter">
            <span>Based on accepted shelf, sales and supplier evidence</span>
            <Link href="/decision" className="button primary">
              Review and adjust order
            </Link>
          </div>
        </section>

        <aside className="budgetRail" aria-label="Budget summary">
          <div className="budgetRailHeader">
            <label htmlFor="available-cash">Available cash</label>
            <div className="budgetInputWrap">
              <span>R</span>
              <input
                id="available-cash"
                type="number"
                min="100"
                step="100"
                inputMode="decimal"
                value={budgetRand}
                onChange={(event) => setBudgetRand(Number(event.target.value))}
                aria-describedby="available-cash-help"
              />
            </div>
            <small id="available-cash-help">Edit the cash available for this restock</small>
          </div>
          <div
            className={`budgetMeter ${isOverBudget ? "overBudget" : ""}`}
            aria-label={`${budgetUtilisationPercent}% of budget allocated`}
          >
            <span style={{ width: `${budgetUtilisationPercent}%` }} />
          </div>
          <dl className="budgetBreakdown">
            <div>
              <dt>Proposed spend</dt>
              <dd>{formatZar(summary.orderTotalCents)}</dd>
            </div>
            <div className={isOverBudget ? "budgetShortfall" : "remaining"}>
              <dt>{isOverBudget ? "Over budget" : "Cash left"}</dt>
              <dd>{formatZar(cents(Math.abs(remainingCents)))}</dd>
            </div>
            <div>
              <dt>Expected gross profit</dt>
              <dd>{formatZar(summary.expectedGrossProfitCents)}</dd>
            </div>
            <div>
              <dt>Supplier saving</dt>
              <dd>{formatZar(summary.supplierSavingsCents)}</dd>
            </div>
          </dl>
          <div className="budgetRules">
            <strong>Plan checks</strong>
            <span className={isOverBudget ? "ruleFailed" : undefined}>
              <i>{isOverBudget ? "!" : "✓"}</i>{" "}
              {isOverBudget ? "Current proposal exceeds the budget" : "Budget ceiling respected"}
            </span>
            <span>
              <i>✓</i> Pack sizes respected
            </span>
            <span>
              <i>✓</i> {summary.stockOutsAvoided} stock-outs avoided
            </span>
            {budgetChanged ? (
              <Link href="/decision" className="recalculateLink">
                Rebuild the plan with this budget →
              </Link>
            ) : null}
          </div>
        </aside>

        <section className="workSection evidenceSummary">
          <div className="panelHeader">
            <div>
              <p className="step">Evidence</p>
              <h2>Information used</h2>
            </div>
            <Link className="sectionLink" href="/evidence">
              Open evidence desk →
            </Link>
          </div>
          <div className="evidenceList">
            {evidence.map((item) => (
              <article className="evidenceItem" key={item.name}>
                <div className="fileIcon">{item.type}</div>
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.detail}</span>
                </div>
                <span className={item.needsReview ? "reviewBadge" : "readyBadge"}>
                  {item.needsReview ? "Check" : "Accepted"}
                </span>
              </article>
            ))}
          </div>
        </section>

        <section className="workSection activitySummary">
          <div className="panelHeader compact">
            <div>
              <p className="step">Activity</p>
              <h2>How this plan was made</h2>
            </div>
          </div>
          <div className="humanTimeline">
            {audit.map((entry, index) => (
              <article key={`${entry.time}-${entry.event}`}>
                <div className="timelineRail">
                  <span>{index + 1}</span>
                  {index < audit.length - 1 ? <i /> : null}
                </div>
                <div>
                  <strong>{entry.event}</strong>
                  <time>{entry.time}</time>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
