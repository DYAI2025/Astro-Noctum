# Master Signal V1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a parallel 5D analysis pipeline (Natal + Quiz + GCB) alongside the existing 12-sector Fusion Ring, producing cross-signal metrics, narratives, and a ring projection contract.

**Architecture:** Three signal sources (Natal, Quiz, Generational Context Baseline) are independently projected into a shared 5D dimension space (passion, stability, future, connection, autonomy). A CrossReferenceEngine computes alignment/tension metrics. A MasterSignalBuilder assembles the final result with subsignals, relations, narratives, and metadata. A FusionRingProjection bridges back to the 12-sector ring.

**Tech Stack:** TypeScript (strict), React 19 hooks, Vitest, existing BAFE/Quiz data contracts

**Source spec:** `/Users/benjaminpoersch/Projects/codebase/Dev_Formell-Metrik.txt`

---

## Key Design Decisions

### What changes, what stays

- **Stays:** The existing 12-sector Fusion Ring (W+B+X+T → signal.ts → FusionRingSignal) is untouched. All current UI continues to work.
- **New:** A parallel `src/lib/master-signal/` module produces a `MasterSignal` object with 5D projections, cross-reference scores, and narratives.
- **Integration:** `useFusionRing` hook gains an optional `masterSignal` return value computed alongside the existing signal.
- **No Python:** The spec references `.py` files — we implement everything in TypeScript.

### 5D Dimension Space

```
passion    — drive, desire, creative fire
stability  — groundedness, persistence, structure
future     — vision, adaptability, growth orientation
connection — empathy, relational depth, social resonance
autonomy   — independence, self-direction, boundary strength
```

This is explicitly labeled `heuristic_v1` — an internal abstraction for cross-signal comparability, not a canonical ontology.

### GCB is NOT astrology

GCB derives only from `birth_year` → `age`, `cohort_5y`, `cohort_10y`, `generation_label`, `life_stage`. It uses no BAFE data. It is a context reference layer, not a personality diagnosis.

---

## File Plan

All new files go in `src/lib/master-signal/`:

| File | Purpose |
|------|---------|
| `types.ts` | All Master Signal V1 type definitions |
| `dimensions.ts` | The 5D dimension constants and utilities |
| `gcb-builder.ts` | Generational Context Baseline from birth year |
| `natal-projection.ts` | Project BAFE natal data → 5D |
| `quiz-projection.ts` | Project ContributionEvents → 5D |
| `cross-reference.ts` | Alignment/tension metrics between N, Q, G |
| `master-signal-builder.ts` | Assemble final MasterSignal object |
| `narratives.ts` | Generate narrative summaries (DE+EN) |
| `ring-projection.ts` | Bridge MasterSignal → 12-sector ring input |
| `index.ts` | Barrel exports |

Tests in `src/__tests__/master-signal/`:

| File | Purpose |
|------|---------|
| `gcb-builder.test.ts` | GCB generation from various birth years |
| `natal-projection.test.ts` | Natal → 5D projection |
| `quiz-projection.test.ts` | Quiz events → 5D projection |
| `cross-reference.test.ts` | Alignment metrics math |
| `master-signal-builder.test.ts` | End-to-end assembly |
| `ring-projection.test.ts` | 5D → 12-sector bridge |

---

## Task 1: Types and 5D Dimension Constants

**Files:**
- Create: `src/lib/master-signal/types.ts`
- Create: `src/lib/master-signal/dimensions.ts`
- Create: `src/lib/master-signal/index.ts`

**Step 1: Write the type definitions**

Create `src/lib/master-signal/types.ts`:

```typescript
/**
 * Master Signal V1 — Type Definitions
 *
 * Shared 5D dimension space = internal heuristic abstraction v1
 * for cross-signal comparability. NOT a canonical ontology.
 */

// ── 5D Dimension Space ─────────────────────────────────────────────

export type DimensionKey = 'passion' | 'stability' | 'future' | 'connection' | 'autonomy';

/** A normalized vector in the 5D dimension space. All values 0..1. */
export type DimensionVector = Record<DimensionKey, number>;

export type EvidenceMode = 'heuristic_v1' | 'empirical_v1';
export type WeightsMode = 'experimental_v1';
export type ProjectionMode = 'heuristic_v1';

// ── Signal Source Types ────────────────────────────────────────────

export type SignalType = 'natal' | 'quiz' | 'generational_context';

export interface ProjectedSignal {
  signal_type: SignalType;
  dimensions: DimensionVector;
  projection_mode: ProjectionMode;
  /** Which input fields were available vs missing */
  coverage: number; // 0..1
}

// ── GCB ────────────────────────────────────────────────────────────

export type LifeStage =
  | 'childhood'       // 0-12
  | 'adolescence'     // 13-19
  | 'early_adulthood' // 20-29
  | 'mid_adulthood'   // 30-44
  | 'mature_adulthood'// 45-59
  | 'senior'          // 60+
  ;

export interface GenerationalContextBaseline {
  birth_year: number;
  age: number;
  cohort_5y: string;       // e.g. "1985-1989"
  cohort_10y: string;      // e.g. "1985-1994"
  generation_label: string; // communication only, not primary compute basis
  life_stage: LifeStage;
  baseline_vector: DimensionVector;
  baseline_explanation: string[];
  evidence_mode: EvidenceMode;
}

// ── Cross-Reference ────────────────────────────────────────────────

export interface RelationScores {
  /** Alignment between Natal and Quiz signals */
  alignment_nq: number; // 0..1
  /** Alignment between Natal and GCB signals */
  alignment_ng: number;
  /** Alignment between Quiz and GCB signals */
  alignment_qg: number;
  /** Internal coherence = alignment(N, Q) */
  internal_coherence: number;
  /** Context fit = aggregate(N↔G, Q↔G) */
  context_fit: number;
  /** Weighted composite of all alignments */
  overall_integration: number;
}

// ── Narratives ─────────────────────────────────────────────────────

export interface Narratives {
  /** Integrated core pattern — never "true self" or "fundamental identity" */
  core_summary: string;
  /** Context model disclaimer + evidence_mode visible */
  context_summary: string;
  /** Fit between disposition and self-report, tension with context */
  integration_summary: string;
}

// ── Master Signal ──────────────────────────────────────────────────

export interface MasterSignal {
  subsignals: {
    natal: ProjectedSignal;
    quiz: ProjectedSignal;
    generational_context: ProjectedSignal;
  };
  relations: RelationScores;
  narratives: Narratives;
  metadata: {
    dimension_space: '5d_heuristic_v1';
    weights_mode: WeightsMode;
    evidence_mode: EvidenceMode;
    computed_at: string; // ISO timestamp
  };
}

// ── Ring Projection Contract ───────────────────────────────────────

export interface RingProjectionInput {
  /** 12-sector modulation derived from Master Signal 5D analysis */
  sector_modulation: number[];
  /** Which dimensions drove each sector's modulation */
  sector_sources: Array<{ dominant_dimension: DimensionKey; weight: number }>;
  /** Overall signal strength (0..1) */
  signal_strength: number;
  source: 'master_signal_v1';
}
```

**Step 2: Write dimension constants**

Create `src/lib/master-signal/dimensions.ts`:

