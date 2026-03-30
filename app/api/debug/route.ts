import { auth0 } from "@/lib/auth0";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth0.getSession();

  if (!session) {
    return NextResponse.json({ error: "No session" }, { status: 401 });
  }

  const results: Record<string, unknown> = {};

  for (const provider of ["github", "google-oauth2"] as const) {
    try {
      const { token } = await auth0.getAccessToken({
        authorizationParams: {
          connection: provider,
        },
      });
      results[provider] = {
        success: true,
        hasToken: !!token,
        preview: token ? token.substring(0, 20) + "..." : null,
      };
    } catch (error) {
      results[provider] = { success: false, error: String(error) };
    }
  }

  return NextResponse.json({
    userId: session.user.sub,
    results,
  });
}
