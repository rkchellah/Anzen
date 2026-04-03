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
      <p>When you connect an account, Anzen never stores your token. Auth0 Token Vault holds it securely and provides it to the agent only when needed.</p>

      <div>
        <h2>GitHub</h2>
        <p>Allow Anzen to read and manage your GitHub issues.</p>
        <a href="/auth/connect?connection=github&scopes=repo&scopes=read:user&returnTo=/connect">
          Connect GitHub
        </a>
      </div>

      <div>
        <h2>Gmail</h2>
        <p>Allow Anzen to read and send emails on your behalf.</p>
        <a href="/auth/connect?connection=google-oauth2&scopes=https://www.googleapis.com/auth/gmail.readonly&scopes=https://www.googleapis.com/auth/gmail.send&returnTo=/connect">
          Connect Gmail
        </a>
      </div>

      <div>
        <h2>Slack</h2>
        <p>Allow Anzen to read and post messages in your Slack workspace.</p>
        <a href="/auth/connect?connection=slack-oauth2&scopes=channels:read&scopes=chat:write&scopes=im:read&returnTo=/connect">
          Connect Slack
        </a>
      </div>

      <a href="/">Back to Home</a>
    </main>
  );
}
