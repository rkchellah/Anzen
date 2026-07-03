# Anzen — Bug Log & Lessons Learned

**Last updated:** 2026-07-04  
**Architecture reference:** [ARCHITECTURE.md](./ARCHITECTURE.md)

This file replaces the old build checklist. It records what broke, what we learned, and what is still open.

---

## What we learned (build + Auth0)

Consolidated from hackathon build notes, Auth0 dashboard work, and post-submission debugging.

### Auth0 Token Vault setup

- Token Vault needs **more dashboard wiring than the docs imply upfront**: disable Refresh Token Rotation on the app, enable Token Vault grant type, create **Anzen API** (`https://anzen.api`), authorize the app on **My Account API** (connected_accounts scopes + MRRT + allow skipping consent), authorize on **Anzen API** (User + Client — **0/0 permissions is normal**), Management API for disconnect.
- Login must request `AUTH0_TOKEN_VAULT_SCOPES=true` scopes **and** `audience=https://anzen.api`, then user must **sign out and sign in again** after enabling.
- `invalid_request` “not authorized to access resource server `https://anzen.api`” means **Application Access toggles OFF** for the Anzen app on that API — not missing API permissions.
- Auth0 **Sign in with Slack** connection name is locked as `sign-in-with-slack` (cannot rename to `slack-oauth2`).
- Logout failed with Auth0 “Oops” when `post_logout_redirect_uri=/` (relative). Auth0 requires **absolute** URLs in Allowed Logout URLs; fixed via `lib/auth-routes.ts` + `proxy.ts`.
- Email/password login failed when using wrong email (`jrkcheilah` vs `rkcheilah`) or when account exists only as **Google identity** (no password). Auth0 Users list shows which connection each email uses.
- Brute-force protection can block repeated wrong password attempts for ~15 minutes.

### Provider refresh tokens (non-obvious)

- **GitHub:** Classic OAuth Apps **never** issue refresh tokens. Need a **GitHub App** with **Expire user authorization tokens** enabled, or Auth0 Token Vault has nothing to store.
- **Slack:** Must enable **Token Rotation** under OAuth & Permissions, or Slack never returns a refresh token.
- Auth0 log `Federated connection Refresh Token not found` for unconnected providers during `/api/status` polling is **expected noise** until Connect completes once per user.

### Auth0 SDK / Next.js

- **Auth0 v4** is a rewrite: `Auth0Client`, `/auth/callback` (not `/api/auth/callback`), `APP_BASE_URL`, Next.js 16 uses **`proxy.ts` only** — a leftover `middleware.ts` breaks the OAuth `state` parameter (`The state parameter is missing`).
- Token Vault tokens: `auth0.getAccessTokenForConnection({ connection })` in `lib/auth0.ts`.
- Connect flow: `/auth/connect` → Auth0 Connected Accounts (requires `enableConnectAccountEndpoint: true`).

**Auth0 v4 is a complete rewrite, not an upgrade.** Started with v3 patterns — `handleAuth`, `UserProvider`, `AUTH0_ISSUER_BASE_URL`, callback at `/api/auth/callback`. None of it exists in v4. The library now uses `Auth0Client`, env variables renamed, callback moved to `/auth/callback`, and Next.js 16's `proxy.ts` replaces `middleware.ts`. The error (`Cannot read properties of undefined (reading 'middleware')`) points at the wrong thing; you have to know the API changed wholesale to find the right fix.

**Two middleware files silently break Auth0's state parameter.** Next.js 16 expects `proxy.ts` at the project root. A leftover `middleware.ts` alongside it broke routing in a way that ate `state` before the callback could read it — error: `The state parameter is missing`. Fix: delete `middleware.ts`. Only `proxy.ts` should exist.

### AI SDK / agent

- **AI SDK v6:** use `sendMessage({ text })`, not `append`; message text lives in **`message.parts`**, not `message.content` string.
- Hackathon shortcut: mock data in `agent/tools/*.ts` when Token Vault was broken — **removed**; tools now log and throw (see resolved entries below).

**AI SDK v6 changed messages and send API.** Two invisible bugs: `append({ role, content })` no longer exists — v6 uses `sendMessage({ text })`. Message content is no longer `message.content` as a string — it's in `message.parts` as an array. Even after fixing send, messages didn't render until reading the v6 source.

### Security incident

- `.env.local` was committed once; fix: `git rm --cached .env.local`, rotate all keys, always `git status` before commit.

**Committed `.env.local` to git.** Ran `git add .` before confirming `.gitignore`, pushed, credentials in public history. Fix: `git rm --cached .env.local`, rotate every key. Prevention: `git status` before every commit.

---

## GitHub Token Vault — missing refresh token

