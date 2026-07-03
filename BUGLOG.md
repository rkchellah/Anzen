# Anzen — Hackathon Demo / Mock Data Audit

**Audit date:** 2026-07-04  
**Scope:** Hardcoded, mocked, fallback demo data; silent catch blocks; fake UI behavior; skipped API calls; TODO/FIXME/HACK comments.  
**Status:** Documentation only — no fixes applied in this pass.

---

## GitHub tools — silent mock issues on API/token failure

**File:** `agent/tools/github.ts:31–35`  
**Found:** `listAssignedIssues` wraps the real Octokit call in `try/catch`. On any failure (missing GitHub Token Vault connection, bad token, API error), the catch returns two hardcoded issues: `#42 Fix Token Vault integration` and `#38 Add step-up authentication flow` in repo `rkchellah/Anzen`. No error is logged or surfaced to the user or LLM.  
**Should be:** Propagate the error (throw or return a structured `{ error: string }`) so the agent tells the user GitHub is not connected or the call failed. Never return fabricated issue data.  
**Severity:** high  
**Status:** open

---

## Gmail tools — silent mock emails on token exchange failure

**File:** `agent/tools/gmail.ts:17–26`  
**Found:** `listUnreadEmails` catches failures from `exchangeTokenForProvider` only and returns two fake emails: one from `adam@auth0.com` (Token Vault support ticket) and one from `team@devpost.com` (hackathon submission reminder). The LLM and user see these as real unread mail.  
**Should be:** Throw or return an explicit error when Token Vault exchange fails (e.g. “Gmail not connected”). If the Gmail API fails after a valid token, handle that separately with a real error — do not substitute demo emails.  
**Severity:** high  
**Status:** open

---

## Slack tools — silent mock channels on API/token failure

**File:** `agent/tools/slack.ts:25–31`  
**Found:** `listChannels` catches any error from token exchange or `conversations.list` and returns hardcoded channels `#general` (id `C001`, 12 members) and `#anzen-dev` (id `C002`, 3 members). No logging or user-visible failure.  
**Should be:** Fail loudly when Slack is not connected or the API errors. Return real channel data from Slack or an error object the agent can relay.  
**Severity:** high  
**Status:** open

---

## GitHub tools — partial mock coverage (write tools unguarded)

**File:** `agent/tools/github.ts:51–61`, `agent/tools/github.ts:76–85`  
**Found:** `closeIssue` and `commentOnIssue` call the real GitHub API with no mock fallback (correct), but `listAssignedIssues` alone fakes success. Demo behavior is inconsistent: reads can lie while writes would fail.  
**Should be:** All GitHub tools should share the same error-handling policy — real API or explicit failure, never mixed.  
**Severity:** medium  
**Status:** open

---

## Dashboard History — hardcoded “Success” on every row

**File:** `app/dashboard/DashboardClient.tsx:566`  
**Found:** The History / “Audit Logs” table renders a green **Success** badge on every message row regardless of outcome. Failed tool calls, errors, or partial failures are not reflected.  
**Should be:** Derive status from actual tool results / chat metadata (success, error, pending), or remove the Status column until real audit data exists.  
**Severity:** high  
**Status:** open

---

## Dashboard History — fake timestamps

**File:** `app/dashboard/DashboardClient.tsx:565`  
**Found:** Each history row displays `new Date().toLocaleTimeString()` at render time, not the message’s actual timestamp. All rows show the current clock time, not when the action occurred.  
**Should be:** Use message `createdAt` / `timestamp` from the chat API if available, or persist audit events with real timestamps.  
**Severity:** medium  
**Status:** open

---

## Dashboard History — mislabeled chat transcript as audit log

**File:** `app/dashboard/DashboardClient.tsx:521–571`  
**Found:** Tab is titled **Audit Logs** with copy “Every action Anzen takes on your behalf is recorded here,” but it only lists in-memory `useChat` messages (user/assistant text). Tool invocations (close issue, send email, post Slack message) are not stored or displayed as separate audit entries. Data is lost on refresh.  
**Should be:** Persist tool-call audit events server-side (provider, action, args, result, timestamp) and render those — or rename UI to “Chat history” and drop audit claims.  
**Severity:** high  
**Status:** open

---

## Landing page — “Review and approve” feature not implemented

**File:** `app/page.tsx:212–214`  
**Found:** Marketing copy states users can “Review and approve before the agent takes any sensitive action.” There is no approval UI, step-up auth gate, or confirmation step before `closeIssue`, `sendEmail`, or `postMessage` run. Tools execute immediately when the LLM calls them.  
**Should be:** Implement an approval flow (or remove the claim). Sensitive tools should require explicit user confirmation before side effects.  
**Severity:** high  
**Status:** open

