# REQ-F-quiz-generator-pipeline: Quiz Generator Pipeline with Fusion System Mapping

**Type**: Functional

**Status**: Approved

**Priority**: Must-have

**Source**: [GOAL-autopoietic-ux](../goals/GOAL-autopoietic-ux.md), [GOAL-fusion-astrology](../goals/GOAL-fusion-astrology.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

A reusable quiz generation pipeline that produces psychological pattern quizzes from a structured schema (`QuizGeneratorInput`). Each generated quiz produces a complete `QuizDefinition` compatible with `scoreQuiz()`, plus all required integration artifacts: AFFINITY_MAP entries for marker→sector mapping, event converter functions for `ContributionEvent` emission, result profiles with narrative texts, and aggregation rules for Master Signal contribution.

The generator schema defines a formal mapping contract between quiz dimensions and three Bazodiac fusion systems:

1. **12-sector zodiac mapping** — Each quiz dimension specifies primary and secondary zodiac sector affinities. Marker keywords from quiz results map to 12-element weight vectors via AFFINITY_MAP entries. These vectors feed into the Fusion Ring signal computation.

2. **6-dimension bipolar Signatur (V3)** — Each quiz dimension maps to one of six bipolar Signatur dimensions (assertion, empathy, creativity, logic, intuition, discipline). Quiz results modulate pole radii in the V3 bipolar trail engine via `quizSectorsToQuizWeights()`.

3. **5D Master Signal projection** — Each quiz dimension maps to one of five Master Signal dimensions (passion, stability, future, connection, autonomy). Quiz results contribute to the Master Signal via `quiz-projection.ts` with a combined weight of 0.30 in the formula `0.35·N + 0.30·Q + 0.20·G + 0.15·alignment_boost`.

The pipeline flow is: `QuizGeneratorInput → GeneratedQuiz → { QuizDefinition, AffinityMapEntries, EventConverterSpec, ResultProfiles, AggregationRules }`.

## Acceptance Criteria

- Given a valid `QuizGeneratorInput` with topic, pattern category, dimensions (2–6), cluster assignment, and scoring model, when the generator runs, then it produces a complete `GeneratedQuiz` containing all five output artifacts
- Given a generated `QuizDefinition`, when it is passed to `scoreQuiz()`, then it returns valid dimension scores and assigns a result profile
- Given a generated quiz's `AffinityMapEntry` list, when merged into `src/lib/fusion-ring/affinity-map.ts`, then each marker keyword resolves to a 12-element sector weight vector summing to a non-zero value
- Given a generated quiz's `EventConverterSpec`, when registered in `quiz-to-event.ts`, then quiz completion produces a `ContributionEvent` with correct markers (format: `marker.{domain}.{keyword}`, weight 0–1)
- Given a quiz dimension's `fusionMapping.signaturDimension`, when the quiz modulates the Signatur V3, then the specified bipolar dimension's pole radius changes proportionally to the quiz score
- Given a quiz dimension's `fusionMapping.masterSignalDimension`, when the quiz contributes to the Master Signal, then the specified 5D dimension's weight adjusts within the 0.30 quiz allocation
- Given a quiz dimension's `fusionMapping.wuxingElement` and `primarySector`, when the affinity map entry is generated, then the primary sector receives the highest weight and the element's canonical zodiac sectors receive secondary weights
- Given any quiz result, when it modulates the natal signal, then the total quiz deviation from natal weights does not exceed `maxNatalDeviation` (0.5) per the True North principle
- Given a generated quiz's `ResultProfile` list, when displayed to the user, then narrative text uses possibility-oriented language (no diagnostic labels, no "you are X" statements) following QuissMe AI Mapping Lexicon guardrails
- Given a quiz's `AggregationRules`, when the quiz contributes to the Master Signal over time, then it respects the specified decay rate and recurrence policy (once, monthly, seasonal)
- Given a quiz's `ClusterAssignment`, when the quiz is completed, then the cluster completion gate evaluates correctly — contribution is only persisted when all quizzes in the cluster are complete

## Mapping Reference Tables

### Quiz Dimension → Signatur V3 Dimension

| Signatur Dimension | Angle | Planet | Cousto Hz | Pole A (DE) | Pole B (DE) |
|-------------------|-------|--------|-----------|-------------|-------------|
| assertion | 0° | Mars | 144.72 | Durchsetzung | Hingabe |
| empathy | 60° | Moon | 210.42 | Einfühlung | Abgrenzung |
| creativity | 120° | Sun | 126.22 | Schöpfung | Struktur |
| logic | 180° | Mercury | 141.27 | Analyse | Synthese |
| intuition | 240° | Jupiter | 183.58 | Ahnung | Evidenz |
| discipline | 300° | Saturn | 147.85 | Ordnung | Freiheit |

### Quiz Dimension → Master Signal Dimension

| Master Signal Dimension | Description |
|------------------------|-------------|
| passion | Expressivity, desire, initiative, energy |
| stability | Continuity, grounding, reliability, structure |
| future | Growth orientation, vision, possibility |
| connection | Relational depth, intimacy, belonging |
| autonomy | Self-direction, independence, individuation |

### Pattern Categories

`shadow`, `love`, `relationship`, `routine`, `spiritual`, `personality`

### Marker Domains

`love`, `social`, `instinct`, `cognition`, `leadership`, `freedom`, `spiritual`, `eq`, `values`, `shadow`, `intimacy`, `routine`

## Related Artifacts

- Decision: [DEC-master-signal-weights](../../2-design/decisions/DEC-master-signal-weights.md) — quiz weight locked at 0.30
- Decision: [DEC-dissonance-model](../../2-design/decisions/DEC-dissonance-model.md) — quiz modulation visual effects
- Decision: [DEC-signatur-v3-bipolar-trails](../../2-design/decisions/DEC-signatur-v3-bipolar-trails.md) — 6 bipolar dimensions from quiz input
- Requirement: [REQ-F-quiz-contribution-system](REQ-F-quiz-contribution-system.md) — existing 22 quizzes use the same pipeline
- Schema source: `quiz-generator-schema.ts` v1.0
- Example output: `shadow_archetype_01` quiz ("What Lurks Beneath Your Smile?")

## Related Constraints

- [CON-german-ui](../constraints/CON-german-ui.md) — quiz scenarios and result texts must be in German (de-DE primary, en-US secondary)