**File:** Auth0 logs / `lib/auth0.ts` (Token Vault exchange for `github` connection)  
**Found:** Auth0 repeatedly logged `Failed Exchange — Federated connection Refresh Token not found — github`. Connect flow could appear to succeed at the UI level while Token Vault never stored a usable refresh token, so `getAccessTokenForConnection({ connection: "github" })` failed and the agent could not call GitHub.  
**Root cause:** This took several failed attempts to figure out, because GitHub's classic OAuth Apps never issue refresh tokens — only a GitHub App with **"Expire user authorization tokens"** enabled does. The Auth0 error text (`Refresh Token not found`) did not point to that; it required reading the raw Auth0 error closely and checking GitHub's own OAuth docs. Without a provider-issued refresh token, Auth0 Token Vault has nothing to store or exchange.  
**Fix:** Use a GitHub App (not a classic OAuth App) with expiring user tokens enabled; configure the Auth0 `github` connection with that app's credentials and **Connected Accounts for Token Vault** purpose; complete Connect GitHub once per user after login.  
**Severity:** high  
**Status:** Resolved

---

## Slack Token Vault — missing refresh token

**File:** Auth0 logs / `lib/auth0.ts` (Token Vault exchange for `sign-in-with-slack` connection)  
**Found:** Same Auth0 pattern: `Failed Exchange — Federated connection Refresh Token not found — sign-in-with-slack`. Dashboard status polling and connect attempts failed until Slack was configured to actually return refresh tokens.  
**Root cause:** Also non-obvious from the error message alone. Slack requires a separate **Token Rotation** setting turned on under **OAuth & Permissions** in the Slack app settings; without it, Slack never returns a refresh token. Like GitHub, this only became clear after reading Auth0's raw error text and Slack's provider docs — not from the generic "Refresh Token not found" log line.  
**Fix:** Create/use the Anzen Slack app with Token Rotation enabled; Auth0 **Sign in with Slack** connection (`sign-in-with-slack`) with Connected Accounts purpose; install app to workspace; Connect Slack from the dashboard.  
**Severity:** high  
**Status:** Resolved

---

## GitHub tools — silent mock issues on API/token failure

**File:** `agent/tools/github.ts:31–35` (original); now uses `rethrowToolError`  
**Found:** `listAssignedIssues` wrapped the real Octokit call in `try/catch`. On any failure, the catch returned two hardcoded issues (`#42 Fix Token Vault integration`, `#38 Add step-up authentication flow` in `rkchellah/Anzen`) with no log and no user-visible error. The chat agent treated them as real data.  
**Context:** Added during the hackathon build under deadline pressure, when Token Vault was not working yet and there was not time to fix the real GitHub integration before submission. This was a shortcut to make the demo look functional — not a real fix.  
**Fix:** Removed fake issue arrays entirely. On failure, `console.error("[listAssignedIssues]", error)` and re-throw so the LLM surfaces an honest error in chat.  
**Severity:** high  
**Status:** Resolved

---

## Gmail tools — silent mock emails on token exchange failure

**File:** `agent/tools/gmail.ts:17–26` (original); now uses `rethrowToolError`  
**Found:** `listUnreadEmails` caught `exchangeTokenForProvider` failures and returned fake emails from `adam@auth0.com` and `team@devpost.com` (hackathon submission reminder). Users and the model saw these as real unread mail.  
**Context:** Same hackathon deadline shortcut as GitHub/Slack — Token Vault was broken at demo time, and fake inbox data was substituted so the "Summarize my unread emails" demo path appeared to work. Plainly not production behavior.  
**Fix:** Removed fake email payloads. Entire list flow wrapped in try/catch that logs `[listUnreadEmails]` and re-throws on token or Gmail API failure.  
**Severity:** high  
**Status:** Resolved

---

## Slack tools — silent mock channels on API/token failure

**File:** `agent/tools/slack.ts:25–31` (original); now uses `rethrowToolError`  
**Found:** `listChannels` caught any error and returned hardcoded `#general` (C001) and `#anzen-dev` (C002). No logging; silent fake success.  
**Context:** Added for the same reason as GitHub and Gmail mock fallbacks — Slack Token Vault was not connected before submission, and the demo needed to show channel listing without a working integration. A presentation shortcut, not a fix.  
**Fix:** Removed fake channel arrays. On failure, `console.error("[listChannels]", error)` and re-throw.  
**Severity:** high  
**Status:** Resolved

---

## GitHub tools — inconsistent error handling (read mocked, write real)

**File:** `agent/tools/github.ts:51–61`, `agent/tools/github.ts:76–85`  
**Found:** `closeIssue` and `commentOnIssue` always called the real API (would fail loudly), while `listAssignedIssues` alone returned fake data on error. Reads could lie; writes would fail.  
**Fix:** Resolved together with the mock removal — all GitHub tools now propagate real errors.  
**Severity:** medium  
**Status:** Resolved

---

## Auth0 v4 migration — wrong patterns from v3

**File:** `proxy.ts`, `lib/auth0.ts`, removed `middleware.ts`  
**Found:** v3 patterns (`handleAuth`, `UserProvider`, `/api/auth/callback`, `AUTH0_ISSUER_BASE_URL`) do not exist in v4. Dual `middleware.ts` + `proxy.ts` caused missing OAuth `state` on callback.  
**Fix:** Single `proxy.ts` with `Auth0Client`; callback at `/auth/callback`; env uses `AUTH0_DOMAIN` + `APP_BASE_URL`.  
**Severity:** high  
**Status:** Resolved

---

## Logout — relative post_logout_redirect_uri rejected by Auth0

