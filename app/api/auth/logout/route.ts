import { redirect } from "next/navigation";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const returnTo = searchParams.get("returnTo") || "/";

  redirect(`/auth/logout?returnTo=${encodeURIComponent(returnTo)}`);
}
