# Quiz Generator Pipeline Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement the quiz generator pipeline that transforms a `QuizGeneratorInput` into a complete `GeneratedQuiz` with all integration artifacts (QuizDefinition, AFFINITY_MAP entries, event converter, result profiles).

**Architecture:** The generator is a deterministic TypeScript module in `packages/shared/` that takes structured input and produces all artifacts needed to wire a new quiz into the Bazodiac fusion system. LLM-generated content (scenarios, narratives) is injected via the input — the generator itself is pure TypeScript with no AI dependency. The example quiz (shadow_archetype_01) serves as the integration test fixture.

**Tech Stack:** TypeScript, Vitest, packages/shared (QuizDefinition schema, scoreQuiz()), src/lib/fusion-ring (AFFINITY_MAP, quiz-to-event.ts, clusters.ts)

---

## Task 1: Generator Types

**Files:**
- Create: `packages/shared/src/quizzes/generator-types.ts`
- Test: `packages/shared/src/quizzes/__tests__/generator-types.test.ts`

**Step 1: Write the type definitions**

Extract types from `docs/quiz-generator/quiz-generator-schema-v1.md` into a proper TypeScript module. Only the types — no runtime code yet.

```typescript
// Core types to extract:
// QuizGeneratorInput, DimensionSpec, ClusterAssignment,
// GeneratedQuiz, ResultProfile, AffinityMapEntry, EventConverterSpec, AggregationRules
// + literal union types: MarkerDomain, ZodiacSectorIndex, SignaturDimension, MasterSignalDimension
// + constants: ZODIAC_SECTORS, SIGNATUR_DIMENSIONS, MASTER_SIGNAL_DIMENSIONS, FUSION_WEIGHTS
```

Re-export `QuizDefinition` from `../schema` — do NOT duplicate it.

**Step 2: Write a type-check test**

```typescript
import type { QuizGeneratorInput, GeneratedQuiz } from '../generator-types';

describe('generator-types', () => {
  it('QuizGeneratorInput accepts valid shadow archetype input', () => {
    const input: QuizGeneratorInput = {
      topic: 'shadow_archetype',
      targetPattern: 'Primary shadow archetype',
      patternCategory: 'shadow',
      tone: 'mysterious',
      dimensions: [{
        key: 'destroyer',
        label: 'The Destroyer',
        description: 'Suppressed rage',
        markerDomain: 'shadow',
        markerKeywords: ['aggressive'],
        fusionMapping: {
          wuxingElement: 'Fire',
          primarySector: 0,
          signaturDimension: 'assertion',
          masterSignalDimension: 'passion',
        },
      }],
      cluster: { clusterId: 'cluster.mystiker.v1', isPremium: false, orderIndex: 5 },
      scoringModel: 'multi-dimension',
      locale: 'de-DE',
    };
    expect(input.topic).toBe('shadow_archetype');
  });
});
```

**Step 3: Run test**

```bash
cd packages/shared && npx vitest run src/quizzes/__tests__/generator-types.test.ts
```

**Step 4: Commit**

```bash
git add packages/shared/src/quizzes/generator-types.ts packages/shared/src/quizzes/__tests__/generator-types.test.ts
git commit -m "feat(quiz-gen): add generator pipeline types from schema v1.0"
```

---

## Task 2: Affinity Map Entry Generator

**Files:**
- Create: `packages/shared/src/quizzes/generate-affinity-entries.ts`
- Test: `packages/shared/src/quizzes/__tests__/generate-affinity-entries.test.ts`

**Step 1: Write the failing test**

