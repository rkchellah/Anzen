import { NextResponse, type NextRequest } from "next/server";
import { auth0 } from "@/lib/auth0";

export async function POST(req: NextRequest) {
  try {
    const { provider } = await req.json();
    if (!provider) {
      return NextResponse.json({ error: "Provider required" }, { status: 400 });
    }

    // Get the current session using the proper NextRequest type
    const session = await auth0.getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get Management API token for Auth0
    const managementTokenRes = await fetch(
      `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: process.env.AUTH0_CLIENT_ID,
          client_secret: process.env.AUTH0_CLIENT_SECRET,
          audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
          grant_type: "client_credentials",
        }),
      }
    );

    const tokenData = await managementTokenRes.json();
    const { access_token } = tokenData;

    if (!access_token) {
      throw new Error("Failed to get Management API token");
    }

    // Delete the connected account
    const deleteRes = await fetch(
      `https://${process.env.AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(session.user.sub)}/identities/${provider}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!deleteRes.ok) {
      const error = await deleteRes.text();
      console.error("Failed to disconnect provider:", error);
      return NextResponse.json(
        { error: "Failed to disconnect provider" },
        { status: deleteRes.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Disconnect error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}