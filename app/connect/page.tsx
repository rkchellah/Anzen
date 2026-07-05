import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { ConnectPageClient } from "./ConnectPageClient";

export default async function ConnectPage() {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  return <ConnectPageClient />;
}
