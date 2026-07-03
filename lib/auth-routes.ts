/** Resolve the public app origin (Auth0 logout requires absolute returnTo URLs). */
export function getAppBaseUrl(fallbackOrigin?: string): string {
  const fromEnv =
    (typeof window === "undefined"
      ? process.env.APP_BASE_URL
      : process.env.NEXT_PUBLIC_APP_URL) ?? process.env.APP_BASE_URL;

  const trimmed = fromEnv?.trim().replace(/\/$/, "");
  if (trimmed) return trimmed;

  if (fallbackOrigin) return fallbackOrigin.replace(/\/$/, "");
  return "";
}

/** Build /auth/logout with an absolute post-logout URL Auth0 will accept. */
export function buildLogoutUrl(returnPath = "/"): string {
  const trimmed = returnPath.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return `/auth/logout?returnTo=${encodeURIComponent(trimmed)}`;
  }

  const base = getAppBaseUrl();
  if (!base) {
    return "/auth/logout";
  }

  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const returnTo = path === "/" ? base : `${base}${path}`;

  return `/auth/logout?returnTo=${encodeURIComponent(returnTo)}`;
}
