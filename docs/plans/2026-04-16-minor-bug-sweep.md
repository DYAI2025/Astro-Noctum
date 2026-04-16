# Minor Bug Sweep — Signatur Engine Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix three minor bugs identified in full-review: (1) standalone quizzes leak entries into localStorage forever, (2) quiz weights trigger unnecessary 28K-particle rebuilds every 800ms poll, (3) misleading DEV-only error label.

**Architecture:** All three fixes are in existing files — no new modules needed. B1 and B2 each require a test update/addition. B3 is a one-liner string change.

**Tech Stack:** TypeScript, React 19, Vitest, `src/hooks/useQuizContribution.ts`, `src/components/fusion-ring-website/FusionRingCanvasV2.tsx`, `src/i18n/translations.ts`

---

## Bug Map

| ID | File | Root Cause | Impact |
|----|------|-----------|--------|
| B1 | `src/hooks/useQuizContribution.ts` | `queueContribution()` called before cluster check — standalone quizzes queue but never drain | localStorage grows indefinitely for users with standalone quizzes |
| B2 | `src/components/fusion-ring-website/FusionRingCanvasV2.tsx` | `if (quizWeights)` sets `needsRebuild=true` without checking if values changed | 28K-particle rebuild triggered every 800ms when transit poll fires and `quizWeights` is defined |
| B3 | `src/i18n/translations.ts` | "Renderer-Fehler. Fallback aktiv." fires on transit API network errors, not renderer errors | Misleading DEV-only banner label (low priority) |

---

## Task 1: Fix standalone quiz localStorage leak (B1)

**Files:**
- Modify: `src/hooks/useQuizContribution.ts`
- Test: `src/__tests__/cluster-gate-enforcement.test.ts` (add 1 new test)

**Context:** `useQuizContribution` currently calls `queueContribution()` unconditionally before the cluster check (line 31). When a quiz has no cluster (`findClusterForModule` returns null), the entry queues but is never drained. Fix: only queue inside the cluster branch.

**Step 1: Write the failing test**

Add to `src/__tests__/cluster-gate-enforcement.test.ts`, inside `describe('useQuizContribution — cluster gate enforcement', ...)`:

```typescript
it('does NOT queue to localStorage for standalone quizzes (no cluster)', () => {
  const completed = new Set<string>();
  const { result } = renderHook(() => useQuizContribution(completed));

  // quiz.standalone_test.v1 is not in any cluster
  result.current(makeEvent('quiz.standalone_test.v1'));

  const pending = loadPendingContributions();
  expect(pending.has('quiz.standalone_test.v1')).toBe(false);
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/__tests__/cluster-gate-enforcement.test.ts 2>&1 | tail -8
```

Expected: FAIL — `Expected: false, Received: true` (standalone quiz IS currently queued)

**Step 3: Fix `src/hooks/useQuizContribution.ts`**

Move `queueContribution()` inside the cluster branch. Replace the current logic:

```typescript
// OLD (current):
queueContribution(moduleId, normalizedSectorWeights, 0.75);
const cluster = findClusterForModule(moduleId);
if (cluster) {
  ...
  return;
}
void contributeQuizResult(moduleId, normalizedSectorWeights, 0.75);

// NEW:
const cluster = findClusterForModule(moduleId);
if (cluster) {
  // Queue locally — only POST when entire cluster is complete
  queueContribution(moduleId, normalizedSectorWeights, 0.75);
  const updatedCompleted = new Set(completedModuleIds);
  updatedCompleted.add(moduleId);
  if (!isClusterComplete(cluster, updatedCompleted)) return;
  const drained = drainClusterContributions(cluster.quizModuleIds);
  for (const entry of drained) {
    void contributeQuizResult(entry.moduleId, entry.sectorWeights, entry.confidence);
  }
  return;
}
// No cluster (standalone quiz) — POST immediately, no queue
void contributeQuizResult(moduleId, normalizedSectorWeights, 0.75);
```

Full replacement of `src/hooks/useQuizContribution.ts`:

