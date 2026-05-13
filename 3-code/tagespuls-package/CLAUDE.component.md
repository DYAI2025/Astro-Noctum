# Tagespuls Package

**Responsibility**: Operator-authored aphorism content vault, Python build pipeline that produces `aphorisms.json` (only `status='approved'` entries), and the deterministic aphorism-selection algorithm shared with `edge-functions`. Operationally home to the human-in-the-loop approval gate per [CON-aphorisms-human-approved](../../1-spec/constraints/CON-aphorisms-human-approved.md).

**Technology**: Python (build pipeline) + TypeScript (selection algorithm and shared types). Existing workspace at `apps/tagespuls_package/` in `Astro-Noctum-prod/` — naming preserved per dev brief Hinweis #11.

## Interfaces

- **Content source:** per-aphorism markdown files at `knowledge/bazodiaac-brain/aphorisms/review/aph-*.md`.
- **Approval transition:** operator (Ben) edits each markdown's `status: draft` → `status: approved` manually. No agent / build script / LLM may auto-promote.
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
| _(none yet — this component's behavior is operationally driven by [CON-aphorisms-human-approved](../../1-spec/constraints/CON-aphorisms-human-approved.md); no derived decisions exist yet.)_ | | |
