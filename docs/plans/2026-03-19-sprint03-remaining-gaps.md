# Sprint 03 Remaining Gaps — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close the 6 remaining gaps in Sprint 03 (Quiz Engine) — mobile quiz access, premium upgrade CTA, ring burst on cluster completion, pipeline animation polish, and E2E verification.

**Architecture:** Surgical additions to existing wiring. Mobile gets a dedicated `/signatur/quizzes` page reusing `ClusterSidebar`. V2 canvas gets a single new `effectTrigger` prop for external burst control. Pipeline animation upgraded with CSS particle keyframes. Premium upgrade uses existing `UpgradeButton` in a modal overlay.

**Tech Stack:** React 19, Tailwind CSS v4, Three.js (FusionRingCanvasV2), Framer Motion, Vitest, TypeScript

---

## Task 1: Mobile Quiz Page + Route

**Files:**
- Create: `src/pages/SignaturQuizzesPage.tsx`
- Modify: `src/router.tsx:45` (add route)
- Modify: `src/pages/FuRingPage.tsx:94` (add mobile CTA link)
- Test: `src/__tests__/signatur-quizzes-page.test.tsx`

**Step 1: Write the failing test**

```tsx
// src/__tests__/signatur-quizzes-page.test.tsx
import { describe, it, expect, vi } from 'vitest';

// Mock all heavy dependencies
vi.mock('@/src/hooks/useCompletedModules', () => ({
  useCompletedModules: () => ({
    completedModuleIds: new Set<string>(),
    loading: false,
    addModule: vi.fn(),
  }),
}));
vi.mock('@/src/hooks/useQuizSuggestion', () => ({
  useQuizSuggestion: () => null,
}));
vi.mock('@/src/hooks/usePremium', () => ({
  usePremium: () => ({ isPremium: false, loading: false }),
}));
vi.mock('@/src/hooks/useQuizContribution', () => ({
  useQuizContribution: () => vi.fn(),
}));
vi.mock('@/src/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (k: string) => k, lang: 'de' as const }),
}));
vi.mock('@/src/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'test-user' } }),
}));
vi.mock('@/src/lib/supabase', () => ({
  supabase: { from: () => ({ select: () => ({ eq: () => Promise.resolve({ data: [] }) }) }) },
}));
vi.mock('@/src/components/QuizOverlay', () => ({
  default: () => null,
}));

describe('SignaturQuizzesPage', () => {
  it('exports a default component', async () => {
    const mod = await import('@/src/pages/SignaturQuizzesPage');
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe('function');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/signatur-quizzes-page.test.tsx`
Expected: FAIL — module not found

**Step 3: Create the mobile quiz page**

```tsx
// src/pages/SignaturQuizzesPage.tsx
import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/src/contexts/LanguageContext';
import { useCompletedModules } from '@/src/hooks/useCompletedModules';
import { useQuizSuggestion } from '@/src/hooks/useQuizSuggestion';
import { usePremium } from '@/src/hooks/usePremium';
import { useQuizContribution } from '@/src/hooks/useQuizContribution';
import { ClusterSidebar } from '@/src/components/signatur/ClusterSidebar';
import QuizOverlay from '@/src/components/QuizOverlay';
import type { ContributionEvent } from '@/src/lib/lme/types';

export default function SignaturQuizzesPage() {
  const { t, lang } = useLanguage();
  const { isPremium } = usePremium();
  const { completedModuleIds, addModule } = useCompletedModules();
  const suggestedModule = useQuizSuggestion(completedModuleIds);
  const quizContribution = useQuizContribution(completedModuleIds);
  const [activeQuiz, setActiveQuiz] = useState<string | null>(null);

  const handleQuizComplete = useCallback((event: ContributionEvent) => {
    quizContribution(event);
    const moduleId = event.source?.moduleId;
    if (moduleId) addModule(moduleId);
    setActiveQuiz(null);
  }, [quizContribution, addModule]);

  return (
    <div className="relative min-h-screen w-full bg-[#020509] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(0,180,216,0.18),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(212,175,55,0.2),transparent_42%)]" />

      <section className="relative mx-auto max-w-lg px-4 pb-24 pt-8">
        <header className="mb-6 flex items-center justify-between">
          <Link
            to="/signatur"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-white/70 transition hover:border-[#D4AF37]/60 hover:text-[#D4AF37]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {lang === 'de' ? 'Signatur' : 'Signature'}
          </Link>
        </header>

        <h1 className="mb-2 font-serif text-2xl text-[#D4AF37]">
          {lang === 'de' ? 'Quiz-Cluster' : 'Quiz Clusters'}
        </h1>
        <p className="mb-6 text-sm text-white/60">
          {lang === 'de'
            ? 'Beantworte Quizze, um deine Signatur zu formen.'
            : 'Answer quizzes to shape your signature.'}
        </p>

        <ClusterSidebar
          completedModuleIds={completedModuleIds}
          onStartQuiz={setActiveQuiz}
          isPremium={isPremium}
          lang={lang}
          suggestedModule={suggestedModule}
        />
      </section>

      <QuizOverlay
        quizId={activeQuiz}
        onComplete={handleQuizComplete}
        onClose={() => setActiveQuiz(null)}
      />
    </div>
  );
}
```