```typescript
import { useCallback } from 'react';
import type { ContributionEvent } from '@/src/lib/lme/types';
import { eventToSectorSignals } from '@/src/lib/fusion-ring/test-signal';
import { contributeQuizResult } from '@/src/services/contribute';
import { findClusterForModule, isClusterComplete } from '@/src/lib/fusion-ring/clusters';
import {
  queueContribution,
  drainClusterContributions,
} from '@/src/lib/fusion-ring/contribution-queue';

/**
 * Returns a handler for quiz onComplete that:
 * 1. Converts ContributionEvent → sector weights via AFFINITY_MAP
 * 2. For cluster quizzes: queues locally, batch-POSTs on cluster completion
 * 3. For standalone quizzes: POSTs immediately, no localStorage queue
 *
 * @param completedModuleIds - Set of already-completed module IDs for this user
 */
export function useQuizContribution(completedModuleIds: Set<string>) {
  return useCallback((event: ContributionEvent) => {
    const moduleId = event.source?.moduleId;
    if (!moduleId) return;

    const sectorWeights = eventToSectorSignals(event);
    if (!sectorWeights || sectorWeights.length !== 12) return;

    const normalizedSectorWeights = sectorWeights.map((signal) => (signal + 1) / 2);

    const cluster = findClusterForModule(moduleId);
    if (cluster) {
      // Queue locally — only POST when entire cluster is complete
      queueContribution(moduleId, normalizedSectorWeights, 0.75);
      const updatedCompleted = new Set(completedModuleIds);
      updatedCompleted.add(moduleId);
      if (!isClusterComplete(cluster, updatedCompleted)) return;

      // Cluster complete — drain and POST all queued contributions for this cluster
      const drained = drainClusterContributions(cluster.quizModuleIds);
      for (const entry of drained) {
        void contributeQuizResult(entry.moduleId, entry.sectorWeights, entry.confidence);
      }
      return;
    }

    // No cluster (standalone quiz) — POST immediately, no localStorage queue
    void contributeQuizResult(moduleId, normalizedSectorWeights, 0.75);
  }, [completedModuleIds]);
}
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/__tests__/cluster-gate-enforcement.test.ts 2>&1 | tail -8
```

Expected: all 18 tests PASS (17 existing + 1 new)

**Step 5: Confirm existing "standalone quiz POSTs immediately" test still passes**

This existing test already verifies POST fires for standalone:
```
✓ POSTs immediately for standalone quizzes (no cluster)
```

**Step 6: Run full suite**

```bash
npx vitest run 2>&1 | tail -4
```

Expected: all tests pass

**Step 7: Commit**

```bash
git add src/hooks/useQuizContribution.ts src/__tests__/cluster-gate-enforcement.test.ts
git commit -m "fix(signatur): standalone quizzes no longer leak into localStorage queue"
```

---

## Task 2: Throttle quiz weights rebuild in V2 canvas (B2)

**Files:**
- Modify: `src/components/fusion-ring-website/FusionRingCanvasV2.tsx` (lines ~1302–1331)
- Test: `src/__tests__/transit-visible-response.test.ts` (add 1 new test)

**Context:** The V2 canvas sync effect checks `if (quizWeights)` and unconditionally sets `needsRebuild = true`. This means every time the effect runs (e.g., when `natalWeights` changes on the 800ms poll), if `quizWeights` is defined, a full 28K-particle rebuild triggers — even if quiz weight values haven't changed. Fix: add a `prevQuizRef` with the same Δ≥0.01 threshold used for `natalWeights`.

**Step 1: Write the failing test**

