# Project Rules

> These rules apply to every file, every commit, every conversation.

## Code
- TypeScript only. Strict typing enforced.
- If any examples are given in JavaScript, convert them to TypeScript.
- Code must be clean and well-structured.
- Comments only when necessary — explain *why*, never *what*.

## Documentation
- Update `README.md` every time a change is made to the code.
- Update `CHECKLIST.md` when tasks are completed.
- Confirm with the team before checking off any task as complete.

## Stack
- Frontend: Next.js 16 + TypeScript
- Backend: Node.js + TypeScript via Next.js API routes
- AI: Vercel AI SDK + Groq (llama-3.3-70b-versatile)
- Auth: Auth0 v4 (nextjs-auth0) + Token Vault
- Integrations: GitHub, Gmail, Slack
- Deployment: Vercel

## Philosophy
- Shipping beats perfection.
- Security is not an afterthought — Token Vault is the backbone.
- Every agent action must be auditable and reversible where possible.