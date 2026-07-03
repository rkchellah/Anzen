const PLACEHOLDER_VALUES = new Set([
  "your-tenant.auth0.com",
  "YOUR_CLIENT_SECRET",
]);

const REQUIRED_ENV_VARS = [
  "AUTH0_DOMAIN",
  "AUTH0_CLIENT_ID",
  "AUTH0_CLIENT_SECRET",
  "AUTH0_SECRET",
  "APP_BASE_URL",
  "AUTH0_AUDIENCE",
] as const;

function isSet(value: string | undefined): boolean {
  const trimmed = value?.trim();
  if (!trimmed) return false;
  return !PLACEHOLDER_VALUES.has(trimmed);
}

function isValidAuth0Domain(domain: string | undefined): boolean {
  const trimmed = domain?.trim();
  if (!trimmed || PLACEHOLDER_VALUES.has(trimmed)) return false;
  // Tenant name alone (e.g. dev-xxx) is invalid — must be a full Auth0 hostname.
  return trimmed.includes(".auth0.com") && !trimmed.includes("://");
}

export function getMissingAuth0EnvVars(): string[] {
  const missing: string[] = REQUIRED_ENV_VARS.filter((key) => !isSet(process.env[key]));
  if (!missing.includes("AUTH0_DOMAIN") && !isValidAuth0Domain(process.env.AUTH0_DOMAIN)) {
    missing.push("AUTH0_DOMAIN (use full hostname, e.g. dev-xxx.us.auth0.com)");
  }
  return missing;
}

export function isAuth0Configured(): boolean {
  return getMissingAuth0EnvVars().length === 0;
}
