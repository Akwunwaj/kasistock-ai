# Codex continuation changes - 20 July 2026

This file records only work genuinely performed in the current primary Codex task. The verified
v0.5.0 ZIP remains the sole baseline.

## Added

- PostgreSQL workflow persistence for uploads, extraction jobs, accepted evidence, accepted mappings,
  scenarios, calculations, recommendations, signed drafts, approvals, supplier orders, messages and
  audit events.
- Idempotent content-hashed migration runner and `npm run db:migrate`.
- Explicit non-durable prepared fallback receipts and persistence-aware readiness checks.
- Real PostgreSQL integration and fallback unit tests.
- Synthetic shelf image and supplier catalogue PDF live-validation fixtures.
- Repeatable `npm run validate:live-workflow` evidence generation.
- Safe live GPT-5.6 response-ID and accepted-correction evidence.

## Fixed

- JSON arrays now serialise correctly into PostgreSQL `jsonb` columns.
- Purchase-order numbers include a stable draft-hash component, avoiding same-day uniqueness clashes.
- PDF `input_file.file_data` now uses the required `data:application/pdf;base64,...` URI.
- Next.js Turbopack no longer infers a parent directory as the project root.
- Muted text meets WCAG AA contrast in the tested theme.
- Primary mobile navigation remains visible and wraps without horizontal overflow.
- Stale Playwright copy assertions now match the actual prepared workflow.

## Verified

- 37 normal tests passed; one database-conditional test skipped in the normal suite.
- One real PostgreSQL authority-chain integration test passed.
- Eight production Playwright tests passed in PostgreSQL mode and again in prepared fallback mode.
- Five axe surfaces reported zero WCAG A/AA violations in each production run.
- Live `gpt-5.6-sol` smoke, image, and PDF calls passed.
- The live supplier year mismatch was corrected only after the signed acceptance boundary; raw model
  output remains preserved.
