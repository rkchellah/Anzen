import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { apiError, badRequest, readJsonObject, unauthorized } from "@/lib/api-response";
import { disconnectProvider, isDisconnectProvider } from "@/lib/my-account-api";

export async function POST(req: Request) {
  // Authenticate before touching the request body.
  const session = await auth0.getSession();
  if (!session) return unauthorized();

  const body = await readJsonObject(req);
  if (!body) return badRequest("Request body must be a JSON object.");

  const { provider } = body;
  if (typeof provider !== "string" || !provider) {
    return badRequest("`provider` is required.");
  }
  if (!isDisconnectProvider(provider)) {
    return badRequest(`Unknown provider: ${provider}`);
  }

  try {
    await disconnectProvider(provider);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[disconnect] Failed:", error);
    const message = error instanceof Error ? error.message : "";

    if (message.includes("No Token Vault linked account")) {
      return apiError(
        "That account isn't linked anymore. Refresh the page to see current connections.",
        404
      );
    }

    if (
      message.includes("403") ||
      message.includes("401") ||
      message.includes("insufficient_scope") ||
      message.includes("AccessTokenError")
    ) {
      return apiError(
        "Missing My Account permissions. Sign out and sign in again after enabling Token Vault scopes.",
        403
      );
    }

    if (message.includes("Token Vault scopes are disabled")) {
      return apiError(message, 503);
    }

    return apiError("Couldn't disconnect that account. Try again.", 502);
  }
}
