import { Auth0Client } from "@auth0/nextjs-auth0/server";

export const auth0 = new Auth0Client({
  domain: process.env.AUTH0_DOMAIN!,
  clientId: process.env.AUTH0_CLIENT_ID!,
  clientSecret: process.env.AUTH0_CLIENT_SECRET!,
  secret: process.env.AUTH0_SECRET!,
  appBaseUrl: process.env.APP_BASE_URL!,
  authorizationParameters: {
    audience: process.env.AUTH0_AUDIENCE!,
    scope: "openid profile email offline_access read:me:connected_accounts create:me:connected_accounts delete:me:connected_accounts",
  },
});

type Provider = "github" | "google-oauth2" | "slack-oauth2";

// Fetches a token from Token Vault for a given provider on behalf of the user.
// The agent calls this — it never stores the token, just uses it immediately.
export async function getTokenForProvider(
  provider: Provider
): Promise<string> {
  const session = await auth0.getSession();

  if (!session) {
    throw new Error("No active session. User must be logged in.");
  }

  const myAccountApiUrl = process.env.AUTH0_TOKEN_VAULT_URL;

  if (!myAccountApiUrl) {
    throw new Error("AUTH0_TOKEN_VAULT_URL is not set");
  }

  const response = await fetch(
    `${myAccountApiUrl}/connected-accounts`,
    {
      headers: {
        Authorization: `Bearer ${session.tokenSet.accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Token Vault request failed for ${provider}: ${response.status} ${response.statusText} — ${body}`
    );
  }

  const accounts = await response.json();

  const account = accounts.find(
    (a: { connection: string }) => a.connection === provider
  );

  if (!account?.access_token) {
    throw new Error(
      `No connected account found for ${provider}. User needs to connect their ${provider} account.`
    );
  }

  return account.access_token;
}