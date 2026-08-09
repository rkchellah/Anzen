import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { serverError, unauthorized } from "@/lib/api-response";
import { listAuditEntries } from "@/lib/audit-log";

export async function GET() {
  const session = await auth0.getSession();
  if (!session?.user.sub) return unauthorized();

  try {
    const entries = await listAuditEntries(session.user.sub);
    return NextResponse.json({ entries });
  } catch (error) {
    return serverError(
      "audit",
      error,
      "Couldn't load your activity history. Try again."
    );
  }
}
