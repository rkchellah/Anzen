export type ConnectionKey = "github" | "gmail" | "slack";

export type Provider = "github" | "google-oauth2" | "sign-in-with-slack";

/** Auth0 connection names that map to each Token Vault provider. */
export const PROVIDER_CONNECTION_ALIASES: Record<Provider, readonly string[]> = {
  github: ["github"],
  "google-oauth2": ["google-oauth2"],
  "sign-in-with-slack": ["sign-in-with-slack", "slack-oauth2", "slack"],
};

export function matchesProviderConnection(
  connectionName: string,
  provider: Provider
): boolean {
  const normalized = connectionName.toLowerCase();
  return PROVIDER_CONNECTION_ALIASES[provider].some(
    (alias) => normalized === alias.toLowerCase()
  );
}

export const CONNECTIONS: Record<
  ConnectionKey,
  { connection: Provider; label: string; desc: string; scopes: readonly string[] }
> = {
  github: {
    connection: "github",
    label: "GitHub",
    desc: "Issues, PRs & repos",
    // Auth0 Token Vault: do not pass scopes for GitHub in /auth/connect.
    // Set repo/read:user on the Auth0 GitHub connection (Authentication → Social → github).
    scopes: [],
  },
  gmail: {
    connection: "google-oauth2",
    label: "Gmail",
    desc: "Emails & drafts",
    scopes: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.send",
    ],
  },
  slack: {
    // Auth0 "Sign in with Slack" connection name (cannot be renamed after create).
    connection: "sign-in-with-slack",
    label: "Slack",
    desc: "Channels & messages",
    scopes: ["channels:read", "chat:write", "im:read"],
  },
};

/** Build a Token Vault connect URL for an already-authenticated user. */
export function buildConnectUrl(
  key: ConnectionKey,
  returnTo = "/dashboard"
): string {
  const config = CONNECTIONS[key];
  const params = new URLSearchParams();
  params.set("connection", config.connection);
  for (const scope of config.scopes) {
    params.append("scopes", scope);
  }
  params.set("returnTo", returnTo);
  return `/auth/connect?${params.toString()}`;
}
