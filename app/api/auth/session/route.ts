import { auth0 } from "@/lib/auth0";
import { NextResponse } from "next/server";

/** Lightweight auth probe for marketing/legal pages (no token exchange). */
export async function GET() {
  const session = await auth0.getSession();

  if (!session?.user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      name: session.user.name ?? null,
      email: session.user.email ?? null,
    },
  });
}
