import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function isValidBaseUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    return new URL(value).protocol === "https:" || process.env.NODE_ENV !== "production";
  } catch {
    return false;
  }
}

export function GET() {
  const signingSecret = process.env.EVIDENCE_SIGNING_SECRET?.trim();
  const checks = {
    openaiApiKey: Boolean(process.env.OPENAI_API_KEY?.trim()),
    openaiModel: Boolean(process.env.OPENAI_MODEL?.trim()),
    evidenceSigningSecret: Boolean(signingSecret && signingSecret.length >= 32),
    applicationBaseUrl: isValidBaseUrl(process.env.APP_BASE_URL?.trim()),
  };
  const ready = Object.values(checks).every(Boolean);

  return NextResponse.json(
    {
      service: "kasistock-ai",
      status: ready ? "ready" : "not_ready",
      checks,
      timestamp: new Date().toISOString(),
    },
    { status: ready ? 200 : 503 },
  );
}