```typescript
import { generateAffinityEntries } from '../generate-affinity-entries';
import type { DimensionSpec, AffinityMapEntry } from '../generator-types';

describe('generateAffinityEntries', () => {
  const dim: DimensionSpec = {
    key: 'destroyer',
    label: 'The Destroyer',
    description: 'Suppressed rage',
    markerDomain: 'shadow',
    markerKeywords: ['aggressive', 'primal_force'],
    fusionMapping: {
      wuxingElement: 'Fire',
      primarySector: 0,  // Aries
      secondarySector: 7, // Scorpio
      signaturDimension: 'assertion',
      masterSignalDimension: 'passion',
    },
  };

  it('generates one entry per marker keyword', () => {
    const entries = generateAffinityEntries([dim]);
    expect(entries).toHaveLength(2);
    expect(entries[0].keyword).toBe('aggressive');
    expect(entries[1].keyword).toBe('primal_force');
  });

  it('primary sector gets highest weight', () => {
    const entries = generateAffinityEntries([dim]);
    const vec = entries[0].sectorWeights;
    const maxIdx = vec.indexOf(Math.max(...vec));
    expect(maxIdx).toBe(0); // Aries = primary
  });

  it('vector sums to approximately 1.0', () => {
    const entries = generateAffinityEntries([dim]);
    const sum = entries[0].sectorWeights.reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1.0, 1);
  });

  it('includes domain and rationale', () => {
    const entries = generateAffinityEntries([dim]);
    expect(entries[0].domain).toBe('shadow');
    expect(entries[0].rationale).toContain('Fire');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd packages/shared && npx vitest run src/quizzes/__tests__/generate-affinity-entries.test.ts
```
Expected: FAIL — module not found

**Step 3: Implement**

```typescript
import type { DimensionSpec, AffinityMapEntry, ZodiacSectorIndex } from './generator-types';
import { ZODIAC_SECTORS } from './generator-types';

// Wu Xing element → canonical zodiac sectors
const ELEMENT_SECTORS: Record<string, ZodiacSectorIndex[]> = {
  Wood:  [0, 11],   // Aries, Pisces
  Fire:  [2, 3, 4], // Gemini, Cancer, Leo
  Earth: [1, 10],   // Taurus, Aquarius
  Metal: [5, 6],    // Virgo, Libra
  Water: [7, 8, 9], // Scorpio, Sagittarius, Capricorn
};

export function generateAffinityEntries(dimensions: DimensionSpec[]): AffinityMapEntry[] {
  const entries: AffinityMapEntry[] = [];

  for (const dim of dimensions) {
    for (const keyword of dim.markerKeywords) {
      const weights: number[] = new Array(12).fill(0);
      const { primarySector, secondarySector, wuxingElement } = dim.fusionMapping;

      // Primary sector: 0.45
      weights[primarySector] = 0.45;

      // Secondary sector: 0.25 (if defined)
      if (secondarySector !== undefined) {
        weights[secondarySector] = 0.25;
      }

      // Element sectors: distribute remaining weight
      const elementSectors = ELEMENT_SECTORS[wuxingElement] ?? [];
      const usedSectors = new Set([primarySector, secondarySector]);
      const remaining = elementSectors.filter(s => !usedSectors.has(s));
      const remainingWeight = 1.0 - weights.reduce((a, b) => a + b, 0);
      if (remaining.length > 0) {
        const perSector = remainingWeight / remaining.length;
        for (const s of remaining) {
          weights[s] = perSector;
        }
      } else if (remainingWeight > 0) {
        // Spread evenly across empty sectors
        const empty = weights.map((w, i) => (w === 0 ? i : -1)).filter(i => i >= 0);
        if (empty.length > 0) {
          const per = remainingWeight / empty.length;
          for (const i of empty) weights[i] = per;
        }
      }

      // Normalize to sum = 1.0
      const sum = weights.reduce((a, b) => a + b, 0);
      const normalized = weights.map(w => Math.round((w / sum) * 1000) / 1000) as AffinityMapEntry['sectorWeights'];

      entries.push({
        keyword,
        sectorWeights: normalized,
        domain: dim.markerDomain,
        rationale: `${dim.label} (${wuxingElement}, primary: ${ZODIAC_SECTORS[primarySector].sign})`,
      });
    }
  }

  return entries;
}
```

**Step 4: Run tests**

```bash
cd packages/shared && npx vitest run src/quizzes/__tests__/generate-affinity-entries.test.ts
```

