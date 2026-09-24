import { AppShell } from "@/components/app-shell";
import { DecisionWorkbench } from "@/components/decision-workbench";

export default function DecisionPage() {
  return (
    <AppShell current="decision">
      <section className="workPageHeader">
        <div>
          <p className="pageKicker">Restock plan</p>
          <h1>Build the order you can afford</h1>
          <p>
            Resolve product matches, review the calculation and adjust supplier quantities before
            you approve anything.
          </p>
        </div>
        <div className="authorityNote">
          <span className="authorityIcon" aria-hidden="true">
            R
          </span>
          <div>
            <strong>Budget is enforced</strong>
            <small>Accepted evidence goes in. A repeatable calculation comes out.</small>
          </div>
        </div>
      </section>
      <DecisionWorkbench />
    </AppShell>
  );
}
