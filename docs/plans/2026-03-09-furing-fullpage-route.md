# Fu-Ring Vollbild-Seite + Route-Architektur

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extract the Fusion Ring into its own fullscreen route (`/fu-ring`) with React Router, replace the Dashboard's heavy ring Canvas with lightweight teaser cards, and wire shared state through React Context.

**Architecture:** Add react-router-dom v7 for SPA routing. Split the monolithic App.tsx render into two lazy-loaded pages: Dashboard (existing) and FuRingPage (new). The useFusionRing hook result is shared via a FusionRingContext at the App layout level. The Dashboard keeps only the Orrery canvas; the Fu-Ring page gets the full-size ring canvas + timeline.

**Tech Stack:** React 19, React Router v7, TypeScript, Tailwind 4, Canvas 2D (existing drawFusionRing), motion/react (Framer Motion)

**Source brief:** `features/plan/Implementation-plan/FuRing_Webdesign_Brief_v1.md` (docx file despite .md extension)

---

## Pre-Implementation Notes

### Already done (skip these)
- **WuXing SVG refactor (brief tasks FR-06, FR-07):** `WuXingPentagon.tsx` and `WuXingCycleWheel.tsx` are already SVG-based React components. No Canvas to replace. The brief was written before this was implemented.

### Uncodixfy Constraints
- No glassmorphism panels, no glow halos, no gradient text, no pill overload
- Fu-Ring page dark theme uses flat surfaces (`#020509` bg, `#0A1628` surface), 1px solid borders, no blur-heavy glass cards
- Cards: 8px radius max, 1px borders, no dramatic shadows
- Header: 56px, solid background, simple back-arrow + title, no eyebrow labels
- No decorative copy, no hero sections, no "Ringwetter" section titles in uppercase with letter-spacing (use plain text hierarchy)
- Colors from project palette: obsidian (#00050A), gold (#D4AF37), ring-surface (#0A1628), ring-border (rgba(70,130,220,0.18))
- No bouncy animations, no transform hover effects — simple 150ms opacity/color transitions

### Existing Color Tokens (from `src/index.css`)
```
--c-obsidian:  #00050A
--c-gold:      #D4AF37
--c-gold-glow: rgba(212,175,55,0.4)
--c-ash:       #1A1C1E
```

### Key Files
| File | Role |
|------|------|
| `src/App.tsx` (423 lines) | Monolithic: auth, profile loading, global state, header, nav, render |
| `src/components/Dashboard.tsx` (1163 lines) | All dashboard UI including FusionRing/Timeline/ClusterEnergy |
| `src/components/FusionRing.tsx` | Canvas renderer with rAF loop |
| `src/components/FusionRingTimeline.tsx` | Timeline sparkline + scrubber + playback |
| `src/hooks/useFusionRing.ts` | Signal computation from BAFE + quiz events |
| `src/components/ClusterEnergySystem.tsx` | Quiz cluster cards (stays on Dashboard) |

---

## Task 1: Install React Router

**Files:**
- Modify: `package.json`

**Step 1: Install react-router-dom**

Run: `npm install react-router-dom`

Expected: Package added to dependencies. No other changes.

**Step 2: Verify TypeScript picks it up**

Run: `npx tsc --noEmit 2>&1 | head -20`

Expected: No new errors related to react-router-dom.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add react-router-dom v7"
```

---

## Task 2: Create FusionRingContext

**Files:**
- Create: `src/contexts/FusionRingContext.tsx`
- Test: `src/__tests__/FusionRingContext.test.tsx`

**Step 1: Write the failing test**

```tsx
// src/__tests__/FusionRingContext.test.tsx
import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FusionRingProvider, useFusionRingContext } from '../contexts/FusionRingContext';