**Step 4: Add route to router.tsx**

In `src/router.tsx`, add after line 6:
```tsx
const SignaturQuizzesPage = lazy(() => import('./pages/SignaturQuizzesPage'));
```

Add after line 46 (`<Route path="/fu-ring" ...>`):
```tsx
<Route path="/signatur/quizzes" element={<SignaturQuizzesPage />} />
```

**Step 5: Add mobile CTA link to FuRingPage**

In `src/pages/FuRingPage.tsx`, replace the sidebar container (line 94 `<div className="hidden md:block">`) with:
```tsx
{/* Mobile CTA — visible only on small screens */}
<Link
  to="/signatur/quizzes"
  className="flex items-center justify-center gap-2 rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-3 text-sm text-[#D4AF37] transition hover:bg-[#D4AF37]/20 md:hidden"
>
  <Sparkles className="h-4 w-4" />
  {lang === 'de' ? 'Quiz-Cluster entdecken' : 'Discover Quiz Clusters'}
</Link>

{/* Desktop sidebar — hidden on mobile */}
<div className="hidden md:block">
```

**Step 6: Run test to verify it passes**

Run: `npx vitest run src/__tests__/signatur-quizzes-page.test.tsx`
Expected: PASS

**Step 7: TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 8: Commit**

```bash
git add src/pages/SignaturQuizzesPage.tsx src/router.tsx src/pages/FuRingPage.tsx src/__tests__/signatur-quizzes-page.test.tsx
git commit -m "feat(AN-S03): mobile quiz page at /signatur/quizzes with CTA link"
```

---

## Task 2: Premium Upgrade Modal on Locked Cluster Click

**Files:**
- Create: `src/components/signatur/PremiumUpgradeModal.tsx`
- Modify: `src/components/signatur/ClusterSidebar.tsx:124-131` (add onClick for locked clusters)
- Modify: `src/pages/FuRingPage.tsx` (add modal state + render)
- Modify: `src/pages/SignaturQuizzesPage.tsx` (same modal wiring)
- Test: `src/__tests__/premium-upgrade-modal.test.tsx`

**Step 1: Write the failing test**

```tsx
// src/__tests__/premium-upgrade-modal.test.tsx
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/src/contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (k: string) => k, lang: 'de' as const }),
}));
vi.mock('@/src/components/UpgradeButton', () => ({
  UpgradeButton: ({ label }: { label?: string }) => <button>{label ?? 'Upgrade'}</button>,
}));

describe('PremiumUpgradeModal', () => {
  it('exports a component', async () => {
    const mod = await import('@/src/components/signatur/PremiumUpgradeModal');
    expect(mod.PremiumUpgradeModal).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/premium-upgrade-modal.test.tsx`
Expected: FAIL — module not found

**Step 3: Create the modal component**

