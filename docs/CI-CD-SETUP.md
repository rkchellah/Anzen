# One-time CI/CD setup (manual)

Repo secrets already set via `gh` (from local `.vercel/project.json`):

- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## Still required from you

### 1. Create and add `VERCEL_TOKEN`

1. Open https://vercel.com/account/tokens
2. Create a token with access to the **anzen** project / team
3. Add it as a GitHub Actions secret:

```bash
# PowerShell — paste the token when prompted
gh secret set VERCEL_TOKEN --repo rkchellah/Anzen
```

Or: GitHub → `rkchellah/Anzen` → Settings → Secrets and variables → Actions → New repository secret → name `VERCEL_TOKEN`.

### 2. Disable Vercel Git auto-deploy

1. Open the Anzen project on Vercel → **Settings** → **Git**
2. Disable automatic deployments for **Production** and **Preview**
3. Keep the GitHub repo connected so the project stays linked; only Actions should deploy

Without this, every push triggers both Vercel’s Git deploy and the Actions deploy.

### 3. Verify

1. Push the CI/CD branch or open a PR → Actions → **CI/CD** workflow
2. Confirm preview URL in the job summary
3. Merge to `main` → production deploy from Actions only
