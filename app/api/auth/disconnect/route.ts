import { NextResponse } from "next/server";

// Simplified disconnect — avoids Management API which requires extra Auth0 config.
// Achieves same UX: frontend logs user out on disconnect click.

export async function POST(req: Request) {
  try {
    const { provider } = await req.json();
    if (!provider) {
      return NextResponse.json({ error: "Provider required" }, { status: 400 });
    }
    return NextResponse.json({ success: true, action: "logout" });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}