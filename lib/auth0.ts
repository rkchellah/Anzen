import { Auth0Client } from "@auth0/nextjs-auth0/server";

export const auth0 = new Auth0Client({
  domain: process.env.AUTH0_DOMAIN!,
  clientId: process.env.AUTH0_CLIENT_ID!,
  clientSecret: process.env.AUTH0_CLIENT_SECRET!,
  secret: process.env.AUTH0_SECRET!,
  appBaseUrl: process.env.APP_BASE_URL!,
  authorizationParameters: {
    audience: process.env.AUTH0_AUDIENCE!,
    scope: "openid profile email offline_access",
  },
});

type Provider = "github" | "google-oauth2" | "slack-oauth2";

// Fetches a token from Token Vault for a given provider on behalf of the user.
// The agent calls this — it never stores the token, just uses it immediately.
export async function getTokenForProvider(
  userId: string,
  provider: Provider
): Promise<string> {
  const tokenVaultUrl = process.env.AUTH0_TOKEN_VAULT_URL;

  if (!tokenVaultUrl) {
    throw new Error("AUTH0_TOKEN_VAULT_URL is not set in environment variables");
  }

  const clientId = process.env.ANZEN_AGENT_CLIENT_ID!;
  const clientSecret = process.env.ANZEN_AGENT_CLIENT_SECRET!;

  // Get a machine-to-machine token for the Anzen API Client first
  const m2mResponse = await fetch(
    `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
      }),
    }
  );

  if (!m2mResponse.ok) {
    throw new Error(`Failed to get M2M token: ${m2mResponse.statusText}`);
  }

  const { access_token: m2mToken } = await m2mResponse.json();

  // Use the M2M token to fetch the user's connected account token from Token Vault
  const vaultResponse = await fetch(
    `${tokenVaultUrl}/users/${userId}/identities`,
    {
      headers: {
        Authorization: `Bearer ${m2mToken}`,
      },
    }
  );

  if (!vaultResponse.ok) {
    throw new Error(
      `Token Vault request failed for provider ${provider}: ${vaultResponse.statusText}`
    );
  }

  const identities = await vaultResponse.json();

  const identity = identities.find(
    (id: { provider: string }) => id.provider === provider
  );

  if (!identity?.access_token) {
    throw new Error(
      `No token found for provider: ${provider}. User may need to connect their ${provider} account.`
    );
  }

  return identity.access_token;
}