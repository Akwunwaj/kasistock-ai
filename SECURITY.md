# Security and Authority Controls

- `OPENAI_API_KEY` is server-only and excluded from source archives.
- OpenAI requests use `store: false`.
- Uploaded document text is explicitly treated as untrusted data.
- File size, declared MIME type and content signature are validated.
- CSV input is printable-text checked and schema parsed without spreadsheet formula execution.
- Extraction envelopes are HMAC signed before browser review.
- Accepted evidence is bound to source file hashes and review decisions.
- Canonical product IDs come only from the server-owned catalogue.
- GPT-5.6 identity suggestions remain human-confirmed proposals.
- Accepted product mappings are bound to the exact evidence hashes.
- Calculations reject tampered evidence, mappings and evidence/mapping mismatches.
- Money is represented as integer cents.
- Supplier ordering uses exact pack-cost comparisons rather than rounded floating-point ranking.
- Edited purchase quantities are rebuilt and validated server-side.
- Signed draft envelopes detect browser-side mutation.
- Explicit merchant approval is required before supplier outputs are generated.
- Approval, supplier order and bundle hashes bind every downstream business record.
- The PDF endpoint verifies the signed bundle and purchase-order hash before generation.
- PDF responses use `no-store` and attachment disposition headers.
- No model output can approve a purchase or create an accepted authority record.
- PostgreSQL writes use parameterised queries; approval and all downstream artifacts commit in one
  transaction or roll back together.
- Raw model output and human-accepted corrections are stored in separate tables and hashes.
- A configured but unreachable database fails closed instead of silently falling back.

Hosted durable deployments must configure `DATABASE_URL` and a persistent
`EVIDENCE_SIGNING_SECRET` of at least 32 random characters. The current PostgreSQL adapter atomically
persists approval, supplier orders, messages and audit events. Authentication, tenant isolation and
a delivery outbox are still required before real multi-merchant or supplier messaging use.

## Deployment release controls

- `OPENAI_API_KEY` and `EVIDENCE_SIGNING_SECRET` are never browser-prefixed.
- `/api/readiness` returns booleans only and never returns secret contents.
- Production configuration is validated without printing credentials.
- Live OpenAI validation reports only model, response ID, status, and latency.
- Responses include frame denial, MIME sniffing prevention, strict referrer policy, permissions
  restrictions, and same-origin opener policy.
- Submission screenshots and draft video are generated from prepared fictional evidence and contain
  no credentials or customer data.

## Dependency review

`npm audit --omit=dev` on 20 July 2026 reported no high or critical vulnerabilities and two moderate
findings in the pinned dependency tree. The reported transitive `postcss` advisory concerns
stringifying untrusted CSS; KasiStock does not generate or stringify user-controlled CSS at runtime.
No broad automated version change was applied because it would violate the approved pinned stack.
Reassess the official upstream fix before production launch.

## Live validation finding

In a synthetic supplier PDF, GPT-5.6 extracted all three prices and case quantities correctly but
misread the visible year 2026 as 2025. The raw response remains immutable. The signed acceptance path
stored a separate corrected date, demonstrating why valid structured output is not automatically
trusted evidence.
