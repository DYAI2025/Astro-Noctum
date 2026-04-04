---
id: DEC-synthetic-soulprint-fallback
status: Active
date: 2026-04-04
trigger: Any code path that consumes soulprint_sectors and must handle the null case
---

# DEC-synthetic-soulprint-fallback

## Decision

When `soulprint_sectors` is null in the database (FuFirE/bootstrap unavailable, pre-migration user), the system derives a **synthetic 12-sector soulprint** from the user's Western zodiac sign via `syntheticSoulprintFromSign()`.

Downstream consumers receive `effectiveSoulprint` (real or synthetic) — never null.

## Context

`soulprint_sectors` in `astro_profiles` is only populated when `bootstrapExperience()` succeeds during onboarding. When FuFirE is down, the column stays null. This caused three cascading failures:
- InfluenceGauges: all 0% (BUG-17)
- Daily Pulse: section disappeared entirely (BUG-19)
- Vibe: empty response text (BUG-18)

## Choice: Synthetic deterministic fallback

`syntheticSoulprintFromSign(sign)` returns a deterministic 12-element array:
- Peak (0.85) at the sign's zodiac index
- Smooth taper to neighbors
- Floor at 0.25
- Unknown/empty sign → uniform 0.5

### Rationale

- **Deterministic**: same sign always produces identical sectors — no randomness
- **Non-neutral**: a Cancer user gets a Cancer-weighted soulprint, not flat 0.5
- **Graceful degradation**: gauges show meaningful (if approximate) values instead of zeros
- **No new API calls**: derived from BAFE data already in memory

### Constraints

- The synthetic soulprint is an approximation — it does not reflect quiz contributions, transit modulation, or the full FuFirE computation
- It should never be persisted to `soulprint_sectors` in the database (that column is reserved for the real bootstrap result)
- UI should not claim "live" or "real-time" when using synthetic data

## Implementation

- Function: `src/lib/signatur/weight-utils.ts` → `syntheticSoulprintFromSign()`
- Wiring: `src/components/Dashboard.tsx` → `effectiveSoulprint`
- Guard removal: `src/hooks/useFirstRunDaily.ts` → soulprint null guard relaxed

## Consequences

- **Never add a null guard** that blocks functionality when `soulprintSectors` is null — use `effectiveSoulprint` instead
- **Future hooks/components** consuming soulprint data should accept `effectiveSoulprint`, not `profileMeta.soulprintSectors`
- When FuFirE comes back online, the real soulprint will overwrite the synthetic one on the next bootstrap call
