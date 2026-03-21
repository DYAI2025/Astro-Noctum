# First-Time Experience — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the new-user journey from landing to first dashboard interaction with a guided, layered experience.

**Architecture:** State-machine driven tour on dashboard (`tourStep: 0→1→2→3→done`), accordion-based astro tiles, live V2-Canvas signatur reveal, and first-visit quiz popup on `/signatur`. All tour/intro state persisted in Supabase `profiles` table to prevent re-showing.

**Tech Stack:** React 19, Framer Motion, Tailwind v4, Supabase, Zod, Vitest, FusionRingCanvasV2 (Three.js)

**Design Doc:** `docs/plans/2026-03-21-first-time-experience-design.md`

---

## Task 1: Supabase Migration — Add Tour + Intro Columns

**Files:**
- Create: `supabase-migrations/20260321_first_time_experience.sql`

**Step 1: Write the migration**

```sql
-- First-Time Experience columns
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tour_completed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS signatur_intro_seen BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'de'
    CHECK (language IN ('de', 'en'));
```

**Step 2: Verify syntax**

Run: `npx supabase db diff --local` (if available) or just review manually.

**Step 3: Commit**

```bash
git add supabase-migrations/20260321_first_time_experience.sql
git commit -m "feat(AN-FTE): add tour_completed, signatur_intro_seen, language to profiles"
```

---

## Task 2: Splash Redesign — Gold Cormorant Typography

**Files:**
- Modify: `src/components/Splash.tsx`
- Test: `src/__tests__/splash-redesign.test.tsx`

**Step 1: Write the failing test**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { Splash } from '../components/Splash';

describe('Splash redesign', () => {
  it('renders BAZODIAC in gold Cormorant Garamond', () => {
    render(<Splash onEnter={vi.fn()} />);
    const title = screen.getByText('BAZODIAC');
    expect(title).toBeDefined();
    expect(title.className).toContain('font-serif');
    expect(title.className).toContain('text-gold');
  });

  it('renders TOUCH THE SURFACE subtitle', () => {
    render(<Splash onEnter={vi.fn()} />);
    expect(screen.getByText(/touch the surface/i)).toBeDefined();
  });

  it('calls onEnter when tapped', () => {
    const onEnter = vi.fn();
    render(<Splash onEnter={onEnter} />);
    fireEvent.click(screen.getByText('BAZODIAC'));
    expect(onEnter).toHaveBeenCalledOnce();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/splash-redesign.test.tsx`
Expected: FAIL — current Splash renders different content in hero phase.

**Step 3: Implement the redesign**

Modify `src/components/Splash.tsx`:
- Replace the hero phase (`phase === "hero"`) with:
  - Full-screen dark background (`bg-[#010409]`)
  - "BAZODIAC" in `font-serif text-[#D4AF37] text-5xl md:text-7xl tracking-[0.3em] uppercase`
  - "TOUCH THE SURFACE" below in `text-[#D4AF37]/50 text-[9px] tracking-[0.5em] uppercase mt-6`
  - Click anywhere → `onEnter()` (same as current tap behavior)
  - Keep `EnterStarfield` + `EnterParticles` as background
- Keep gate/video/animation phases unchanged
- Video remains skippable (`canSkip` already exists)

Key change in the hero render block (around line 170-210):
```tsx
// Replace the existing hero stage content with:
<div
  className="fixed inset-0 bg-[#010409] flex flex-col items-center justify-center cursor-pointer select-none z-50"
  onClick={handleEnter}
>
  <EnterStarfield active />
  <EnterParticles active />
  <h1 className="font-serif text-[#D4AF37] text-5xl md:text-7xl tracking-[0.3em] uppercase relative z-10">
    BAZODIAC
  </h1>
  <p className="text-[#D4AF37]/50 text-[9px] tracking-[0.5em] uppercase mt-6 relative z-10">
    TOUCH THE SURFACE
  </p>
</div>
```

Note: The `handleEnter` function is the existing function at line ~58 that calls `onEnter()`. Remove the multi-stage animation (stages 0-4) from the hero phase — it's now a single static screen.

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/splash-redesign.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/Splash.tsx src/__tests__/splash-redesign.test.tsx
git commit -m "feat(AN-FTE): redesign Splash — gold Cormorant BAZODIAC typography"
```

---

## Task 3: AuthGate Restructure — Login Top, Register Bottom, Language Selector

**Files:**
- Modify: `src/components/AuthGate.tsx`
- Test: `src/__tests__/authgate-restructure.test.tsx`

**Step 1: Write the failing test**

```typescript
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

// Mock contexts
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    signIn: vi.fn(),
    signUp: vi.fn(),
    loading: false,
  }),
}));
vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({
    lang: 'de',
    setLang: vi.fn(),
    t: (key: string) => key,
  }),
}));

import { AuthGate } from '../components/AuthGate';