Add to `src/__tests__/transit-visible-response.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';

// Test the threshold logic in isolation — mirrors what FusionRingCanvasV2 does
function shouldRebuildQuiz(
  current: Record<string, number>,
  prev: Record<string, number> | undefined,
  threshold = 0.01
): boolean {
  if (!prev) return true;
  return Object.keys(current).some(
    k => Math.abs((current[k] ?? 0) - (prev[k] ?? 0)) >= threshold
  );
}

describe('quiz weights rebuild throttle', () => {
  it('does NOT rebuild when quiz weights change by less than 0.01', () => {
    const prev = { assertion: 0.5, empathy: 0.5 };
    const next = { assertion: 0.505, empathy: 0.499 }; // delta < 0.01
    expect(shouldRebuildQuiz(next, prev)).toBe(false);
  });

  it('rebuilds when any quiz weight changes by >= 0.01', () => {
    const prev = { assertion: 0.5, empathy: 0.5 };
    const next = { assertion: 0.51, empathy: 0.5 }; // delta = 0.01
    expect(shouldRebuildQuiz(next, prev)).toBe(true);
  });

  it('rebuilds on first render (no prev)', () => {
    expect(shouldRebuildQuiz({ assertion: 0.5 }, undefined)).toBe(true);
  });
});
```

**Step 2: Run test to verify it passes immediately** (these test pure logic, no impl needed first)

```bash
npx vitest run src/__tests__/transit-visible-response.test.ts 2>&1 | tail -8
```

Expected: PASS (pure logic test)

**Step 3: Apply the fix in FusionRingCanvasV2.tsx**

In `src/components/fusion-ring-website/FusionRingCanvasV2.tsx`, find this section (around line 1302):

```typescript
const prevNatalRef = useRef<Record<string, number> | undefined>(undefined);
```

Add `prevQuizRef` right after:

```typescript
const prevNatalRef = useRef<Record<string, number> | undefined>(undefined);
const prevQuizRef = useRef<Record<string, number> | undefined>(undefined);
```

Then find the `if (quizWeights)` block (around line 1319):

```typescript
// BEFORE:
if (quizWeights) {
  bazStateRef.current.quiz = new Map(Object.entries(quizWeights).map(([k, v]) => [k as QuizDimension, v]));
  needsRebuild = true;
}

// AFTER:
if (quizWeights) {
  const prevQuiz = prevQuizRef.current;
  const quizChanged = !prevQuiz || Object.keys(quizWeights).some(
    k => Math.abs((quizWeights[k] ?? 0) - (prevQuiz[k] ?? 0)) >= 0.01
  );
  if (quizChanged) {
    bazStateRef.current.quiz = new Map(Object.entries(quizWeights).map(([k, v]) => [k as QuizDimension, v]));
    prevQuizRef.current = quizWeights;
    needsRebuild = true;
  }
}
```

**Step 4: Run full suite**

```bash
npx vitest run 2>&1 | tail -4
```

Expected: all tests pass

**Step 5: Commit**

```bash
git add src/components/fusion-ring-website/FusionRingCanvasV2.tsx src/__tests__/transit-visible-response.test.ts
git commit -m "perf(signatur): throttle quiz weights rebuild — skip when delta < 0.01"
```

---

## Task 3: Fix misleading `renderError` label (B3)

**Files:**
- Modify: `src/i18n/translations.ts` (2 lines — one in EN section ~line 154, one in DE section ~line 631)

**Context:** The label `furing3d.renderError` says "Renderer-Fehler. Fallback aktiv." but it fires on transit API network errors, not renderer errors. The banner is DEV-only (production users never see it), so this is cosmetic — but a confusing message for developers. Rename to accurately describe what happened.

**Step 1: Update EN translation (line ~154)**

```typescript
// Before:
renderError: "Renderer error. Fallback active.",
// After:
renderError: "[DEV] Transit API unavailable. V1 fallback active.",
```

**Step 2: Update DE translation (line ~631)**

```typescript
// Before:
renderError: "Renderer-Fehler. Fallback aktiv.",
// After:
renderError: "[DEV] Transit API nicht erreichbar. V1-Fallback aktiv.",
```

**Step 3: Run typecheck**

```bash
npx tsc --noEmit 2>&1 | head -5
```

Expected: `TypeScript compilation completed`

**Step 4: Commit**

```bash
git add src/i18n/translations.ts
git commit -m "fix(i18n): renderError label accurately describes transit API failure, not renderer error"
```

---

## Verification

After all three tasks:

```bash
npx vitest run 2>&1 | tail -5
npx tsc --noEmit 2>&1 | head -5
```

Both must pass before calling the sweep done.
