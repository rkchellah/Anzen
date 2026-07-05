# Anzen — Session Handover

**Last updated:** 2026-07-05  
**Purpose:** Onboard a fresh chat/agent session without re-discovering Auth0, Token Vault, or production-hardening context.

---

## Project in one sentence

**Anzen** is a Next.js 16 AI Chief of Staff that uses **Auth0 Token Vault** (never stores provider credentials) + **Groq** (LLaMA 3.3 70B) + **Vercel AI SDK v6** to read/act on **GitHub, Gmail, and Slack** on the user's behalf.

- **Dev URL:** `http://localhost:3000`
- **Docs:** `ARCHITECTURE.md` (Auth0 flows), `BUGLOG.md` (bugs/lessons), `GOAL.md` (production hardening roadmap)
- **Do not edit `README.md`** per `GOAL.md` ground rules — use `BUGLOG.md` for findings/fixes

---

## Stack

| Layer | Tech |
|--------|------|
| Frontend | Next.js 16, React 19, inline styles (no shadcn in dashboard) |
| Auth | `@auth0/nextjs-auth0` v4, `proxy.ts` middleware |
| Agent | `ai` v6, `@ai-sdk/groq`, `@ai-sdk/react` `useChat` |
| APIs | Octokit, googleapis (Gmail), `@slack/web-api` |
| Hosting target | Vercel |

---

## Auth0 / Token Vault (critical)

### Tenant & app (from prior sessions)

- **Domain:** `dev-2fnbnagqivvy3y4d.us.auth0.com`
- **App client ID:** `gbUeOd5OL7hzVKssVbRmF5ojDVZD4zGQ`
- **Custom API audience:** `https://anzen.api`
- **My Account API audience:** `https://{AUTH0_DOMAIN}/me/`

### Connection names (must match exactly)

| UI | Auth0 connection |
|----|------------------|
| GitHub | `github` |
| Gmail | `google-oauth2` |
| Slack | `sign-in-with-slack` (fixed name — not `slack-oauth2`) |

### Env (`.env.local` — not committed)

```bash
AUTH0_SECRET=
AUTH0_DOMAIN=
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=
AUTH0_AUDIENCE=https://anzen.api
AUTH0_TOKEN_VAULT_SCOPES=true   # required for connect/disconnect scopes
APP_BASE_URL=http://localhost:3000
GROQ_API_KEY=
```

After enabling `AUTH0_TOKEN_VAULT_SCOPES=true`, user must **sign out and sign in again**.

### Auth0 dashboard requirements (manual)

- Disable **Refresh Token Rotation** on Anzen app (Token Vault requirement)
- Enable **Token Vault** grant type (Advanced Settings)
- Authorize app on **My Account API** with `read/create/delete:me:connected_accounts` + MRRT
- Authorize app on **Anzen API** (User + Client — 0/0 permissions is OK)
- **GitHub:** GitHub **App** with expiring user tokens (not classic OAuth App)
- **Slack:** **Token Rotation** enabled in Slack app OAuth settings

See `ARCHITECTURE.md` and resolved entries in `BUGLOG.md` for war stories.

---

## Key flows (code map)

| Flow | Route / file |
|------|----------------|
| Login | `/auth/login` → `proxy.ts` → `lib/auth0.ts` |
| Connect provider | `/auth/connect?connection=…` → `lib/auth-connections.ts` |
| Disconnect | `POST /api/auth/disconnect` → `lib/my-account-api.ts` (My Account API, **not** Management API) |
| Connection status | `GET /api/status` → My Account API when scopes enabled, else token probe fallback |
| Chat agent | `POST /api/chat` → `agent/tools/*.ts` |
| Logout | `lib/auth-routes.ts` (`buildLogoutUrl`) — **absolute** `returnTo` URLs required |

---

## Agent tools

### Read (immediate, no confirmation)

- `listAssignedIssues` — GitHub
- `listUnreadEmails` — Gmail
- `listChannels` — Slack

### Write (Phase 1 — `needsApproval: true`)

- `closeIssue`, `commentOnIssue` — GitHub
- `sendEmail` — Gmail
- `postMessage` — Slack

Confirmation UI: `app/dashboard/DashboardClient.tsx` + `agent/action-descriptions.ts`  
Uses AI SDK v6 `addToolApprovalResponse` + `lastAssistantMessageIsCompleteWithApprovalResponses`.

Mock/fake data in tools was **removed** — failures log + throw via `rethrowToolError`.

---

## Work completed this session arc

### Auth & connections

- [x] Token Vault connect flow working (Gmail confirmed connected in logs)
- [x] Logout fix (absolute URLs in `lib/auth-routes.ts` + `proxy.ts`)
- [x] Slack connection name → `sign-in-with-slack` across codebase
- [x] **Disconnect rewrite:** My Account API list/delete (`lib/my-account-api.ts`), not Management API M2M
- [x] Disconnect UI: loading state + error banner
- [x] Status API aligned with My Account API (fixes false “connected” when token probe succeeds but no linked account — e.g. Slack edge case)

### Docs & cleanup

- [x] `ARCHITECTURE.md` created (canonical Auth0 map)
- [x] `BUGLOG.md` — checklist learnings consolidated; `CHECKLIST.md` deleted
- [x] `RULES.md` gitignored (local only)
- [x] Mock data removed from `agent/tools/github.ts`, `gmail.ts`, `slack.ts`

### GOAL.md production hardening

