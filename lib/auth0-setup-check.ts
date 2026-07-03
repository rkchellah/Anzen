import { getMissingAuth0EnvVars, isAuth0Configured } from "./auth0-env";
import { isTokenVaultScopesEnabled, TOKEN_VAULT_SCOPE_LIST } from "./auth0-scopes";

const TOKEN_VAULT_SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "read:me:connected_accounts",
  "create:me:connected_accounts",
  "delete:me:connected_accounts",
] as const;

const SOCIAL_CONNECTIONS = ["github", "google-oauth2", "sign-in-with-slack"] as const;

function getCallbackUrls(baseUrl: string) {
  const normalized = baseUrl.replace(/\/$/, "");
  return {
    allowedCallbackUrls: [`${normalized}/auth/callback`],
    allowedLogoutUrls: [normalized],
    allowedWebOrigins: [normalized],
  };
}

export type Auth0SetupReport = {
  configured: boolean;
  missingEnvVars: string[];
  appBaseUrl: string | null;
  callbackUrls: ReturnType<typeof getCallbackUrls> | null;
  tokenVaultScopesEnabled: boolean;
  requiredScopes: readonly string[];
  socialConnections: readonly string[];
  architectureDoc: string;
  sdkNotes: readonly string[];
};

export function getAuth0SetupReport(): Auth0SetupReport {
  const missingEnvVars = getMissingAuth0EnvVars();
  const configured = isAuth0Configured();
  const appBaseUrl = process.env.APP_BASE_URL?.trim() || null;

  return {
    configured,
    missingEnvVars,
    appBaseUrl,
    callbackUrls: appBaseUrl ? getCallbackUrls(appBaseUrl) : null,
    tokenVaultScopesEnabled: isTokenVaultScopesEnabled(),
    requiredScopes: isTokenVaultScopesEnabled()
      ? TOKEN_VAULT_SCOPES
      : (["openid", "profile", "email", "offline_access"] as const),
    socialConnections: SOCIAL_CONNECTIONS,
    architectureDoc: "ARCHITECTURE.md",
    sdkNotes: [
      "Next.js SDK v4 uses /auth/callback (not /api/auth/callback)",
      "Use proxy.ts for Next.js 16 — do not keep a separate middleware.ts",
      "Token Vault tokens are fetched with getAccessTokenForConnection({ connection })",
      "Set AUTH0_TOKEN_VAULT_SCOPES=true after My Account API + Anzen API are authorized for your app",
      `Token Vault scopes when enabled: ${TOKEN_VAULT_SCOPE_LIST.join(", ")}`,
      "Full Auth0 flow and dashboard setup: see ARCHITECTURE.md and BUGLOG.md",
    ],
  };
}
