# CON-aphorisms-human-approved: Aphorisms require human approval before production

**Category**: Operational

**Status**: Deprecated (2026-05-14, superseded by DEC-aphorism-batch-approval-bp-2026-05-14)

**Source stakeholder**: [STK-ben](../stakeholders.md)

## Description

Every aphorism that enters the production pool consumed by the daily-pulse pipeline (`apps/tagespuls_package/packages/voice/data/aphorisms.json` → `aphorisms` table in Supabase) must be human-approved by Ben. Approval flow: Ben opens the per-aphorism markdown file under `apps/tagespuls_package/knowledge/bazodiaac-brain/aphorisms/review/aph-*.md` and changes `status: "draft"` → `status: "approved"`. The build pipeline (`build_aphorisms.py`) only emits entries with `status: "approved"`. No agent, build script, or LLM may auto-promote a draft aphorism. This is a hard human-in-the-loop gate.

## Rationale

Aphorisms in the production pool carry attribution (author, work, year, translator), copyright (public domain vs. licensed vs. original), translation accuracy claims (`text_de`, `text_en`, sometimes `text_original`), and editorial judgments (mode tags, tone tags, element/figure/season affinity, quality rating). These dimensions require editorial review that the agent cannot reliably perform autonomously — getting attribution wrong on a public-domain quote is a credibility hit; getting copyright wrong on a licensed quote is a legal hit. The Phase T plan in the dev brief explicitly cannot run until ≥15 approved aphorisms with mode coverage exist (`pulse`, `trace`, `spannung`).

## Impact

- TASK-T0 in the dev brief is a hard gate. The agent verifies the gate (`aphorisms.json` exists, contains ≥15 entries, modes covered) but never bypasses it.
- TASK-T1 (Supabase migration), TASK-T2 (seeding), TASK-T3+ (edge functions) are blocked until the gate is satisfied.
- The build pipeline is operator-triggered, not agent-triggered. The agent may surface gate state and document blockages but does not run `build_aphorisms.py` autonomously when no approved entries exist.
- Any future automation that proposes new aphorisms (e.g., LLM-generated additions) must still flow through the manual approval gate.

## Deprecation Notice (2026-05-14)

This constraint is deprecated. The hard human-in-the-loop gate (operator manually flips per-file `status: draft → approved`) is replaced by **batch-approval by the operator via a documented plan artifact**, recorded in [DEC-aphorism-batch-approval-bp-2026-05-14](../../decisions/DEC-aphorism-batch-approval-bp-2026-05-14.md). The decision shifts the approval surface from per-file edits to plan files, while preserving the rule that only Ben (the operator) may grant approval. Agents still cannot auto-promote without an explicit plan-encoded directive from Ben.