**Step 5: Commit**

```bash
git add packages/shared/src/quizzes/generate-affinity-entries.ts packages/shared/src/quizzes/__tests__/generate-affinity-entries.test.ts
git commit -m "feat(quiz-gen): affinity map entry generator with Wu Xing element distribution"
```

---

## Task 3: Event Converter Generator

**Files:**
- Create: `packages/shared/src/quizzes/generate-event-converter.ts`
- Test: `packages/shared/src/quizzes/__tests__/generate-event-converter.test.ts`

**Step 1: Write the failing test**

```typescript
import { generateEventConverter } from '../generate-event-converter';
import type { DimensionSpec, EventConverterSpec } from '../generator-types';

describe('generateEventConverter', () => {
  const dims: DimensionSpec[] = [
    {
      key: 'destroyer', label: 'Destroyer', description: 'rage',
      markerDomain: 'shadow', markerKeywords: ['aggressive', 'primal_force'],
      fusionMapping: { wuxingElement: 'Fire', primarySector: 0, signaturDimension: 'assertion', masterSignalDimension: 'passion' },
    },
    {
      key: 'orphan', label: 'Orphan', description: 'abandonment',
      markerDomain: 'shadow', markerKeywords: ['isolation', 'vulnerability'],
      fusionMapping: { wuxingElement: 'Water', primarySector: 7, signaturDimension: 'empathy', masterSignalDimension: 'connection' },
    },
  ];

  it('generates converter spec with correct moduleId', () => {
    const spec = generateEventConverter('shadow_archetype_01', dims);
    expect(spec.moduleId).toBe('quiz.shadow_archetype_01.v1');
    expect(spec.functionName).toBe('shadowArchetype01ToEvent');
  });

  it('maps each dimension to its marker keywords', () => {
    const spec = generateEventConverter('shadow_archetype_01', dims);
    expect(spec.dimensionToMarkers).toHaveLength(2);
    expect(spec.dimensionToMarkers[0].dimensionKey).toBe('destroyer');
    expect(spec.dimensionToMarkers[0].markers).toHaveLength(2);
    expect(spec.dimensionToMarkers[0].markers[0].id).toBe('marker.shadow.aggressive');
  });
});
```

**Step 2: Run test — should fail**

**Step 3: Implement**

The converter spec is a data structure describing how to convert quiz scores → ContributionEvent markers. The actual runtime function will be generated as a string template (Task 5).

```typescript
import type { DimensionSpec, EventConverterSpec } from './generator-types';

function toCamelCase(id: string): string {
  return id.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

export function generateEventConverter(quizId: string, dimensions: DimensionSpec[]): EventConverterSpec {
  return {
    functionName: `${toCamelCase(quizId)}ToEvent`,
    moduleId: `quiz.${quizId}.v1`,
    dimensionToMarkers: dimensions.map(dim => ({
      dimensionKey: dim.key,
      markers: dim.markerKeywords.map(kw => ({
        id: `marker.${dim.markerDomain}.${kw}`,
        weightFormula: `normalize(scores.${dim.key})`,
      })),
    })),
  };
}
```

**Step 4: Run tests**

```bash
cd packages/shared && npx vitest run src/quizzes/__tests__/generate-event-converter.test.ts
```

**Step 5: Commit**

```bash
git add packages/shared/src/quizzes/generate-event-converter.ts packages/shared/src/quizzes/__tests__/generate-event-converter.test.ts
git commit -m "feat(quiz-gen): event converter spec generator with marker ID construction"
```

---

## Task 4: Quiz Assembler (Core Generator)

**Files:**
- Create: `packages/shared/src/quizzes/generate-quiz.ts`
- Test: `packages/shared/src/quizzes/__tests__/generate-quiz.test.ts`

**Step 1: Write the failing test**

Use the shadow archetype example from `docs/quiz-generator/example-shadow-archetype.md` as fixture data.

