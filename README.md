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
\`\`\`
Anzen/
├── app/
│   ├── api/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── lib/
│   └── auth0.ts
├── proxy.ts
├── public/
├── RULES.md
├── CHECKLIST.md
└── .env.example
\`\`\`

## Getting Started

### Prerequisites
- Node.js 18+
- Auth0 account
- OpenAI API key
- GitHub, Google, Slack OAuth apps configured

### Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/YOUR_USERNAME/anzen
cd anzen
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Copy environment variables:
\`\`\`bash
cp .env.example .env.local
\`\`\`

4. Fill in your credentials in `.env.local`

5. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

6. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables
\`\`\`bash
AUTH0_SECRET=
AUTH0_DOMAIN=
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=
APP_BASE_URL=http://localhost:3000
AUTH0_TOKEN_VAULT_URL=
OPENAI_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

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
- `middleware.ts` replaced with `proxy.ts` in Next.js 16
- Env variable `AUTH0_ISSUER_BASE_URL` renamed to `AUTH0_DOMAIN`
- Callback URL changed from `/api/auth/callback` to `/auth/callback`
**Fix:** Updated `lib/auth0.ts` with explicit Auth0Client config,
renamed `middleware.ts` to `proxy.ts`, updated all env variable names,
updated callback URL in Auth0 dashboard.

### Bug 002 — Callback URL Mismatch
**Error:** `Callback URL mismatch` on Auth0 login page
**Cause:** Auth0 dashboard had old v3 callback URL `/api/auth/callback`
**Fix:** Updated Auth0 dashboard Allowed Callback URLs to
`http://localhost:3000/auth/callback`