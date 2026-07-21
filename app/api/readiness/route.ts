import { NextResponse } from "next/server";
import { getWorkflowPersistence } from "@/lib/persistence/server-workflow-persistence";

export const dynamic = "force-dynamic";

function isValidBaseUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    return new URL(value).protocol === "https:" || process.env.NODE_ENV !== "production";
  } catch {
    return false;
  }
}

export async function GET() {
  const signingSecret = process.env.EVIDENCE_SIGNING_SECRET?.trim();
  const persistence = getWorkflowPersistence();
  let databaseReachable: boolean | null = null;
  if (persistence.mode === "postgresql") {
    try {
      databaseReachable = await persistence.ping();
    } catch {
      databaseReachable = false;
    }
  }
  const checks = {
    openaiApiKey: Boolean(process.env.OPENAI_API_KEY?.trim()),
    openaiModel: Boolean(process.env.OPENAI_MODEL?.trim()),
    evidenceSigningSecret: Boolean(signingSecret && signingSecret.length >= 32),
    applicationBaseUrl: isValidBaseUrl(process.env.APP_BASE_URL?.trim()),
  };
  const ready = Object.values(checks).every(Boolean) && databaseReachable !== false;

  return NextResponse.json(
    {
      service: "kasistock-ai",
      status: ready ? "ready" : "not_ready",
      checks,
      persistence: {
        mode: persistence.mode,
        configured: persistence.mode === "postgresql",
        reachable: databaseReachable,
      },
      timestamp: new Date().toISOString(),
    },
    { status: ready ? 200 : 503 },
  );
}
