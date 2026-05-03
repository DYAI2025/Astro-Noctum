# Bazodiac Engine — Architecture v1.1
## Master Signal · GCB · Cross-Reference · Projection Modules

---

## Signal Architecture

```
                    ┌─────────────────────────────────────┐
                    │         MASTER SIGNAL ENGINE        │
                    │                                     │
  Birth Date ──────►│  Natal Signal (N)    weight: 0.35  │
  + FuFirE          │  Western + Bazi + WuXing → 5D vec  │
                    │                                     │
  Quiz Answers ────►│  Quiz Signal (Q)     weight: 0.30  │
  + QuizzMe v3.0   │  cluster_scores → 5D vec            │
                    │                                     │
  Birth Date ──────►│  GCB (G)             weight: 0.20  │
  (year only)       │  Cohort + LifeStage → 5D vec       │
                    │  evidence_mode: heuristic_v1        │
                    │                                     │
                    │  ──────────────────────────────     │
                    │  Cross-Reference Engine             │
                    │    alignment(N,Q) → coherence       │
                    │    alignment(N,G) → individuation   │
                    │    alignment(Q,G) → context-fit     │
                    │  alignment_boost:     0.15          │
                    │                                     │
                    │  ──────────────────────────────     │
                    │  Master Vector (normalized 5D)      │
                    │  Narratives: core / context / int.  │
                    └─────────────────────────────────────┘
```

---

## Two-Layer Signal Model

Bazodiac operates with two complementary signal formulas:

### Layer 1: Permanent Signal (Backend)
```
Master = 0.35·N + 0.30·Q + 0.20·G + 0.15·alignment_boost
```
Fuses **signal sources** (Natal/Quiz/GCB). Time-independent.
Used for: Horoscopes, Narratives, Cross-Reference, GCB-Tagging.

### Layer 2: Transient Signal (Frontend)
```
S = 0.27·W + 0.27·B + 0.18·X + 0.18·T + 0.10·C
```
Fuses **data types** (Western/BaZi/WuXing/Transit/Conversation). Real-time.
Used for: Fusion Ring 3D rendering, transit overlay, particle effects.

See `docs/formula-decision.md` for full rationale.

---

## Shared Dimension Space

All three signals map to the same 5 cluster dimensions:

| Dimension    | Description |
|--------------|-------------|
| `passion`    | Expressivity, desire, initiative, energy |
| `stability`  | Continuity, grounding, reliability, structure |
| `future`     | Growth orientation, vision, possibility |
| `connection` | Relational depth, intimacy, belonging |
| `autonomy`   | Self-direction, independence, individuation |

Vectors are always normalized (sum = 1.0).

---

## GCB — Generational Context Baseline

### What it is
A contextual background signal derived from birth year and current age.
It represents the **shared generational frame** a person developed within —
not their individual personality, not a second natal derivation.

### What it is NOT
- Not a personality assessment
- Not a second natal computation
- Not an empirically validated statistical model
- Never to be presented as "your true personality"

### Derivation logic
```
birth_year → generation_label (Gen Z / Millennial / Gen X / Boomer / Silent)
birth_year → cohort_5y (e.g. "1990–1994")
birth_year → cohort_10y (e.g. "1990–1999")
age        → life_stage (young_adult / emerging_adult / mid_adult / mature_adult / senior)

baseline_vector = generation.baseline_weights × life_stage.modifier
baseline_vector = normalize(baseline_vector)
```

### Evidence mode
All V1 GCB outputs carry `evidence_mode: "heuristic_v1"`.
This must be visible in any UI/API output that exposes GCB data.

Mapping basis: sociological generational research (Howe/Strauss, Pew Research Center).
No claim of statistical validity or universality.

### Generations covered

