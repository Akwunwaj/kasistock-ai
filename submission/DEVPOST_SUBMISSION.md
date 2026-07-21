# Devpost submission copy — KasiStock AI

## Project name

KasiStock AI

## Tagline

Turn limited cash into the right stock.

## Track

Work and Productivity

## One-sentence pitch

KasiStock AI helps cash-constrained small retailers turn shelf images, supplier catalogues, recent sales, and a cash budget into an explainable, human-approved supplier purchase order.

## Inspiration

Small retailers often restock from memory, visual shelf checks, handwritten or photographed supplier lists, and a fixed amount of cash. The hard question is not simply what is low in stock. It is: **what should I buy today, from which supplier, in which pack sizes, without exceeding the money available?**

KasiStock AI was designed around that decision. It focuses on spaza shops and other small retailers in South Africa, but the underlying working-capital problem is common across emerging retail markets.

## What it does

KasiStock AI implements one complete authority-controlled workflow:

1. GPT-5.6 extracts structured facts from shelf images and supplier documents.
2. The merchant reviews uncertain evidence before it can be accepted.
3. Deterministic matching reconciles product identities across shelf, sales, and supplier records.
4. Uncertain identity proposals require explicit human confirmation.
5. Deterministic code calculates sales velocity, days of cover, supplier effective unit costs, reorder quantities, and a budget-constrained basket.
6. The merchant can edit pack quantities within accepted demand and budget ceilings.
7. The server rebuilds and signs the draft before explicit approval.
8. Approved supplier-specific purchase orders, PDFs, WhatsApp-ready messages, and audit evidence are generated.
9. With PostgreSQL configured, every accepted authority layer is durably persisted; the prepared
   judging path remains available without claiming durability.

The prepared demonstration uses a R1,500 budget and produces a R1,399.10 approved order, leaving R100.90 unspent.

## How it was built

The application is a standalone Next.js 16 and React 19 project written in TypeScript. OpenAI's Responses API and strict Zod Structured Outputs handle multimodal extraction and candidate product matching. Financial calculations, pack constraints, supplier ranking, and budget optimisation remain deterministic and use integer cents.

The authority model is intentionally separated:

- **AI:** interpret messy evidence, propose matches, explain deterministic results.
- **Deterministic code:** control money, quantities, constraints, hashes, and approval state.
- **Human:** resolve uncertainty and authorise the purchase.

Integrity controls include source SHA-256 fingerprints, HMAC-signed extraction and draft envelopes, accepted-evidence hashes, accepted mapping hashes, recommendation hashes, approval hashes, and supplier purchase-order hashes.

The supplied v0.5.0 archive provided the working evidence-to-order baseline. In the primary Codex
continuation task, Codex genuinely added PostgreSQL persistence and migration tooling, atomic approval
writes, real-database tests, live GPT-5.6 shelf/PDF validation, a PDF input fix, purchase-order
collision hardening, browser/accessibility fixes, and refreshed engineering and submission evidence.

## Challenges

The most important challenge was preventing model output from quietly becoming financial authority. The solution was to create explicit evidence and approval boundaries rather than treating an AI response as an order.

A second challenge was reconciling inconsistent supplier and sales labels. KasiStock AI uses deterministic precedence—barcode, governed alias, normalised name, and token similarity—before asking GPT-5.6 for a candidate. Low-authority matches never merge automatically.

The final challenge was producing a judging experience that remains reliable when an external model call is unavailable. The application therefore includes prepared evidence that passes through the same signing, human review, calculation, and approval controls as live evidence.

Live validation reinforced that boundary: GPT-5.6 extracted every supplier price and case quantity
correctly but read a visible 2026 date as 2025. KasiStock preserved the raw response and accepted a
separate corrected snapshot rather than allowing valid JSON to become unquestioned truth.

Production extraction-only validation reinforced it again: the deployed model returned the three
correct supplier offers but misread the same visible date as 2007-03-20. That raw result was left
unaccepted, demonstrating that structured output is evidence, not authority.

## Accomplishments

- Complete evidence-to-approved-order workflow.
- 37 passing normal automated tests plus a real PostgreSQL authority-chain integration test.
- Twelve-case product-identity evaluation with 91.67% accuracy and zero unsafe automatic merges.
- Four submission screenshots and a draft MP4 generated reproducibly from the app.
- Eight passing production Playwright tests in both PostgreSQL and prepared-fallback modes, including
  five axe surfaces with zero WCAG A/AA violations.
- Live `gpt-5.6-sol` shelf and supplier PDF extraction with safe response-ID evidence.
- Live Vercel deployment backed by Neon PostgreSQL, secure headers, readiness checks, green GitHub
  Actions CI, and 8/8 production Playwright tests.
- Signed, supplier-specific PDF purchase orders and WhatsApp-ready messages.

## What was learned

AI is most useful in this workflow where the data is messy: interpreting images, documents, and inconsistent labels. It is least appropriate where correctness must be reproducible: currency arithmetic, constraints, approval, and order creation. The strongest design came from combining both approaches and making the boundary visible to the user.

## What's next

Post-competition work would add authentication, multi-tenancy, production backups, a transactional
delivery outbox, live supplier integrations, WhatsApp Cloud API delivery, replenishment feedback
loops, and broader product and language coverage.

## Built with

Next.js, React, TypeScript, OpenAI Responses API, GPT-5.6 Sol, Codex, Zod, PostgreSQL, node-postgres,
pdf-lib, Vitest, Playwright, axe-core, GitHub Actions, and Vercel deployment configuration.

## Links to complete before submission

- Public demo: `https://kasistock-ai.vercel.app`
- Code repository: `https://github.com/Akwunwaj/kasistock-ai` (private, no licence)
- Demo video: `<YOUTUBE_URL>`
- Primary Codex `/feedback` session ID: `<CODEX_FEEDBACK_SESSION_ID>`
