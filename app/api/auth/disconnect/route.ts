import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import {
  disconnectProvider,
  isDisconnectProvider,
} from "@/lib/my-account-api";

export async function POST(req: Request) {
  try {
    const { provider } = (await req.json()) as { provider?: string };

    if (!provider) {
      return NextResponse.json({ error: "Provider required" }, { status: 400 });
    }

    if (!isDisconnectProvider(provider)) {
      return NextResponse.json(
        { error: `Unknown provider: ${provider}` },
        { status: 400 }
      );
    }

    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await disconnectProvider(provider);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to disconnect provider";
    console.error("Disconnect error:", error);

    const needsReauth =
      message.includes("403") ||
      message.includes("401") ||
      message.includes("insufficient_scope") ||
      message.includes("AccessTokenError");

    const status = message.includes("No connected account")
      ? 404
      : needsReauth
        ? 403
        : 500;

    return NextResponse.json(
      {
        error: needsReauth
          ? "Missing My Account permissions. Sign out and sign in again after enabling Token Vault scopes."
          : message,
      },
      { status }
    );
  }
}