describe('FusionRingContext', () => {
  it('provides signal, addQuizResult, and completedModules', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <FusionRingProvider apiResults={null} userId={undefined}>
        {children}
      </FusionRingProvider>
    );
    const { result } = renderHook(() => useFusionRingContext(), { wrapper });
    expect(result.current.signal).toBeDefined();
    expect(typeof result.current.addQuizResult).toBe('function');
    expect(result.current.completedModules).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/FusionRingContext.test.tsx`
Expected: FAIL — module not found.

**Step 3: Write implementation**

```tsx
// src/contexts/FusionRingContext.tsx
import { createContext, useContext, type ReactNode } from 'react';
import { useFusionRing } from '../hooks/useFusionRing';
import type { FusionRingSignal } from '../lib/fusion-ring/signal';
import type { ContributionEvent } from '../lib/lme/types';
import type { ApiResults } from '../services/api';

interface FusionRingContextValue {
  signal: FusionRingSignal | null;
  addQuizResult: (event: ContributionEvent) => void;
  completedModules: Set<string>;
}

const FusionRingCtx = createContext<FusionRingContextValue | null>(null);

interface ProviderProps {
  apiResults: ApiResults | null;
  userId?: string;
  children: ReactNode;
}

export function FusionRingProvider({ apiResults, userId, children }: ProviderProps) {
  const { signal, addQuizResult, completedModules } = useFusionRing(apiResults, userId);
  return (
    <FusionRingCtx.Provider value={{ signal, addQuizResult, completedModules }}>
      {children}
    </FusionRingCtx.Provider>
  );
}

export function useFusionRingContext(): FusionRingContextValue {
  const ctx = useContext(FusionRingCtx);
  if (!ctx) throw new Error('useFusionRingContext must be inside FusionRingProvider');
  return ctx;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/FusionRingContext.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/contexts/FusionRingContext.tsx src/__tests__/FusionRingContext.test.tsx
git commit -m "feat: add FusionRingContext for shared ring state across routes"
```

---

## Task 3: Create Router + Page Shell

**Files:**
- Create: `src/router.tsx`
- Create: `src/pages/DashboardPage.tsx` (thin shell, re-exports existing Dashboard)
- Create: `src/pages/FuRingPage.tsx` (skeleton)

**Step 1: Create router.tsx**

```tsx
// src/router.tsx
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const FuRingPage = lazy(() => import('./pages/FuRingPage'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-1 h-1 bg-[#8B6914] rounded-full animate-ping" />
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/fu-ring" element={<FuRingPage />} />
      </Routes>
    </Suspense>
  );
}
```

**Step 2: Create DashboardPage shell**

```tsx
// src/pages/DashboardPage.tsx
// Thin wrapper — receives props from App layout context.
// The actual Dashboard component stays at src/components/Dashboard.tsx.

import { Dashboard } from '../components/Dashboard';
import { useFusionRingContext } from '../contexts/FusionRingContext';

interface DashboardPageProps {
  interpretation: string;
  apiData: any;
  userId: string;
  birthDate: string | null;
  onReset: () => void;
  onRegenerate: () => void;
  isLoading: boolean;
  apiIssues: { endpoint: string; message: string }[];
  onStopAudio: () => void;
  onResumeAudio: () => void;
  isFirstReading?: boolean;
}

export default function DashboardPage(props: DashboardPageProps) {
  const { signal, addQuizResult, completedModules } = useFusionRingContext();
  return (
    <Dashboard
      {...props}
      fusionSignal={signal}
      onQuizComplete={addQuizResult}
      completedModules={completedModules}
    />
  );
}
```

**Step 3: Create FuRingPage skeleton**

```tsx
// src/pages/FuRingPage.tsx
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useFusionRingContext } from '../contexts/FusionRingContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function FuRingPage() {
  const { signal } = useFusionRingContext();
  const { lang } = useLanguage();

  return (
    <div className="min-h-screen" style={{ background: '#020509', color: 'rgba(215,230,255,0.85)' }}>
      {/* Header — 56px, solid bg */}
      <header
        className="fixed top-0 w-full h-14 flex items-center justify-between px-4 md:px-8 z-50"
        style={{ background: '#0A1628', borderBottom: '1px solid rgba(70,130,220,0.18)' }}
      >
        <Link to="/" className="flex items-center gap-2 text-sm" style={{ color: 'rgba(215,230,255,0.60)' }}>
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </Link>
        <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'rgba(215,230,255,0.40)' }}>
          Fu-Ring
        </span>
        <span className="text-xs" style={{ color: 'rgba(215,230,255,0.35)' }}>
          {lang === 'de' ? 'DE' : 'EN'}
        </span>
      </header>

      {/* Ring zone — placeholder until Task 5 */}
      <main className="pt-14 flex flex-col items-center">
        <div className="mt-12 mb-8 flex items-center justify-center" style={{ minHeight: '60vh' }}>
          <p style={{ color: 'rgba(215,230,255,0.30)' }}>
            {signal ? `Ring signal loaded (${signal.sectors.length} sectors)` : 'No signal data'}
          </p>
        </div>
      </main>
    </div>
  );
}
```

**Step 4: Verify TypeScript**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No new errors (FuRingPage may have unused-var warnings, acceptable for skeleton).

**Step 5: Commit**

```bash
git add src/router.tsx src/pages/DashboardPage.tsx src/pages/FuRingPage.tsx
git commit -m "feat: add React Router shell with Dashboard and FuRing page skeletons"
```

---

## Task 4: Wire Router into App.tsx

**Files:**
- Modify: `src/App.tsx`

This is the biggest refactor. The goal: wrap the existing render in `<BrowserRouter>` + `<FusionRingProvider>`, and replace the inline Dashboard render with the router.

**Step 1: Add BrowserRouter + FusionRingProvider to App.tsx**

At the top of App.tsx, add imports:
```tsx
import { BrowserRouter } from 'react-router-dom';
import { FusionRingProvider } from './contexts/FusionRingContext';
import { AppRoutes } from './router';
```

**Step 2: Remove direct useFusionRing call**

In App.tsx line 53, remove:
```tsx
const { signal, addQuizResult, completedModules } = useFusionRing(apiData, user?.id);
```

The FusionRingProvider now owns this hook.

**Step 3: Replace the Dashboard render block**

In App.tsx around line 374, replace:
```tsx
<Dashboard
  interpretation={interpretation!}
  apiData={apiData}
  userId={user.id}
  ...
