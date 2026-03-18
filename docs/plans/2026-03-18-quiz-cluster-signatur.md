# Quiz-Cluster auf der Signatur-Seite — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Mount glassmorphic cluster panels beside the Signatur ring on `/signatur`, wire up QuizOverlay + useQuizContribution, add pipeline animation when a cluster completes, and pass quiz weights through to the V2 engine.

**Architecture:** The page layout becomes a two-column flex (`sidebar | ring`). The sidebar renders 6 cluster panels from `CLUSTER_REGISTRY`, each showing quiz slots with completion state from Supabase `contribution_events`. Clicking a slot opens `QuizOverlay`; on cluster completion a CSS particle animation plays from panel to ring. All quiz infrastructure (overlay, contribution hook, event converters, clusters) is already production-ready — we only mount and wire it.

**Tech Stack:** React 19, Tailwind CSS v4, motion/react (framer-motion), Supabase JS, existing `clusters.ts` / `QuizOverlay` / `useQuizContribution`

---

## Existing Code — DO NOT MODIFY

| File | Role |
|------|------|
| `src/lib/fusion-ring/clusters.ts` | `CLUSTER_REGISTRY`, `isClusterComplete()`, `clusterProgress()`, `findClusterForModule()` |
| `src/components/ClusterCard.tsx` | Reference for `MODULE_TO_QUIZ_ID` and `QUIZ_NAMES` maps (we'll import these) |
| `src/components/QuizOverlay.tsx` | Modal overlay, `QUIZ_MAP` for all 22 quizzes. Props: `{ quizId, onComplete, onClose }` |
| `src/hooks/useQuizContribution.ts` | `useQuizContribution(completedModuleIds)` → callback for `onComplete` |
| `src/lib/fusion-ring/quiz-to-event.ts` | All 22 event converters |
| `src/services/contribute.ts` | `contributeQuizResult()` — HTTP client for `/api/contribute` |
| `server.mjs:863-912` | `/api/contribute` endpoint → upsert `contribution_events` |
| `src/components/quizzes/*` | All 22 quiz components |
| `src/components/fusion-ring-website/signatur-bridge.ts` | `soulprintToNatalWeights()`, `quizSectorsToQuizWeights()` |
| `src/hooks/useFusionSignal.ts` | Polls `/api/transit-state/:userId` every 800ms — auto-updates ring |

---

## Task 1: Extract shared quiz maps from ClusterCard

**Files:**
- Create: `src/lib/fusion-ring/quiz-maps.ts`
- Modify: `src/components/ClusterCard.tsx:16-67`
- Test: `src/__tests__/quiz-maps.test.ts`

We need `MODULE_TO_QUIZ_ID` and `QUIZ_NAMES` in both ClusterCard and the new ClusterSidebar. Extract them to a shared module.

**Step 1: Write the failing test**

```ts
// src/__tests__/quiz-maps.test.ts
import { describe, it, expect } from 'vitest';
import { MODULE_TO_QUIZ_ID, QUIZ_NAMES } from '@/src/lib/fusion-ring/quiz-maps';
import { CLUSTER_REGISTRY } from '@/src/lib/fusion-ring/clusters';

describe('quiz-maps', () => {
  it('MODULE_TO_QUIZ_ID covers every module in CLUSTER_REGISTRY', () => {
    const allModules = CLUSTER_REGISTRY.flatMap(c => c.quizModuleIds);
    for (const moduleId of allModules) {
      expect(MODULE_TO_QUIZ_ID[moduleId], `Missing mapping for ${moduleId}`).toBeDefined();
    }
  });

  it('QUIZ_NAMES covers every module in CLUSTER_REGISTRY', () => {
    const allModules = CLUSTER_REGISTRY.flatMap(c => c.quizModuleIds);
    for (const moduleId of allModules) {
      expect(QUIZ_NAMES[moduleId], `Missing name for ${moduleId}`).toBeDefined();
      expect(QUIZ_NAMES[moduleId].de).toBeTruthy();
      expect(QUIZ_NAMES[moduleId].en).toBeTruthy();
    }
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/quiz-maps.test.ts`
Expected: FAIL — module `quiz-maps` does not exist

**Step 3: Create the shared module**

Move `MODULE_TO_QUIZ_ID` and `QUIZ_NAMES` from `ClusterCard.tsx:16-67` into `src/lib/fusion-ring/quiz-maps.ts`:

```ts
// src/lib/fusion-ring/quiz-maps.ts

/** Map moduleId → quiz display ID (key for QuizOverlay's QUIZ_MAP) */
export const MODULE_TO_QUIZ_ID: Record<string, string> = {
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
  'quiz.kinky_01.v1': 'kinky_01',
  'quiz.kinky_02.v1': 'kinky_02',
  'quiz.kinky_03.v1': 'kinky_03',
  'quiz.kinky_04.v1': 'kinky_04',
  'quiz.partner_match_01.v1': 'partner_match_01',
  'quiz.partner_match_02.v1': 'partner_match_02',
  'quiz.partner_match_03.v1': 'partner_match_03',
  'quiz.partner_convo.v1': 'partner_convo',
};

/** Human-readable quiz names (de/en) */
export const QUIZ_NAMES: Record<string, { de: string; en: string }> = {
  'quiz.aura_colors.v1': { de: 'Aura-Farben', en: 'Aura Colors' },
  'quiz.krafttier.v1': { de: 'Krafttier', en: 'Spirit Animal' },
  'quiz.blumenwesen.v1': { de: 'Blumenwesen', en: 'Flower Being' },
  'quiz.energiestein.v1': { de: 'Energiestein', en: 'Energy Stone' },
  'quiz.love_languages.v1': { de: 'Liebessprache', en: 'Love Language' },
  'quiz.charme.v1': { de: 'Charme', en: 'Charm' },
  'quiz.eq.v1': { de: 'EQ-Signatur', en: 'EQ Signature' },
  'quiz.personality.v1': { de: 'Persönlichkeit', en: 'Personality' },
  'quiz.career_dna.v2': { de: 'Karriere-DNA', en: 'Career DNA' },
  'quiz.social_role.v2': { de: 'Soziale Rolle', en: 'Social Role' },
  'quiz.spotlight.v2': { de: 'Spotlight', en: 'Spotlight' },
  'quiz.destiny.v1': { de: 'Destiny', en: 'Destiny' },
  'quiz.rpg_identity.v1': { de: 'RPG-Identität', en: 'RPG Identity' },
  'quiz.party_need.v1': { de: 'Party-Bedürfnis', en: 'Party Need' },
  'quiz.celebrity_soulmate.v1': { de: 'Celebrity Soulmate', en: 'Celebrity Soulmate' },
  'quiz.kinky_01.v1': { de: 'Sichtbarkeit', en: 'Visibility' },
  'quiz.kinky_02.v1': { de: 'Innerer Antrieb', en: 'Inner Drive' },
  'quiz.kinky_03.v1': { de: 'Grenzbereitschaft', en: 'Boundary Readiness' },
  'quiz.kinky_04.v1': { de: 'Identität', en: 'Identity' },
  'quiz.partner_match_01.v1': { de: 'Chemie & Ausdruck', en: 'Chemistry & Expression' },
  'quiz.partner_match_02.v1': { de: 'Alltag & Eigenarten', en: 'Everyday Fit & Quirks' },
  'quiz.partner_match_03.v1': { de: 'Vorlieben & Lebensstil', en: 'Preferences & Lifestyle' },
  'quiz.partner_convo.v1': { de: 'Gesprächs-Analyse', en: 'Conversation Analysis' },
};
```

**Step 4: Update ClusterCard to import from shared module**

In `src/components/ClusterCard.tsx`, replace the inline `MODULE_TO_QUIZ_ID` and `QUIZ_NAMES` declarations (lines 16-67) with:

```ts
import { MODULE_TO_QUIZ_ID, QUIZ_NAMES } from '@/src/lib/fusion-ring/quiz-maps';
```

**Step 5: Run test to verify it passes**

Run: `npx vitest run src/__tests__/quiz-maps.test.ts`
Expected: PASS

**Step 6: Run full test suite to check no regressions**

Run: `npm run test`
Expected: All existing tests pass

**Step 7: Commit**

```bash
git add src/lib/fusion-ring/quiz-maps.ts src/__tests__/quiz-maps.test.ts src/components/ClusterCard.tsx
git commit -m "refactor(AN): extract MODULE_TO_QUIZ_ID and QUIZ_NAMES to shared quiz-maps module"
```

---

## Task 2: Create useCompletedModules hook

**Files:**
- Create: `src/hooks/useCompletedModules.ts`
- Test: `src/__tests__/useCompletedModules.test.ts`

This hook loads `contribution_events` from Supabase on mount and returns a `Set<string>` of completed module IDs. It also provides an `addModule(id)` function for optimistic local updates after quiz completion.

**Step 1: Write the failing test**

```ts
// src/__tests__/useCompletedModules.test.ts
import { describe, it, expect, vi } from 'vitest';

// We test the pure logic, not the hook itself (avoids Supabase mocking).
// The hook is thin: fetch → Set<string>. We test the Set operations.
describe('useCompletedModules logic', () => {
  it('builds a Set from an array of module_id rows', () => {
    const rows = [
      { module_id: 'quiz.aura_colors.v1' },
      { module_id: 'quiz.krafttier.v1' },
    ];
    const set = new Set(rows.map(r => r.module_id));
    expect(set.has('quiz.aura_colors.v1')).toBe(true);
    expect(set.has('quiz.krafttier.v1')).toBe(true);
    expect(set.has('quiz.eq.v1')).toBe(false);
    expect(set.size).toBe(2);
  });

  it('addModule creates a new Set with the added module', () => {
    const prev = new Set(['quiz.aura_colors.v1']);
    const next = new Set([...prev, 'quiz.eq.v1']);
    expect(next.size).toBe(2);
    expect(next.has('quiz.eq.v1')).toBe(true);
    // Original unchanged (immutable update)
    expect(prev.size).toBe(1);
  });
});
```

**Step 2: Run test to verify it passes (pure logic test)**

Run: `npx vitest run src/__tests__/useCompletedModules.test.ts`
Expected: PASS (this tests the logic pattern, not the hook)

**Step 3: Write the hook**

```ts
// src/hooks/useCompletedModules.ts
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/contexts/AuthContext';

export function useCompletedModules() {
  const { user } = useAuth();
  const [completedModuleIds, setCompletedModuleIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCompletedModuleIds(new Set());
      setLoading(false);
      return;
    }

    supabase
      .from('contribution_events')
      .select('module_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) {
          setCompletedModuleIds(new Set(data.map(r => r.module_id)));
        }
        setLoading(false);
      });
  }, [user]);

  const addModule = useCallback((moduleId: string) => {
    setCompletedModuleIds(prev => new Set([...prev, moduleId]));
  }, []);

  return { completedModuleIds, loading, addModule };
}
```

**Step 4: Commit**

```bash
git add src/hooks/useCompletedModules.ts src/__tests__/useCompletedModules.test.ts
git commit -m "feat(AN): add useCompletedModules hook for loading quiz completion state from Supabase"
```

---

## Task 3: Create useQuizSuggestion hook

**Files:**
- Create: `src/hooks/useQuizSuggestion.ts`
- Test: `src/__tests__/useQuizSuggestion.test.ts`

Once-daily 30% chance to highlight an open quiz slot in the sidebar.

**Step 1: Write the failing test**

```ts
// src/__tests__/useQuizSuggestion.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pickSuggestion } from '@/src/hooks/useQuizSuggestion';
import { CLUSTER_REGISTRY } from '@/src/lib/fusion-ring/clusters';

describe('pickSuggestion', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when all modules are completed', () => {
    const allModules = new Set(CLUSTER_REGISTRY.flatMap(c => c.quizModuleIds));
    expect(pickSuggestion(allModules)).toBeNull();
  });

  it('returns null when already suggested today', () => {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem('bazodiac_quiz_last_suggestion', today);
    expect(pickSuggestion(new Set())).toBeNull();
  });

  it('returns a moduleId from open modules when RNG hits and not yet suggested today', () => {
    // Force Math.random to return 0.1 (< 0.3 threshold)
    vi.spyOn(Math, 'random').mockReturnValue(0.1);
    const completed = new Set(['quiz.aura_colors.v1']);
    const result = pickSuggestion(completed);
    expect(result).toBeTruthy();
    expect(completed.has(result!)).toBe(false);
    // Verify localStorage was set
    const today = new Date().toISOString().slice(0, 10);
    expect(localStorage.getItem('bazodiac_quiz_last_suggestion')).toBe(today);
    vi.restoreAllMocks();
  });

  it('returns null when RNG misses (> 0.3)', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const result = pickSuggestion(new Set());
    expect(result).toBeNull();
    vi.restoreAllMocks();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/useQuizSuggestion.test.ts`
Expected: FAIL — `pickSuggestion` not found

**Step 3: Write the hook and exported pure function**

```ts
// src/hooks/useQuizSuggestion.ts
import { useEffect, useState } from 'react';
import { CLUSTER_REGISTRY } from '@/src/lib/fusion-ring/clusters';

const STORAGE_KEY = 'bazodiac_quiz_last_suggestion';

/** Pure function — exported for testing */
export function pickSuggestion(completedModuleIds: Set<string>): string | null {
  const today = new Date().toISOString().slice(0, 10);
  if (localStorage.getItem(STORAGE_KEY) === today) return null;
  if (Math.random() > 0.3) return null;

  const allModules = CLUSTER_REGISTRY.flatMap(c => c.quizModuleIds);
  const open = allModules.filter(id => !completedModuleIds.has(id));
  if (open.length === 0) return null;

  const pick = open[Math.floor(Math.random() * open.length)];
  localStorage.setItem(STORAGE_KEY, today);
  return pick;
}

export function useQuizSuggestion(completedModuleIds: Set<string>) {
  const [suggestedModule, setSuggestedModule] = useState<string | null>(null);

  useEffect(() => {
    setSuggestedModule(pickSuggestion(completedModuleIds));
  }, [completedModuleIds]);

  return suggestedModule;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/useQuizSuggestion.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/hooks/useQuizSuggestion.ts src/__tests__/useQuizSuggestion.test.ts
git commit -m "feat(AN): add useQuizSuggestion hook with 30% daily quiz suggestion"
```

---

## Task 4: Hide debug panels in FusionRing3D

**Files:**
- Modify: `src/components/fusion-ring-3d/FusionRing3D.tsx:64`

Currently `isInteractive` defaults to `true`, showing RESONANZSPRUNG/DOMINANZWECHSEL effect buttons and INGEST/DEMO panels in production. Change default to dev-only.

**Step 1: Read the current default**

File: `src/components/fusion-ring-3d/FusionRing3D.tsx:62-66`
```ts
export const FusionRing3D = ({
  userId,
  isInteractive = true,  // ← change this
  labels,
}: FusionRing3DProps) => {
```

**Step 2: Change default to false**

Change line 64 from:
```ts
  isInteractive = true,
```
to:
```ts
  isInteractive = false,
```

This hides: V2's `showUI` config panel, V1's `showEffectControls` (already gated by `DEV`).

**Step 3: Verify V2 path passes showUI correctly**

File: `src/components/fusion-ring-3d/FusionRing3D.tsx:109-114`
```tsx
<FusionRingCanvasV2
  natalWeights={v2NatalWeights}
  showUI={isInteractive}   // ← this is correct, will be false
  className="h-full w-full"
/>
```

V1 path at line 118 already uses `showEffectControls={isInteractive && !!import.meta.env.DEV}` — correct.

**Step 4: Run build to verify no type errors**

Run: `npm run lint`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/fusion-ring-3d/FusionRing3D.tsx
git commit -m "fix(AN): hide debug panels in FusionRing3D by defaulting isInteractive to false"
```

---

## Task 5: Wire quizWeights through FusionRing3D to V2

**Files:**
- Modify: `src/components/fusion-ring-3d/FusionRing3D.tsx`

Currently the V2 engine accepts a `quizWeights` prop but FusionRing3D never passes it. The transit-state schema doesn't carry quiz_sectors either — but the `contribution_events` POST triggers a re-fetch via `useFusionSignal`. The signal data's `baseSignals` already reflects quiz contributions server-side (FuFirE merges them).

However, for direct quiz→ring reactivity _before_ the server round-trip, we should support an optional `quizWeights` prop passthrough.

**Step 1: Add optional `quizWeights` to FusionRing3DProps**

In `src/components/fusion-ring-3d/FusionRing3D.tsx`, add to the props type (line 28-33):

```ts
type FusionRing3DProps = {
  userId: string;
  isInteractive?: boolean;
  onSpikeClick?: (sector: number) => void;
  labels: FusionRing3DLabels;
  quizWeights?: Record<string, number>;  // ← ADD
};
```

**Step 2: Destructure and pass to V2**

In the component signature (line 62-66), add `quizWeights`:

```ts
export const FusionRing3D = ({
  userId,
  isInteractive = false,
  labels,
  quizWeights,  // ← ADD
}: FusionRing3DProps) => {
```

In the V2 render (line 109-114):

```tsx
<FusionRingCanvasV2
  natalWeights={v2NatalWeights}
  quizWeights={quizWeights}  // ← ADD
  showUI={isInteractive}
  className="h-full w-full"
/>
```

**Step 3: Run build to verify no type errors**

Run: `npm run lint`
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/fusion-ring-3d/FusionRing3D.tsx
git commit -m "feat(AN): pass quizWeights through FusionRing3D to V2 canvas"
```

---

## Task 6: Create ClusterSidebar component

**Files:**
- Create: `src/components/signatur/ClusterSidebar.tsx`

This is the main new UI component — glassmorphic cluster panels with quiz slots.

**Step 1: Create the component**

```tsx
// src/components/signatur/ClusterSidebar.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Check, ChevronDown, ChevronUp } from 'lucide-react';
import {
  CLUSTER_REGISTRY,
  clusterProgress,
  isClusterComplete,
  type ClusterDef,
} from '@/src/lib/fusion-ring/clusters';
import { MODULE_TO_QUIZ_ID, QUIZ_NAMES } from '@/src/lib/fusion-ring/quiz-maps';

interface ClusterSidebarProps {
  completedModuleIds: Set<string>;
  onStartQuiz: (quizId: string) => void;
  isPremium: boolean;
  lang: 'de' | 'en';
  suggestedModule: string | null;
}

function ClusterPanel({
  cluster,
  completedModuleIds,
  onStartQuiz,
  isPremium,
  lang,
  suggestedModule,
}: {
  cluster: ClusterDef;
  completedModuleIds: Set<string>;
  onStartQuiz: (quizId: string) => void;
  isPremium: boolean;
  lang: 'de' | 'en';
  suggestedModule: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const progress = clusterProgress(cluster, completedModuleIds);
  const complete = isClusterComplete(cluster, completedModuleIds);
  const done = cluster.quizModuleIds.filter(id => completedModuleIds.has(id)).length;
  const total = cluster.quizModuleIds.length;

  return (
    <div
      className="relative rounded-2xl border transition-all duration-300"
      style={{
        backdropFilter: 'blur(12px)',
        background: complete
          ? `linear-gradient(135deg, ${cluster.color}18, ${cluster.color}08)`
          : 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
        borderColor: complete ? `${cluster.color}60` : 'rgba(255,255,255,0.1)',
        boxShadow: complete ? `0 0 24px ${cluster.color}30` : 'none',
      }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        className="flex w-full cursor-pointer items-center justify-between p-3"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-lg">{cluster.icon}</span>
          <div className="text-left">
            <h3 className="text-sm font-medium text-white/90">{cluster.name}</h3>
            <span className="text-[10px] text-white/40">
              {complete
                ? (lang === 'de' ? 'Abgeschlossen' : 'Completed')
                : `${done}/${total}`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {complete && <Check className="h-3.5 w-3.5 text-emerald-400" />}
          {expanded
            ? <ChevronUp className="h-3.5 w-3.5 text-white/30" />
            : <ChevronDown className="h-3.5 w-3.5 text-white/30" />
          }
        </div>
      </button>

      {/* Progress bar */}
      {!complete && progress > 0 && (
        <div className="px-3 pb-2">
          <div className="h-0.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: cluster.color }}
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      )}

      {/* Quiz slots */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-1.5 px-3 pb-3">
              {cluster.quizModuleIds.map((moduleId) => {
                const quizDone = completedModuleIds.has(moduleId);
                const quizId = MODULE_TO_QUIZ_ID[moduleId];
                const name = QUIZ_NAMES[moduleId]?.[lang] ?? moduleId;
                const isSuggested = suggestedModule === moduleId;
                const needsPremium = (
                  cluster.id === 'cluster.kinky.v1' ||
                  cluster.id === 'cluster.partner_match.v1'
                ) && !isPremium;

                return (
                  <button
                    key={moduleId}
                    type="button"
                    disabled={quizDone || needsPremium}
                    onClick={() => quizId && onStartQuiz(quizId)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-all ${
                      quizDone
                        ? 'border opacity-60'
                        : needsPremium
                        ? 'cursor-not-allowed border border-white/5 bg-white/[0.02] opacity-30'
                        : 'cursor-pointer border border-white/5 bg-white/[0.04] hover:bg-white/[0.08]'
                    }`}
                    style={
                      quizDone
                        ? {
                            background: `linear-gradient(135deg, ${cluster.color}30, ${cluster.color}15)`,
                            borderColor: `${cluster.color}50`,
                            boxShadow: `0 0 8px ${cluster.color}20`,
                          }
                        : isSuggested && !needsPremium
                        ? {
                            borderColor: '#D4AF37',
                            boxShadow: '0 0 12px rgba(212,175,55,0.25)',
                            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                          }
                        : undefined
                    }
                  >
                    <span className={quizDone ? 'text-white/80' : 'text-white/50'}>
                      {name}
                    </span>
                    {quizDone ? (
                      <Check className="h-3 w-3 shrink-0 text-emerald-400" />
                    ) : needsPremium ? (
                      <Lock className="h-3 w-3 shrink-0 text-white/20" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ClusterSidebar({
  completedModuleIds,
  onStartQuiz,
  isPremium,
  lang,
  suggestedModule,
}: ClusterSidebarProps) {
  return (
    <nav
      aria-label={lang === 'de' ? 'Quiz-Cluster' : 'Quiz clusters'}
      className="flex w-64 shrink-0 flex-col gap-2 overflow-y-auto pr-1"
    >
      {CLUSTER_REGISTRY.map(cluster => (
        <ClusterPanel
          key={cluster.id}
          cluster={cluster}
          completedModuleIds={completedModuleIds}
          onStartQuiz={onStartQuiz}
          isPremium={isPremium}
          lang={lang}
          suggestedModule={suggestedModule}
        />
      ))}
    </nav>
  );
}
```

**Step 2: Run build to verify no type errors**

Run: `npm run lint`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/signatur/ClusterSidebar.tsx
git commit -m "feat(AN): add ClusterSidebar glassmorphic component with quiz slots"
```

---

## Task 7: Create ClusterPipeline animation component

**Files:**
- Create: `src/components/signatur/ClusterPipeline.tsx`

CSS-only particle animation that plays once when a cluster completes. Shows a persistent glow line afterward.

**Step 1: Create the component**

```tsx
// src/components/signatur/ClusterPipeline.tsx
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface ClusterPipelineProps {
  clusterId: string;
  clusterColor: string;
  isComplete: boolean;
}

const STORAGE_PREFIX = 'bazodiac_pipeline_shown_';

export function ClusterPipeline({ clusterId, clusterColor, isComplete }: ClusterPipelineProps) {
  const [showAnimation, setShowAnimation] = useState(false);
  const [showStaticLine, setShowStaticLine] = useState(false);
  const storageKey = `${STORAGE_PREFIX}${clusterId}`;

  useEffect(() => {
    if (!isComplete) return;

    const alreadyShown = localStorage.getItem(storageKey) === 'true';
    if (alreadyShown) {
      setShowStaticLine(true);
      return;
    }

    // First time seeing this cluster complete — animate
    setShowAnimation(true);
    localStorage.setItem(storageKey, 'true');

    const timer = setTimeout(() => {
      setShowAnimation(false);
      setShowStaticLine(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isComplete, storageKey]);

  if (!isComplete) return null;

  return (
    <div className="pointer-events-none relative my-1 flex items-center justify-center">
      {showAnimation && (
        <motion.div
          className="absolute h-[2px] rounded-full"
          style={{
            background: `linear-gradient(90deg, ${clusterColor}, transparent)`,
            boxShadow: `0 0 8px ${clusterColor}, 0 0 20px ${clusterColor}60`,
          }}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: '100%', opacity: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      )}

      {showAnimation && (
        <motion.div
          className="absolute h-2 w-2 rounded-full"
          style={{
            backgroundColor: clusterColor,
            boxShadow: `0 0 12px ${clusterColor}, 0 0 24px ${clusterColor}80`,
          }}
          initial={{ x: '-50%', opacity: 1 }}
          animate={{ x: '150%', opacity: 0 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        />
      )}

      {showStaticLine && (
        <div
          className="h-[1px] w-full rounded-full opacity-40"
          style={{
            background: `linear-gradient(90deg, ${clusterColor}80, ${clusterColor}20)`,
            boxShadow: `0 0 4px ${clusterColor}40`,
          }}
        />
      )}
    </div>
  );
}
```

**Step 2: Run build to verify no type errors**

Run: `npm run lint`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/signatur/ClusterPipeline.tsx
git commit -m "feat(AN): add ClusterPipeline CSS animation for cluster→ring energy flow"
```

---

## Task 8: Rewire FuRingPage — layout + QuizOverlay + sidebar

**Files:**
- Modify: `src/pages/FuRingPage.tsx`

This is the main integration task. The page gets a two-column layout: sidebar (left) + ring (center/right). QuizOverlay is mounted, useCompletedModules and useQuizContribution wired up.

**Step 1: Rewrite FuRingPage**

Replace the entire content of `src/pages/FuRingPage.tsx` with:

```tsx
// src/pages/FuRingPage.tsx
import { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { useAppLayout } from '@/src/contexts/AppLayoutContext';
import { FusionRing3D } from '@/src/components/fusion-ring-3d/FusionRing3D';
import QuizOverlay from '@/src/components/QuizOverlay';
import { useQuizContribution } from '@/src/hooks/useQuizContribution';
import { useCompletedModules } from '@/src/hooks/useCompletedModules';
import { useQuizSuggestion } from '@/src/hooks/useQuizSuggestion';
import { usePremium } from '@/src/hooks/usePremium';
import { ClusterSidebar } from '@/src/components/signatur/ClusterSidebar';
import { ClusterPipeline } from '@/src/components/signatur/ClusterPipeline';
import {
  CLUSTER_REGISTRY,
  isClusterComplete,
  findClusterForModule,
} from '@/src/lib/fusion-ring/clusters';
import { quizSectorsToQuizWeights } from '@/src/components/fusion-ring-website/signatur-bridge';
import type { ContributionEvent } from '@/src/lib/lme/types';
import { eventToSectorSignals } from '@/src/lib/fusion-ring/test-signal';

export default function FuRingPage() {
  const { t, lang } = useLanguage();
  const { userId } = useAppLayout();
  const { isPremium } = usePremium();
  const { completedModuleIds, addModule } = useCompletedModules();
  const suggestedModule = useQuizSuggestion(completedModuleIds);
  const quizContribution = useQuizContribution(completedModuleIds);

  const [activeQuiz, setActiveQuiz] = useState<string | null>(null);
  const [justCompletedCluster, setJustCompletedCluster] = useState<string | null>(null);
  const [liveQuizWeights, setLiveQuizWeights] = useState<Record<string, number> | undefined>();

  const handleQuizComplete = useCallback((event: ContributionEvent) => {
    quizContribution(event);
    const moduleId = event.source?.moduleId;
    if (moduleId) {
      addModule(moduleId);

      // Check if this completion finishes a cluster
      const cluster = findClusterForModule(moduleId);
      if (cluster) {
        const updated = new Set([...completedModuleIds, moduleId]);
        if (isClusterComplete(cluster, updated)) {
          setJustCompletedCluster(cluster.id);
        }
      }

      // Compute live quizWeights for immediate ring reactivity
      const sectors = eventToSectorSignals(event);
      if (sectors && sectors.length === 12) {
        const normalized = sectors.map(s => (s + 1) / 2);
        setLiveQuizWeights(quizSectorsToQuizWeights(normalized));
      }
    }
    setActiveQuiz(null);
  }, [quizContribution, completedModuleIds, addModule]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#020509] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,180,216,0.18),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(212,175,55,0.2),transparent_42%),radial-gradient(circle_at_center,rgba(255,255,255,0.03),transparent_65%)]" />

      <section className="relative mx-auto flex w-full max-w-[1400px] flex-col gap-8 px-4 pb-20 pt-10 md:px-10 md:pt-20">
        {/* Header */}
        <header className="flex items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-[#D4AF37]/60 hover:text-[#D4AF37]"
            aria-label={lang === 'de' ? 'Zurück zum Dashboard' : 'Back to dashboard'}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('furing3d.back')}
          </Link>

          <div className="rounded-full border border-white/10 bg-black/45 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-white/65">
            {t('furing3d.badge')}
          </div>
        </header>

        {/* Title */}
        <div className="max-w-3xl space-y-4">
          <h1 className="font-serif text-3xl leading-tight text-[#D4AF37] md:text-5xl">
            {t('furing3d.title')}
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">
            {t('furing3d.subtitle')}
          </p>
        </div>

        {/* Main content: Sidebar + Ring */}
        <div className="flex gap-6">
          {/* Cluster Sidebar — hidden on mobile, shown on md+ */}
          <div className="hidden md:block">
            <ClusterSidebar
              completedModuleIds={completedModuleIds}
              onStartQuiz={setActiveQuiz}
              isPremium={isPremium}
              lang={lang}
              suggestedModule={suggestedModule}
            />

            {/* Pipeline animations for completed clusters */}
            {CLUSTER_REGISTRY.map(cluster => (
              <ClusterPipeline
                key={cluster.id}
                clusterId={cluster.id}
                clusterColor={cluster.color}
                isComplete={
                  isClusterComplete(cluster, completedModuleIds) ||
                  justCompletedCluster === cluster.id
                }
              />
            ))}
          </div>

          {/* Ring */}
          <div className="min-w-0 flex-1">
            <FusionRing3D
              userId={userId}
              quizWeights={liveQuizWeights}
              labels={{
                regionLabel: t('furing3d.a11y.regionLabel'),
                loading: t('furing3d.loading'),
                reducedMotionHint: t('furing3d.reducedMotionHint'),
                resolution: t('furing3d.resolutionLabel'),
                audioOn: t('furing3d.audioOn'),
                audioOff: t('furing3d.audioOff'),
                latestEvents: t('furing3d.latestEvents'),
                renderError: t('furing3d.renderError'),
                reload: t('furing3d.reload'),
                eventAnnouncePrefix: t('furing3d.eventAnnouncePrefix'),
              }}
            />
          </div>
        </div>

        {/* Info cards */}
        <div className="grid gap-3 md:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-black/35 p-4">
            <div className="mb-2 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/60">
              <Sparkles className="h-3 w-3 text-[#D4AF37]" />
              {t('furing3d.cards.resonanceTitle')}
            </div>
            <p className="text-sm text-white/75">{t('furing3d.cards.resonanceText')}</p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-black/35 p-4">
            <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/60">
              {t('furing3d.cards.spaceWeatherTitle')}
            </div>
            <p className="text-sm text-white/75">{t('furing3d.cards.spaceWeatherText')}</p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-black/35 p-4">
            <div className="mb-2 text-[10px] uppercase tracking-[0.2em] text-white/60">
              {t('furing3d.cards.accessibilityTitle')}
            </div>
            <p className="text-sm text-white/75">{t('furing3d.cards.accessibilityText')}</p>
          </article>
        </div>
      </section>

      {/* Quiz overlay */}
      <QuizOverlay
        quizId={activeQuiz}
        onComplete={handleQuizComplete}
        onClose={() => setActiveQuiz(null)}
      />
    </div>
  );
}
```

**Step 2: Run build to verify no type errors**

Run: `npm run lint`
Expected: PASS

**Step 3: Run dev server and visually verify**

Run: `npm run dev`
Open: `http://localhost:3000/signatur`
Expected:
- Sidebar appears on the left with 6 cluster panels (on desktop)
- Clusters are collapsible; clicking a quiz slot opens QuizOverlay
- Ring renders to the right
- No debug panels visible on the ring

**Step 4: Commit**

```bash
git add src/pages/FuRingPage.tsx
git commit -m "feat(AN): rewire FuRingPage with ClusterSidebar, QuizOverlay, and pipeline animations"
```

---

## Task 9: Run full test suite + type check

**Files:** None (validation only)

**Step 1: Run type check**

Run: `npm run lint`
Expected: PASS

**Step 2: Run full test suite**

Run: `npm run test`
Expected: All tests pass (including new quiz-maps and useQuizSuggestion tests)

**Step 3: Run dev server smoke test**

Run: `npm run dev`
Navigate to `/signatur`, verify:
1. Sidebar loads with 6 clusters
2. Clicking a quiz slot opens QuizOverlay
3. Completing a quiz updates the slot to ✓
4. Ring remains visible and functional
5. No console errors

**Step 4: Final commit if any fixes needed**

If adjustments were needed:
```bash
git add -u
git commit -m "fix(AN): post-integration fixes for quiz-cluster signatur page"
```

---

## Execution Order Summary

```
Task 1  (Extract quiz maps)          → 5 min    — shared module, enables Tasks 6 & 8
Task 2  (useCompletedModules hook)   → 5 min    — data loading, enables Task 8
Task 3  (useQuizSuggestion hook)     → 5 min    — suggestion logic, enables Task 8
Task 4  (Hide debug panels)          → 2 min    — one-line change
Task 5  (Wire quizWeights to V2)     → 5 min    — prop passthrough
Task 6  (ClusterSidebar component)   → 15 min   — main UI, depends on Task 1
Task 7  (ClusterPipeline animation)  → 10 min   — animation component
Task 8  (Rewire FuRingPage)          → 15 min   — integration, depends on all above
Task 9  (Full validation)            → 5 min    — smoke test
```

## Files Created

| File | Purpose |
|------|---------|
| `src/lib/fusion-ring/quiz-maps.ts` | Shared `MODULE_TO_QUIZ_ID` + `QUIZ_NAMES` |
| `src/hooks/useCompletedModules.ts` | Load completed quizzes from Supabase |
| `src/hooks/useQuizSuggestion.ts` | Daily 30% quiz suggestion |
| `src/components/signatur/ClusterSidebar.tsx` | Glassmorphic cluster panels |
| `src/components/signatur/ClusterPipeline.tsx` | Cluster→Ring pipeline animation |
| `src/__tests__/quiz-maps.test.ts` | Quiz maps coverage test |
| `src/__tests__/useCompletedModules.test.ts` | Set logic test |
| `src/__tests__/useQuizSuggestion.test.ts` | Suggestion pure function tests |

## Files Modified

| File | Change |
|------|--------|
| `src/pages/FuRingPage.tsx` | Full rewrite: sidebar + ring layout, QuizOverlay, hooks |
| `src/components/ClusterCard.tsx` | Import quiz maps from shared module (2 lines) |
| `src/components/fusion-ring-3d/FusionRing3D.tsx` | `isInteractive` default → `false`, add `quizWeights` passthrough |