- [x] **Phase 1 complete** — write-action confirmation gate (user approved)
- [x] **Phase 2 complete** — prompt injection boundaries (`<untrusted_external_content>` + system prompt)
- [x] **Phase 3 complete** — graceful failure states (plain-language errors + reconnect links)
- [x] **Phase 4 complete** — per-tool read/write toggles (file store + optional Upstash Redis)
- [x] **Phase 5 complete** — chat rate limit (20/min when Redis set) + `.gitleaks.toml`
- [x] **Phase 6 complete** — real audit trail + History tab from `/api/audit`
- [x] **Phase 7 helper** — `scripts/verify-data-isolation.mjs` (manual sign-off by owner)
- [x] **Phase 8 complete** — `/privacy`, `/terms`, Groq disclosure, connect/landing links
- [ ] **Phase 9** — public distribution (manual only — owner)

---

## GOAL.md roadmap (remaining)

| Phase | Topic | Notes |
|-------|--------|--------|
| **2** | Prompt injection boundaries | **Done** — `agent/wrap-untrusted-content.ts` + read tools + system prompt |
| **3** | Graceful failure states | **Done** — `lib/tool-errors.ts` + tool error UI with reconnect |
| **4** | Per-tool read/write toggles | **Done** — `lib/permissions*.ts`, `/api/permissions`, Connections UI |
| **5** | Rate limiting + gitleaks | **Done** — skips limit locally if no Redis |
| **6** | Real audit trail | **Done** — `lib/audit-log.ts`, History tab |
| **7** | Data isolation verification | **Helper only** — run `npm run verify:isolation`; owner marks done |
| **8** | Privacy/terms pages | **Done** — `/privacy`, `/terms` |
| **9** | Public distribution | **Manual** — GitHub App, Slack review, Google OAuth |

### GOAL ground rules (always apply)

1. One phase at a time; wait for explicit **“approve Phase N”**
2. Never edit `README.md`; document in `BUGLOG.md`
3. Never reintroduce mock/fake data
4. Never hardcode secrets
5. Show full diff summary after each phase
6. Stop and ask for manual dashboard steps — don't guess

---

## Open BUGLOG items (still open)

| Issue | Severity |
|--------|----------|
| Landing — always-on “agent / ready” badge | medium |
| Landing — stale “Anzen Local” in auth error copy | low |
| Dashboard — “Coming soon” provider placeholders | low |
| Dashboard — demo suggestion chips when disconnected | low |
| `proxy.ts` — debug `#region agent log` instrumentation | low |

**Note:** `getMessageText` console.log was removed during Phase 1; BUGLOG entry may still say open — can mark resolved.

---

## Known quirks / gotchas

1. **Status vs disconnect mismatch:** `/api/status` now prefers My Account API. If UI shows “not connected” but old token probe would pass, user needs to **Connect** again via Connections tab.
2. **Slack disconnect 404:** Happened when token exchange worked but no My Account linked account existed — fixed by status source-of-truth change + list-all-accounts lookup with aliases.
3. **Auth0 logs:** `Refresh Token not found` for **unconnected** providers during polling is expected noise.
4. **`npm run build` fails** on pre-existing `proxy.ts:89` — dev server works.
5. **README “Sensitive” tier** (fresh re-auth every time) is **not** in GOAL phases — only Phase 1 session confirmation exists today.

---

## Key files (quick reference)

```
proxy.ts                      Auth0 middleware; logout URL rewrite; debug logs (remove before prod)
lib/permissions-store.ts       Phase 4 — per-user access mode persistence
lib/permissions.ts             Access mode types + defaults
lib/tool-permissions.ts        Server-side write gate
app/api/permissions/route.ts   GET/PATCH user permissions
lib/auth0.ts                  Auth0Client + exchangeTokenForProvider
lib/auth0-scopes.ts           Login scopes + AUTH0_TOKEN_VAULT_SCOPES gating
lib/auth-connections.ts       Connect URLs; PROVIDER_CONNECTION_ALIASES
lib/my-account-api.ts         List/delete connected accounts (disconnect)
lib/auth-routes.ts            buildLogoutUrl (absolute URLs)
app/api/chat/route.ts         Groq streamText + tools
app/api/status/route.ts       Connection probe (My Account API first)
app/api/auth/disconnect/route.ts
app/dashboard/DashboardClient.tsx   Chat, Connections, History, Phase 1 confirm UI
agent/wrap-untrusted-content.ts  Phase 2 — wrap read-tool output for model
agent/action-descriptions.ts  Write-tool plain-language summaries
agent/tools/github.ts | gmail.ts | slack.ts
ARCHITECTURE.md | BUGLOG.md | GOAL.md | HANDOVER.md (this file)
```

---

## Suggested next steps for fresh chat

1. **If continuing GOAL.md:** User should say **“approve Phase 5”** → rate limiting + gitleaks (requires Upstash Redis env on Vercel).
2. **If fixing build:** One-line null guard in `proxy.ts:89`.
3. **If testing Phase 4:** Set GitHub to Read only in Connections, ask bot to close an issue — confirm blocked with clear message (no API attempt before server check on confirm).
4. **Production storage:** Set `KV_REST_API_URL` + `KV_REST_API_TOKEN` for durable permissions on Vercel (local dev uses `.data/`).

---

## Decisions pending from owner

- **Storage** for Phase 4 permissions + Phase 6 audit (not chosen)
- **Rate limit** cap for Phase 5 (GOAL says confirm with owner)
- **README “Sensitive” tier** — implement step-up re-auth or leave as marketing-only

---

## Git / workflow

- Conventional commits; GitLab issue refs if applicable
- Do **not** commit `.env.local`
- Do **not** commit unless user explicitly asks
- `RULES.md` is local-only (gitignored)