/>
```

With `<AppRoutes />` wrapped in the providers. The Dashboard props need to be passed through the router — use a layout pattern or pass via context.

**Approach:** Create a small `AppLayoutContext` that passes the Dashboard props (interpretation, apiData, userId, etc.) to child routes. This avoids drilling props through the router.

Create `src/contexts/AppLayoutContext.tsx`:
```tsx
import { createContext, useContext, type ReactNode } from 'react';

interface AppLayoutValue {
  interpretation: string;
  apiData: any;
  userId: string;
  birthDate: string | null;
  onReset: () => void;
  onRegenerate: () => void;
  isLoading: boolean;
  apiIssues: { endpoint: string; message: string }[];
  onStopAudio: () => void;
  onResumeAudio: () => void;
  isFirstReading: boolean;
}

const AppLayoutCtx = createContext<AppLayoutValue | null>(null);

export function AppLayoutProvider({ value, children }: { value: AppLayoutValue; children: ReactNode }) {
  return <AppLayoutCtx.Provider value={value}>{children}</AppLayoutCtx.Provider>;
}

export function useAppLayout(): AppLayoutValue {
  const ctx = useContext(AppLayoutCtx);
  if (!ctx) throw new Error('useAppLayout must be inside AppLayoutProvider');
  return ctx;
}
```

**Step 4: Update DashboardPage to use AppLayoutContext**

```tsx
// src/pages/DashboardPage.tsx
import { Dashboard } from '../components/Dashboard';
import { useFusionRingContext } from '../contexts/FusionRingContext';
import { useAppLayout } from '../contexts/AppLayoutContext';

