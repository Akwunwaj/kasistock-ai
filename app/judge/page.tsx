import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Judge guide",
  description: "A two-minute judging path through KasiStock AI.",
};

const judgingSignals = [
  [
    "Technical implementation",
    "Multimodal GPT-5.6 extraction, strict schemas, deterministic optimisation, signed evidence and approval hashes.",
  ],
  [
    "Design and UX",
    "A guided evidence → verification → decision → approval workflow with no sign-up required.",
  ],
  [
    "Potential impact",
    "Helps cash-constrained small retailers allocate working capital and reduce avoidable stock-outs.",
  ],
  [
    "Quality of idea",
    "Combines messy retail evidence with human authority and reproducible financial decisions.",
  ],
] as const;

export default function JudgePage() {
  return (
    <main id="main-content" className="judgePage">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="KasiStock AI home">
          <span className="brandMark">K</span>
          <span>
            <strong>KasiStock AI</strong>
            <small>KasiStock AI judge guide</small>
          </span>
        </Link>
        <div className="topbarActions">
          <Link className="button secondary" href="/evidence">
            Start live demo
          </Link>
          <Link className="button secondary" href="/architecture">
            Architecture
          </Link>
        </div>
      </header>

      <section className="judgeHero">
        <div>
          <p className="eyebrow">TWO-MINUTE JUDGING PATH</p>
          <h1>See the evidence, authority, and business decision.</h1>
          <p className="heroCopy">
            KasiStock AI helps a small retailer turn shelf images, supplier catalogues, and recent
            sales into an explainable purchase order that never exceeds the available cash budget.
          </p>
        </div>
        <div className="judgeOutcome" aria-label="Prepared demonstration outcome">
          <span>Prepared outcome</span>
          <strong>R1,399.10 approved</strong>
          <small>R100.90 remains from a R1,500 budget</small>
        </div>
      </section>

      <section className="judgeSteps" aria-labelledby="judge-steps-title">
        <div className="sectionHeading">
          <p className="eyebrow">RECOMMENDED PATH</p>
          <h2 id="judge-steps-title">Three steps, one authority chain</h2>
        </div>
        <ol className="judgeStepGrid">
          <li>
            <span className="judgeStepNumber">1</span>
            <h3>Review evidence</h3>
            <p>Load prepared shelf and supplier evidence, inspect uncertainty, and accept it.</p>
            <Link className="button primary" href="/evidence">
              Open evidence workspace
            </Link>
          </li>
          <li>
            <span className="judgeStepNumber">2</span>
            <h3>Build the decision</h3>
            <p>Confirm product identities, calculate demand, and optimise the R1,500 basket.</p>
            <Link className="button primary" href="/decision">
              Open decision engine
            </Link>
          </li>
          <li>
            <span className="judgeStepNumber">3</span>
            <h3>Approve supplier orders</h3>
            <p>Lock the draft, approve explicitly, and download signed supplier purchase orders.</p>
            <Link className="button primary" href="/submission-preview/approved">
              Preview approved result
            </Link>
          </li>
        </ol>
      </section>

      <section className="judgeSignals" aria-labelledby="judging-signals-title">
        <div className="sectionHeading">
          <p className="eyebrow">JUDGING SIGNALS</p>
          <h2 id="judging-signals-title">Why the implementation is defensible</h2>
        </div>
        <div className="judgeSignalGrid">
          {judgingSignals.map(([title, description]) => (
            <article key={title}>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
