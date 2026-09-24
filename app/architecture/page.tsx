import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "How decisions work",
  description:
    "How KasiStock separates AI interpretation, deterministic calculation and retailer authority.",
};

const boundaries = [
  [
    "AI responsibilities",
    "Extract messy evidence, propose product matches, and explain deterministic results.",
  ],
  [
    "Deterministic responsibilities",
    "Currency arithmetic, stock coverage, demand constraints, optimisation, and approval state.",
  ],
  [
    "Human responsibilities",
    "Resolve uncertain evidence, approve product matches, and authorise purchase orders.",
  ],
];

export default function ArchitecturePage() {
  return (
    <AppShell current="architecture">
      <article className="referencePage">
        <header className="referenceHero">
          <div>
            <p className="pageKicker">How decisions work</p>
            <h1>Clear authority at every step</h1>
            <p>
              KasiStock deliberately separates reading evidence, calculating a plan and authorising
              a purchase. This keeps AI useful without letting it control money or final quantities.
            </p>
          </div>
          <div className="referenceSignal">
            <span>3</span>
            <div>
              <strong>authority layers</strong>
              <small>Interpret · Calculate · Approve</small>
            </div>
          </div>
        </header>

        <section className="authorityGrid" aria-label="Authority boundaries">
          {boundaries.map(([title, body], index) => (
            <article key={title}>
              <span>0{index + 1}</span>
              <h2>{title}</h2>
              <p>{body}</p>
              <strong>{index === 0 ? "Proposes" : index === 1 ? "Enforces" : "Authorises"}</strong>
            </article>
          ))}
        </section>

        <section className="decisionFlowSection">
          <header>
            <p className="pageKicker">End-to-end control</p>
            <h2>From source evidence to an approved order</h2>
          </header>
          <ol className="decisionFlowList">
            <li>
              <span>1</span>
              <div>
                <strong>Evidence is uploaded</strong>
                <p>
                  Shelf images, supplier lists and sales history remain tied to their original
                  source.
                </p>
              </div>
              <small>Retailer</small>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>Structured facts are proposed</strong>
                <p>AI extracts product details and uncertainty through validated contracts.</p>
              </div>
              <small>AI</small>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>Uncertainty is resolved</strong>
                <p>A person accepts, corrects, rejects or leaves unsupported values unknown.</p>
              </div>
              <small>Retailer</small>
            </li>
            <li>
              <span>4</span>
              <div>
                <strong>The plan is calculated</strong>
                <p>
                  Deterministic code calculates demand, pack constraints, supplier costs and budget
                  allocation.
                </p>
              </div>
              <small>System</small>
            </li>
            <li>
              <span>5</span>
              <div>
                <strong>The draft is locked</strong>
                <p>
                  The server rebuilds the order from accepted evidence and signs the exact result.
                </p>
              </div>
              <small>System</small>
            </li>
            <li>
              <span>6</span>
              <div>
                <strong>The purchase is approved</strong>
                <p>
                  An authorised person reviews the total and explicitly approves supplier orders.
                </p>
              </div>
              <small>Retailer</small>
            </li>
          </ol>
        </section>

        <section className="integritySection">
          <div>
            <p className="pageKicker">Why it matters</p>
            <h2>The browser cannot invent an approved order</h2>
          </div>
          <p>
            Edited quantities are treated as requests. Before approval, the server checks accepted
            evidence, confirmed mappings, demand ceilings, pack sizes, budget and signatures again.
            Any material change requires a new draft.
          </p>
        </section>
      </article>
    </AppShell>
  );
}