export default function DashboardPage() {
  const layout = useAppLayout();
  const { signal, addQuizResult, completedModules } = useFusionRingContext();
  return (
    <Dashboard
      {...layout}
      fusionSignal={signal}
      onQuizComplete={addQuizResult}
      completedModules={completedModules}
    />
  );
}
```

**Step 5: Wrap render in App.tsx**

Replace the `{showOnboarding ? <BirthForm> : <Dashboard>}` block with:

```tsx
{showOnboarding ? (
  <BirthForm onSubmit={handleSubmit} isLoading={isLoading} />
) : (
  <BrowserRouter>
    <FusionRingProvider apiResults={apiData} userId={user.id}>
      <AppLayoutProvider value={{
        interpretation: interpretation!,
        apiData,
        userId: user.id,
        birthDate: birthDateStr,
        onReset: handleReset,
        onRegenerate: handleRegenerate,
        isLoading,
        apiIssues,
        onStopAudio: ambiente.pause,
        onResumeAudio: ambiente.resume,
        isFirstReading,
      }}>
        <AppRoutes />
      </AppLayoutProvider>
    </FusionRingProvider>
  </BrowserRouter>
)}
```

Note: `<BrowserRouter>` wraps only the authenticated + profile-loaded section. Splash/Auth/Onboarding don't need routing.

**Step 6: Remove old fusionSignal/addQuizResult/completedModules props from Dashboard render**

These now come from context inside DashboardPage, not from App.tsx.

**Step 7: Smoke test**

Run: `npm run dev`
- Navigate to `http://localhost:3000` — Dashboard should render identically
- Navigate to `http://localhost:3000/fu-ring` — Should show skeleton page with "Fu-Ring" header and back link

Run: `npx tsc --noEmit`
Expected: No new type errors.

**Step 8: Commit**

```bash
git add src/App.tsx src/contexts/AppLayoutContext.tsx src/contexts/FusionRingContext.tsx src/pages/DashboardPage.tsx src/router.tsx
git commit -m "feat: wire React Router with FusionRing + AppLayout contexts"
```

---

## Task 5: Build FuRingPage Full Layout

**Files:**
- Modify: `src/pages/FuRingPage.tsx`

Replace the skeleton with the actual layout zones from the brief. Apply Uncodixfy rules strictly.

**Step 1: Implement the full layout**

