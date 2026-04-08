# DEC-fusion-bazi-sheng-ke: Planet-to-Wu-Xing Mapping and Sheng/Ke Resonance Algorithm

**Status**: Active

**Category**: Architecture

**Scope**: frontend

**Source**: [REQ-F-dashboard-bazi-fusion-bridge](../../1-objectives/requirements/REQ-F-dashboard-bazi-fusion-bridge.md), [GOAL-fusion-astrology](../../1-objectives/goals/GOAL-fusion-astrology.md)

**Last updated**: 2026-04-08

## Context

To fuse Western and BaZi systems on the Dashboard, each transiting planet must be mapped to a Wu-Xing element, then evaluated against the user's BaZi Day Master via the traditional Chinese five-element cycles. Without a locked mapping, different implementations would produce inconsistent results across platforms and over time.

## Decision

The planet-to-Wu-Xing-element mapping and the Sheng/Ke resonance algorithm are locked. Any change requires a new or superseding decision.

### Planet-to-Element Mapping (locked)

| Planet | Wu-Xing Element | Source tradition |
|--------|----------------|-----------------|
| Sonne | Feuer | Traditional Chinese astronomy |
| Mars | Feuer | Traditional Chinese astronomy |
| Mond | Wasser | Traditional Chinese astronomy |
| Merkur | Wasser | Traditional Chinese astronomy |
| Jupiter | Holz | Traditional Chinese astronomy |
| Saturn | Erde | Traditional Chinese astronomy |
| Venus | Metall | Traditional Chinese astronomy |

### Sheng/Ke Cycles (locked)

**Sheng (generating) cycle** — Holz→Feuer→Erde→Metall→Wasser→Holz

**Ke (controlling) cycle** — Holz→Erde→Wasser→Feuer→Metall→Holz

### Resonance Types and Intensity Ranges

| Type | Condition | Intensity range |
|------|-----------|-----------------|
| `gleichklang` | Planet element == Day Master element | 0.80–0.90 |
| `naehrung` (forward) | Planet element generates Day Master element (Sheng) | 0.70–0.80 |
| `naehrung` (backward) | Day Master element generates Planet element (Sheng) | 0.60–0.70 |
| `kontrolle` (forward) | Planet element controls Day Master element (Ke) | 0.65–0.75 |
| `kontrolle` (backward) | Day Master element controls Planet element (Ke) | 0.65–0.75 |
| `neutral` | No Sheng or Ke relationship | ≤ 0.45 |

## Enforcement

### Trigger conditions

- **Design phase**: when designing any feature that displays a relationship between a Western planet and BaZi data — use this mapping, do not invent a new one
- **Code phase**: when implementing or modifying `src/lib/fusion-bazi/resonance.ts` — verify all 7 planet mappings match this table exactly; when adding a new planet — add an entry to this decision first

### Required patterns

The canonical implementation lives in `src/lib/fusion-bazi/resonance.ts`. All callers must use this module — no inline planet-to-element mappings elsewhere in the codebase.

```typescript
// Correct — use the module
import { calculatePlanetBaziResonance } from '@/lib/fusion-bazi/resonance';

// Prohibited — inline mapping
const element = planet === 'Mars' ? 'fire' : '...'; // never do this
```

The module must be pure (no IO, no side effects) and fully unit-tested. Test coverage must include at least one concrete example per resonance type.

### Required checks

1. Verify all 7 planet keys are present in `PLANET_ELEMENT` record
2. Verify `SHENG_NEXT` and `KE_NEXT` cycle maps are complete (5 entries each)
3. Confirm no other file in `src/` contains a `PLANET_ELEMENT` or equivalent inline mapping
4. Confirm unit tests cover all 6 resonance branches

### Prohibited patterns

- Inline planet-to-element mappings outside `resonance.ts`
- Adding a planet to the mapping without updating this decision
- Changing the Sheng or Ke cycle order without superseding this decision
- Using `spannung` as a resonance type — the five valid types are: `gleichklang`, `naehrung`, `kontrolle`, `neutral` (the foundation plan mentioned `spannung` but it was superseded by the cleaner 4-type model)