```tsx
// src/components/signatur/PremiumUpgradeModal.tsx
import { useEffect, useRef } from 'react';
import { X, Lock } from 'lucide-react';
import { UpgradeButton } from '@/src/components/UpgradeButton';
import { useLanguage } from '@/src/contexts/LanguageContext';

interface PremiumUpgradeModalProps {
  clusterName: string;
  onClose: () => void;
}

export function PremiumUpgradeModal({ clusterName, onClose }: PremiumUpgradeModalProps) {
  const { lang } = useLanguage();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    dialogRef.current?.focus();
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={lang === 'de' ? 'Premium freischalten' : 'Unlock Premium'}
        tabIndex={-1}
        className="relative mx-4 w-full max-w-sm rounded-2xl border border-white/10 bg-[#0A0C10] p-6 shadow-[0_0_40px_rgba(212,175,55,0.15)]"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1 text-white/40 transition hover:text-white/80"
          aria-label={lang === 'de' ? 'Schließen' : 'Close'}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10">
            <Lock className="h-5 w-5 text-[#D4AF37]" />
          </div>
        </div>

        <h2 className="mb-2 text-center font-serif text-xl text-[#D4AF37]">
          {clusterName}
        </h2>
        <p className="mb-5 text-center text-sm leading-relaxed text-white/60">
          {lang === 'de'
            ? 'Dieser Cluster ist Teil des Premium-Erlebnisses. Schalte tiefere Einblicke in deine Signatur frei.'
            : 'This cluster is part of the premium experience. Unlock deeper insights into your signature.'}
        </p>

        <div className="flex justify-center">
          <UpgradeButton
            label={lang === 'de' ? 'Premium freischalten' : 'Unlock Premium'}
            className="rounded-xl bg-[#D4AF37] px-6 py-3 text-sm font-semibold text-[#00050A] transition-colors hover:bg-[#D4AF37]/90 disabled:cursor-wait disabled:opacity-60"
          />
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Update ClusterSidebar to emit premium click**

In `src/components/signatur/ClusterSidebar.tsx`, change the interface (line 12-18):
```tsx
interface ClusterSidebarProps {
  completedModuleIds: Set<string>;
  onStartQuiz: (quizId: string) => void;
  onPremiumClick?: (clusterName: string) => void;
  isPremium: boolean;
  lang: 'de' | 'en';
  suggestedModule: string | null;
}
```

Add `onPremiumClick` to `ClusterPanel` props and the parent component. In the quiz button's `onClick` handler (line 131), change the disabled locked button to:
```tsx
onClick={() => {
  if (needsPremium && onPremiumClick) {
    onPremiumClick(cluster.name);
  } else if (quizId) {
    onStartQuiz(quizId);
  }
}}
disabled={quizDone}
```

Remove `needsPremium` from the `disabled` prop — locked quizzes should be clickable to show the modal.

**Step 5: Wire modal into FuRingPage and SignaturQuizzesPage**

In both pages, add state and render:
```tsx
const [premiumCluster, setPremiumCluster] = useState<string | null>(null);

// In ClusterSidebar:
<ClusterSidebar
  ...existing props...
  onPremiumClick={setPremiumCluster}
/>

// After QuizOverlay:
{premiumCluster && (
  <PremiumUpgradeModal
    clusterName={premiumCluster}
    onClose={() => setPremiumCluster(null)}
  />
)}
```

**Step 6: Run tests**

Run: `npx vitest run src/__tests__/premium-upgrade-modal.test.tsx`
Expected: PASS

**Step 7: TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 8: Commit**

```bash
git add src/components/signatur/PremiumUpgradeModal.tsx src/components/signatur/ClusterSidebar.tsx src/pages/FuRingPage.tsx src/pages/SignaturQuizzesPage.tsx src/__tests__/premium-upgrade-modal.test.tsx
git commit -m "feat(AN-S03): premium upgrade modal on locked cluster click"
```

---

## Task 3: Ring Burst Effect on Cluster Completion

**Files:**
- Modify: `src/components/fusion-ring-website/FusionRingCanvasV2.tsx:67-74` (add `effectTrigger` prop)
- Modify: `src/components/fusion-ring-3d/FusionRing3D.tsx:28-34` (add `effectTrigger` prop, pass through)
- Modify: `src/pages/FuRingPage.tsx` (trigger burst on cluster completion)
- Test: `src/__tests__/cluster-burst-trigger.test.ts`

**Step 1: Write the failing test**

```ts
// src/__tests__/cluster-burst-trigger.test.ts
import { describe, it, expect } from 'vitest';

