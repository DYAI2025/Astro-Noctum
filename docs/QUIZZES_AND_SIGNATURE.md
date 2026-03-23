# Quizzes Mapping Logic & Signature Mechanics

> Technical documentation of the quiz-to-ring data pipeline and the V2 Signatur spirograph engine.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Quiz System](#quiz-system)
   - [Quiz Definitions & Scoring](#quiz-definitions--scoring)
   - [Cluster Registry](#cluster-registry)
   - [Quiz Overlay Router](#quiz-overlay-router)
3. [Mapping Pipeline: Quiz → Sector Signals](#mapping-pipeline-quiz--sector-signals)
   - [ContributionEvent](#contributionevent)
   - [Quiz-to-Event Converters](#quiz-to-event-converters)
   - [AFFINITY_MAP](#affinity_map)
   - [eventToSectorSignals()](#eventtosectorsignals)
   - [Cluster Completion Gate](#cluster-completion-gate)
   - [Fire-and-Forget Persistence](#fire-and-forget-persistence)
4. [Signatur (Fusion Ring) V2 Engine](#signatur-fusion-ring-v2-engine)
   - [Bridge: Sectors → Planet Weights](#bridge-sectors--planet-weights)
   - [computeWeights(): Natal × Quiz Blend](#computeweights-natal--quiz-blend)
   - [Spirograph Geometry](#spirograph-geometry)
   - [Particle Generation (4-Tier System)](#particle-generation-4-tier-system)
   - [Emergence & Bridges](#emergence--bridges)
   - [Kaleidoscope Folding](#kaleidoscope-folding)
5. [Transit Signal Pipeline](#transit-signal-pipeline)
6. [Legacy Signal Engine (V1)](#legacy-signal-engine-v1)
7. [Data Flow Diagrams](#data-flow-diagrams)

---

## System Overview

```
User completes quiz
      │
      ▼
Quiz Component → quiz-to-event converter → ContributionEvent
      │
      ▼
useQuizContribution hook
  ├── eventToSectorSignals() → 12-sector weights via AFFINITY_MAP
  ├── Cluster completion gate check
  └── POST /api/contribute → Supabase contribution_events
      │
      ▼
useFusionSignal polls /api/transit-state/:userId
  └── Server loads soulprint + contributions → POST FuFirE → transit state
      │
      ▼
soulprintToNatalWeights() → 7 planet weights
quizSectorsToQuizWeights() → 6 quiz dimensions
      │
      ▼
bazodiac-engine.ts → computeWeights() → generateSignature()
      │
      ▼
FusionRingCanvasV2 renders ~28K spirograph particles
```

---

## Quiz System

### Quiz Definitions & Scoring

All quiz definitions live in `packages/shared/src/quizzes/definitions/` and follow the `QuizDefinition` schema from `packages/shared/src/quizzes/schema.ts`.

**Scoring models:**

| Model | Mechanism | Used by |
|-------|-----------|---------|
| `multi-dimension` | Accumulates scores across named dimensions; matches profiles by threshold rules | Love Languages, Personality, Career DNA, EQ, etc. |
| `profile-driven` | Each option votes for a profile; most votes wins | Kinky series, Partner Match series |
| `categorical` | Assigns categories based on score ranges | Some personality quizzes |

**Universal scoring** is handled by `scoreQuiz()` in `packages/shared/src/quizzes/scoring.ts`:

```typescript
scoreQuiz(quiz: QuizDefinition, answers: Record<string, string>): QuizResult
// Routes to scoreDimensional() or scoreProfileDriven() based on quiz.scoringModel
```

**Props contract** — every quiz component accepts:

```typescript
interface QuizProps {
  onComplete: (event: ContributionEvent) => void;
  onClose: () => void;
}
```

### Cluster Registry

**File:** `src/lib/fusion-ring/clusters.ts`

23 quizzes organized into 6 clusters:

| Cluster | Icon | Color | Quizzes (module IDs) |
|---------|------|-------|---------------------|
| **Naturkind** | 🌿 | #2D5A4C | `aura_colors`, `krafttier`, `blumenwesen`, `energiestein` |
| **Mentalist** | 🔮 | #4A0E4E | `love_languages`, `charme`, `eq` |
| **Stratege** | ♟ | #1A3A5C | `personality`, `career_dna`, `social_role`, `spotlight` |
| **Mystiker** | 🌀 | #5C1A4A | `destiny`, `rpg_identity`, `party_need`, `celebrity_soulmate` |
| **Kinky** | 🔥 | #8B1A1A | `kinky_01`–`kinky_04` *(premium, series)* |
| **Partner Match** | 💞 | #9B3A6A | `partner_match_01`–`partner_match_03`, `partner_convo` |

Helper functions:
- `findClusterForModule(moduleId)` — lookup cluster for a quiz
- `isClusterComplete(cluster, completedModuleIds)` — true when ALL quizzes done
- `clusterProgress(cluster, completedModuleIds)` — 0–1 ratio

### Quiz Overlay Router

**File:** `src/components/QuizOverlay.tsx`

`QuizOverlay` is the master router that maps quiz IDs to lazy-loaded React components via `QUIZ_MAP`. Mounted on FuRingPage, controlled by `activeQuiz` state from `ClusterSidebar`.

All 23 components are lazy-loaded with `React.lazy()` inside `<Suspense>` with a `QuizLoadingFallback`. Error boundaries catch render failures.

---

## Mapping Pipeline: Quiz → Sector Signals

### ContributionEvent

**File:** `src/lib/lme/types.ts`

The universal event format emitted by all quizzes:

```typescript
type ContributionEvent = {
  specVersion: 'sp.contribution.v1';
  eventId: string;
  occurredAt: string;                    // ISO timestamp
  source: {
    vertical: 'quiz';
    moduleId: string;                    // e.g. 'quiz.love_languages.v1'
  };
  payload: {
    markers: Marker[];                   // Semantic signals
    tags?: Tag[];                        // Archetype/style labels
    summary?: { title?; bullets?; };
  };
};

type Marker = {
  id: string;                            // marker.{domain}.{keyword}
  weight: number;                        // 0–1
  evidence?: { confidence?: number; };
};
```

### Quiz-to-Event Converters

**File:** `src/lib/fusion-ring/quiz-to-event.ts`

18+ specialized converter functions, one per quiz type. Each maps quiz results to semantic `Marker`s:

| Quiz | Converter | Example Markers |
|------|-----------|-----------------|
| Love Languages | `loveLangToEvent(scores, profileId)` | `marker.love.physical_touch`, `marker.love.expression` |
| Krafttier | `krafttierToEvent(animalId)` | `marker.social.pack_loyalty`, `marker.instinct.primal_sense` |
| Personality | `personalityToEvent(scores)` | `marker.social.openness`, `marker.values.achievement` |
| Kinky series | `kinkySeriesQuizToEvent(...)` | Dynamic from `clusterDomainMap` + `clusterKeywordMap` |
| Conversation | `conversationAnalysisToEvent(...)` | AI-extracted markers from both partners |

**Naming convention:** `marker.{domain}.{keyword}` where:
- **domain** = broad category (love, social, instinct, cognition, leadership, freedom, spiritual, eq, values)
- **keyword** = specific trait (physical_touch, pack_loyalty, analytical, etc.)

### AFFINITY_MAP

**File:** `src/lib/fusion-ring/affinity-map.ts`

The core lookup table mapping 80+ marker keywords to 12-element zodiac-sector weight vectors:

```
Sector indices: [Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces]
                 [  0  ,   1   ,   2   ,   3  ,  4 ,   5  ,   6  ,    7   ,      8      ,     9    ,    10   ,   11  ]
```

**Two resolution levels:**

1. **Keyword-level** (precise):
   ```
   'physical_touch': [0, .2, 0, 0, 0, 0, 0, .6, 0, 0, 0, .2]  → Scorpio-dominant
   'analytical':     [0, 0, .3, 0, 0, .5, 0, 0, .1, .1, 0, 0]  → Virgo-dominant
   'gut_feeling':    [.1, 0, 0, 0, 0, 0, 0, .2, 0, 0, 0, .7]   → Pisces-dominant
   ```

2. **Domain-level** (fallback):
   ```
   'love':      [0, .1, 0, .3, 0, 0, .3, .3, 0, 0, 0, 0]       → Cancer/Libra/Scorpio
   'cognition': [0, 0, .4, 0, 0, .3, 0, 0, .2, .1, 0, 0]        → Gemini/Virgo
   'spiritual': [0, 0, 0, 0, 0, 0, 0, .2, .2, 0, 0, .6]          → Pisces-dominant
   ```

`TAG_AFFINITY` provides a separate table for archetype tags (guardian, flame, healer, trickster, warrior).

### eventToSectorSignals()

**File:** `src/lib/fusion-ring/test-signal.ts`

Converts a `ContributionEvent` to a 12-element signal vector:

```
1. For each Marker:
   a. Parse ID → extract domain + keyword
   b. Lookup keyword in AFFINITY_MAP (precise)
   c. Fallback: lookup domain in AFFINITY_MAP (general)
   d. Multiply affinity vector by marker.weight
   e. Sum into 12-sector accumulator

2. For each Tag:
   a. Look up archetype in TAG_AFFINITY
   b. Multiply by tag.weight (default 0.5)
   c. Add to accumulator

3. Normalize: divide all sectors by max(|sectors|)
   → Result: [-1, 1]^12
```

### Cluster Completion Gate

**File:** `src/hooks/useQuizContribution.ts`

The gate prevents persistence until ALL quizzes in a cluster are complete:

```typescript
// Step 1: Convert event → sector weights
const sectorWeights = eventToSectorSignals(event);

// Step 2: Normalize [-1,1] → [0,1] for API
const normalized = sectorWeights.map(s => (s + 1) / 2);

// Step 3: Check cluster gate
const cluster = findClusterForModule(moduleId);
if (cluster) {
  const updated = new Set(completedModuleIds);
  updated.add(moduleId);
  if (!isClusterComplete(cluster, updated)) return; // ← GATE: skip POST
}

// Step 4: Fire-and-forget POST
void contributeQuizResult(moduleId, normalized, 0.75);
```

**Example:** If a user completes 3 of 4 Naturkind quizzes, none are persisted. When the 4th completes, the gate opens and the contribution is persisted.

### Fire-and-Forget Persistence

**Client:** `src/services/contribute.ts`
- Gets Supabase JWT, POSTs to `/api/contribute`
- Never throws — logs errors silently

**Server:** `server.mjs` `/api/contribute`
- Validates JWT, validates `sector_weights` (exactly 12 numbers in [0,1])
- UPSERTs to `contribution_events` on `(user_id, module_id)` — one row per quiz per user

---

## Signatur (Fusion Ring) V2 Engine

### Bridge: Sectors → Planet Weights

**File:** `src/components/fusion-ring-website/signatur-bridge.ts`

#### soulprintToNatalWeights()

Converts 12-sector soulprint array to 7 planet weights using natural zodiac rulerships:

```
Sun     ← Leo (sector 4)
Moon    ← Cancer (sector 3)
Mercury ← avg(Gemini[2], Virgo[5])
Venus   ← avg(Taurus[1], Libra[6])
Mars    ← avg(Aries[0], Scorpio[7])
Jupiter ← avg(Sagittarius[8], Pisces[11])
Saturn  ← avg(Capricorn[9], Aquarius[10])
```

Missing sectors default to 0.5. Output: 7 weights in [0, 1].

#### quizSectorsToQuizWeights()

Maps 12-sector quiz data to 6 semantic dimensions:

```
assertion   ← Aries (sector 0)
empathy     ← Cancer (sector 3)
creativity  ← Leo (sector 4)
logic       ← Virgo (sector 5)
intuition   ← Sagittarius (sector 8)
discipline  ← Capricorn (sector 9)
```

Missing sectors default to 0.5. Output: 6 weights in [0, 1].

### computeWeights(): Natal × Quiz Blend

**File:** `src/components/fusion-ring-website/bazodiac-engine.ts` (lines 107–144)

Blends natal planet weights with quiz modulations via a [6×7] interaction matrix:

**Quiz Modulation Matrix:**

| Dimension | Sun | Moon | Mercury | Venus | Mars | Jupiter | Saturn |
|-----------|-----|------|---------|-------|------|---------|--------|
| assertion | +0.35 | -0.15 | +0.05 | -0.15 | **+0.45** | +0.10 | +0.10 |
| empathy | +0.05 | **+0.40** | +0.05 | +0.25 | -0.15 | +0.35 | -0.10 |
| logic | +0.05 | -0.15 | **+0.45** | -0.05 | +0.05 | +0.10 | +0.30 |
| creativity | +0.10 | +0.25 | +0.20 | **+0.40** | -0.05 | +0.15 | -0.20 |
| discipline | +0.10 | -0.10 | +0.05 | -0.10 | +0.30 | -0.05 | **+0.45** |
| intuition | +0.05 | **+0.45** | -0.10 | +0.15 | -0.10 | +0.30 | -0.15 |

**Algorithm:**
```
For each planet P:
  natal_weight = natal.get(P) ?? 0.5
  quiz_boost = Σ(quiz[dim] × MATRIX[dim][P_index])
  raw_weight = natal_weight × (1 + quiz_boost)            // multiplicative blend

Normalize: strongest planet = 1.0
  proportional = raw / max_raw
  final = clamp(proportional × 0.85 + proportional² × 0.15, 0.08, 1.0)
  // ^^ nonlinear boost — strong planets get stronger

Result: BazodiacWeights { weights: Map<7>, ranked: Planet[], dominant: Planet }
```

### Spirograph Geometry

**7 Planet Definitions** (Cousto Cosmic Octave frequencies):

| Planet | Hz | Color | Sign | Zodiac° |
|--------|----|-------|------|---------|
| Sun | 126.22 | #FFB81F | Leo | 120 |
| Moon | 210.42 | #AD8CFF | Cancer | 90 |
| Mercury | 141.27 | #33F2FF | Gemini | 60 |
| Venus | 221.23 | #FF66B8 | Taurus | 30 |
| Mars | 144.72 | #FF261F | Aries | 0 |
| Jupiter | 183.58 | #FFE000 | Sagittarius | 240 |
| Saturn | 147.85 | #6185B8 | Capricorn | 270 |

**Spirograph parameters** (derived from Hz):
```
t = logNormHz(hz)                    // Map Hz to [0, 1]
n = 3 + floor(lerp(0, 6, t))        // 3–9 lobes
kind = hypotrochoid | epitrochoid    // deterministic from hash
R = 1.0, r = R/n, d = lerp(0.25, 1.5, hash)
turns = lcm(n, 3)                    // Full curves before closing
```

**Curve equations:**
```
Hypotrochoid: x = (R-r)cos(t) + d·cos((R-r)/r · t)
              y = (R-r)sin(t) - d·sin((R-r)/r · t)

Epitrochoid:  x = (R+r)cos(t) - d·cos((R+r)/r · t)
              y = (R+r)sin(t) - d·sin((R+r)/r · t)
```

### Particle Generation (4-Tier System)

Each planet's weight determines its visual tier:

| Weight Range | Tier | Layers |
|-------------|------|--------|
| < 0.20 | 0 | Glow only |
| 0.20–0.49 | 1 | Glow + minimal curve |
| 0.50–0.74 | 2 | Glow + curve + fractal setup |
| ≥ 0.75 | 3 | Full fractal + subfractal + bridges |

**Glow layer** (~400 particles/planet):
- Core particles (35%): tight cluster at `maxR × 0.35`, radius 1.5–3px
- Cloud particles (65%): spread at `maxR × (0.6 + weight×1.5)`, radius 3–7px

**Curve layer** (~30–150 particles/planet):
- Anchored along the spirograph curve

**Fractal layer** (weight ≥ 0.75):
- Recursively placed at curve anchor points
- Depth: `(weight - 0.75) / 0.25` ∈ [0, 1]

**Subfractal layer** (high-weight planets):
- Secondary fractal with smaller particles

### Emergence & Bridges

When heavy planets (weight ≥ 0.75) are in proximity:

```
emergence = 0.6 × avgFractalDepth + 0.4 × maxFractalDepth
proximityThreshold = maxR × lerp(0.10, 0.45, emergence)
maxBridges = floor(lerp(3, 40, emergence²))

For each pair of heavy-planet anchors:
  if distance < proximityThreshold:
    strength = 1 - (distance / proximityThreshold)
    → Quadratic Bezier bridge particles with mixed colors
```

### Kaleidoscope Folding

```
kFolds = clamp(round(dominant_planet.petal_count), 2, 6)
// Mirrors all particles across kFolds rotational axes
// Budget: ~35K max particles, divided by kFolds×2
```

---

## Transit Signal Pipeline

**File:** `src/hooks/useFusionSignal.ts`

Polls `/api/transit-state/:userId` every 800ms with exponential backoff.

**Server computes transit state:**
1. Load user's `astro_profiles` (soulprint sectors)
2. Load `contribution_events` (quiz sector weights)
3. POST to FuFirE `/transit/state` → get ring sectors, transit intensity, 30-day averages

**Client processing per sector:**
```
rawTarget = 0.375×ring + 0.375×soulprint + 0.25×thirtyDayAvg + 0.2×transitIntensity
```

Post-processing:
1. `applyGaussSpread()` — Gaussian blur with opposition pull (-0.15 at +6 sectors)
2. `applyPowerCurve()` — sign-preserving `|signal|^1.5` for organic peaks
3. Clamp to [-1, 2]

**Output:** `FusionSignalData { targetSignals[12], baseSignals[12], thirtyDayAvg[12], transitIntensity }`

---

## Legacy Signal Engine (V1)

**File:** `packages/shared/src/fusion-ring/signal.ts`

`computeFusionSignal()` blends 4 astro layers into 12-sector signal:

**Adaptive weights:**
- With quiz data: Western 0.30, BaZi 0.30, WuXing 0.20, Quiz 0.20
- Without quiz: Western 0.375, BaZi 0.375, WuXing 0.25

**Processing:**
1. Weighted blend across all 4 layers
2. Opposition pull: `±0.15 × signal[opp_sector]`
3. Neighbor smoothing: blend adjacent sectors × 0.35
4. Peak detection: top 3 sectors

V1 canvas (`FusionRingWebsiteCanvas`) renders this as a 12→32 point deformation ring with `soulNoise()`.

---

## Data Flow Diagrams

### Quiz → Database

```
Quiz Component
  ↓ onComplete(event: ContributionEvent)
QuizOverlay
  ↓
useQuizContribution hook
  ├── eventToSectorSignals(event) → [-1,1]^12
  │     ├── marker.id → parse domain + keyword
  │     ├── AFFINITY_MAP[keyword] ?? AFFINITY_MAP[domain] ?? zeros
  │     └── multiply by marker.weight, sum all, normalize
  ├── normalize → [0,1]^12: (signal + 1) / 2
  ├── cluster gate: isClusterComplete()? → if NO: return
  └── contributeQuizResult() → POST /api/contribute
        ↓
  server.mjs: validate JWT + sector_weights
        ↓
  Supabase: UPSERT contribution_events (user_id, module_id)
```

### Database → Signatur Visualization

```
useFusionSignal polls /api/transit-state/:userId
  ↓
server.mjs loads:
  astro_profiles.soulprint_sectors [12]
  contribution_events[].payload.sector_weights [12] each
  ↓
POST to FuFirE /transit/state → ring[12], events[], 30day_avg[12], transit_intensity
  ↓
Client: applyGaussSpread + applyPowerCurve → targetSignals[12]
  ↓
signatur-bridge.ts:
  soulprintToNatalWeights(soulprint[12]) → natalWeights{7 planets}
  quizSectorsToQuizWeights(quiz[12]) → quizWeights{6 dimensions}
  ↓
bazodiac-engine.ts:
  computeWeights(natal, quiz) → BazodiacWeights
  generateSignature(natal, quiz, maxR=2.0, kaleidoscope=true)
  ↓
BazodiacSignature { particles: ~28K, weights, kFolds, emergence }
  ↓
FusionRingCanvasV2: Three.js render with bloom postprocessing
```

### Sector Constants

```
Index   Sign          German       Element    Opposition
─────────────────────────────────────────────────────────
 0      Aries         Widder       Wood       ↔ 6 (Libra)
 1      Taurus        Stier        Earth      ↔ 7 (Scorpio)
 2      Gemini        Zwillinge    Fire       ↔ 8 (Sagittarius)
 3      Cancer        Krebs        Fire       ↔ 9 (Capricorn)
 4      Leo           Löwe         Fire       ↔ 10 (Aquarius)
 5      Virgo         Jungfrau     Metal      ↔ 11 (Pisces)
 6      Libra         Waage        Metal      ↔ 0 (Aries)
 7      Scorpio       Skorpion     Water      ↔ 1 (Taurus)
 8      Sagittarius   Schütze      Water      ↔ 2 (Gemini)
 9      Capricorn     Steinbock    Water      ↔ 3 (Cancer)
10      Aquarius      Wassermann   Earth      ↔ 4 (Leo)
11      Pisces        Fische       Wood       ↔ 5 (Virgo)
```

---

*Last updated: 2026-03-22*
