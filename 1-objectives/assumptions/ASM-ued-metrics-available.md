# ASM-ued-metrics-available: UED Metrics Derivable from Existing Soulprint + Transit Data

**Category**: Technical

**Status**: Unverified

**Risk**: Medium — if UED metrics require a separate emotion tracking system, significant new infrastructure would be needed

## Description

The User Emotion Dynamics (UED) metrics required for the Orbital Signatur visualization — `home_base.valence`, `home_base.arousal`, `σ_v` (valence variability), `σ_a` (arousal variability), `instability_level`, `rise_rate`, `recovery_rate` — can be derived from the existing soulprint sectors (12 zodiac weights), quiz contribution history, transit modulation data, and Master Signal projections without building a separate emotion tracking system.

Proposed mapping:
- `home_base.valence` ← normalized weighted sum of soulprint sectors mapped to valence dimension (e.g., Fire/Leo sectors → high valence)
- `home_base.arousal` ← normalized weighted sum mapped to arousal dimension (e.g., Mars-ruled sectors → high arousal)
- `σ_v`, `σ_a` ← standard deviation of quiz contribution deltas over time (requires ≥3 quiz completions)
- `instability_level` ← current transit intensity × dissonance coefficient (from existing computeDissonance())
- `rise_rate` ← rate of change of transit modulation over last 7 days
- `recovery_rate` ← inverse of rise_rate dampened by element balance (Water elements → faster recovery)

## Verification Plan

1. Implement the mapping functions as pure TypeScript in `packages/shared/`
2. Compute UED metrics for 5 test users with varied profiles
3. Validate that the resulting ellipse parameters produce visually distinct and meaningful orbits
4. Compare with manual assessment: does the orbit "make sense" given the user's astrological profile?

## Impact if Wrong

- Would need a dedicated emotion diary or mood tracking feature (user input) to feed the UED metrics
- Estimated 3-4 weeks additional development for mood tracking UI + data pipeline
- Orbital Signatur feature would be deferred until emotion data is available
- Alternative: use simplified metrics (soulprint-only, no variability) for a static orbit

## Dependent Artifacts

- [REQ-F-orbital-signatur-visualization](../requirements/REQ-F-orbital-signatur-visualization.md)

## Design Risk Note (2026-04-02)

**REQ-F-orbital-signatur-visualization** (Draft) depends on this assumption being true. Until verified, the orbital visualization feature should not be implemented. The architecture does not currently define the derivation path for UED metrics from soulprint + transit data.

**Verification trigger**: Before sprint S-ORBITAL or any task implementing REQ-F-orbital-signatur-visualization, verify by:
- (a) Checking if `soulprintToNatalWeights()` output plus transit sector data contains sufficient variance to derive home_base and σ values, or
- (b) Confirming FuFirE `/transit/state` response includes these fields directly

## Parking Decision (2026-04-15)

Gap analysis flagged this assumption as Critical because `REQ-F-orbital-signatur-visualization` remains Blocked on it. **Decision**: explicitly **parked** — no verification work will be undertaken until sprint S-ORBITAL is prioritized on the roadmap. Both the assumption and its dependent requirement remain in their current Draft/Unverified states by design.

Rationale: the orbital visualization is a Could-have feature that is deferred per CLAUDE.md Current State. Speculative verification (implementing mapping functions without a consuming feature) would be premature, and invalidating the assumption would permanently close the feature without product justification. Parking preserves optionality.

**Re-activation trigger**: when S-ORBITAL enters a sprint plan, re-open this assumption for verification following the plan in the section above.