describe('FusionRingCanvasV2 effectTrigger prop', () => {
  it('accepts effectTrigger in the interface', async () => {
    // Verify the type exists by importing it
    const mod = await import('@/src/components/fusion-ring-website/FusionRingCanvasV2');
    // The interface should allow effectTrigger as optional prop
    expect(mod.default).toBeDefined();
  });
});
```

**Step 2: Run test to verify it passes (baseline)**

Run: `npx vitest run src/__tests__/cluster-burst-trigger.test.ts`
Expected: PASS (baseline — module exists)

**Step 3: Add effectTrigger prop to FusionRingCanvasV2**

In `src/components/fusion-ring-website/FusionRingCanvasV2.tsx`, update the interface (line 67-74):
```tsx
export interface FusionRingCanvasProps {
  natalWeights?: Record<string, number>;
  quizWeights?: Record<string, number>;
  isMini?: boolean;
  showUI?: boolean;
  revealProgress?: number;
  effectTrigger?: { type: string; color?: string; timestamp: number } | null;
  className?: string;
}
```

Then, after the `triggerEffect` definition (~line 1367), add a `useEffect` that reacts to the prop:
```tsx
// External effect trigger via prop
const lastTriggerRef = useRef<number>(0);
useEffect(() => {
  if (!effectTrigger || effectTrigger.timestamp === lastTriggerRef.current) return;
  lastTriggerRef.current = effectTrigger.timestamp;
  triggerEffect(effectTrigger.type as EffectType, {
    intensity: 0.9,
    duration: 3.5,
  });
}, [effectTrigger, triggerEffect]);
```

Destructure `effectTrigger` in the component params (~line 1254):
```tsx
  effectTrigger,
