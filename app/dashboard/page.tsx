import { auth0 } from "@/lib/auth0";
import { isTokenVaultScopesEnabled } from "@/lib/auth0-scopes";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <DashboardClient
      userName={session.user.name ?? "User"}
      userEmail={session.user.email ?? ""}
      tokenVaultScopesEnabled={isTokenVaultScopesEnabled()}
    />
  );
}
