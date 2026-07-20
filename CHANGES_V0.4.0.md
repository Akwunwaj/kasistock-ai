# KasiStock AI v0.4.0 Changes

## Added

- Approval-controlled purchase-order domain contracts.
- Canonical recommendation, draft, approval, supplier-order and bundle hashes.
- HMAC-signed draft and approved-order envelopes.
- Server-side purchase-order draft reconstruction and validation.
- Explicit merchant approval workflow.
- Supplier-specific order grouping and WhatsApp-ready messages.
- A4 PDF generation and protected PDF endpoint.
- Six-stage audit timeline.
- Product-matching evaluation dataset, scorer, route and release test.
- Complete browser specification through final approval.
- PostgreSQL target tables for drafts, approvals, supplier orders, lines and messages.

## Changed

- `/decision` now continues from optimisation through editable quantities, approval and supplier
  outputs.
- The repository version is now 0.4.0.
- The verification suite now contains 34 tests in 17 files.
- Documentation, security boundaries and the three-minute demo script now cover the complete
  submission workflow.

## Preserved

- GPT output remains non-authoritative.
- Accepted evidence and product mapping hashes remain mandatory calculation inputs.
- Currency remains integer cents.
- No secret or local environment file is packaged.