```tsx
// src/pages/FuRingPage.tsx
import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useFusionRingContext } from '../contexts/FusionRingContext';
import { useLanguage } from '../contexts/LanguageContext';
import FusionRing from '../components/FusionRing';
import FusionRingTimeline from '../components/FusionRingTimeline';

// Ring color tokens (inline — no CSS vars needed, dark-only page)
const RING = {
  bg: '#020509',
  surface: '#0A1628',
  border: 'rgba(70,130,220,0.18)',
  gold: '#D4AF37',
  goldDim: 'rgba(212,175,55,0.45)',
  text: 'rgba(215,230,255,0.85)',
  muted: 'rgba(215,230,255,0.40)',
  glow: 'rgba(212,175,55,0.08)',
};

export default function FuRingPage() {
  const { signal } = useFusionRingContext();
  const { lang } = useLanguage();
  const [searchParams] = useSearchParams();

  // Optional deep-link: /fu-ring?day=7
  const initialDay = Number(searchParams.get('day')) || 0;

  if (!signal) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: RING.bg, color: RING.muted }}>
        <p className="text-sm">{lang === 'de' ? 'Kein Signalprofil vorhanden.' : 'No signal profile available.'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans" style={{ background: RING.bg, color: RING.text }}>
      {/* ── HEADER — 56px, solid, simple ─────────────── */}
      <header
        className="fixed top-0 w-full h-14 flex items-center justify-between px-4 md:px-8 z-50"
        style={{ background: RING.surface, borderBottom: `1px solid ${RING.border}` }}
      >
        <Link to="/" className="flex items-center gap-2 text-sm transition-colors" style={{ color: RING.muted }}>
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </Link>
        <span className="text-[10px] uppercase tracking-[0.3em]" style={{ color: RING.muted }}>
          Fu-Ring
        </span>
        <span className="text-xs" style={{ color: RING.muted }}>
          {lang.toUpperCase()}
        </span>
      </header>

      {/* ── RING CENTER ──────────────────────────────── */}
      <main className="pt-14">
        <section className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
          <div className="relative">
            {/* Ambient glow — subtle radial, not a glass panel */}
            <div
              className="absolute inset-0 -m-16 rounded-full pointer-events-none"
              style={{ background: `radial-gradient(circle, ${RING.glow} 0%, transparent 70%)` }}
            />
            <FusionRing
              signal={signal}
              size={typeof window !== 'undefined' && window.innerWidth < 640 ? 300 : 520}
              showLabels
              showKorona
              showTension
              animated
              withBackground={false}
            />
          </div>
        </section>

        {/* ── EVENT BADGES ──────────────────────────────── */}
        {/* Placeholder — will be populated when transit API is connected */}

        {/* ── TIMELINE ─────────────────────────────────── */}
        <section className="max-w-3xl mx-auto px-4 pb-12">
          <FusionRingTimeline signal={signal} size={typeof window !== 'undefined' && window.innerWidth < 640 ? 340 : 520} />
        </section>

        {/* ── STATS (Desktop sidebar at 1440px+) ─────── */}
        {/* TODO: Implement stats sidebar for wide viewports */}
      </main>
    </div>
  );
}
```

**Step 2: Verify**

Run: `npm run dev` — navigate to `/fu-ring`
- Ring should render centered on dark background
- Timeline should show below
- Back arrow links to Dashboard
- No glassmorphism, no glow panels, no gradient text

Run: `npx tsc --noEmit`

**Step 3: Commit**

```bash
git add src/pages/FuRingPage.tsx
git commit -m "feat: FuRingPage full layout with ring canvas + timeline"
```

---

## Task 6: Ring Teaser Card for Dashboard

**Files:**
- Create: `src/components/RingTeaserCard.tsx`
- Modify: `src/components/Dashboard.tsx` (replace ClusterEnergySystem section)

**Step 1: Create RingTeaserCard**

A compact card showing a static mini-ring (200px, single render, no animation loop), top-3 sectors, and a CTA link to `/fu-ring`.

