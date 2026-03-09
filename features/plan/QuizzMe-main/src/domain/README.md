# Domain Logic - Phase 2 Implementation

This directory contains pure business logic and domain calculations for the psyche profile system.

## Files

### derivedStats.ts
**Purpose**: Calculate secondary stats from core psyche profile

**Exports**:
- `toPercent01(value)`: Converts 0..1 to 0..100 with clamping
- `calcDerivedStats(stats)`: Computes all 4 derived stats

**Formulas** (per FR-3):
```
vitality  = avg(clarity, connection) * 100
willpower = avg(courage, order) * 100
chaos     = shadow * 100
harmony   = (1 - abs(shadow - connection)) * 100
```

**Tests**: See `derivedStats.test.ts` for comprehensive test coverage

### delta.ts
**Purpose**: Compute changes between profile snapshots and identify "movers"

**Exports**:
- `computeStatsDelta()`: Computes stats changes
- `computeStateDelta()`: Computes state/axes changes
- `createDelta()`: Creates full delta from snapshots
- `getTopMovers()`: Identifies top 1-3 changed dimensions
- `isDeltaSignificant()`: Checks if change exceeds threshold

**Mover**: Represents a dimension with significant change
```typescript
{
  dimension: string,  // e.g., 'clarity', 'shadow_light'
  delta: number,      // signed change
  magnitude: number   // absolute value for sorting
}
```

**Thresholds**:
- `0.001`: Floating-point noise filter
- `0.05` (5%): Significant change threshold for banner display

## Usage in UI Components

### Getting Profile Data
```typescript
import { usePsycheProfile } from '@/hooks/usePsycheProfile';

function CharacterSheet() {
  const {
    profile,
    isLoading,
    delta,
    movers,
    showBanner,
    dismissBanner
  } = usePsycheProfile();

  // Profile contains: stats, state, archetype_params, etc.
  // Delta contains: stats_delta, state_delta, movers
  // Movers: top 1-3 dimensions that changed
}
```

### Computing Derived Stats
```typescript
import { calcDerivedStats } from '@/domain/derivedStats';

const derived = calcDerivedStats(profile.stats);
// { vitality: 80, willpower: 38, chaos: 15, harmony: 27 }
```

### Delta Handling
```typescript
import { createDelta, getTopMovers } from '@/domain/delta';

// Option 1: Use server-provided delta
if (profile.last_delta) {
  const movers = getTopMovers(profile.last_delta, 3);
}

// Option 2: Compute from snapshots
const delta = createDelta(
  { stats: newProfile.stats, state: newProfile.state },
  { stats: prevProfile.stats, state: prevProfile.state }
);
```

## Data Flow

```
Quiz Completion
    ↓
API Update (profile.last_delta populated)
    ↓
usePsycheProfile hook
    ↓
Delta Detection (server or snapshot diff)
    ↓
Top Movers Computation (1-3 dimensions)
    ↓
Banner Display (if significant, 10s auto-dismiss)
    ↓
UI Animations (bars, rails, highlights)
```

## Testing

Run unit tests:
```bash
npm test src/domain/derivedStats.test.ts
```

Tests cover:
- Boundary values (0, 1)
- Mid-range values
- Formula correctness
- Edge cases (max distance, perfect alignment)
- Integration with real profile data

## Type Safety

All functions use strict TypeScript types from `@/types/psyche`:
- `PsycheCoreStats`: Core stats (0..1)
- `PsycheState`: Climate axes (0..1)
- `DerivedStatsV1`: Calculated stats (0..100)
- `PsycheDelta`: Change information
- `Mover`: Dimension change representation

## References

- Implementation Plan: `/docs/plans/feature-char-sheet-impl.md`
- Type Definitions: `/src/types/psyche.ts`
- Hook Implementation: `/src/hooks/usePsycheProfile.ts`
- Schema Documentation: `/.hive-mind/psyche-data-schema.json`
