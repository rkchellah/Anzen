import { auth0 } from "./auth0";

// Supported third-party connections
export type Connection = "github" | "google-oauth2" | "slack";

/**
 * Fetches an access token for a third-party service from Auth0 Token Vault.
 * The agent never stores this token — it's fetched fresh on every use.
 */
export async function getTokenVaultToken(
  connection: Connection
): Promise<string> {
  const session = await auth0.getSession();

  if (!session) {
    throw new Error("No active session. User must be logged in.");
  }

  const response = await fetch(
    `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
        client_id: process.env.ANZEN_AGENT_CLIENT_ID!,
        client_secret: process.env.ANZEN_AGENT_CLIENT_SECRET!,
        audience: process.env.AUTH0_AUDIENCE!,
        subject_token: session.tokenSet.accessToken,
        subject_token_type: "urn:ietf:params:oauth:token-type:access_token",
        requested_token_type:
          "urn:ietf:params:oauth:token-type:access_token",
        connection,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Token Vault error for ${connection}: ${error.error_description ?? error.error}`
    );
  }

  const data = await response.json();
  return data.access_token;
}
