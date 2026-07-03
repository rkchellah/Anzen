import { getAuth0SetupReport } from "@/lib/auth0-setup-check";
import { NextResponse } from "next/server";

export async function GET() {
  const report = getAuth0SetupReport();

  return NextResponse.json(report, {
    status: report.configured ? 200 : 503,
  });
}
