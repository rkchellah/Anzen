# Anzen 安全

> The AI agent that acts on your behalf — without ever touching your credentials.

Anzen connects to your GitHub, Gmail, and Slack and takes action on your behalf.
Every OAuth token is sealed inside Auth0 Token Vault. Anzen never sees them,
never stores them, and never will. You stay in control. Always.

## Live Demo
🔗 [anzen.vercel.app](https://anzen.vercel.app) <!-- update with real URL -->

## Tech Stack
- Next.js 16 + TypeScript
- Vercel AI SDK + Groq (llama-3.3-70b-versatile)
- Auth0 v4 (nextjs-auth0) + Token Vault
- GitHub API (Octokit), Gmail API (googleapis), Slack API (@slack/web-api)
- Deployed on Vercel

## Project Structure
```
Anzen/
├── app/
│   ├── api/
│   │   ├── chat/route.ts         — AI agent chat endpoint (Groq + tools)
│   │   ├── status/route.ts       — Connection status checker
│   │   └── auth/disconnect/      — Provider disconnect endpoint
│   ├── dashboard/
│   │   ├── page.tsx              — Dashboard server component
│   │   └── DashboardClient.tsx   — Full dashboard UI (chat, connections, audit log)
│   ├── layout.tsx
│   ├── page.tsx                  — Landing / login page
│   └── globals.css
├── agent/
│   └── tools/
│       ├── github.ts             — GitHub tools (list issues, close, comment)
│       ├── gmail.ts              — Gmail tools (list unread, send)
│       └── slack.ts              — Slack tools (list channels, post message)
├── lib/
│   └── auth0.ts                  — Auth0 client + Token Vault token fetcher
├── proxy.ts                      — Auth0 middleware (Next.js 16)
├── public/
├── RULES.md
├── CHECKLIST.md
└── .env.example
```

## Getting Started

### Prerequisites
- Node.js 18+
- Auth0 account with Token Vault enabled
- Groq API key (free at console.groq.com)
- GitHub, Google, Slack OAuth apps configured in Auth0

### Installation

1. Clone the repository:
```bash
git clone https://github.com/rkchellah/Anzen
cd Anzen
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
GROQ_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## How Token Vault Works
1. User logs in with Google via Auth0
2. User connects GitHub, Gmail, and Slack via OAuth — tokens stored in Auth0 Token Vault
3. When the agent needs to call an API, it calls `getTokenForProvider(provider)` which exchanges the Auth0 refresh token for a live third-party access token
4. The token is used immediately and never stored in the app
5. Anzen never sees or stores any credentials

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

### Bug 002 — Callback URL Mismatch
**Error:** `Callback URL mismatch` on Auth0 login page
**Cause:** Auth0 dashboard had old v3 callback URL `/api/auth/callback`
**Fix:** Updated Auth0 dashboard Allowed Callback URLs to `http://localhost:3000/auth/callback`

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
**Cause:** Vercel AI SDK `tool` function fails to infer types when explicit return type annotations are added to `execute`.
**Fix:** Removed explicit return type annotations and `.optional()` before `.default()` on Zod schemas. Let TypeScript infer.

### Bug 005 — Credentials Accidentally Committed
**Issue:** .env.local was committed to git history exposing all API credentials.
**Fix:** Removed .env.local from git tracking, confirmed .gitignore entry, rotated all exposed credentials.

### Bug 006 — AI SDK v6 sendMessage API
**Error:** `append is not a function`
**Cause:** AI SDK v6 (@ai-sdk/react v3) uses `sendMessage({ text })` not `append({ role, content })`.
**Fix:** Updated `useChat` destructure and `handleSend` to use `sendMessage({ text })`.

### Bug 007 — Message Rendering (AI SDK v6 message format)
**Issue:** Messages not rendering on screen after send.
**Cause:** AI SDK v6 stores message content in `message.parts` array, not `message.content` string.
**Fix:** Updated `getMessageText()` to read from `parts` array, handle tool call states, and fall back gracefully.

### Bug 008 — Authorization Flow Failures (Multi-Stage)

#### Stage 1 — State Parameter Missing
**Error:** `The state parameter is missing`
**Cause:** Both proxy.ts and middleware.ts existed simultaneously — conflicting middleware files.
**Fix:** Deleted middleware.ts. Only proxy.ts should exist at project root.

#### Stage 2 — Client Not Authorized to Access Resource Server
**Error:** `Client is not authorized to access resource server "https://anzen.api"`
**Fix:** Auth0 Dashboard → APIs → Anzen API → Application Access → Authorize Anzen app for both User and Client access.

#### Stage 3 — Google OAuth Access Blocked
**Error:** `Error 403: access_denied`
**Cause:** Google OAuth app in Testing mode with no test users.
**Fix:** Google Cloud Console → OAuth consent screen → Test users → add email.

### Bug 009 — Tool Execute Parameter Destructuring
**Error:** `Cannot destructure property of null`
**Cause:** AI SDK v6 passes `null` as params object when no parameters are provided. Destructuring `{ state }` from null crashes.
**Fix:** Changed all `execute: async ({ param })` to `execute: async (params)` with `const param = params?.param ?? default`.

### Bug 010 — ChunkLoadError
**Error:** `ChunkLoadError: Failed to load chunk`
**Cause:** Stale Turbopack cache.
**Fix:** `Remove-Item -Recurse -Force .next && npm run dev`

### Bug 011 — Auth0 Management API Forbidden
**Error:** `Could not get management token` on disconnect
**Fix:** Auth0 Dashboard → Management API → Application Access → Authorize Anzen with `update:users` scope.