```tsx
// src/components/RingTeaserCard.tsx
import { Link } from 'react-router-dom';
import FusionRing from './FusionRing';
import type { FusionRingSignal } from '../lib/fusion-ring/signal';
import { SECTOR_LABELS } from '../lib/fusion-ring/constants';

interface RingTeaserProps {
  signal: FusionRingSignal;
  lang: 'de' | 'en';
}

export function RingTeaserCard({ signal, lang }: RingTeaserProps) {
  // Top 3 sectors by value
  const top3 = signal.sectors
    .map((val, idx) => ({ val, idx }))
    .sort((a, b) => b.val - a.val)
    .slice(0, 3);

  const resolution = Math.round(signal.resolution * 100);

  return (
    <div className="morning-card p-6">
      <div className="flex items-start gap-6">
        {/* Mini ring — static, no animation, dark inset */}
        <div className="shrink-0 rounded-lg overflow-hidden" style={{ background: '#020509' }}>
          <FusionRing
            signal={signal}
            size={140}
            showLabels={false}
            showKorona={false}
            showTension={false}
            animated={false}
            withBackground
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#1E2A3A]/80 mb-3">
            {lang === 'de' ? 'Dein Energieprofil' : 'Your Energy Profile'}
          </p>

          {/* Top sectors */}
          <div className="space-y-1.5 mb-4">
            {top3.map(({ val, idx }) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-[#1E2A3A]/55">
                <span className="font-mono w-8 text-right text-[#8B6914]/70">{Math.round(val * 100)}%</span>
                <span>{SECTOR_LABELS[idx]}</span>
              </div>
            ))}
          </div>

          {/* Resolution */}
          <p className="text-[10px] text-[#1E2A3A]/35 mb-4">
            {lang === 'de' ? `Auflösung: ${resolution}%` : `Resolution: ${resolution}%`}
          </p>

          {/* CTA */}
          <Link
            to="/fu-ring"
            className="inline-block text-xs px-4 py-2 rounded border border-[#8B6914]/25 text-[#8B6914]/70 transition-colors hover:bg-[#8B6914]/08 hover:border-[#8B6914]/40"
          >
            {lang === 'de' ? 'Fu-Ring erkunden' : 'Explore Fu-Ring'}
          </Link>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Wire into Dashboard**

In `Dashboard.tsx`, after the ClusterEnergySystem section (~line 1112), add the RingTeaserCard. Keep ClusterEnergySystem (quiz cards stay). The teaser replaces the FusionRingTimeline (line 1134), not the cluster system.

Replace lines 1122-1137 (the `TAGESENERGIE — Transit Timeline` section) with:

```tsx
{/* ═══ RING TEASER — replaces inline timeline ════════════════════ */}
{fusionSignal && (
  <motion.div className="mb-16" {...fadeIn(0.4)}>
    <RingTeaserCard signal={fusionSignal} lang={lang} />
  </motion.div>
)}
```

Add import at top of Dashboard.tsx:
```tsx
import { RingTeaserCard } from './RingTeaserCard';
```

Remove the FusionRingTimeline import (line 22) since it's no longer used in Dashboard.

**Step 3: Verify**

Run: `npm run dev` — Dashboard should show mini-ring card instead of full timeline.
Click "Fu-Ring erkunden" — navigates to `/fu-ring`.

Run: `npx tsc --noEmit`

**Step 4: Commit**

```bash
git add src/components/RingTeaserCard.tsx src/components/Dashboard.tsx
git commit -m "feat: replace Dashboard timeline with RingTeaserCard linking to /fu-ring"
```

---

## Task 7: Daily Energy Teaser Card

**Files:**
- Create: `src/components/DailyEnergyTeaser.tsx`
- Modify: `src/components/Dashboard.tsx`

**Step 1: Create DailyEnergyTeaser**

Simple card: headline text, a CSS energy bar (no canvas), 1-2 event badges, CTA to `/fu-ring`.

```tsx
// src/components/DailyEnergyTeaser.tsx
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { FusionRingSignal } from '../lib/fusion-ring/signal';

interface DailyEnergyTeaserProps {
  signal: FusionRingSignal;
  lang: 'de' | 'en';
  isPremium: boolean;
}

