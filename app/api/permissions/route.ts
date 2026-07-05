import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { isConnectionKey, isProviderAccessMode } from "@/lib/permissions";
import {
  getUserPermissions,
  setProviderAccessMode,
} from "@/lib/permissions-store";

export async function GET() {
  const session = await auth0.getSession();
  if (!session?.user.sub) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const permissions = await getUserPermissions(session.user.sub);
  return NextResponse.json({ permissions });
}

export async function PATCH(req: Request) {
  const session = await auth0.getSession();
  if (!session?.user.sub) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: { provider?: string; mode?: string };
  try {
    body = (await req.json()) as { provider?: string; mode?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { provider, mode } = body;
  if (!provider || !mode) {
    return NextResponse.json(
      { error: "provider and mode are required" },
      { status: 400 }
    );
  }

  if (!isConnectionKey(provider)) {
    return NextResponse.json({ error: `Unknown provider: ${provider}` }, { status: 400 });
  }

  if (!isProviderAccessMode(mode)) {
    return NextResponse.json(
      { error: "mode must be read or read_write" },
      { status: 400 }
    );
  }

  try {
    const permissions = await setProviderAccessMode(
      session.user.sub,
      provider,
      mode
    );
    return NextResponse.json({ permissions });
  } catch (error) {
    console.error("[permissions] PATCH failed:", error);
    return NextResponse.json(
      { error: "Could not save permission setting" },
      { status: 500 }
    );
  }
}
