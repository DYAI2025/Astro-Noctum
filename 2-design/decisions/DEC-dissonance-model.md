# DEC-dissonance-model: Layered Dissonance Model for Signature Modulation

**Status**: Active

**Category**: Architecture

**Scope**: system-wide

**Source**: n/a (foundational design decision from product vision)

**Last updated**: 2026-03-23

## Context

The Bazodiac Signatur is the visual representation of a user's "frequency" — a unique geometric structure generated from a 13-dimensional input vector (7 natal planet weights + 6 quiz dimensions). When quiz input aligns with the user's natal profile, the signature should become clearer and more defined ("more itself"). When quiz input contradicts the natal profile, visible tension must emerge — vibration, geometric stress, new structures integrating into the existing form.

Without a formal dissonance model, quiz modulation would be a flat multiplicative blend with no semantic distinction between consonant and dissonant changes. The signature would change, but the change would feel arbitrary rather than meaningful. The cymatics principle demands that every visual change is a coherent consequence of the input — like a Chladni figure shifting because the frequency changed, not because noise was added.

**Design metaphor**: Reverse-engineering a water drop shaped by a specific frequency. The geometric structure encodes the full symphony. The mapping must be coherent, recursive, self-referencing, and dynamically linear.

## Decision

Dissonance is measured as a **layered metric with three time-constants**, not a single scalar distance. The natal chart is the permanent baseline (Option A as foundation), but the full model integrates accumulated quiz history and elemental balance (Option D architecture).

### Three Dissonance Layers

**Layer 1 — Natal Baseline (permanent, immutable)**
The fundamental frequency. Derived from birth data via `soulprintToNatalWeights()`. This reference never shifts. A fire-dominant user remains fire-dominant regardless of quiz completion. Natal weights define the "natural resting state" of the signature.

**Layer 2 — Accumulated Quiz Profile (slowly shifting)**
With each completed quiz cluster, the user's "self-image" evolves. A user who has completed 15 quizzes consistently showing empathy patterns has established a new expectation baseline. New input is measured against both natal AND accumulated quiz history.

**Layer 3 — Wu-Xing Element Balance (structural)**
The deepest constraint layer. Elements define which tensions are resolvable and which remain structural. Sheng-cycle disruption (nurturing cycle broken) produces different tension than Ke-cycle activation (controlling cycle engaged). This layer determines the *quality* of dissonance, not just its magnitude.

### Dissonance Metrics

For each new quiz input, three values are computed:

- `d_natal` — Deviation of new quiz modulation from pure natal weights → "How far from your blueprint?"
- `d_accumulated` — Deviation from current total profile (natal + all previous quizzes) → "Does this surprise the signature?"
- `d_elemental` — Wu-Xing conflict score via Sheng/Ke cycles → "What *kind* of tension is this?"

### Visual Consequences

| d_natal | d_accumulated | Interpretation | Visual Effect |
|---------|---------------|----------------|---------------|
| High | Low | User has diverged from blueprint; new input confirms direction | Structure clarifies, deepens. Consonance on experience level. |
| Low | High | User was near blueprint; input contradicts quiz history | Acute vibration, but signature "knows" it fits natally. |
| High | High | Maximum dissonance — contradicts everything | New geometry must integrate. Visible stress, morphing. |
| Low | Low | Full consonance — aligns with everything | Signature becomes more defined, "more itself". |

`d_elemental` modulates the *texture* of tension: Sheng-dissonance feels different from Ke-dissonance.

### Visual Translation: Dissonance → Rendering

The cymatics principle dictates the mapping: in physical Chladni figures, frequency determines geometry, amplitude determines particle density, and overtones determine fine structure. Each dissonance layer maps to a specific visual parameter domain.

#### d_natal → Geometry (Structure)

Changing the fundamental frequency changes the base form. `d_natal` modulates Spirograph parameters:

| Parameter | Low d_natal (consonant) | High d_natal (dissonant) |
|-----------|------------------------|--------------------------|
| Lobe count `n` | Stable, clean integer | Shifted, competing harmonics |
| Curve type | Clean hypo/epitrochoid | Asymmetric deformation |
| Symmetry order `kFolds` | Higher (4–6), clear rotational symmetry | Lower (2–3), broken symmetry |
| Overall form | Defined, "more itself" | Agitated, searching |

**Cymatics analog:** The base frequency of the plate changes → the sand pattern reorganizes into a fundamentally different geometry.

#### d_accumulated → Harmonic Complexity (Depth Structure)

More overtones = more competing frequencies = richer particle distribution. `d_accumulated` modulates the tier system and emergence:

| Parameter | Low d_accumulated (aligned history) | High d_accumulated (surprising input) |
|-----------|-------------------------------------|---------------------------------------|
| Tier distribution | Concentrated in dominant tiers | More planets promoted to higher tiers |
| Fractal depth | Shallow, clean | Deep, branching |
| Emergence bridges | Few, stable | Many, active, cross-connecting |
| Particle budget allocation | Focused on core planets | Spread across competing centers |

