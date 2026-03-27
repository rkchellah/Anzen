# Anzen — Build Checklist

> Confirm with team before checking off any task.

## 🚨 Security
- [x] Removed .env.local from git tracking
- [x] Removed duplicate token-vault implementation
- [ ] All credentials rotated after accidental exposure

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
- [x] Logout working
- [x] GitHub repo created and pushed
- [x] Token Vault enabled in Auth0

## Phase 2 — Integrations
- [x] Token Vault enabled in Auth0
- [x] Custom API created (Anzen API)
- [x] Custom API Client created (Anzen API Client)
- [x] My Account API configured
- [x] Multi-Resource Refresh Token enabled
- [x] Token Vault fetch function written
- [ ] GitHub OAuth connected via Token Vault
- [ ] Gmail OAuth connected via Token Vault
- [ ] Slack OAuth connected via Token Vault
- [ ] Permission tiers implemented (🟢🟡🔴)
- [ ] Token Vault retrieving tokens correctly

## Phase 3 — Agent Brain
- [ ] Vercel AI SDK configured with GPT-4o
- [x] GitHub tool built and tested
- [ ] Gmail tool built and tested
- [ ] Slack tool built and tested
- [ ] Morning briefing prompt engineered
- [ ] Step-up authentication implemented

## Phase 4 — Dashboard
- [ ] Login/logout flow working in UI
- [ ] Morning briefing page built
- [ ] Action cards built (approve/deny)
- [ ] Permission badges (🟢🟡🔴) visible
- [ ] Audit log page built

## Phase 5 — Polish & Submit
- [ ] Deployed to Vercel
- [ ] README complete and judge-ready
- [ ] Demo video recorded (3 min)
- [ ] Bonus blog post written (250+ words)
- [ ] Devpost submission complete