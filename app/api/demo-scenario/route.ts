import { NextResponse } from "next/server";
import { demoScenario } from "@/fixtures/demo-scenario";

export function GET() {
  return NextResponse.json(demoScenario);
}