| Label | Birth Years | Dominant context |
|-------|-------------|-----------------|
| Silent Generation | 1928–1945 | Scarcity → stability as highest value |
| Baby Boomer | 1946–1964 | Post-war optimism → structured life paths |
| Gen X | 1965–1980 | Self-reliance → autonomy as earned value |
| Millennial | 1981–1996 | Analog/digital transition → meaning + balance |
| Gen Z | 1997–2012 | Digital native under uncertainty → authenticity |
| Gen Alpha | 2013–2028 | Fully networked → identity formation in progress |

---

## Cross-Reference Engine

The cross-reference engine is **not** a fourth additive signal.
It is the **fusion mechanism** that determines how the three signals combine.

### Alignment scores
```
alignment(N, Q) — cosine similarity: birth chart vs. self-report
alignment(N, G) — cosine similarity: birth chart vs. generational context
alignment(Q, G) — cosine similarity: self-report vs. generational context
```

Range: 0.0 (orthogonal) to 1.0 (identical)

| Score | Label |
|-------|-------|
| ≥ 0.85 | `high_alignment` |
| ≥ 0.65 | `moderate_alignment` |
| ≥ 0.45 | `partial_alignment` |
| < 0.45 | `divergent` |

### Aggregate scores

**coherence_score** = mean(N↔Q, N↔G, Q↔G)
Measures overall consistency across all three signals.

**individuation_score** = L2_distance(mean(N,Q), G) / √2
Measures how much the individual signals (N+Q together) deviate from the generational context.

| Individuation | Interpretation |
|---------------|----------------|
| ≥ 0.60 | `strongly individual` — clear departure from generational norm |
| ≥ 0.30 | `distinctly personal` — notable individual character |
| < 0.30 | `generationally resonant` — close to cohort context |

### Alignment boost distribution
The `alignment_boost` (0.15) is distributed between N and Q:
- High N↔Q alignment (≥ 0.75): boost split 50/50
- Low N↔Q alignment: boost weighted toward whichever signal aligns better with G

---

## Fusion Weights

| Signal | Default Weight | Notes |
|--------|---------------|-------|
| Natal (N) | 0.35 | Individual birth core — highest weight |
| Quiz (Q) | 0.30 | Current self-report |
| GCB (G) | 0.20 | Generational context |
| Alignment boost | 0.15 | Redistributed between N and Q |

**Total: 1.00**

Weights are configurable via `FusionWeights` dataclass.

---

## Narrative Outputs

| Output | Source | Description |
|--------|--------|-------------|
| `core_summary` | N + Q | Who this person fundamentally is |
| `context_summary` | G | The generational frame they grew up in |
| `integration_summary` | N + Q + G + alignment | How individual story fits generational context |

All narratives are bilingual (de-DE, en-US).
context_summary always includes `[evidence_mode: heuristic_v1]`.

---

## Projection Modules

### Implementation Status

All three projection modules are implemented in **TypeScript** (frontend) with full test coverage.
Python backend equivalents exist for the engine core but defer projection to the frontend.

| Module | TypeScript (Frontend) | Python (Backend) | Status |
|--------|----------------------|-------------------|--------|
| Natal Projection | `src/lib/master-signal/natal-projection.ts` | — (deferred) | ✅ Implemented |
| Quiz Projection | `src/lib/master-signal/quiz-projection.ts` | — (deferred) | ✅ Implemented |
| Ring Projection | `src/lib/master-signal/ring-projection.ts` | — (deferred) | ✅ Implemented |

### Natal Projection (`natal-projection.ts`)
Maps BAFE API data → 5D dimension vector.
- Western chart: Sun (50%), Moon (30%), Ascendant (20%) via element affinity
- BaZi: Four pillars weighted (Day 40%, Year 25%, Month 20%, Hour 15%)
- WuXing: Element ratio → dimension mapping
- Output: `ProjectedSignal { dimensions: DimensionVector, coverage: 0–1 }`

### Quiz Projection (`quiz-projection.ts`)
Maps ContributionEvents from QuizzMe → 5D dimension vector.
- 17 domain mappings (love, emotion, eq, social, leadership, etc.)
- Weighted by marker confidence
- Output: `ProjectedSignal { dimensions: DimensionVector, coverage: 0–1 }`

