# KasiStock AI v0.3.0 Changes

## Added

- Deterministic sales CSV evidence contract and parser.
- Second supplier demonstration catalogue.
- Canonical product catalogue with governed barcodes and aliases.
- Product-name normalisation and token-similarity scoring.
- Deterministic product-match proposals.
- GPT‑5.6 structured product-match suggestion adapter.
- Human-confirmed accepted product mapping sets with SHA‑256 integrity hashes.
- Accepted-evidence and mapping-integrity verification before calculations.
- Sales velocity, average price, days of cover, target stock and reorder calculations.
- Exact supplier effective-cost comparison and optimiser input generation.
- `/decision` product reconciliation and restocking workspace.
- Reconciliation, mapping and restock API routes.
- PostgreSQL schema for canonical products, aliases, mapping sets and calculation versions.
- Eleven additional automated tests, increasing the total to 27.

## Changed

- Extraction contract advanced to `2026-07-18.2`.
- Evidence kind now includes `sales_history`.
- Evidence workspace accepts and validates sales CSV files.
- Prepared supplier evidence can represent Ubuntu Wholesale or Metro Cash & Carry.
- Home and demonstration navigation now exposes the live decision engine.
- Architecture, security, README and demo documentation now describe the mapping authority layer.

## Authority guarantees

- Fuzzy and GPT product matches require explicit human confirmation.
- Mapping sets are bound to the exact accepted evidence hashes.
- Optimiser inputs cannot be generated from raw extraction output.
