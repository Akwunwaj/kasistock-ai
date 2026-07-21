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
- Live evidence extraction no longer inherits a 60-second platform deadline: the route allows 300
  seconds, the OpenAI client is bounded below that deadline, and extraction reasoning uses low effort
  while retaining high-detail vision and the strict structured-output contracts.
- Plain-text platform timeout responses now produce an actionable UI message instead of exposing a
  JSON parse error.
- Missing structured output now distinguishes incomplete and refused Responses API outcomes in safe
  server diagnostics.

## Verified

- 38 normal tests passed; one database-conditional test skipped in the normal suite.
- One real PostgreSQL authority-chain integration test passed.
- Nine Playwright tests passed in prepared fallback mode. Post-fix live production QA passed 8/9;
  the unrelated product-mapping persistence request returned HTTP 503 and remains recorded as a
  blocker.
- Five axe surfaces reported zero WCAG A/AA violations in each production run.
- Live `gpt-5.6-sol` smoke, image, and PDF calls passed.
- The live supplier year mismatch was corrected only after the signed acceptance boundary; raw model
  output remains preserved.
