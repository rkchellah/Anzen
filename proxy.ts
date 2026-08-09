import { NextResponse, type NextRequest } from "next/server";
import { auth0 } from "./lib/auth0";
import { isAuth0Configured } from "./lib/auth0-env";

const STATIC_ASSETS = new Set([
  "/favicon.ico",
  "/robots.txt",
  "/icon.png",
  "/sitemap.xml",
  "/manifest.json",
]);

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (STATIC_ASSETS.has(pathname)) {
    return NextResponse.next();
  }

  if (!isAuth0Configured()) {
    if (pathname === "/" || pathname.startsWith("/_next")) {
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

  return auth0.middleware(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