```typescript
import type { DimensionKey, DimensionVector } from './types';

export const DIMENSION_KEYS: readonly DimensionKey[] = [
  'passion', 'stability', 'future', 'connection', 'autonomy',
] as const;

export const DIMENSION_COUNT = 5;

/** Create a zero-filled dimension vector */
export function zeroDimensions(): DimensionVector {
  return { passion: 0, stability: 0, future: 0, connection: 0, autonomy: 0 };
}

/** Clamp all dimension values to [0, 1] */
export function clampVector(v: DimensionVector): DimensionVector {
  const out = { ...v };
  for (const k of DIMENSION_KEYS) {
    out[k] = Math.max(0, Math.min(1, out[k]));
  }
  return out;
}

/** Normalize vector so max value = 1 (preserving ratios). Returns zero vector if all zero. */
export function normalizeVector(v: DimensionVector): DimensionVector {
  const max = Math.max(...DIMENSION_KEYS.map(k => Math.abs(v[k])));
  if (max === 0) return zeroDimensions();
  const out = { ...v };
  for (const k of DIMENSION_KEYS) {
    out[k] = v[k] / max;
  }
  return out;
}

/** Cosine similarity between two dimension vectors. Returns 0..1. */
export function cosineSimilarity(a: DimensionVector, b: DimensionVector): number {
  let dot = 0, magA = 0, magB = 0;
  for (const k of DIMENSION_KEYS) {
    dot  += a[k] * b[k];
    magA += a[k] * a[k];
    magB += b[k] * b[k];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  if (denom === 0) return 0;
  return Math.max(0, Math.min(1, dot / denom));
}

/** Euclidean distance between two vectors, normalized to [0, 1] range for 5D unit cube */
export function normalizedDistance(a: DimensionVector, b: DimensionVector): number {
  let sum = 0;
  for (const k of DIMENSION_KEYS) {
    const d = a[k] - b[k];
    sum += d * d;
  }
  // Max distance in 5D unit cube = sqrt(5)
  return Math.sqrt(sum) / Math.sqrt(DIMENSION_COUNT);
}

/** Weighted blend of two vectors */
export function blendVectors(
  a: DimensionVector,
  b: DimensionVector,
  weightA: number,
): DimensionVector {
  const weightB = 1 - weightA;
  const out = zeroDimensions();
  for (const k of DIMENSION_KEYS) {
    out[k] = a[k] * weightA + b[k] * weightB;
  }
  return out;
}
```

**Step 3: Create barrel export**

Create `src/lib/master-signal/index.ts`:

```typescript
export * from './types';
export * from './dimensions';
```

**Step 4: Run lint to verify**

Run: `cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum && npm run lint`
Expected: 0 errors

**Step 5: Commit**

```bash
git add src/lib/master-signal/types.ts src/lib/master-signal/dimensions.ts src/lib/master-signal/index.ts
git commit -m "feat(master-signal): add 5D dimension types and vector math utilities"
```

---

## Task 2: GCB Builder

**Files:**
- Create: `src/lib/master-signal/gcb-builder.ts`
- Create: `src/__tests__/master-signal/gcb-builder.test.ts`

**Step 1: Write the failing test**

Create `src/__tests__/master-signal/gcb-builder.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { buildGCB } from '@/src/lib/master-signal/gcb-builder';
import type { GenerationalContextBaseline } from '@/src/lib/master-signal/types';

describe('buildGCB', () => {
  it('computes correct fields for 1988 birth year', () => {
    const gcb = buildGCB(1988);
    expect(gcb.birth_year).toBe(1988);
    expect(gcb.age).toBeGreaterThanOrEqual(37);
    expect(gcb.cohort_5y).toBe('1985-1989');
    expect(gcb.cohort_10y).toBe('1980-1989');
    expect(gcb.generation_label).toBe('millennial');
    expect(gcb.life_stage).toBe('mid_adulthood');
    expect(gcb.evidence_mode).toBe('heuristic_v1');
  });

  it('computes gen_z for 2000 birth year', () => {
    const gcb = buildGCB(2000);
    expect(gcb.generation_label).toBe('gen_z');
    expect(gcb.cohort_5y).toBe('2000-2004');
    expect(gcb.life_stage).toBe('early_adulthood');
  });

  it('computes baby_boomer for 1955', () => {
    const gcb = buildGCB(1955);
    expect(gcb.generation_label).toBe('baby_boomer');
    expect(gcb.life_stage).toBe('senior');
  });

  it('baseline_vector is normalized (all values 0..1)', () => {
    const gcb = buildGCB(1988);
    const vals = Object.values(gcb.baseline_vector);
    expect(vals.every(v => v >= 0 && v <= 1)).toBe(true);
    expect(vals.some(v => v > 0)).toBe(true);
  });

  it('baseline_explanation contains context-only disclaimers', () => {
    const gcb = buildGCB(1988);
    expect(gcb.baseline_explanation.length).toBeGreaterThan(0);
    expect(gcb.baseline_explanation.some(e =>
      e.toLowerCase().includes('context') || e.toLowerCase().includes('reference')
    )).toBe(true);
  });

  it('has all 5 dimension keys in baseline_vector', () => {
    const gcb = buildGCB(1995);
    const keys = Object.keys(gcb.baseline_vector).sort();
    expect(keys).toEqual(['autonomy', 'connection', 'future', 'passion', 'stability']);
  });

  it('different life stages produce different baseline vectors', () => {
    const young = buildGCB(2005); // ~21, early_adulthood
    const mature = buildGCB(1970); // ~56, mature_adulthood
    // At least one dimension should differ meaningfully
    const dims = Object.keys(young.baseline_vector) as Array<keyof typeof young.baseline_vector>;
    const diffs = dims.map(k => Math.abs(young.baseline_vector[k] - mature.baseline_vector[k]));
    expect(Math.max(...diffs)).toBeGreaterThan(0.05);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum && npx vitest run src/__tests__/master-signal/gcb-builder.test.ts`
Expected: FAIL — module not found

**Step 3: Write gcb-builder implementation**

Create `src/lib/master-signal/gcb-builder.ts`:

```typescript
import type { GenerationalContextBaseline, LifeStage, DimensionVector } from './types';
import { clampVector } from './dimensions';

/**
 * Generational Context Baseline Builder
 *
 * Derives ONLY from birth_year:
 *   - age, cohort_5y, cohort_10y, generation_label, life_stage
 *   - baseline_vector (heuristic, NOT personality diagnosis)
 *
 * GCB is a context reference layer. Not astrology. Not a personality claim.
 */

const CURRENT_YEAR = new Date().getFullYear();

// ── Generation labels (communication aid only) ─────────────────────

function generationLabel(year: number): string {
  if (year <= 1945) return 'silent_generation';
  if (year <= 1964) return 'baby_boomer';
  if (year <= 1980) return 'gen_x';
  if (year <= 1996) return 'millennial';
  if (year <= 2012) return 'gen_z';
  return 'gen_alpha';
}

// ── Life stage from age ────────────────────────────────────────────

function lifeStage(age: number): LifeStage {
  if (age <= 12) return 'childhood';
  if (age <= 19) return 'adolescence';
  if (age <= 29) return 'early_adulthood';
  if (age <= 44) return 'mid_adulthood';
  if (age <= 59) return 'mature_adulthood';
  return 'senior';
}

// ── Cohort computation ─────────────────────────────────────────────

function cohort5y(year: number): string {
  const start = year - (year % 5);
  return `${start}-${start + 4}`;
}

function cohort10y(year: number): string {
  const start = year - (year % 10);
  return `${start}-${start + 9}`;
}

// ── Baseline vector (heuristic_v1) ─────────────────────────────────
// These are NOT empirical. They are heuristic reference points
// based on life-stage developmental psychology archetypes.
// Labeled experimental_v1. Will be replaced when real data is available.

const LIFE_STAGE_BASELINES: Record<LifeStage, DimensionVector> = {
  childhood:        { passion: 0.70, stability: 0.30, future: 0.40, connection: 0.65, autonomy: 0.25 },
  adolescence:      { passion: 0.75, stability: 0.25, future: 0.55, connection: 0.60, autonomy: 0.55 },
  early_adulthood:  { passion: 0.65, stability: 0.40, future: 0.65, connection: 0.55, autonomy: 0.70 },
  mid_adulthood:    { passion: 0.52, stability: 0.61, future: 0.56, connection: 0.58, autonomy: 0.64 },
  mature_adulthood: { passion: 0.45, stability: 0.70, future: 0.45, connection: 0.65, autonomy: 0.55 },
  senior:           { passion: 0.40, stability: 0.75, future: 0.35, connection: 0.70, autonomy: 0.50 },
};

export function buildGCB(birthYear: number): GenerationalContextBaseline {
  const age = CURRENT_YEAR - birthYear;
  const stage = lifeStage(age);

  return {
    birth_year: birthYear,
    age,
    cohort_5y: cohort5y(birthYear),
    cohort_10y: cohort10y(birthYear),
    generation_label: generationLabel(birthYear),
    life_stage: stage,
    baseline_vector: clampVector({ ...LIFE_STAGE_BASELINES[stage] }),
    baseline_explanation: [
      'context reference only — not a personality claim',
      `life_stage "${stage}" baseline (heuristic_v1)`,
      'generation_label is communication aid only, not used in model computation',
    ],
    evidence_mode: 'heuristic_v1',
  };
}
```

**Step 4: Run test to verify it passes**

