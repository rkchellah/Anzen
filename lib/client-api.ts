/**
 * Browser-side helpers for talking to Anzen's own API routes.
 *
 * Every dashboard fetch goes through here so offline/timeout/HTTP-error cases
 * all arrive as one `ApiRequestError` carrying a message that is already safe
 * and useful to render, instead of each caller inventing its own handling.
 */

export const CLIENT_TIMEOUT_MS = 15_000;

export class ApiRequestError extends Error {
  readonly status: number | null;
  /** True for offline / timeout / DNS failures — i.e. the request never landed. */
  readonly isNetwork: boolean;
  readonly retryAfterSeconds?: number;

  constructor(options: {
    message: string;
    status?: number | null;
    isNetwork?: boolean;
    retryAfterSeconds?: number;
  }) {
    super(options.message);
    this.name = "ApiRequestError";
    this.status = options.status ?? null;
    this.isNetwork = options.isNetwork ?? false;
    this.retryAfterSeconds = options.retryAfterSeconds;
  }
}

function offlineMessage(): string {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return "You appear to be offline. Check your connection and try again.";
  }
  return "Couldn't reach Anzen. Check your connection and try again.";
}

function messageForStatus(status: number): string {
  if (status === 401) return "Your session expired. Sign in again to continue.";
  if (status === 403) return "You don't have permission to do that.";
  if (status === 404) return "That resource no longer exists.";
  if (status === 429) return "Too many requests. Wait a moment and try again.";
  if (status >= 500) return "Anzen's server had a problem. Try again shortly.";
  return "The request could not be completed.";
}

/**
 * Fetch an Anzen API route and parse its JSON body.
 *
 * Throws {@link ApiRequestError} for network failures, timeouts, non-2xx
 * responses, and unparseable bodies — callers only handle the happy path.
 */
export async function requestJson<T>(
  path: string,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<T> {
  const { timeoutMs = CLIENT_TIMEOUT_MS, signal, ...rest } = init;
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const composed = signal
    ? AbortSignal.any([signal, timeoutSignal])
    : timeoutSignal;

  let response: Response;
  try {
    response = await fetch(path, { ...rest, signal: composed });
  } catch (error) {
    // A caller-initiated abort (unmount, superseded request) is not an error
    // worth reporting — re-throw so callers can ignore it by name.
    if (signal?.aborted) throw error;
    if (timeoutSignal.aborted) {
      throw new ApiRequestError({
        message: "The request took too long. Try again.",
        isNetwork: true,
      });
    }
    throw new ApiRequestError({ message: offlineMessage(), isNetwork: true });
  }

  const raw = await response.text();
  let body: unknown = null;
  if (raw) {
    try {
      body = JSON.parse(raw);
    } catch {
      body = null;
    }
  }

  const envelope =
    typeof body === "object" && body !== null
      ? (body as { error?: unknown; retryAfterSeconds?: unknown })
      : null;

  if (!response.ok) {
    throw new ApiRequestError({
      message:
        typeof envelope?.error === "string" && envelope.error.trim()
          ? envelope.error
          : messageForStatus(response.status),
      status: response.status,
      retryAfterSeconds:
        typeof envelope?.retryAfterSeconds === "number"
          ? envelope.retryAfterSeconds
          : undefined,
    });
  }

  if (body === null) {
    throw new ApiRequestError({
      message: "Anzen returned an unreadable response. Try again.",
      status: response.status,
    });
  }

  return body as T;
}

/** True when an error is just a cancelled in-flight request, not a failure. */
export function isAbortError(error: unknown): boolean {
  return (
    error instanceof DOMException && error.name === "AbortError"
  ) || (error instanceof Error && error.name === "AbortError");
}

/** Best-effort user-facing message for anything thrown by a fetch path. */
export function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiRequestError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/**
 * `useChat` reports a failed response by putting the raw body in
 * `error.message`, so a 4xx from /api/chat arrives as `{"error":"…"}`.
 * Unwrap the envelope instead of showing JSON to the user.
 */
export function chatErrorMessage(error: unknown, fallback: string): string {
  const raw = errorMessage(error, "").trim();
  if (!raw) return fallback;
  if (!raw.startsWith("{")) return raw;

  try {
    const parsed = JSON.parse(raw) as { error?: unknown };
    return typeof parsed.error === "string" && parsed.error.trim()
      ? parsed.error
      : fallback;
  } catch {
    // Body looked like JSON but wasn't — don't put it on screen.
    return fallback;
  }
}
