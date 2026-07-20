import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Approved supplier orders preview",
  robots: { index: false, follow: false },
};

const orders = [
  {
    supplier: "Metro Cash & Carry",
    purchaseOrder: "KSI-20260718-METRO-CASH-CARRY-01",
    items: "Bread and full-cream milk",
    total: "R803.10",
  },
  {
    supplier: "Ubuntu Wholesale Foods",
    purchaseOrder: "KSI-20260718-UBUNTU-WHOLESALE-F-02",
    items: "Coca-Cola Original Taste 2L",
    total: "R596.00",
  },
] as const;

export default function ApprovedPreviewPage() {
  return (
    <main id="main-content" className="submissionPreviewPage approvedPreviewPage">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="KasiStock AI home">
          <span className="brandMark">K</span>
          <span>
            <strong>KasiStock AI</strong>
            <small>Approved purchase authority</small>
          </span>
        </Link>
        <span className="statusPill">
          <span className="statusDot" /> Approval hash verified
        </span>
      </header>

      <section className="previewHeader approvedHeader">
        <div>
          <p className="eyebrow">SUPPLIER ORDERS ARE READY</p>
          <h1>The merchant approved R1,399.10.</h1>
          <p>
            Two supplier-specific purchase orders, two WhatsApp-ready messages, and six immutable
            audit events were generated from accepted evidence.
          </p>
        </div>
        <div className="previewBudgetCard">
          <span>Available budget</span>
          <strong>R1,500.00</strong>
          <div>
            <span>Approved</span>
            <b>R1,399.10</b>
          </div>
          <div>
            <span>Remaining</span>
            <b>R100.90</b>
          </div>
        </div>
      </section>

      <section className="approvedOrderGrid" aria-label="Approved supplier purchase orders">
        {orders.map((order) => (
          <article className="approvedOrderCard" key={order.purchaseOrder}>
            <div className="approvedOrderTopline">
              <span>APPROVED</span>
              <strong>{order.total}</strong>
            </div>
            <h2>{order.supplier}</h2>
            <code>{order.purchaseOrder}</code>
            <p>{order.items}</p>
            <div className="approvedActions" aria-label={`${order.supplier} outputs`}>
              <span>PDF purchase order</span>
              <span>WhatsApp-ready message</span>
            </div>
          </article>
        ))}
      </section>

      <section className="auditPreview" aria-labelledby="audit-preview-title">
        <div>
          <p className="eyebrow">IMMUTABLE AUDIT TIMELINE</p>
          <h2 id="audit-preview-title">Six authority events bind the decision.</h2>
        </div>
        <ol>
          <li>Accepted evidence bound</li>
          <li>Product mapping set accepted</li>
          <li>Restock scenario calculated</li>
          <li>Recommendation draft locked</li>
          <li>Purchase order approved</li>
          <li>Supplier orders generated</li>
        </ol>
      </section>
    </main>
  );
}
