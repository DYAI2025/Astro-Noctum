# Tagespuls Package

**Responsibility**: Operator-authored aphorism content vault, Python build pipeline that produces `aphorisms.json` (only `status='approved'` entries), and the deterministic aphorism-selection algorithm shared with `edge-functions`. Operationally home to the human-in-the-loop approval gate per [CON-aphorisms-human-approved](../../1-spec/constraints/CON-aphorisms-human-approved.md).

**Technology**: Python (build pipeline) + TypeScript (selection algorithm and shared types). Existing workspace at `apps/tagespuls_package/` in `Astro-Noctum-prod/` — naming preserved per dev brief Hinweis #11.

## Interfaces

- **Content source:** per-aphorism markdown files at `knowledge/bazodiaac-brain/aphorisms/review/aph-*.md`.
- **Approval transition:** operator (Ben) grants approval either by (a) per-file edit `status: draft` → `status: approved`, or (b) batch approval via a documented plan artifact per [DEC-aphorism-batch-approval-bp-2026-05-14](../../decisions/DEC-aphorism-batch-approval-bp-2026-05-14.md). Agents may apply `status: approved` ONLY to IDs explicitly enumerated in such a plan.
- **Build output:** `packages/voice/data/aphorisms.json` — produced by `packages/voice/scripts/build_aphorisms.py`. Only `status='approved'` entries are emitted.
- **Downstream:** `database` seed script consumes `aphorisms.json` and upserts into the `aphorisms` table.
- **Type sharing:** `packages/voice/src/types.ts` is consumed by `edge-functions` (per dev brief Hinweis #11). Migration of these types into `shared-types` is a Code-phase implementation decision.

## Notes

- The build pipeline runs operator-triggered. The agent surfaces gate state (`aphorisms.json` exists, contains ≥ 15 entries, mode coverage across `pulse` / `trace` / `spannung`) but never bypasses the manual approval step.
- The 24-hour cooldown logic (`aphorisms.cooldown_days`) is part of the selection algorithm and uses `aphorism_usage_events` from `database` at runtime.

## Requirements Addressed

| File | Type | Priority | Status |
|------|------|----------|--------|
| [REQ-F-aphorism-approval-gate](../../1-spec/requirements/REQ-F-aphorism-approval-gate.md) | Functional | Should | Draft (operationally enforced by the build pipeline emitting only `status='approved'` entries) |

## Relevant Decisions

| File | Title | Trigger |
|------|-------|---------|
| [DEC-aphorism-batch-approval-bp-2026-05-14](../../decisions/DEC-aphorism-batch-approval-bp-2026-05-14.md) | Aphorism batch approval by plan artifact | When the operator approves a batch via plan rather than per-file edits |
| [DEC-codebase-lives-in-sibling-prod-dir](../../decisions/DEC-codebase-lives-in-sibling-prod-dir.md) | Runtime code lives in sibling `Astro-Noctum-prod/` directory | When editing aphorism content or build pipeline — runtime files live in `Astro-Noctum-prod/apps/tagespuls_package/` |
