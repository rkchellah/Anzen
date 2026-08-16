import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import {
  badRequest,
  readJsonObject,
  serverError,
  unauthorized,
} from "@/lib/api-response";
import { isProfileComplete, normalizeProfile } from "@/lib/profile";
import { getUserProfile, setUserProfile } from "@/lib/profile-store";

export async function GET() {
  const session = await auth0.getSession();
  if (!session?.user.sub) return unauthorized();

  try {
    const profile = await getUserProfile(session.user.sub);
    return NextResponse.json({ profile, complete: isProfileComplete(profile) });
  } catch (error) {
    return serverError("profile", error, "Couldn't load your profile.");
  }
}

export async function PUT(req: Request) {
  const session = await auth0.getSession();
  if (!session?.user.sub) return unauthorized();

  const body = await readJsonObject(req);
  if (!body) return badRequest("Request body must be a JSON object.");

  const profile = normalizeProfile(body);
  if (!isProfileComplete(profile)) {
    return badRequest("`preferredName` is required.");
  }

  try {
    const saved = await setUserProfile(session.user.sub, profile);
    return NextResponse.json({ profile: saved, complete: true });
  } catch (error) {
    return serverError("profile", error, "Couldn't save your name. Try again.");
  }
}
