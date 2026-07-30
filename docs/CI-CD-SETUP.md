# One-time CI/CD setup (CircleCI + Vercel Git)

**CircleCI** runs lint + typecheck. **Vercel** deploys from GitHub (production on `main`, preview on other branches).

Config: [`.circleci/config.yml`](../.circleci/config.yml).

## 1. CircleCI project

1. https://app.circleci.com/ → **Projects** → `rkchellah/Anzen`
2. Use existing `.circleci/config.yml`
3. Trigger: **All pushes** (already set)

No Vercel tokens needed in CircleCI for this setup.

## 2. Vercel Git deploy (required)

1. Vercel → **anzen** → **Settings** → **Git**
2. Ensure the GitHub repo `rkchellah/Anzen` is connected
3. **Ignored Build Step**: set to **Off** / clear any custom ignore (do **not** use “Don’t build anything”)
4. Production branch: `main`

## 3. Verify

1. Push to `main` → CircleCI `ci` green + Vercel production deploy
2. Open a PR → CircleCI `ci` + Vercel preview
3. Break lint/types → CircleCI fails (Vercel may still build unless you add a check gate later)

## Local parity

```bash
npm run ci          # lint + typecheck
npm run typecheck   # tsc --noEmit
```