---

## Landing page — “with your permission, every time” is inaccurate

**File:** `app/page.tsx:216–217`  
**Found:** ACT feature card claims actions happen “with your permission, every time.” Agent tools run without per-action permission prompts.  
**Should be:** Align copy with behavior, or add permission prompts / OAuth-style consent per destructive action.  
**Severity:** medium  
**Status:** open

---

## Landing page — always-on “agent / ready” status badge

**File:** `app/page.tsx:169–171`  
**Found:** Green **agent / ready** indicator is shown on the public landing page for all visitors, including when Auth0 is misconfigured, user is logged out, or no providers are connected. Status is not derived from `/api/status` or setup checks.  
**Should be:** Show readiness only when authenticated and providers are verifiably connected, or use neutral copy (e.g. “agent / setup required”).  
**Severity:** medium  
**Status:** open

---

## Dashboard — “Coming soon” providers are non-functional placeholders

**File:** `app/dashboard/DashboardClient.tsx:229–235`, `app/dashboard/DashboardClient.tsx:508–517`  
**Found:** Teams, LinkedIn, GitLab, Notion, and Linear appear in the Connections UI with logos but no backend integration — opacity reduced and labeled “Soon.” Not returned as fake API data, but presents a broader integration surface than exists.  
**Should be:** Acceptable for roadmap UI if clearly non-clickable; otherwise remove until implemented to avoid implying capability.  
**Severity:** low  
**Status:** open

---

## Dashboard — demo suggestion chips (prompt helpers)

**File:** `app/dashboard/DashboardClient.tsx:75–79`  
**Found:** Hardcoded `SUGGESTIONS` array pre-fills the chat input with demo prompts (“What GitHub issues are assigned to me?”, etc.). These can trigger tool calls that hit mock fallbacks when providers are disconnected.  
**Should be:** Keep as UX helpers only if tool mocks are removed; optionally disable suggestions when provider status is disconnected.  
**Severity:** low  
**Status:** open

---

## Chat API — system prompt (not fake data; noted for completeness)

**File:** `app/api/chat/route.ts:28–32`  
**Found:** Static system prompt describing Anzen as a Token Vault agent. This is normal LLM configuration, not demo/mock API data. No canned assistant responses are hardcoded in the route.  
**Should be:** No change required for mock audit; prompt may need updates if approval flow is added.  
**Severity:** low  
**Status:** open

---

## Proxy — temporary auth debug instrumentation

**File:** `proxy.ts:5–28`, `proxy.ts:82–98`, `proxy.ts:119–140`  
**Found:** `#region agent log` blocks POST debug payloads to `http://127.0.0.1:7577/ingest/...` on every auth route. Failures are swallowed with `.catch(() => {})`. Leftover from debugging session (`runId: "pre-fix"`).  
**Should be:** Remove before production or gate behind `NODE_ENV === "development"` and a feature flag.  
**Severity:** low  
**Status:** open

---

## Dashboard — debug `console.log` on every message render

**File:** `app/dashboard/DashboardClient.tsx:108`  
**Found:** `getMessageText` logs `MSG:` + JSON snippet to the browser console for every message parsed in chat and history views.  
**Should be:** Remove or guard behind a debug flag.  
**Severity:** low  
**Status:** open

---

## Auth error copy — stale app name “Anzen Local”

**File:** `app/page.tsx:158–159`  
**Found:** Error helper text references **Anzen Local** on My Account API setup; production app is named **Anzen**. Misleading for setup, not fake API data.  
**Should be:** Use the actual Auth0 application name from env or generic “your Anzen application.”  
**Severity:** low  
**Status:** open

---

## TODO / FIXME / HACK / temp comments

**File:** _(none found)_  
**Found:** No `TODO`, `FIXME`, `HACK`, or `temp` comments in `.ts`/`.tsx` source files. Temporary debug markers exist as `#region agent log` and `runId: "pre-fix"` in `proxy.ts` (see entry above).  
**Should be:** N/A  
**Severity:** low  
**Status:** open

---

## Summary

| Severity | Count |
|----------|-------|
| **high** | 6 |
| **medium** | 4 |
| **low** | 6 |

**Critical pattern:** All three agent tool files (`github.ts`, `gmail.ts`, `slack.ts`) use **silent catch → fake data** on read/list operations, which makes the demo appear functional when Token Vault or provider APIs are not connected. This is the highest-priority fix area.

**Next step:** Fix entries one at a time, starting with agent tool mock fallbacks (high severity, silent failure).