Run: `cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum && npx vitest run src/__tests__/master-signal/gcb-builder.test.ts`
Expected: PASS (all 7 tests)

**Step 5: Update barrel export**

Add to `src/lib/master-signal/index.ts`:
```typescript
export { buildGCB } from './gcb-builder';
```

**Step 6: Commit**

```bash
git add src/lib/master-signal/gcb-builder.ts src/__tests__/master-signal/gcb-builder.test.ts src/lib/master-signal/index.ts
git commit -m "feat(master-signal): add GCB builder with life-stage baselines"
```

---

## Task 3: Natal Projection (BAFE → 5D)

**Files:**
- Create: `src/lib/master-signal/natal-projection.ts`
- Create: `src/__tests__/master-signal/natal-projection.test.ts`

**Step 1: Write the failing test**

Create `src/__tests__/master-signal/natal-projection.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { projectNatal } from '@/src/lib/master-signal/natal-projection';
import type { ApiData } from '@/src/types/bafe';

const MOCK_API_DATA: ApiData = {
  bazi: {
    pillars: {
      day:   { stem: 'Wu',  branch: 'Chen', animal: 'Dragon', element: 'Earth' },
      month: { stem: 'Ren', branch: 'Yin',  animal: 'Tiger',  element: 'Water' },
      year:  { stem: 'Wu',  branch: 'Chen', animal: 'Dragon', element: 'Earth' },
      hour:  { stem: 'Jia', branch: 'Zi',   animal: 'Rat',    element: 'Wood' },
    },
    day_master: 'Wu',
    zodiac_sign: 'Dragon',
  },
  western: {
    zodiac_sign: 'Aries',
    moon_sign: 'Cancer',
    ascendant_sign: 'Scorpio',
    houses: {},
  },
  wuxing: {
    elements: { Wood: 1, Fire: 2, Earth: 4, Metal: 1, Water: 2 },
    dominant_element: 'Earth',
  },
};

describe('projectNatal', () => {
  it('returns natal signal type with heuristic_v1 mode', () => {
    const result = projectNatal(MOCK_API_DATA);
    expect(result.signal_type).toBe('natal');
    expect(result.projection_mode).toBe('heuristic_v1');
  });

  it('produces values in 0..1 range', () => {
    const result = projectNatal(MOCK_API_DATA);
    const vals = Object.values(result.dimensions);
    expect(vals.every(v => v >= 0 && v <= 1)).toBe(true);
  });

  it('has all 5 dimension keys', () => {
    const result = projectNatal(MOCK_API_DATA);
    expect(Object.keys(result.dimensions).sort()).toEqual(
      ['autonomy', 'connection', 'future', 'passion', 'stability']
    );
  });

  it('coverage reflects available data', () => {
    const result = projectNatal(MOCK_API_DATA);
    expect(result.coverage).toBeGreaterThan(0.5);
  });

  it('handles missing bazi gracefully', () => {
    const partial: ApiData = { western: MOCK_API_DATA.western, wuxing: MOCK_API_DATA.wuxing };
    const result = projectNatal(partial);
    expect(result.coverage).toBeLessThan(1);
    expect(result.dimensions.passion).toBeGreaterThanOrEqual(0);
  });

  it('handles completely empty data', () => {
    const result = projectNatal({});
    expect(result.coverage).toBe(0);
    const vals = Object.values(result.dimensions);
    expect(vals.every(v => v === 0)).toBe(true);
  });

  it('fire-heavy elements boost passion', () => {
    const fireHeavy: ApiData = {
      ...MOCK_API_DATA,
      wuxing: { elements: { Wood: 0, Fire: 8, Earth: 1, Metal: 0, Water: 1 }, dominant_element: 'Fire' },
    };
    const earthHeavy: ApiData = {
      ...MOCK_API_DATA,
      wuxing: { elements: { Wood: 0, Fire: 0, Earth: 8, Metal: 1, Water: 1 }, dominant_element: 'Earth' },
    };
    const fireResult = projectNatal(fireHeavy);
    const earthResult = projectNatal(earthHeavy);
    expect(fireResult.dimensions.passion).toBeGreaterThan(earthResult.dimensions.passion);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/master-signal/natal-projection.test.ts`
Expected: FAIL

**Step 3: Write natal-projection implementation**

Create `src/lib/master-signal/natal-projection.ts`:

```typescript
import type { ApiData } from '@/src/types/bafe';
import type { ProjectedSignal, DimensionVector } from './types';
import { zeroDimensions, clampVector, DIMENSION_KEYS } from './dimensions';

/**
 * Natal Projection — BAFE natal data → 5D dimension space
 *
 * This projection is an internal heuristic abstraction v1.
 * NOT a canonical astrological ontology.
 * Mapping decisions documented as heuristic_v1.
 *
 * Heuristic mappings:
 *   Western zodiac signs → element affinities → dimension weights
 *   BaZi elements → direct 5D mapping
 *   Wu-Xing element counts → dimension weights
 */

// ── Element → Dimension affinity (heuristic_v1) ───────────────────
// Fire   → passion, autonomy
// Earth  → stability, connection
// Metal  → future (structure/precision), stability
// Water  → connection, future (flow/adaptability)
// Wood   → passion (growth), autonomy

const ELEMENT_DIMENSION_MAP: Record<string, Partial<DimensionVector>> = {
  Fire:  { passion: 0.8, stability: 0.1, future: 0.2, connection: 0.3, autonomy: 0.6 },
  Earth: { passion: 0.2, stability: 0.8, future: 0.3, connection: 0.7, autonomy: 0.2 },
  Metal: { passion: 0.1, stability: 0.6, future: 0.7, connection: 0.2, autonomy: 0.5 },
  Water: { passion: 0.3, stability: 0.3, future: 0.6, connection: 0.8, autonomy: 0.3 },
  Wood:  { passion: 0.7, stability: 0.3, future: 0.5, connection: 0.4, autonomy: 0.7 },
};

// ── Western sign → element mapping (heuristic_v1) ─────────────────
const SIGN_ELEMENT: Record<string, string> = {
  Aries: 'Fire', Leo: 'Fire', Sagittarius: 'Fire',
  Taurus: 'Earth', Virgo: 'Earth', Capricorn: 'Earth',
  Gemini: 'Metal', Libra: 'Metal', Aquarius: 'Metal',
  Cancer: 'Water', Scorpio: 'Water', Pisces: 'Water',
};

function signToDimensions(sign: string | undefined): DimensionVector {
  if (!sign) return zeroDimensions();
  const element = SIGN_ELEMENT[sign];
  if (!element) return zeroDimensions();
  const affinity = ELEMENT_DIMENSION_MAP[element];
  if (!affinity) return zeroDimensions();
  const out = zeroDimensions();
  for (const k of DIMENSION_KEYS) {
    out[k] = affinity[k] ?? 0;
  }
  return out;
}

function elementCountsToDimensions(
  elements: Record<string, number> | undefined,
): DimensionVector {
  if (!elements) return zeroDimensions();
  const total = Object.values(elements).reduce((s, v) => s + v, 0);
  if (total === 0) return zeroDimensions();

  const out = zeroDimensions();
  for (const [elem, count] of Object.entries(elements)) {
    const ratio = count / total;
    const affinity = ELEMENT_DIMENSION_MAP[elem];
    if (!affinity) continue;
    for (const k of DIMENSION_KEYS) {
      out[k] += ratio * (affinity[k] ?? 0);
    }
  }
  return out;
}

function baziToDimensions(bazi: ApiData['bazi']): DimensionVector {
  if (!bazi?.pillars) return zeroDimensions();
  const out = zeroDimensions();

  // Day pillar element has most weight
  const weights = { day: 0.40, year: 0.25, month: 0.20, hour: 0.15 };
  for (const [pillar, weight] of Object.entries(weights)) {
    const p = bazi.pillars[pillar as keyof typeof bazi.pillars];
    if (!p?.element) continue;
    const affinity = ELEMENT_DIMENSION_MAP[p.element];
    if (!affinity) continue;
    for (const k of DIMENSION_KEYS) {
      out[k] += weight * (affinity[k] ?? 0);
    }
  }
  return out;
}

export function projectNatal(apiData: ApiData): ProjectedSignal {
  let sources = 0;
  let totalSources = 3; // western, bazi, wuxing

  // Western: Sun(0.5) + Moon(0.3) + Asc(0.2) → element → 5D
  const sunD = signToDimensions(apiData.western?.zodiac_sign);
  const moonD = signToDimensions(apiData.western?.moon_sign);
  const ascD = signToDimensions(apiData.western?.ascendant_sign);
  const western = zeroDimensions();
  const hasWestern = !!(apiData.western?.zodiac_sign || apiData.western?.moon_sign);
  if (hasWestern) {
    sources++;
    for (const k of DIMENSION_KEYS) {
      western[k] = 0.50 * sunD[k] + 0.30 * moonD[k] + 0.20 * ascD[k];
    }
  }

  // BaZi pillars → element → 5D
  const bazi = baziToDimensions(apiData.bazi);
  const hasBazi = !!(apiData.bazi?.pillars);
  if (hasBazi) sources++;

  // Wu-Xing element counts → 5D
  const wuxing = elementCountsToDimensions(apiData.wuxing?.elements);
  const hasWuxing = !!(apiData.wuxing?.elements);
  if (hasWuxing) sources++;

  // Blend available sources equally
  const dimensions = zeroDimensions();
  if (sources === 0) {
    return {
      signal_type: 'natal',
      dimensions,
      projection_mode: 'heuristic_v1',
      coverage: 0,
    };
  }

  for (const k of DIMENSION_KEYS) {
    let sum = 0;
    if (hasWestern) sum += western[k];
    if (hasBazi)    sum += bazi[k];
    if (hasWuxing)  sum += wuxing[k];
    dimensions[k] = sum / sources;
  }

  return {
    signal_type: 'natal',
    dimensions: clampVector(dimensions),
    projection_mode: 'heuristic_v1',
    coverage: sources / totalSources,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/master-signal/natal-projection.test.ts`