```typescript
import { generateQuiz } from '../generate-quiz';
import { scoreQuiz } from '../scoring';
import type { QuizGeneratorInput } from '../generator-types';

const SHADOW_INPUT: QuizGeneratorInput = {
  topic: 'shadow_archetype',
  targetPattern: 'Primary shadow archetype — the disowned self',
  patternCategory: 'shadow',
  tone: 'mysterious',
  dimensions: [
    { key: 'destroyer', label: 'The Destroyer', description: 'Suppressed rage', markerDomain: 'shadow', markerKeywords: ['aggressive', 'primal_force'], fusionMapping: { wuxingElement: 'Fire', primarySector: 0, secondarySector: 7, signaturDimension: 'assertion', masterSignalDimension: 'passion' }},
    { key: 'orphan', label: 'The Orphan', description: 'Abandonment wound', markerDomain: 'shadow', markerKeywords: ['isolation', 'vulnerability'], fusionMapping: { wuxingElement: 'Water', primarySector: 7, secondarySector: 3, signaturDimension: 'empathy', masterSignalDimension: 'connection' }},
    { key: 'tyrant', label: 'The Tyrant', description: 'Need for control', markerDomain: 'shadow', markerKeywords: ['dominance', 'strategic_control'], fusionMapping: { wuxingElement: 'Earth', primarySector: 9, signaturDimension: 'discipline', masterSignalDimension: 'stability' }},
    { key: 'trickster', label: 'The Trickster', description: 'Chaos as protection', markerDomain: 'shadow', markerKeywords: ['deflection', 'mimicry'], fusionMapping: { wuxingElement: 'Metal', primarySector: 5, secondarySector: 2, signaturDimension: 'logic', masterSignalDimension: 'autonomy' }},
  ],
  cluster: { clusterId: 'cluster.mystiker.v1', isPremium: false, orderIndex: 5 },
  scoringModel: 'multi-dimension',
  locale: 'de-DE',
};

describe('generateQuiz', () => {
  it('requires pre-authored questions in input', () => {
    // Generator assembles, does NOT generate questions (that's LLM work done before)
    // The input must include questions array
    expect(() => generateQuiz(SHADOW_INPUT)).toThrow(/questions/);
  });

  it('assembles valid GeneratedQuiz from complete input', () => {
    const inputWithQuestions = {
      ...SHADOW_INPUT,
      questions: [/* at least 1 question for test */
        {
          id: 'q1',
          scenario: { 'de-DE': 'Test scenario', 'en-US': 'Test scenario' },
          prompt: { 'de-DE': 'Was?', 'en-US': 'What?' },
          options: [
            { id: 'a', text: { 'de-DE': 'A', 'en-US': 'A' }, scores: { destroyer: 3, orphan: 0, tyrant: 0, trickster: 0 }, emotionalTag: 'test' },
            { id: 'b', text: { 'de-DE': 'B', 'en-US': 'B' }, scores: { destroyer: 0, orphan: 3, tyrant: 0, trickster: 0 }, emotionalTag: 'test' },
            { id: 'c', text: { 'de-DE': 'C', 'en-US': 'C' }, scores: { destroyer: 0, orphan: 0, tyrant: 3, trickster: 0 }, emotionalTag: 'test' },
            { id: 'd', text: { 'de-DE': 'D', 'en-US': 'D' }, scores: { destroyer: 0, orphan: 0, tyrant: 0, trickster: 3 }, emotionalTag: 'test' },
          ],
        },
      ],
      resultProfiles: [
        { id: 'destroyer', name: { 'de-DE': 'Der Zerstörer', 'en-US': 'The Destroyer' }, subtitle: { 'de-DE': '', 'en-US': '' }, description: { 'de-DE': 'Test', 'en-US': 'Test' }, shadowInsight: { 'de-DE': '', 'en-US': '' }, fusionMapping: { element: 'Fire' as const, zodiacAffinity: ['Aries'], ringPosition: 0 as const, signaturDimension: 'assertion' as const, masterSignalDimension: 'passion' as const }, visual: { color: '#ff0000', symbol: '🔥' }, zoneLogic: { flowCondition: '', sparkCondition: '', talkCondition: '' } },
      ],
    };

    const result = generateQuiz(inputWithQuestions);

    expect(result.definition.id).toBe('shadow_archetype_01');
    expect(result.definition.scoringModel).toBe('multi-dimension');
    expect(result.affinityMapEntries.length).toBeGreaterThan(0);
    expect(result.eventConverter.moduleId).toBe('quiz.shadow_archetype_01.v1');
    expect(result.aggregation.weight).toBeLessThanOrEqual(0.30);
    expect(result.aggregation.maxNatalDeviation).toBe(0.5);
  });

  it('produced definition is scoreable by scoreQuiz()', () => {
    const inputWithQuestions = { /* same as above */ };
    // const result = generateQuiz(inputWithQuestions);
    // const quizResult = scoreQuiz(result.definition, { q1: 'a' });
    // expect(quizResult.profileId).toBeDefined();
  });
});
```

