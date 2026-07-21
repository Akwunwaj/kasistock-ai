# KasiStock AI

**Turn limited cash into the right stock.**

KasiStock AI is an OpenAI Build Week application for cash-constrained small retailers. It turns
shelf evidence, supplier catalogues, accepted sales history, and a cash budget into an explainable,
budget-constrained restocking plan, then requires explicit merchant approval before generating
supplier purchase orders.

## Submission release — v0.5.0 baseline plus Codex continuation

The repository now contains the complete evidence-to-order application plus deployment and
submission assets:

- Zero-sign-up `/judge` route with a two-minute judging path.
- Vercel deployment configuration and production readiness endpoint.
- GitHub Actions quality and Playwright jobs on Node.js 24.
- Production environment and live OpenAI validation commands.
- Secure HTTP response headers and social metadata.
- WCAG A/AA accessibility audit and remediations.
- Four reproducible 1440×900 submission screenshots.
- A 16-second draft MP4 and a complete sub-three-minute narration script.
- Copy-ready Devpost content, deployment runbook, Codex evidence guidance, and publication
  checklist.
- Optional durable PostgreSQL persistence across every accepted authority layer, while retaining the
  no-database prepared judging fallback.
- Live `gpt-5.6-sol` image and PDF validation with safe response-ID evidence.

## Evidence authority

- Multipart shelf-image and supplier-document ingestion.
- Deterministic CSV sales-history ingestion.
- File-size, MIME-type, and magic-byte validation.
- GPT-5.6 multimodal extraction through the OpenAI Responses API.
- Strict Zod Structured Outputs and `store: false`.
- Human review and correction of uncertain extracted values.
- HMAC-signed extraction envelopes.
- Immutable accepted-evidence snapshots with SHA-256 hashes.

## Product identity reconciliation

- Versioned canonical product catalogue with barcodes and governed aliases.
- Match precedence: barcode → exact alias → normalised canonical name → token similarity.
- GPT-5.6 candidate proposals for unresolved labels.
- GPT suggestions remain non-authoritative and require human confirmation.
- Explicit matched, corrected, or unmatched decisions for every source product label.
- Immutable accepted product-mapping sets bound to exact evidence hashes.

## Deterministic purchasing intelligence

- Current shelf stock by canonical product.
- Average daily sales, average selling price, and days of cover.
- Target stock and reorder requirement.
- Supplier pack-size, case-size, and minimum-order handling.
- Exact supplier comparisons without floating-point ranking decisions.
- Integer-cent margin, budget, and line-total calculations.
- Budget-constrained deterministic restocking output.
- Merchant-editable pack quantities constrained by accepted demand ceilings.

## Approval-controlled purchasing

- Server-rebuilt purchase-order drafts derived from accepted evidence and mappings.
- SHA-256 draft and recommendation hashes.
- HMAC-signed draft envelopes that detect browser-side mutation.
- Explicit merchant confirmation before approval.
- Immutable approval records and approval hashes.
- Supplier-specific purchase-order grouping.
- Downloadable integrity-bound PDF purchase orders.
- WhatsApp-ready supplier messages.
- Six-stage authority and purchasing audit timeline.

## Authority model

```text
GPT-5.6 extracts or proposes
        |
Zod validates the contract
        |
Merchant accepts or corrects evidence
        |
SHA-256 accepted-evidence snapshot
        |
Deterministic identity matching
        |
Merchant confirms uncertain identities
        |
SHA-256 accepted mapping set
        |
Deterministic calculations and optimiser
        |
Merchant edits pack quantities within accepted ceilings
        |
Server rebuilds and signs the draft
        |
Explicit merchant approval
        |
Supplier PDFs, messages, and audit evidence
```

The model cannot approve evidence, product identity, financial calculations, final quantities, or
purchase orders.

## Technology baseline

- Next.js 16.2.10
- React 19.2.7
- TypeScript 6.0.3
- OpenAI JavaScript SDK 6.48.0
- node-postgres 8.22.0
- Zod 4.4.3
- pdf-lib 1.17.1
- ESLint 9.39.1
- Vitest 4.1.10
- Playwright 1.61.1
- axe-core Playwright 4.12.1

Exact versions are pinned in `package.json` and `package-lock.json`. Node.js 24.15.0 and npm 11.12.1
are recorded in `.nvmrc`, `.node-version`, `package.json`, and CI.

## Local setup

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Configure the existing server-side key in `.env.local`:

```text
OPENAI_API_KEY=<existing project key>
OPENAI_MODEL=<GPT-5.6 model identifier available to the project>
EVIDENCE_SIGNING_SECRET=<at least 32 random characters>
APP_BASE_URL=http://localhost:3000
DATABASE_URL=<optional locally; required for durable production evidence>
```

The explicit flagship identifier `gpt-5.6-sol` was confirmed in current OpenAI model guidance and
validated against the configured API project on 20 July 2026. Re-run the safe check before deployment:

```powershell
npm run validate:openai
```

