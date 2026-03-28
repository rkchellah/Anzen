import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";

export default async function ConnectPage() {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <main>
      <h1>Connect Your Accounts</h1>
      <p>Anzen needs access to your accounts to act on your behalf.</p>
      <p>Your tokens are stored securely in Auth0 Token Vault. Anzen never sees them directly.</p>

      <div>
        <h2>GitHub</h2>
        <p>Allow Anzen to read and manage your GitHub issues.</p>
        <a href="/auth/login?connection=github&returnTo=/connect">
          Connect GitHub
        </a>
      </div>

      <div>
        <h2>Gmail</h2>
        <p>Allow Anzen to read and send emails on your behalf.</p>
        <a href="/auth/login?connection=google-oauth2&returnTo=/connect">
          Connect Gmail
        </a>
      </div>

      <div>
        <h2>Slack</h2>
        <p>Allow Anzen to read and post messages in your Slack workspace.</p>
        <a href="/auth/login?connection=slack-oauth2&returnTo=/connect">
          Connect Slack
        </a>
      </div>

      <a href="/">Back to Home</a>
    </main>
  );
}
