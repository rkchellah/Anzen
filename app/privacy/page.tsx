import { auth0 } from "@/lib/auth0";
import { LegalPageShell } from "@/components/LegalPageShell";
import { PRIVACY_SECTIONS } from "@/lib/privacy-content";
import type { InitialAuthState } from "@/components/SiteHeader";

export default async function PrivacyPage() {
  const session = await auth0.getSession();
  const initialAuth: InitialAuthState = session?.user
    ? { status: "authenticated", name: session.user.name ?? null }
    : { status: "guest" };

  return (
    <LegalPageShell
      kind="Privacy"
      title="Privacy Policy"
      subtitle="Last updated July 2026. Placeholder structure — final legal text will be provided by the project owner."
      sections={PRIVACY_SECTIONS}
      relatedLink={{ href: "/terms", label: "Terms of Service" }}
      initialAuth={initialAuth}
    />
  );
}
