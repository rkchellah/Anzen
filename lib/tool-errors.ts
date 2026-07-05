import type { Provider } from "@/lib/auth0";
import type { ConnectionKey } from "@/lib/auth-connections";
import { CONNECTIONS } from "@/lib/auth-connections";

export type ToolErrorCategory =
  | "not_connected"
  | "token_expired"
  | "permission_denied"
  | "rate_limit"
  | "network"
  | "unknown";

export class ToolUserError extends Error {
  readonly category: ToolErrorCategory;
  readonly connectionKey: ConnectionKey | null;
  readonly userMessage: string;

  constructor(options: {
    category: ToolErrorCategory;
    connectionKey: ConnectionKey | null;
    userMessage: string;
  }) {
    super(options.userMessage);
    this.name = "ToolUserError";
    this.category = options.category;
    this.connectionKey = options.connectionKey;
    this.userMessage = options.userMessage;
  }
}

const PROVIDER_TO_CONNECTION: Record<Provider, ConnectionKey> = {
  github: "github",
  "google-oauth2": "gmail",
  "sign-in-with-slack": "slack",
};

export function connectionKeyForProvider(provider: Provider): ConnectionKey {
  return PROVIDER_TO_CONNECTION[provider];
}

export function providerLabel(provider: Provider): string {
  return CONNECTIONS[connectionKeyForProvider(provider)].label;
}

/** Map agent tool names to the provider they use. */
export function connectionKeyForToolName(toolName: string): ConnectionKey | null {
  switch (toolName) {
    case "listAssignedIssues":
    case "listRepoIssues":
    case "closeIssue":
    case "commentOnIssue":
      return "github";
    case "listUnreadEmails":
    case "sendEmail":
      return "gmail";
    case "listChannels":
    case "postMessage":
      return "slack";
    default:
      return null;
  }
}

function extractErrorText(error: unknown): string {
  if (error instanceof ToolUserError) return error.userMessage;
  if (error instanceof Error) {
    const octokitMessage = extractOctokitMessage(error);
    if (octokitMessage) return octokitMessage;
    return error.message;
  }
  return String(error);
}

function extractOctokitMessage(error: Error): string | undefined {
  const response = (error as { response?: { data?: { message?: string } } }).response;
  const message = response?.data?.message;
  return typeof message === "string" && message.length > 0 ? message : undefined;
}

function githubWriteBlockedMessage(): string {
  return (
    "GitHub rejected the write action: your connected app can read issues but cannot comment or close them on that repository. " +
    "In GitHub → Developer settings → GitHub Apps → your Auth0 app, set Repository permissions → Issues to Read and write, save, then open Connections, disconnect GitHub, and connect again. " +
    "For organization repos, an org admin may need to approve the updated app permissions."
  );
}

function messageForProvider(
  provider: Provider,
  category: ToolErrorCategory,
  label: string,
  error: unknown
): string {
  const text = extractErrorText(error).toLowerCase();

  if (provider === "github" && category === "permission_denied") {
    if (text.includes("resource not accessible by integration")) {
      return githubWriteBlockedMessage();
    }
    if (text.includes("must have push access") || text.includes("write access to the repository")) {
      return githubWriteBlockedMessage();
    }
  }

  return messageForCategory(category, label);
}

function extractStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null) return undefined;

  if ("status" in error && typeof error.status === "number") {
    return error.status;
  }

  if ("response" in error) {
    const response = (error as { response?: { status?: number } }).response;
    if (response && typeof response.status === "number") {
      return response.status;
    }
  }

  if ("code" in error && typeof error.code === "string") {
    const code = error.code.toLowerCase();
    if (code === "enotfound" || code === "econnrefused" || code === "etimedout") {
      return undefined;
    }
  }

  return undefined;
}

function extractSlackErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const data = (error as { data?: { error?: string } }).data;
  return typeof data?.error === "string" ? data.error : undefined;
}

