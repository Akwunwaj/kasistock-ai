# KasiStock AI v0.5.0 Verification Report

## Release scope

Deployment hardening and OpenAI Build Week submission asset production.

## Verified toolchain

```text
Node.js:              24.15.0
npm:                  11.12.1
Next.js:              16.2.10
React:                19.2.7
TypeScript:           6.0.3
OpenAI Node SDK:      6.48.0
Zod:                  4.4.3
pdf-lib:              1.17.1
Vitest:               4.1.10
Playwright:           1.61.1
axe-core Playwright:  4.12.1
```

## Clean-source gates

A dependency-free copy was created and verified using the exact declared Node and npm versions.

```text
Clean npm ci:                         PASSED
Prettier formatting:                  PASSED
ESLint with zero warnings:            PASSED
Next route type generation:           PASSED
TypeScript strict type checking:      PASSED
Automated test files:                 17 PASSED
Automated tests:                      34 PASSED
Automated test failures:              0
Product-matching evaluation:          PASSED
Next.js production build:             PASSED
Production environment validation:    PASSED
```

## Production runtime verification

The built production server was started with temporary, non-release validation values. No real API
key or signing secret was written to the repository.

```text
Home dashboard:                       HTTP 200
Judge guide:                          HTTP 200
Evidence workspace:                   HTTP 200
Decision workspace:                   HTTP 200
Architecture page:                    HTTP 200
Evidence submission preview:          HTTP 200
Approved-order submission preview:    HTTP 200
Health endpoint:                      HTTP 200
Readiness endpoint:                   HTTP 200
Open Graph image:                     HTTP 200
Web manifest:                         HTTP 200
robots.txt:                           HTTP 200
sitemap.xml:                          HTTP 200
```

The readiness endpoint returned `status: ready` with all four Boolean checks passing.

## Security response headers

The production response included:

```text
Cross-Origin-Opener-Policy: same-origin
Permissions-Policy: camera=(), geolocation=(), microphone=()
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

The readiness endpoint reports only Boolean configuration status and does not expose secret values.

## Accessibility verification

Five server-rendered judging surfaces were audited with axe-core against WCAG 2 A/AA and WCAG 2.1
A/AA rules:

```text
/                                     0 violations
/judge                                0 violations
/submission-preview/evidence          0 violations
/submission-preview/approved          0 violations
/architecture                         0 violations
Total:                                0 violations
Result:                               PASSED
```

The audit used deterministic server-rendered DOM loaded into the available offline Chromium runtime.
The managed system Chromium is policy-blocked from navigating to local HTTP addresses, while download
of Playwright-managed Chromium was unavailable because the Playwright CDN could not be resolved.
Therefore the complete interactive Playwright suite is included but is not claimed as executed here.

Run it in an unrestricted environment with:

```powershell
npm ci
npx playwright install chromium
npm run test:e2e
```

## Submission assets

Generated and verified:

```text
1440 x 900 screenshots:               4
Accessibility report:                 PRESENT
Copy-ready Devpost entry:             PRESENT
Deployment runbook:                   PRESENT
Publication checklist:                PRESENT
Codex evidence guide:                 PRESENT
Three-minute narration script:        PRESENT
Draft reference MP4:                  16 seconds
```

The draft MP4 is a silent visual timing reference. It is not represented as the final narrated
YouTube submission.

## Core authority workflow retained from v0.4.0

```text
Accepted evidence snapshots:          4
Accepted product mappings:            16
Restock candidates:                    4
Selected order lines:                  3
Available budget:                 R1,500.00
Approved order total:             R1,399.10
Budget remaining:                   R100.90
Supplier purchase orders:             2
Supplier messages:                    2
Audit events:                          6
Tampered signed draft:               REJECTED
Evaluation cases:                     12
Evaluation cases passed:              11
Unsafe automatic merges:               0
```

## Live OpenAI validation status

No plaintext API key was present in the packaging environment. Consequently, no billed live GPT-5.6
request was made. The release includes `npm run validate:openai`, which performs one minimal Responses
API request and returns only safe metadata after the existing key and an exact project-supported model
identifier are configured.

Both OpenAI adapters remain covered by injected-SDK integration tests, and the prepared judging path
works without a live model request.

## Credential-bound actions not performed

The following require the user's external accounts and were deliberately not represented as complete:

- publishing the repository to GitHub;
- importing and deploying it to Vercel;
- adding production environment variables;
- recording the primary Codex `/feedback` session ID;
- recording and publishing the final narrated YouTube video;
- submitting the final Devpost form.

Copy-ready commands and instructions are included under `submission/`.

## Release integrity

- No `.env.local`, API key or signing secret is included.
- `node_modules`, `.next`, Playwright reports and other generated dependency/build directories are excluded.
- Source-file SHA-256 hashes are provided in `SOURCE_FILE_HASHES.txt`.
- Runtime evidence is provided in `runtime-verification.json`.
- Machine-readable gate evidence is provided in `verification-evidence.json`.
- The ZIP is independently extracted and integrity-tested before release.

## Result

```text
RELEASE STATUS: READY FOR CREDENTIAL-BOUND PUBLICATION, LIVE OPENAI VALIDATION,
FINAL NARRATED VIDEO RECORDING AND DEVPOST SUBMISSION
```