### Ring Projection (`ring-projection.ts`)
Maps MasterSignal 5D → 12 zodiac sector modulation values.
- `SECTOR_AFFINITIES[]`: Primary + Secondary dimension per sector
- Weights: Primary 65%, Secondary 35%
- Output: `RingProjectionInput { sector_modulation: number[12] }`

---

## Data Flow (complete)

```
birth_date, birth_location
    │
    ▼
BAFE API (via server.mjs proxy)
  /calculate/western → Western chart
  /calculate/bazi    → BaZi Four Pillars
  /calculate/wuxing  → WuXing vector
    │
    ▼ natal-projection.ts ✅
NatalSignalInput.vector [5D, normalized]

quiz_answers
    │
    ▼
QuizzMe Engine → ContributionEvents
    │
    ▼ quiz-projection.ts ✅
QuizSignalInput.vector [5D, normalized]

birth_year
    │
    ▼
gcb-builder.ts / gcb_engine.py ✅
GCBModel.baseline_vector [5D, normalized]

NatalSignalInput + QuizSignalInput + GCBModel
    │
    ▼
buildMasterSignal() / compute_master_signal() ✅
    ├── computeRelations() → RelationScores
    ├── fuse_signals() → master_vector [5D]
    └── generateNarratives() → Narratives
    │
    ▼ ring-projection.ts ✅
MasterSignal → Fusion Ring S0–S11 sector_modulation[12]
    │
    ▼
FusionRingProfile → compileProfile() → DeformationChannels
    │
    ▼
Three.js Fusion Ring 3D Renderer (28k particles, 8 effects, GLSL shaders)
```

---

## Horoscope Pipeline

```
                     ┌──────────────────────────────────┐
                     │     TAGESHOROSKOP PIPELINE       │
                     │                                  │
  FuFirE Transit ───►│  1. Transit-Daten holen          │
  /transit/state     │     → sector_intensity[12]       │
                     │     → events[]                   │
                     │                                  │
  User Profil ──────►│  2. Personalisieren               │
  (MasterSignal)     │     → Transit × master_vector    │
                     │     → Impact pro Sektor          │
                     │                                  │
                     │  3. Horoskop generieren           │
                     │     a) Template-Layer (schnell)   │
                     │     b) LLM-Layer (Premium, async) │
                     │                                  │
                     │  4. Output                        │
                     │     → headline (1 Satz)           │
                     │     → body (3–5 Sätze)            │
                     │     → advice (1 Satz)             │
                     │     → ring_effects[] (optional)   │
                     └──────────────────────────────────┘
```

---

## Files

```
bazodiac_engine/
├── gcb_engine.py          GCB derivation: cohorts, life stages, baseline vector
├── master_signal.py       Cross-reference, fusion, narrative, MasterSignal
├── test_engine.py         End-to-end smoke tests (no external dependencies)
└── ARCHITECTURE.md        This document

src/lib/master-signal/     TypeScript signal pipeline (frontend mirror)
├── types.ts               Shared type definitions
├── dimensions.ts          5D dimension utilities (cosine sim, blend, normalize)
├── natal-projection.ts    BAFE → 5D (implemented)
├── quiz-projection.ts     ContributionEvents → 5D (implemented)
├── ring-projection.ts     MasterSignal → 12 sectors (implemented)
├── gcb-builder.ts         GCB in TypeScript
├── cross-reference.ts     Alignment/Coherence/Individuation
├── narratives.ts          Bilingual narrative generation
├── master-signal-builder.ts  Full pipeline: apiData + quizEvents + birthYear → MasterSignal
└── index.ts               Public exports

src/__tests__/master-signal/  Unit tests for all modules (6 test files)

docs/formula-decision.md   Two-layer formula rationale
```

---

*Bazodiac Engine v1.1 · März 2026*