**Step 2: Run test — should fail**

**Step 3: Implement `generateQuiz()`**

The assembler takes `QuizGeneratorInput` (with pre-authored questions + result profiles) and produces the `GeneratedQuiz` by:
1. Building a `QuizDefinition` from input dimensions + questions
2. Calling `generateAffinityEntries()` for marker→sector vectors
3. Calling `generateEventConverter()` for event spec
4. Setting aggregation rules from input metadata

```typescript
import type { QuizGeneratorInput, GeneratedQuiz, AggregationRules } from './generator-types';
import type { QuizDefinition } from './schema';
import { generateAffinityEntries } from './generate-affinity-entries';
import { generateEventConverter } from './generate-event-converter';

export function generateQuiz(input: QuizGeneratorInput & {
  questions: any[]; // Pre-authored questions
  resultProfiles: any[]; // Pre-authored profiles
}): GeneratedQuiz {
  if (!input.questions?.length) throw new Error('questions are required');

  const quizId = `${input.topic}_01`;

  const definition: QuizDefinition = {
    id: quizId,
    version: '1.0.0',
    title: input.questions[0]?.scenario?.['en-US'] ? input.topic : input.topic,
    titleDe: input.topic,
    subtitle: '',
    subtitleDe: '',
    emoji: '🔮',
    accentColor: '#D4AF37',
    scoringModel: input.scoringModel,
    dimensions: input.dimensions.map(d => ({
      key: d.key, label: d.label, description: d.description,
    })),
    questions: input.questions.map(q => ({
      id: q.id,
      text: q.prompt?.['en-US'] ?? q.prompt?.['de-DE'] ?? '',
      textDe: q.prompt?.['de-DE'] ?? '',
      context: q.scenario?.['de-DE'] ?? '',
      options: q.options.map((o: any) => ({
        id: o.id,
        text: o.text?.['en-US'] ?? '',
        textDe: o.text?.['de-DE'] ?? '',
        scores: o.scores,
      })),
    })),
    // Profiles must match QuizDefinition schema: { id, title, emoji, color, description }
    profiles: input.resultProfiles.map(p => ({
      id: p.id,
      title: p.title,
      emoji: p.emoji,
      color: p.color,
      description: p.description,
    })),
    // TODO: populate resultMapping from generator input once marker/trait design is finalized
    resultMapping: [],
  };

  const affinityMapEntries = generateAffinityEntries(input.dimensions);
  const eventConverter = generateEventConverter(quizId, input.dimensions);

  const aggregation: AggregationRules = {
    contributesTo: [input.cluster.clusterId],
    weight: 0.15,
    decay: 'none',
    recurrence: 'once',
    maxNatalDeviation: 0.5,
  };

  return {
    definition,
    resultProfiles: input.resultProfiles,
    affinityMapEntries,
    eventConverter,
    aggregation,
  };
}
```

**Step 4: Run tests**

```bash
cd packages/shared && npx vitest run src/quizzes/__tests__/generate-quiz.test.ts
```

**Step 5: Commit**

