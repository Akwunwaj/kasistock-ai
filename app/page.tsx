import Link from "next/link";
import { DemoDashboard } from "@/components/demo-dashboard";

export default function HomePage() {
  return (
    <main id="main-content">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="KasiStock AI home">
          <span className="brandMark">K</span>
          <span>
            <strong>KasiStock AI</strong>
            <small>Explainable restocking intelligence</small>
          </span>
        </Link>
        <div className="topbarActions">
          <span className="statusPill">
            <span className="statusDot" /> Demo data ready
          </span>
          <Link className="button secondary" href="/evidence">
            Live evidence
          </Link>
          <Link className="button secondary" href="/decision">
            Decision engine
          </Link>
          <Link className="button secondary" href="/judge">
            Judge guide
          </Link>
          <Link className="button secondary" href="/architecture">
            Architecture
          </Link>
        </div>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">BUILD WEEK PROTOTYPE</p>
          <h1>Turn limited cash into the right stock.</h1>
          <p className="heroCopy">
            KasiStock AI converts shelf evidence, supplier prices, and recent sales into an
            explainable, budget-constrained purchase plan for small retailers.
          </p>
        </div>
        <div className="heroMetric">
          <span>Budget</span>
          <strong>R1,500</strong>
          <small>98.8% allocated</small>
        </div>
      </section>

      <DemoDashboard />
    </main>
  );
}
