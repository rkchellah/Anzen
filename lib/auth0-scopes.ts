const BASE_LOGIN_SCOPES = ["openid", "profile", "email", "offline_access"] as const;

const TOKEN_VAULT_SCOPES = [
  "read:me:connected_accounts",
  "create:me:connected_accounts",
  "delete:me:connected_accounts",
] as const;

export function isTokenVaultScopesEnabled(): boolean {
  return process.env.AUTH0_TOKEN_VAULT_SCOPES === "true";
}

export function getLoginScopes(): string {
  const scopes = isTokenVaultScopesEnabled()
    ? [...BASE_LOGIN_SCOPES, ...TOKEN_VAULT_SCOPES]
    : [...BASE_LOGIN_SCOPES];

  return scopes.join(" ");
}

export function getAuthorizationParameters(): {
  scope: string;
  audience?: string;
} {
  const params: { scope: string; audience?: string } = {
    scope: getLoginScopes(),
  };

  // Custom API audience requires Application Access in Auth0 — only request when
  // Token Vault is fully configured (same flag as connected-accounts scopes).
  if (isTokenVaultScopesEnabled() && process.env.AUTH0_AUDIENCE) {
    params.audience = process.env.AUTH0_AUDIENCE;
  }

  return params;
}

export const TOKEN_VAULT_SCOPE_LIST = TOKEN_VAULT_SCOPES;
