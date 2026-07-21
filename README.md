# KasiStock AI

Live demonstration: https://kasistock-ai.vercel.app

The source repository is intentionally private with no licence, per the owner's publication
decision.

**Turn limited cash into the right stock.**

KasiStock AI is an OpenAI-powered application for cash-constrained small retailers. It turns
shelf evidence, supplier catalogues, accepted sales history, and a cash budget into an explainable,
budget-constrained restocking plan, then requires explicit merchant approval before generating
supplier purchase orders.

## Problem and workflow

Small retailers regularly need to decide which products to restock, in what quantities, and from
which suppliers using fragmented evidence: shelf inspections, photographed price lists, PDF
catalogues, WhatsApp messages, invoices, and basic sales spreadsheets. KasiStock AI converts that
evidence into one governed workflow:

```text
Shelf and supplier evidence
        ↓
GPT-5.6 structured extraction
        ↓
Human evidence verification
        ↓
Product identity reconciliation
        ↓
Deterministic stock calculations
        ↓
Budget-constrained optimisation
        ↓
Merchant approval
        ↓
Supplier purchase orders and messages
```

The application was designed around South African spaza shops and community retailers, but the
authority pattern applies to other small retailers working with limited cash and inconsistent source
data.

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
- A captioned 2:33.7 narrated demonstration and reproducible video-production scripts.
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

## How GPT-5.6 is used

GPT-5.6 provides the interpretation and proposal layer; it does not control financial authority.

- **Shelf images:** proposes visible products, brands, pack sizes, stock observations, confidence,
  and uncertainty reasons.
- **Supplier documents:** extracts supplier names, product descriptions, case quantities, prices,
  minimum quantities, and promotional terms from PDFs and images.
- **Product identity:** proposes a candidate only when barcode, governed alias, and deterministic
  name matching do not safely resolve a label. The candidate must reference an existing canonical
  product ID and always requires human confirmation.
- **Structured contracts:** every machine-consumed response is constrained by Zod Structured
  Outputs, treated as untrusted input, and requested with `store: false`.

Live validation used the exact project-accessible identifier `gpt-5.6-sol`. It successfully processed
a synthetic shelf image and supplier PDF. One supplier date was misread during production
validation; the raw output was preserved and deliberately left unaccepted. That failure case is
important evidence for why human acceptance—not model confidence—changes authority.

## Key engineering decisions

### AI interprets; deterministic code calculates

GPT-5.6 handles ambiguous images, documents, and labels. TypeScript owns authoritative money,
quantities, supplier comparisons, demand ceilings, optimisation, hashes, signatures, and purchasing.

### Human review changes authority

A confirmation screen alone is not sufficient oversight. An accepted review creates an immutable,
hash-bound evidence snapshot or product-mapping set. Only accepted records can enter the restocking
engine.

### Currency uses integer cents

All financial calculations use integer cents rather than floating-point rand values. For example,
`R1,399.10` is represented as `139910` cents, producing reproducible comparisons and totals.

### Uncertainty remains visible

Low-confidence observations and unresolved identities remain in explicit review states. An
unresolved product is safer than an incorrect automatic merge; the evaluation therefore measures
unsafe merges separately and currently records zero.

### The server rebuilds every consequential draft

Browser-submitted totals are requests, not authority. The server reloads hash-valid evidence and
mappings, rebuilds the order, enforces budget and demand ceilings, signs the draft, and requires a
named merchant's explicit approval before creating supplier artifacts.

### Persistence fails closed

When `DATABASE_URL` is configured, an unreachable database is an error rather than an excuse to
silently fall back to memory. Approval, supplier orders, messages, and audit events are committed in
one PostgreSQL transaction. The no-database prepared mode remains explicit and labelled
non-durable.

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

Prerequisites:

```text
Node.js 24.x
npm 11.x
```

The exact application and test dependency versions are pinned in `package-lock.json`. Clone the
private repository with an account that has access, then install from the lockfile:

```powershell
git clone https://github.com/Akwunwaj/kasistock-ai.git
cd kasistock-ai
npm ci
```

Create the local environment file.

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

macOS or Linux:

```bash
cp .env.example .env.local
```

Configure the existing server-side key in `.env.local`:

```text
OPENAI_API_KEY=<existing project key>
OPENAI_MODEL=gpt-5.6-sol
EVIDENCE_SIGNING_SECRET=<at least 32 random characters>
APP_BASE_URL=http://localhost:3000
DATABASE_URL=<optional locally; required for durable production evidence>
```

Never commit `.env.local`. Start the application and open the judge guide:

```powershell
npm run dev
```

