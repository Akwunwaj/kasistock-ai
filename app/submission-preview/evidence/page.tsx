import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Evidence review preview",
  robots: { index: false, follow: false },
};

const observations = [
  {
    product: "Albany Superior White Bread 700g",
    quantity: "8 visible units",
    confidence: "High confidence",
    evidence: "Eight front-facing loaves are visible across two shelf rows.",
  },
  {
    product: "Coca-Cola Original Taste 2L",
    quantity: "5 visible units",
    confidence: "Needs review",
    evidence: "Five red-label 2L bottles are visible; one label is partially obscured.",
  },
] as const;

export default function EvidencePreviewPage() {
  return (
    <main id="main-content" className="submissionPreviewPage">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="KasiStock AI home">
          <span className="brandMark">K</span>
          <span>
            <strong>KasiStock AI</strong>
            <small>Human evidence review</small>
          </span>
        </Link>
        <span className="statusPill">
          <span className="statusDot" /> Prepared judging evidence
        </span>
      </header>

      <section className="previewHeader">
        <div>
          <p className="eyebrow">AI PROPOSES → HUMAN ACCEPTS</p>
          <h1>Every uncertain observation is visible.</h1>
          <p>
            GPT-5.6 converts the shelf image into a strict evidence contract. The merchant confirms
            uncertainty before the record can enter the calculation engine.
          </p>
        </div>
        <div className="previewMetric">
          <span>Review state</span>
          <strong>1 item needs review</strong>
          <small>Original evidence remains immutable</small>
        </div>
      </section>

      <section className="previewEvidenceLayout" aria-label="Prepared shelf evidence review">
        <article className="previewSourceCard">
          <div className="previewShelfImage" role="img" aria-label="Illustrated spaza shop shelf">
            <div className="shelfRow shelfBread">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="shelfRow shelfDrinks">
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="shelfRow shelfMilk">
              <span />
              <span />
              <span />
            </div>
          </div>
          <div>
            <p className="eyebrow">SOURCE EVIDENCE</p>
            <h2>Morning shelf photograph</h2>
            <p>SHA-256 fingerprint recorded · original file retained</p>
          </div>
        </article>

        <div className="previewObservationList">
          {observations.map((observation) => (
            <article className="previewObservation" key={observation.product}>
              <div className="previewObservationTopline">
                <span
                  className={
                    observation.confidence === "High confidence"
                      ? "confidenceHigh"
                      : "confidenceReview"
                  }
                >
                  {observation.confidence}
                </span>
                <span>Structured output</span>
              </div>
              <h2>{observation.product}</h2>
              <strong>{observation.quantity}</strong>
              <p>{observation.evidence}</p>
              <label className="previewCheck">
                <input type="checkbox" checked readOnly />
                <span>I checked this item against the source evidence</span>
              </label>
            </article>
          ))}
        </div>
      </section>

      <footer className="previewFooter">
        <span>Accepted snapshot creates a deterministic evidence hash.</span>
        <Link className="button primary" href="/decision">
          Continue to product matching
        </Link>
      </footer>
    </main>
  );
}
