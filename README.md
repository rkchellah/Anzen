# Anzen 安全

> [Medium Post](https://medium.com/@chellakamina/anzen-what-i-built-what-broke-and-what-i-learned-about-ai-agents-and-credentials-5dee0ff88d30)

---

**An AI agent that acts on your behalf — without ever touching your credentials.**

Most AI agents that connect to your tools store your OAuth tokens somewhere: a database, an env file, a session. That means your GitHub token, your Gmail access, your Slack credentials — all sitting inside an app trusting not to leak them.

Anzen holds none of it. You connect GitHub, Gmail, and Slack through **Auth0 Token Vault**. The tokens live there, sealed. When the agent needs to make an API call, it requests a short-lived access token, uses it once, and discards it. Anzen never sees the underlying credential — not in memory, not in logs, not ever.

---

## Live Demo

🔗 [Anzen](https://anzen-eight.vercel.app/)

---

## How it works from the user's perspective

Anzen looks and feels like a normal chat app. You type what you want:

```
"Summarize my unread Gmail messages"
"List my open GitHub issues"
"Post a message to #general in Slack"
```

That's it. No commands, no special syntax. The agent figures out which tools to call, fetches a fresh token from Token Vault for each provider, makes the API call, and returns the result. Write actions (sending emails, closing issues, posting messages) pause and ask for your explicit confirmation before running.

---

## What the agent can do

Nine tools across three providers:

| Tool | Provider | Type |
|---|---|---|
| `listAssignedIssues` | GitHub | Read |
| `listRepoIssues` | GitHub | Read |
| `closeIssue` | GitHub | **Write** — requires confirmation |
| `commentOnIssue` | GitHub | **Write** — requires confirmation |
| `listUnreadEmails` | Gmail | Read |
| `sendEmail` | Gmail | **Write** — requires confirmation |
| `listSlackChannels` | Slack | Read |
| `postMessage` | Slack | **Write** — requires confirmation |

Each tool requests a fresh token from Token Vault for its provider, makes the API call, and returns the result. No token survives past the request.

---

## Why there's no backend

Intentionally. Auth0 Token Vault handles credential storage and short-lived token issuance. The Next.js API routes (`/api/chat`, `/api/status`, etc.) are thin: they verify your Auth0 session, exchange it for a live third-party access token via Token Vault, call the provider's API, and stream the result back. There is no database, no credential store, no token cache anywhere in Anzen's infrastructure.

---

## AI Models

Anzen supports two providers — the active one is selected based on which API key is configured:

| Provider | Model | Notes |
|---|---|---|
| **DeepSeek** | `deepseek-v4-flash` (default) | Fast tool-calling; thinking mode disabled for chat |
| **DeepSeek** | `deepseek-reasoner` | Extended reasoning for complex tasks |
| **Groq** | `llama-3.3-70b-versatile` | High-throughput fallback |

The model picker in the chat composer lets users switch between any configured model mid-session. Set `DEEPSEEK_API_KEY` and/or `GROQ_API_KEY` — whichever keys are present become available options.

---

## Token Vault flow

1. User logs in with Google via Auth0
2. User connects GitHub, Gmail, and Slack in the Connections tab — tokens stored in Auth0 Token Vault, never in Anzen
3. User sends a message; the agent decides which tools to call
4. Each tool calls `getTokenForProvider(provider)` — exchanges the Auth0 session for a live third-party access token
5. The token is used once and discarded
6. Write tools pause and surface a Confirm / Cancel card in the UI before executing

---

## Access control tiers

Each connection can be individually set in the Connections tab:

- 🟢 **Read-only** — the agent can read but never write (default)
- 🟡 **Read & write** — write actions are allowed but still require explicit confirmation per action

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
# Auth0
AUTH0_SECRET=
AUTH0_DOMAIN=
AUTH0_CLIENT_ID=
AUTH0_CLIENT_SECRET=
AUTH0_AUDIENCE=https://anzen.api
AUTH0_TOKEN_VAULT_URL=
AUTH0_TOKEN_VAULT_SCOPES=true

# App
APP_BASE_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# AI — set one or both; both present = both available in the model picker
DEEPSEEK_API_KEY=
GROQ_API_KEY=

# Optional: override the default model or expose extra models
# AI_PROVIDER=deepseek        # force a specific provider
# DEEPSEEK_MODEL=deepseek-reasoner
# DEEPSEEK_MODELS=deepseek-v4-flash,deepseek-reasoner
# GROQ_MODELS=llama-3.3-70b-versatile
```

You'll need an Auth0 account with Token Vault enabled. GitHub, Gmail, and Slack OAuth apps must be configured as Social Connections in your Auth0 dashboard.

---

## Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 + TypeScript |
| **Agent / streaming** | Vercel AI SDK (`streamText`, tool calling, `UIMessage`) |
| **AI providers** | DeepSeek (V4 Flash, Reasoner) · Groq (LLaMA 3.3 70B) |
| **Auth + credentials** | Auth0 v4 (`nextjs-auth0`) + Token Vault |
| **Provider APIs** | Octokit (GitHub) · googleapis (Gmail) · @slack/web-api (Slack) |
| **UI** | Tailwind CSS · shadcn/ui · Radix Base UI |
| **Hosting** | Vercel |
| **CI** | CircleCI (lint + typecheck) |

---

## Project structure

```
Anzen/
├── app/
│   ├── api/
│   │   ├── chat/route.ts           — AI agent endpoint (streamText + tools)
│   │   ├── models/route.ts         — Available model list for the picker
│   │   ├── status/route.ts         — Connection health checker
│   │   ├── audit/route.ts          — Write-action audit log
│   │   ├── permissions/route.ts    — Per-provider access mode (read / read+write)
│   │   ├── transcribe/route.ts     — Audio transcription (voice input)
│   │   └── auth/disconnect/        — Provider disconnect endpoint
│   ├── dashboard/
│   │   ├── page.tsx                — Dashboard server component (auth gate)
│   │   └── DashboardClient.tsx     — Full dashboard UI
│   ├── connect/                    — OAuth connection flow pages
│   ├── layout.tsx
│   ├── page.tsx                    — Landing page
│   └── globals.css
├── agent/
│   ├── tools/
│   │   ├── github.ts               — GitHub tools (issues, comments, close)
│   │   ├── gmail.ts                — Gmail tools (list, send)
│   │   └── slack.ts                — Slack tools (channels, post)
│   └── pending-approvals.ts        — Detect unanswered write-action confirmations
├── components/
│   ├── AnzenChatPanel.tsx          — Chat UI with streaming messages
│   ├── AnzenSidebar.tsx            — Icon rail navigation
│   ├── AnzenConnectionsView.tsx    — Connections tab
│   ├── AnzenModelPicker.tsx        — In-composer model switcher
│   ├── AnzenToolApprovals.tsx      — Confirm / Cancel cards for write actions
│   └── ui/                         — shadcn + custom UI primitives
├── lib/
│   ├── ai-provider.ts              — Provider resolution, model listing, DeepSeek fetch wrapper
│   ├── ai-chat.ts                  — Stream error handling, Groq tool-call repair
│   ├── auth0.ts                    — Auth0 client + Token Vault token fetcher
│   ├── auth0-scopes.ts             — Login scopes + audience gating
│   ├── auth-connections.ts         — Connect URLs per provider
│   ├── chat-history.ts             — Browser-local chat history (no server storage)
│   ├── permissions.ts              — Per-provider access modes
│   ├── rate-limit.ts               — In-memory per-user rate limiter
│   └── privacy-content.tsx         — Privacy policy content
├── hooks/
│   ├── use-audio-recording.ts      — Voice input recording + transcription
│   └── use-autosize-textarea.ts    — Auto-grow textarea
├── proxy.ts                        — Auth0 middleware (Next.js)
├── ARCHITECTURE.md                 — Token Vault flow, connection map, env flags
├── BUGLOG.md                       — Bugs, root causes, lessons learned
└── .env.example
```

---

## CI/CD

CircleCI runs lint + typecheck on every push and PR. Vercel deploys from the GitHub connection.

```
Branch / PR  →  CircleCI (lint + typecheck)  →  Vercel preview
Push to main →  CircleCI (lint + typecheck)  →  Vercel production
```

Local parity:

```bash
npm run ci        # lint + typecheck
npm run typecheck # tsc --noEmit
```

---

## Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Auth0 Token Vault flows, connection map, env flags
- **[BUGLOG.md](./BUGLOG.md)** — What broke, root causes, and lessons learned building this project
- **[docs/CI-CD-SETUP.md](./docs/CI-CD-SETUP.md)** — CircleCI + Vercel Git setup guide
