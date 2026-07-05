import { auth0, exchangeTokenForProvider, type Provider } from "@/lib/auth0";
import { isTokenVaultScopesEnabled } from "@/lib/auth0-scopes";
import { getConnectedProvidersFromMyAccount } from "@/lib/my-account-api";
import { NextResponse } from "next/server";

const PROVIDERS: Provider[] = ["github", "google-oauth2", "sign-in-with-slack"];

async function probeTokenExchange(
  auth0Token: string
): Promise<Record<Provider, { success: boolean; error?: string }>> {
  const results = {} as Record<Provider, { success: boolean; error?: string }>;

  for (const provider of PROVIDERS) {
    try {
      await exchangeTokenForProvider(auth0Token, provider);
      results[provider] = { success: true };
    } catch (error) {
      results[provider] = { success: false, error: String(error) };
    }
  }

  return results;
}

export async function GET() {
  const session = await auth0.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tokenResult = await auth0.getAccessToken();
  const auth0Token = tokenResult?.token;

  if (!auth0Token) {
    return NextResponse.json({ error: "Could not get access token" }, { status: 401 });
  }

  // Prefer My Account API — matches what disconnect uses. Token exchange alone can
  // succeed for login identities that are not Token Vault linked accounts.
  if (isTokenVaultScopesEnabled()) {
    try {
      const linked = await getConnectedProvidersFromMyAccount();
      const results = Object.fromEntries(
        PROVIDERS.map((provider) => [
          provider,
          { success: linked[provider] },
        ])
      );

      return NextResponse.json({ results, source: "my_account_api" });
    } catch (error) {
      console.warn("My Account status check failed, falling back to token probe:", error);
    }
  }

  const results = await probeTokenExchange(auth0Token);
  return NextResponse.json({ results, source: "token_exchange_probe" });
}
