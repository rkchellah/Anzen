import { auth0 } from "@/lib/auth0";
import { getTokenForProvider } from "@/lib/auth0";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth0.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, { success: boolean; error?: string }> = {
    github: { success: false },
    "google-oauth2": { success: false },
    "slack-oauth2": { success: false },
  };

  try {
    await getTokenForProvider("github");
    results.github.success = true;
  } catch (error) {
    results.github.error = String(error);
  }

  try {
    await getTokenForProvider("google-oauth2");
    results["google-oauth2"].success = true;
  } catch (error) {
    results["google-oauth2"].error = String(error);
  }

  try {
    await getTokenForProvider("slack-oauth2");
    results["slack-oauth2"].success = true;
  } catch (error) {
    results["slack-oauth2"].error = String(error);
  }

  return NextResponse.json({ results });
}
