# KasiStock AI Architecture

## Objective

KasiStock AI assists a cash-constrained small retailer without allowing probabilistic model output
to control identity, money or purchasing authority.

## Trust and authority boundaries

### 1. Untrusted evidence

Shelf images, PDFs, catalogue photographs and CSV rows are data. Text inside uploaded files is
never treated as an instruction.

### 2. Model interpretation

GPT-5.6 may extract visible facts or propose a product identity. Responses use strict structured
contracts. Model output is not accepted business evidence by default.

### 3. Human evidence authority

Uncertain extraction paths must be accepted or corrected by a person. The server verifies the
signed extraction envelope and creates an immutable accepted-evidence snapshot.

### 4. Product identity authority

Only barcode, governed alias and exact normalised-name matches may auto-confirm. Fuzzy and GPT
suggestions require explicit human confirmation.

### 5. Deterministic calculation authority

Sales velocity, selling price, days of cover, target stock, supplier effective unit cost, reorder
requirements and optimiser candidates are calculated from hash-valid accepted evidence and
mappings using integer currency values.

### 6. Draft authority

The browser submits only requested pack selections. The server rebuilds the draft from accepted
snapshots and the mapping set, rejects unknown candidates, enforces demand ceilings and budget,
computes a canonical hash, and returns an HMAC-signed envelope.

### 7. Approval authority

Approval requires a verified draft signature, a valid draft hash, an identified merchant actor and
an explicit confirmation statement. Approval creates a separate immutable hash.

### 8. Document authority

Supplier purchase orders are grouped only after approval. The PDF endpoint verifies the approved
bundle signature, bundle hash and individual purchase-order hash before generating a document.

## End-to-end request flow

```text
Evidence upload
  -> file validation
  -> GPT extraction or deterministic CSV parsing
  -> structured validation
  -> human evidence review
  -> accepted snapshot hash
  -> deterministic identity proposals
  -> optional GPT identity suggestion
  -> human identity confirmation
  -> accepted mapping hash
  -> restock calculations
  -> deterministic optimiser
  -> merchant quantity edits
  -> server-rebuilt signed draft
  -> explicit merchant approval
  -> approval hash
  -> supplier orders and WhatsApp-ready messages
  -> verified PDF generation
  -> audit timeline
```

## Purchasing invariants

- A selected order line must exist in the accepted optimiser candidate set.
- Selected packs cannot exceed the accepted demand ceiling.
- Zero-pack selections are removed before drafting.
- The final order cannot exceed the entered budget.
- Draft hashes exclude random identifiers but include all business-authoritative fields.
- Approval hashes bind the draft, recommendation, evidence and mapping hashes.
- Supplier purchase-order hashes bind supplier, buyer, fulfilment, lines, totals and approval.
- HMAC signatures prevent a browser from recomputing a valid server authority token.
- PDF generation is unavailable before approval.

## PDF generation

`modules/purchasing/infrastructure/purchase-order-pdf.ts` creates an A4 supplier document with
standard embedded fonts. It includes buyer, supplier, fulfilment, line items, totals and integrity
hashes. Generated PDFs are visually rendered during release verification.

## Evaluation model

The deterministic product matcher is evaluated against `evals/product-matching-cases.json`.
The release gate measures product accuracy, authority-state accuracy and unsafe automatic merges.
A wrong automatic merge is a release blocker even if aggregate accuracy remains high.

## Runtime modules

```text
modules/catalogue/
modules/extraction/
modules/evidence/
modules/reconciliation/
modules/restocking/
modules/optimisation/
modules/purchasing/
modules/audit/
modules/persistence/
```

## Persistence implementation

`db/schema.sql` separates uploads, raw extraction jobs, human-accepted evidence, mapping sets,
calculations, recommendations, signed purchase-order drafts, approval records, supplier orders,
line items, supplier messages and audit events. `scripts/migrate-database.mjs` applies the schema
idempotently and records a content-derived migration ID.

`PostgresWorkflowPersistence` uses parameterised statements and single-client transactions. The
approval write atomically records the verified draft, approval, supplier orders and lines, supplier
messages, all six audit events, and final status transitions. Raw model output remains distinct from
accepted corrections. Canonical catalogue rows and governed aliases are seeded as server-owned data.

When `DATABASE_URL` is absent, `PreparedWorkflowPersistence` returns an explicit non-durable receipt.
This preserves the prepared no-API judging experience without presenting memory-only state as durable.
When a database is configured but unreachable, affected writes fail closed with a safe 503 response.

## Post-competition production gates

- Transactional delivery outbox and retry workers.
- Authentication, tenant isolation and durable merchant sessions.
- Bounded dynamic-programming optimiser.
- Larger extraction, matching and recommendation evaluation datasets.
- Real WhatsApp Cloud API delivery after supplier consent and template-policy review.
- Deployment observability, backups and disaster recovery.

## Submission and deployment surface — v0.5.0

The public competition deployment adds no new financial authority. It exposes:

- `/judge` for a guided, zero-sign-up evaluation path.
- `/api/health` for liveness.
- `/api/readiness` for boolean-only configuration readiness; secret values are never returned.
- `/submission-preview/*` for deterministic media generation from server-rendered evidence and
  approved-order states.

Deployment uses a Git-based Vercel build and Node.js 24 CI. OpenAI, signing, and database credentials
remain server-only. The prepared judging workflow remains available when live OpenAI access or a
database is unavailable.

### Accessibility verification boundary

The release contains two complementary layers:

1. Full Playwright interaction specifications for home, evidence, decision, and approval workflows.
2. Production-server Playwright interaction and axe checks using local system Chrome.

The final continuation gate executed eight browser tests against both PostgreSQL-backed and explicit
prepared-fallback production servers. A 375-pixel mobile browser review also verified that all primary
navigation remains available without horizontal overflow.
