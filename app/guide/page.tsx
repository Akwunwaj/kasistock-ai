import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "Retailer guide",
  description:
    "Step-by-step instructions for using KasiStock AI from evidence capture to supplier order.",
};

const guideSteps = [
  {
    id: "prepare",
    number: "01",
    label: "Prepare",
    detail: "Gather stock, supplier and sales information",
  },
  {
    id: "capture",
    number: "02",
    label: "Capture",
    detail: "Photograph shelves and upload evidence",
  },
  { id: "verify", number: "03", label: "Verify", detail: "Correct uncertain extracted values" },
  {
    id: "match",
    number: "04",
    label: "Match",
    detail: "Confirm that product records belong together",
  },
  { id: "plan", number: "05", label: "Plan", detail: "Set a budget and review the recommendation" },
  {
    id: "approve",
    number: "06",
    label: "Approve",
    detail: "Check and authorise the final supplier order",
  },
  {
    id: "follow-up",
    number: "07",
    label: "Follow up",
    detail: "Send orders and handle supplier changes",
  },
] as const;

const troubleshooting = [
  [
    "A shelf product is not identified",
    "Take a closer photo with better light, photograph the item separately, or enter the details manually.",
  ],
  [
    "The visible quantity is wrong",
    "Correct the quantity during evidence review. Do not accept the estimate unchanged.",
  ],
  [
    "A supplier item is matched incorrectly",
    "Reject or correct the match. Compare the brand, variant, size, barcode and selling unit.",
  ],
  [
    "A product is missing from the plan",
    "Check its stock level, sales history, product match, supplier evidence, pack size and budget priority.",
  ],
  [
    "The supplier changed the price",
    "Update the supplier evidence and calculate a new plan before approval.",
  ],
  [
    "The invoice differs from the order",
    "Compare quantities, substitutions, pack sizes, VAT, delivery charges and promotion conditions before payment.",
  ],
] as const;

