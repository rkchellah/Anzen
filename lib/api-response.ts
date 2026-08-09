import { NextResponse } from "next/server";

/**
 * One error shape for every route: `{ error: string }`, optionally with
 * `retryAfterSeconds`. The client reads `error` directly, so the string must
 * always be safe to show a user — never a raw provider message or stack.
 */
export type ApiError = {
  error: string;
  retryAfterSeconds?: number;
};

export function apiError(
  message: string,
  status: number,
  extra?: { retryAfterSeconds?: number; headers?: HeadersInit }
): NextResponse<ApiError> {
  const body: ApiError = { error: message };
  if (extra?.retryAfterSeconds !== undefined) {
    body.retryAfterSeconds = extra.retryAfterSeconds;
  }
  return NextResponse.json(body, { status, headers: extra?.headers });
}

export const unauthorized = (message = "Not authenticated") =>
  apiError(message, 401);

export const badRequest = (message: string) => apiError(message, 400);

/**
 * Log the real error server-side, return a generic message to the client.
 * Keeps provider internals (tokens, hostnames, stack traces) out of responses.
 */
export function serverError(
  scope: string,
  error: unknown,
  message = "Something went wrong. Please try again."
): NextResponse<ApiError> {
  console.error(`[${scope}]`, error);
  return apiError(message, 500);
}

/**
 * Parse a JSON request body without letting malformed input become a 500.
 * Returns `null` when the body is absent, not JSON, or not a JSON object.
 */
export async function readJsonObject(
  req: Request
): Promise<Record<string, unknown> | null> {
  try {
    const parsed: unknown = await req.json();
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Wrap a route handler so an unexpected throw becomes a clean 500. */
export function withRouteErrors<Args extends unknown[]>(
  scope: string,
  handler: (...args: Args) => Promise<Response>
): (...args: Args) => Promise<Response> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (error) {
      return serverError(scope, error);
    }
  };
}
