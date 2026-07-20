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

The prepared demonstration uses a R1,500 budget and produces a R1,399.10 approved order, leaving R100.90 unspent.

## How it was built

The application is a standalone Next.js 16 and React 19 project written in TypeScript. OpenAI's Responses API and strict Zod Structured Outputs handle multimodal extraction and candidate product matching. Financial calculations, pack constraints, supplier ranking, and budget optimisation remain deterministic and use integer cents.

The authority model is intentionally separated:

- **AI:** interpret messy evidence, propose matches, explain deterministic results.
- **Deterministic code:** control money, quantities, constraints, hashes, and approval state.
- **Human:** resolve uncertainty and authorise the purchase.

Integrity controls include source SHA-256 fingerprints, HMAC-signed extraction and draft envelopes, accepted-evidence hashes, accepted mapping hashes, recommendation hashes, approval hashes, and supplier purchase-order hashes.

Codex was used throughout architecture design, repository scaffolding, feature implementation, contract design, test generation, evaluation construction, security review, accessibility improvements, deployment preparation, and submission asset production.

## Challenges

The most important challenge was preventing model output from quietly becoming financial authority. The solution was to create explicit evidence and approval boundaries rather than treating an AI response as an order.

A second challenge was reconciling inconsistent supplier and sales labels. KasiStock AI uses deterministic precedence—barcode, governed alias, normalised name, and token similarity—before asking GPT-5.6 for a candidate. Low-authority matches never merge automatically.

The final challenge was producing a judging experience that remains reliable when an external model call is unavailable. The application therefore includes prepared evidence that passes through the same signing, human review, calculation, and approval controls as live evidence.

## Accomplishments

- Complete evidence-to-approved-order workflow.
- 34 passing unit, integration, and evaluation tests.
- Twelve-case product-identity evaluation with 91.67% accuracy and zero unsafe automatic merges.
- Four submission screenshots and a draft MP4 generated reproducibly from the app.
- Zero WCAG A/AA violations across five judged server-rendered surfaces in the offline axe audit.
- Production build, secure headers, readiness checks, Vercel configuration, and GitHub Actions CI.
- Signed, supplier-specific PDF purchase orders and WhatsApp-ready messages.

## What was learned

AI is most useful in this workflow where the data is messy: interpreting images, documents, and inconsistent labels. It is least appropriate where correctness must be reproducible: currency arithmetic, constraints, approval, and order creation. The strongest design came from combining both approaches and making the boundary visible to the user.

## What's next

Post-competition work would add durable PostgreSQL repositories, authentication, multi-tenancy, live supplier integrations, WhatsApp Cloud API delivery, replenishment feedback loops, and broader product and language coverage.

## Built with

Next.js, React, TypeScript, OpenAI Responses API, GPT-5.6, Codex, Zod, PostgreSQL schema, pdf-lib, Vitest, Playwright, axe-core, GitHub Actions, and Vercel deployment configuration.

## Links to complete before submission

- Public demo: `<DEPLOYMENT_URL>`
- Code repository: `<REPOSITORY_URL>`
- Demo video: `<YOUTUBE_URL>`
- Primary Codex `/feedback` session ID: `<CODEX_FEEDBACK_SESSION_ID>`
