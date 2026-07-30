import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { getAuthorizationParameters } from "./auth0-scopes";
import { mapErrorToUserFacing } from "./tool-errors";

// Temporary CircleCI/vercel-build diagnostics — do not log secret values
console.log(
  "AUTH0_DOMAIN present:",
  !!process.env.AUTH0_DOMAIN,
  "length:",
  process.env.AUTH0_DOMAIN?.length
);
console.log(
  "APP_BASE_URL present:",
  !!process.env.APP_BASE_URL,
  "length:",
  process.env.APP_BASE_URL?.length
);

export const auth0 = new Auth0Client({
  domain: process.env.AUTH0_DOMAIN!,
  clientId: process.env.AUTH0_CLIENT_ID!,
  clientSecret: process.env.AUTH0_CLIENT_SECRET!,
  secret: process.env.AUTH0_SECRET!,
  appBaseUrl: process.env.APP_BASE_URL!,
  authorizationParameters: getAuthorizationParameters(),
  enableConnectAccountEndpoint: true,
});

export type Provider = "github" | "google-oauth2" | "sign-in-with-slack";

// Retrieves a provider access token via Auth0 Token Vault.
// Uses the SDK's built-in getAccessTokenForConnection which exchanges
// the session refresh token for a connection-specific access token.
export async function exchangeTokenForProvider(
  _auth0Token: string,
  provider: Provider
): Promise<string> {
  try {
    const result = await auth0.getAccessTokenForConnection({ connection: provider });
    if (!result.token) {
      throw mapErrorToUserFacing(
        new Error("Token Vault returned an empty token"),
        provider
      );
    }
    return result.token;
  } catch (error) {
    throw mapErrorToUserFacing(error, provider);
  }
}