**Cymatics analog:** Additional harmonic frequencies overlay the base pattern → interference patterns emerge, the figure becomes more complex without losing coherence.

#### d_elemental → Timbre (Surface Texture)

Same magnitude, completely different character. `d_elemental` determines the *quality* of visual tension via Sheng/Ke cycle analysis:

| Cycle | Dissonance type | Visual character | Particle behavior |
|-------|----------------|------------------|-------------------|
| **Sheng disrupted** (nurturing cycle broken, e.g. Wood→Fire interrupted) | Organic tension | Flowing, pulsing, expansive | Particles seek, breathe, stretch outward — like a plant reaching for blocked sunlight |
| **Ke activated** (controlling cycle engaged, e.g. Water↔Fire) | Crystalline tension | Angular, flickering, boundaried | Particles vibrate, flash, maintain hard edges — like opposing magnetic fields |
| **Both** (complex elemental conflict) | Compound tension | Layered: flowing substrate with crystalline peaks | Mixed behavior — organic base with sharp interference nodes |

**Cymatics analog:** The medium changes (water vs. sand vs. oil) → same frequency produces geometrically similar but texturally different patterns.

#### Combined Visual Matrix

The three layers compose independently — each affects a different visual channel:

```
Signature Visual = Geometry(d_natal) × Complexity(d_accumulated) × Texture(d_elemental)
```

Example scenarios:

1. **Fire-user completes fire-aligned quiz cluster**: Low d_natal, low d_accumulated, no elemental conflict → Geometry sharpens, complexity stays stable, texture calm. The signature becomes "more itself."

2. **Water-user shows sudden fire-tendencies**: High d_natal, high d_accumulated, Ke-dissonance (Water controls Fire) → Geometry deforms asymmetrically, complexity spikes with new emergence bridges, texture becomes angular/flickering. Maximum visible transformation.

3. **Long-time user with 15 quizzes gets one surprising result**: Low d_natal (close to blueprint), high d_accumulated (contradicts quiz history), mild Sheng-disruption → Geometry stays stable, but complexity increases locally, texture pulses gently. The signature absorbs the surprise without structural upheaval.

### Current vs. Future Implementation

**Now (Phase 1)**: Beautiful, coherent, feasible — accuracy secondary. Topologically faithful with aesthetic priority. Natal baseline (Layer 1) is primary. Element-level conflict detection (Layer 3) provides coarse dissonance signal. Layer 2 is architecturally prepared but not yet active.

**Later (Phase 2)**: Information density increases for dating/matching/teambuilding use cases. Full three-layer dissonance computation. Bijective precision where signature geometry can theoretically reconstruct the input vector.

### Significance Principle

Significance behaves like information theory: the more a signal deviates from baseline, the more decisive it is. Contradictions to the user's overall system create friction, vibration, and adaptation stress — which generates attention that we interpret as meaning. Changes that are meaningful must show visually, and vice versa.

## Enforcement

### Trigger conditions

- **Design phase**: when designing any signature visualization, transition animation, or quiz-to-visual mapping
- **Code phase**: when modifying `computeWeights()`, `signatur-bridge.ts`, `bazodiac-engine.ts`, or any quiz-to-sector pipeline
- **Product phase**: when defining matching/compatibility features that consume signature data

### Required patterns

- Natal weights (`soulprintToNatalWeights()`) are always the immutable reference. No quiz, transit, or UI interaction may modify natal data.
- Quiz modulation is multiplicative against natal baseline: `raw_weight = natal_weight × (1 + quiz_boost)`
- Dissonance computation must be additive across layers — each layer contributes independently, no layer can cancel another.
- Visual transitions on quiz completion must be proportional to computed dissonance — small d → subtle morph, large d → visible structural change.
- The Three-Layer Model (Obsidian Core / Neural Myzel / Bioluminescent Membrane) maps directly:
  - **Obsidian Core** = Layer 1 (Natal Baseline) — immutable
  - **Neural Myzel** = Layer 2 + 3 (Quiz accumulation + Elemental balance) — modulation only
  - **Bioluminescent Membrane** = Visual expression of dissonance metrics

### Required checks

1. Natal weights remain unchanged after any quiz processing
2. Dissonance metrics are computed before visual transition begins
3. Element-level conflict uses canonical Sheng/Ke cycle definitions from `wuxing.ts`
4. Visual change magnitude correlates with dissonance magnitude (no silent high-dissonance, no dramatic low-dissonance)

### Prohibited patterns

- Flat blending without dissonance awareness (treating all quiz input as equal regardless of alignment)
- Modifying natal weights based on quiz results
- Computing dissonance only at planet level without element-level consideration
- Visual transitions that feel arbitrary or disconnected from input semantics
- Hardcoding dissonance thresholds — these must be derived from the data
