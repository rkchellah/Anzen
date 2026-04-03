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
  enableConnectAccountEndpoint: true,
});

export type Provider = "github" | "google-oauth2" | "slack-oauth2";

// Retrieves a provider access token via Auth0 Token Vault.
// Uses the SDK's built-in getAccessTokenForConnection which exchanges
// the session refresh token for a connection-specific access token.
export async function exchangeTokenForProvider(
  _auth0Token: string,
  provider: Provider
): Promise<string> {
  const result = await auth0.getAccessTokenForConnection({ connection: provider });
  return result.token;
}
