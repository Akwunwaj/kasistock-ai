# KasiStock AI v0.5.0 Repository Manifest

## Release purpose

Submission-ready Build Week source release with deployment hardening, accessibility evidence,
judging screenshots, video script, Devpost copy and publication instructions.

## Root governance and release files

```text
AGENTS.md
ARCHITECTURE.md
BUILD_WEEK_LOG.md
CHANGES_V0.3.0.md
CHANGES_V0.4.0.md
CHANGES_V0.5.0.md
COMPATIBILITY.md
DEMO_SCRIPT.md
README.md
REPO_MANIFEST.md
SECURITY.md
SOURCE_FILE_HASHES.txt
SUBMISSION_CHECKLIST.md
VERIFICATION_REPORT.md
runtime-verification.json
verification-evidence.json
```

## Application and domain structure

```text
app/                 Next.js routes, APIs, metadata and submission previews
components/          Interactive evidence, decision and dashboard interfaces
db/                  PostgreSQL target schema
evals/               Product-identity evaluation dataset and measured result
fixtures/            Prepared evidence, catalogue and generated PDF fixture
lib/                  Shared server and money utilities
modules/              Evidence, extraction, reconciliation, restocking and purchasing domains
scripts/              Environment, OpenAI, accessibility and media automation
submission/           Copy-ready Build Week submission and deployment assets
tests/                Unit, integration, evaluation and browser specifications
.github/workflows/    Node 24 quality and Playwright CI workflow
```

## Submission package

```text
submission/CODEX_EVIDENCE.md
submission/DEPLOYMENT_RUNBOOK.md
submission/DEVPOST_SUBMISSION.md
submission/PUBLICATION_CHECKLIST.md
submission/SCREENSHOT_INDEX.md
submission/VIDEO_SCRIPT_3_MINUTES.md
submission/devpost-submission.json
submission/qa/accessibility-report.json
submission/screenshots/01-home-dashboard.png
submission/screenshots/02-human-evidence-review.png
submission/screenshots/03-approved-supplier-orders.png
submission/screenshots/04-trust-boundaries.png
submission/screenshots/assets.json
submission/video/kasistock-ai-demo-draft.mp4
```

## Deployment files

```text
.env.example
.github/workflows/ci.yml
.node-version
.nvmrc
next.config.ts
package-lock.json
package.json
playwright.config.ts
vercel.json
```

## Excluded from release archive

```text
.env.local and other secret-bearing environment files
node_modules/
.next/
test-results/
playwright-report/
coverage/
tsconfig.tsbuildinfo
```

## Verification summary

```text
Exact clean toolchain:             Node 24.15.0 / npm 11.12.1
Automated tests:                   34 passed / 0 failed
Production build:                  passed
Production route checks:           13 passed
Offline accessibility violations: 0
Submission screenshots:            4
Draft reference MP4:               generated
```