export function DailyEnergyTeaser({ signal, lang, isPremium }: DailyEnergyTeaserProps) {
  // Compute average energy level from signal sectors
  const energy = useMemo(() => {
    const avg = signal.sectors.reduce((a, b) => a + b, 0) / signal.sectors.length;
    return Math.round(avg * 100);
  }, [signal]);

  return (
    <div className="morning-card p-5">
      <p className="text-sm font-medium text-[#1E2A3A]/80 mb-3">
        {lang === 'de' ? 'Dein Ringwetter heute' : 'Your Ring Weather Today'}
      </p>

      {/* Energy bar — pure CSS */}
      <div className="h-1.5 rounded-sm bg-[#1E2A3A]/06 mb-3 overflow-hidden">
        <div
          className="h-full rounded-sm transition-all duration-700"
          style={{
            width: `${energy}%`,
            background: '#D4AF37',
            opacity: 0.65,
          }}
        />
      </div>

      <p className="text-xs text-[#1E2A3A]/45 mb-4">
        {lang === 'de' ? `Energielevel: ${energy}%` : `Energy level: ${energy}%`}
      </p>

      {!isPremium && (
        <p className="text-[10px] text-[#1E2A3A]/30 mb-3 italic">
          {lang === 'de' ? 'Details im Fu-Ring verfügbar' : 'Details available in Fu-Ring'}
        </p>
      )}

      <Link
        to="/fu-ring"
        className="inline-block text-xs px-4 py-2 rounded border border-[#8B6914]/25 text-[#8B6914]/70 transition-colors hover:bg-[#8B6914]/08 hover:border-[#8B6914]/40"
      >
        {lang === 'de' ? 'Transit-Details' : 'Transit Details'}
      </Link>
    </div>
  );
}
```

**Step 2: Add to Dashboard below the RingTeaserCard**

```tsx
{fusionSignal && (
  <motion.div className="mb-16" {...fadeIn(0.45)}>
    <DailyEnergyTeaser signal={fusionSignal} lang={lang} isPremium={isPremium} />
  </motion.div>
)}
```

Import: `import { DailyEnergyTeaser } from './DailyEnergyTeaser';`

**Step 3: Verify + Commit**

```bash
git add src/components/DailyEnergyTeaser.tsx src/components/Dashboard.tsx
git commit -m "feat: add DailyEnergyTeaser card on Dashboard"
```

---

## Task 8: Mobile Bottom Nav with Fu-Ring Tab

**Files:**
- Modify: `src/App.tsx` (bottom nav section, ~line 394)

**Step 1: Add Fu-Ring tab to mobile nav**

In the `<nav>` bottom bar in App.tsx, add a Fu-Ring icon/link between the Atlas and Planetarium buttons.

```tsx
import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, Telescope, CircleDot } from 'lucide-react';
```

Replace the bottom nav content to include route-aware highlighting:

```tsx
<nav className="md:hidden fixed bottom-0 w-full bg-white/70 backdrop-blur-xl border-t border-[#8B6914]/15 flex items-center justify-around z-50 h-16">
  <div className="lang-toggle" role="group">
    <button className={lang === "de" ? "active" : ""} onClick={() => setLang("de")}>DE</button>
    <button className={lang === "en" ? "active" : ""} onClick={() => setLang("en")}>EN</button>
  </div>

  <Link to="/" className={`flex flex-col items-center gap-1 ${location.pathname === '/' ? 'text-[#8B6914]' : 'text-[#1E2A3A]/40'}`}>
    <LayoutGrid className="w-5 h-5" />
    <span className="text-[8px] uppercase tracking-tighter">{t("nav.atlas")}</span>
  </Link>

  <Link to="/fu-ring" className={`flex flex-col items-center gap-1 ${location.pathname === '/fu-ring' ? 'text-[#8B6914]' : 'text-[#1E2A3A]/40'}`}>
    <CircleDot className="w-5 h-5" />
    <span className="text-[8px] uppercase tracking-tighter">Fu-Ring</span>
  </Link>

  <button onClick={togglePlanetarium} className={planetariumMode ? "text-[#D4AF37]" : "text-[#1E2A3A]/40"}>
    <Telescope className="w-5 h-5" />
  </button>

  <button onClick={ambiente.toggle} className="text-[#1E2A3A]/40 hover:text-[#8B6914] transition-colors">
    {ambiente.playing ? <Volume2 className="w-5 h-5 text-[#8B6914]" /> : <VolumeX className="w-5 h-5" />}
  </button>
</nav>
```

Note: `useLocation()` from react-router-dom must be called inside `<BrowserRouter>`. Since the bottom nav renders inside the authenticated section that wraps `<BrowserRouter>`, this works. If the nav is outside the router, use `window.location.pathname` as fallback.

**Step 2: Verify on mobile viewport**

Run: `npm run dev` — resize to 375px width.
Both Dashboard and Fu-Ring tabs should show with correct highlighting.

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add Fu-Ring tab to mobile bottom nav with route highlighting"
```

