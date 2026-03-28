# Anzen — Project Log

## 16. Auth0 Debugging Runbook

When Auth0 login breaks, diagnose in this order:

1. **Get the exact error** — look at the callback URL in the browser address bar, not the error page. The URL contains `error=` and `error_description=` with the real cause.

2. **"state parameter is missing"** — Auth0 middleware is not running. Check:
   - Only `proxy.ts` exists at project root (not `middleware.ts`)
   - `proxy.ts` exports a default function and a `config` matcher
   - Restart dev server after any file changes

3. **"client not authorized to access resource server"** — Application Access not configured. Go to:
   Auth0 Dashboard → APIs → [Your API] → Application Access tab → Find your app → Set User Access and Client Access to Authorized.

4. **"Google OAuth access_denied / 403"** — Google OAuth app is in Testing mode. Go to:
   Google Cloud Console → APIs & Services → OAuth consent screen → Test users → Add your email.

5. **"discovery request failed / ENOTFOUND"** — `AUTH0_DOMAIN` is wrong or the dev server cannot reach Auth0. Check:
   - `AUTH0_DOMAIN` in `.env.local` is set to the domain only (e.g. `dev-xxxx.us.auth0.com`) with no `https://` prefix and no trailing slash
   - Internet connection is up
