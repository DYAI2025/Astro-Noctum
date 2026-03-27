# CR-10: Blueprint Animated Reveal — First-Visit Teaser + Visual Upgrade

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** On first Dashboard visit the Blueprint section shows an animated teaser; clicking "Entdecken" triggers a blur-to-clear reveal animation and marks the section as seen (localStorage). All return visits show the Blueprint directly without teaser or animation.

**Architecture:** 3 tasks. Task 1 upgrades BlueprintCard visually. Task 2 creates BlueprintReveal wrapper with teaser state + Framer Motion animation. Task 3 wires the wrapper into Dashboard.tsx.

**Tech Stack:** TypeScript, React 19, Framer Motion (`motion/react`), localStorage, Vitest

**GitHub Issue:** #174 — CR-10

---

## Task 1: Visual Upgrade of BlueprintCard

**Files:**
- Modify: `src/components/dashboard/BlueprintCard.tsx`

**What changes:** Stronger gold border glow on hover (opacity 50 → 70), slightly larger content text (`text-2xl` → `text-3xl`), minimum height so the card looks more premium even with short content.

**No prop interface changes.** This is purely CSS/styling.

### Step 1: Read the current file

```bash
cat /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/components/dashboard/BlueprintCard.tsx
```

Current state: background glow at `opacity-25 group-hover:opacity-50`, content text at `text-2xl`. Inner container has `p-8` padding.

### Step 2: Apply visual upgrade

Find in BlueprintCard.tsx (line 28):
```tsx
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
```

Replace with (stronger glow, add gold tone):
```tsx
      <div className="absolute -inset-1 bg-gradient-to-r from-[#D4AF37]/20 via-cyan-500/15 to-purple-500/20 rounded-[2rem] blur opacity-30 group-hover:opacity-70 transition duration-1000 group-hover:duration-200"></div>
```

Find (line 30):
```tsx
      <div className="relative bg-[#0A0A14]/80 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] space-y-6 transition-all duration-500 hover:border-white/20">
```

Replace with (stronger border + minimum height):
```tsx
      <div className="relative bg-[#0A0A14]/80 backdrop-blur-xl border border-[#D4AF37]/15 p-8 md:p-10 rounded-[2rem] space-y-6 transition-all duration-500 hover:border-[#D4AF37]/35 min-h-[220px]">
```

Find (line 39):
```tsx
        <p className="font-sora text-2xl font-light leading-relaxed tracking-tight text-white/90">
```

Replace with:
```tsx
        <p className="font-sora text-2xl md:text-3xl font-light leading-relaxed tracking-tight text-white/90">
```

### Step 3: TypeScript check

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

### Step 4: Commit

```bash
cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum
git add src/components/dashboard/BlueprintCard.tsx
git commit -m "style(cr10): BlueprintCard visual upgrade — stronger gold glow, larger text, min-height"
```

---

## Task 2: Create `BlueprintReveal.tsx` with teaser + animation

**Files:**
- Create: `src/components/dashboard/BlueprintReveal.tsx`
- Create: `src/__tests__/blueprint-reveal.test.tsx`

**Logic:**
1. On mount: check `localStorage.getItem('bazodiac_blueprint_seen')`
2. If `null` (first visit): render teaser card; `revealed = false`
3. If set (return visit): render BlueprintCard directly; `revealed = true`
4. On "Entdecken" click: set localStorage flag, set `revealed = true` → AnimatePresence swaps teaser → BlueprintCard with Framer Motion animation

**Animation:** Teaser fades out (opacity 1→0, scale 1→0.97), then BlueprintCard fades in (opacity 0→1, scale 0.95→1, filter: blur(8px)→blur(0), duration 1.2s ease-out).

### Step 1: Write the failing test