For durable persistence, start PostgreSQL, apply the idempotent schema migration, and then run the
application:

```powershell
npm run db:migrate
npm run dev
```

If `DATABASE_URL` is absent, the prepared judging flow remains available and the API explicitly
reports `prepared_fallback`; it does not claim durable storage.

No OpenAI key is required for the prepared demonstration path.

## Recommended judging path

Open `/judge`, or complete the workflow directly:

1. Open `/evidence` and select **Use prepared demo**.
2. Verify the uncertain observations and accept the evidence snapshot.
3. Open `/decision` and select **Load prepared accepted evidence**.
4. Confirm uncertain product identities and accept the mapping set.
5. Build and optimise the R1,500 plan.
6. Create the signed approval draft.
7. Explicitly approve the order.
8. Download the supplier PDFs, copy the supplier messages, and inspect the audit timeline.

Prepared result:

```text
Available budget:       R1,500.00
Approved order:         R1,399.10
Remaining budget:         R100.90
Supplier orders:                2
Audit events:                    6
```

## Routes

```text
/                         Home dashboard
/judge                    Two-minute judging path
/evidence                 Live and prepared evidence workflow
/decision                 Reconciliation, optimisation, and approval
/architecture             Trust-boundary explanation
/submission-preview/*     Deterministic media-generation previews
/api/health               Liveness
/api/readiness            Safe production configuration status
/api/extractions          Multimodal and prepared extraction
/api/evidence-snapshots   Accepted-evidence authority
/api/reconciliation/*     Product identity proposals
/api/product-mappings     Accepted mapping authority
/api/restock-inputs       Evidence-bound calculations
/api/purchase-orders/*    Draft, approval, and PDF generation
/api/evaluations          Evaluation results
```

## Verification commands

```powershell
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run evals
npm run build
npm run audit:a11y
npm run validate:live-workflow
```

Browser tests with Playwright-managed Chromium:

```powershell
npx playwright install chromium
npm run test:e2e
```

Generate submission screenshots and the draft MP4:

```powershell
npm run capture:submission
```

## Evaluation and accessibility evidence

- Normal automated suite: **37 passing, 1 conditional PostgreSQL test skipped**.
- Real PostgreSQL authority-chain integration: **1 passing** when `TEST_DATABASE_URL` is set.
- Production Playwright suite: **8 passing** in both PostgreSQL and prepared-fallback modes.
- Product-identity evaluation: **91.67%**.
- Unsafe automatic product merges: **0**.
- Offline server-rendered DOM audit: **zero WCAG A/AA violations across five judged surfaces**.
- Full Playwright browser specifications remain in `tests/e2e` and execute in CI after installing
  Playwright Chromium.

## Deployment and submission

Start with:

- `submission/DEPLOYMENT_RUNBOOK.md`
- `submission/DEVPOST_SUBMISSION.md`
- `submission/VIDEO_SCRIPT_3_MINUTES.md`
- `submission/CODEX_EVIDENCE.md`
- `submission/PUBLICATION_CHECKLIST.md`
- `submission/SCREENSHOT_INDEX.md`

## Repository map

```text
app/                    Next.js pages, preview surfaces, and server routes
components/             Dashboard, evidence, and decision workspaces
modules/catalogue/      Canonical product policy
modules/extraction/     File validation, CSV parsing, and OpenAI extraction
modules/evidence/       Signed envelopes and accepted snapshots
modules/reconciliation/ Identity proposals, mapping authority, and evaluation scoring
modules/restocking/     Evidence-bound deterministic calculations
modules/optimisation/   Budget-constrained allocation
modules/purchasing/     Draft, approval, supplier outputs, signatures, and PDF generation
modules/persistence/    Prepared fallback and PostgreSQL workflow adapters
fixtures/                Fictional demonstration data and generated sample PDF
db/                      PostgreSQL target schema
tests/                   Unit, integration, evaluation, and browser tests
evals/                   Labelled dataset and measured results
scripts/                 Validation, accessibility, and media-generation tools
submission/              Devpost copy, deployment guides, screenshots, QA, and draft video
.github/workflows/       Node 24 quality and browser CI
```

## Production boundary

With `DATABASE_URL`, accepted evidence, mappings, scenarios, calculations, recommendations, signed
drafts, approvals, supplier orders, messages, and audit events are durably stored in PostgreSQL.
Approval and every downstream order artifact are persisted in one database transaction. Without a
database, the prepared judging flow remains deliberately non-durable. Authentication, tenant
isolation, production backups, a transactional delivery outbox, and live WhatsApp delivery remain
post-competition work.

## Codex provenance

The supplied ZIP is the only baseline. The continuation commit documents what this primary Codex
task genuinely added: PostgreSQL persistence, migration and real-database tests, readiness reporting,
live GPT-5.6 image/PDF validation, the PDF data-URI fix, purchase-order collision hardening, mobile
navigation and contrast fixes, browser QA, and refreshed evidence. Earlier archive history is treated
as supplied baseline work, not retroactively claimed as work performed in this task.
