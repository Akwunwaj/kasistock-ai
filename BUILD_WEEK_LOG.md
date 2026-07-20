# Build Week Implementation Log

Use this log together with Git history and Codex session evidence.

## 18 July 2026 — Architecture and repository scaffold

### Scope

- Established the standalone Next.js repository.
- Defined AI, deterministic-code, and merchant authority boundaries.
- Added versioned extraction contracts, money invariants, optimiser baseline, database schema,
  seeded demonstration UI, audit concepts, tests, and submission governance documents.

### Codex contribution

- Repository architecture and file layout.
- Responsive demonstration workspace.
- Initial domain contracts and deterministic tests.
- Verification and packaging.

### Verification

- `npm run verify`: passed.
- Formatting: passed.
- ESLint: passed with zero warnings.
- TypeScript strict type check: passed.
- Unit tests: 7 passed, 0 failed.
- Next.js production build: passed.
- Runtime HTTP smoke test: home page and `/api/health` passed.
- Playwright E2E specification: created; browser execution was not run because the execution
  environment could not resolve `cdn.playwright.dev` to download Chromium.
- Live OpenAI request: intentionally not run; no API key is embedded in the repository or archive.

### Primary Codex `/feedback` session ID

`TO_BE_RECORDED_BEFORE_SUBMISSION`

## 2026-07-18 — v0.2.0 multimodal evidence and human verification

- Added live shelf-image and supplier-document ingestion.
- Added magic-byte, MIME-type, and size validation before model invocation.
- Implemented GPT‑5.6 Sol Responses API adapters with Zod Structured Outputs and `store: false`.
- Added prompt-injection isolation for text contained inside uploaded evidence.
- Added confidence-derived review issues and an editable merchant verification workspace.
- Added HMAC-signed extraction envelopes, tamper verification, explicit review decisions, and
  immutable accepted-evidence snapshots with canonical SHA-256 hashes.
- Added prepared demo extraction routes so judges can test the authority workflow without API
  availability.
- Expanded automated coverage to file validation, review issue generation, OpenAI request shape,
  unresolved-review rejection, tamper detection, and evidence-hash repeatability.

## 2026-07-18 — v0.3.0 product reconciliation and calculations

- Added deterministic sales-history CSV ingestion and accepted snapshot support.
- Added a canonical product catalogue, barcodes, aliases and matching precedence.
- Added exact, normalised and fuzzy match proposals.
- Added GPT‑5.6 structured candidate suggestions with mandatory human authority.
- Added immutable accepted product mapping sets and integrity verification.
- Added accepted-evidence-driven stock, velocity, cover, supplier-cost and reorder calculations.
- Added optimiser-ready inputs and the `/decision` workspace.
- Added API routes, database target schema and 11 tests.

## 2026-07-18 - v0.4.0 approval-controlled purchasing and submission polish

- Added editable final order quantities constrained by accepted optimiser candidates.
- Added server-side draft reconstruction, demand ceilings, budget enforcement and recommendation
  hashes.
- Added HMAC-signed purchase-order drafts and tamper rejection.
- Added explicit merchant approval records and approval hashes.
- Added supplier-specific purchase orders, WhatsApp-ready messages and a six-event audit timeline.
- Added verified A4 PDF generation with buyer, supplier, fulfilment, totals and integrity hashes.
- Added a 12-case product matching evaluation dataset and scoring endpoint.
- Measured 91.67% product and authority accuracy with zero unsafe automatic merges.
- Expanded automated coverage to 34 tests across 17 files.
- Verified the complete production HTTP workflow and visually inspected a rendered purchase-order
  PDF.

## 2026-07-18 — v0.5.0 deployment and submission release

- Reconciled official Build Week deadline, judging criteria, and required submission materials.
- Added Vercel, GitHub Actions, Node 24, readiness, and production environment validation.
- Added live OpenAI access validation without secret disclosure.
- Added security headers, metadata, manifest, sitemap, robots, and Open Graph image generation.
- Added a zero-sign-up `/judge` path and deterministic screenshot preview routes.
- Added skip navigation, focus styling, reduced-motion support, and contrast remediation.
- Added axe-core WCAG A/AA audit: five judged surfaces, zero violations.
- Generated four 1440×900 screenshots and a 16-second draft MP4.
- Prepared Devpost copy, a 2:35 narration script, Codex evidence guidance, deployment commands, and
  publication checklist.
- Publication and live-key validation remain credential-bound and must be completed by the user.

## 2026-07-18 — v0.5.0 final release gate

- Verified a dependency-free source copy with Node 24.15.0 and npm 11.12.1.
- Passed formatting, zero-warning linting, route type generation, strict type checking, 34 tests,
  the product-matching evaluation, production environment validation and the Next.js build.
- Verified 13 built production routes, readiness checks and six security response headers.
- Re-generated four 1440 x 900 screenshots and the draft timing-reference MP4.
- Audited five server-rendered judging surfaces with zero WCAG A/AA violations.
- Left live OpenAI validation, GitHub publication, Vercel deployment, final narrated YouTube upload,
  Codex `/feedback` session recording and Devpost submission as explicit credential-bound actions.
