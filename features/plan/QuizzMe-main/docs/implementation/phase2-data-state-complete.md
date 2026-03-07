# Phase 2: Data & State Handling - Implementation Complete

**Status**: ✅ COMPLETE
**Date**: 2025-12-14
**Phase**: 2 of 5 (Character Sheet Implementation)

## Summary

Successfully implemented all Phase 2 requirements from `feature-char-sheet-impl.md`. This phase establishes the data foundation for the Character Sheet feature, including type definitions, calculation logic, delta detection, and state management.

## Completed Tasks

### T2.1: TypeScript Type Definitions ✅
**File**: `/src/types/psyche.ts`

Created comprehensive type definitions for:
- `PsycheCoreStats`: Core stats (clarity, courage, connection, order, shadow) - 0..1 range
- `PsycheState`: 5 climate axes (shadow_light, cold_warm, surface_depth, me_we, mind_heart) - 0..1 range
- `DerivedStatsV1`: Calculated stats (vitality, willpower, chaos, harmony) - 0..100 range
- `VisualAxesV1`: UI-friendly labels and descriptions for axes
- `MetaStats`: Aggregate insights (intensity, tempo, shadow_confidence)
- `PsycheDelta`: Change tracking between snapshots
- `Mover`: Dimension change representation
- `ArchetypeParams`: Archetype information
- `PsycheProfileV1`: Complete profile contract

**Key Features**:
- All optional fields properly typed with `?`
- Comprehensive JSDoc documentation
- Value ranges documented (0..1 vs 0..100)
- Backward compatibility alias for `DerivedStats`

### T2.2: Derived Stats Calculator ✅
**File**: `/src/domain/derivedStats.ts`

Implemented pure calculation functions:
- `toPercent01(value)`: Maps 0..1 to 0..100 with clamping
- `calcDerivedStats(stats)`: Computes all 4 derived stats

**Formulas** (per FR-3):
```typescript
vitality  = avg(clarity, connection) * 100
willpower = avg(courage, order) * 100
chaos     = shadow * 100
harmony   = (1 - abs(shadow - connection)) * 100
```

**Features**:
- Pure functions (no side effects)
- Input validation via clamping
- Comprehensive documentation
- Type-safe implementation

### T2.2: Unit Tests ✅
**File**: `/src/domain/derivedStats.test.ts`

Created 25+ test cases covering:
- **toPercent01**: Boundary values, rounding, clamping
- **vitality**: Average calculation, edge cases
- **willpower**: Average calculation, asymmetric values
- **chaos**: Direct shadow mapping
- **harmony**: Alignment formula, symmetry
- **Integration**: Real profile data scenarios

**Test Coverage**:
- Boundary values (0, 1)
- Mid-range values (0.5, 0.72, etc.)
- Edge cases (max distance, perfect alignment)
- Real-world profile data
- Formula correctness verification

**Run Tests**:
```bash
npm test src/domain/derivedStats.test.ts
```

### T2.3: Delta Computation Logic ✅
**File**: `/src/domain/delta.ts`

Implemented comprehensive delta handling:
- `computeStatsDelta()`: Calculates stats changes
- `computeStateDelta()`: Calculates state/axes changes
- `extractStatsMovers()`: Extracts movers from stats delta
- `extractStateMovers()`: Extracts movers from state delta
- `computeTopMovers()`: Identifies top N changed dimensions
- `createDelta()`: Creates full delta from snapshots
- `getTopMovers()`: Gets movers with fallback logic
- `isDeltaSignificant()`: Checks significance threshold

**Mover Structure**:
```typescript
{
  dimension: string,   // e.g., 'clarity', 'shadow_light'
  delta: number,       // signed change (+0.05, -0.02)
  magnitude: number    // absolute value for sorting
}
```

**Thresholds**:
- `0.001`: Floating-point noise filter
- `0.05`: Significant change threshold (5%)

### T2.3: Profile Fetch Hook ✅
**File**: `/src/hooks/usePsycheProfile.ts`

Implemented React hook with full delta detection:

**Returns**:
```typescript
{
  profile: PsycheProfileV1 | null,
  isLoading: boolean,
  error: Error | null,
  delta: PsycheDelta | null,
  movers: Mover[],
  isSignificantChange: boolean,
  showBanner: boolean,
  dismissBanner: () => void
}
```

**Features**:
- Fetches current profile (mocked, ready for API)
- Stores previous snapshot for comparison
- Delta source priority:
  1. Server-provided `profile.last_delta` (preferred)
  2. Client-side snapshot diff (fallback)
- Identifies top 1-3 movers
- Auto-shows banner for 10s if change is significant
- Manual banner dismissal
- Proper cleanup on unmount

**Additional Hook**:
- `usePsycheProfileInvalidation()`: TanStack Query integration point

## File Structure

```
/src/
├── types/
│   └── psyche.ts                    # ✅ Type definitions (v1)
├── domain/
│   ├── derivedStats.ts              # ✅ Calculation logic
│   ├── derivedStats.test.ts         # ✅ Unit tests
│   ├── delta.ts                     # ✅ Delta & movers logic
│   └── README.md                    # ✅ Domain documentation
├── hooks/
│   └── usePsycheProfile.ts          # ✅ React hook with delta detection
└── data/
    └── mocks/
        └── psyche.ts                # Existing mock data

/.hive-mind/
└── psyche-data-schema.json          # ✅ Schema for UI components
```

