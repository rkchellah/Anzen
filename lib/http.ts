/**
 * Shared outbound-HTTP helpers.
 *
 * Every call Anzen makes to a third party (Auth0 My Account, DeepSeek, Groq Whisper) goes
 * through here so a hung socket can't pin a serverless invocation open until the
 * platform kills it, and so transient 5xx/network blips get one cheap retry
 * instead of surfacing to the user as a hard failure.
 */

/** Default ceiling for a single outbound request. */
export const DEFAULT_FETCH_TIMEOUT_MS = 10_000;

export class HttpTimeoutError extends Error {
  constructor(url: string, timeoutMs: number) {
    super(`Request to ${url} timed out after ${timeoutMs}ms`);
    this.name = "HttpTimeoutError";
  }
}

export class HttpNetworkError extends Error {
  constructor(url: string, cause: unknown) {
    super(`Could not reach ${url}`);
    this.name = "HttpNetworkError";
    this.cause = cause;
  }
}

function hostOf(input: RequestInfo | URL): string {
  try {
    const raw = input instanceof Request ? input.url : String(input);
    return new URL(raw).host;
  } catch {
    return "the service";
  }
}

/**
 * `fetch` with a hard timeout. Rejects with {@link HttpTimeoutError} on timeout
 * and {@link HttpNetworkError} on DNS/connection failure, so callers can tell
 * "unreachable" apart from "responded with an error status".
 */
export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs = DEFAULT_FETCH_TIMEOUT_MS, signal, ...rest } = init;
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const composed = signal
    ? AbortSignal.any([signal, timeoutSignal])
    : timeoutSignal;

  try {
    return await fetch(input, { ...rest, signal: composed });
  } catch (error) {
    // The caller's own signal aborting is a cancellation, not a failure.
    if (signal?.aborted) throw error;
    if (timeoutSignal.aborted) {
      throw new HttpTimeoutError(hostOf(input), timeoutMs);
    }
    throw new HttpNetworkError(hostOf(input), error);
  }
}

/**
 * `fetchWithTimeout` plus one retry on a transient failure (network, timeout,
 * 429, or 5xx). Only safe for idempotent requests — never use it for writes.
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init: RequestInit & { timeoutMs?: number; retries?: number } = {}
): Promise<Response> {
  const { retries = 1, ...rest } = init;

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(input, rest);
      const transient = response.status === 429 || response.status >= 500;
      if (!transient || attempt === retries) return response;
      lastError = new Error(`Upstream responded ${response.status}`);
    } catch (error) {
      if (rest.signal?.aborted) throw error;
      lastError = error;
      if (attempt === retries) throw error;
    }
    // Short linear backoff — these are user-facing requests, not batch jobs.
    await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
  }

  throw lastError instanceof Error ? lastError : new Error("Request failed");
}