export default function GuidePage() {
  return (
    <AppShell current="guide">
      <article className="guidePage">
        <header className="guideHero">
          <div>
            <p className="pageKicker">Retailer guide</p>
            <h1>From shelf count to supplier order</h1>
            <p>
              Follow this guide in order the first time you use KasiStock. It explains what to
              prepare, what to check, and when a purchasing decision becomes final.
            </p>
          </div>
          <div className="guideHeroActions">
            <Link className="button primary" href="/evidence">
              Start with evidence
            </Link>
            <span>About 15–25 minutes for a prepared first order</span>
          </div>
        </header>

        <div className="guidePrinciple">
          <strong>KasiStock supports your decision; it does not replace it.</strong>
          <p>
            AI reads shelf images and supplier documents. Verified calculations protect the budget.
            You confirm uncertain information and approve every purchase.
          </p>
        </div>

        <div className="guideLayout">
          <aside className="guideToc" aria-label="Guide contents">
            <strong>In this guide</strong>
            <nav>
              {guideSteps.map((step) => (
                <a key={step.id} href={`#${step.id}`}>
                  <span>{step.number}</span>
                  <div>
                    <strong>{step.label}</strong>
                    <small>{step.detail}</small>
                  </div>
                </a>
              ))}
              <a href="#troubleshooting">
                <span>08</span>
                <div>
                  <strong>Get help</strong>
                  <small>Resolve common problems</small>
                </div>
              </a>
            </nav>
          </aside>

          <div className="guideContent">
            <section className="guideSection" id="prepare">
              <GuideHeading
                number="01"
                title="Prepare before you begin"
                summary="Reliable recommendations start with complete, current information."
              />
              <div className="guideChecklistGrid">
                <GuideChecklist
                  title="Have these ready"
                  items={[
                    "A clear shelf or stockroom photograph",
                    "Current supplier catalogues or price lists",
                    "Recent sales history in CSV format",
                    "The maximum cash available for this restock",
                    "Local context such as payday, weather, school holidays or community events",
                  ]}
                />
                <div className="guideDetails">
                  <h3>Set a responsible budget</h3>
                  <p>
                    Protect rent, salaries, electricity, transport, debt payments and other
                    obligations first. The amount entered in KasiStock is a strict ceiling, not a
                    spending target.
                  </p>
                  <p>
                    A small unallocated reserve is useful for delivery charges, invoice differences
                    and emergency purchases.
                  </p>
                </div>
              </div>
              <div className="guideFormatTable">
                <div>
                  <strong>Evidence</strong>
                  <strong>Accepted file</strong>
                  <strong>What it provides</strong>
                </div>
                <div>
                  <span>Shelf or stockroom</span>
                  <span>JPEG, PNG, WebP</span>
                  <span>Visible products, pack sizes and estimated quantities</span>
                </div>
                <div>
                  <span>Supplier list</span>
                  <span>PDF, JPEG, PNG, WebP</span>
                  <span>Offers, prices, case quantities and promotions</span>
                </div>
                <div>
                  <span>Sales history</span>
                  <span>CSV</span>
                  <span>Sales velocity, revenue and reporting period</span>
                </div>
              </div>
            </section>

            <section className="guideSection" id="capture">
              <GuideHeading
                number="02"
                title="Capture and upload evidence"
                summary="Clear photographs reduce uncertainty and shorten the review."
              />
              <ol className="guideStepsList">
                <li>
                  <strong>Photograph straight on.</strong>
                  <span>
                    Keep the camera level, include the complete shelf section and avoid glare.
                  </span>
                </li>
                <li>
                  <strong>Make labels readable.</strong>
                  <span>
                    Move close enough to capture brands, variants and pack sizes. Use more than one
                    image for a large area.
                  </span>
                </li>
                <li>
                  <strong>Count hidden stock.</strong>
                  <span>
                    Record closed cartons, back-room stock, damaged items and products hidden behind
                    others separately.
                  </span>
                </li>
                <li>
                  <strong>Upload each evidence type.</strong>
                  <span>
                    Open Evidence, select Shelf image, Supplier list or Sales CSV, choose the file
                    and run extraction.
                  </span>
                </li>
              </ol>
              <div className="guideActionRow">
                <Link className="button primary" href="/evidence">
                  Open Evidence
                </Link>
                <span>
                  Prepared demo data is available if you want to practise without uploading files.
                </span>
              </div>
            </section>

            <section className="guideSection" id="verify">
              <GuideHeading
                number="03"
                title="Verify every extracted value"
                summary="Model output becomes usable evidence only after a person checks it."
              />
              <div className="guideStatusList">
                <div>
                  <span className="guideStatus accepted">High confidence</span>
                  <p>Check the value against the source and accept it only when it is correct.</p>
                </div>
                <div>
                  <span className="guideStatus review">Needs review</span>
                  <p>
                    Inspect the product, pack size, quantity or price and correct the uncertain
                    field.
                  </p>
                </div>
                <div>
                  <span className="guideStatus unknown">Insufficient evidence</span>
                  <p>
                    Upload a clearer source, enter a supported value manually, or mark it unknown.
                  </p>
                </div>
              </div>
              <GuideChecklist
                title="Check before accepting"
                items={[
                  "Product name, brand and variant",
                  "Barcode where available",
                  "Package size and selling unit",
                  "Visible and back-room stock quantity",
                  "Supplier price, case quantity and minimum order",
                  "Promotion dates, VAT and delivery conditions",
                ]}
              />
              <p className="guideSafety">
                <strong>When in doubt, leave it unresolved.</strong> An unknown value is safer than
                using the wrong stock count or supplier price.
              </p>
            </section>

            <section className="guideSection" id="match">
              <GuideHeading
                number="04"
                title="Confirm product matches"
                summary="Shelf, sales and supplier descriptions must refer to the same real product."
              />
              <div className="matchingFlow" aria-label="Product matching order">
                {[
                  "Barcode",
                  "Governed alias",
                  "Exact name",
                  "Suggested candidate",
                  "Human confirmation",
                ].map((item, index) => (
                  <div key={item}>
                    <span>{index + 1}</span>
                    <strong>{item}</strong>
                  </div>
                ))}
              </div>
              <p>
                Compare brand, product type, flavour or variant, package size, unit of measurement,
                selling unit and case quantity. A 2 litre bottle and a six-pack of 2 litre bottles
                are related, but they are not the same purchasing unit.
              </p>
              <p className="guideSafety">
                <strong>No model-created identity is automatic.</strong> Barcode and governed exact
                rules can be accepted safely. Suggested or fuzzy matches require your confirmation.
              </p>
            </section>

            <section className="guideSection" id="plan">
              <GuideHeading
                number="05"
                title="Build and review the restock plan"
                summary="KasiStock calculates from accepted evidence and stays inside the approved cash limit."
              />
              <div className="formulaGrid">
                <div>
                  <span>Days of cover</span>
                  <strong>Current stock ÷ average daily sales</strong>
                  <small>Shows how long existing stock may last.</small>
                </div>
                <div>
                  <span>Reorder need</span>
                  <strong>Target stock − current stock</strong>
                  <small>Adjusted for demand, safety stock and pack sizes.</small>
                </div>
                <div>
                  <span>Effective unit cost</span>
                  <strong>Case price ÷ units per case</strong>
                  <small>Allows fair supplier comparison.</small>
                </div>
              </div>
              <ol className="guideStepsList compact">
                <li>
                  <strong>Open Restock plan.</strong>
                  <span>Load accepted evidence and resolve any remaining product matches.</span>
                </li>
                <li>
                  <strong>Enter the maximum budget.</strong>
                  <span>The optimiser cannot approve a plan above this amount.</span>
                </li>
                <li>
                  <strong>Build the plan.</strong>
                  <span>
                    Review current stock, sales velocity, reorder need, supplier and effective unit
                    cost.
                  </span>
                </li>
                <li>
                  <strong>Apply shop knowledge.</strong>
                  <span>
                    Consider storage space, expiry, incoming deliveries, payday demand, local events
                    and supplier reliability.
                  </span>
                </li>
                <li>
                  <strong>Adjust whole packs.</strong>
                  <span>Reduce or increase within the displayed demand ceiling and budget.</span>
                </li>
              </ol>
              <div className="guideActionRow">
                <Link className="button primary" href="/decision">
                  Open Restock plan
                </Link>
                <span>Leaving some cash unallocated is acceptable.</span>
              </div>
            </section>

            <section className="guideSection" id="approve">
              <GuideHeading
                number="06"
                title="Review and approve the final order"
                summary="Approval is consequential. Complete the final check before creating supplier orders."
              />
              <GuideChecklist
                title="Final approval check"
                items={[
                  "Every product identity is correct",
                  "Stock quantities and supplier prices are current",
                  "Case quantities and minimums are understood",
                  "The total remains within budget",
                  "Fulfilment method, address and requested date are correct",
                  "No unresolved warnings remain",
                  "The approving person is authorised",
                ]}
              />
              <div className="approvalExplanation">
                <span aria-hidden="true">✓</span>
                <div>
                  <strong>What approval records</strong>
                  <p>
                    The accepted evidence, confirmed mappings, calculations, final quantities,
                    budget, supplier allocation, approving person and approval time are bound into
                    an immutable record.
                  </p>
                </div>
              </div>
              <p>
                A locked draft must be unlocked and signed again if quantities change. Never use an
                earlier approval for a modified order.
              </p>
            </section>

            <section className="guideSection" id="follow-up">
              <GuideHeading
                number="07"
                title="Download, send and follow up"
                summary="Each supplier receives only the purchase order intended for them."
              />
              <ol className="guideStepsList">
                <li>
                  <strong>Download every supplier PDF.</strong>
                  <span>
                    Check supplier details, product quantities, prices, totals, date and collection
                    or delivery method.
                  </span>
                </li>
                <li>
                  <strong>Copy the matching message.</strong>
                  <span>
                    Attach the correct PDF and ask the supplier to confirm availability and the
                    final invoice total.
                  </span>
                </li>
                <li>
                  <strong>Wait for confirmation.</strong>
                  <span>An order is not accepted until the supplier confirms it.</span>
                </li>
                <li>
                  <strong>Recalculate material changes.</strong>
                  <span>
                    If price, pack size, availability or substitution changes, update the evidence
                    and create a revised order.
                  </span>
                </li>
                <li>
                  <strong>Keep the records.</strong>
                  <span>
                    Save the approved purchase order, supplier confirmation and final invoice for
                    reconciliation.
                  </span>
                </li>
              </ol>
            </section>

            <section className="guideSection" id="troubleshooting">
              <GuideHeading
                number="08"
                title="Troubleshooting"
                summary="Use the safest recovery action instead of bypassing a warning."
              />
              <div className="troubleshootingList">
                {troubleshooting.map(([problem, response]) => (
                  <details key={problem}>
                    <summary>{problem}</summary>
                    <p>{response}</p>
                  </details>
                ))}
              </div>
            </section>

            <section className="dailyChecklist">
              <div>
                <p className="pageKicker">Use every restock day</p>
                <h2>Four-part daily checklist</h2>
              </div>
              <div className="dailyChecklistGrid">
                <GuideMiniList
                  title="Before analysis"
                  items={[
                    "Photograph shelves",
                    "Count hidden stock",
                    "Get current prices",
                    "Export recent sales",
                    "Confirm available cash",
                  ]}
                />
                <GuideMiniList
                  title="During review"
                  items={[
                    "Check names and sizes",
                    "Check quantities",
                    "Check case prices",
                    "Check VAT and promotions",
                    "Resolve uncertain matches",
                  ]}
                />
                <GuideMiniList
                  title="Before approval"
                  items={[
                    "Confirm quantities",
                    "Check total and reserve",
                    "Confirm fulfilment",
                    "Clear warnings",
                    "Approve only when satisfied",
                  ]}
                />
                <GuideMiniList
                  title="After approval"
                  items={[
                    "Check each PDF",
                    "Send to correct supplier",
                    "Get confirmation",
                    "Save order and invoice",
                  ]}
                />
              </div>
            </section>
          </div>
        </div>
      </article>
    </AppShell>
  );
}

function GuideHeading({
  number,
  title,
  summary,
}: {
  number: string;
  title: string;
  summary: string;
}) {
  return (
    <header className="guideSectionHeading">
      <span>{number}</span>
      <div>
        <h2>{title}</h2>
        <p>{summary}</p>
      </div>
    </header>
  );
}

function GuideChecklist({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <div className="guideChecklist">
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>
            <span aria-hidden="true">✓</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function GuideMiniList({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <div>
      <strong>{title}</strong>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
