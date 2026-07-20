import Link from "next/link";
import { DecisionWorkbench } from "@/components/decision-workbench";

export default function DecisionPage() {
  return (
    <main id="main-content">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="KasiStock AI home">
          <span className="brandMark">K</span>
          <span>
            <strong>KasiStock AI</strong>
            <small>Product reconciliation and restocking</small>
          </span>
        </Link>
        <div className="topbarActions">
          <span className="statusPill">
            <span className="statusDot" /> Evidence-bound calculations
          </span>
          <Link className="button secondary" href="/evidence">
            Evidence workspace
          </Link>
          <Link className="button secondary" href="/">
            Demo dashboard
          </Link>
        </div>
      </header>
      <section className="evidenceHero decisionHero">
        <div>
          <p className="eyebrow">IDENTITY AND DECISION ENGINE</p>
          <h1>Match products. Prove every calculation.</h1>
          <p className="heroCopy">
            Exact matches follow governed catalogue rules. Fuzzy and GPT‑5.6 suggestions require
            explicit human confirmation before sales velocity, days of cover, supplier costs, or
            optimiser inputs are calculated.
          </p>
        </div>
        <div className="trustBoundary">
          <span>Calculation boundary</span>
          <strong>Accepted evidence → deterministic result</strong>
          <small>No raw model output enters the optimiser.</small>
        </div>
      </section>
      <DecisionWorkbench />
    </main>
  );
}
