import { AppShell } from "@/components/app-shell";
import { DemoDashboard } from "@/components/demo-dashboard";

export default function HomePage() {
  return (
    <AppShell current="overview">
      <DemoDashboard />
    </AppShell>
  );
}