describe('AuthGate restructure', () => {
  it('shows login section above register section', () => {
    render(<AuthGate />);
    const loginHeading = screen.getByText(/einloggen|login/i);
    const registerHeading = screen.getByText(/registrieren|register/i);
    expect(loginHeading).toBeDefined();
    expect(registerHeading).toBeDefined();
    // Login should appear before Register in DOM order
    const allHeadings = screen.getAllByRole('heading');
    const loginIdx = allHeadings.findIndex(h => /einloggen|login/i.test(h.textContent || ''));
    const registerIdx = allHeadings.findIndex(h => /registrieren|register/i.test(h.textContent || ''));
    expect(loginIdx).toBeLessThan(registerIdx);
  });

  it('shows language selector in register section', () => {
    render(<AuthGate />);
    expect(screen.getByLabelText(/sprache|language/i)).toBeDefined();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/authgate-restructure.test.tsx`
Expected: FAIL — current AuthGate uses mode toggle, not both visible.

**Step 3: Implement the restructure**

Modify `src/components/AuthGate.tsx`:
- Remove `mode` state toggle — show both Login and Register on one page
- Login section (top): email, password, "Einloggen" button
- Divider: `── oder ──`
- Register section (bottom): bold "Registrieren" heading, email, password, confirm password, language select (`<select>` with DE/EN), "Konto erstellen" button
- Language select calls `setLang()` from context AND will be persisted to `profiles.language` on signup
- Keep all existing auth logic (signIn/signUp handlers), just restructure layout

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/authgate-restructure.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/AuthGate.tsx src/__tests__/authgate-restructure.test.tsx
git commit -m "feat(AN-FTE): restructure AuthGate — login top, register bottom, language selector"
```

---

## Task 4: Returning Users Skip Splash

**Files:**
- Modify: `src/App.tsx`

**Step 1: Implement the skip logic**

In `src/App.tsx`, modify the Splash rendering condition (around line 125-139):

```tsx
// Before the splash render block, add:
// Returning users (already logged in from prior session) skip Splash entirely
const isReturningUser = !authLoading && user !== null;

if (showSplash && !isReturningUser) {
  return (
    <AnimatePresence>
      {/* ... existing Splash render ... */}
    </AnimatePresence>
  );
}
// If returning user, skip splash — fall through to auth check / dashboard
```

Also ensure `siteVisible` is set to `true` immediately for returning users:

```tsx
useEffect(() => {
  if (isReturningUser) {
    setShowSplash(false);
    setSiteVisible(true);
  }
}, [isReturningUser]);
```

**Step 2: Verify lint passes**

Run: `npm run lint`
Expected: clean

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat(AN-FTE): returning users skip Splash — direct to dashboard"
```

---

## Task 5: SignatureReveal — Live V2 Canvas, No Quiz, No Profile

**Files:**
- Modify: `src/components/onboarding/SignatureReveal.tsx`
- Test: `src/__tests__/signatur-reveal-v2.test.tsx`

**Step 1: Write the failing test**

```typescript
import { render, screen, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../lib/feature-flags', () => ({
  isFeatureEnabled: (flag: string) => flag === 'signature_engine_v2',
}));
vi.mock('../components/fusion-ring-website/signatur-bridge', () => ({
  soulprintToNatalWeights: (sectors: number[]) => ({ Sun: 0.5, Moon: 0.5 }),
  quizSectorsToQuizWeights: vi.fn(),
}));

// Mock canvas components to avoid WebGL
vi.mock('../components/fusion-ring-website/FusionRingCanvasV2', () => ({
  default: (props: any) => <div data-testid="v2-canvas" />,
}));

import { SignatureReveal } from '../components/onboarding/SignatureReveal';

const mockBootstrap = {
  profile: { sun_sign: 'Aries', moon_sign: 'Cancer', ascendant_sign: 'Leo', day_master: 'Wood', harmony_index: 0.8 },
  soulprint_sectors: [0.5, 0.6, 0.7, 0.8, 0.5, 0.6, 0.7, 0.8, 0.5, 0.6, 0.7, 0.8],
  narratives: { core_summary: '', context_summary: '', integration_summary: '' },
  signature_blueprint: { seed: 'test' },
  meta: { engine_version: 'test' },
};

describe('SignatureReveal V2', () => {
  it('renders live canvas instead of screenshot', () => {
    render(<SignatureReveal bootstrapData={mockBootstrap} onComplete={vi.fn()} />);
    expect(screen.getByTestId('v2-canvas')).toBeDefined();
  });

  it('does NOT render quiz options', () => {
    render(<SignatureReveal bootstrapData={mockBootstrap} onComplete={vi.fn()} />);
    expect(screen.queryByText(/beschreibt dich/i)).toBeNull();
  });

  it('does NOT render profile summary', () => {
    render(<SignatureReveal bootstrapData={mockBootstrap} onComplete={vi.fn()} />);
    expect(screen.queryByText('Aries')).toBeNull();
    expect(screen.queryByText(/harmonie/i)).toBeNull();
  });

  it('shows WEITER button after delay', async () => {
    vi.useFakeTimers();
    render(<SignatureReveal bootstrapData={mockBootstrap} onComplete={vi.fn()} />);
    expect(screen.queryByText(/weiter/i)).toBeNull();
    await act(() => vi.advanceTimersByTime(3500));
    expect(screen.getByText(/weiter/i)).toBeDefined();
    vi.useRealTimers();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/signatur-reveal-v2.test.tsx`
Expected: FAIL — current SignatureReveal has quiz + profile.

**Step 3: Implement the redesign**

Rewrite `src/components/onboarding/SignatureReveal.tsx` (231 lines → ~80 lines):

```tsx
import { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { BootstrapResponse, SignatureDeltaResponse } from '@/src/lib/schemas/experience';
import type { ApiData } from '@/src/types/bafe';
import { isFeatureEnabled } from '@/src/lib/feature-flags';
import { soulprintToNatalWeights } from '@/src/components/fusion-ring-website/signatur-bridge';

const FusionRingCanvasV2 = lazy(() => import('@/src/components/fusion-ring-website/FusionRingCanvasV2'));
const FusionRingWebsiteCanvas = lazy(() => import('@/src/components/fusion-ring-website/FusionRingWebsiteCanvas').then(m => ({ default: m.FusionRingWebsiteCanvas })));

const DEFAULT_SECTORS = Array(12).fill(0.5);

// Device capability check for V2
function canRunV2(): boolean {
  if (typeof navigator === 'undefined') return true;
  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as any).deviceMemory ?? 8;
  return cores > 2 && memory >= 4;
}

interface Props {
  bootstrapData: BootstrapResponse;
  fallbackApiData?: ApiData | null;
  onComplete: (deltaData: SignatureDeltaResponse | null) => void;
}

export function SignatureReveal({ bootstrapData, onComplete }: Props) {
  const [showButton, setShowButton] = useState(false);
  const [revealProgress, setRevealProgress] = useState(0);

  const useV2 = isFeatureEnabled('signature_engine_v2') && canRunV2();
  const sectors = bootstrapData.soulprint_sectors?.length === 12
    ? bootstrapData.soulprint_sectors
    : DEFAULT_SECTORS;

  const natalWeights = useMemo(() => soulprintToNatalWeights(sectors), [sectors]);

  // Morph animation: neutral → personal over 2s, then show button at 3s
  useEffect(() => {
    const morphTimer = setTimeout(() => setRevealProgress(1), 500);
    const buttonTimer = setTimeout(() => setShowButton(true), 3000);
    return () => { clearTimeout(morphTimer); clearTimeout(buttonTimer); };
  }, []);

  return (
    <div className="fixed inset-0 bg-[#010409] flex flex-col items-center justify-center z-50">
      {/* Ring container — round clipped */}
      <div className="w-[200px] h-[200px] rounded-full overflow-hidden relative">
        <Suspense fallback={<div className="w-full h-full bg-[#010409]" />}>
          {useV2 ? (
            <FusionRingCanvasV2
              natalWeights={revealProgress > 0 ? natalWeights : undefined}
              isMini
              showUI={false}
              revealProgress={revealProgress}
              className="w-full h-full"
            />
          ) : (
            <FusionRingWebsiteCanvas
              soulProfile={revealProgress > 0 ? sectors : DEFAULT_SECTORS}
              showEffectControls={false}
            />
          )}
        </Suspense>
      </div>

      {/* Title */}
      <motion.p
        className="mt-8 font-serif text-xl text-[#D4AF37]/80 tracking-wider"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1.5 }}
      >
        Deine Signatur entsteht...
      </motion.p>

      {/* Continue button — appears after animation */}
      <AnimatePresence>
        {showButton && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 px-8 py-3 border border-[#D4AF37]/30 text-[#D4AF37] text-xs uppercase tracking-[0.3em] rounded-lg hover:bg-[#D4AF37]/10 transition-colors"
            onClick={() => onComplete(null)}
          >
            Weiter
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/signatur-reveal-v2.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/onboarding/SignatureReveal.tsx src/__tests__/signatur-reveal-v2.test.tsx
git commit -m "feat(AN-FTE): SignatureReveal — live V2 canvas morph, no quiz, no profile"
```

---

## Task 6: Fix Signatur Nav Link — Always Active

**Files:**
- Modify: `src/App.tsx` (AppShell nav section, around lines 286-309)

**Step 1: Find and fix the grayed-out Signatur link**

In `src/App.tsx`, the nav link for Signatur (around line 290-295) likely has a conditional class. Change it to always be active:

```tsx
// Find the Signatur nav link and ensure it's never grayed out:
<Link
  to="/signatur"
  className={`transition-colors ${
    location.pathname === "/signatur"
      ? "text-gold-deep"
      : "text-ink/60 hover:text-gold-deep"  // was: "text-ink/30 pointer-events-none" or similar
  }`}
>
  Signatur
</Link>
```

Remove any `hasCompleteProfile` or other condition that gates this link.

**Step 2: Verify lint passes**

Run: `npm run lint`

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "fix(AN-FTE): Signatur nav link always active — never grayed out"
```

---

## Task 7: Astro Accordion Tiles

**Files:**
- Create: `src/components/dashboard/AstroAccordion.tsx`
- Create: `src/components/dashboard/AstroAccordionTile.tsx`
- Test: `src/__tests__/astro-accordion.test.tsx`

**Step 1: Write the failing test**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'de', t: (k: string) => k }),
}));

import { AstroAccordion } from '../components/dashboard/AstroAccordion';

const mockApiData = {
  western: { zodiac_sign: 'Aries', moon_sign: 'Cancer', ascendant_sign: 'Leo' },
  bazi: { zodiac_sign: 'Dragon', day_master: 'Wood', pillars: { year: { stem: 'Yang Wood' }, month: { stem: 'Yin Fire' }, day: { stem: 'Yang Water' }, hour: { stem: 'Yin Metal' } } },
  wuxing: { dominant_element: 'Wood', secondary_element: 'Fire', deficient_element: 'Metal' },
};

describe('AstroAccordion', () => {
  it('renders 3 main tiles', () => {
    render(<AstroAccordion apiData={mockApiData} tileTexts={{}} />);
    expect(screen.getByText(/sonnenzeichen/i)).toBeDefined();
    expect(screen.getByText(/bazi/i)).toBeDefined();
    expect(screen.getByText(/wu xing/i)).toBeDefined();
  });

  it('expands sun sign tile on click', () => {
    render(<AstroAccordion apiData={mockApiData} tileTexts={{}} />);
    fireEvent.click(screen.getByText(/sonnenzeichen/i));
    expect(screen.getByText(/mondzeichen/i)).toBeDefined();
    expect(screen.getByText(/aszendent/i)).toBeDefined();
  });

  it('shows signatur hint in expanded tile', () => {
    render(<AstroAccordion apiData={mockApiData} tileTexts={{}} />);
    fireEvent.click(screen.getByText(/sonnenzeichen/i));
    expect(screen.getByText(/fundament deiner signatur/i)).toBeDefined();
  });

  it('closes previous tile when opening another (accordion pattern)', () => {
    render(<AstroAccordion apiData={mockApiData} tileTexts={{}} />);
    fireEvent.click(screen.getByText(/sonnenzeichen/i));
    expect(screen.getByText(/mondzeichen/i)).toBeDefined();
    fireEvent.click(screen.getByText(/bazi/i));
    expect(screen.queryByText(/mondzeichen/i)).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/astro-accordion.test.tsx`
Expected: FAIL — components don't exist yet.

**Step 3: Create `AstroAccordionTile.tsx`**

```tsx
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight } from 'lucide-react';

interface SubTile {
  label: string;
  value: string;
  description?: string;
}

interface AstroAccordionTileProps {
  icon: string;
  title: string;
  value: string;
  description?: string;
  subTiles: SubTile[];
  isOpen: boolean;
  onToggle: () => void;
  isFirstReveal?: boolean;
}

export function AstroAccordionTile({
  icon, title, value, description, subTiles, isOpen, onToggle, isFirstReveal,
}: AstroAccordionTileProps) {
  return (
    <div className="rounded-2xl border border-gold/10 bg-obsidian/80 overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gold/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{icon}</span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-gold/70">{title}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-ink/80 font-serif">{value}</span>
          <motion.div animate={{ rotate: isOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronRight className="w-4 h-4 text-gold/40" />
          </motion.div>
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4">
              {/* Main description */}
              {description && (
                <p className="text-sm text-ink/70 leading-relaxed">{description}</p>
              )}

              {/* Signatur hint */}
              <div className="p-3 rounded-xl bg-gold/10 border border-gold/20">
                <p className="text-xs text-[#D4AF37] leading-relaxed">
                  Diese Energien bilden das Fundament deiner Signatur.
                </p>
              </div>

              {/* Sub-tiles */}
              {subTiles.map((sub) => (
                <SubAccordion key={sub.label} {...sub} isFirstReveal={isFirstReveal} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SubAccordion({ label, value, description, isFirstReveal }: SubTile & { isFirstReveal?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`rounded-xl border overflow-hidden transition-colors ${
        isFirstReveal && !open
          ? 'border-gold/40 animate-pulse-gold'  // attention cue
          : 'border-gold/15'
      }`}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gold/5 transition-colors"
      >
        <span className="text-xs text-ink/60 uppercase tracking-wider">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink/70 font-serif">{value}</span>
          <motion.div animate={{ rotate: open ? 90 : 0 }}>
            <ChevronRight className="w-3 h-3 text-gold/30" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 space-y-2">
              {description && <p className="text-xs text-ink/60 leading-relaxed">{description}</p>}
              <div className="p-2 rounded-lg bg-gold/5 border border-gold/10">
                <p className="text-[10px] text-[#D4AF37]/80">
                  Fundament deiner Signatur
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useState } from 'react';
```

Note: Move the `useState` import to the top of the file when implementing.

**Step 4: Create `AstroAccordion.tsx`**

```tsx
import { useState } from 'react';
import { AstroAccordionTile } from './AstroAccordionTile';
import { useLanguage } from '@/src/contexts/LanguageContext';
import type { ApiData } from '@/src/types/bafe';
import type { TileTexts } from '@/src/types/interpretation';

interface AstroAccordionProps {
  apiData: ApiData;
  tileTexts: TileTexts;
}

export function AstroAccordion({ apiData, tileTexts }: AstroAccordionProps) {
  const { lang } = useLanguage();
  const [openTile, setOpenTile] = useState<string | null>(null);

  const toggle = (id: string) => setOpenTile(prev => prev === id ? null : id);

  const tiles = [
    {
      id: 'western',
      icon: '\u2600\uFE0F',
      title: lang === 'de' ? 'Sonnenzeichen' : 'Sun Sign',
      value: apiData.western?.zodiac_sign || '\u2014',
      description: tileTexts.sun || '',
      subTiles: [
        {
          label: lang === 'de' ? 'Mondzeichen' : 'Moon Sign',
          value: apiData.western?.moon_sign || '\u2014',
          description: tileTexts.moon || '',
        },
        {
          label: lang === 'de' ? 'Aszendent' : 'Ascendant',
          value: apiData.western?.ascendant_sign || '\u2014',
          description: tileTexts.ascendant || '',
        },
      ],
    },
    {
      id: 'bazi',
      icon: '\uD83C\uDFEF',
      title: 'BaZi',
      value: apiData.bazi?.zodiac_sign || '\u2014',
      description: tileTexts.bazi || '',
      subTiles: [
        {
          label: lang === 'de' ? 'Tagesmeister' : 'Day Master',
          value: apiData.bazi?.day_master || '\u2014',
          description: tileTexts.dayMaster || '',
        },
        {
          label: lang === 'de' ? 'Monatsstamm' : 'Month Stem',
          value: apiData.bazi?.pillars?.month?.stem || '\u2014',
          description: tileTexts.monthStem || '',
        },
        {
          label: lang === 'de' ? 'Jahresstamm' : 'Year Stem',
          value: apiData.bazi?.pillars?.year?.stem || '\u2014',
          description: tileTexts.yearStem || '',
        },
        {
          label: lang === 'de' ? 'Stundenstamm' : 'Hour Stem',
          value: apiData.bazi?.pillars?.hour?.stem || '\u2014',
          description: tileTexts.hourStem || '',
        },
      ],
    },
    {
      id: 'wuxing',
      icon: '\uD83D\uDD25',
      title: 'Wu Xing',
      value: apiData.wuxing?.dominant_element || '\u2014',
      description: tileTexts.wuxing || '',
      subTiles: [
        {
          label: lang === 'de' ? 'Dominantes Element' : 'Dominant Element',
          value: apiData.wuxing?.dominant_element || '\u2014',
          description: tileTexts.dominantElement || '',
        },
        {
          label: lang === 'de' ? 'Sekundäres Element' : 'Secondary Element',
          value: apiData.wuxing?.secondary_element || '\u2014',
          description: tileTexts.secondaryElement || '',
        },
        {
          label: lang === 'de' ? 'Mangel-Element' : 'Deficient Element',
          value: apiData.wuxing?.deficient_element || '\u2014',
          description: tileTexts.deficientElement || '',
        },
      ],
    },
  ];

  return (
    <div className="space-y-3">
      {tiles.map((tile) => (
        <AstroAccordionTile
          key={tile.id}
          icon={tile.icon}
          title={tile.title}
          value={tile.value}
          description={tile.description}
          subTiles={tile.subTiles}
          isOpen={openTile === tile.id}
          onToggle={() => toggle(tile.id)}
        />
      ))}
    </div>
  );
}
```

**Step 5: Run test to verify it passes**

Run: `npx vitest run src/__tests__/astro-accordion.test.tsx`
Expected: PASS

**Step 6: Commit**

```bash
git add src/components/dashboard/AstroAccordion.tsx src/components/dashboard/AstroAccordionTile.tsx src/__tests__/astro-accordion.test.tsx
git commit -m "feat(AN-FTE): accordion astro tiles with sub-tiles and signatur hints"
```

---

## Task 8: Dashboard Tour Hook — `useDashboardTour`

**Files:**
- Create: `src/hooks/useDashboardTour.ts`
- Test: `src/__tests__/use-dashboard-tour.test.ts`

**Step 1: Write the failing test**

```typescript
import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: { tour_completed: false }, error: null }),
        }),
      }),
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
  },
}));

import { useDashboardTour } from '../hooks/useDashboardTour';

describe('useDashboardTour', () => {
  it('starts at step 0 for new users', async () => {
    const { result } = renderHook(() => useDashboardTour('user-123'));
    // Wait for Supabase fetch
    await act(() => new Promise(r => setTimeout(r, 50)));
    expect(result.current.tourStep).toBe(0);
  });

  it('advances step on next()', async () => {
    const { result } = renderHook(() => useDashboardTour('user-123'));
    await act(() => new Promise(r => setTimeout(r, 50)));
    act(() => result.current.next());
    expect(result.current.tourStep).toBe(1);
  });

  it('returns done for completed users', async () => {
    // Override mock for this test
    vi.mocked(await import('../lib/supabase')).supabase.from = () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve({ data: { tour_completed: true }, error: null }),
        }),
      }),
      update: () => ({ eq: () => Promise.resolve({ error: null }) }),
    }) as any;

    const { result } = renderHook(() => useDashboardTour('user-123'));
    await act(() => new Promise(r => setTimeout(r, 50)));
    expect(result.current.tourStep).toBe('done');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/use-dashboard-tour.test.ts`
Expected: FAIL — hook doesn't exist.

**Step 3: Implement the hook**

```typescript
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/lib/supabase';

export type TourStep = 0 | 1 | 2 | 3 | 'done';

export function useDashboardTour(userId: string | undefined) {
  const [tourStep, setTourStep] = useState<TourStep | null>(null); // null = loading

  // Fetch tour_completed from profiles
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('tour_completed')
        .eq('id', userId)
        .maybeSingle();

      if (cancelled) return;
      setTourStep(data?.tour_completed ? 'done' : 0);
    })();

    return () => { cancelled = true; };
  }, [userId]);

  const next = useCallback(() => {
    setTourStep((prev) => {
      if (prev === null || prev === 'done') return prev;
      if (prev === 3) {
        // Persist completion
        if (userId) {
          supabase.from('profiles').update({ tour_completed: true }).eq('id', userId);
        }
        return 'done';
      }
      return (prev + 1) as TourStep;
    });
  }, [userId]);

  const skip = useCallback(() => {
    if (userId) {
      supabase.from('profiles').update({ tour_completed: true }).eq('id', userId);
    }
    setTourStep('done');
  }, [userId]);

  return {
    tourStep: tourStep ?? 'done', // treat loading as done to avoid flash
    isLoading: tourStep === null,
    next,
    skip,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/use-dashboard-tour.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/hooks/useDashboardTour.ts src/__tests__/use-dashboard-tour.test.ts
git commit -m "feat(AN-FTE): useDashboardTour hook — state machine with Supabase persistence"
```

---

## Task 9: TourOverlay Component

**Files:**
- Create: `src/components/dashboard/TourOverlay.tsx`
- Test: `src/__tests__/tour-overlay.test.tsx`

**Step 1: Write the failing test**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { TourOverlay } from '../components/dashboard/TourOverlay';

describe('TourOverlay', () => {
  it('renders step 0 welcome message', () => {
    render(<TourOverlay step={0} birthDate="21.03.2026" birthCity="Berlin" onNext={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.getByText(/willkommen zum himmel/i)).toBeDefined();
    expect(screen.getByText(/21.03.2026/)).toBeDefined();
    expect(screen.getByText(/Berlin/)).toBeDefined();
  });

  it('renders step 1 astro message', () => {
    render(<TourOverlay step={1} birthDate="" birthCity="" onNext={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.getByText(/schau dir deine zeichen/i)).toBeDefined();
  });

  it('renders step 2 levi message with two buttons', () => {
    render(<TourOverlay step={2} birthDate="" birthCity="" onNext={vi.fn()} onSkip={vi.fn()} onLeviStart={vi.fn()} />);
    expect(screen.getByText(/levi/i)).toBeDefined();
    expect(screen.getByText(/jetzt sprechen/i)).toBeDefined();
    expect(screen.getByText(/später/i)).toBeDefined();
  });

  it('renders step 3 navigation hints', () => {
    render(<TourOverlay step={3} birthDate="" birthCity="" onNext={vi.fn()} onSkip={vi.fn()} />);
    expect(screen.getByText(/signatur/i)).toBeDefined();
    expect(screen.getByText(/verstanden/i)).toBeDefined();
  });

  it('does not render when step is done', () => {
    const { container } = render(<TourOverlay step="done" birthDate="" birthCity="" onNext={vi.fn()} onSkip={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('calls onNext when OK clicked', () => {
    const onNext = vi.fn();
    render(<TourOverlay step={0} birthDate="21.03.2026" birthCity="Berlin" onNext={onNext} onSkip={vi.fn()} />);
    fireEvent.click(screen.getByText('OK'));
    expect(onNext).toHaveBeenCalledOnce();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/tour-overlay.test.tsx`
Expected: FAIL — component doesn't exist.

**Step 3: Implement TourOverlay**

```tsx
import { motion, AnimatePresence } from 'motion/react';
import type { TourStep } from '@/src/hooks/useDashboardTour';

interface TourOverlayProps {
  step: TourStep;
  birthDate: string;
  birthCity: string;
  onNext: () => void;
  onSkip: () => void;
  onLeviStart?: () => void;
}

export function TourOverlay({ step, birthDate, birthCity, onNext, onSkip, onLeviStart }: TourOverlayProps) {
  if (step === 'done' || step === null) return null;

  const steps: Record<number, { title: string; body: string; buttons: { label: string; action: () => void }[] }> = {
    0: {
      title: 'Willkommen',
      body: `Willkommen zum Himmel deiner Geburt am ${birthDate} in ${birthCity}`,
      buttons: [{ label: 'OK', action: onNext }],
    },
    1: {
      title: 'Deine Zeichen',
      body: 'Schau dir deine Zeichen an. Klicke auf die Kacheln, um mehr darüber zu erfahren.',
      buttons: [{ label: 'OK', action: onNext }],
    },
    2: {
      title: 'Levi',
      body: 'Das ist Levi, dein persönlicher kosmischer Berater.\n\nDeine erste Sitzung — 10 Minuten gratis.',
      buttons: [
        { label: 'JETZT SPRECHEN', action: () => { onLeviStart?.(); onNext(); } },
        { label: 'SPÄTER', action: onNext },
      ],
    },
    3: {
      title: 'Entdecken',
      body: 'Oben findest du deine Signatur — dort verfeinerst du dein kosmisches Profil.\n\nScrolle weiter für dein Tageshoroskop und deinen Soul Blueprint.',
      buttons: [{ label: 'VERSTANDEN', action: onNext }],
    },
  };

  const content = steps[step];
  if (!content) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={`tour-${step}`}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="mx-6 max-w-md w-full rounded-2xl border border-gold/15 bg-obsidian/95 p-8 shadow-2xl backdrop-blur-xl"
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-sm text-ink/80 leading-relaxed whitespace-pre-line">
            {content.body}
          </p>

          <div className="flex gap-3 mt-8">
            {content.buttons.map((btn) => (
              <button
                key={btn.label}
                onClick={btn.action}
                className="flex-1 px-6 py-2.5 border border-gold/25 text-gold text-[10px] uppercase tracking-[0.25em] rounded-lg hover:bg-gold/10 transition-colors"
              >
                {btn.label}
              </button>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/tour-overlay.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/dashboard/TourOverlay.tsx src/__tests__/tour-overlay.test.tsx
git commit -m "feat(AN-FTE): TourOverlay — glass-card popup for each tour step"
```

---

## Task 10: Dashboard Integration — Remove MiniSignature/LeviOrb, Wire Tour + Accordion

**Files:**
- Modify: `src/components/Dashboard.tsx`
- Modify: `src/components/dashboard/DashboardAstroSection.tsx`

**Step 1: Modify Dashboard.tsx**

Key changes in `src/components/Dashboard.tsx`:

1. **Remove imports** for `MiniSignature`, `LeviOrb`, `InfluenceGauges` (lines 24-27)
2. **Add imports** for `AstroAccordion`, `TourOverlay`, `useDashboardTour`
3. **Add tour hook** in component body:
   ```tsx
   const { tourStep, next: tourNext, skip: tourSkip } = useDashboardTour(userId);
   ```
4. **Remove** the "DAILY ZONES" grid (lines 264-284) — this is MiniSignature + LeviOrb + InfluenceGauges
5. **Add** `<TourOverlay>` at the bottom of the component (inside the return)
6. **Wire** Planetarium activation for step 0:
   ```tsx
   useEffect(() => {
     if (tourStep === 0) setPlanetariumMode(true);
   }, [tourStep]);
   ```
7. **Add scroll sentinels** for steps 1 and 2 (IntersectionObserver):
   ```tsx
   <div ref={astroSentinelRef} /> {/* before AstroAccordion */}
   <div ref={leviSentinelRef} />  {/* before Levi section */}
   ```

**Step 2: Modify DashboardAstroSection.tsx**

Replace the existing tile grid rendering section with the `AstroAccordion` component:

```tsx
// Replace the large tile rendering block with:
<AstroAccordion apiData={apiData} tileTexts={tileTexts || {}} />
```

Keep the `BirthChartOrrery` (planetarium) and `showBirthSkyWelcome` logic — just remove the old tiles.

**Step 3: Verify lint and existing tests pass**

Run: `npm run lint && npx vitest run`
Expected: clean lint, all tests pass (some may need mock updates for removed components)

**Step 4: Commit**

```bash
git add src/components/Dashboard.tsx src/components/dashboard/DashboardAstroSection.tsx
git commit -m "feat(AN-FTE): wire dashboard tour + accordion, remove MiniSignature/LeviOrb"
```

---

## Task 11: Signatur Page — First Visit Quiz Popup

**Files:**
- Create: `src/components/signatur/SignaturIntroPopup.tsx`
- Create: `src/components/signatur/SignaturExplainPopup.tsx`
- Modify: `src/pages/FuRingPage.tsx`
- Test: `src/__tests__/signatur-intro-popup.test.tsx`

**Step 1: Write the failing test**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { SignaturIntroPopup } from '../components/signatur/SignaturIntroPopup';

describe('SignaturIntroPopup', () => {
  it('renders quiz question', () => {
    render(<SignaturIntroPopup onAnswer={vi.fn()} />);
    expect(screen.getByText(/beschreibt dich am besten/i)).toBeDefined();
  });

  it('renders all 4 options', () => {
    render(<SignaturIntroPopup onAnswer={vi.fn()} />);
    expect(screen.getByText(/kreativ/i)).toBeDefined();
    expect(screen.getByText(/analysiere/i)).toBeDefined();
    expect(screen.getByText(/harmonie/i)).toBeDefined();
    expect(screen.getByText(/erfahrungen/i)).toBeDefined();
  });

  it('calls onAnswer with keyword when option clicked', () => {
    const onAnswer = vi.fn();
    render(<SignaturIntroPopup onAnswer={onAnswer} />);
    fireEvent.click(screen.getByText(/kreativ/i));
    expect(onAnswer).toHaveBeenCalledWith('expression');
  });

  it('does not close on backdrop click', () => {
    const onAnswer = vi.fn();
    const { container } = render(<SignaturIntroPopup onAnswer={onAnswer} />);
    const backdrop = container.querySelector('[data-testid="intro-backdrop"]');
    if (backdrop) fireEvent.click(backdrop);
    expect(onAnswer).not.toHaveBeenCalled();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/signatur-intro-popup.test.tsx`
Expected: FAIL

**Step 3: Create SignaturIntroPopup**

```tsx
import { motion } from 'motion/react';

const QUIZ_OPTIONS = [
  { keyword: 'expression', label: 'Ich drücke mich gerne kreativ aus' },
  { keyword: 'analytical', label: 'Ich analysiere gerne komplexe Zusammenhänge' },
  { keyword: 'harmony', label: 'Harmonie in Beziehungen ist mir sehr wichtig' },
  { keyword: 'adventure', label: 'Ich suche ständig neue Erfahrungen' },
] as const;

interface Props {
  onAnswer: (keyword: string) => void;
}

export function SignaturIntroPopup({ onAnswer }: Props) {
  return (
    <div
      data-testid="intro-backdrop"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      // No onClick on backdrop — user must answer
    >
      <motion.div
        className="mx-6 max-w-md w-full rounded-2xl border border-gold/15 bg-obsidian/95 p-8 shadow-2xl"
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="font-serif text-lg text-ink/90 mb-6 text-center">
          Was beschreibt dich am besten?
        </h2>

        <div className="space-y-3">
          {QUIZ_OPTIONS.map((opt) => (
            <button
              key={opt.keyword}
              onClick={() => onAnswer(opt.keyword)}
              className="w-full text-left px-5 py-4 rounded-xl border border-gold/10 bg-white/3 text-sm text-ink/70 hover:border-gold/30 hover:bg-gold/5 transition-all"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
```

**Step 4: Create SignaturExplainPopup**

```tsx
import { motion } from 'motion/react';

interface Props {
  onDismiss: () => void;
}

export function SignaturExplainPopup({ onDismiss }: Props) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div
        className="mx-6 max-w-md w-full rounded-2xl border border-gold/15 bg-obsidian/95 p-8 shadow-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <p className="text-sm text-ink/80 leading-relaxed">
          Hier verfeinerst du deine grundlegenden Signaturenergien. Durch das Lösen dieser Fragen
          verfeinerst du deine Signatur und hast Zugriff auf tiefere Informationen deiner
          fundamentalen kosmischen Systeme.
        </p>

        <button
          onClick={onDismiss}
          className="mt-8 w-full px-6 py-2.5 border border-gold/25 text-gold text-[10px] uppercase tracking-[0.25em] rounded-lg hover:bg-gold/10 transition-colors"
        >
          VERSTANDEN
        </button>
      </motion.div>
    </div>
  );
}
```

**Step 5: Wire into FuRingPage**

Add to `src/pages/FuRingPage.tsx`:

```tsx
import { SignaturIntroPopup } from '@/src/components/signatur/SignaturIntroPopup';
import { SignaturExplainPopup } from '@/src/components/signatur/SignaturExplainPopup';
import { supabase } from '@/src/lib/supabase';
import { signatureDelta } from '@/src/services/experience';
import { useAuth } from '@/src/contexts/AuthContext';

// Inside the component:
const { user } = useAuth();
const [introPhase, setIntroPhase] = useState<'loading' | 'quiz' | 'effect' | 'explain' | 'done'>('loading');

// Check if first visit
useEffect(() => {
  if (!user) return;
  (async () => {
    const { data } = await supabase
      .from('profiles')
      .select('signatur_intro_seen')
      .eq('id', user.id)
      .maybeSingle();
    setIntroPhase(data?.signatur_intro_seen ? 'done' : 'quiz');
  })();
}, [user]);

const handleIntroAnswer = async (keyword: string) => {
  setIntroPhase('effect');
  // Trigger ring effect
  setRingEffect({ type: 'burst', color: '#D4AF37', timestamp: Date.now() });
  // Call signatureDelta for real data
  try {
    const sectors = /* get from context */;
    const blueprint = /* get from context */;
    await signatureDelta(sectors, blueprint, keyword);
  } catch { /* non-critical */ }
  // Show explanation after 2s
  setTimeout(() => setIntroPhase('explain'), 2000);
};

const handleIntroDismiss = () => {
  setIntroPhase('done');
  if (user) {
    supabase.from('profiles').update({ signatur_intro_seen: true }).eq('id', user.id);
  }
};

// In the return JSX:
{introPhase === 'quiz' && <SignaturIntroPopup onAnswer={handleIntroAnswer} />}
{introPhase === 'explain' && <SignaturExplainPopup onDismiss={handleIntroDismiss} />}
```

**Step 6: Run tests**

Run: `npx vitest run src/__tests__/signatur-intro-popup.test.tsx`
Expected: PASS

**Step 7: Commit**

```bash
git add src/components/signatur/SignaturIntroPopup.tsx src/components/signatur/SignaturExplainPopup.tsx src/pages/FuRingPage.tsx src/__tests__/signatur-intro-popup.test.tsx
git commit -m "feat(AN-FTE): first-visit quiz popup on /signatur with ring burst effect"
```

---

## Task 12: Remove Quiz from Onboarding SignatureReveal

**Files:**
- Modify: `src/App.tsx` — remove quiz-related props from onboarding flow
- Verify: `src/components/onboarding/SignatureReveal.tsx` — already done in Task 5

**Step 1: Clean up App.tsx**

In `handleOnboardingSubmit` (around line 75-113), the bootstrap flow currently calls `signatureDelta()` after quiz answer. Since there's no quiz in onboarding anymore, the `onSignatureComplete` handler just needs to advance to `'done'`:

```tsx
const handleSignatureComplete = (_delta: SignatureDeltaResponse | null) => {
  setOnboardingPhase('done');
};
```

This is already correct. Verify no dead code references to quiz in onboarding.

**Step 2: Verify lint and all tests pass**

Run: `npm run lint && npx vitest run`
Expected: PASS

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "refactor(AN-FTE): clean up onboarding — no quiz, SignatureReveal is visual only"
```

---

## Task 13: Integration Test — Full First-Time Flow

**Files:**
- Create: `src/__tests__/first-time-experience-e2e.test.tsx`

**Step 1: Write integration test**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }) },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: () => Promise.resolve({ data: { tour_completed: false, signatur_intro_seen: false }, error: null }) }) }),
      update: () => ({ eq: () => Promise.resolve({ error: null }) }),
    }),
  },
}));

