# KasiStock AI continuation verification report

Verification date: **21 July 2026 SAST**

## Baseline integrity

- Source archive: supplied v0.5.0 baseline archive
- Expected and observed SHA-256:
  `44fca5be9b2391d53ca0018da5f6fd1b2195a6703a9f0b4c0d95062e1d6d7b29`
- Archive path review: 220 entries, one repository root, no unsafe extraction paths.
- Imported baseline commit: `aa0d075`.

## Verified toolchain

The continuation ran with Node.js 24.18.0 and npm 11.16.0. The repository's approved application
versions remain pinned, including Next.js 16.2.10, React 19.2.7, TypeScript 6.0.3, OpenAI SDK
6.48.0, Zod 4.4.3, pdf-lib 1.17.1, Vitest 4.1.10, Playwright 1.61.1, axe-core Playwright 4.12.1,
and node-postgres 8.22.0.

## Local quality gates

```text
npm ci:                              PASSED
Prettier:                            PASSED
ESLint, zero warnings:               PASSED
Next route type generation:          PASSED
TypeScript strict checking:          PASSED
Normal test files:                   18 passed, 1 conditional DB test skipped
Normal tests:                        38 passed, 1 conditional DB test skipped
Next.js production build:            PASSED (23 routes)
Product matching eval:               PASSED (91.67%, 0 unsafe automatic merges)
git diff --check:                    PASSED
```

The initial Next.js build exposed incorrect workspace-root inference from a parent lockfile.
`turbopack.root` is now explicitly the repository root.

## PostgreSQL durability

A disposable `postgres:17` container was used on localhost port 55432.

```text
First schema migration:              PASSED, applied=true
Second schema migration:             PASSED, applied=false (idempotent)
Real database integration test:      1 passed
Accepted evidence rows:              4 in the isolated integration scenario
Accepted mapping set:                1
Approved scenario/draft/approval:    1 each
Supplier orders/messages:            persisted
Audit events:                        6
Atomic rollback/client release:      covered by adapter and test path
```

The real-database run found and fixed two defects that mocked tests did not reveal: JSON arrays needed
explicit JSON serialisation for `jsonb`, and same-day purchase-order numbers needed a draft-hash
component to avoid unique-key collisions.

The production Neon resource was provisioned through Vercel. Migration
`001_initial_f2aa9e581069a868` reported `applied=true` on the first run and `applied=false` on the
second. A remote Neon integration run passed 1/1 with a 30-second allowance for network latency.

## Live OpenAI validation

Current official guidance identifies `gpt-5.6-sol` as the explicit flagship model. The configured
project key was reused without printing it.

```text
Minimal Responses API smoke test:    PASSED
Model requested:                     gpt-5.6-sol
Response ID:                         resp_0ef04ac8d1cf545f016a5e81d3b2dc81a38cc018604770f270
Latency:                             2721 ms
Synthetic shelf extraction:          PASSED (4 maize, 3 beans, 2 oil)
Synthetic supplier PDF extraction:   PASSED (3 exact integer-cent offers)
Persistence receipts:                postgresql, durable=true
```

The first live PDF request failed because the SDK requires a
`data:application/pdf;base64,...` URI. The request shape and regression test were corrected. On the
repeatable live run, the model misread the catalogue year as 2025 instead of the visible 2026. The
raw model result was preserved and a separate accepted snapshot corrected the date through the signed
review endpoint. Safe IDs, hashes, expected values, and the correction are recorded in
`submission/qa/live-openai-validation.json`.

Production extraction-only validation then reconfirmed the deployed key and exact model identifier
without creating accepted evidence:

```text
Shelf response ID:                    resp_0742af2ba8f74922016a5f35d0d6448192b017e50286ebfc11
Supplier response ID:                 resp_0f4f6b4cda005e88016a5f35db8104819292824c6e069a2a98
Model/mode/persistence:               gpt-5.6-sol / live / postgresql
Shelf products / supplier offers:     3 / 3
Raw supplier date:                    2007-03-20 (incorrect, left unaccepted)
```

### Evidence extraction timeout remediation

Production runtime evidence on 21 July showed `/api/extractions` being terminated at its explicit
60-second Vercel limit, which returned plain text and caused the browser's JSON parse error. The
route limit is now 300 seconds, OpenAI calls are bounded to 240 seconds with one retry, and the
evidence-only request uses low reasoning effort while preserving high-detail vision, `store: false`,
the exact `gpt-5.6-sol` identifier and the strict extraction contracts.

