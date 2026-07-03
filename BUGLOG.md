# Anzen — Bug Log

**Last updated:** 2026-07-04  
**Scope:** Auth0 Token Vault integration, agent tools, dashboard/UI honesty, debug leftovers.

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
**Fix:** Optionally disable suggestions when a provider is disconnected; mock fallbacks that hid failures are already removed.  
**Severity:** low  
**Status:** open

---

## Chat API — system prompt (informational)

**File:** `app/api/chat/route.ts:28–32`  
**Found:** Static system prompt for Anzen agent behavior. Normal LLM config — not mock API data.  
**Fix:** Update prompt if/when approval flow or error-handling UX changes.  
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
| **Resolved** | 7 |
| **Open** | 12 |

**Resolved:** GitHub/Slack refresh-token root causes (provider OAuth config); all three agent tool mock fallbacks and inconsistent GitHub read/write handling.

**Open:** Dashboard audit-log honesty, landing-page claims, debug leftovers, minor copy/UI items.