**File:** `app/dashboard/DashboardClient.tsx`, `proxy.ts`, `lib/auth-routes.ts`  
**Found:** `/auth/logout?returnTo=/` sent `post_logout_redirect_uri=%2F` → Auth0 400 “Oops, something went wrong.”  
**Fix:** Build absolute logout URLs (`http://localhost:3000`); proxy rewrites relative `returnTo` before Auth0 sees it.  
**Severity:** high  
**Status:** Resolved

---

## Anzen API — application not authorized (login blocked)

**File:** Auth0 dashboard · `lib/auth0-scopes.ts`  
**Found:** `invalid_request`: Client not authorized to access resource server `https://anzen.api` when `AUTH0_TOKEN_VAULT_SCOPES=true`.  
**Fix:** Anzen API → Application Access → enable **Anzen** app for User-delegated + Client access (empty permission list is OK).  
**Severity:** high  
**Status:** Resolved

---

## Dashboard History — hardcoded “Success” on every row

**File:** `app/dashboard/DashboardClient.tsx:566`  
**Found:** History / “Audit Logs” table shows a green **Success** badge on every row regardless of tool outcome or chat errors.  
**Fix:** Derive status from tool results / message metadata, or remove the Status column until real audit data exists.  
**Severity:** high  
**Status:** open

---

## Dashboard History — fake timestamps

**File:** `app/dashboard/DashboardClient.tsx:565`  
**Found:** Each row uses `new Date().toLocaleTimeString()` at render time instead of the message's actual timestamp.  
**Fix:** Use message `createdAt` from the chat API or persisted audit event timestamps.  
**Severity:** medium  
**Status:** open

---

## Dashboard History — mislabeled chat transcript as audit log

**File:** `app/dashboard/DashboardClient.tsx:521–571`  
**Found:** Tab titled **Audit Logs** claims “Every action Anzen takes on your behalf is recorded here,” but only shows in-memory `useChat` text. Tool calls are not logged separately; data is lost on refresh.  
**Fix:** Persist server-side audit events (provider, action, args, result, time) or rename to “Chat history” and drop audit claims.  
**Severity:** high  
**Status:** open

---

## Landing page — “Review and approve” not implemented

**File:** `app/page.tsx:212–214`  
**Found:** Copy promises users can “Review and approve before the agent takes any sensitive action.” No approval UI or step-up gate exists; tools run immediately when the LLM invokes them.  
**Fix:** Implement approval flow for destructive tools, or remove the claim.  
**Severity:** high  
**Status:** open

---

## Landing page — “with your permission, every time” inaccurate

**File:** `app/page.tsx:216–217`  
**Found:** ACT card says actions happen “with your permission, every time.” No per-action consent prompts.  
**Fix:** Add confirmation before side effects, or align marketing copy with behavior.  
**Severity:** medium  
**Status:** open

---

## Landing page — always-on “agent / ready” badge

**File:** `app/page.tsx:169–171`  
**Found:** Green **agent / ready** shown to all visitors even when logged out, Auth0 misconfigured, or no providers connected.  
**Fix:** Drive badge from `/api/status` / setup checks, or use neutral copy when not ready.  
**Severity:** medium  
**Status:** open

---

## Dashboard — “Coming soon” provider placeholders

**File:** `app/dashboard/DashboardClient.tsx:229–235`, `508–517`  
**Found:** Teams, LinkedIn, GitLab, Notion, Linear shown in UI with no backend — labeled “Soon.”  
**Fix:** Keep as roadmap UI (clearly non-functional) or remove until implemented.  
**Severity:** low  
**Status:** open

---

## Dashboard — demo suggestion chips

**File:** `app/dashboard/DashboardClient.tsx:75–79`  
**Found:** Hardcoded `SUGGESTIONS` pre-fill chat input with demo prompts that invoke agent tools.  
**Fix:** Optionally disable suggestions when a provider is disconnected.  
**Severity:** low  
**Status:** open

---

## Proxy — temporary auth debug instrumentation

**File:** `proxy.ts:5–28`, `82–98`, `119–140`  
**Found:** `#region agent log` POSTs to local debug ingest on auth routes; failures swallowed with `.catch(() => {})`.  
**Fix:** Remove or gate behind development-only flag before production.  
**Severity:** low  
**Status:** open

---

## Dashboard — debug console.log on every message

**File:** `app/dashboard/DashboardClient.tsx:108`  
**Found:** `getMessageText` logs `MSG:` JSON to browser console on every message parse.  
**Fix:** Remove or guard behind debug flag.  
**Severity:** low  
**Status:** open

---

## Auth error copy — stale “Anzen Local” name

**File:** `app/page.tsx:158–159`  
**Found:** Setup error helper references **Anzen Local**; Auth0 app is named **Anzen**.  
**Fix:** Use correct app name or generic “your Anzen application.”  
**Severity:** low  
**Status:** open

---

## Summary

| Status | Count |
|--------|-------|
| **Resolved** | 11 |
| **Open** | 11 |

**See also:** [ARCHITECTURE.md](./ARCHITECTURE.md) for how Auth0 Token Vault fits together in this repo.
