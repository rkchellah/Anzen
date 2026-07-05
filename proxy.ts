import { NextResponse, type NextRequest } from "next/server";
import { auth0 } from "./lib/auth0";
import { isAuth0Configured } from "./lib/auth0-env";

// #region agent log
function agentDebugLog(
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string
) {
  fetch("http://127.0.0.1:7577/ingest/d982334d-3e38-4abb-9d16-690b3107d922", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "89e937",
    },
    body: JSON.stringify({
      sessionId: "89e937",
      location,
      message,
      data,
      timestamp: Date.now(),
      hypothesisId,
      runId: "pre-fix",
    }),
  }).catch(() => {});
}
// #endregion

export default async function middleware(request: NextRequest) {
  if (!isAuth0Configured()) {
    const { pathname } = request.nextUrl;

    if (
      pathname === "/" ||
      pathname.startsWith("/_next") ||
      pathname === "/favicon.ico"
    ) {
      return NextResponse.next();
    }

    if (pathname === "/api/status") {
      return NextResponse.json({ error: "Auth0 not configured" }, { status: 503 });
    }

    if (pathname === "/api/auth/setup") {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL("/?setup=required", request.url));
  }

  const { pathname, search } = request.nextUrl;
  const isAuthRoute = pathname.startsWith("/auth/");

  // Auth0 OIDC logout requires an absolute post_logout_redirect_uri — relative paths 400.
  if (pathname === "/auth/logout") {
    const returnTo = request.nextUrl.searchParams.get("returnTo");
    if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
      const base =
        process.env.APP_BASE_URL?.trim().replace(/\/$/, "") ??
        `http://${request.headers.get("host") ?? "localhost:3000"}`;
      const fixed = new URL(request.url);
      fixed.searchParams.set("returnTo", `${base}${returnTo}`);
      return NextResponse.redirect(fixed);
    }
  }

  if (pathname === "/auth/callback" && request.nextUrl.searchParams.has("error")) {
    const error = request.nextUrl.searchParams.get("error") ?? "unknown";
    const description =
      request.nextUrl.searchParams.get("error_description") ??
      "Auth0 rejected the login request.";

    const redirectUrl = new URL("/", request.url);
    redirectUrl.searchParams.set("auth_error", error);
    redirectUrl.searchParams.set("auth_error_description", description);
    return NextResponse.redirect(redirectUrl);
  }

  // #region agent log
  if (isAuthRoute) {
    const host = request.headers.get("host");
    const appBaseUrl = process.env.APP_BASE_URL ?? "";
    const hostMismatch =
      Boolean(host) &&
      Boolean(appBaseUrl) &&
      !appBaseUrl.includes((host ?? "").split(":")[0] ?? "");
    const oauthError = request.nextUrl.searchParams.get("error");
    const oauthErrorDescription =
      request.nextUrl.searchParams.get("error_description");

    agentDebugLog(
      "proxy.ts:auth-entry",
      "Auth route request",
      {
        pathname,
        hasSearch: search.length > 0,
        hasCode: search.includes("code="),
        hasState: search.includes("state="),
        hasError: search.includes("error="),
        oauthError,
        oauthErrorDescription: oauthErrorDescription?.slice(0, 200) ?? null,
        host,
        appBaseUrl,
        hostMismatch,
        cookieNames: request.cookies.getAll().map((cookie) => cookie.name),
      },
      hostMismatch ? "A" : pathname === "/auth/connect" ? "C" : "E"
    );
  }
  // #endregion

  let response: Awaited<ReturnType<typeof auth0.middleware>>;
  try {
    response = await auth0.middleware(request);
  } catch (error) {
    // #region agent log
    agentDebugLog(
      "proxy.ts:auth-middleware-error",
      "Auth middleware threw",
      {
        pathname,
        errorName: error instanceof Error ? error.name : "unknown",
        errorMessage: error instanceof Error ? error.message : String(error),
        errorCode:
          error instanceof Error && "code" in error
            ? String((error as { code?: string }).code)
            : null,
      },
      "E"
    );
    // #endregion
    throw error;
  }

  // #region agent log
  if (isAuthRoute) {
    agentDebugLog(
      "proxy.ts:auth-exit",
      "Auth route response",
      {
        pathname,
        status: response.status,
        redirectLocation: response.headers.get("location")?.slice(0, 200) ?? null,
        setCookieNames: response.headers
          .getSetCookie()
          .map((header) => header.split("=")[0] ?? ""),
      },
      "E"
    );
  }
  // #endregion

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
