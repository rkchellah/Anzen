# Anzen 安全

> Your AI Chief of Staff — secure, scoped, and always in your control.

Anzen is an AI agent that monitors your GitHub, Gmail, and Slack,
surfaces what needs your attention, and takes action on your behalf —
without ever holding a single credential.

Token Vault by Auth0 holds all OAuth tokens. The agent never sees them.

## Tech Stack
- Next.js 16 + TypeScript
- Vercel AI SDK + GPT-4o
- Auth0 v4 + Token Vault
- GitHub, Gmail, Slack APIs

## Project Structure
```
Anzen/
├── app/
│   ├── api/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── lib/
│   └── auth0.ts
├── middleware.ts
├── public/
├── RULES.md
├── CHECKLIST.md
└── .env.example
```

## Getting Started

### Prerequisites
- Node.js 18+
- Auth0 account
- OpenAI API key
- GitHub, Google, Slack OAuth apps configured

### Installation

1. Clone the repository:
```bash
git clone https://github.com/rkchellah/anzen
cd anzen
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env.local
```

4. Fill in your credentials in `.env.local`

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables
```bash
AUTH0_SECRET=
AUTH0_DOMAIN=
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=
AUTH0_AUDIENCE=https://anzen.api
APP_BASE_URL=http://localhost:3000
ANZEN_AGENT_CLIENT_ID=
ANZEN_AGENT_CLIENT_SECRET=
AUTH0_TOKEN_VAULT_URL=
OPENAI_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Security Model
Every agent action lives in one of three permission tiers:
- 🟢 Watch — read only, granted once at setup
- 🟡 Act — requires session confirmation
- 🔴 Sensitive — requires fresh re-auth every time

## Bug Log

### Bug 001 — Auth0 v4 Breaking Changes
**Error:** `Cannot read properties of undefined (reading 'middleware')`
**Cause:** Auth0 nextjs-auth0 v4 completely changed its API from v3.
- `handleAuth` no longer exists
- `UserProvider` replaced with `Auth0Provider`
- Env variable `AUTH0_ISSUER_BASE_URL` renamed to `AUTH0_DOMAIN`
- Callback URL changed from `/api/auth/callback` to `/auth/callback`
**Fix:** Updated `lib/auth0.ts` with explicit Auth0Client config,
updated all env variable names, updated callback URL in Auth0 dashboard.
Note: middleware file was initially renamed to `proxy.ts` (incorrect — see Bug 008).

### Bug 002 — Callback URL Mismatch
**Error:** `Callback URL mismatch` on Auth0 login page
**Cause:** Auth0 dashboard had old v3 callback URL `/api/auth/callback`
**Fix:** Updated Auth0 dashboard Allowed Callback URLs to
`http://localhost:3000/auth/callback`

### Bug 003 — Auth0 Dashboard Configuration
**Steps required for Token Vault to work:**
- Disabled Refresh Token Rotation in Anzen app settings
- Enabled Token Vault grant type in Advanced Settings
- Created Custom API with identifier https://anzen.api
- Created Custom API Client for token exchanges
- Authorized Anzen app on My Account API with Connected Accounts scopes
- Enabled Allow Skipping User Consent on My Account API
- Enabled Multi-Resource Refresh Token for My Account API

### Bug 004 — AI SDK Tool Typing
**Error:** `Type '() => Promise<...>' is not assignable to type 'undefined'`
**Cause:** Vercel AI SDK `tool` function fails to infer types correctly when `parameters` is an empty object `z.object({})`.
**Fix:** Added a dummy optional parameter `_unused: z.string().optional()` to the Zod schema to force correct type inference.

### Bug 005 — Credentials Accidentally Committed
**Issue:** .env.local was committed to git history exposing all API credentials.
**Fix:** Removed .env.local from git tracking with git rm --cached,
confirmed .gitignore has .env.local entry, rotated all exposed credentials.
**Prevention:** Always run git status before committing to verify
sensitive files are not staged.

### Bug 008 — Authorization Flow Failures (Multi-Stage Investigation)

**Total bugs resolved in this session: 3 root causes**

---

#### Stage 1 — State Parameter Missing
**Error:** `The state parameter is missing`
**Initial suspicion:** Wrong middleware filename
**Investigation:**
- Renamed proxy.ts to middleware.ts — made things worse
- Terminal revealed: "The middleware file convention is deprecated. Please use proxy instead"
- Next.js 16 uses proxy.ts not middleware.ts — the rename was wrong
- Reverted back to proxy.ts
- Root cause was NOT the filename