function isNetworkError(error: unknown, text: string): boolean {
  const lower = text.toLowerCase();
  if (
    lower.includes("network") ||
    lower.includes("fetch failed") ||
    lower.includes("econnrefused") ||
    lower.includes("enotfound") ||
    lower.includes("etimedout") ||
    lower.includes("socket hang up")
  ) {
    return true;
  }

  if (typeof error === "object" && error !== null && "code" in error) {
    const code = String((error as { code: unknown }).code).toUpperCase();
    return code === "ENOTFOUND" || code === "ECONNREFUSED" || code === "ETIMEDOUT";
  }

  return false;
}

function isNotConnectedError(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("refresh token not found") ||
    lower.includes("no connected account") ||
    lower.includes("connected account not found") ||
    lower.includes("connection not found") ||
    lower.includes("not connected") ||
    lower.includes("missing connection")
  );
}

function isTokenExpiredError(text: string, status: number | undefined, slackCode: string | undefined): boolean {
  const lower = text.toLowerCase();
  if (status === 401) return true;
  if (slackCode === "invalid_auth" || slackCode === "token_revoked" || slackCode === "account_inactive") {
    return true;
  }
  return (
    lower.includes("bad credentials") ||
    lower.includes("invalid credentials") ||
    lower.includes("invalid_auth") ||
    lower.includes("token expired") ||
    lower.includes("token has been expired") ||
    lower.includes("invalid_grant")
  );
}

function isPermissionDeniedError(text: string, status: number | undefined, slackCode: string | undefined): boolean {
  const lower = text.toLowerCase();
  if (status === 403) return true;
  if (slackCode === "missing_scope" || slackCode === "not_authed") return true;
  return (
    lower.includes("insufficient_scope") ||
    lower.includes("insufficient permission") ||
    lower.includes("permission denied") ||
    lower.includes("resource not accessible") ||
    lower.includes("access denied")
  );
}

function isRateLimitError(text: string, status: number | undefined, slackCode: string | undefined): boolean {
  const lower = text.toLowerCase();
  if (status === 429) return true;
  if (slackCode === "rate_limited") return true;
  return lower.includes("rate limit") || lower.includes("too many requests");
}

function categorizeError(error: unknown): ToolErrorCategory {
  const text = extractErrorText(error);
  const status = extractStatus(error);
  const slackCode = extractSlackErrorCode(error);

  if (isNetworkError(error, text)) return "network";
  if (isNotConnectedError(text)) return "not_connected";
  if (isRateLimitError(text, status, slackCode)) return "rate_limit";
  if (isTokenExpiredError(text, status, slackCode)) return "token_expired";
  if (isPermissionDeniedError(text, status, slackCode)) return "permission_denied";
  return "unknown";
}

function messageForCategory(category: ToolErrorCategory, label: string): string {
  switch (category) {
    case "not_connected":
      return `${label} isn't connected to your account. Open the Connections tab and connect ${label} to continue.`;
    case "token_expired":
      return `Your ${label} access has expired. Reconnect ${label} in the Connections tab to restore access.`;
    case "permission_denied":
      return `Anzen doesn't have permission for this ${label} action. Reconnect ${label} in Connections and grant the requested access.`;
    case "rate_limit":
      return `${label} is limiting requests right now. Wait a minute and try again.`;
    case "network":
      return `Couldn't reach ${label}. Check your internet connection and try again.`;
    case "unknown":
      return `Something went wrong with ${label}. Open Connections to reconnect ${label}, or try again in a moment.`;
  }
}

export function mapErrorToUserFacing(
  error: unknown,
  provider: Provider
): ToolUserError {
  if (error instanceof ToolUserError) return error;

  const connectionKey = connectionKeyForProvider(provider);
  const label = providerLabel(provider);
  const category = categorizeError(error);
  const userMessage = messageForProvider(provider, category, label, error);

  return new ToolUserError({ category, connectionKey, userMessage });
}

/** Log full detail, throw a plain-language error for the model and UI. */
export function throwToolError(
  toolName: string,
  error: unknown,
  provider: Provider
): never {
  if (!(error instanceof ToolUserError)) {
    console.error(`[${toolName}]`, error);
  }
  throw mapErrorToUserFacing(error, provider);
}
