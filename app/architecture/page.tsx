import Link from "next/link";

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
    <main id="main-content" className="documentPage">
      <Link href="/" className="backLink">
        ← Back to demo
      </Link>
      <p className="eyebrow">SYSTEM ARCHITECTURE</p>
      <h1>Trustworthy AI by separation of authority</h1>
      <p className="lead">
        The model interprets unstructured evidence. Deterministic code controls money and
        quantities. A merchant remains the final purchasing authority.
      </p>
      <div className="boundaryGrid">
        {boundaries.map(([title, body]) => (
          <article className="boundaryCard" key={title}>
            <h2>{title}</h2>
            <p>{body}</p>
          </article>
        ))}
      </div>
      <section className="flowSection">
        <h2>Primary decision flow</h2>
        <ol className="flowList">
          <li>Upload shelf, supplier, and sales evidence.</li>
          <li>Extract structured facts through validated AI contracts.</li>
          <li>Review and accept uncertain evidence.</li>
          <li>Run deterministic calculations and budget optimisation.</li>
          <li>Explain recommendations using only calculation outputs.</li>
          <li>Require explicit merchant approval before purchase-order creation.</li>
        </ol>
      </section>
    </main>
  );
}