---

## Task 9: Fu-Ring Page CSS Tokens

**Files:**
- Modify: `src/index.css`

**Step 1: Add ring-specific tokens to the @theme block**

```css
/* Fu-Ring page (always dark) */
--color-ring-bg:       #020509;
--color-ring-surface:  #0A1628;
--color-ring-border:   rgba(70,130,220,0.18);
--color-ring-text:     rgba(215,230,255,0.85);
--color-ring-muted:    rgba(215,230,255,0.40);
```

**Step 2: Add `.ring-card` utility class**

```css
/* Fu-Ring card — flat, dark, no glass */
.ring-card {
  background: #0A1628;
  border: 1px solid rgba(70,130,220,0.18);
  border-radius: 8px;
  color: rgba(215,230,255,0.85);
}
```

**Step 3: Update FuRingPage to use tokens instead of inline styles**

Replace inline `style={{ background: RING.surface }}` with class-based approach where possible.

**Step 4: Commit**

```bash
git add src/index.css src/pages/FuRingPage.tsx
git commit -m "style: add Fu-Ring CSS tokens and .ring-card utility"
```

---

## Task 10: OG Meta Tags for /fu-ring

**Files:**
- Modify: `server.mjs`

**Step 1: Add route-specific meta tags**

In server.mjs, before the catch-all `res.sendFile('index.html')`, add:

```js
app.get('/fu-ring', (req, res) => {
  // Read index.html and inject OG tags for social sharing
  const html = fs.readFileSync(path.join(__dirname, 'dist', 'index.html'), 'utf8');
  const ogHtml = html.replace(
    '<head>',
    `<head>
    <meta property="og:title" content="Mein Fu-Ring — Bazodiac" />
    <meta property="og:description" content="Dein persönliches Energieprofil als Fusionsring" />
    <meta property="og:type" content="website" />`
  );
  res.send(ogHtml);
});
```

This must be placed BEFORE the catch-all static file handler.

**Step 2: Commit**

```bash
git add server.mjs
git commit -m "feat: add OG meta tags for /fu-ring social sharing"
```

---

## Task 11: Performance Verification

**Files:** None (testing only)

**Step 1: Verify no rAF loops on Dashboard**

Open Chrome DevTools → Performance tab → record 5 seconds on Dashboard.
Expected: No `requestAnimationFrame` calls from FusionRing or FusionRingTimeline. Only the Orrery canvas should have rAF.

**Step 2: Verify Fu-Ring has single rAF**

Navigate to `/fu-ring` → record 5 seconds.
Expected: Single rAF loop from the FusionRing canvas. Stable 60fps.

**Step 3: Lighthouse audit**

Run Lighthouse on Dashboard (mobile): target Performance >= 85.

**Step 4: Commit any fixes found**

---

## Task Summary

| # | Task | Est. | Dependencies |
|---|------|------|-------------|
| 1 | Install React Router | 5min | — |
| 2 | FusionRingContext | 15min | — |
| 3 | Router + Page Shells | 15min | Task 1 |
| 4 | Wire Router into App.tsx | 30min | Tasks 1-3 |
| 5 | FuRingPage Full Layout | 30min | Task 4 |
| 6 | RingTeaserCard | 20min | Task 4 |
| 7 | DailyEnergyTeaser | 15min | Task 4 |
| 8 | Mobile Nav Fu-Ring Tab | 15min | Task 4 |
| 9 | CSS Tokens | 10min | Task 5 |
| 10 | OG Meta Tags | 10min | — |
| 11 | Performance Verification | 15min | Tasks 5-7 |

**Critical path:** 1 → 3 → 4 → 5 (ring page working). Tasks 6-8 can run in parallel after Task 4. Tasks 2 and 10 have no dependencies.

**Not included (already done):**
- FR-06/FR-07 (WuXing SVG) — already implemented as SVG components