Expected: PASS

**Step 5: Update barrel export**

Add to `src/lib/master-signal/index.ts`:
```typescript
export { projectNatal } from './natal-projection';
```

**Step 6: Commit**

```bash
git add src/lib/master-signal/natal-projection.ts src/__tests__/master-signal/natal-projection.test.ts src/lib/master-signal/index.ts
git commit -m "feat(master-signal): add natal projection (BAFE → 5D heuristic_v1)"
```

---

## Task 4: Quiz Projection (ContributionEvents → 5D)

**Files:**
- Create: `src/lib/master-signal/quiz-projection.ts`
- Create: `src/__tests__/master-signal/quiz-projection.test.ts`

**Step 1: Write the failing test**

Create `src/__tests__/master-signal/quiz-projection.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { projectQuiz } from '@/src/lib/master-signal/quiz-projection';
import type { ContributionEvent } from '@/src/lib/lme/types';

function makeEvent(markers: Array<{ id: string; weight: number }>): ContributionEvent {
  return {
    specVersion: 'sp.contribution.v1',
    eventId: 'test-' + Math.random().toString(36).slice(2),
    occurredAt: new Date().toISOString(),
    source: { vertical: 'quiz', moduleId: 'quiz.test.v1' },
    payload: { markers },
  };
}

describe('projectQuiz', () => {
  it('returns quiz signal type with heuristic_v1 mode', () => {
    const result = projectQuiz([makeEvent([{ id: 'marker.love.physical_touch', weight: 0.8 }])]);
    expect(result.signal_type).toBe('quiz');
    expect(result.projection_mode).toBe('heuristic_v1');
  });

  it('produces values in 0..1 range', () => {
    const events = [
      makeEvent([
        { id: 'marker.love.physical_touch', weight: 0.9 },
        { id: 'marker.leadership.visionary', weight: 0.7 },
      ]),
    ];
    const result = projectQuiz(events);
    const vals = Object.values(result.dimensions);
    expect(vals.every(v => v >= 0 && v <= 1)).toBe(true);
  });

  it('handles empty events array', () => {
    const result = projectQuiz([]);
    expect(result.coverage).toBe(0);
    const vals = Object.values(result.dimensions);
    expect(vals.every(v => v === 0)).toBe(true);
  });

  it('love markers boost connection dimension', () => {
    const loveHeavy = [makeEvent([
      { id: 'marker.love.physical_touch', weight: 0.9 },
      { id: 'marker.love.expression', weight: 0.8 },
    ])];
    const leaderHeavy = [makeEvent([
      { id: 'marker.leadership.visionary', weight: 0.9 },
      { id: 'marker.leadership.servant_leader', weight: 0.8 },
    ])];
    const loveResult = projectQuiz(loveHeavy);
    const leaderResult = projectQuiz(leaderHeavy);
    expect(loveResult.dimensions.connection).toBeGreaterThan(leaderResult.dimensions.connection);
  });

  it('coverage scales with number of events', () => {
    const one = projectQuiz([makeEvent([{ id: 'marker.love.physical_touch', weight: 0.5 }])]);
    const three = projectQuiz([
      makeEvent([{ id: 'marker.love.physical_touch', weight: 0.5 }]),
      makeEvent([{ id: 'marker.social.extroversion', weight: 0.6 }]),
      makeEvent([{ id: 'marker.freedom.autonomy', weight: 0.7 }]),
    ]);
    expect(three.coverage).toBeGreaterThan(one.coverage);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/master-signal/quiz-projection.test.ts`
Expected: FAIL

**Step 3: Write quiz-projection implementation**

Create `src/lib/master-signal/quiz-projection.ts`:

```typescript
import type { ContributionEvent } from '@/src/lib/lme/types';
import type { ProjectedSignal, DimensionVector } from './types';
import { zeroDimensions, clampVector, DIMENSION_KEYS } from './dimensions';

/**
 * Quiz Projection — ContributionEvents → 5D dimension space
 *
 * Heuristic mappings (documented per spec requirement):
 *   marker.domain → 5D dimension weights
 *   - love, emotion, eq, social → connection (primary), passion (secondary)
 *   - leadership, cognition, skills → autonomy (primary), future (secondary)
 *   - instinct, energy, creative → passion (primary), autonomy (secondary)
 *   - spiritual, flower, stone, aura → connection (primary), stability (secondary)
 *   - values, lifestyle → stability (primary), future (secondary)
 *   - freedom → autonomy (primary), passion (secondary)
 *
 * Missing data handling: unknown domains contribute equally to all dimensions
 * at reduced weight (0.2 each), so they don't bias the signal.
 */

// ── Domain → 5D affinity (heuristic_v1) ───────────────────────────

const DOMAIN_DIMENSION_MAP: Record<string, DimensionVector> = {
  love:       { passion: 0.5, stability: 0.1, future: 0.1, connection: 0.8, autonomy: 0.1 },
  emotion:    { passion: 0.4, stability: 0.2, future: 0.1, connection: 0.7, autonomy: 0.1 },
  eq:         { passion: 0.2, stability: 0.3, future: 0.2, connection: 0.8, autonomy: 0.2 },
  social:     { passion: 0.3, stability: 0.2, future: 0.3, connection: 0.6, autonomy: 0.3 },
  leadership: { passion: 0.3, stability: 0.3, future: 0.5, connection: 0.3, autonomy: 0.7 },
  cognition:  { passion: 0.1, stability: 0.3, future: 0.6, connection: 0.2, autonomy: 0.5 },
  skills:     { passion: 0.2, stability: 0.4, future: 0.5, connection: 0.2, autonomy: 0.5 },
  instinct:   { passion: 0.7, stability: 0.2, future: 0.1, connection: 0.3, autonomy: 0.6 },
  energy:     { passion: 0.6, stability: 0.3, future: 0.3, connection: 0.3, autonomy: 0.4 },
  creative:   { passion: 0.7, stability: 0.1, future: 0.4, connection: 0.3, autonomy: 0.6 },
  spiritual:  { passion: 0.3, stability: 0.5, future: 0.3, connection: 0.6, autonomy: 0.2 },
  flower:     { passion: 0.3, stability: 0.5, future: 0.2, connection: 0.6, autonomy: 0.2 },
  stone:      { passion: 0.2, stability: 0.6, future: 0.3, connection: 0.5, autonomy: 0.2 },
  aura:       { passion: 0.4, stability: 0.3, future: 0.3, connection: 0.6, autonomy: 0.3 },
  values:     { passion: 0.3, stability: 0.6, future: 0.5, connection: 0.4, autonomy: 0.3 },
  lifestyle:  { passion: 0.3, stability: 0.5, future: 0.4, connection: 0.4, autonomy: 0.4 },
  freedom:    { passion: 0.5, stability: 0.1, future: 0.4, connection: 0.2, autonomy: 0.8 },
};

const FALLBACK_DIMENSION: DimensionVector = {
  passion: 0.2, stability: 0.2, future: 0.2, connection: 0.2, autonomy: 0.2,
};

/** Extract domain from marker id: "marker.love.physical_touch" → "love" */
function extractDomain(markerId: string): string {
  const parts = markerId.split('.');
  return parts.length >= 2 ? parts[1] : 'unknown';
}

export function projectQuiz(events: ContributionEvent[]): ProjectedSignal {
  if (events.length === 0) {
    return {
      signal_type: 'quiz',
      dimensions: zeroDimensions(),
      projection_mode: 'heuristic_v1',
      coverage: 0,
    };
  }

  const accumulated = zeroDimensions();
  let totalWeight = 0;

  for (const event of events) {
    for (const marker of event.payload.markers) {
      const domain = extractDomain(marker.id);
      const affinities = DOMAIN_DIMENSION_MAP[domain] ?? FALLBACK_DIMENSION;
      const w = marker.weight * (marker.evidence?.confidence ?? 0.7);

      for (const k of DIMENSION_KEYS) {
        accumulated[k] += affinities[k] * w;
      }
      totalWeight += w;
    }
  }

  if (totalWeight === 0) {
    return {
      signal_type: 'quiz',
      dimensions: zeroDimensions(),
      projection_mode: 'heuristic_v1',
      coverage: 0,
    };
  }

  // Normalize by total weight
  for (const k of DIMENSION_KEYS) {
    accumulated[k] /= totalWeight;
  }

  // Coverage: how many quiz events (capped at 22 max quizzes)
  const maxQuizzes = 22;
  const coverage = Math.min(1, events.length / maxQuizzes);

  return {
    signal_type: 'quiz',
    dimensions: clampVector(accumulated),
    projection_mode: 'heuristic_v1',
    coverage,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/master-signal/quiz-projection.test.ts`
