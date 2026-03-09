# Quiz Cluster Energy System — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Port all 15 quizzes from QuizzMe into Astro-Noctum, organize them into 4 clusters, implement cluster-gated signal fusion, and build a visual energy charge/discharge system around the FusionRing.

**Architecture:** Data layer first (cluster registry + gated filtering), then quiz portierung in batches (12 quizzes), then UI (ClusterEnergySystem, ClusterCard, EnergyChannel), then dashboard integration. Each quiz is lazy-loaded, self-contained, and emits a ContributionEvent via onComplete callback.

**Tech Stack:** React 19, TypeScript, motion/react, Supabase (existing contribution_events table), Canvas 2D (FusionRing unchanged)

**Base path:** `/Users/benjaminpoersch/Projects/WEB/Astro-Noctum/Astro-Noctum`

**QuizzMe source:** `/Users/benjaminpoersch/Projects/WEB/QuizzMe/src/components/quizzes/`

---

## Phase 1: Data Layer (Cluster Registry + Signal Gating)

### Task 1: Create cluster registry

**Files:**
- Create: `src/lib/fusion-ring/clusters.ts`

**Step 1: Create the cluster registry file**

```typescript
// src/lib/fusion-ring/clusters.ts

export interface ClusterDef {
  id: string;
  name: string;
  icon: string;
  color: string;
  quizModuleIds: string[];
}

export const CLUSTER_REGISTRY: ClusterDef[] = [
  {
    id: 'cluster.naturkind.v1',
    name: 'Naturkind',
    icon: '\u{1F33F}',
    color: '#2D5A4C',
    quizModuleIds: [
      'quiz.aura_colors.v1',
      'quiz.krafttier.v1',
      'quiz.blumenwesen.v1',
      'quiz.energiestein.v1',
    ],
  },
  {
    id: 'cluster.mentalist.v1',
    name: 'Mentalist',
    icon: '\u{1F52E}',
    color: '#4A0E4E',
    quizModuleIds: [
      'quiz.love_languages.v1',
      'quiz.charme.v1',
      'quiz.eq.v1',
    ],
  },
  {
    id: 'cluster.stratege.v1',
    name: 'Stratege',
    icon: '\u265F\uFE0F',
    color: '#1A3A5C',
    quizModuleIds: [
      'quiz.personality.v1',
      'quiz.career_dna.v2',
      'quiz.social_role.v2',
      'quiz.spotlight.v2',
    ],
  },
  {
    id: 'cluster.mystiker.v1',
    name: 'Mystiker',
    icon: '\u{1F300}',
    color: '#5C1A4A',
    quizModuleIds: [
      'quiz.destiny.v1',
      'quiz.rpg_identity.v1',
      'quiz.party_need.v1',
      'quiz.celebrity_soulmate.v1',
    ],
  },
];

export function findClusterForModule(moduleId: string): ClusterDef | null {
  return CLUSTER_REGISTRY.find(c => c.quizModuleIds.includes(moduleId)) ?? null;
}

export function isClusterComplete(
  cluster: ClusterDef,
  completedModuleIds: Set<string>,
): boolean {
  return cluster.quizModuleIds.every(id => completedModuleIds.has(id));
}

export function clusterProgress(
  cluster: ClusterDef,
  completedModuleIds: Set<string>,
): number {
  const done = cluster.quizModuleIds.filter(id => completedModuleIds.has(id)).length;
  return done / cluster.quizModuleIds.length;
}
```

**Step 2: Export from fusion-ring index**

In `src/lib/fusion-ring/index.ts`, add:

```typescript
export { CLUSTER_REGISTRY, findClusterForModule, isClusterComplete, clusterProgress, type ClusterDef } from './clusters';
```

**Step 3: Verify TypeScript compiles**

Run: `cd /Users/benjaminpoersch/Projects/WEB/Astro-Noctum/Astro-Noctum && npx tsc --noEmit --pretty 2>&1 | head -20`

**Step 4: Commit**

```bash
git add src/lib/fusion-ring/clusters.ts src/lib/fusion-ring/index.ts
git commit -m "feat: add cluster registry with 4 quiz clusters and helper functions"
```

---

### Task 2: Add new AFFINITY_MAP entries

**Files:**
- Modify: `src/lib/fusion-ring/affinity-map.ts`

**Step 1: Add new domain-level and keyword-level entries**

Add these entries to `AFFINITY_MAP` after the existing keyword-level entries (after line 56, before the closing `};`):

```typescript
  // === NEW DOMAIN-LEVEL (Paket 5) ===
  'energy':    [0,  .2, 0,  0,  .2, 0,  0,  .1, .1, 0,  .2, .2],
  'flower':    [0,  .3, 0,  .2, 0,  0,  .2, 0,  0,  0,  0,  .3],
  'stone':     [0,  .4, 0,  0,  0,  0,  0,  .2, 0,  .2, 0,  .2],

  // === NEW KEYWORD-LEVEL (Paket 5) ===
  'risk_taking':      [.3, 0,  0,  0,  .1, 0,  0,  .1, .3, 0,  .1, .1],
  'healing':          [0,  0,  0,  .2, 0,  .2, 0,  0,  0,  0,  0,  .6],
  'shadow_work':      [0,  0,  0,  0,  0,  .1, 0,  .6, 0,  0,  0,  .3],
  'vision':           [0,  0,  0,  0,  0,  0,  0,  .1, .3, 0,  .1, .5],
  'guardian':         [.2, 0,  0,  .3, 0,  0,  0,  0,  0,  .3, .1, .1],
  'planner':         [0,  0,  .1, 0,  0,  .3, 0,  0,  0,  .5, .1, 0 ],
  'primal_force':    [.6, 0,  0,  0,  0,  0,  0,  .3, 0,  0,  0,  .1],
  'depth':           [0,  0,  0,  0,  0,  0,  0,  .5, 0,  0,  0,  .5],
  'curiosity':       [0,  0,  .3, 0,  .2, 0,  0,  0,  .3, 0,  .1, .1],
  'dominance':       [.2, 0,  0,  0,  .3, 0,  0,  .1, 0,  .3, .1, 0 ],
  'openness':        [0,  .1, .2, .1, .1, 0,  .2, 0,  .1, 0,  .1, .1],
  'stress_sensitivity': [0, 0, 0, .2, 0, .1, 0, .3, 0, 0, 0, .4],
  'self_regulation': [0,  0,  .1, 0,  0,  .3, 0,  .1, 0,  .3, 0,  .2],
  'motivation':      [.2, 0,  .1, 0,  .2, .1, 0,  0,  .2, .1, .1, 0 ],
  'social_skill':    [0,  0,  .1, .2, .1, 0,  .3, 0,  0,  0,  .2, .1],
  'achievement':     [.1, 0,  .1, 0,  .2, .2, 0,  0,  .1, .3, 0,  0 ],
  'diplomacy':       [0,  0,  .1, .1, 0,  0,  .4, 0,  0,  .1, .2, .1],
```

