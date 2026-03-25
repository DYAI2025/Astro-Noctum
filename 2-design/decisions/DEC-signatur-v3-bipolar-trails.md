# DEC-signatur-v3-bipolar-trails: Bipolar Trail Engine replaces particle-based spirograph

**Status**: Active (Prototype)

**Category**: Architecture

**Scope**: frontend

**Source**: [`DEC-dissonance-model`](DEC-dissonance-model.md)

**Last updated**: 2026-03-25

## Context

V2 Signatur Engine generates ~28K static particles along pre-computed spirograph curves, re-generated on each input change. This produces beautiful results but has fundamental limitations:

1. **No continuous movement** — the signature is a snapshot, not a living system. Particles don't move; they're placed.
2. **Decorative animation** — any motion is visual sugar, not information-bearing. The user can't "read" the movement.
3. **Dissonance is invisible** — the V2 engine has no mechanism to show tension between natal and quiz data visually.
4. **Heavy computation** — 28K particles regenerated on each change is expensive and causes frame drops.

The cymatics design principle demands: the movement IS the information. The form should emerge from behavior, not be pre-computed.

## Decision

Replace the particle-based spirograph with a **bipolar trail system** where 12 poles (6 dimension pairs) move continuously and their accumulated trails form the signature.

### Core Architecture

**6 Dimensions → 12 Poles**

Each quiz dimension splits into two opposing poles. The poles are placed 180° apart on the circle, at 60° intervals between dimensions (matching zodiac sector spacing).

| Dimension | Pole A | Pole B | Base Angle | Frequency |
|-----------|--------|--------|------------|-----------|
| Assertion | Durchsetzung | Hingabe | 0° | Mars 144.72 Hz |
| Empathy | Einfühlung | Abgrenzung | 60° | Moon 210.42 Hz |
| Creativity | Schöpfung | Struktur | 120° | Sun 126.22 Hz |
| Logic | Analyse | Synthese | 180° | Mercury 141.27 Hz |
| Intuition | Ahnung | Evidenz | 240° | Jupiter 183.58 Hz |
| Discipline | Ordnung | Freiheit | 300° | Saturn 147.85 Hz |

### Movement Law

Pole movement encodes dissonance state:

**Consonant (quiz ≈ natal):** Both poles orbit symmetrically around center. Clean, circular paths. Trails overlap → form densifies, becomes "more itself."

**Dissonant (quiz ≠ natal):** Poles move counter-directionally through center. Lissajous-like crossings. Trails diverge → form opens up, shows tension, new geometry integrates.

The transition between modes is **continuous** — there is no switch, only a gradient from harmony to tension. This is achieved by blending between symmetric orbit and Lissajous patterns using the per-dimension dissonance value.

### Trail = Signature

The accumulated trails ARE the signature. Where most traces overlap → densest/brightest regions → the form. This is the cymatics principle: the structure emerges from the movement, not from static placement.

**Rendering:** Canvas 2D with additive blending (`globalCompositeOperation: 'lighter'`). Overlapping trails from different poles create emergent brightness patterns. Semi-transparent frame clear creates natural trail fade.

### Advantages over V2

| Aspect | V2 (Particles) | V3 (Bipolar Trails) |
|--------|----------------|---------------------|
| Computation | 28K particles regenerated | 12 moving points, incremental |
| Motion | Decorative | Information-bearing |
| Dissonance | Not visible | Core visual mechanic |
| Performance | Heavy per change | Lightweight per frame |
| Coherence | Form is snapshot | Form is emergent process |
| User experience | Static beauty | Living, always interesting |

### Relation to Dissonance Model (DEC-dissonance-model)

The three dissonance layers map to visual parameters:

- **d_natal** → Movement mode blend (symmetric vs. Lissajous)
- **d_accumulated** → Trail persistence and density (Phase 2)
- **d_elemental** → Vibration texture (Sheng=slow organic pulse, Ke=fast angular vibration)

### Input Vector

Same 13D input as V2:
- 7 Natal Weights → mapped to 6 dimensions via existing `quizSectorsToQuizWeights()` bridge
- 6 Quiz Dimensions → directly drive pole behavior

The `computeWeights()` function remains unchanged. V3 consumes the same data, renders it differently.

## Enforcement

### Trigger conditions

- **Design phase**: when planning signature visual behavior or animation
- **Code phase**: when working in `src/components/signatur-v3/`
- **Integration phase**: when connecting V3 canvas to existing quiz/transit pipelines

### Required patterns

- Poles always come in pairs (A/B). No dimension may have only one pole.
- Movement mode is always a continuous blend, never a binary switch.
- Trail rendering uses additive blending — overlapping trails MUST accumulate brightness.
- Pole speeds derive from Cousto frequencies — each dimension has its own tempo.
- The center is a visual singularity (dark void with subtle halo).

### Required checks

1. All 12 poles are initialized and moving
2. Trail accumulation produces visible form within 5 seconds of animation
3. Switching from consonant to dissonant preset produces visually distinct behavior
4. No frame drops below 30fps on mobile devices
5. Pole positions are deterministic given the same input vector

### Prohibited patterns

- Pre-computing trail geometry — trails must be drawn live by pole movement
- Using non-additive blending for trail rendering
- Static poles (poles must always be in motion, even if slowly)
- Random/noise-based movement — all motion must derive from input parameters