Expected: PASS

**Step 5: Update barrel, commit**

```bash
git add src/lib/master-signal/quiz-projection.ts src/__tests__/master-signal/quiz-projection.test.ts src/lib/master-signal/index.ts
git commit -m "feat(master-signal): add quiz projection (events → 5D heuristic_v1)"
```

---

## Task 5: Cross-Reference Engine

**Files:**
- Create: `src/lib/master-signal/cross-reference.ts`
- Create: `src/__tests__/master-signal/cross-reference.test.ts`

**Step 1: Write the failing test**

Create `src/__tests__/master-signal/cross-reference.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { computeRelations } from '@/src/lib/master-signal/cross-reference';
import type { ProjectedSignal } from '@/src/lib/master-signal/types';

function makeSignal(type: 'natal' | 'quiz' | 'generational_context', dims: Record<string, number>): ProjectedSignal {
  return {
    signal_type: type,
    dimensions: {
      passion: dims.passion ?? 0.5,
      stability: dims.stability ?? 0.5,
      future: dims.future ?? 0.5,
      connection: dims.connection ?? 0.5,
      autonomy: dims.autonomy ?? 0.5,
    },
    projection_mode: 'heuristic_v1',
    coverage: 1,
  };
}

describe('computeRelations', () => {
  it('identical signals produce high alignment', () => {
    const same = { passion: 0.7, stability: 0.3, future: 0.5, connection: 0.6, autonomy: 0.4 };
    const n = makeSignal('natal', same);
    const q = makeSignal('quiz', same);
    const g = makeSignal('generational_context', same);
    const r = computeRelations(n, q, g);
    expect(r.alignment_nq).toBeGreaterThan(0.95);
    expect(r.alignment_ng).toBeGreaterThan(0.95);
    expect(r.alignment_qg).toBeGreaterThan(0.95);
    expect(r.internal_coherence).toBeGreaterThan(0.95);
  });

  it('orthogonal signals produce low alignment', () => {
    const n = makeSignal('natal', { passion: 1, stability: 0, future: 0, connection: 0, autonomy: 0 });
    const q = makeSignal('quiz', { passion: 0, stability: 1, future: 0, connection: 0, autonomy: 0 });
    const g = makeSignal('generational_context', { passion: 0, stability: 0, future: 1, connection: 0, autonomy: 0 });
    const r = computeRelations(n, q, g);
    expect(r.alignment_nq).toBeLessThan(0.3);
    expect(r.alignment_ng).toBeLessThan(0.3);
  });

  it('all scores are in 0..1 range', () => {
    const n = makeSignal('natal', { passion: 0.8, stability: 0.2, future: 0.5, connection: 0.9, autonomy: 0.1 });
    const q = makeSignal('quiz', { passion: 0.3, stability: 0.7, future: 0.4, connection: 0.2, autonomy: 0.8 });
    const g = makeSignal('generational_context', { passion: 0.5, stability: 0.5, future: 0.5, connection: 0.5, autonomy: 0.5 });
    const r = computeRelations(n, q, g);
    const vals = Object.values(r);
    expect(vals.every(v => v >= 0 && v <= 1)).toBe(true);
  });

  it('internal_coherence equals alignment_nq', () => {
    const n = makeSignal('natal', { passion: 0.8, stability: 0.2, future: 0.5, connection: 0.9, autonomy: 0.1 });
    const q = makeSignal('quiz', { passion: 0.3, stability: 0.7, future: 0.4, connection: 0.2, autonomy: 0.8 });
    const g = makeSignal('generational_context', { passion: 0.5, stability: 0.5, future: 0.5, connection: 0.5, autonomy: 0.5 });
    const r = computeRelations(n, q, g);
    expect(r.internal_coherence).toBe(r.alignment_nq);
  });

  it('context_fit aggregates N↔G and Q↔G', () => {
    const n = makeSignal('natal', { passion: 0.8, stability: 0.2, future: 0.5, connection: 0.9, autonomy: 0.1 });
    const q = makeSignal('quiz', { passion: 0.3, stability: 0.7, future: 0.4, connection: 0.2, autonomy: 0.8 });
    const g = makeSignal('generational_context', { passion: 0.5, stability: 0.5, future: 0.5, connection: 0.5, autonomy: 0.5 });
    const r = computeRelations(n, q, g);
    // context_fit should be between alignment_ng and alignment_qg
    const min = Math.min(r.alignment_ng, r.alignment_qg);
    const max = Math.max(r.alignment_ng, r.alignment_qg);
    expect(r.context_fit).toBeGreaterThanOrEqual(min - 0.01);
    expect(r.context_fit).toBeLessThanOrEqual(max + 0.01);
  });

  it('GCB does not dominate overall_integration', () => {
    // Per spec: GCB stays context, not core identity
    // overall_integration should weight N↔Q more than G-related alignments
    const n = makeSignal('natal', { passion: 0.8, stability: 0.2, future: 0.5, connection: 0.9, autonomy: 0.1 });
    const q = makeSignal('quiz', { passion: 0.8, stability: 0.2, future: 0.5, connection: 0.9, autonomy: 0.1 });
    const gDifferent = makeSignal('generational_context', { passion: 0.1, stability: 0.9, future: 0.1, connection: 0.1, autonomy: 0.9 });
    const r = computeRelations(n, q, gDifferent);
    // N and Q agree strongly, G disagrees — overall should still be reasonably high
    expect(r.overall_integration).toBeGreaterThan(0.5);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/master-signal/cross-reference.test.ts`
Expected: FAIL

**Step 3: Write cross-reference implementation**

Create `src/lib/master-signal/cross-reference.ts`:

```typescript
import type { ProjectedSignal, RelationScores } from './types';
import { cosineSimilarity } from './dimensions';

/**
 * Cross-Reference Engine
 *
 * Compares Natal (N), Quiz (Q), and Generational Context (G) signals.
 * Derives alignment and integration metrics.
 *
 * IMPORTANT: GCB remains context, not core identity.
 * The engine must not simply average all three — doing so would
 * make GCB a truth source. Weighting reflects this:
 *
 * overall_integration = 0.50 · alignment(N,Q) + 0.25 · alignment(N,G) + 0.25 · alignment(Q,G)
 *
 * Weights labeled experimental_v1.
 */

// ── Weights (experimental_v1) ──────────────────────────────────────
const W_NQ = 0.50;  // Natal ↔ Quiz: primary (self-report vs disposition)
const W_NG = 0.25;  // Natal ↔ GCB: secondary (disposition vs context)
const W_QG = 0.25;  // Quiz ↔ GCB: secondary (self-report vs context)

export function computeRelations(
  natal: ProjectedSignal,
  quiz: ProjectedSignal,
  gcb: ProjectedSignal,
): RelationScores {
  const alignment_nq = cosineSimilarity(natal.dimensions, quiz.dimensions);
  const alignment_ng = cosineSimilarity(natal.dimensions, gcb.dimensions);
  const alignment_qg = cosineSimilarity(quiz.dimensions, gcb.dimensions);

  const internal_coherence = alignment_nq;
  const context_fit = (alignment_ng + alignment_qg) / 2;
  const overall_integration = W_NQ * alignment_nq + W_NG * alignment_ng + W_QG * alignment_qg;

  return {
    alignment_nq,
    alignment_ng,
    alignment_qg,
    internal_coherence,
    context_fit,
    overall_integration: Math.max(0, Math.min(1, overall_integration)),
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/master-signal/cross-reference.test.ts`
Expected: PASS

**Step 5: Update barrel, commit**

```bash
git add src/lib/master-signal/cross-reference.ts src/__tests__/master-signal/cross-reference.test.ts src/lib/master-signal/index.ts
git commit -m "feat(master-signal): add cross-reference engine with N/Q/G alignment metrics"
```

---

## Task 6: Narratives + Master Signal Builder

**Files:**
- Create: `src/lib/master-signal/narratives.ts`
- Create: `src/lib/master-signal/master-signal-builder.ts`
- Create: `src/__tests__/master-signal/master-signal-builder.test.ts`

**Step 1: Write the failing test**

Create `src/__tests__/master-signal/master-signal-builder.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { buildMasterSignal } from '@/src/lib/master-signal/master-signal-builder';
import type { ApiData } from '@/src/types/bafe';
import type { ContributionEvent } from '@/src/lib/lme/types';

const MOCK_API: ApiData = {
  bazi: {
    pillars: {
      day:   { stem: 'Wu',  branch: 'Chen', animal: 'Dragon', element: 'Earth' },
      month: { stem: 'Ren', branch: 'Yin',  animal: 'Tiger',  element: 'Water' },
      year:  { stem: 'Wu',  branch: 'Chen', animal: 'Dragon', element: 'Earth' },
      hour:  { stem: 'Jia', branch: 'Zi',   animal: 'Rat',    element: 'Wood' },
    },
    day_master: 'Wu',
    zodiac_sign: 'Dragon',
  },
  western: {
    zodiac_sign: 'Aries',
    moon_sign: 'Cancer',
    ascendant_sign: 'Scorpio',
    houses: {},
  },
  wuxing: {
    elements: { Wood: 1, Fire: 2, Earth: 4, Metal: 1, Water: 2 },
    dominant_element: 'Earth',
  },
};

const MOCK_EVENTS: ContributionEvent[] = [
  {
    specVersion: 'sp.contribution.v1',
    eventId: 'e1',
    occurredAt: new Date().toISOString(),
    source: { vertical: 'quiz', moduleId: 'quiz.love_languages.v1' },
    payload: {
      markers: [
        { id: 'marker.love.physical_touch', weight: 0.9 },
        { id: 'marker.love.expression', weight: 0.6 },
      ],
    },
  },
];

describe('buildMasterSignal', () => {
  it('produces complete MasterSignal structure', () => {
    const ms = buildMasterSignal(MOCK_API, MOCK_EVENTS, 1988, 'de');
    expect(ms.subsignals.natal.signal_type).toBe('natal');
    expect(ms.subsignals.quiz.signal_type).toBe('quiz');
    expect(ms.subsignals.generational_context.signal_type).toBe('generational_context');
    expect(ms.metadata.dimension_space).toBe('5d_heuristic_v1');
    expect(ms.metadata.weights_mode).toBe('experimental_v1');
    expect(ms.metadata.evidence_mode).toBe('heuristic_v1');
  });

  it('has all relation scores', () => {
    const ms = buildMasterSignal(MOCK_API, MOCK_EVENTS, 1988, 'de');
    expect(typeof ms.relations.alignment_nq).toBe('number');
    expect(typeof ms.relations.alignment_ng).toBe('number');
    expect(typeof ms.relations.alignment_qg).toBe('number');
    expect(typeof ms.relations.internal_coherence).toBe('number');
    expect(typeof ms.relations.context_fit).toBe('number');
    expect(typeof ms.relations.overall_integration).toBe('number');
  });

  it('narratives contain no absolute identity claims', () => {
    const ms = buildMasterSignal(MOCK_API, MOCK_EVENTS, 1988, 'de');
    const allNarratives = Object.values(ms.narratives).join(' ');
    const forbidden = ['wahres Selbst', 'wahre Grundpersönlichkeit', 'true self',
      'fundamental identity', 'who this person fundamentally is',
      'wissenschaftlich bewiesen', 'scientifically proven'];
    for (const f of forbidden) {
      expect(allNarratives.toLowerCase()).not.toContain(f.toLowerCase());
    }
  });

  it('context_summary mentions evidence_mode', () => {
    const ms = buildMasterSignal(MOCK_API, MOCK_EVENTS, 1988, 'de');
    expect(ms.narratives.context_summary).toContain('heuristic');
  });

  it('handles empty quiz events', () => {
    const ms = buildMasterSignal(MOCK_API, [], 1988, 'de');
    expect(ms.subsignals.quiz.coverage).toBe(0);
    expect(ms.metadata.evidence_mode).toBe('heuristic_v1');
  });

  it('handles missing API data', () => {
    const ms = buildMasterSignal({}, MOCK_EVENTS, 1988, 'de');
    expect(ms.subsignals.natal.coverage).toBe(0);
    expect(ms.relations.overall_integration).toBeGreaterThanOrEqual(0);
  });

  it('produces EN narratives when requested', () => {
    const ms = buildMasterSignal(MOCK_API, MOCK_EVENTS, 1988, 'en');
    // EN narratives should not contain German
    expect(ms.narratives.core_summary).not.toContain('Kernmuster');
  });

  it('metadata.computed_at is a valid ISO timestamp', () => {
    const ms = buildMasterSignal(MOCK_API, MOCK_EVENTS, 1988, 'de');
    expect(() => new Date(ms.metadata.computed_at)).not.toThrow();
    expect(new Date(ms.metadata.computed_at).getFullYear()).toBeGreaterThan(2020);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/master-signal/master-signal-builder.test.ts`
Expected: FAIL

**Step 3: Write narratives module**

Create `src/lib/master-signal/narratives.ts`:

