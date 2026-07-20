# KasiStock AI — Codex Operating Contract

## Mission

Build a trustworthy, explainable restocking application for cash-constrained small retailers.
The primary workflow is evidence upload → human verification → deterministic optimisation →
explanation → explicit approval → purchase order.

## Non-negotiable authority boundaries

1. GPT-5.6 may interpret images and documents, propose product matches, and explain results.
2. GPT-5.6 must never calculate authoritative money totals, choose final quantities directly,
   approve purchases, or overwrite original evidence.
3. Currency calculations use integer cents only.
4. Only human-accepted evidence may enter the optimiser.
5. Every recommendation must be reproducible and traceable to versioned inputs.
6. Purchase-order creation requires an immutable approval record.

## Architecture rules

- Keep domain logic under `modules/*/domain` and free of framework dependencies.
- Keep application orchestration under `modules/*/application`.
- Keep OpenAI and persistence adapters under infrastructure or `lib` boundaries.
- Validate all external and model-produced data with Zod at the boundary.
- Do not expose `OPENAI_API_KEY` to client components, logs, fixtures, commits, or generated ZIPs.
- Preserve original model output and human corrections as separate records.

## Required checks

Before considering a task complete, run:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
```

Add or update tests whenever a domain invariant changes.

## Scope guardrails for Build Week

Do not add billing, full multi-tenancy, delivery logistics, complex RBAC, or production-scale
WhatsApp onboarding before the primary demonstration path is complete and verified.

## Product identity rules

- Barcode and governed exact aliases may auto-confirm.
- Token similarity and GPT suggestions must require human confirmation.
- Never allow a model to invent a canonical product ID.
- Restock calculations must verify both evidence and mapping hashes.

## Purchase-order authority rules

- Client-edited quantities are requests, not authoritative draft records.
- Rebuild every draft server-side from hash-valid accepted evidence and mappings.
- Reject unknown candidates, quantities above accepted demand ceilings and totals above budget.
- Sign drafts before browser approval and verify the signature before accepting approval.
- Require a named actor and explicit confirmation statement.
- Generate supplier orders, messages and PDFs only after approval.
- Verify bundle and purchase-order hashes before PDF generation.
- Preserve approval and document evidence as immutable records.
