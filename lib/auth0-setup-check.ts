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

const DASHBOARD_CHECKLIST = [
  "Disable Refresh Token Rotation on the Anzen application",
  "Enable the Token Vault grant type under Application → Advanced Settings",
  `Create a Custom API with identifier "${process.env.AUTH0_AUDIENCE ?? "https://anzen.api"}"`,
  "Create a Custom API Client for machine-to-machine token exchanges",
  "Authorize the app on the My Account API with Connected Accounts scopes",
  "Enable Allow Skipping User Consent on the My Account API",
  "Enable Multi-Resource Refresh Token on the My Account API",
  "Authorize the app on the Management API with update:users (required for disconnect)",
  "Authorize the app on the Anzen API under Application Access (User and Client)",
  `Configure Social Connections: ${SOCIAL_CONNECTIONS.join(", ")}`,
  "GitHub connection → Purpose → enable Connected Accounts for Token Vault",
  "GitHub OAuth app callback URL: https://YOUR_TENANT.us.auth0.com/login/callback (not localhost)",
  "GitHub connection → set scopes repo, read:user in Auth0 (not in app connect URL)",
  "Enable github connection on your app (Applications → Anzen Local → Connections)",
] as const;

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
  dashboardChecklist: readonly string[];
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
    dashboardChecklist: DASHBOARD_CHECKLIST,
    sdkNotes: [
      "Next.js SDK v4 uses /auth/callback (not /api/auth/callback)",
      "Use proxy.ts for Next.js 16 — do not keep a separate middleware.ts",
      "Token Vault tokens are fetched with getAccessTokenForConnection({ connection })",
      "Set AUTH0_TOKEN_VAULT_SCOPES=true after My Account API + Anzen API are authorized for your app",
      `Token Vault scopes when enabled: ${TOKEN_VAULT_SCOPE_LIST.join(", ")}`,
    ],
  };
}
