# Anzen 安全

> The production demo has an Auth0 callback issue post-hackathon. Full breakdown of what worked, what broke, and why: [Medium Post](https://medium.com/@chellakamina/anzen-what-i-built-what-broke-and-what-i-learned-about-ai-agents-and-credentials-5dee0ff88d30)

---

**An AI agent that acts on your behalf — without ever touching your credentials.**

Every AI agent that connects to your tools has the same problem: it needs your OAuth tokens to do anything. Most solutions store them in a database, an env file, or a session. That means your GitHub token, your Gmail access, your Slack credentials — all sitting somewhere in an app you're trusting not to leak them.

Anzen doesn't hold any of it. You connect GitHub, Gmail, and Slack through Auth0 Token Vault. The tokens live there, sealed. When the agent needs to make an API call, it requests a short-lived access token, uses it immediately, and discards it. Anzen never sees the underlying credential. Not in memory, not in logs, not ever.

---

## Live Demo
🔗 [Anzen](https://anzen-eight.vercel.app/)

---

## What it does

```
"Summarize my open GitHub issues and check if I have any unread emails about them."
```

The agent has nine tools across three providers:

1. **list_github_issues** — fetches open issues from your connected repos
2. **close_github_issue** — closes an issue by number
3. **comment_on_issue** — posts a comment to a GitHub issue
4. **list_unread_emails** — fetches unread Gmail messages
5. **send_email** — sends an email from your account
6. **list_slack_channels** — lists channels in your connected Slack workspace
7. **post_slack_message** — posts a message to a specified channel

Each tool requests a fresh token from Token Vault for its provider, makes the API call, and returns the result. No token survives past the request.

---

## How Token Vault works

1. You log in with Google via Auth0
2. You connect GitHub, Gmail, and Slack — tokens stored in Auth0 Token Vault, not in Anzen
3. When the agent calls a tool, it runs `getTokenForProvider(provider)`, which exchanges your Auth0 session for a live third-party access token
4. The token is used once and discarded
5. Anzen never stores any credential at any layer

---

## Security model

Every agent action sits in one of three tiers:

- 🟢 **Watch** — read only, granted once at setup
- 🟡 **Act** — requires session confirmation
- 🔴 **Sensitive** — requires fresh re-auth every time

---

## Running locally

```bash
git clone https://github.com/rkchellah/Anzen
cd Anzen
npm install
cp .env.example .env.local
# Fill in .env.local (see below)
npm run dev
# Open http://localhost:3000
```

---

## Environment variables

```bash
AUTH0_SECRET=
AUTH0_DOMAIN=
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=
AUTH0_AUDIENCE=https://anzen.api
AUTH0_TOKEN_VAULT_URL=
APP_BASE_URL=http://localhost:3000
GROQ_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

You'll need an Auth0 account with Token Vault enabled and a Groq API key (free at console.groq.com). GitHub, Gmail, and Slack OAuth apps must be configured as Social Connections in your Auth0 dashboard.

---

## Stack

- **Frontend**: Next.js 16 + TypeScript
- **Agent**: Vercel AI SDK + Groq (LLaMA 3.3 70B)
- **Auth + credentials**: Auth0 v4 (nextjs-auth0) + Token Vault
- **APIs**: Octokit (GitHub), googleapis (Gmail), @slack/web-api (Slack)
- **Hosting**: Vercel

---

## Project structure

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
│       ├── github.ts
│       ├── gmail.ts
│       └── slack.ts
├── lib/
│   ├── auth0.ts                  — Auth0 client + Token Vault token fetcher
│   ├── auth0-scopes.ts           — Login scopes + audience gating
│   └── auth-connections.ts       — Connect URLs per provider
├── proxy.ts                      — Auth0 middleware (Next.js 16)
├── ARCHITECTURE.md               — Auth0 Token Vault flow (canonical)
├── BUGLOG.md                     — Bugs, root causes, lessons learned
└── .env.example
```

---

## Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Auth0 Token Vault flows, connection map, env flags
- **[BUGLOG.md](./BUGLOG.md)** — What broke, root causes, and lessons learned building this project
