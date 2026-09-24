import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";

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
    <AppShell current="judge">
      <article className="referencePage judgeRefresh">
        <section className="referenceHero">
          <div>
            <p className="pageKicker">Two-minute demonstration</p>
            <h1>See the proof, then the purchase decision</h1>
            <p>
              KasiStock turns shelf evidence, supplier prices and recent sales into an explainable
              order while preserving human authority over every consequential step.
            </p>
          </div>
          <div className="preparedOutcome" aria-label="Prepared demonstration outcome">
            <span>Prepared outcome</span>
            <strong>R1,399.10</strong>
            <small>approved · R100.90 remains</small>
          </div>
        </section>

        <section className="demoPath" aria-labelledby="judge-steps-title">
          <header>
            <p className="pageKicker">Recommended path</p>
            <h2 id="judge-steps-title">Three stops through the real workflow</h2>
          </header>
          <ol>
            <li>
              <span>01</span>
              <div>
                <h3>Review the evidence</h3>
                <p>
                  Load prepared shelf and supplier evidence. Inspect the proposed values and see
                  where human review is required.
                </p>
                <strong>AI proposes · Human verifies</strong>
              </div>
              <Link className="button primary" href="/evidence">
                Open evidence
              </Link>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Build the plan</h3>
                <p>
                  Confirm product identities, calculate demand and optimise a basket without
                  exceeding R1,500.
                </p>
                <strong>Human confirms · Code calculates</strong>
              </div>
              <Link className="button primary" href="/decision">
                Open restock plan
              </Link>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Inspect the approved result</h3>
                <p>
                  See the immutable approval, supplier split, purchase-order output and audit
                  evidence.
                </p>
                <strong>Server locks · Merchant approves</strong>
              </div>
              <Link className="button primary" href="/submission-preview/approved">
                View approved result
              </Link>
            </li>
          </ol>
        </section>

        <section className="judgeSignalsRefresh" aria-labelledby="judging-signals-title">
          <header>
            <p className="pageKicker">What to look for</p>
            <h2 id="judging-signals-title">A useful idea with enforceable boundaries</h2>
          </header>
          <div>
            {judgingSignals.map(([title, description]) => (
              <article key={title}>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>
      </article>
    </AppShell>
  );
}
