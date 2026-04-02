import { auth0 } from "@/lib/auth0";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const returnTo = searchParams.get("returnTo") || "/";

  return await auth0.handleLogout(req, {
    returnTo,
  });
}
