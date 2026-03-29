import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <DashboardClient
      userName={session.user.name ?? ""}
      userEmail={session.user.email ?? ""}
    />
  );
}