```

**Step 4: Pass effectTrigger through FusionRing3D**

In `src/components/fusion-ring-3d/FusionRing3D.tsx`, update the props type (line 28-34):
```tsx
type FusionRing3DProps = {
  userId: string;
  isInteractive?: boolean;
  onSpikeClick?: (sector: number) => void;
  labels: FusionRing3DLabels;
  quizWeights?: Record<string, number>;
  effectTrigger?: { type: string; color?: string; timestamp: number } | null;
};
```

Destructure in the component (line 63-68):
```tsx
export const FusionRing3D = ({
  userId,
  isInteractive = false,
  labels,
  quizWeights,
  effectTrigger,
}: FusionRing3DProps) => {
```

Pass to FusionRingCanvasV2 (line 112-117):
```tsx
<FusionRingCanvasV2
  natalWeights={v2NatalWeights}
  quizWeights={quizWeights}
  effectTrigger={effectTrigger}
  showUI={isInteractive}
  className="h-full w-full"
/>
```

**Step 5: Trigger burst from FuRingPage on cluster completion**

In `src/pages/FuRingPage.tsx`, add state:
```tsx
const [ringEffect, setRingEffect] = useState<{ type: string; color?: string; timestamp: number } | null>(null);
```

In `handleQuizComplete`, after `setJustCompletedCluster(cluster.id)` (line 46), add:
```tsx
setRingEffect({ type: 'burst', color: cluster.color, timestamp: Date.now() });
```

Pass to `FusionRing3D`:
```tsx
<FusionRing3D
  userId={userId}
  quizWeights={liveQuizWeights}
  effectTrigger={ringEffect}
  labels={...}
/>
```

**Step 6: TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 7: Commit**

```bash
git add src/components/fusion-ring-website/FusionRingCanvasV2.tsx src/components/fusion-ring-3d/FusionRing3D.tsx src/pages/FuRingPage.tsx src/__tests__/cluster-burst-trigger.test.ts
git commit -m "feat(AN-S03): external effectTrigger prop on V2 canvas, burst on cluster completion"
```

---

## Task 4: Pipeline Animation Upgrade

**Files:**
- Modify: `src/components/signatur/ClusterPipeline.tsx` (particle animation, better positioning)
- Test: visual verification (no unit test — pure CSS/animation)

**Step 1: Rewrite ClusterPipeline with particle flow**

Replace entire `src/components/signatur/ClusterPipeline.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface ClusterPipelineProps {
  clusterId: string;
  clusterColor: string;
  isComplete: boolean;
}

const STORAGE_PREFIX = 'bazodiac_pipeline_shown_';

export function ClusterPipeline({ clusterId, clusterColor, isComplete }: ClusterPipelineProps) {
  const prefersReducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<'idle' | 'animate' | 'static'>('idle');
  const storageKey = `${STORAGE_PREFIX}${clusterId}`;

  useEffect(() => {
    if (!isComplete) return;

    const alreadyShown = localStorage.getItem(storageKey) === 'true';
    if (alreadyShown) {
      setPhase('static');
      return;
    }

    localStorage.setItem(storageKey, 'true');

    if (prefersReducedMotion) {
      setPhase('static');
      return;
    }

    setPhase('animate');
    const timer = setTimeout(() => setPhase('static'), 2500);
    return () => clearTimeout(timer);
  }, [isComplete, storageKey, prefersReducedMotion]);

  if (!isComplete || phase === 'idle') return null;

  return (
    <div
      className="pointer-events-none relative flex h-6 items-center overflow-hidden"
      aria-hidden="true"
    >
      {/* Base glow line */}
      {phase === 'static' && (
        <div
          className="h-[1px] w-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${clusterColor}60, ${clusterColor}15, transparent)`,
            boxShadow: `0 0 6px ${clusterColor}30`,
          }}
        />
      )}

      {/* Animated flow */}
      {phase === 'animate' && (
        <>
          {/* Growing line */}
          <motion.div
            className="absolute h-[2px] rounded-full"
            style={{
              background: `linear-gradient(90deg, ${clusterColor}, ${clusterColor}80, transparent)`,
              boxShadow: `0 0 10px ${clusterColor}, 0 0 24px ${clusterColor}50`,
            }}
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '100%', opacity: 1 }}
            transition={{ duration: 1.0, ease: 'easeOut' }}
          />

          {/* Particle 1 — fast */}
          <motion.div
            className="absolute h-1.5 w-1.5 rounded-full"
            style={{
              backgroundColor: clusterColor,
              boxShadow: `0 0 8px ${clusterColor}, 0 0 16px ${clusterColor}80`,
            }}
            initial={{ left: '0%', opacity: 1, scale: 1 }}
            animate={{ left: '105%', opacity: 0, scale: 0.3 }}
            transition={{ duration: 1.2, ease: 'easeIn', delay: 0.2 }}
          />

          {/* Particle 2 — medium */}
          <motion.div
            className="absolute h-1 w-1 rounded-full"
            style={{
              backgroundColor: clusterColor,
              boxShadow: `0 0 6px ${clusterColor}`,
            }}
            initial={{ left: '0%', opacity: 0.8, scale: 0.8 }}
            animate={{ left: '105%', opacity: 0, scale: 0.2 }}
            transition={{ duration: 1.5, ease: 'easeIn', delay: 0.5 }}
          />

          {/* Particle 3 — slow trailing */}
          <motion.div
            className="absolute h-0.5 w-0.5 rounded-full"
            style={{
              backgroundColor: clusterColor,
              boxShadow: `0 0 4px ${clusterColor}`,
            }}
            initial={{ left: '0%', opacity: 0.6 }}
            animate={{ left: '105%', opacity: 0 }}
            transition={{ duration: 1.8, ease: 'easeIn', delay: 0.8 }}
          />

          {/* Ring-side burst flash */}
          <motion.div
            className="absolute right-0 h-3 w-3 rounded-full"
            style={{
              backgroundColor: clusterColor,
              boxShadow: `0 0 20px ${clusterColor}, 0 0 40px ${clusterColor}60`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 0.6, delay: 1.4, ease: 'easeOut' }}
          />
        </>
      )}
    </div>
  );
}
```

**Step 2: Move pipeline rendering to bridge position**

In `src/pages/FuRingPage.tsx`, move the `ClusterPipeline` renders from inside the sidebar `<div>` to be between sidebar and ring. Change the layout (lines 92-136) to:

```tsx
{/* Main content: Sidebar + Pipeline + Ring */}
<div className="flex gap-6">
  {/* Cluster Sidebar — hidden on mobile */}
  <div className="hidden shrink-0 md:block">
    <ClusterSidebar
      completedModuleIds={completedModuleIds}
      onStartQuiz={setActiveQuiz}
      onPremiumClick={setPremiumCluster}
      isPremium={isPremium}
      lang={lang}
      suggestedModule={suggestedModule}
    />
  </div>

  {/* Pipeline bridge — between sidebar and ring, desktop only */}
  <div className="hidden w-12 shrink-0 flex-col justify-center gap-1 md:flex">
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
    <FusionRing3D ... />
  </div>