```typescript
import type { ProjectedSignal, RelationScores, Narratives, DimensionKey } from './types';
import { DIMENSION_KEYS } from './dimensions';

/**
 * Narrative Layer
 *
 * Rules:
 * - core_summary: "integrated core pattern" / "current integrative profile", NEVER "true self"
 * - context_summary: always shows evidence_mode, disclaims individual truth claims
 * - integration_summary: shows fit, tension, deviation without absolute claims
 */

type Lang = 'de' | 'en';

const DIMENSION_LABELS: Record<Lang, Record<DimensionKey, string>> = {
  de: {
    passion: 'Leidenschaft',
    stability: 'Stabilität',
    future: 'Zukunftsorientierung',
    connection: 'Verbundenheit',
    autonomy: 'Autonomie',
  },
  en: {
    passion: 'Passion',
    stability: 'Stability',
    future: 'Future Orientation',
    connection: 'Connection',
    autonomy: 'Autonomy',
  },
};

function topDimensions(signal: ProjectedSignal, n: number): DimensionKey[] {
  return DIMENSION_KEYS
    .slice()
    .sort((a, b) => signal.dimensions[b] - signal.dimensions[a])
    .slice(0, n);
}

function formatAlignment(value: number): string {
  if (value >= 0.8) return 'high';
  if (value >= 0.5) return 'moderate';
  return 'low';
}

export function generateNarratives(
  natal: ProjectedSignal,
  quiz: ProjectedSignal,
  gcb: ProjectedSignal,
  relations: RelationScores,
  lang: Lang = 'de',
): Narratives {
  const labels = DIMENSION_LABELS[lang];
  const natalTop = topDimensions(natal, 2);
  const quizTop = topDimensions(quiz, 2);
  const alignment = formatAlignment(relations.internal_coherence);

  // ── core_summary ─────────────────────────────────────────────
  const coreSummary = lang === 'de'
    ? `Dein aktuelles integratives Profil zeigt ein Kernmuster mit Schwerpunkt auf ${labels[natalTop[0]]} und ${labels[natalTop[1]]}. `
      + `Deine Selbsteinschätzung betont ${labels[quizTop[0]]} und ${labels[quizTop[1]]}. `
      + `Die Übereinstimmung zwischen Anlage und Selbstbericht ist ${alignment === 'high' ? 'hoch' : alignment === 'moderate' ? 'moderat' : 'gering'}.`
    : `Your current integrative profile shows a core pattern emphasizing ${labels[natalTop[0]]} and ${labels[natalTop[1]]}. `
      + `Your self-report emphasizes ${labels[quizTop[0]]} and ${labels[quizTop[1]]}. `
      + `The alignment between disposition and self-report is ${alignment}.`;

  // ── context_summary ──────────────────────────────────────────
  const gcbTop = topDimensions(gcb, 2);
  const contextSummary = lang === 'de'
    ? `Dieses Kontextmodell (evidence_mode: heuristic_v1) positioniert dich in einer Lebensphase, `
      + `die typischerweise ${labels[gcbTop[0]]} und ${labels[gcbTop[1]]} betont. `
      + `Dies ist eine Referenzschicht, keine individuelle Wahrheitsaussage. `
      + `Generationskontext dient als Orientierungsrahmen, nicht als Persönlichkeitsdiagnose.`
    : `This context model (evidence_mode: heuristic_v1) places you in a life stage `
      + `that typically emphasizes ${labels[gcbTop[0]]} and ${labels[gcbTop[1]]}. `
      + `This is a reference layer, not an individual truth claim. `
      + `Generational context serves as an orientation framework, not a personality diagnosis.`;

  // ── integration_summary ──────────────────────────────────────
  const contextFit = formatAlignment(relations.context_fit);
  const integrationSummary = lang === 'de'
    ? `Die Passung zwischen deiner Anlage und deinem Selbstbericht ist ${alignment === 'high' ? 'deutlich' : alignment === 'moderate' ? 'teilweise' : 'gering'} ausgeprägt. `
      + `Dein Profil ${contextFit === 'high' ? 'stimmt gut' : contextFit === 'moderate' ? 'stimmt teilweise' : 'weicht ab'} vom Kohortenrahmen. `
      + `Keine der Quellen wird dabei absolut gesetzt.`
    : `The fit between your disposition and self-report is ${alignment}. `
      + `Your profile ${contextFit === 'high' ? 'aligns well with' : contextFit === 'moderate' ? 'partially aligns with' : 'diverges from'} the cohort framework. `
      + `No single source is treated as absolute.`;

  return {
    core_summary: coreSummary,
    context_summary: contextSummary,
    integration_summary: integrationSummary,
  };
}
```

**Step 4: Write master-signal-builder**

Create `src/lib/master-signal/master-signal-builder.ts`:

```typescript
import type { ApiData } from '@/src/types/bafe';
import type { ContributionEvent } from '@/src/lib/lme/types';
import type { MasterSignal } from './types';
import { projectNatal } from './natal-projection';
import { projectQuiz } from './quiz-projection';
import { buildGCB } from './gcb-builder';
import { computeRelations } from './cross-reference';
import { generateNarratives } from './narratives';

/**
 * Master Signal Builder
 *
 * Assembles the final MasterSignal from three signal sources:
 *   N = Natal (from BAFE API data)
 *   Q = Quiz (from ContributionEvents)
 *   G = Generational Context Baseline (from birth year)
 *
 * All projected into shared 5D heuristic abstraction v1.
 */

export function buildMasterSignal(
  apiData: ApiData,
  quizEvents: ContributionEvent[],
  birthYear: number,
  lang: 'de' | 'en' = 'de',
): MasterSignal {
  // 1. Project each source into 5D
  const natal = projectNatal(apiData);
  const quiz = projectQuiz(quizEvents);
  const gcbRaw = buildGCB(birthYear);

  // GCB as ProjectedSignal for cross-reference
  const gcbSignal = {
    signal_type: 'generational_context' as const,
    dimensions: gcbRaw.baseline_vector,
    projection_mode: 'heuristic_v1' as const,
    coverage: 1, // GCB always has full coverage (birth year is required input)
  };

  // 2. Cross-reference
  const relations = computeRelations(natal, quiz, gcbSignal);

  // 3. Generate narratives
  const narratives = generateNarratives(natal, quiz, gcbSignal, relations, lang);

  // 4. Assemble
  return {
    subsignals: {
      natal,
      quiz,
      generational_context: gcbSignal,
    },
    relations,
    narratives,
    metadata: {
      dimension_space: '5d_heuristic_v1',
      weights_mode: 'experimental_v1',
      evidence_mode: gcbRaw.evidence_mode,
      computed_at: new Date().toISOString(),
    },
  };
}
```

**Step 5: Run test to verify it passes**

Run: `npx vitest run src/__tests__/master-signal/master-signal-builder.test.ts`
Expected: PASS

**Step 6: Update barrel, commit**

```bash
git add src/lib/master-signal/narratives.ts src/lib/master-signal/master-signal-builder.ts src/__tests__/master-signal/master-signal-builder.test.ts src/lib/master-signal/index.ts
git commit -m "feat(master-signal): add narrative layer and master signal builder"
```

---

## Task 7: Ring Projection Contract + Hook Integration

**Files:**
- Create: `src/lib/master-signal/ring-projection.ts`
- Create: `src/__tests__/master-signal/ring-projection.test.ts`
- Modify: `src/hooks/useFusionRing.ts` (add masterSignal computation)
- Modify: `src/contexts/FusionRingContext.tsx` (expose masterSignal)

**Step 1: Write ring-projection test**

Create `src/__tests__/master-signal/ring-projection.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { projectToRing } from '@/src/lib/master-signal/ring-projection';
import type { MasterSignal } from '@/src/lib/master-signal/types';

function makeMockMasterSignal(): MasterSignal {
  return {
    subsignals: {
      natal: {
        signal_type: 'natal',
        dimensions: { passion: 0.7, stability: 0.3, future: 0.5, connection: 0.6, autonomy: 0.4 },
        projection_mode: 'heuristic_v1',
        coverage: 1,
      },
      quiz: {
        signal_type: 'quiz',
        dimensions: { passion: 0.6, stability: 0.4, future: 0.6, connection: 0.5, autonomy: 0.5 },
        projection_mode: 'heuristic_v1',
        coverage: 0.5,
      },
      generational_context: {
        signal_type: 'generational_context',
        dimensions: { passion: 0.5, stability: 0.5, future: 0.5, connection: 0.5, autonomy: 0.5 },
        projection_mode: 'heuristic_v1',
        coverage: 1,
      },
    },
    relations: {
      alignment_nq: 0.85,
      alignment_ng: 0.70,
      alignment_qg: 0.75,
      internal_coherence: 0.85,
      context_fit: 0.725,
      overall_integration: 0.79,
    },
    narratives: {
      core_summary: 'test',
      context_summary: 'test',
      integration_summary: 'test',
    },
    metadata: {
      dimension_space: '5d_heuristic_v1',
      weights_mode: 'experimental_v1',
      evidence_mode: 'heuristic_v1',
      computed_at: new Date().toISOString(),
    },
  };
}

describe('projectToRing', () => {
  it('produces 12-sector modulation array', () => {
    const result = projectToRing(makeMockMasterSignal());
    expect(result.sector_modulation).toHaveLength(12);
    expect(result.sector_modulation.every(v => typeof v === 'number')).toBe(true);
  });

  it('sector_sources has 12 entries', () => {
    const result = projectToRing(makeMockMasterSignal());
    expect(result.sector_sources).toHaveLength(12);
    expect(result.sector_sources.every(s => s.dominant_dimension && typeof s.weight === 'number')).toBe(true);
  });

  it('signal_strength is in 0..1 range', () => {
    const result = projectToRing(makeMockMasterSignal());
    expect(result.signal_strength).toBeGreaterThanOrEqual(0);
    expect(result.signal_strength).toBeLessThanOrEqual(1);
  });

  it('source is master_signal_v1', () => {
    const result = projectToRing(makeMockMasterSignal());
    expect(result.source).toBe('master_signal_v1');
  });
});
```

