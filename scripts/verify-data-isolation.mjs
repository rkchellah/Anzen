#!/usr/bin/env node
/**
 * Phase 7 — Data isolation verification helper (manual test).
 *
 * Run with two separate Auth0 user sessions (User A and User B), each with
 * their own connected GitHub/Gmail/Slack accounts. Confirm tool results
 * never cross accounts.
 *
 * Usage:
 *   1. Log in as User A in browser → open DevTools → copy session cookie / use dashboard chat
 *   2. Ask Anzen to list GitHub issues / Gmail / Slack — note titles, senders, channel names
 *   3. Log out, log in as User B, repeat
 *   4. Verify User B never sees User A's data (and vice versa)
 *
 * Optional: hit /api/status and /api/debug while logged in as each user and compare JSON.
 */

console.log(`
Anzen data isolation verification (Phase 7 — manual)

Checklist:
  [ ] User A connected GitHub/Gmail/Slack with real account A
  [ ] User B connected with separate account B (different email)
  [ ] User A: "List my GitHub issues" / emails / Slack channels — record results
  [ ] User B: same prompts — results must differ; no overlap from A
  [ ] User A disconnects GitHub; User B GitHub data unchanged
  [ ] Audit log (/dashboard → History) shows only that user's write actions

API spot-check (while logged in as one user in browser):
  GET /api/status   — connection probe for current session only
  GET /api/audit    — audit entries for current user only
  GET /api/permissions — permissions for current user only

Mark Phase 7 complete in BUGLOG.md only after you confirm both accounts manually.
`);