```bash
git add packages/shared/src/quizzes/generate-quiz.ts packages/shared/src/quizzes/__tests__/generate-quiz.test.ts
git commit -m "feat(quiz-gen): core quiz assembler — input + questions → GeneratedQuiz"
```

---

## Task 5: Integration — Shadow Archetype Quiz

**Files:**
- Create: `packages/shared/src/quizzes/definitions/shadow-archetype.ts`
- Modify: `src/lib/fusion-ring/affinity-map.ts` — merge new entries
- Modify: `src/lib/fusion-ring/quiz-to-event.ts` — add converter function
- Modify: `src/components/QuizOverlay.tsx` — register in QUIZ_MAP
- Create: `src/components/quizzes/ShadowArchetypeQuiz.tsx` — React component
- Test: `src/__tests__/shadow-archetype-integration.test.ts`

**Step 1: Create the quiz definition**

Import the shadow archetype quiz data from `docs/quiz-generator/example-shadow-archetype.md` and wire it through `generateQuiz()`. Export the `QuizDefinition` for `scoreQuiz()`.

**Step 2: Merge AFFINITY_MAP entries**

Add the 8 new marker keywords (2 per dimension × 4 dimensions) to `AFFINITY_MAP` in `affinity-map.ts`. Use the vectors generated by `generateAffinityEntries()`.

**Step 3: Add event converter**

Add `shadowArchetype01ToEvent()` to `quiz-to-event.ts` following the dimensional mapping pattern (like `personalityToEvent`).

**Step 4: Register in QUIZ_MAP**

Add `shadow_archetype: lazy(() => import('./quizzes/ShadowArchetypeQuiz'))` to `QuizOverlay.tsx`.

**Step 5: Create React component**

Create `ShadowArchetypeQuiz.tsx` following the pattern of `PersonalityQuiz.tsx` — renders questions from the definition, calls `onComplete` with the `ContributionEvent`.

**Step 6: Write integration test**

```typescript
describe('shadow archetype integration', () => {
  it('scores correctly with scoreQuiz()', () => { ... });
  it('all marker keywords exist in AFFINITY_MAP', () => { ... });
  it('event converter produces valid ContributionEvent', () => { ... });
});
```

**Step 7: Run full test suite**

```bash
npm run test
```

**Step 8: Commit**

```bash
git commit -m "feat(quiz): integrate shadow archetype quiz via generator pipeline"
```

---

## Task 6: Exports and Index

**Files:**
- Modify: `packages/shared/src/quizzes/index.ts` — export generator functions
- Modify: `src/lib/fusion-ring/clusters.ts` — add shadow_archetype to mystiker cluster

**Step 1: Update shared package exports**

```typescript
export { generateQuiz } from './generate-quiz';
export { generateAffinityEntries } from './generate-affinity-entries';
export { generateEventConverter } from './generate-event-converter';
export type { QuizGeneratorInput, GeneratedQuiz, DimensionSpec } from './generator-types';
```

**Step 2: Add to mystiker cluster**

In `clusters.ts`, add `'shadow_archetype'` to `cluster.mystiker.v1.quizzes` array.

**Step 3: Run full test suite**

```bash
npm run test
```

**Step 4: Commit**

```bash
git commit -m "feat(quiz-gen): export generator API, register shadow archetype in mystiker cluster"
```

---

## Summary

| Task | Description | Files | Priority |
|------|-------------|-------|----------|
| 1 | Generator types from schema v1.0 | packages/shared | P1 |
| 2 | Affinity map entry generator | packages/shared | P1 |
| 3 | Event converter spec generator | packages/shared | P1 |
| 4 | Core quiz assembler | packages/shared | P1 |
| 5 | Shadow archetype integration (end-to-end) | src/ + packages/shared | P1 |
| 6 | Exports + cluster registration | packages/shared + src/ | P1 |

**Coverage:** REQ-F-quiz-generator-pipeline — all 11 acceptance criteria addressed.

**Dependency chain:** Task 1 → Task 2 + Task 3 (parallel) → Task 4 → Task 5 → Task 6
