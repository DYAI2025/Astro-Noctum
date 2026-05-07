# CON-no-formula-changes: Astrological engine logic is immutable

**Category**: Technical

**Status**: Active

**Source stakeholder**: [STK-ben](../stakeholders.md)

## Description

Astrological formulas, scoring functions, ephemeris computations, BaZi four-pillar derivations, and Wu-Xing element calculations are immutable. No agent or developer task may modify the code paths that produce these values without an explicit, separately-scoped re-architecture decision recorded under `decisions/`.

## Rationale

Astrological correctness is the product's core value proposition. Errors at the engine layer compound silently across every downstream surface (dashboard, daily pulse, harmony index, 3D signature, daily interpretation). Validation requires domain expertise that lives outside the agent. The dev brief explicitly lists "no changes to astrological formulas, scoring, ephemeris, BaZi, Wu-Xing" as Non-Goal #1.

## Impact

- Tasks may modify visibility, presentation, error-handling, retrieval, and orchestration paths around engine outputs but never the calculation code itself.
- Any change to a function that produces a numeric astrological value requires a new decision and re-scoping.
- The known Wu-Xing DE/EN-drift bug in `bazi-to-chladni.ts` (mentioned in the dev brief) is acknowledged but lives in a separate fix-track outside the current sprint scope.
- This constraint blocks "performance optimizations" that would alter algorithmic behavior even when they pass typecheck.
