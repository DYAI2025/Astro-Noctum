# DEC-master-signal-weights: Trail

> Companion to `DEC-master-signal-weights.md`.
> AI agents read this only when evaluating whether the decision is still
> valid or when proposing a change or supersession.

## Alternatives considered

### Option A: Keep current 4-component formula with alignment_boost (chosen)
- Pros: Dynamic per-user weighting; alignment_boost is the fusion differentiator; GCB weight proportional to evidence quality; proven in production
- Cons: More complex to implement; alignment_boost logic requires cross-reference engine

### Option B: Simplify to 40% Natal / 35% Quiz / 25% GCB (rejected)
- Pros: Simpler formula; easier to explain to users
- Cons: Eliminates alignment_boost entirely; makes system static (every user gets same formula); 25% for heuristic GCB data is disproportionately high; loses the key differentiator vs generic astrology apps

## Reasoning

The alignment_boost is Bazodiac's architectural innovation — it dynamically adjusts how N, Q, and G combine based on their coherence. Removing it turns the Master Signal into a static weighted average, which any competitor could replicate. The current 20% GCB weight is appropriate given its `heuristic_v1` evidence basis, and the alignment_boost allows GCB to reach effectively ~27% when the cross-reference coherence supports it.

GCB can be branded as "Grand Cosmic Blueprint" in the UI without changing the underlying weights.

This decision would be invalidated if: empirical validation of GCB justifies higher base weight; a fundamentally different fusion mechanism is designed; or the alignment_boost proves unstable in production.

## Human involvement

**Type**: human-decided

**Notes**: Ben evaluated the 40/35/25 proposal and rejected it, confirming the alignment_boost as a core differentiator (2026-03-24).

## Changelog

| Date | Change | Involvement |
|------|--------|-------------|
| 2026-03-24 | Initial decision (rejected simplification proposal, confirmed existing formula) | human-decided |
