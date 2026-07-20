# Changes in v0.5.0

## Submission and deployment release

- Added Vercel deployment configuration.
- Added GitHub Actions quality and browser workflows using Node.js 24.
- Added production environment and live OpenAI validation commands.
- Added `/api/readiness` without exposing secret values.
- Added security response headers.
- Added application metadata, web manifest, sitemap, robots file, and generated Open Graph image.
- Added `/judge` as a zero-sign-up, two-minute judging path.
- Added deterministic evidence and approved-order preview pages for submission media.
- Added skip navigation, visible focus treatment, reduced-motion handling, and contrast remediation.
- Added axe-core browser accessibility checks.
- Added reproducible 1440×900 screenshot generation.
- Added a 16-second draft MP4 and complete three-minute narration script.
- Added copy-ready Devpost content, Codex evidence guidance, deployment runbook, and publication checklist.

## Verification improvement

- Offline axe audit: five server-rendered judged surfaces, zero WCAG A/AA violations.
- System Chromium was usable for offline DOM rendering but policy-blocked from navigating to local HTTP addresses.
- Full Playwright specifications remain included for CI and local execution with Playwright-managed Chromium.

## Final release hardening

- Added one-year HSTS with subdomain coverage to the production security-header set.
- Reverified a dependency-free source copy with the exact Node 24.15.0/npm 11.12.1 toolchain.
- Verified thirteen production routes, readiness status, generated media, and zero-violation offline accessibility evidence.
- Added final machine-readable release evidence and explicit credential-bound completion status.
