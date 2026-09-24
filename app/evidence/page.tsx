import { AppShell } from "@/components/app-shell";
import { EvidenceWorkbench } from "@/components/evidence-workbench";

export default function EvidencePage() {
  return (
    <AppShell current="evidence">
      <section className="workPageHeader">
        <div>
          <p className="pageKicker">Evidence desk</p>
          <h1>Check what the shop data says</h1>
          <p>
            Upload shelf photos or supplier lists, then confirm anything uncertain before it affects
            the restock plan.
          </p>
        </div>
        <div className="authorityNote">
          <span className="authorityIcon" aria-hidden="true">
            ✓
          </span>
          <div>
            <strong>You stay in control</strong>
            <small>AI reads the evidence. Only your accepted values can be used.</small>
          </div>
        </div>
      </section>
      <EvidenceWorkbench />
    </AppShell>
  );
}
