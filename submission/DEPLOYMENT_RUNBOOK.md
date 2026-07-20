# Deployment runbook

## Recommended target

Deploy the public demonstration to Vercel from a GitHub repository. The repository includes `vercel.json`, a production build, readiness checks, and GitHub Actions CI.

## Required production variables

| Variable                  | Required             | Purpose                                                                        |
| ------------------------- | -------------------- | ------------------------------------------------------------------------------ |
| `OPENAI_API_KEY`          | For live uploads     | Server-side Responses API access                                               |
| `OPENAI_MODEL`            | Yes for live uploads | Exact GPT-5.6 model identifier available to the project                        |
| `EVIDENCE_SIGNING_SECRET` | Yes                  | HMAC signing; minimum 32 random characters                                     |
| `APP_BASE_URL`            | Yes                  | Canonical HTTPS deployment URL and metadata base                               |
| `DATABASE_URL`            | Future persistence   | Present in the schema baseline but not required by the prepared in-memory demo |

Do not use a `NEXT_PUBLIC_` prefix for secrets.

## Pre-deployment gate

```powershell
npm ci
npm run validate:env
npm run verify
npm run audit:a11y
```

With the existing OpenAI key configured locally:

```powershell
npm run validate:openai
```

This command performs a minimal Responses API call and reports only safe metadata: status, model, response ID, and latency. It never prints the key.

## Publish the repository

Create an empty GitHub repository without generating a README, licence, or `.gitignore`, then run:

```powershell
git init
git add .
git commit -m "Build KasiStock AI submission release"
git branch -M main
git remote add origin <REPOSITORY_URL>
git push -u origin main
```

Alternatively, after authenticating GitHub CLI:

```powershell
gh repo create kasistock-ai --public --source=. --remote=origin --push
```

## Deploy through the Vercel dashboard

1. Import the GitHub repository into Vercel.
2. Confirm the Next.js framework preset.
3. Add the production variables above.
4. Deploy the `main` branch.
5. Set `APP_BASE_URL` to the final HTTPS deployment URL.
6. Redeploy so canonical metadata uses the final URL.
7. Open `/api/readiness`; it must return HTTP 200 and `status: ready`.
8. Open `/judge` and complete the prepared workflow.
9. Test one live shelf or supplier upload using the existing API key.

## Vercel CLI alternative

```powershell
npm install --global vercel
vercel link
vercel env add OPENAI_API_KEY production
vercel env add OPENAI_MODEL production
vercel env add EVIDENCE_SIGNING_SECRET production
vercel env add APP_BASE_URL production
vercel --prod
```

## Post-deployment smoke checks

```text
/                         Home dashboard
/judge                    Two-minute judge guide
/evidence                 Live/prepared evidence workflow
/decision                 Mapping, optimisation, and approval workflow
/architecture             Trust-boundary explanation
/api/health               Service liveness
/api/readiness            Production configuration readiness
/opengraph-image          Social preview image
```

## Rollback

If live extraction fails, keep the public deployment available because the prepared demonstration does not require an OpenAI request. Roll back only when the prepared workflow or static pages fail.