```text
Screenshot image payload:            HTTP 200 in 8,657 ms
Known synthetic shelf fixture:       HTTP 200 in 9,970 ms
Synthetic products:                  KASI MAIZE / KASI BEANS / KASI OIL
Model / mode:                         gpt-5.6-sol / live
Persistence:                          postgresql, durable=true
Post-fix route timeouts:              0 observed
```

The supplied attachment was the UI error screenshot rather than the original `Shelf_image_1.png`;
the screenshot therefore validated image transport and the synthetic fixture validated extraction
quality. Neither raw extraction was human-accepted.

## Browser and accessibility QA

System Chrome was used through Playwright because managed Chromium download was unavailable.

```text
Production Playwright, PostgreSQL:    8 passed
Production Playwright, fallback:      9 passed
axe WCAG A/AA checks per run:         5 passed, 0 violations
Desktop in-app browser review:        PASSED
375 px mobile in-app review:          PASSED, no horizontal overflow
Browser console errors/warnings:      0
Live production Playwright post-fix:  8/9 passed
```

Browser QA found and fixed one 4.36:1 muted-text contrast failure and a mobile navigation rule that
hid all primary links below 720 pixels. The post-fix live run passed every evidence and accessibility
test; the separate decision flow received HTTP 503 from `/api/product-mappings` and remains an
explicit persistence blocker rather than being reported as passed.

## Security checks

- Safe readiness output: HTTP 200 with Boolean/configuration status only.
- PostgreSQL mode: configured and reachable.
- Prepared fallback mode: explicit, non-durable, HTTP 200.
- HMAC tamper rejection and server-side draft reconstruction: passing tests.
- `npm audit --omit=dev`: 0 high, 0 critical, 2 moderate transitive findings.
- Secrets remain ignored; no plaintext OpenAI key was read or printed.
- The live deployment returns HSTS, `nosniff`, deny-framing, same-origin opener, restrictive
  permissions and strict-origin referrer headers. Content Security Policy remains a documented
  post-submission hardening gap.

## GitHub and production deployment

```text
Repository:                           https://github.com/Akwunwaj/kasistock-ai
Visibility / licence:                 private / none (owner decision)
Portable-install pull request:        https://github.com/Akwunwaj/kasistock-ai/pull/1
GitHub Actions run:                   https://github.com/Akwunwaj/kasistock-ai/actions/runs/29816237274
Quality / browser jobs:               passed / passed
Production commit:                    33eb68da72deffb236a3cde29503015cca9ca337
Production URL:                       https://kasistock-ai.vercel.app
Vercel deployment:                    ready (48-second build)
Readiness / health / home:            HTTP 200 / HTTP 200 / HTTP 200
Persistence:                          postgresql, configured=true, reachable=true
```

## Generated validation fixtures

- `fixtures/live-validation/synthetic-shelf.png`: fictional generated shelf; visually checked.
- `output/pdf/synthetic-supplier-catalogue.pdf`: fictional one-page catalogue; rendered to PNG and
  visually checked for clipping, alignment and legibility.
- `scripts/validate-live-workflow.mjs`: repeatable safe end-to-end validator.

## Final narrated video

The final video was generated from ten freshly captured 1920 x 1080 product frames. Narration uses
the OpenAI `gpt-4o-mini-tts` model with the Marin built-in voice, and the opening sentence and title
card disclose that the voice is AI-generated. Twenty-one captions are burned into the video and
also supplied as an SRT sidecar.

```text
Container/codecs:                    MP4, H.264 video, AAC audio
Resolution/frame rate:               1920 x 1080, 30 fps
Narration duration:                  153.456 seconds
Final video duration:                153.700 seconds
Final video size:                    6,040,484 bytes
Final video SHA-256:                 55301ba5ab0c4f1d1cdf43b23c0b08e3acac6015bc1233d654ca8c4a3301d253
Visual samples inspected:            3, passed
Three-minute requirement:            passed
```

## Primary Codex feedback evidence

The `/feedback` dialog was submitted from the primary continuation task with logs included.

```text
Session ID:                           019f8102-3d1f-7142-a96d-c14344f0f73c
```

## Not yet complete

- Judge access to the private repository must be granted if the competition requires source review.
- Final narrated video is locally complete; YouTube upload and Devpost submission remain external.

## Current result

```text
ENGINEERING, CI, DEPLOYMENT AND LIVE VALIDATION: PASSED
YOUTUBE AND DEVPOST SUBMISSION: PENDING
```
