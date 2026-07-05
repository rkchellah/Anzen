import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { listAuditEntries } from "@/lib/audit-log";

export async function GET() {
  const session = await auth0.getSession();
  if (!session?.user.sub) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const entries = await listAuditEntries(session.user.sub);
  return NextResponse.json({ entries });
}
