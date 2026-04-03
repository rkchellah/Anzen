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

export type Provider = "github" | "google-oauth2" | "slack-oauth2";

// Exchanges an Auth0 access token for a provider token via Token Vault.
// auth0Token must be obtained in the request context before calling tools.
export async function exchangeTokenForProvider(
  auth0Token: string,
  provider: Provider
): Promise<string> {
  const res = await fetch(`https://${process.env.AUTH0_DOMAIN}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
      subject_token: auth0Token,
      subject_token_type: "urn:ietf:params:oauth:token-type:access_token",
      requested_token_type: "urn:auth0:params:oauth:token-type:token-vault",
      client_id: process.env.AUTH0_CLIENT_ID,
      client_secret: process.env.AUTH0_CLIENT_SECRET,
      connection: provider,
    }),
  });

  const data = await res.json();

  if (!data.access_token) {
    throw new Error(
      `Please connect ${provider} in the Connections page first. (${data.error_description ?? data.error ?? "Token exchange failed"})`
    );
  }

  return data.access_token;
}