```typescript
// src/__tests__/blueprint-reveal.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BlueprintReveal } from '../components/dashboard/BlueprintReveal';

// Mock BlueprintCard
vi.mock('../components/dashboard/BlueprintCard', () => ({
  default: ({ content }: { content: string }) => <div data-testid="blueprint-card">{content}</div>,
}));

// Mock framer motion — simplified
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) =>
      <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock useLanguage
vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'de', t: (k: string) => k }),
}));

const defaultProps = {
  content: 'Blueprint test content',
  onCtaClick: vi.fn(),
};

describe('BlueprintReveal', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('shows teaser on first visit (no localStorage flag)', () => {
    render(<BlueprintReveal {...defaultProps} />);
    expect(screen.getByTestId('blueprint-teaser')).toBeInTheDocument();
    expect(screen.queryByTestId('blueprint-card')).not.toBeInTheDocument();
  });

  it('shows blueprint directly on return visit (localStorage flag set)', () => {
    localStorage.setItem('bazodiac_blueprint_seen', '1');
    render(<BlueprintReveal {...defaultProps} />);
    expect(screen.queryByTestId('blueprint-teaser')).not.toBeInTheDocument();
    expect(screen.getByTestId('blueprint-card')).toBeInTheDocument();
  });

  it('clicking Entdecken reveals blueprint and sets localStorage flag', async () => {
    render(<BlueprintReveal {...defaultProps} />);
    const btn = screen.getByRole('button', { name: /Entdecken/i });
    await act(async () => { fireEvent.click(btn); });
    expect(screen.getByTestId('blueprint-card')).toBeInTheDocument();
    expect(localStorage.getItem('bazodiac_blueprint_seen')).toBe('1');
  });

  it('passes content and onCtaClick to BlueprintCard after reveal', async () => {
    render(<BlueprintReveal {...defaultProps} />);
    const btn = screen.getByRole('button', { name: /Entdecken/i });
    await act(async () => { fireEvent.click(btn); });
    expect(screen.getByText('Blueprint test content')).toBeInTheDocument();
  });

  it('teaser shows the section title in German', () => {
    render(<BlueprintReveal {...defaultProps} />);
    expect(screen.getByText('Dein Bazodiac Blueprint')).toBeInTheDocument();
  });
});
```

### Step 2: Run test — expect FAIL

```bash
npx vitest run src/__tests__/blueprint-reveal.test.tsx 2>&1 | tail -20
```

Expected: FAIL — "Cannot find module '../components/dashboard/BlueprintReveal'"

### Step 3: Create `BlueprintReveal.tsx`