**Step 2: Verify all new rows sum to ~1.0**

Manually verify or add a comment. Each row should sum to approximately 1.0.

**Step 3: Commit**

```bash
git add src/lib/fusion-ring/affinity-map.ts
git commit -m "feat: extend AFFINITY_MAP with 17 new marker keywords for Paket 5 quizzes"
```

---

### Task 3: Add quiz-to-event mappers for all 12 new quizzes

**Files:**
- Modify: `src/lib/fusion-ring/quiz-to-event.ts`

**Step 1: Add mapper functions**

After the existing `socialRoleToEvent` function (line 202), add these mappers:

```typescript
// ═══════════════════════════════════════════════════════════════
// BLUMENWESEN
// ═══════════════════════════════════════════════════════════════

const BLUMENWESEN_MARKERS: Record<string, Marker[]> = {
  sonnenblume: [
    { id: 'marker.flower.warmth',     weight: 0.85, evidence: { confidence: 0.7 } },
    { id: 'marker.social.extroversion', weight: 0.75, evidence: { confidence: 0.7 } },
  ],
  lotusblume: [
    { id: 'marker.flower.depth',      weight: 0.85, evidence: { confidence: 0.7 } },
    { id: 'marker.spiritual.healing', weight: 0.70, evidence: { confidence: 0.7 } },
  ],
  wildblume: [
    { id: 'marker.flower.spontaneity', weight: 0.80, evidence: { confidence: 0.7 } },
    { id: 'marker.freedom.independence', weight: 0.75, evidence: { confidence: 0.7 } },
  ],
  eiche: [
    { id: 'marker.flower.guardian',   weight: 0.85, evidence: { confidence: 0.7 } },
    { id: 'marker.instinct.primal_sense', weight: 0.70, evidence: { confidence: 0.7 } },
  ],
  rose: [
    { id: 'marker.flower.passionate', weight: 0.80, evidence: { confidence: 0.7 } },
    { id: 'marker.love.sensory_connection', weight: 0.75, evidence: { confidence: 0.7 } },
  ],
};

export function blumenwesenToEvent(profileId: string): ContributionEvent {
  const key = profileId.toLowerCase();
  const markers = BLUMENWESEN_MARKERS[key] ?? [];
  return buildEvent('quiz.blumenwesen.v1', markers, [
    { id: `tag.archetype.${key}`, label: profileId, kind: 'archetype', weight: 0.8 },
  ]);
}

// ═══════════════════════════════════════════════════════════════
// ENERGIESTEIN
// ═══════════════════════════════════════════════════════════════

const ENERGIESTEIN_MARKERS: Record<string, Marker[]> = {
  amethyst: [
    { id: 'marker.stone.clarity',       weight: 0.80, evidence: { confidence: 0.7 } },
    { id: 'marker.spiritual.vision',    weight: 0.75, evidence: { confidence: 0.7 } },
  ],
  obsidian: [
    { id: 'marker.stone.depth',         weight: 0.85, evidence: { confidence: 0.7 } },
    { id: 'marker.cognition.shadow_work', weight: 0.70, evidence: { confidence: 0.7 } },
  ],
  citrin: [
    { id: 'marker.stone.warmth',        weight: 0.80, evidence: { confidence: 0.7 } },
    { id: 'marker.eq.motivation',       weight: 0.75, evidence: { confidence: 0.7 } },
  ],
  bergkristall: [
    { id: 'marker.stone.clarity',       weight: 0.85, evidence: { confidence: 0.7 } },
    { id: 'marker.cognition.analytical', weight: 0.70, evidence: { confidence: 0.7 } },
  ],
  rosenquarz: [
    { id: 'marker.stone.warmth',        weight: 0.80, evidence: { confidence: 0.7 } },
    { id: 'marker.love.togetherness',   weight: 0.80, evidence: { confidence: 0.7 } },
  ],
  tigerauge: [
    { id: 'marker.stone.primal_force',  weight: 0.80, evidence: { confidence: 0.7 } },
    { id: 'marker.leadership.authority', weight: 0.70, evidence: { confidence: 0.7 } },
  ],
};

export function energiesteinToEvent(profileId: string): ContributionEvent {
  const key = profileId.toLowerCase();
  const markers = ENERGIESTEIN_MARKERS[key] ?? [];
  return buildEvent('quiz.energiestein.v1', markers, [
    { id: `tag.archetype.${key}`, label: profileId, kind: 'archetype', weight: 0.8 },
  ]);
}

// ═══════════════════════════════════════════════════════════════
// CHARME
// ═══════════════════════════════════════════════════════════════

const CHARME_MARKERS: Record<string, string> = {
  warmth:       'marker.aura.warmth',
  resonance:    'marker.eq.empathy',
  authenticity: 'marker.eq.self_awareness',
  presence:     'marker.aura.authority',
};

export function charmeToEvent(
  scores: Record<string, number>,
  profileId: string,
): ContributionEvent {
  const maxScore = Math.max(...Object.values(scores), 1);
  const markers: Marker[] = Object.entries(CHARME_MARKERS)
    .filter(([dim]) => scores[dim] != null)
    .map(([dim, id]) => ({
      id,
      weight: Math.min((scores[dim] ?? 0) / maxScore, 1),
      evidence: { confidence: 0.7, itemsAnswered: 12 },
    }));

  return buildEvent('quiz.charme.v1', markers, [
    { id: `tag.style.${profileId}`, label: profileId, kind: 'style', weight: 0.8 },
  ]);
}

// ═══════════════════════════════════════════════════════════════
// CAREER DNA
// ═══════════════════════════════════════════════════════════════

const CAREER_MARKERS: Record<string, string> = {
  vision:       'marker.values.vision',
  structure:    'marker.skills.system_thinking',
  people:       'marker.social.extroversion',
  creativity:   'marker.creative.creativity',
  independence: 'marker.freedom.independence',
};

export function careerDnaToEvent(
  scores: Record<string, number>,
  profileId: string,
): ContributionEvent {
  const maxScore = Math.max(...Object.values(scores), 1);
  const markers: Marker[] = Object.entries(CAREER_MARKERS)
    .filter(([dim]) => scores[dim] != null)
    .map(([dim, id]) => ({
      id,
      weight: Math.min((scores[dim] ?? 0) / maxScore, 1),
      evidence: { confidence: 0.75, itemsAnswered: 15 },
    }));

  return buildEvent('quiz.career_dna.v2', markers, [
    { id: `tag.archetype.${profileId}`, label: profileId, kind: 'archetype', weight: 0.8 },
  ]);
}

// ═══════════════════════════════════════════════════════════════
// SPOTLIGHT
// ═══════════════════════════════════════════════════════════════

export function spotlightToEvent(
  profileId: string,
  scores: Record<string, number>,
): ContributionEvent {
  const SPOTLIGHT_MARKERS: Record<string, string> = {
    charisma:   'marker.aura.charisma',
    warmth:     'marker.aura.warmth',
    authority:  'marker.leadership.authority',
    mystery:    'marker.aura.mystery',
  };
  const maxScore = Math.max(...Object.values(scores), 1);
  const markers: Marker[] = Object.entries(SPOTLIGHT_MARKERS)
    .filter(([dim]) => scores[dim] != null)
    .map(([dim, id]) => ({
      id,
      weight: Math.min((scores[dim] ?? 0) / maxScore, 1),
      evidence: { confidence: 0.7, itemsAnswered: 12 },
    }));

  return buildEvent('quiz.spotlight.v2', markers, [
    { id: `tag.style.${profileId}`, label: profileId, kind: 'style', weight: 0.75 },
  ]);
}

// ═══════════════════════════════════════════════════════════════
// DESTINY
// ═══════════════════════════════════════════════════════════════

const DESTINY_MARKERS: Record<string, Marker[]> = {
  pioneer: [
    { id: 'marker.psyche.risk_taking',   weight: 0.85, evidence: { confidence: 0.7 } },
    { id: 'marker.freedom.independence', weight: 0.75, evidence: { confidence: 0.7 } },
  ],
  sage: [
    { id: 'marker.psyche.self_awareness', weight: 0.85, evidence: { confidence: 0.7 } },
    { id: 'marker.cognition.analytical',  weight: 0.70, evidence: { confidence: 0.7 } },
  ],
  creator: [
    { id: 'marker.psyche.creativity',    weight: 0.85, evidence: { confidence: 0.7 } },
    { id: 'marker.creative.expression',  weight: 0.75, evidence: { confidence: 0.7 } },
  ],
  healer: [
    { id: 'marker.psyche.empathy',       weight: 0.85, evidence: { confidence: 0.7 } },
    { id: 'marker.spiritual.healing',    weight: 0.80, evidence: { confidence: 0.7 } },
  ],
  guardian: [
    { id: 'marker.psyche.guardian',      weight: 0.80, evidence: { confidence: 0.7 } },
    { id: 'marker.love.protective',      weight: 0.75, evidence: { confidence: 0.7 } },
  ],
};

export function destinyToEvent(profileId: string): ContributionEvent {
  const key = profileId.toLowerCase();
  const markers = DESTINY_MARKERS[key] ?? [];
  return buildEvent('quiz.destiny.v1', markers, [
    { id: `tag.archetype.${key}`, label: profileId, kind: 'archetype', weight: 0.85 },
  ]);
}

// ═══════════════════════════════════════════════════════════════
// RPG IDENTITY
// ═══════════════════════════════════════════════════════════════

const RPG_MARKERS: Record<string, Marker[]> = {
  paladin: [
    { id: 'marker.leadership.guardian',        weight: 0.80, evidence: { confidence: 0.7 } },
    { id: 'marker.social.protective',          weight: 0.70, evidence: { confidence: 0.7 } },
  ],
  berserker: [
    { id: 'marker.instinct.primal_force',      weight: 0.90, evidence: { confidence: 0.7 } },
    { id: 'marker.freedom.independence',       weight: 0.60, evidence: { confidence: 0.7 } },
  ],
  heiler: [
    { id: 'marker.emotion.empathy',            weight: 0.85, evidence: { confidence: 0.7 } },
    { id: 'marker.spiritual.healing',          weight: 0.70, evidence: { confidence: 0.7 } },
  ],
  nekromant: [
    { id: 'marker.cognition.shadow_work',      weight: 0.80, evidence: { confidence: 0.7 } },
    { id: 'marker.spiritual.depth',            weight: 0.75, evidence: { confidence: 0.7 } },
  ],
  stratege: [
    { id: 'marker.cognition.system_thinking',  weight: 0.85, evidence: { confidence: 0.7 } },
    { id: 'marker.leadership.planner',         weight: 0.70, evidence: { confidence: 0.7 } },
  ],
  seher: [
    { id: 'marker.instinct.gut_feeling',       weight: 0.80, evidence: { confidence: 0.7 } },
    { id: 'marker.spiritual.vision',           weight: 0.75, evidence: { confidence: 0.7 } },
  ],
};

export function rpgIdentityToEvent(profileId: string): ContributionEvent {
  const key = profileId.toLowerCase();
  const markers = RPG_MARKERS[key] ?? [];
  return buildEvent('quiz.rpg_identity.v1', markers, [
    { id: `tag.archetype.${key}`, label: profileId, kind: 'archetype', weight: 0.85 },
  ]);
}

// ═══════════════════════════════════════════════════════════════
// PARTY NEED
// ═══════════════════════════════════════════════════════════════

const PARTY_MARKERS: Record<string, string> = {
  social:     'marker.lifestyle.extroversion',
  energy:     'marker.lifestyle.spontaneity',
  intimacy:   'marker.lifestyle.warmth',
  adventure:  'marker.lifestyle.adventure',
};

export function partyToEvent(
  scores: Record<string, number>,
  profileId: string,
): ContributionEvent {
  const maxScore = Math.max(...Object.values(scores), 1);
  const markers: Marker[] = Object.entries(PARTY_MARKERS)
    .filter(([dim]) => scores[dim] != null)
    .map(([dim, id]) => ({
      id,
      weight: Math.min((scores[dim] ?? 0) / maxScore, 1),
      evidence: { confidence: 0.65, itemsAnswered: 10 },
    }));

  return buildEvent('quiz.party_need.v1', markers, [
    { id: `tag.style.${profileId}`, label: profileId, kind: 'style', weight: 0.7 },
  ]);
}

// ═══════════════════════════════════════════════════════════════
// CELEBRITY SOULMATE
// ═══════════════════════════════════════════════════════════════

const CELEB_MARKERS: Record<string, string> = {
  charisma:    'marker.social.charisma',
  creativity:  'marker.creative.creativity',
  empathy:     'marker.social.empathy',
  ambition:    'marker.values.achievement',
};

export function celebritySoulmateToEvent(
  scores: Record<string, number>,
  profileId: string,
): ContributionEvent {
  const maxScore = Math.max(...Object.values(scores), 1);
  const markers: Marker[] = Object.entries(CELEB_MARKERS)
    .filter(([dim]) => scores[dim] != null)
    .map(([dim, id]) => ({
      id,
      weight: Math.min((scores[dim] ?? 0) / maxScore, 1),
      evidence: { confidence: 0.6, itemsAnswered: 10 },
    }));

  return buildEvent('quiz.celebrity_soulmate.v1', markers, [
    { id: `tag.archetype.${profileId}`, label: profileId, kind: 'archetype', weight: 0.7 },
  ]);
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

**Step 3: Commit**

```bash
git add src/lib/fusion-ring/quiz-to-event.ts
git commit -m "feat: add event mappers for all 12 new Paket 5 quizzes"
```

---

### Task 4: Implement cluster-gated signal filtering in useFusionRing

**Files:**
- Modify: `src/hooks/useFusionRing.ts`

**Step 1: Add cluster imports and gated filtering**

Add imports at top:
```typescript
import { findClusterForModule, isClusterComplete, CLUSTER_REGISTRY } from '@/src/lib/fusion-ring/clusters';
```

Replace the existing `T` computation (line 64):
```typescript
const T = useMemo(() => fuseAllEvents(events), [events]);
```

With cluster-gated version:
```typescript
  // T(s) — only fire events whose cluster is complete (or standalone)
  const activeEvents = useMemo(() => {
    const completedIds = new Set(events.map(e => e.source.moduleId));
    return events.filter(e => {
      const cluster = findClusterForModule(e.source.moduleId);
      if (!cluster) return true; // standalone → immediately active
      return isClusterComplete(cluster, completedIds);
    });
  }, [events]);

  const T = useMemo(() => fuseAllEvents(activeEvents), [activeEvents]);
