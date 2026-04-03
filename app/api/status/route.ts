import { auth0, exchangeTokenForProvider } from "@/lib/auth0";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth0.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tokenResult = await auth0.getAccessToken();
  const auth0Token = tokenResult?.token;

  if (!auth0Token) {
    return NextResponse.json({ error: "Could not get access token" }, { status: 401 });
  }

  const results: Record<string, { success: boolean; error?: string }> = {
    github: { success: false },
    "google-oauth2": { success: false },
    "slack-oauth2": { success: false },
  };

  try {
    await exchangeTokenForProvider(auth0Token, "github");
    results.github.success = true;
  } catch (error) {
    results.github.error = String(error);
  }

  try {
    await exchangeTokenForProvider(auth0Token, "google-oauth2");
    results["google-oauth2"].success = true;
  } catch (error) {
    results["google-oauth2"].error = String(error);
  }

  try {
    await exchangeTokenForProvider(auth0Token, "slack-oauth2");
    results["slack-oauth2"].success = true;
  } catch (error) {
    results["slack-oauth2"].error = String(error);
  }

  return NextResponse.json({ results });
}
