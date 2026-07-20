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

Hosted deployments must configure a persistent `EVIDENCE_SIGNING_SECRET` of at least 32 random
characters and replace the in-memory prototype routes with authenticated transactional
repositories. The production database transaction should atomically persist the approval, supplier
orders, messages, audit events and outbox records.

## Deployment release controls

- `OPENAI_API_KEY` and `EVIDENCE_SIGNING_SECRET` are never browser-prefixed.
- `/api/readiness` returns booleans only and never returns secret contents.
- Production configuration is validated without printing credentials.
- Live OpenAI validation reports only model, response ID, status, and latency.
- Responses include frame denial, MIME sniffing prevention, strict referrer policy, permissions
  restrictions, and same-origin opener policy.
- Submission screenshots and draft video are generated from prepared fictional evidence and contain
  no credentials or customer data.
