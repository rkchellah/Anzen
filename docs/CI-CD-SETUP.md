# One-time CI/CD setup (CircleCI → Vercel)

Anzen deploys via **CircleCI**, not GitHub Actions. Config: [`.circleci/config.yml`](../.circleci/config.yml).

## 1. Connect the repo in CircleCI

1. Open https://app.circleci.com/ → **Projects**
2. Find `rkchellah/Anzen` (GitHub) → **Set Up Project**
3. Use the existing config at `.circleci/config.yml` (fastest path)

## 2. Project environment variables

CircleCI → Project Settings → **Environment Variables** — add:

| Name | Value |
| --- | --- |
| `VERCEL_TOKEN` | [Create a token](https://vercel.com/account/tokens) with access to the anzen project |
| `VERCEL_ORG_ID` | From `.vercel/project.json` after `npx vercel link` (`orgId`) |
| `VERCEL_PROJECT_ID` | From `.vercel/project.json` (`projectId`) |

Auth0 / AI keys stay in the **Vercel** project env — `vercel pull` loads them during CI builds. Do not put secrets in the repo.

## 3. Disable Vercel Git auto-deploy

1. Vercel → Anzen project → **Settings** → **Git**
2. Turn off automatic deployments for **Production** and **Preview**
3. Keep the GitHub connection so the project stays linked; only CircleCI should deploy

Without this, every push triggers both Vercel’s Git deploy and the CircleCI deploy.

## 4. Disable GitHub Actions (if still enabled)

If an old Actions workflow remains under `.github/workflows/`, delete it or disable Actions for the repo (Settings → Actions → Disable). CircleCI owns CI/CD now.

## 5. Verify

1. Push a branch or open a PR → CircleCI **ci-cd** workflow runs
2. Confirm preview URL in the `deploy` job logs / artifact `deploy-url.txt`
3. Merge to `main` → production deploy from CircleCI only
4. Break lint/types → `ci` fails → `deploy` does not run

## Local parity

```bash
npm run ci          # lint + typecheck
npm run typecheck   # tsc --noEmit
```

Optional: validate CircleCI config locally (CLI via winget `CircleCI.CLI.Preview`; requires `circleci auth login` once):

```bash
circleci auth login
circleci config validate .circleci/config.yml
```
