# DEC-display-name-db-only: Trail

> Companion to `DEC-display-name-db-only.md`.
> AI agents read this only when evaluating whether the decision is still
> valid or when proposing a change or supersession.

## Alternatives considered

### Option A: Store display_name in DB only (chosen)
- Pros: clean layer separation; FuFirE contract stays pure (birth data only); display name changes don't trigger recompute; agent always reads from authoritative source
- Cons: requires explicit split in onboarding handler (two operations instead of one)

### Option B: Pass display_name to FuFirE alongside birth data
- Pros: single payload; engine could theoretically use name for numerology in future
- Cons: couples UI field to engine contract; FuFirE has no current use for name data; would require engine schema change if name format changes; pollutes deterministic engine with presentation concern

## Reasoning

The existing system already separates concerns into three layers: FuFirE (deterministic computation),
DB/Backend (profile, persistence, UI context), Agent (presentation, interpretation). `display_name`
is unambiguously a UI/profile field — it has no role in astrological computation. Forwarding it to
FuFirE would introduce coupling with no benefit and create a maintenance burden if the engine schema
ever needs updating independently of the profile schema.

The name is always retrievable from DB without a recompute — this is the mitigation for the one
theoretical risk (engine needing name data later).

## Human involvement

**Type**: human-decided

**Notes**: Decision made by Ben (founder/lead developer) during architectural review session 2026-04-09.
AI formalized as DEC artifact per elicitation session.

## Changelog

| Date | Change | Involvement |
|------|--------|-------------|
| 2026-04-09 | Initial decision | human-decided |