describe('First-Time Experience E2E', () => {
  it('tour starts at step 0 for new user', async () => {
    const { useDashboardTour } = await import('../hooks/useDashboardTour');
    const { renderHook, act } = await import('@testing-library/react');

    const { result } = renderHook(() => useDashboardTour('new-user'));
    await act(() => new Promise(r => setTimeout(r, 50)));
    expect(result.current.tourStep).toBe(0);
  });

  it('tour persists completion', async () => {
    const { useDashboardTour } = await import('../hooks/useDashboardTour');
    const { renderHook, act } = await import('@testing-library/react');

    const { result } = renderHook(() => useDashboardTour('new-user'));
    await act(() => new Promise(r => setTimeout(r, 50)));

    // Advance through all steps
    act(() => result.current.next()); // 0 → 1
    act(() => result.current.next()); // 1 → 2
    act(() => result.current.next()); // 2 → 3
    act(() => result.current.next()); // 3 → done
    expect(result.current.tourStep).toBe('done');
  });
});
```

**Step 2: Run test**

Run: `npx vitest run src/__tests__/first-time-experience-e2e.test.tsx`
Expected: PASS

**Step 3: Run full test suite**

Run: `npm run test`
Expected: All tests pass

**Step 4: Commit**

```bash
git add src/__tests__/first-time-experience-e2e.test.tsx
git commit -m "test(AN-FTE): integration test for first-time experience tour flow"
```

---

## Task 14: Final Lint + Smoke Test

**Step 1: Run lint**

Run: `npm run lint`
Expected: clean

**Step 2: Run all tests**

Run: `npm run test`
Expected: all pass

**Step 3: Dev server smoke test**

Run: `npm run dev`
Manual check:
- New browser → see "BAZODIAC / TOUCH THE SURFACE"
- Tap → Login + Register visible
- Register → Video (skippable) → BirthForm → Signatur Reveal (live ring!) → Dashboard
- Dashboard: Planetarium + Welcome overlay → OK → scroll → Astro tiles overlay → accordion works
- Navigate to `/signatur` → Quiz popup (can't escape) → answer → burst → explanation
- Returning user: refresh → direct to dashboard, no splash, no tour

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat(AN-FTE): first-time experience — complete implementation"
```