**Step 2: Write ring-projection**

Create `src/lib/master-signal/ring-projection.ts`:

```typescript
import type { MasterSignal, RingProjectionInput, DimensionKey } from './types';
import { DIMENSION_KEYS } from './dimensions';

/**
 * Fusion Ring Projection — Master Signal 5D → 12-sector modulation
 *
 * Maps the 5D integrated signal into 12 zodiac sectors for later
 * ring visualization. This is a prepared output contract;
 * full UI integration is deferred.
 *
 * Sector ↔ Dimension affinity (heuristic_v1):
 *   0  Aries      → passion, autonomy
 *   1  Taurus     → stability, connection
 *   2  Gemini     → future, autonomy
 *   3  Cancer     → connection, stability
 *   4  Leo        → passion, autonomy
 *   5  Virgo      → stability, future
 *   6  Libra      → connection, future
 *   7  Scorpio    → passion, connection
 *   8  Sagittarius→ future, passion
 *   9  Capricorn  → stability, autonomy
 *   10 Aquarius   → autonomy, future
 *   11 Pisces     → connection, passion
 */

type SectorAffinity = { primary: DimensionKey; secondary: DimensionKey };

const SECTOR_AFFINITIES: SectorAffinity[] = [
  { primary: 'passion',    secondary: 'autonomy' },   // 0  Aries
  { primary: 'stability',  secondary: 'connection' },  // 1  Taurus
  { primary: 'future',     secondary: 'autonomy' },    // 2  Gemini
  { primary: 'connection', secondary: 'stability' },    // 3  Cancer
  { primary: 'passion',    secondary: 'autonomy' },     // 4  Leo
  { primary: 'stability',  secondary: 'future' },       // 5  Virgo
  { primary: 'connection', secondary: 'future' },       // 6  Libra
  { primary: 'passion',    secondary: 'connection' },    // 7  Scorpio
  { primary: 'future',     secondary: 'passion' },      // 8  Sagittarius
  { primary: 'stability',  secondary: 'autonomy' },     // 9  Capricorn
  { primary: 'autonomy',   secondary: 'future' },       // 10 Aquarius
  { primary: 'connection', secondary: 'passion' },      // 11 Pisces
];

const PRIMARY_WEIGHT = 0.65;
const SECONDARY_WEIGHT = 0.35;

export function projectToRing(masterSignal: MasterSignal): RingProjectionInput {
  // Blend natal and quiz signals (GCB is context, not direct ring input)
  const n = masterSignal.subsignals.natal.dimensions;
  const q = masterSignal.subsignals.quiz.dimensions;
  const nCoverage = masterSignal.subsignals.natal.coverage;
  const qCoverage = masterSignal.subsignals.quiz.coverage;

  // Weight by coverage
  const totalCoverage = nCoverage + qCoverage;
  const nWeight = totalCoverage > 0 ? nCoverage / totalCoverage : 0.5;
  const qWeight = totalCoverage > 0 ? qCoverage / totalCoverage : 0.5;

  const blended: Record<DimensionKey, number> = {
    passion: 0, stability: 0, future: 0, connection: 0, autonomy: 0,
  };
  for (const k of DIMENSION_KEYS) {
    blended[k] = n[k] * nWeight + q[k] * qWeight;
  }

  const sector_modulation: number[] = [];
  const sector_sources: Array<{ dominant_dimension: DimensionKey; weight: number }> = [];

  for (let s = 0; s < 12; s++) {
    const { primary, secondary } = SECTOR_AFFINITIES[s];
    const value = blended[primary] * PRIMARY_WEIGHT + blended[secondary] * SECONDARY_WEIGHT;
    sector_modulation.push(value);
    sector_sources.push({ dominant_dimension: primary, weight: value });
  }

  // Signal strength = overall_integration × average coverage
  const signal_strength = masterSignal.relations.overall_integration
    * ((nCoverage + qCoverage) / 2);

  return {
    sector_modulation,
    sector_sources,
    signal_strength: Math.max(0, Math.min(1, signal_strength)),
    source: 'master_signal_v1',
  };
}
```

**Step 3: Run ring-projection test**

Run: `npx vitest run src/__tests__/master-signal/ring-projection.test.ts`
Expected: PASS

**Step 4: Integrate into useFusionRing hook**

Modify `src/hooks/useFusionRing.ts` — add these imports at top:

```typescript
import type { MasterSignal } from '@/src/lib/master-signal';
import { buildMasterSignal } from '@/src/lib/master-signal/master-signal-builder';
```

Add after the existing `signal` computation (after line ~88):

```typescript
  // Master Signal V1 — parallel 5D analysis pipeline
  const masterSignal: MasterSignal | null = useMemo(() => {
    if (!apiResults) return null;
    // Extract birth year from BAFE data or default
    // Birth year comes from the BaZi year pillar animal/branch context
    // For now, we pass it as a parameter from the parent
    return null; // Will be connected when birthYear is available in context
  }, [apiResults, events]);
```

Note: Full hook integration requires `birthYear` to be threaded from `BirthForm` through context. This is a **wiring task** for a future iteration — the core engine is self-contained and testable now.

Update the return:

```typescript
  return {
    signal,
    masterSignal,
    events,
    addQuizResult,
    completedModules,
    eventsLoaded,
  };
```

**Step 5: Update FusionRingContext**

Modify `src/contexts/FusionRingContext.tsx` — add `masterSignal` to context value type and provider.

**Step 6: Update barrel exports**

Final `src/lib/master-signal/index.ts`:

```typescript
export * from './types';
export * from './dimensions';
export { buildGCB } from './gcb-builder';
export { projectNatal } from './natal-projection';
export { projectQuiz } from './quiz-projection';
export { computeRelations } from './cross-reference';
export { buildMasterSignal } from './master-signal-builder';
export { generateNarratives } from './narratives';
export { projectToRing } from './ring-projection';
```

**Step 7: Run full lint + all tests**

Run: `npm run lint && npx vitest run src/__tests__/master-signal/`
Expected: 0 lint errors, all master-signal tests pass

**Step 8: Commit**

```bash
git add src/lib/master-signal/ src/__tests__/master-signal/ src/hooks/useFusionRing.ts src/contexts/FusionRingContext.tsx
git commit -m "feat(master-signal): add ring projection contract and hook integration scaffold"
```

---

## Acceptance Criteria Checklist

| # | Criterion | Task |
|---|-----------|------|
| 1 | Natal, Quiz, GCB as separate signal sources | Tasks 2-4 |
| 2 | GCB not astrologically computed | Task 2 (only birth_year → age/cohort/stage) |
| 3 | All three in same 5D space | Tasks 1-4 (DimensionVector type) |
| 4 | 5D space marked heuristic_v1 | Task 1 (ProjectionMode type), all projections |
| 5 | generation_label communication only | Task 2 (baseline_explanation, not in compute) |
| 6 | evidence_mode mandatory in contract | Task 1 (MasterSignal.metadata.evidence_mode) |
| 7 | Relation scores N↔Q, N↔G, Q↔G | Task 5 (cross-reference.ts) |
| 8 | core_summary no absolute identity claim | Task 6 (narrative rules + test assertion) |
| 9 | Weights marked experimental_v1 | Task 1 (WeightsMode type), Task 5, Task 6 |
| 10 | Ring projection output exists | Task 7 (ring-projection.ts) |

---

## Open Design Decisions (documented as heuristic_v1)

1. **Natal → 5D mapping**: Element-based affinity table (ELEMENT_DIMENSION_MAP in natal-projection.ts). Heuristic, not empirical.
2. **Quiz → 5D mapping**: Domain-based affinity table (DOMAIN_DIMENSION_MAP in quiz-projection.ts). Heuristic, not empirical.
3. **overall_integration formula**: `0.50·NQ + 0.25·NG + 0.25·QG` — ensures GCB doesn't dominate.
4. **GCB influence cap**: GCB only enters via context_fit and the G-alignment scores. It does NOT directly blend into the composite signal.
5. **evidence_mode output rules**: Currently all heuristic_v1. When empirical data is available, narratives should switch phrasing.
