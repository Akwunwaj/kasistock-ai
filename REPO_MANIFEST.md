# KasiStock AI v0.5.0 Repository Manifest

## Release purpose

Submission-ready KasiStock AI source release plus a genuine Codex continuation adding durable
PostgreSQL authority records, live GPT-5.6 evidence, browser/accessibility QA, and final media.

## Root governance and release files

```text
AGENTS.md
ARCHITECTURE.md
KASISTOCK_AI_LOG.md
CHANGES_V0.3.0.md
CHANGES_V0.4.0.md
CHANGES_V0.5.0.md
CHANGES_CODEX_CONTINUATION.md
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
submission/           Copy-ready KasiStock AI submission and deployment assets
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
submission/qa/live-openai-validation.json
submission/screenshots/01-home-dashboard.png
submission/screenshots/02-human-evidence-review.png
submission/screenshots/03-approved-supplier-orders.png
submission/screenshots/04-trust-boundaries.png
submission/screenshots/assets.json
submission/video/kasistock-ai-demo-draft.mp4
submission/video/kasistock-ai-demo.mp4
submission/video/kasistock-ai-demo.srt
submission/video/kasistock-ai-narration.mp3
submission/video/final-video-frames.json
submission/video/final-video-metadata.json
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
Exact clean toolchain:             Node 24.18.0 / npm 11.16.0
Automated tests:                   37 passed / 0 failed, 1 conditional skip
Real PostgreSQL integration:       1 passed / 0 failed
Production build:                  passed
Production Playwright suites:      8/8 PostgreSQL, 8/8 fallback
Playwright accessibility:          5 surfaces, 0 WCAG A/AA violations
Submission screenshots:            4
Final narrated MP4:                2:33.7, captioned, generated
```
