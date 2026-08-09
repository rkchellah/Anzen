import { NextResponse } from "next/server";
import { auth0, exchangeTokenForProvider, type Provider } from "@/lib/auth0";
import { apiError, unauthorized } from "@/lib/api-response";
import { isTokenVaultScopesEnabled } from "@/lib/auth0-scopes";
import { getConnectedProvidersFromMyAccount } from "@/lib/my-account-api";

const PROVIDERS: Provider[] = ["github", "google-oauth2", "sign-in-with-slack"];

/**
 * Probe every provider concurrently. A failed exchange just means "not
 * connected" here — the reason is logged, not returned, since raw Auth0 error
 * text can carry connection and tenant details.
 */
async function probeTokenExchange(
  auth0Token: string
): Promise<Record<Provider, { success: boolean }>> {
  const entries = await Promise.all(
    PROVIDERS.map(async (provider) => {
      try {
        await exchangeTokenForProvider(auth0Token, provider);
        return [provider, { success: true }] as const;
      } catch (error) {
        console.warn(`[status] Token exchange failed for ${provider}:`, error);
        return [provider, { success: false }] as const;
      }
    })
  );

  return Object.fromEntries(entries) as Record<Provider, { success: boolean }>;
}

export async function GET() {
  const session = await auth0.getSession();
  if (!session) return unauthorized();

  let tokenResult;
  try {
    tokenResult = await auth0.getAccessToken();
  } catch (error) {
    console.error("[status] Could not get access token:", error);
    return unauthorized("Your session expired. Sign in again to continue.");
  }
  if (!tokenResult?.token) {
    return unauthorized("Your session expired. Sign in again to continue.");
  }

  // Prefer My Account API — matches what disconnect uses. Token exchange alone can
  // succeed for login identities that are not Token Vault linked accounts.
  if (isTokenVaultScopesEnabled()) {
    try {
      const linked = await getConnectedProvidersFromMyAccount();
      const results = Object.fromEntries(
        PROVIDERS.map((provider) => [provider, { success: linked[provider] }])
      );

      return NextResponse.json({ results, source: "my_account_api" });
    } catch (error) {
      console.warn(
        "[status] My Account check failed, falling back to token probe:",
        error
      );
    }
  }

  try {
    const results = await probeTokenExchange(tokenResult.token);
    return NextResponse.json({ results, source: "token_exchange_probe" });
  } catch (error) {
    console.error("[status] Connection probe failed:", error);
    return apiError("Couldn't check your connections. Try again.", 502);
  }
}