```

Replace the resolution computation in the `signal` useMemo (line 67-72). Change the `completedQuizzes` calculation:
```typescript
  const signal: FusionRingSignal | null = useMemo(() => {
    if (!apiResults) return null;
    // Resolution counts completed clusters, not individual quizzes
    const completedIds = new Set(events.map(e => e.source.moduleId));
    const completedClusters = CLUSTER_REGISTRY.filter(c =>
      isClusterComplete(c, completedIds)
    ).length;
    return computeFusionSignal(W, B, X, T, completedClusters, CLUSTER_REGISTRY.length);
  }, [W, B, X, T, apiResults, events]);
```

Remove the `totalQuizzes` parameter from the function signature (it's now derived from `CLUSTER_REGISTRY.length`).

**Step 2: Update function signature**

Change:
```typescript
export function useFusionRing(
  apiResults: ApiResults | null,
  userId?: string,
  totalQuizzes: number = 3,
) {
```

To:
```typescript
export function useFusionRing(
  apiResults: ApiResults | null,
  userId?: string,
) {
```

**Step 3: Verify TypeScript compiles and fix any callers**

Run: `npx tsc --noEmit` — fix any errors where `totalQuizzes` was passed.

**Step 4: Commit**

```bash
git add src/hooks/useFusionRing.ts
git commit -m "feat: cluster-gated signal filtering — events fire only when cluster complete"
```

---

## Phase 2: Quiz Portierung (12 new quizzes)

### Portierung Rules (apply to ALL quizzes)

For each quiz from QuizzMe:
1. Remove `'use client'`
2. Remove `import { contributeClient } from '@/lib/api'`
3. Remove `import { useClusterProgress } from '...'` and its `completeQuiz` calls
4. Remove `import { AlchemyButton, AlchemyLinkButton } from '...'` — replace with standard `<button>` elements styled with Tailwind
5. Remove `import { ValidationProfile } from './types'` — inline the type or import from local data
6. Change component interface to: `{ onComplete: (event: ContributionEvent) => void; onClose: () => void; }`
7. Replace `void contribute({...})` with `onComplete(event)` using the mapper from quiz-to-event.ts
8. Add `default export` for lazy-loading
9. Copy the data file (questions, profiles) inline or as a sibling file
10. Keep styling Morning-Theme compatible (the existing 3 quizzes show the pattern)

### Task 5: Port AuraColorsQuiz

**Files:**
- Create: `src/components/quizzes/AuraColorsQuiz.tsx`

**Step 1: Copy and adapt**

Source: `/Users/benjaminpoersch/Projects/WEB/QuizzMe/src/components/quizzes/AuraColorsQuiz.tsx`
Data source: `/Users/benjaminpoersch/Projects/WEB/QuizzMe/src/components/quizzes/aura-colors/data.ts`

Port following the rules above. The AuraColorsQuiz has:
- 12 questions with 4 dimensions (energiefluss, rhythmus, wahrnehmung, resonanz)
- Questions have per-option markers (collected during play)
- Profile calculation: normalizeScores → calculateColorScores → determinePrimaryColor/Secondary/Element
- Profiles: 7 aura colors (gold, indigo, emerald, violet, coral, silver, ruby)
- Use `auraToEvent(primaryAura, scores)` from quiz-to-event.ts for the event

Key adaptation: The data.ts file contains questions, profiles, calculateColorScores etc. — inline all of this into the component file or create `src/components/quizzes/aura-colors-data.ts`.

On result screen, call:
```typescript
const event = auraToEvent(result.primary.id, { warmth: ..., mystery: ..., authority: ... });
// Map dimension scores to aura marker dimensions
onComplete(event);
```

**Step 2: Verify TypeScript compiles**

**Step 3: Commit**

```bash
git add src/components/quizzes/AuraColorsQuiz.tsx
git commit -m "feat: port AuraColorsQuiz from QuizzMe"
```

---

### Task 6: Port BlumenwesenQuiz

**Files:**
- Create: `src/components/quizzes/BlumenwesenQuiz.tsx`

Source: QuizzMe BlumenwesenQuiz.tsx + blumenwesen/data.ts
- 10 questions, 4 dimensions (licht, wurzeln, rhythmus, wasser)
- 5 profiles (Sonnenblume, Lotusblume, Wildblume, Eiche, Rose)
- Use `blumenwesenToEvent(profileId)` for the event
- Follow same portierung rules

**Step 1: Copy, adapt, inline data**
**Step 2: Verify TypeScript compiles**
**Step 3: Commit**

```bash
git add src/components/quizzes/BlumenwesenQuiz.tsx
git commit -m "feat: port BlumenwesenQuiz from QuizzMe"
```

---

### Task 7: Port EnergiesteinQuiz

**Files:**
- Create: `src/components/quizzes/EnergiesteinQuiz.tsx`

Source: QuizzMe EnergiesteinQuiz.tsx + energiestein/data.ts
- 10 questions, 3 dimensions (clarity, energy, focus)
- 6 profiles (Amethyst, Obsidian, Citrin, Bergkristall, Rosenquarz, Tigerauge)
- Use `energiesteinToEvent(profileId)` for the event

**Step 1-3: Same as above**

```bash
git add src/components/quizzes/EnergiesteinQuiz.tsx
git commit -m "feat: port EnergiesteinQuiz from QuizzMe"
```

---

### Task 8: Port CharmeQuiz

**Files:**
- Create: `src/components/quizzes/CharmeQuiz.tsx`

Source: QuizzMe CharmeQuiz.tsx (self-contained, data inline)
- 12 questions, 4 dimensions (warmth, resonance, authenticity, presence)
- Profile-based result calculation
- Use `charmeToEvent(scores, profileId)` for the event

**Step 1-3: Same as above**

```bash
git add src/components/quizzes/CharmeQuiz.tsx
git commit -m "feat: port CharmeQuiz from QuizzMe"
```

---

### Task 9: Port EQQuiz

**Files:**
- Create: `src/components/quizzes/EQQuiz.tsx`

Source: QuizzMe EQQuiz.tsx (self-contained, data inline)
- 15 questions, 5 dimensions (self_awareness, self_regulation, motivation, empathy, social_skill)
- Use `eqToEvent(scores)` from quiz-to-event.ts (already exists)

**Step 1-3: Same as above**

```bash
git add src/components/quizzes/EQQuiz.tsx
git commit -m "feat: port EQQuiz from QuizzMe"
```

---

### Task 10: Port CareerDNAQuiz

**Files:**
- Create: `src/components/quizzes/CareerDNAQuiz.tsx`

Source: QuizzMe CareerDNAQuiz.tsx + careerdna/data.ts
- ~15 questions with career-oriented dimensions
- Use `careerDnaToEvent(scores, profileId)` for the event

**Step 1-3: Same as above**

```bash
git add src/components/quizzes/CareerDNAQuiz.tsx
git commit -m "feat: port CareerDNAQuiz from QuizzMe"
```

---

### Task 11: Port SocialRoleQuiz

**Files:**
- Create: `src/components/quizzes/SocialRoleQuiz.tsx`

Source: QuizzMe SocialRoleQuiz.tsx + social-role/data.ts
- Use `socialRoleToEvent(roleId, scores)` (already exists in quiz-to-event.ts)

**Step 1-3: Same as above**

```bash
git add src/components/quizzes/SocialRoleQuiz.tsx
git commit -m "feat: port SocialRoleQuiz from QuizzMe"
```

---

### Task 12: Port SpotlightQuiz

**Files:**
- Create: `src/components/quizzes/SpotlightQuiz.tsx`

Source: QuizzMe SpotlightQuiz.tsx + spotlight/data.ts
- Use `spotlightToEvent(profileId, scores)` for the event

**Step 1-3: Same as above**

```bash
git add src/components/quizzes/SpotlightQuiz.tsx
git commit -m "feat: port SpotlightQuiz from QuizzMe"
```

---

### Task 13: Port DestinyQuiz

**Files:**
- Create: `src/components/quizzes/DestinyQuiz.tsx`

Source: QuizzMe DestinyQuiz.tsx (self-contained)
- ~500 lines, narrative style
- Use `destinyToEvent(profileId)` for the event

**Step 1-3: Same as above**

```bash
git add src/components/quizzes/DestinyQuiz.tsx
git commit -m "feat: port DestinyQuiz from QuizzMe"
```

---

### Task 14: Port RpgIdentityQuiz

**Files:**
- Create: `src/components/quizzes/RpgIdentityQuiz.tsx`

Source: QuizzMe RpgIdentityQuiz.tsx + rpg-identity/data.ts
- 6 profiles: Paladin, Berserker, Heiler, Nekromant, Stratege, Seher
- Use `rpgIdentityToEvent(profileId)` for the event
- NOTE: This quiz had no markers in QuizzMe — they're now defined in the RPG_MARKERS constant

**Step 1-3: Same as above**

```bash
git add src/components/quizzes/RpgIdentityQuiz.tsx
git commit -m "feat: port RpgIdentityQuiz from QuizzMe with new marker mappings"
```

---

### Task 15: Port PartyQuiz

**Files:**
- Create: `src/components/quizzes/PartyQuiz.tsx`

Source: QuizzMe PartyQuiz.tsx + party/data.ts
- Use `partyToEvent(scores, profileId)` for the event

**Step 1-3: Same as above**

```bash
git add src/components/quizzes/PartyQuiz.tsx
git commit -m "feat: port PartyQuiz from QuizzMe"
```

---

### Task 16: Port CelebritySoulmateQuiz

**Files:**
- Create: `src/components/quizzes/CelebritySoulmateQuiz.tsx`

Source: QuizzMe CelebritySoulmateQuiz.tsx + celebrity-soulmate/data.ts
- Use `celebritySoulmateToEvent(scores, profileId)` for the event

**Step 1-3: Same as above**

```bash
git add src/components/quizzes/CelebritySoulmateQuiz.tsx
git commit -m "feat: port CelebritySoulmateQuiz from QuizzMe"
```

---

### Task 17: Extend QuizOverlay with all 15 quiz lazy imports

**Files:**
- Modify: `src/components/QuizOverlay.tsx`

**Step 1: Add lazy imports for all 12 new quizzes**

After line 9 (existing lazy imports), add:
```typescript
const AuraColorsQuiz = lazy(() => import('./quizzes/AuraColorsQuiz'));
const BlumenwesenQuiz = lazy(() => import('./quizzes/BlumenwesenQuiz'));
const EnergiesteinQuiz = lazy(() => import('./quizzes/EnergiesteinQuiz'));
const CharmeQuiz = lazy(() => import('./quizzes/CharmeQuiz'));
const EQQuiz = lazy(() => import('./quizzes/EQQuiz'));
const CareerDNAQuiz = lazy(() => import('./quizzes/CareerDNAQuiz'));
const SocialRoleQuiz = lazy(() => import('./quizzes/SocialRoleQuiz'));
const SpotlightQuiz = lazy(() => import('./quizzes/SpotlightQuiz'));
const DestinyQuiz = lazy(() => import('./quizzes/DestinyQuiz'));
const RpgIdentityQuiz = lazy(() => import('./quizzes/RpgIdentityQuiz'));
const PartyQuiz = lazy(() => import('./quizzes/PartyQuiz'));
const CelebritySoulmateQuiz = lazy(() => import('./quizzes/CelebritySoulmateQuiz'));
```

**Step 2: Extend QUIZ_MAP**

Replace the existing QUIZ_MAP (line 24-28) with:
```typescript
const QUIZ_MAP: Record<string, React.LazyExoticComponent<React.ComponentType<QuizProps>>> = {
  love_languages: LoveLanguagesQuiz,
  krafttier: KrafttierQuiz,
  personality: PersonalityQuiz,
  aura_colors: AuraColorsQuiz,
  blumenwesen: BlumenwesenQuiz,
  energiestein: EnergiesteinQuiz,
  charme: CharmeQuiz,
  eq: EQQuiz,
  career_dna: CareerDNAQuiz,
  social_role: SocialRoleQuiz,
  spotlight: SpotlightQuiz,
  destiny: DestinyQuiz,
  rpg_identity: RpgIdentityQuiz,
  party_need: PartyQuiz,
  celebrity_soulmate: CelebritySoulmateQuiz,
};
```

**Step 3: Verify TypeScript compiles**
**Step 4: Commit**

```bash
git add src/components/QuizOverlay.tsx
git commit -m "feat: register all 15 quizzes in QuizOverlay lazy-load map"
```

---

## Phase 3: UI Components (Cluster Energy System)

### Task 18: Create ClusterCard component

**Files:**
- Create: `src/components/ClusterCard.tsx`

**Step 1: Build the ClusterCard**

```typescript
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, ChevronDown, ChevronUp, Check } from 'lucide-react';
import type { ClusterDef } from '@/src/lib/fusion-ring/clusters';
import { clusterProgress } from '@/src/lib/fusion-ring/clusters';

interface ClusterCardProps {
  cluster: ClusterDef;
  completedModules: Set<string>;
  onStartQuiz: (quizId: string) => void;
  isPremium: boolean;
  lang: 'de' | 'en';
}

// Map moduleId → quiz display ID (used by QuizOverlay QUIZ_MAP)
const MODULE_TO_QUIZ_ID: Record<string, string> = {
  'quiz.aura_colors.v1': 'aura_colors',
  'quiz.krafttier.v1': 'krafttier',
  'quiz.blumenwesen.v1': 'blumenwesen',
  'quiz.energiestein.v1': 'energiestein',
  'quiz.love_languages.v1': 'love_languages',
  'quiz.charme.v1': 'charme',
  'quiz.eq.v1': 'eq',
  'quiz.personality.v1': 'personality',
  'quiz.career_dna.v2': 'career_dna',
  'quiz.social_role.v2': 'social_role',
  'quiz.spotlight.v2': 'spotlight',
  'quiz.destiny.v1': 'destiny',
  'quiz.rpg_identity.v1': 'rpg_identity',
  'quiz.party_need.v1': 'party_need',
  'quiz.celebrity_soulmate.v1': 'celebrity_soulmate',
};

// Human-readable quiz names
const QUIZ_NAMES: Record<string, { de: string; en: string }> = {
  'quiz.aura_colors.v1': { de: 'Aura-Farben', en: 'Aura Colors' },
  'quiz.krafttier.v1': { de: 'Krafttier', en: 'Spirit Animal' },
  'quiz.blumenwesen.v1': { de: 'Blumenwesen', en: 'Flower Being' },
  'quiz.energiestein.v1': { de: 'Energiestein', en: 'Energy Stone' },
  'quiz.love_languages.v1': { de: 'Liebessprache', en: 'Love Language' },
  'quiz.charme.v1': { de: 'Charme', en: 'Charm' },
  'quiz.eq.v1': { de: 'EQ-Signatur', en: 'EQ Signature' },
  'quiz.personality.v1': { de: 'Persoenlichkeit', en: 'Personality' },
  'quiz.career_dna.v2': { de: 'Karriere-DNA', en: 'Career DNA' },
  'quiz.social_role.v2': { de: 'Soziale Rolle', en: 'Social Role' },
  'quiz.spotlight.v2': { de: 'Spotlight', en: 'Spotlight' },
  'quiz.destiny.v1': { de: 'Destiny', en: 'Destiny' },
  'quiz.rpg_identity.v1': { de: 'RPG-Identitaet', en: 'RPG Identity' },
  'quiz.party_need.v1': { de: 'Party-Beduerfnis', en: 'Party Need' },
  'quiz.celebrity_soulmate.v1': { de: 'Celebrity Soulmate', en: 'Celebrity Soulmate' },
};

export function ClusterCard({ cluster, completedModules, onStartQuiz, isPremium, lang }: ClusterCardProps) {
  const [expanded, setExpanded] = useState(false);
  const progress = clusterProgress(cluster, completedModules);
  const done = cluster.quizModuleIds.filter(id => completedModules.has(id)).length;
  const total = cluster.quizModuleIds.length;
  const isComplete = done === total;

  return (
    <motion.div
      className="relative rounded-xl border border-gold/10 bg-obsidian/80 backdrop-blur-sm overflow-hidden"
      style={{
        boxShadow: progress > 0 && !isComplete
          ? `inset 0 0 ${20 * progress}px ${cluster.color}30, 0 0 ${30 * progress}px ${cluster.color}15`
          : isComplete
          ? `inset 0 0 12px ${cluster.color}20`
          : 'none',
      }}
      animate={progress > 0 && !isComplete ? { scale: [1, 1.003, 1] } : {}}
      transition={progress > 0 && !isComplete ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        className="w-full flex items-center justify-between p-4 cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{cluster.icon}</span>
          <div className="text-left">
            <h3 className="font-serif text-base text-gold/90">{cluster.name}</h3>
            <span className="text-xs text-gold/40">
              {isComplete
                ? (lang === 'de' ? 'Abgeschlossen' : 'Completed')
                : `${done}/${total}`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isComplete && <Check className="w-4 h-4 text-emerald-500" />}
          {expanded ? <ChevronUp className="w-4 h-4 text-gold/40" /> : <ChevronDown className="w-4 h-4 text-gold/40" />}
        </div>
      </button>

      {/* Progress bar */}
      {!isComplete && (
        <div className="px-4 pb-2">
          <div className="h-1 rounded-full bg-gold/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: cluster.color }}
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      {/* Expanded quiz list */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {cluster.quizModuleIds.map((moduleId, idx) => {
                const quizDone = completedModules.has(moduleId);
                const isFirst = idx === 0;
                const needsPremium = !isFirst && !isPremium;
                const quizId = MODULE_TO_QUIZ_ID[moduleId];
                const name = QUIZ_NAMES[moduleId]?.[lang] ?? moduleId;

                return (
                  <button
                    key={moduleId}
                    type="button"
                    disabled={quizDone || needsPremium}
                    onClick={() => quizId && onStartQuiz(quizId)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                      quizDone
                        ? 'bg-gold/5 opacity-60'
                        : needsPremium
                        ? 'bg-gold/5 opacity-40 cursor-not-allowed'
                        : 'bg-gold/5 hover:bg-gold/10 cursor-pointer'
                    }`}
                  >
                    <span className="text-sm text-gold/80 truncate">{name}</span>
                    {quizDone ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : needsPremium ? (
                      <div className="flex items-center gap-1.5 text-gold/40 shrink-0">
                        <Lock className="w-3 h-3" />
                        <span className="text-xs">Premium</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gold/40 shrink-0">
                        {lang === 'de' ? 'Starten' : 'Start'} →
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
```

**Step 2: Verify TypeScript compiles**
**Step 3: Commit**

```bash
git add src/components/ClusterCard.tsx
git commit -m "feat: add ClusterCard component with progress, premium gating, and accordion"
```

---

### Task 19: Create ClusterEnergySystem component

**Files:**
- Create: `src/components/ClusterEnergySystem.tsx`

**Step 1: Build the component**

This replaces the old QUIZ_CATALOG grid. It places the FusionRing centered with 4 ClusterCards around it.

```typescript
import { FusionRing } from './FusionRing';
import { ClusterCard } from './ClusterCard';
import { CLUSTER_REGISTRY } from '@/src/lib/fusion-ring/clusters';
import type { FusionRingSignal } from '@/src/lib/fusion-ring';
import type { ContributionEvent } from '@/src/lib/lme/types';

interface ClusterEnergySystemProps {
  signal: FusionRingSignal | null;
  completedModules: Set<string>;
  onStartQuiz: (quizId: string) => void;
  isPremium: boolean;
  lang: 'de' | 'en';
}

export function ClusterEnergySystem({
  signal,
  completedModules,
  onStartQuiz,
  isPremium,
  lang,
}: ClusterEnergySystemProps) {
  return (
    <div className="flex flex-col items-center gap-8">
      {/* Ring */}
      {signal && (
        <div className="flex flex-col items-center gap-3">
          <FusionRing signal={signal} size={340} showLabels animated />
          {signal.resolution < 100 && (
            <p className="text-xs text-center text-gold/45">
              {lang === 'de'
                ? `Aufloesung: ${signal.resolution}% — Schliesse Cluster ab`
                : `Resolution: ${signal.resolution}% — Complete clusters`}
            </p>
          )}
        </div>
      )}

      {/* Cluster Cards */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        {CLUSTER_REGISTRY.map(cluster => (
          <ClusterCard
            key={cluster.id}
            cluster={cluster}
            completedModules={completedModules}
            onStartQuiz={onStartQuiz}
            isPremium={isPremium}
            lang={lang}
          />
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**
**Step 3: Commit**

```bash
git add src/components/ClusterEnergySystem.tsx
git commit -m "feat: add ClusterEnergySystem — Ring centered with 4 ClusterCards"
```

---

### Task 20: Integrate ClusterEnergySystem into Dashboard

**Files:**
- Modify: `src/components/Dashboard.tsx`

**Step 1: Add import**

```typescript
import { ClusterEnergySystem } from './ClusterEnergySystem';
```

**Step 2: Replace old QUIZ_CATALOG section**

Remove the `QUIZ_CATALOG` constant (lines 143-147).

Replace the quiz section (lines 957-1002) with:

```tsx
      {/* ═══ CLUSTER ENERGY SYSTEM ═════════════════════════════════ */}
      {onQuizComplete && (
        <motion.div className="mb-16" {...fadeIn(0.5)}>
          <SectionDivider
            label={lang === 'de' ? 'Persoenlichkeit' : 'Personality'}
            title={lang === 'de' ? 'Dein Energie-System' : 'Your Energy System'}
          />
          <ClusterEnergySystem
            signal={fusionSignal ?? null}
            completedModules={completedModules ?? new Set()}
            onStartQuiz={(quizId) => setActiveQuiz(quizId)}
            isPremium={isPremium}
            lang={lang}
          />
        </motion.div>
      )}

      {/* Quiz Overlay */}
      {onQuizComplete && (
        <QuizOverlay
          quizId={activeQuiz}
          onComplete={(event) => {
            onQuizComplete(event);
            setActiveQuiz(null);
          }}
          onClose={() => setActiveQuiz(null)}
        />
      )}
```

Note: The FusionRing that was previously rendered separately above the quiz section is now inside ClusterEnergySystem. Remove the standalone FusionRing rendering block (lines ~930-954) to avoid double-rendering.

**Step 3: Remove `totalQuizzes` prop passing if it exists**

Check if useFusionRing is called with totalQuizzes in any parent component and remove that parameter.

**Step 4: Verify TypeScript compiles**

Run: `npx tsc --noEmit`

**Step 5: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "feat: replace flat quiz grid with ClusterEnergySystem in Dashboard"
```

---

## Phase 4: Verification

### Task 21: Full verification pass

**Step 1: TypeScript check**

```bash
cd /Users/benjaminpoersch/Projects/WEB/Astro-Noctum/Astro-Noctum && npx tsc --noEmit
```

**Step 2: Lint check**

```bash
npm run lint 2>&1 | head -30
```

**Step 3: Dev server smoke test**

```bash
npm run dev
```

Open browser, verify:
- Dashboard loads
- FusionRing renders inside ClusterEnergySystem
- 4 ClusterCards visible with correct names/icons
- Clicking a cluster expands to show quiz list
- First quiz in each cluster has "Start" button
- Other quizzes show "Premium" lock (if not premium)
- Clicking Start opens QuizOverlay with correct quiz
- Completing a quiz updates the cluster progress
- Ring shows 0% until a full cluster is completed

**Step 4: Final commit if any fixes needed**

---

## File Summary

| Action | File | Lines (est.) |
|--------|------|-------------|
| CREATE | `src/lib/fusion-ring/clusters.ts` | ~65 |
| MODIFY | `src/lib/fusion-ring/index.ts` | +1 line |
| MODIFY | `src/lib/fusion-ring/affinity-map.ts` | +20 lines |
| MODIFY | `src/lib/fusion-ring/quiz-to-event.ts` | +250 lines |
| MODIFY | `src/hooks/useFusionRing.ts` | ~15 lines changed |
| CREATE | 12x `src/components/quizzes/*.tsx` | ~300-700 each |
| MODIFY | `src/components/QuizOverlay.tsx` | +15 lines |
| CREATE | `src/components/ClusterCard.tsx` | ~160 |
| CREATE | `src/components/ClusterEnergySystem.tsx` | ~60 |
| MODIFY | `src/components/Dashboard.tsx` | ~20 lines changed |

## Acceptance Criteria

1. All 15 quizzes playable in QuizOverlay
2. Each quiz produces valid ContributionEvent with markers
3. Ring shows 0% while no cluster is complete
4. Ring jumps to 25% when first cluster completed
5. ClusterCards show correct progress (0/4, 1/4, etc.)
6. First quiz per cluster free, rest show Premium lock
7. Mobile: Cards stack vertically, Ring above
8. Desktop: 2-column card grid below Ring
9. `npx tsc --noEmit` passes
