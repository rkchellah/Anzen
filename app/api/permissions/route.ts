import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import {
  badRequest,
  readJsonObject,
  serverError,
  unauthorized,
} from "@/lib/api-response";
import { isConnectionKey, isProviderAccessMode } from "@/lib/permissions";
import {
  getUserPermissions,
  setProviderAccessMode,
} from "@/lib/permissions-store";

export async function GET() {
  const session = await auth0.getSession();
  if (!session?.user.sub) return unauthorized();

  try {
    const permissions = await getUserPermissions(session.user.sub);
    return NextResponse.json({ permissions });
  } catch (error) {
    return serverError(
      "permissions",
      error,
      "Couldn't load your access settings. Try again."
    );
  }
}

export async function PATCH(req: Request) {
  const session = await auth0.getSession();
  if (!session?.user.sub) return unauthorized();

  const body = await readJsonObject(req);
  if (!body) return badRequest("Request body must be a JSON object.");

  const { provider, mode } = body;
  if (typeof provider !== "string" || typeof mode !== "string") {
    return badRequest("`provider` and `mode` are required strings.");
  }

  if (!isConnectionKey(provider)) {
    return badRequest(`Unknown provider: ${provider}`);
  }

  if (!isProviderAccessMode(mode)) {
    return badRequest("`mode` must be either 'read' or 'read_write'.");
  }

  try {
    const permissions = await setProviderAccessMode(
      session.user.sub,
      provider,
      mode
    );
    return NextResponse.json({ permissions });
  } catch (error) {
    return serverError(
      "permissions",
      error,
      "Couldn't save that access setting. Try again."
    );
  }
}
