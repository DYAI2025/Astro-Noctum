# DEC-master-signal-weights: Master Signal formula and weight distribution

**Status**: Active

**Category**: Architecture

**Scope**: system-wide

**Source**: n/a (foundational decision, formalized from existing practice)

**Last updated**: 2026-03-24

## Context

The Master Signal is Bazodiac's core fusion mechanism — it combines natal astrology data (N), quiz contributions (Q), and generational context (G) into a single 5D vector (passion, stability, future, connection, autonomy). A proposal to simplify to static weights (40/35/25) and eliminate the alignment_boost was evaluated and rejected because the dynamic alignment_boost is the key differentiator: it redistributes weight based on cross-reference coherence between N, Q, and G, making each user's formula unique.

## Decision

The Master Signal formula is:

```
Master = 0.35·N + 0.30·Q + 0.20·G + 0.15·alignment_boost
```

The four components and their weights are fixed. The alignment_boost is a dynamic redistribution mechanism, not a static fourth signal.

## Enforcement

### Trigger conditions

- **Design phase**: when proposing changes to signal weights, adding new signal sources, or modifying the fusion formula
- **Code phase**: when implementing or modifying master-signal-builder.ts, cross-reference.ts, or any projection module

### Required patterns

- Natal sub-weights: Western Sun 50%, Moon 30%, Ascendant 20% (via element affinity)
- BaZi sub-weights: Day pillar 40%, Year 25%, Month 20%, Hour 15%
- GCB carries `evidence_mode: "heuristic_v1"` — based on generational theory, not empirical data
- Alignment boost distribution: when N-Q alignment >= 0.75, split 50/50; otherwise weighted toward whichever signal aligns better with G
- All outputs normalized (sum = 1.0) in the 5D dimension space

### Required checks

1. Any weight change proposal must be surfaced to the user (Always Ask tier)
2. Verify alignment_boost is never removed or made static
3. GCB evidence_mode must always be disclosed in user-facing narratives

### Prohibited patterns

- Static 3-component formulas without alignment_boost
- GCB weight above 0.25 (heuristic data does not warrant higher weight)
- Modifying alignment_boost to be a constant rather than cross-reference-derived
