# CR-06: Dashboard Hero Nav — Drei Kacheln (Sonnenzeichen / BaZi / WuXing)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `DashboardHeroNav` component with three equally-sized hero tiles (Sonnenzeichen, BaZi, WuXing) that appear at the top of the Dashboard, before the Orrery visualization.

**Architecture:** 2 tasks. Task 1 creates the new component with 3 inline SVG icons, brand styling, scroll-to-anchor behavior, and responsive layout. Task 2 wires it into `DashboardAstroSection.tsx` before the Orrery, adds section anchors, and verifies TypeScript.

**Tech Stack:** TypeScript, React 19, Framer Motion (`motion/react`), Tailwind CSS v4, Vitest

**GitHub Issue:** #172 — CR-06

---

## Task 1: Create `DashboardHeroNav.tsx`

**Files:**
- Create: `src/components/dashboard/DashboardHeroNav.tsx`
- Create: `src/__tests__/dashboard-hero-nav.test.tsx`

### Step 1: Write the failing test

```typescript
// src/__tests__/dashboard-hero-nav.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardHeroNav } from '../components/dashboard/DashboardHeroNav';

// Mock framer motion
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) =>
      <div {...props}>{children}</div>,
  },
}));

// Mock useLanguage
vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'de' }),
}));

describe('DashboardHeroNav', () => {
  it('renders three tiles with correct labels in German', () => {
    render(<DashboardHeroNav sunSign="Leo" dominantElement="Holz" zodiacAnimal="Drache" />);
    expect(screen.getByText('Sonnenzeichen')).toBeInTheDocument();
    expect(screen.getByText('BaZi')).toBeInTheDocument();
    expect(screen.getByText('Wu Xing')).toBeInTheDocument();
  });

  it('renders sign/animal/element values', () => {
    render(<DashboardHeroNav sunSign="Leo" dominantElement="Holz" zodiacAnimal="Drache" />);
    expect(screen.getByText('Leo')).toBeInTheDocument();
    expect(screen.getByText('Drache')).toBeInTheDocument();
    expect(screen.getByText('Holz')).toBeInTheDocument();
  });

  it('renders three anchor links with correct hrefs', () => {
    render(<DashboardHeroNav sunSign="Leo" dominantElement="Holz" zodiacAnimal="Drache" />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(3);
    expect(links[0]).toHaveAttribute('href', '#section-western');
    expect(links[1]).toHaveAttribute('href', '#section-bazi');
    expect(links[2]).toHaveAttribute('href', '#section-wuxing');
  });

  it('renders EN labels when lang is en', () => {
    vi.resetModules();
    vi.doMock('../contexts/LanguageContext', () => ({
      useLanguage: () => ({ lang: 'en' }),
    }));
    // Note: EN labels tested by checking the tile structure
    render(<DashboardHeroNav sunSign="Leo" dominantElement="Wood" zodiacAnimal="Dragon" />);
    expect(screen.getByText('Sun Sign')).toBeInTheDocument();
    expect(screen.getByText('Wu Xing')).toBeInTheDocument(); // Wu Xing same in EN
  });

  it('shows placeholder when values are missing', () => {
    render(<DashboardHeroNav sunSign="" dominantElement="" zodiacAnimal="" />);
    // All three values show dash placeholder
    const dashes = screen.getAllByText('—');
    expect(dashes).toHaveLength(3);
  });
});
```

### Step 2: Run test — expect FAIL (component not found)

```bash
cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum
npx vitest run src/__tests__/dashboard-hero-nav.test.tsx 2>&1 | tail -20
```

Expected: FAIL — "Cannot find module '../components/dashboard/DashboardHeroNav'"

### Step 3: Create the component

```typescript
// src/components/dashboard/DashboardHeroNav.tsx
import { motion } from 'motion/react';
import { useLanguage } from '../../contexts/LanguageContext';

// ── Inline SVG Icons (no emoji, brand-aligned) ──────────────────────────────

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="2" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
      <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
      <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
      <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" />
      <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" />
    </svg>
  );
}

function PillarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="3" y="3" width="4" height="18" rx="0.5" />
      <rect x="10" y="7" width="4" height="14" rx="0.5" />
      <rect x="17" y="5" width="4" height="16" rx="0.5" />
      <line x1="2" y1="21" x2="22" y2="21" />
    </svg>
  );
}

function ElementsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      {/* Pentagon representing 5 elements */}
      <polygon points="12,2 22,9 18,21 6,21 2,9" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

interface DashboardHeroNavProps {
  sunSign: string;
  dominantElement: string;
  zodiacAnimal: string;
}

interface TileConfig {
  id: string;
  anchor: string;
  labelDe: string;
  labelEn: string;
  value: string;
  icon: React.ReactNode;
}

export function DashboardHeroNav({ sunSign, dominantElement, zodiacAnimal }: DashboardHeroNavProps) {
  const { lang } = useLanguage();

  const tiles: TileConfig[] = [
    {
      id: 'western',
      anchor: '#section-western',
      labelDe: 'Sonnenzeichen',
      labelEn: 'Sun Sign',
      value: sunSign || '—',
      icon: <SunIcon className="w-7 h-7" />,
    },
    {
      id: 'bazi',
      anchor: '#section-bazi',
      labelDe: 'BaZi',
      labelEn: 'BaZi',
      value: zodiacAnimal || '—',
      icon: <PillarIcon className="w-7 h-7" />,
    },
    {
      id: 'wuxing',
      anchor: '#section-wuxing',
      labelDe: 'Wu Xing',
      labelEn: 'Wu Xing',
      value: dominantElement || '—',
      icon: <ElementsIcon className="w-7 h-7" />,
    },
  ];

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-14"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.05 }}
    >
      {tiles.map((tile) => (
        <a
          key={tile.id}
          href={tile.anchor}
          className={[
            'group relative flex flex-col items-center justify-center',
            'gap-3 py-8 px-6 rounded-2xl',
            'border border-[#D4AF37]/15 bg-[#00050A]/60 backdrop-blur-md',
            'hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/5',
            'transition-all duration-300 cursor-pointer no-underline',
            'shadow-[0_0_0_0_rgba(212,175,55,0)] hover:shadow-[0_0_24px_0_rgba(212,175,55,0.08)]',
          ].join(' ')}
        >
          {/* Icon */}
          <div className="text-[#D4AF37]/60 group-hover:text-[#D4AF37]/90 transition-colors duration-300">
            {tile.icon}
          </div>

          {/* Label */}
          <p className="text-[9px] uppercase tracking-[0.35em] text-[#D4AF37]/50 group-hover:text-[#D4AF37]/80 transition-colors duration-300">
            {lang === 'de' ? tile.labelDe : tile.labelEn}
          </p>

          {/* Value */}
          <p className="font-serif text-lg text-white/80 group-hover:text-white transition-colors duration-300">
            {tile.value}
          </p>

          {/* Arrow hint */}
          <span className="text-[#D4AF37]/20 group-hover:text-[#D4AF37]/50 text-xs transition-colors duration-300">
            ↓
          </span>
        </a>
      ))}
    </motion.div>
  );
}
```

