import { auth0, exchangeTokenForProvider, type Provider } from "@/lib/auth0";
import { NextResponse } from "next/server";

const PROVIDERS: Provider[] = ["github", "google-oauth2", "sign-in-with-slack"];

export async function GET() {
  const session = await auth0.getSession();

  if (!session) {
    return NextResponse.json({ error: "No session" }, { status: 401 });
  }

  const tokenResult = await auth0.getAccessToken();
  const auth0Token = tokenResult?.token;

  if (!auth0Token) {
    return NextResponse.json({ error: "Could not get access token" }, { status: 401 });
  }

  const results: Record<string, { success: boolean; error?: string }> = {};

  for (const provider of PROVIDERS) {
    try {
      const token = await exchangeTokenForProvider(auth0Token, provider);
      results[provider] = token
        ? { success: true }
        : { success: false, error: "Token Vault returned an empty token" };
    } catch (error) {
      results[provider] = { success: false, error: String(error) };
    }
  }

  return NextResponse.json({
    userId: session.user.sub,
    results,
  });
}