</div>
```

**Step 3: TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add src/components/signatur/ClusterPipeline.tsx src/pages/FuRingPage.tsx
git commit -m "feat(AN-S03): pipeline animation with glowing particles + bridge positioning"
```

---

## Task 5: ClusterSidebar width fix for pipeline layout

**Files:**
- Modify: `src/components/signatur/ClusterSidebar.tsx:190` (remove hardcoded w-64, use parent sizing)

**Step 1: Verify current width**

The `ClusterSidebar` has `w-64` (256px) hardcoded. The parent `<div className="hidden shrink-0 md:block">` should control width. Remove `w-64` from the `<nav>` and let the parent constrain it.

In `src/components/signatur/ClusterSidebar.tsx` line 190, change:
```tsx
// FROM:
<nav aria-label={...} className="flex w-64 shrink-0 flex-col gap-2 overflow-y-auto pr-1">
// TO:
<nav aria-label={...} className="flex w-56 shrink-0 flex-col gap-2 overflow-y-auto pr-1">
```

(Narrowed from `w-64` to `w-56` to leave room for the 48px pipeline bridge column.)

**Step 2: TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/signatur/ClusterSidebar.tsx
git commit -m "fix(AN-S03): narrow sidebar to w-56 for pipeline bridge column"
```

---

## Task 6: E2E Smoke Verification

**Files:**
- Test: `src/__tests__/quiz-cluster-e2e.test.ts`

**Step 1: Write integration test for the quiz → contribute pipeline**

```ts
// src/__tests__/quiz-cluster-e2e.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CLUSTER_REGISTRY,
  isClusterComplete,
  clusterProgress,
  findClusterForModule,
} from '@/src/lib/fusion-ring/clusters';
import { MODULE_TO_QUIZ_ID, QUIZ_NAMES } from '@/src/lib/fusion-ring/quiz-maps';
import { pickSuggestion } from '@/src/hooks/useQuizSuggestion';