### Step 4: Run tests — expect PASS

```bash
npx vitest run src/__tests__/dashboard-hero-nav.test.tsx 2>&1 | tail -20
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
git add src/components/dashboard/DashboardHeroNav.tsx src/__tests__/dashboard-hero-nav.test.tsx
git commit -m "feat(cr06): add DashboardHeroNav — three hero tiles for Sonnenzeichen/BaZi/WuXing

closes #172"
```

---

## Task 2: Wire into DashboardAstroSection + add section anchors

**Files:**
- Modify: `src/components/dashboard/DashboardAstroSection.tsx`

**Background:** The component renders: Orrery (line 165) → AstroAccordion (line 206). We insert DashboardHeroNav BEFORE the Orrery. We also need to add `id` anchors on the existing sections so the scroll links work.

### Step 1: Add import at top of DashboardAstroSection.tsx

Find (around line 16):
```typescript
import { AstroAccordion } from "./AstroAccordion";
```

Add after it:
```typescript
import { DashboardHeroNav } from "./DashboardHeroNav";
```

### Step 2: Extract data for the three tiles

The component already extracts `sunSign` (line 104) and `dominantEl` (line 105). It also has `yearAnimal` (line 157). These are already available — no new logic needed.

### Step 3: Insert DashboardHeroNav before the Orrery block

Find (line 162–165):
```tsx
  return (
    <>
      {/* ═══ 3D ORRERY ════════════════════════════════════════════════ */}
      <motion.div className="mb-14 -mx-4 md:-mx-6" {...fadeIn(0.1)}>
```

Replace with:
```tsx
  return (
    <>
      {/* ═══ HERO NAV — Three section tiles ══════════════════════════ */}
      <DashboardHeroNav
        sunSign={sunSign}
        dominantElement={dominantEl}
        zodiacAnimal={yearAnimal}
      />

      {/* ═══ 3D ORRERY ════════════════════════════════════════════════ */}
      <div id="section-western" />
      <motion.div className="mb-14 -mx-4 md:-mx-6" {...fadeIn(0.1)}>
```

### Step 4: Add BaZi and WuXing anchor IDs

Find (line 210):
```tsx
      {/* ═══ BAZI & WUXING DEEP SECTION ═══════════════════════════════ */}
      <PremiumGate teaser={t("dashboard.premium.teaserPillars")}>
```

Replace with:
```tsx
      {/* ═══ BAZI & WUXING DEEP SECTION ═══════════════════════════════ */}
      <div id="section-bazi" />
      <div id="section-wuxing" />
      <PremiumGate teaser={t("dashboard.premium.teaserPillars")}>
```

(Both BaZi and WuXing live in the same deep section — one anchor is sufficient, but two anchors let us point both tiles to the right place in the future if sections split.)

### Step 5: TypeScript check

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

### Step 6: Full test run

```bash
npm run test 2>&1 | tail -10
```

Expected: all tests pass (no regressions).

### Step 7: Commit

```bash
git add src/components/dashboard/DashboardAstroSection.tsx
git commit -m "feat(cr06): wire DashboardHeroNav into DashboardAstroSection with section anchors"
```

---

## Final Verification

```bash
npm run test && npx tsc --noEmit
```

Expected: all tests pass, 0 TypeScript errors.

**Manual check:** Open Dashboard → three tiles appear above the Orrery → clicking scrolls to the BaZi/WuXing section → responsive (single column on mobile, 3 columns on desktop) → no emojis → no console errors.

**PR title:** `feat(cr06): Dashboard Hero Nav — Sonnenzeichen / BaZi / Wu Xing tiles`

**Branch:** `feature/cr06-dashboard-hero-nav`

**Closes:** #172
