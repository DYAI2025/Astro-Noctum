# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Implementation plans for the **Fusion Ring** feature system in Bazodiac (Astro-Noctum). These are specification documents (in German) that define a 4-package build sequence for a 12-sector radial personality visualization called the "Bazahuawa Ring". The ring fuses Western astrology, Chinese BaZi, Wu-Xing elements, and personality quiz results into a single `number[12]` signal vector.

## Plan Structure & Dependencies

```
paket-1-signal-engine.md          # Pure math/logic, no UI. ZERO dependencies.
    |
paket-2-quiz-portierung.md       # Quiz components + useFusionRing hook. Depends on Paket 1.
    |
paket-3-fusion-ring-visualisierung.md  # Canvas 2D visualization. Depends on Paket 1 + 2.
    |
patch-fusionring-visibility.md   # Bugfix patch for Paket 3 (canvas init + theme contrast).

paket-4-leandeep-affinity-derivation.md  # Standalone CLI tool for BAFE repo (Python/FastAPI).
                                          # NO dependency on Pakete 1-3.
```

## Key Concepts Across Plans

- **Signal Vector**: `number[12]` array where each index maps to a zodiac sector (0=Aries..11=Pisces)
- **Masterformel**: `Signal(s) = w1*W(s) + w2*B(s) + w3*X(s) + w4*T(s)` where W=Western, B=BaZi, X=WuXing, T=Test/Quiz results
- **Weights without quizzes**: 0.375 / 0.375 / 0.25 / 0.0 (T is zeroed out)
- **Weights with quizzes**: 0.30 / 0.30 / 0.20 / 0.20
- **ContributionEvent**: Standardized event format (`sp.contribution.v1`) that quizzes emit with semantic markers
- **AFFINITY_MAP**: Lookup table mapping semantic markers (e.g., `marker.love.physical_touch`) to 12-sector weight distributions
- **Gauss Bell**: Spreading function (sigma=1.2) that creates organic peaks instead of hard spikes
- **Opposition Tension**: Sector opposite a strong peak gets a negative offset (factor 0.15)

## Target File Locations (in Astro-Noctum src/)

| Plan | Creates |
|------|---------|
| Paket 1 | `src/lib/fusion-ring/` (constants, math, western, bazi, wuxing, signal, affinity-map), `src/lib/lme/types.ts`, tests |
| Paket 2 | `src/services/contribution-events.ts`, `src/hooks/useFusionRing.ts`, `src/components/quizzes/`, `src/components/QuizOverlay.tsx` |
| Paket 3 | `src/lib/fusion-ring/colors.ts`, `src/components/FusionRing.tsx` (Canvas 2D, no chart libs) |
| Paket 4 | `tools/affinity_derive.py` in the BAFE repo (separate Python project) |

## Implementation Status

Pakete 1-3 and the visibility patch have been implemented and committed. Paket 4 targets the BAFE repo, not this one.

## Referencing These Plans

When implementing changes to the Fusion Ring system, cross-reference these plans for the mathematical spec (especially the proof calculations in Paket 1 Task 1.12) and the AFFINITY_MAP values. The plans contain exact expected outputs for test vectors like "Die Flamme" and "Wolf" profiles.
