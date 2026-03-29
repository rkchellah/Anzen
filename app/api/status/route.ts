import { auth0 } from "@/lib/auth0";
import { getTokenForProvider } from "@/lib/auth0";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth0.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = {
    github: false,
    gmail: false,
    slack: false,
  };

  try {
    await getTokenForProvider("github");
    status.github = true;
  } catch {}

  try {
    await getTokenForProvider("google-oauth2");
    status.gmail = true;
  } catch {}

  try {
    await getTokenForProvider("slack-oauth2");
    status.slack = true;
  } catch {}

  return NextResponse.json(status);
}
