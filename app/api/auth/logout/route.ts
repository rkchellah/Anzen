import { buildLogoutUrl } from "@/lib/auth-routes";
import { redirect } from "next/navigation";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const returnTo = searchParams.get("returnTo") || "/";

  redirect(buildLogoutUrl(returnTo));
}
