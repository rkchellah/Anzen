import { auth0 } from "@/lib/auth0";
import { buildConnectUrl, CONNECTIONS } from "@/lib/auth-connections";
import { redirect } from "next/navigation";

const PROVIDER_DESCRIPTIONS: Record<keyof typeof CONNECTIONS, string> = {
  github: "Allow Anzen to read and manage your GitHub issues.",
  gmail: "Allow Anzen to read and send emails on your behalf.",
  slack: "Allow Anzen to read and post messages in your Slack workspace.",
};

export default async function ConnectPage() {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <main>
      <h1>Connect Your Accounts</h1>
      <p>Anzen needs access to your accounts to act on your behalf.</p>
      <p>
        When you connect an account, Anzen never stores your token. Auth0 Token
        Vault holds it securely and provides it to the agent only when needed.
      </p>

      {(Object.keys(CONNECTIONS) as Array<keyof typeof CONNECTIONS>).map((key) => (
        <div key={key}>
          <h2>{CONNECTIONS[key].label}</h2>
          <p>{PROVIDER_DESCRIPTIONS[key]}</p>
          <a href={buildConnectUrl(key, "/connect")}>
            Connect {CONNECTIONS[key].label}
          </a>
        </div>
      ))}

      <a href="/">Back to Home</a>
    </main>
  );
}