**Actual cause:** Both proxy.ts and middleware.ts existed at the same time. Next.js detected two conflicting middleware files and crashed, meaning the Auth0 middleware never ran, the state cookie was never written, and the callback failed.

**Fix:** Deleted middleware.ts. Only proxy.ts should exist at the project root.

**Prevention:** Never have both proxy.ts and middleware.ts in the project at the same time. After any file rename, immediately check the terminal output before assuming the fix worked.

---

#### Stage 2 — Client Not Authorized to Access Resource Server
**Error:** `Client "dk9f9EgLnzLW2pW9EBE8kLsaTcXKXWaX" is not authorized to access resource server "https://anzen.api"`
**Cause:** The Anzen application had never been granted access to the Anzen API in the Auth0 dashboard. The Application Access Policy was set to "Allow via client-grant" which means each app must be explicitly authorized — but Anzen was listed as UNAUTHORIZED for both User Access and Client Access.
**Fix:**
1. Auth0 Dashboard → Applications → APIs → Anzen API
2. Click the Application Access tab
3. Find the Anzen app row
4. Click Edit → User Access tab → set to Authorized → Save
5. Click Edit again → Client Access tab → set to Authorized → Save

**Prevention:** When creating a Custom API with "Allow via client-grant" policy, you MUST manually authorize each application that needs to use it. This is not automatic. Always check the Application Access tab after creating a Custom API.

---

#### Stage 3 — Google OAuth Access Blocked
**Error:** `Access blocked: auth0.com has not completed the Google verification process. Error 403: access_denied`
**Cause:** Google Cloud OAuth app is in Testing mode. In testing mode, only explicitly added test users can sign in with Google OAuth.
**Fix:**
1. Go to console.cloud.google.com
2. Select the anzen project
3. APIs & Services → OAuth consent screen
4. Scroll to Test users → Add Users
5. Add all Gmail addresses that need to test the app

**Prevention:** Always add your own email(s) as test users immediately after setting up Google OAuth in testing mode. Do this before testing login.

---

**Key lesson from this session:** Auth0 authorization errors are almost never about the code. They are almost always about dashboard configuration. When you see an Auth0 error, check the dashboard first before touching any code.

### Bug 009 — Anzen App Not Authorized on Custom API
**Error:** `Client "dk9f9EgLnzLW2pW9EBE8kLsaTcXKXWaX" is not authorized to access resource server "https://anzen.api"`
**Cause:** When a Custom API uses "Allow via client-grant" access policy, every application must be manually authorized. The Anzen app had never been granted access.
**Fix:** Auth0 Dashboard → APIs → Anzen API → Application Access tab → Edit Anzen row → set User Access and Client Access both to Authorized → Save.
**Prevention:** After creating any Custom API, immediately go to the Application Access tab and authorize all apps that need to use it. This step is not automatic.

### Bug 010 — Google OAuth Blocked in Testing Mode
**Error:** `Access blocked: auth0.com has not completed the Google verification process. Error 403: access_denied`
**Cause:** Google Cloud OAuth app was in Testing mode with zero test users configured. Any Google account not on the test users list is blocked.
**Fix:** Google Auth Platform → Audience → Test users → Add users → add rkchellah@gmail.com.
**Direct URL:** https://console.cloud.google.com/auth/audience?project=anzen-490720
**Prevention:** Immediately after setting up Google OAuth, add your own Gmail to the test users list before testing login. Never leave test users empty.

### Bug 011 — ChunkLoadError After Successful Auth
**Error:** `Runtime ChunkLoadError: Failed to load chunk /_next/static/chunks/app_layout_tsx_1cf6b850_.js`
**Cause:** Stale Turbopack build cache after multiple dev server restarts and file renames during debugging.
**Fix:** Stop dev server → run `rm -rf .next` → run `npm run dev`. Clean rebuild resolves chunk loading issues.
**Prevention:** When experiencing unexpected client-side errors after structural changes, always try clearing the .next cache before deeper investigation.

### Bug 012 — Auth0 Consent Screen Showing on Every Login
**Note:** Auth0 showing "Authorize App — Anzen is requesting access to your account" is expected behaviour on first login. Users click Accept once and it does not appear again for the same account.