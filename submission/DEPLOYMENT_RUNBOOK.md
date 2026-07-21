# Deployment runbook

## Recommended target

Deploy the public demonstration to Vercel from a GitHub repository. The repository includes `vercel.json`, a production build, readiness checks, and GitHub Actions CI.

## Required production variables

| Variable                  | Required             | Purpose                                                          |
| ------------------------- | -------------------- | ---------------------------------------------------------------- |
| `OPENAI_API_KEY`          | For live uploads     | Server-side Responses API access                                 |
| `OPENAI_MODEL`            | Yes for live uploads | Exact GPT-5.6 model identifier available to the project          |
| `EVIDENCE_SIGNING_SECRET` | Yes                  | HMAC signing; minimum 32 random characters                       |
| `APP_BASE_URL`            | Yes                  | Canonical HTTPS deployment URL and metadata base                 |
| `DATABASE_URL`            | Durable production   | PostgreSQL connection for accepted evidence through audit events |

Do not use a `NEXT_PUBLIC_` prefix for secrets.

## Pre-deployment gate

```powershell
npm ci
npm run validate:env
npm run db:migrate
npm run verify
npm run audit:a11y
```

With the existing OpenAI key configured locally:

```powershell
npm run validate:openai
```

This command performs a minimal Responses API call and reports only safe metadata: status, model, response ID, and latency. It never prints the key.

## Publish the repository

The default is a **private repository with no licence** until the owner makes the required explicit
visibility/licensing decision. Create an empty private repository without generating files, then run:

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
gh repo create kasistock-ai --private --source=. --remote=origin --push
```

## Deploy through the Vercel dashboard

1. Import the GitHub repository into Vercel.
2. Confirm the Next.js framework preset.
3. Provision PostgreSQL and add all production variables above.
4. Apply `npm run db:migrate` against the production database from a trusted deployment shell.
5. Deploy the `main` branch.
6. Set `APP_BASE_URL` to the final HTTPS deployment URL.
7. Redeploy so canonical metadata uses the final URL.
8. Open `/api/readiness`; it must return HTTP 200, `status: ready`, and reachable PostgreSQL.
9. Open `/judge` and complete the prepared workflow.
10. Test live shelf and supplier PDF uploads using the existing API key.

## Vercel CLI alternative

```powershell
npm install --global vercel
vercel link
vercel env add OPENAI_API_KEY production
vercel env add OPENAI_MODEL production
vercel env add EVIDENCE_SIGNING_SECRET production
vercel env add APP_BASE_URL production
vercel env add DATABASE_URL production
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

If live extraction or PostgreSQL fails, the prepared demonstration remains available only when
`DATABASE_URL` is deliberately absent. A configured but unreachable database fails closed by design;
fix or remove the configuration rather than silently presenting a durable workflow. Roll back when
the prepared workflow or static pages fail.