## Schema Documentation

Comprehensive data schema stored in `/.hive-mind/psyche-data-schema.json`:
- Type definitions with field descriptions
- Value ranges and validation rules
- Calculation formulas
- UI integration notes
- File locations
- Data flow diagram
- Graceful degradation rules

This serves as the source of truth for UI component developers.

## Integration Points

### For UI Components
```typescript
import { usePsycheProfile } from '@/hooks/usePsycheProfile';
import { calcDerivedStats } from '@/domain/derivedStats';

function CharacterSheet() {
  const { profile, delta, movers, showBanner } = usePsycheProfile();

  if (!profile) return <Loading />;

  const derived = calcDerivedStats(profile.stats);

  return (
    <>
      {showBanner && <DeltaBanner movers={movers} />}
      <CoreStatsCard stats={profile.stats} movers={movers} />
      <DerivedStatsCard stats={derived} />
      <ClimateCard state={profile.state} />
    </>
  );
}
```

### For Quiz Results
```typescript
import { usePsycheProfileInvalidation } from '@/hooks/usePsycheProfile';

function QuizResult() {
  const { invalidate } = usePsycheProfileInvalidation();

  const handleViewCharacterSheet = async () => {
    await invalidate(); // Triggers refetch with new data
    router.push('/character');
  };
}
```

## Data Flow

```
Quiz Completion
    ↓
Backend API Update
    ↓
profile.last_delta populated (optional)
    ↓
usePsycheProfile() fetches
    ↓
Delta Detection:
  • Priority 1: Use profile.last_delta
  • Priority 2: Compute from snapshot diff
    ↓
Top Movers Identification (1-3 dims)
    ↓
Significance Check (threshold: 0.05)
    ↓
Banner Display (10s auto-dismiss)
    ↓
UI Component Animations
```

## Validation & Testing

### Unit Tests
- ✅ 25+ test cases for derivedStats
- ✅ Boundary value testing
- ✅ Formula correctness
- ✅ Edge case coverage
- ✅ Real-world integration tests

### Type Safety
- ✅ All functions strictly typed
- ✅ Optional fields properly handled
- ✅ No `any` types
- ✅ Graceful degradation support

### Graceful Degradation
All code handles missing optional fields:
- `meta_stats?`
- `visual_axes?`
- `archetype_params?`
- `narrative_snippet?`
- `last_delta?`

No crashes if optional fields are undefined.

## API Contract

### Expected API Endpoint
```
GET /api/profile/psyche
```

**Response**:
```json
{
  "id": "user-123",
  "stats": {
    "clarity": 0.72,
    "courage": 0.45,
    "connection": 0.88,
    "order": 0.30,
    "shadow": 0.15
  },
  "state": {
    "shadow_light": 0.8,
    "cold_warm": 0.7,
    "surface_depth": 0.9,
    "me_we": 0.6,
    "mind_heart": 0.4
  },
  "last_delta": {
    "date": "2025-12-14T10:30:00Z",
    "stats_delta": {
      "connection": 0.05,
      "courage": -0.02
    },
    "state_delta": {
      "cold_warm": 0.1
    }
  }
}
```

Currently using mock data in `MOCK_PSYCHE_PROFILE`.

## Next Steps (Phase 3: UI Implementation)

With Phase 2 complete, the following are ready for UI implementation:

1. **T3.2**: CoreStatsCard component
   - Import `usePsycheProfile()`
   - Use `movers` to highlight changed stats
   - Display values via `toPercent01()`

2. **T3.3**: ClimateCard component
   - Use `profile.state` for axis positions
   - Use `profile.visual_axes` for labels (if available)

3. **T3.5**: DerivedStatsCard component
   - Import `calcDerivedStats()`
   - Display vitality, willpower, chaos, harmony

4. **T4.1**: AfterQuizDeltaBanner component
   - Use `showBanner`, `movers`, `dismissBanner`
   - Display top 1-3 changed dimensions

## Success Criteria Met

- ✅ **SC-4**: No crashes with missing optional fields (all types handle `undefined`)
- ✅ **TS-1**: calcDerivedStats unit tests cover all formulas and edge cases
- ✅ **TS-2**: Types support rendering without optional fields
- ✅ All Phase 2 tasks (T2.1, T2.2, T2.3) completed
- ✅ Schema documented in hive-mind memory
- ✅ Integration hooks prepared for UI components

## Files Modified/Created

**Created**:
- `/src/domain/derivedStats.ts`
- `/src/domain/derivedStats.test.ts`
- `/src/domain/delta.ts`
- `/src/domain/README.md`
- `/.hive-mind/psyche-data-schema.json`
- `/docs/implementation/phase2-data-state-complete.md`

**Modified**:
- `/src/types/psyche.ts` (enhanced with v1 types)
- `/src/hooks/usePsycheProfile.ts` (added delta logic)

**Removed**:
- `/src/lib/derivedStats.ts` (moved to `/src/domain/`)

## References

- Implementation Plan: `/docs/plans/feature-char-sheet-impl.md`
- Type Definitions: `/src/types/psyche.ts`
- Domain README: `/src/domain/README.md`
- Schema Reference: `/.hive-mind/psyche-data-schema.json`
