# Codex contribution evidence

## Primary evidence required before submission

The current Codex app exposes `/feedback` as an interactive dialog, not as a callable project tool.
After the local engineering work is final, run `/feedback` in this primary task, include logs, submit,
and replace this placeholder with the returned real ID:

```text
PENDING_INTERACTIVE_FEEDBACK_DIALOG
```

Do not substitute a Git commit, task title, invented UUID, or OpenAI response ID.

## Supplied baseline versus genuine continuation

The only baseline is the verified supplied v0.5.0 archive with SHA-256
`44fca5be9b2391d53ca0018da5f6fd1b2195a6703a9f0b4c0d95062e1d6d7b29`. It was imported without
claiming that the current task created its pre-existing functionality.

This primary Codex task genuinely performed:

- PostgreSQL persistence architecture and adapter implementation.
- Idempotent schema migration and real PostgreSQL integration testing.
- Atomic persistence of approval, supplier orders, messages and audit events.
- Prepared non-durable fallback preservation and readiness reporting.
- JSONB serialisation and purchase-order uniqueness fixes discovered by real database testing.
- Official-documentation verification of `gpt-5.6-sol` and live account validation.
- Live multimodal shelf and PDF extraction, including a PDF data-URI compatibility fix.
- Safe live-validation evidence with raw-versus-accepted correction proof.
- Production Playwright and axe QA in PostgreSQL and fallback modes.
- Desktop/mobile in-app browser QA, muted-text contrast remediation, and mobile navigation repair.
- Captioned 2:33.7 final demonstration production with disclosed OpenAI text-to-speech narration.
- Verification, architecture, security, handover, and submission-copy updates.
- Private GitHub publication, portable clean-install repair, green GitHub Actions, Neon migration,
  Vercel deployment, and live production browser/model validation.

## Evidence files

- `KASISTOCK_AI_LOG.md` - dated provenance and work log.
- `VERIFICATION_REPORT.md` - commands, counts, findings and remaining blockers.
- `submission/qa/live-openai-validation.json` - safe live response IDs, hashes and correction evidence.
- `modules/persistence/` - continuation implementation.
- `tests/integration/postgres-workflow-persistence.test.ts` - real-database authority-chain gate.
- `scripts/validate-live-workflow.mjs` - repeatable live multimodal validator.
- `submission/video/final-video-metadata.json` - final video duration, format and disclosure evidence.
- `submission/video/kasistock-ai-demo.mp4` - final captioned narrated demonstration.
- Git history: baseline import commit `aa0d075`, followed by continuation commits.
- Production merge commit `33eb68d` and private pull request
  `https://github.com/Akwunwaj/kasistock-ai/pull/1`.

## Claim discipline

Submission copy may say that Codex built the continuation items listed above. It must describe the
archive's earlier application as the supplied baseline unless separate primary evidence proves who
built it. The live supplier test's incorrect year must remain disclosed: structured output passed,
but human correction was still necessary.