```typescript
// src/components/dashboard/BlueprintReveal.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import BlueprintCard from './BlueprintCard';
import { useLanguage } from '../../contexts/LanguageContext';

const STORAGE_KEY = 'bazodiac_blueprint_seen';

interface BlueprintRevealProps {
  content: string;
  aspects?: string[];
  elements?: string[];
  onCtaClick?: () => void;
}

export function BlueprintReveal({ content, aspects, elements, onCtaClick }: BlueprintRevealProps) {
  const { lang } = useLanguage();
  const [revealed, setRevealed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return true; // if localStorage unavailable, skip teaser
    }
  });

  function handleReveal() {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore storage errors
    }
    setRevealed(true);
  }

  return (
    <AnimatePresence mode="wait">
      {!revealed ? (
        // ── Teaser Card ────────────────────────────────────────────────
        <motion.div
          key="teaser"
          data-testid="blueprint-teaser"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.4, ease: 'easeIn' }}
          className="relative overflow-hidden rounded-[2rem] border border-[#D4AF37]/15 bg-[#0A0A14]/80 backdrop-blur-xl p-8 md:p-10 min-h-[220px] flex flex-col items-center justify-center text-center gap-6"
        >
          {/* Background glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[#D4AF37]/10 via-transparent to-purple-500/10 rounded-[2rem] blur opacity-40 pointer-events-none" />

          <div className="relative space-y-3">
            <p className="text-[9px] uppercase tracking-[0.45em] text-[#D4AF37]/50">
              {lang === 'de' ? 'Kosmische Analyse' : 'Cosmic Analysis'}
            </p>
            <h3 className="font-serif text-2xl text-white/90">
              {lang === 'de' ? 'Dein Bazodiac Blueprint' : 'Your Bazodiac Blueprint'}
            </h3>
            <p className="text-sm text-white/40 max-w-xs leading-relaxed">
              {lang === 'de'
                ? 'Deine einzigartige kosmische Signatur. Bereit zur Enthüllung.'
                : 'Your unique cosmic signature. Ready to be revealed.'}
            </p>
          </div>

          <button
            onClick={handleReveal}
            className={[
              'relative font-serif text-sm uppercase tracking-[0.25em]',
              'px-8 py-3 rounded-full border border-[#D4AF37]/40',
              'text-[#D4AF37] hover:text-white hover:border-[#D4AF37]',
              'hover:bg-[#D4AF37]/10 transition-all duration-300',
            ].join(' ')}
          >
            {lang === 'de' ? 'Entdecken' : 'Reveal'}
          </button>
        </motion.div>
      ) : (
        // ── Blueprint Card (animated entrance on first reveal) ─────────
        <motion.div
          key="blueprint"
          initial={{ opacity: 0, scale: 0.95, filter: 'blur(8px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        >
          <BlueprintCard
            content={content}
            aspects={aspects}
            elements={elements}
            onCtaClick={onCtaClick}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### Step 4: Run tests — expect PASS

```bash
npx vitest run src/__tests__/blueprint-reveal.test.tsx 2>&1 | tail -20
```

Expected: 5 passed.

### Step 5: TypeScript check

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

### Step 6: Commit

```bash
cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum
git add src/components/dashboard/BlueprintReveal.tsx src/__tests__/blueprint-reveal.test.tsx
git commit -m "feat(cr10): add BlueprintReveal — first-visit teaser with animated reveal"
```

---

## Task 3: Wire BlueprintReveal into Dashboard.tsx

**Files:**
- Modify: `src/components/Dashboard.tsx`

**What changes:** Import `BlueprintReveal`, replace the `<BlueprintCard>` JSX block with `<BlueprintReveal>`. Pass same props.

### Step 1: Add import

In `Dashboard.tsx`, find the existing BlueprintCard import (search for "BlueprintCard"):
```typescript
import BlueprintCard from './dashboard/BlueprintCard';
```

Add after it:
```typescript
import { BlueprintReveal } from './dashboard/BlueprintReveal';
```

### Step 2: Replace the render call

Find (Dashboard.tsx lines 386–394):
```tsx
      {/* ═══ BLUEPRINT CARD ═════════════════════════════════════════════ */}
      <motion.div className="mb-10" {...fadeIn(0.45)}>
        <SectionErrorBoundary name="BlueprintCard">
          <BlueprintCard
            content={interpretation.split('\n\n').find(p => p.trim() && !p.startsWith('#')) || t('dashboard.blueprint.loading')}
            onCtaClick={() => document.getElementById("interpretation-section")?.scrollIntoView({ behavior: "smooth" })}
          />
        </SectionErrorBoundary>
      </motion.div>
```

Replace with:
```tsx
      {/* ═══ BLUEPRINT REVEAL ═══════════════════════════════════════════ */}
      <motion.div className="mb-10" {...fadeIn(0.45)}>
        <SectionErrorBoundary name="BlueprintCard">
          <BlueprintReveal
            content={interpretation.split('\n\n').find(p => p.trim() && !p.startsWith('#')) || t('dashboard.blueprint.loading')}
            onCtaClick={() => document.getElementById("interpretation-section")?.scrollIntoView({ behavior: "smooth" })}
          />
        </SectionErrorBoundary>
      </motion.div>
```

Note: The old `<BlueprintCard>` import can be removed from Dashboard.tsx if it's no longer used elsewhere. Check with:
```bash
grep -n "BlueprintCard" src/components/Dashboard.tsx
```

If only one occurrence remains (the import), remove that import line too.

### Step 3: TypeScript check

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

### Step 4: Full test run

```bash
npm run test 2>&1 | tail -10
```

Expected: all tests pass.

### Step 5: Commit

```bash
git add src/components/Dashboard.tsx
git commit -m "feat(cr10): wire BlueprintReveal into Dashboard — replaces static BlueprintCard"
```

---

## Final Verification

```bash
npm run test && npx tsc --noEmit
```

Expected: all tests pass, 0 TypeScript errors.

**Manual check:**
1. Open Dashboard in private window (fresh localStorage) → teaser card visible
2. Click "Entdecken" → blur-to-clear animation plays, Blueprint content appears
3. Refresh page → Blueprint directly visible, no teaser, no animation
4. localStorage key `bazodiac_blueprint_seen` = `'1'` in DevTools

**PR title:** `feat(cr10): Blueprint animated reveal — first-visit teaser + visual upgrade`

**Branch:** `feature/cr10-blueprint-reveal`

**Closes:** #174