```text
Application:   http://localhost:3000
Judge guide:   http://localhost:3000/judge
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

## Sample data

The prepared scenario is fictional, repository-local, and designed to exercise the same validation,
review, reconciliation, calculation, signing, approval, and PDF paths as live evidence.

```text
Merchant:                  Thandi's Corner Shop
Location:                  Khayelitsha, Cape Town
Purchasing budget:         R1,500.00
Canonical products:        4
Approved order total:      R1,399.10
Supplier purchase orders:  2
```

| Sample                | Path                                                    | Purpose                                                                   |
| --------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------- |
| Prepared extractions  | `fixtures/extraction/demo-extractions.ts`               | Shelf and supplier observations for the no-API judging flow               |
| Canonical catalogue   | `fixtures/catalogue/canonical-products.ts`              | Governed product IDs, aliases, barcodes, categories, and pack information |
| Accepted evidence     | `fixtures/decision/demo-accepted-evidence.ts`           | Human-accepted inputs for reconciliation and restocking                   |
| Complete scenario     | `fixtures/demo-scenario.ts`                             | Fictional merchant, budget, recommendation, and approval context          |
| Matching evaluation   | `evals/product-matching-cases.json`                     | Labelled identity and authority cases                                     |
| Sample purchase order | `fixtures/generated/sample-approved-purchase-order.pdf` | Integrity-bound PDF generated from an approved order                      |
| Live-validation shelf | `fixtures/live-validation/synthetic-shelf.png`          | Synthetic image used for safe GPT-5.6 validation                          |

Use **Use prepared demo** on `/evidence`; no manual fixture import is required. A project API key is
needed only when testing live shelf-image or supplier-document extraction.

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

Run the complete required gate with one command:

```powershell
npm run verify
```

It runs formatting, zero-warning linting, route type generation, strict TypeScript checks, the
normal Vitest suite, and the production build. The individual and extended checks are:

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

Generate the submission screenshots and short timing reference:

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

## How Codex accelerated the workflow

The verified supplied ZIP is the only repository baseline. It was imported as commit `aa0d075`
without claiming that the current task created its pre-existing functionality. The primary Codex
task then performed a substantive, repository-wide engineering and release continuation.

Codex provided the most leverage where one decision crossed domain contracts, server orchestration,
database persistence, API routes, tests, deployment evidence, and documentation. It repeatedly
inspected the whole dependency chain, implemented coordinated changes, ran the real gates, diagnosed
failures, and reconciled the evidence with what actually happened.

| Codex-accelerated work              | Key decision or result                                                                                                                                                                             | Evidence                                                                          |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Durable authority persistence       | Added PostgreSQL storage for accepted evidence, mappings, scenarios, calculations, signed drafts, approvals, supplier outputs, and audit events; kept the prepared fallback explicitly non-durable | `1bdb41b`, `modules/persistence/`, `db/schema.sql`                                |
| Transaction and integrity hardening | Made approval persistence atomic and fail-closed; fixed real PostgreSQL JSONB-array serialisation and same-day purchase-order collisions found by integration testing                              | `1bdb41b`, `tests/integration/postgres-workflow-persistence.test.ts`              |
| Live GPT-5.6 validation             | Verified `gpt-5.6-sol`, exercised shelf-image and PDF extraction, fixed the required PDF data-URI request shape, and preserved raw-versus-accepted correction evidence                             | `scripts/validate-live-workflow.mjs`, `submission/qa/live-openai-validation.json` |
| Portable installation               | Diagnosed 489 inaccessible lockfile registry URLs, changed only the registry host, preserved versions and integrity hashes, and proved the repair with clean installation and CI                   | `7867a95`, private PR #1                                                          |
| Browser and accessibility QA        | Ran desktop, 375 px mobile, PostgreSQL, fallback, and live browser paths; fixed muted-text contrast and mobile navigation defects                                                                  | `VERIFICATION_REPORT.md`, `tests/e2e/`                                            |
| Release and submission evidence     | Produced the final captioned 2:33.7 demonstration, reconciled verification records, rebranded the project, and recorded the real feedback evidence without rewriting prior commits                 | `9e7c7f7`, `ffc61df`, `submission/video/`                                         |

Primary Codex `/feedback` session ID:

```text
019f8102-3d1f-7142-a96d-c14344f0f73c
```

### Human and Codex collaboration

The owner selected the retail problem, approved the authority boundaries, supplied credentials only
through secure interactive flows, chose private/no-licence publication, approved dependency repair,
and retained final control over GitHub, Vercel, YouTube, and submission decisions. Codex performed
the continuation engineering, diagnosis, verification, documentation, and publication mechanics
within those decisions. This distinction is preserved in `submission/CODEX_EVIDENCE.md` and
`KASISTOCK_AI_LOG.md`.
