# KasiStock AI v0.5.0 Repository Manifest

## Release purpose

KasiStock AI source release plus a genuine Codex continuation adding durable PostgreSQL authority
records, live GPT-5.6 validation, and browser/accessibility QA.

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
README.md
REPO_MANIFEST.md
SECURITY.md
SOURCE_FILE_HASHES.txt
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
tests/                Unit, integration, evaluation and browser specifications
.github/workflows/    Node 24 quality and Playwright CI workflow
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
Automated tests:                   38 passed / 0 failed, 1 conditional skip
Real PostgreSQL integration:       1 passed / 0 failed
Production build:                  passed
Playwright judging fallback:       9/9 passed
Live post-fix Playwright:          8/9 (product-mapping persistence returned 503)
Playwright accessibility:          5 surfaces, 0 WCAG A/AA violations
```
