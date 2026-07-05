import { auth0, type Provider } from "@/lib/auth0";
import { isTokenVaultScopesEnabled } from "@/lib/auth0-scopes";
import { matchesProviderConnection } from "@/lib/auth-connections";

const MY_ACCOUNT_SCOPES =
  "read:me:connected_accounts delete:me:connected_accounts";

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
  let cursor: string | undefined;

  do {
    const url = new URL(
      `${getMyAccountBaseUrl()}/me/v1/connected-accounts/accounts`
    );
    url.searchParams.set("take", "20");
    if (cursor) {
      url.searchParams.set("from", cursor);
    }

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `My Account API list failed (${res.status}): ${body || res.statusText}`
      );
    }

    const data = (await res.json()) as ListConnectedAccountsResponse;
    accounts.push(...(data.accounts ?? []));
    cursor = data.next;
  } while (cursor);

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
  const res = await fetch(
    `${getMyAccountBaseUrl()}/me/v1/connected-accounts/accounts/${encodeURIComponent(accountId)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    const body = await res.text();
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
