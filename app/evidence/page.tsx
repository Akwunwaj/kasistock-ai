import Link from "next/link";
import { EvidenceWorkbench } from "@/components/evidence-workbench";

export default function EvidencePage() {
  return (
    <main id="main-content">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="KasiStock AI home">
          <span className="brandMark">K</span>
          <span>
            <strong>KasiStock AI</strong>
            <small>Evidence verification workspace</small>
          </span>
        </Link>
        <div className="topbarActions">
          <span className="statusPill">
            <span className="statusDot" /> Human-in-the-loop gate
          </span>
          <Link className="button secondary" href="/">
            Demo dashboard
          </Link>
        </div>
      </header>
      <section className="evidenceHero">
        <div>
          <p className="eyebrow">MULTIMODAL EVIDENCE PIPELINE</p>
          <h1>Extract with AI. Decide with evidence.</h1>
          <p className="heroCopy">
            GPT‑5.6 interprets shelf images and supplier documents. The merchant must verify
            uncertainty before any value can enter the deterministic restocking engine.
          </p>
        </div>
        <div className="trustBoundary">
          <span>Authority boundary</span>
          <strong>AI proposes → Human accepts</strong>
          <small>No model output can approve a purchase.</small>
        </div>
      </section>
      <EvidenceWorkbench />
    </main>
  );
}