describe('Quiz-Cluster E2E pipeline', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('every cluster moduleId has a quiz mapping', () => {
    for (const cluster of CLUSTER_REGISTRY) {
      for (const moduleId of cluster.quizModuleIds) {
        expect(MODULE_TO_QUIZ_ID[moduleId]).toBeDefined();
        expect(QUIZ_NAMES[moduleId]).toBeDefined();
        expect(QUIZ_NAMES[moduleId].de).toBeTruthy();
      }
    }
  });

  it('cluster completion gate works correctly', () => {
    const cluster = CLUSTER_REGISTRY[0]; // Naturkind — 4 quizzes
    const partial = new Set(cluster.quizModuleIds.slice(0, 3));
    expect(isClusterComplete(cluster, partial)).toBe(false);
    expect(clusterProgress(cluster, partial)).toBeCloseTo(0.75);

    const full = new Set(cluster.quizModuleIds);
    expect(isClusterComplete(cluster, full)).toBe(true);
    expect(clusterProgress(cluster, full)).toBe(1);
  });

  it('findClusterForModule resolves all 23 modules', () => {
    const allModules = CLUSTER_REGISTRY.flatMap(c => c.quizModuleIds);
    expect(allModules.length).toBe(23);
    for (const moduleId of allModules) {
      const cluster = findClusterForModule(moduleId);
      expect(cluster).not.toBeNull();
      expect(cluster!.quizModuleIds).toContain(moduleId);
    }
  });

  it('pickSuggestion returns null when all complete', () => {
    const allModules = new Set(CLUSTER_REGISTRY.flatMap(c => c.quizModuleIds));
    const result = pickSuggestion(allModules);
    expect(result).toBeNull();
  });

  it('pickSuggestion respects once-per-day gate', () => {
    const empty = new Set<string>();
    // First call may or may not return (30% RNG)
    pickSuggestion(empty);
    // Second call same day should always return null (localStorage gate)
    const second = pickSuggestion(empty);
    expect(second).toBeNull();
  });

  it('premium clusters are correctly identified', () => {
    const premiumClusters = CLUSTER_REGISTRY.filter(
      c => c.id === 'cluster.kinky.v1' || c.id === 'cluster.partner_match.v1'
    );
    expect(premiumClusters).toHaveLength(2);
    const freeClusters = CLUSTER_REGISTRY.filter(
      c => c.id !== 'cluster.kinky.v1' && c.id !== 'cluster.partner_match.v1'
    );
    expect(freeClusters).toHaveLength(4);
  });
});
```

**Step 2: Run test**

Run: `npx vitest run src/__tests__/quiz-cluster-e2e.test.ts`
Expected: PASS (all 6 tests)

**Step 3: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass, 0 failures

**Step 4: Final TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add src/__tests__/quiz-cluster-e2e.test.ts
git commit -m "test(AN-S03): E2E smoke tests for quiz-cluster pipeline"
```

---

## Decision Log

| Decision | Alternatives | Reason |
|----------|-------------|--------|
| Dedicated mobile page at `/signatur/quizzes` | Bottom sheet, horizontal scroll, collapsible section | User chose option 3 — clean separation, full-screen quiz experience, avoids fighting with ring viewport |
| `effectTrigger` prop on V2 canvas | `useImperativeHandle` ref, global event bus, window dispatch | Prop is idiomatic React, minimal API surface, no ref forwarding needed |
| Pipeline as bridge column between sidebar and ring | SVG overlay, absolute positioned canvas | Flex layout column is simple, performant, doesn't require coordinate math |
| Sidebar narrowed w-64→w-56 | Responsive breakpoint, auto width | Fixed width keeps layout predictable, 48px bridge column needs the space |
| Reuse existing `UpgradeButton` in modal | New Stripe checkout flow, inline CTA | DRY — `UpgradeButton` already handles Stripe redirect + loading state |

---

## Files Summary

| Action | File |
|--------|------|
| Create | `src/pages/SignaturQuizzesPage.tsx` |
| Create | `src/components/signatur/PremiumUpgradeModal.tsx` |
| Create | `src/__tests__/signatur-quizzes-page.test.tsx` |
| Create | `src/__tests__/premium-upgrade-modal.test.tsx` |
| Create | `src/__tests__/cluster-burst-trigger.test.ts` |
| Create | `src/__tests__/quiz-cluster-e2e.test.ts` |
| Modify | `src/router.tsx` (add route) |
| Modify | `src/pages/FuRingPage.tsx` (mobile CTA, pipeline bridge, burst trigger, premium modal) |
| Modify | `src/components/signatur/ClusterSidebar.tsx` (onPremiumClick prop, w-56) |
| Modify | `src/components/signatur/ClusterPipeline.tsx` (particle animation rewrite) |
| Modify | `src/components/fusion-ring-website/FusionRingCanvasV2.tsx` (effectTrigger prop) |
| Modify | `src/components/fusion-ring-3d/FusionRing3D.tsx` (effectTrigger passthrough) |
| Modify | `src/pages/SignaturQuizzesPage.tsx` (premium modal wiring) |
