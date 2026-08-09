import { auth0, type Provider } from "@/lib/auth0";
import { isTokenVaultScopesEnabled } from "@/lib/auth0-scopes";
import { matchesProviderConnection } from "@/lib/auth-connections";
import { fetchWithRetry, fetchWithTimeout } from "@/lib/http";

const MY_ACCOUNT_SCOPES =
  "read:me:connected_accounts delete:me:connected_accounts";

/** Backstop against a server that keeps handing back a `next` cursor. */
const MAX_ACCOUNT_PAGES = 20;

export function getMyAccountAudience(): string {
  return `https://${process.env.AUTH0_DOMAIN}/me/`;
}

export function getMyAccountBaseUrl(): string {
  return `https://${process.env.AUTH0_DOMAIN}`;
}

export type ConnectedAccount = {
  id: string;
  connection: string;
};

type ListConnectedAccountsResponse = {
  accounts: ConnectedAccount[];
  next?: string;
};

export async function getMyAccountAccessToken() {
  return auth0.getAccessToken({
    audience: getMyAccountAudience(),
    scope: MY_ACCOUNT_SCOPES,
  });
}

/** List all connected accounts (paginated). Do not rely on connection filter alone. */
export async function listAllConnectedAccounts(
  accessToken: string
): Promise<ConnectedAccount[]> {
  const accounts: ConnectedAccount[] = [];
  const seenCursors = new Set<string>();
  let cursor: string | undefined;
  let page = 0;

  do {
    const url = new URL(
      `${getMyAccountBaseUrl()}/me/v1/connected-accounts/accounts`
    );
    url.searchParams.set("take", "20");
    if (cursor) {
      url.searchParams.set("from", cursor);
    }

    // Read-only and idempotent, so a retry on a transient 5xx is safe.
    const res = await fetchWithRetry(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `My Account API list failed (${res.status}): ${body || res.statusText}`
      );
    }

    let data: ListConnectedAccountsResponse;
    try {
      data = (await res.json()) as ListConnectedAccountsResponse;
    } catch (error) {
      throw new Error("My Account API returned an unreadable response", {
        cause: error,
      });
    }

    accounts.push(...(Array.isArray(data.accounts) ? data.accounts : []));

    // A repeated or self-referential cursor would otherwise loop forever.
    cursor = data.next;
    if (cursor && seenCursors.has(cursor)) break;
    if (cursor) seenCursors.add(cursor);
  } while (cursor && ++page < MAX_ACCOUNT_PAGES);

  return accounts;
}

export function findConnectedAccount(
  accounts: ConnectedAccount[],
  provider: Provider
): ConnectedAccount | undefined {
  return accounts.find((account) =>
    matchesProviderConnection(account.connection, provider)
  );
}

export async function deleteConnectedAccount(
  accessToken: string,
  accountId: string
): Promise<void> {
  // A write — timeout but never retry, so a slow success isn't repeated.
  const res = await fetchWithTimeout(
    `${getMyAccountBaseUrl()}/me/v1/connected-accounts/accounts/${encodeURIComponent(accountId)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `My Account API delete failed (${res.status}): ${body || res.statusText}`
    );
  }
}

export async function getConnectedProvidersFromMyAccount(): Promise<
  Record<Provider, boolean>
> {
  const { token } = await getMyAccountAccessToken();
  const accounts = await listAllConnectedAccounts(token);

  return {
    github: findConnectedAccount(accounts, "github") !== undefined,
    "google-oauth2":
      findConnectedAccount(accounts, "google-oauth2") !== undefined,
    "sign-in-with-slack":
      findConnectedAccount(accounts, "sign-in-with-slack") !== undefined,
  };
}

export async function disconnectProvider(connection: Provider): Promise<void> {
  if (!isTokenVaultScopesEnabled()) {
    throw new Error(
      "Token Vault scopes are disabled. Set AUTH0_TOKEN_VAULT_SCOPES=true, restart, then sign out and sign in again."
    );
  }

  const { token } = await getMyAccountAccessToken();
  const accounts = await listAllConnectedAccounts(token);
  const account = findConnectedAccount(accounts, connection);

  if (!account) {
    const linked = accounts.map((a) => a.connection).join(", ") || "none";
    throw new Error(
      `No Token Vault linked account for ${connection}. Linked accounts: ${linked}. Reconnect from the Connections tab.`
    );
  }

  await deleteConnectedAccount(token, account.id);
}

export const DISCONNECT_PROVIDERS: readonly Provider[] = [
  "github",
  "google-oauth2",
  "sign-in-with-slack",
];

export function isDisconnectProvider(value: string): value is Provider {
  return (DISCONNECT_PROVIDERS as readonly string[]).includes(value);
}
