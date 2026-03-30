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

// Fetches a third-party token from Auth0 Token Vault for a given provider.
// Uses auth0.getAccessToken() with a connection parameter (nextjs-auth0 v4 SDK method).
// The agent calls this — it never stores the token, just uses it immediately.
export async function getTokenForProvider(provider: Provider): Promise<string> {
  try {
    const { token } = await auth0.getAccessToken({
      authorizationParams: {
        connection: provider,
      },
    });

    if (!token) {
      throw new Error(`No token returned for ${provider}`);
    }

    return token;
  } catch (error) {
    throw new Error(`Failed to get token for ${provider}: ${String(error)}`);
  }
}