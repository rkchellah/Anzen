# Anzen — Build Checklist

> Confirm with team before checking off any task.

## 🚨 Security
- [x] Removed .env.local from git tracking
- [x] Removed duplicate token-vault implementation
- [ ] All credentials rotated after accidental exposure

## 🐛 Bug Fixes
- [x] Bug 006 — sendMessage API (AI SDK v6 breaking change)
- [x] Bug 007 — Message rendering (parts array format)
- [x] Bug 008 — State parameter missing (proxy.ts + middleware.ts conflict)
- [x] Bug 009 — Tool execute null params crash (safe destructuring)
- [x] Bug 010 — ChunkLoadError (stale Turbopack cache)
- [x] Bug 011 — Auth0 Management API not authorized for disconnect

## Phase 1 — Foundation
- [x] Next.js app initialized with TypeScript
- [x] Auth0 application created (Anzen)
- [x] `.env.local` configured with Auth0 credentials
- [x] Auth0 SDK installed and configured
- [x] Callback URLs configured in Auth0
- [x] Auth0 route handler created
- [x] Auth0 UserProvider added to layout
- [x] Auth working end to end (login page loads)
- [x] Login flow completes and redirects back to app
- [x] Login flow working end to end — confirmed "Welcome, Chella Kamina" after Google OAuth
- [x] Logout working
- [x] GitHub repo created and pushed
- [x] Token Vault grant type enabled in Auth0

## Phase 2 — Integrations
- [x] Token Vault grant type enabled in Auth0
- [x] Custom API created (Anzen API)
- [x] Custom API Client created (Anzen API Client)
- [x] My Account API configured
- [x] Multi-Resource Refresh Token enabled
- [x] Token Vault fetch function written (lib/auth0.ts)
- [x] Agent chat API route built (app/api/chat/route.ts)
- [x] Status API route built (app/api/status/route.ts)
- [x] GitHub tool built (agent/tools/github.ts)
- [x] Gmail tool built (agent/tools/gmail.ts)
- [x] Slack tool built (agent/tools/slack.ts)
- [x] GitHub OAuth connected via Auth0 Social Connection
- [x] Gmail OAuth connected via Auth0 Social Connection
- [x] Slack OAuth connected via Auth0 Social Connection
- [x] Connected Accounts for Token Vault enabled on all providers
- [ ] Token Vault returning correct third-party tokens (pending Auth0 support — ticket open)

## Phase 3 — Agent Brain
- [x] Groq AI configured (llama-3.3-70b-versatile via @ai-sdk/groq)
- [x] GitHub tool built and integrated
- [x] Gmail tool built and integrated
- [x] Slack tool built and integrated
- [x] Agent responding to natural language queries
- [ ] Token Vault token exchange working end-to-end
- [ ] Step-up authentication implemented

## Phase 4 — Dashboard
- [x] Login/logout flow working in UI
- [x] Chat interface built with streaming responses
- [x] Connection cards built (connect/disconnect per provider)
- [x] Connection status indicators (green dot when connected)
- [x] Audit log page built (real message history)
- [x] Dark/light theme with persistence
- [x] Navbar with logo, navigation, theme toggle, sign out
- [ ] Permission badges (🟢🟡🔴) visible
- [ ] Action cards (approve/deny) built

## Phase 5 — Polish & Submit
- [x] Code pushed to GitHub
- [ ] Deployed to Vercel
- [ ] Auth0 callbacks updated for production URL
- [ ] README complete and judge-ready
- [ ] Demo video recorded (3 min)
- [ ] Bonus blog post written (250+ words)
- [ ] Devpost submission complete