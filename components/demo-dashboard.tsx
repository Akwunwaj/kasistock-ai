import Link from "next/link";
import { demoScenario } from "@/fixtures/demo-scenario";
import { formatZar } from "@/modules/shared/domain/money";

export function DemoDashboard() {
  const { summary, evidence, recommendations, audit } = demoScenario;

  return (
    <section className="workspace" aria-label="KasiStock demonstration workspace">
      <aside className="panel evidencePanel">
        <div className="panelHeader">
          <div>
            <p className="step">01 · EVIDENCE</p>
            <h2>Store inputs</h2>
          </div>
          <span className="completion">4/4 ready</span>
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
                {item.needsReview ? "Review" : "Ready"}
              </span>
            </article>
          ))}
        </div>
        <div className="reviewNotice">
          <strong>1 field needs confirmation</strong>
          <p>Shelf quantity for Albany bread was estimated with medium confidence.</p>
          <Link className="textButton" href="/evidence">
            Review extraction →
          </Link>
        </div>
      </aside>

      <section className="panel decisionPanel">
        <div className="panelHeader">
          <div>
            <p className="step">02 · DECISION</p>
            <h2>Budget scenario</h2>
          </div>
          <span className="versionBadge">v1</span>
        </div>
        <div className="budgetCard">
          <span>Available cash</span>
          <strong>{formatZar(summary.budgetCents)}</strong>
          <div className="budgetBar">
            <span style={{ width: `${summary.budgetUtilisationPercent}%` }} />
          </div>
          <small>{formatZar(summary.remainingCents)} remains unallocated</small>
        </div>
        <div className="metricGrid">
          <div>
            <span>Stock-outs avoided</span>
            <strong>{summary.stockOutsAvoided}</strong>
          </div>
          <div>
            <span>Expected gross profit</span>
            <strong>{formatZar(summary.expectedGrossProfitCents)}</strong>
          </div>
          <div>
            <span>Products selected</span>
            <strong>{summary.productsSelected}</strong>
          </div>
          <div>
            <span>Supplier savings</span>
            <strong>{formatZar(summary.supplierSavingsCents)}</strong>
          </div>
        </div>
        <div className="constraintList">
          <div>
            <span>✓</span> Essential products prioritised
          </div>
          <div>
            <span>✓</span> Supplier pack sizes respected
          </div>
          <div>
            <span>✓</span> Budget ceiling enforced in integer cents
          </div>
        </div>
      </section>

      <section className="panel recommendationPanel">
        <div className="panelHeader">
          <div>
            <p className="step">03 · RECOMMENDATION</p>
            <h2>Proposed purchase order</h2>
          </div>
          <span className="confidenceBadge">High confidence</span>
        </div>
        <div className="recommendationList">
          {recommendations.map((line) => (
            <article className="recommendation" key={line.productId}>
              <div className="rank">{line.rank}</div>
              <div className="recommendationBody">
                <div className="recommendationTitle">
                  <strong>{line.productName}</strong>
                  <span>{formatZar(line.lineCostCents)}</span>
                </div>
                <p>{line.explanation}</p>
                <div className="recommendationMeta">
                  <span>{line.quantity} units</span>
                  <span>{line.supplierName}</span>
                  <span>{line.daysOfCover.toFixed(1)} days cover</span>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="approvalBar">
          <div>
            <span>Order total</span>
            <strong>{formatZar(summary.orderTotalCents)}</strong>
          </div>
          <Link href="/decision" className="button primary">
            Open live decision engine
          </Link>
        </div>
      </section>

      <section className="panel auditPanel">
        <div className="panelHeader compact">
          <div>
            <p className="step">AUDIT EVIDENCE</p>
            <h2>Decision timeline</h2>
          </div>
        </div>
        <div className="timeline">
          {audit.map((entry) => (
            <div className="timelineItem" key={`${entry.time}-${entry.event}`}>
              <time>{entry.time}</time>
              <span /> <p>{entry.event}</p>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
