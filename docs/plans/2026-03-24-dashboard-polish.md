# Dashboard Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove ghost UI, fix i18n violations, extend Wu-Xing detail page, fix Levi layer, enhance Planetarium, and create 3 navigation proposals — making the Dashboard production-ready.

**Architecture:** Purely additive/removable changes within the existing React 19 SPA. No new libraries. All UI text goes through existing `useLanguage()` / `translations.ts` pipeline. PremiumGate wraps extended content. WuXingPage extends existing page component.

**Tech Stack:** React 19, Vite, Tailwind CSS v4, TypeScript, Vitest, Three.js (for Planetarium), Supabase

---

## Pre-flight Checks

Before starting any task:
```bash
npm run lint      # Must be clean — do NOT add new TS errors
npm run test      # Know which tests are already failing (baseline)
```

---

## Work Package 1 — Ghost UI Cleanup

**Sprint tasks:** S-DP-01, S-DP-02, S-DP-03, S-DP-04

### Task 1: Remove "Tour wiederholen" from Dashboard menu

**Files:**
- Modify: `src/components/Dashboard.tsx` (around line 351)

**Step 1: Find the element**

Search for the menu button:
```bash
grep -n "Tour wiederholen\|Zahlung verwalten\|Neustarten\|KI-Synthese" src/components/Dashboard.tsx
```
Expected: "Tour wiederholen" at line ~351.

**Step 2: Read the surrounding context**

Read `src/components/Dashboard.tsx` lines 340–370 to understand the menu structure.

**Step 3: Write the failing test**

File: `src/__tests__/dashboard-ghost-ui.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock heavy dependencies
vi.mock('../components/BirthChartOrrery', () => ({ default: () => null }));
vi.mock('../components/fusion-ring-website/FusionRingCanvasV2', () => ({ default: () => null }));
// Add any other expensive mocks needed

import Dashboard from '../components/Dashboard';

const MINIMAL_PROPS = { /* minimal valid props */ };

describe('Dashboard ghost UI', () => {
  it('does not render "Tour wiederholen" button', () => {
    render(<Dashboard {...MINIMAL_PROPS} />);
    expect(screen.queryByText(/Tour wiederholen/i)).toBeNull();
  });

  it('does not render "Zahlung verwalten" button', () => {
    render(<Dashboard {...MINIMAL_PROPS} />);
    expect(screen.queryByText(/Zahlung verwalten/i)).toBeNull();
  });

  it('does not render "Neustarten" button', () => {
    render(<Dashboard {...MINIMAL_PROPS} />);
    expect(screen.queryByText(/Neustarten/i)).toBeNull();
  });

  it('does not render "KI-Synthese" heading', () => {
    render(<Dashboard {...MINIMAL_PROPS} />);
    expect(screen.queryByText(/KI-Synthese/i)).toBeNull();
  });
});
```

**Step 4: Run to confirm they fail**
```bash
npx vitest run src/__tests__/dashboard-ghost-ui.test.tsx
```
Expected: 4 failures (elements are currently present).

**Step 5: Remove ghost UI elements from Dashboard.tsx**

In `src/components/Dashboard.tsx`:
- Find and delete the JSX element rendering "Tour wiederholen" (line ~351)
- "Zahlung verwalten" is in `src/components/ManageSubscription.tsx` line 41 — leave it there; it belongs in the subscription management flow, NOT on the main Dashboard menu. Remove only the menu item in Dashboard that links to it, if one exists.
- Search the whole file for "Neustarten" — delete that button/element if found
- "KI-Synthese" label is in `src/i18n/translations.ts` line ~363. Search Dashboard.tsx for where this translation key is used (look for `t('sectionLabel')` or similar) and remove that section heading from the JSX.

**Step 6: Run tests**
```bash
npx vitest run src/__tests__/dashboard-ghost-ui.test.tsx
```
Expected: 4 tests pass.

**Step 7: Lint**
```bash
npm run lint
```
Expected: No new errors.

**Step 8: Commit**
```bash
git add src/components/Dashboard.tsx src/__tests__/dashboard-ghost-ui.test.tsx
git commit -m "fix(dashboard): remove ghost UI — Tour wiederholen, Neustarten, KI-Synthese"
```

---

## Work Package 2 — i18n & Copy Fixes

**Sprint tasks:** S-DP-05, S-DP-06

### Task 2: Fix BlueprintCard.tsx — add i18n support

**Files:**
- Modify: `src/components/dashboard/BlueprintCard.tsx`
- Modify: `src/i18n/translations.ts`

**Step 1: Read the current file**

Read `src/components/dashboard/BlueprintCard.tsx` in full. Read `src/i18n/translations.ts` lines 350–400 (around the KI-Synthese entry) to understand the translations structure.

**Step 2: Write the failing test**

File: `src/__tests__/blueprint-card-i18n.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BlueprintCard } from '../components/dashboard/BlueprintCard';

describe('BlueprintCard i18n', () => {
  it('renders German title by default', () => {
    render(<BlueprintCard lang="de" />);
    // Should show "Kosmischer Blueprint" or similar DE text, NOT "Your Bazaar Blueprint"
    expect(screen.queryByText(/Your Bazaar Blueprint/i)).toBeNull();
    expect(screen.getByText(/Blueprint/i)).toBeTruthy();
  });

  it('renders no hardcoded English strings', () => {
    render(<BlueprintCard lang="de" />);
    expect(screen.queryByText(/Westlich/)).not.toBeNull(); // exists in DE already
    // Ensure "Eastern" in English doesn't appear
    expect(screen.queryByText(/^Eastern$/)).toBeNull();
  });
});
```

**Step 3: Run to confirm current state**
```bash
npx vitest run src/__tests__/blueprint-card-i18n.test.tsx
```

**Step 4: Add i18n to BlueprintCard**

In `src/components/dashboard/BlueprintCard.tsx`:
- Import and use `useLanguage()` hook: `import { useLanguage } from '../../contexts/LanguageContext';`
- Replace hardcoded default prop strings with values from `translations.ts`
- In `src/i18n/translations.ts`, add entries under `de` and `en` for:
  ```
  blueprint: {
    title: "Kosmischer Blueprint",  // DE
    cta: "ganzen Blueprint lesen →",  // DE
    western: "Westlich",
    eastern: "Östlich"
  }
  ```
  And English equivalents.
- In BlueprintCard, use `t('blueprint.title')` etc.

**Step 5: Run tests**
```bash
npx vitest run src/__tests__/blueprint-card-i18n.test.tsx
```
Expected: PASS.

**Step 6: Commit**
```bash
git add src/components/dashboard/BlueprintCard.tsx src/i18n/translations.ts src/__tests__/blueprint-card-i18n.test.tsx
git commit -m "fix(i18n): add useLanguage to BlueprintCard, eliminate hardcoded strings (S-DP-05, S-DP-06)"
```

---

## Work Package 3 — Wu-Xing Fix + Detail Page

**Sprint tasks:** S-DP-07, S-DP-08, S-DP-09, S-DP-10

### Task 3: Fix Wu-Xing Metal icon bug

**Files:**
- Investigate: `src/lib/astro-data/wuxing.ts`
- Possibly modify: component rendering the icons (grep required)

**Step 1: Find where Wind/Metal bug appears**
```bash
grep -rn "Wind\|wind\|Metal\|metal" src/lib/astro-data/wuxing.ts
grep -rn "⚙\|🌬\|wind" src/components/ src/lib/
```

The emoji ⚙️ is already assigned to Metal in `wuxing.ts` line ~85. The bug is likely in a component that uses Lucide icons or a different icon map — not the data file.

**Step 2: Search for icon mapping objects**
```bash
grep -rn "Metal\|metal" src/components/ --include="*.tsx" --include="*.ts" | grep -i "icon\|Icon"
```

Find the component with the wrong mapping. It likely has:
```ts
const ELEMENT_ICONS = { Wood: ..., Fire: ..., Earth: ..., Metal: WindIcon, Water: ... }
// Should be:
const ELEMENT_ICONS = { Wood: ..., Fire: ..., Earth: ..., Metal: SwordIcon, Water: ... }
```

**Step 3: Write the failing test**

File: `src/__tests__/wuxing-icons.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
// Import the component that shows Wu-Xing icons

describe('Wu-Xing element icons', () => {
  it('Metal element shows correct label, not Wind', () => {
    render(<WuXingComponent elements={mockElements} lang="de" />);
    const metalNodes = screen.getAllByTestId('element-Metal');
    metalNodes.forEach(node => {
      expect(node).not.toHaveTextContent('Wind');
      expect(node).toHaveTextContent('Metall');
    });
  });
});
```

**Step 4: Fix the icon mapping**

In the file identified in Step 2, correct the Metal entry to a Metal-appropriate icon (⚙️ emoji or a Lucide icon like `Sword`, `Gem`, or `Wrench`).

**Step 5: Run test**
```bash
npx vitest run src/__tests__/wuxing-icons.test.tsx
```
Expected: PASS.

**Step 6: Commit**
```bash
git add <changed files> src/__tests__/wuxing-icons.test.tsx
git commit -m "fix(wuxing): correct Metal element icon mapping (was showing Wind)"
```

---

### Task 4: Extend WuXingPage with premium detail content

**Files:**
- Modify: `src/pages/WuXingPage.tsx`
- Modify: `src/components/PremiumGate.tsx` (verify import path)
- Modify: `src/components/Dashboard.tsx` (remove houses section)

**Step 1: Read WuXingPage.tsx in full**

Read `/Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum/src/pages/WuXingPage.tsx`.

**Step 2: Read Dashboard.tsx — find houses section**
```bash
grep -n "house\|House\|Häuser\|houseTexts" src/components/Dashboard.tsx
```
Note the exact lines of the houses JSX block.

**Step 3: Write a failing test for WuXingPage structure**

File: `src/__tests__/wuxing-page.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
// Mock router, contexts as needed

describe('WuXingPage', () => {
  it('renders Wu-Xing detail page without crashing', () => {
    render(<WuXingPage {...mockProps} />);
    expect(screen.getByRole('main')).toBeTruthy();
  });

  it('shows PremiumGate for extended analysis section', () => {
    render(<WuXingPage {...mockPropsFreeTier} />);
    // Free user should see upgrade prompt
    expect(screen.getByTestId('premium-gate')).toBeTruthy();
  });

  it('shows extended analysis for premium user', () => {
    render(<WuXingPage {...mockPropsPremium} />);
    expect(screen.getByTestId('extended-analysis')).toBeTruthy();
  });
});
```

**Step 4: Implement extended WuXingPage sections**

In `src/pages/WuXingPage.tsx`, add below the existing Wu-Xing pentagon/wheel:

```tsx
{/* Extended Analysis — Premium gated */}
<PremiumGate userId={userId} isPremium={isPremium}>
  <div data-testid="extended-analysis">
    {/* Element balance bar chart */}
    <section className="glass-card p-6">
      <h2 className="font-serif text-gold text-xl mb-4">Elementbalance</h2>
      <ElementBalanceChart elements={wuxingData.elements} />
    </section>

    {/* Western houses — moved from Dashboard */}
    <section className="glass-card p-6 mt-4">
      <h2 className="font-serif text-gold text-xl mb-4">Häuser-Analyse</h2>
      <HousesSection houseTexts={houseTexts} />
    </section>
  </div>
</PremiumGate>
```

Keep it simple — use `<table>` or `<dl>` for the houses, no new chart library. For ElementBalanceChart, use CSS-width bars:
```tsx
function ElementBalanceChart({ elements }: { elements: Record<string, number> }) {
  const total = Object.values(elements).reduce((a, b) => a + b, 0);
  return (
    <div className="space-y-2">
      {Object.entries(elements).map(([el, count]) => (
        <div key={el} className="flex items-center gap-3">
          <span className="w-16 font-serif text-sm text-gold-deep/70">{el}</span>
          <div className="flex-1 bg-obsidian rounded">
            <div
              className="h-2 rounded bg-gold"
              style={{ width: `${(count / total) * 100}%` }}
            />
          </div>
          <span className="text-xs text-gold-deep/50">{count}</span>
        </div>
      ))}
    </div>
  );
}
```

**Step 5: Remove houses from Dashboard.tsx**

In `src/components/Dashboard.tsx`, delete the houses JSX block identified in Step 2. Remove unused `houseTexts` prop if no other section uses it.

**Step 6: Run tests**
```bash
npx vitest run src/__tests__/wuxing-page.test.tsx
npm run lint
```

**Step 7: Commit**
```bash
git add src/pages/WuXingPage.tsx src/components/Dashboard.tsx src/__tests__/wuxing-page.test.tsx
git commit -m "feat(wuxing): extend detail page with PremiumGated analysis + move houses from Dashboard (S-DP-08 to S-DP-10)"
```

---

## Work Package 4 — Levi Layer Redesign

**Sprint tasks:** S-DP-11, S-DP-12, S-DP-13

### Task 5: Fix Levi section styling and position

**Files:**
- Modify: `src/components/dashboard/DashboardLeviSection.tsx`
- Possibly: `src/components/dashboard/LeviOrb.tsx`
- Modify: `src/components/Dashboard.tsx` (section order)

**Step 1: Read the files**

Read `src/components/dashboard/DashboardLeviSection.tsx` in full.
```bash
find src/components/dashboard -name "LeviOrb*"
```
If it exists, read `LeviOrb.tsx` too.

**Step 2: Write failing tests**

File: `src/__tests__/levi-section.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DashboardLeviSection } from '../components/dashboard/DashboardLeviSection';

const BASE_PROPS = {
  isPremium: false,
  userId: 'test-user',
  onStopAudio: vi.fn(),
  onResumeAudio: vi.fn(),
  sunSign: 'Aries',
  zodiacAnimal: 'Dragon',
  dominantEl: 'Fire',
};

describe('DashboardLeviSection', () => {
  it('renders exactly one CTA button', () => {
    render(<DashboardLeviSection {...BASE_PROPS} />);
    const buttons = screen.getAllByRole('button');
    // Should be 1 CTA, not 2
    expect(buttons.length).toBe(1);
  });

  it('CTA button text contains "Levi"', () => {
    render(<DashboardLeviSection {...BASE_PROPS} />);
    expect(screen.getByRole('button', { name: /Levi/i })).toBeTruthy();
  });

  it('does not render italic text', () => {
    const { container } = render(<DashboardLeviSection {...BASE_PROPS} />);
    const italicEls = container.querySelectorAll('i, .italic');
    expect(italicEls.length).toBe(0);
  });
});
```

**Step 3: Run to see failures**
```bash
npx vitest run src/__tests__/levi-section.test.tsx
```

**Step 4: Fix DashboardLeviSection.tsx**

Find and fix:
- Any `italic` or `font-style: italic` styling — remove it
- Any offset causing misalignment (look for negative margins, `translate-x`, or absolute positioning that's off)
- Font size — ensure body text is at least `text-base` (16px), heading `text-lg` minimum
- Duplicate buttons — find the "Levi Bazzi bereit" button and delete it. Keep only one CTA

Pattern to search:
```bash
grep -n "italic\|Levi Bazzi bereit\|font-size\|translate" src/components/dashboard/DashboardLeviSection.tsx
```

**Step 5: Fix Dashboard.tsx section order (S-DP-13)**

In `src/components/Dashboard.tsx`:
- Read the JSX structure to find where `<DashboardLeviSection />` currently renders (~line 380)
- Move it to render AFTER the Big Three cards + Fusion Ring section, BEFORE the detail sections (Blueprint, houses, etc.)

The correct order should be:
1. Header / "Dein Bazodiac"
2. Big Three (Sun, Moon, Rising)
3. Fusion Ring / Signatur
4. **Levi Section** ← move here
5. Blueprint Card
6. Wu-Xing summary
7. (Houses → now on WuXingPage)

**Step 6: Run tests**
```bash
npx vitest run src/__tests__/levi-section.test.tsx
npm run lint
```

**Step 7: Commit**
```bash
git add src/components/dashboard/DashboardLeviSection.tsx src/components/Dashboard.tsx src/__tests__/levi-section.test.tsx
git commit -m "fix(levi): fix text alignment/size/italic, remove duplicate button, move section higher (S-DP-11 to S-DP-13)"
```

---

## Work Package 5 — Planetarium Enhancement

**Sprint tasks:** S-DP-14, S-DP-15, S-DP-16, S-DP-17

### Task 6: Enhance Planetarium with current positions + labels

**Files:**
- Modify: `src/components/BirthChartOrrery.tsx`
- Possibly: `src/contexts/PlanetariumContext.tsx`

**Step 1: Read BirthChartOrrery.tsx**

Read the full file to understand how planets are positioned and labeled.

**Step 2: Check astronomy-engine availability**
```bash
grep -n "astronomy-engine\|astronomyEngine" package.json src/components/BirthChartOrrery.tsx
```

**Step 3: Write failing tests for new features**

File: `src/__tests__/birth-chart-orrery.test.tsx` (update or create)

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock Three.js to avoid WebGL requirement
vi.mock('three', () => ({ /* minimal mock */ }));

describe('BirthChartOrrery', () => {
  it('renders a birth date description label', () => {
    render(<BirthChartOrrery birthDate="1980-11-24" {...otherProps} />);
    expect(screen.getByText(/Planetenposition am/i)).toBeTruthy();
    expect(screen.getByText(/24. November 1980/i)).toBeTruthy();
  });
});
```

**Step 4: Implement S-DP-14 — Larger date/time display**

In `BirthChartOrrery.tsx`, find where the date/time is rendered as HTML (not Three.js). Change the Tailwind class from whatever it currently is to at least `text-lg` (18px).

If the date is rendered as a Three.js `TextGeometry` or CSS2DObject, increase the font size parameter.

**Step 5: Implement S-DP-16 — Birth date description label**

Add a positioned HTML overlay at the bottom of the Planetarium:

```tsx
{/* Description label — added below the Three.js canvas */}
<div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded bg-obsidian/80 backdrop-blur-sm border border-gold/20">
  <p className="font-serif text-gold-deep text-sm">
    Planetenposition am {formatGermanDate(birthDate)}
  </p>
</div>
```

Where `formatGermanDate` converts `"1980-11-24"` → `"24. November 1980"` (same function pattern as TourOverlay):

```ts
function formatGermanDate(raw: string): string {
  const months = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
  try {
    const [y, m, d] = raw.split('T')[0].split('-').map(Number);
    if (!y || !m || !d) return raw;
    return `${d}. ${months[m - 1]} ${y}`;
  } catch { return raw; }
}
```

**Step 6: Implement S-DP-15 — Current planet positions**

This is the most complex item. Strategy:
- Use `astronomy-engine` (already a dependency) to compute planet positions for `new Date()` (today)
- Add them as a second layer with a different color/opacity (e.g., gold-tinted for birth, blue-tinted for current)
- Add a small HTML legend overlay showing "🟡 Geburt  🔵 Heute"

Minimal approach — add a `showCurrentPositions?: boolean` prop (default `true`). When `true`, compute today's planet angles and render them as lighter/dimmer planet meshes alongside the birth chart ones.

```ts
// Compute current positions
const currentPlanetAngles = PLANETS.map(planet => ({
  name: planet.name,
  angle: computeCurrentAngle(planet), // using astronomy-engine
  opacity: 0.4,
  color: 0x4488ff, // blue-ish tint
}));
```

If astronomy-engine integration would take > 2h, simplify: just show a static note "Aktuelle Positionen: coming soon" in the legend — do NOT block the other enhancements.

**Step 7: Run tests**
```bash
npx vitest run src/__tests__/birth-chart-orrery.test.tsx
npm run lint
```

**Step 8: Commit**
```bash
git add src/components/BirthChartOrrery.tsx src/__tests__/birth-chart-orrery.test.tsx
git commit -m "feat(planetarium): larger date display, birth date description label, current planet positions (S-DP-14 to S-DP-16)"
```

---

## Work Package 6 — Navigation & Header

**Sprint tasks:** S-DP-18, S-DP-19

**⚠️ Decision required from Ben before S-DP-19:** Confirm "Dein Bazodiac" as the heading text (or suggest alternative). Ask via a comment in code or directly.

### Task 7: Build 3 navigation menu variants (A/B/C)

**Files:**
- Create: `src/components/navigation/NavVariantA.tsx`
- Create: `src/components/navigation/NavVariantB.tsx`
- Create: `src/components/navigation/NavVariantC.tsx`
- Create: `src/components/navigation/index.ts` (re-exports all three)

**Step 1: Plan the 3 variants conceptually**

All three must:
- Cover all routes: `/` (Dashboard), `/signatur`, `/wu-xing`, `/wissen`
- Have hover-triggered submenus for nested content
- Use Tailwind CSS v4, dark luxury aesthetic (`bg-obsidian`, `text-gold`, `border-gold/20`, `font-serif`)
- Be fully working React components, not mockups
- Use `Link` from `react-router-dom` for navigation

Three distinct approaches:
- **A: Left sidebar** — fixed vertical rail with icon + label + hover popout submenus
- **B: Top bar** — horizontal menu across the top with dropdown submenus on hover
- **C: Floating orbital menu** — radial floating button that expands to show options in a ring

**Step 2: Write a smoke test for each**

File: `src/__tests__/navigation-variants.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { NavVariantA } from '../components/navigation/NavVariantA';
import { NavVariantB } from '../components/navigation/NavVariantB';
import { NavVariantC } from '../components/navigation/NavVariantC';

const allRoutes = ['Dashboard', 'Signatur', 'Wu-Xing', 'Wissen'];

[NavVariantA, NavVariantB, NavVariantC].forEach((Nav, i) => {
  describe(`NavVariant${['A','B','C'][i]}`, () => {
    it('renders all main navigation items', () => {
      render(<MemoryRouter><Nav /></MemoryRouter>);
      allRoutes.forEach(route => {
        expect(screen.getByText(new RegExp(route, 'i'))).toBeTruthy();
      });
    });
  });
});
```

**Step 3: Implement Variant A (Left Sidebar)**

```tsx
// src/components/navigation/NavVariantA.tsx
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', sub: ['Planetarium', 'Blueprint', 'Levi'] },
  { label: 'Signatur', path: '/signatur', sub: ['Quizzes', 'Energie-Cluster'] },
  { label: 'Wu-Xing', path: '/wu-xing', sub: ['Häuser-Analyse', 'Elementbalance'] },
  { label: 'Wissen', path: '/wissen', sub: ['Artikel'] },
];

export function NavVariantA() {
  const { pathname } = useLocation();
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <nav className="fixed left-0 top-0 h-full w-16 hover:w-56 transition-all duration-300 bg-obsidian border-r border-gold/10 z-50 flex flex-col py-8 gap-2 overflow-hidden group">
      {NAV_ITEMS.map(item => (
        <div
          key={item.path}
          className="relative"
          onMouseEnter={() => setHovered(item.path)}
          onMouseLeave={() => setHovered(null)}
        >
          <Link
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 font-serif text-sm transition-colors ${
              pathname === item.path ? 'text-gold' : 'text-gold-deep/60 hover:text-gold'
            }`}
          >
            <span className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full border border-gold/30 text-xs">
              {item.label[0]}
            </span>
            <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
              {item.label}
            </span>
          </Link>
          {hovered === item.path && item.sub.length > 0 && (
            <div className="absolute left-56 top-0 ml-1 bg-obsidian border border-gold/20 rounded-lg shadow-xl p-3 min-w-40">
              {item.sub.map(s => (
                <p key={s} className="font-serif text-xs text-gold-deep/70 py-1 hover:text-gold cursor-pointer">{s}</p>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}
```

**Step 4: Implement Variant B (Top Bar)**

```tsx
// src/components/navigation/NavVariantB.tsx — horizontal top bar
// Similar structure but horizontal, dropdown on hover
```

(Implement analogously — horizontal flex, `absolute top-full` dropdown.)

**Step 5: Implement Variant C (Floating Orbital)**

```tsx
// src/components/navigation/NavVariantC.tsx — radial expand
// Fixed bottom-right circle that expands into orbital menu
```

(Implement with CSS transform for each item spreading out in a circle when open.)

**Step 6: Run tests**
```bash
npx vitest run src/__tests__/navigation-variants.test.tsx
npm run lint
```

**Step 7: Commit and ask Ben to choose**
```bash
git add src/components/navigation/ src/__tests__/navigation-variants.test.tsx
git commit -m "feat(nav): 3 navigation variants A (sidebar) / B (topbar) / C (orbital) — awaiting Ben's choice (S-DP-18)"
```

Then surface the choice to Ben:
> "Navigation variants committed. Which approach do you want? **A** (left sidebar), **B** (top bar), or **C** (floating orbital)?"

---

### Task 8: Redesign Dashboard header

**⚠️ Wait for Ben's heading confirmation before implementing.**

**Files:**
- Create (or modify): `src/components/Header.tsx`
- Modify: `src/components/Dashboard.tsx`

**Step 1: Read Dashboard.tsx header section**

Search for the current heading:
```bash
grep -n "Dein Bazodiac\|dein-bazodiac\|heading\|Header" src/components/Dashboard.tsx | head -20
```

**Step 2: Write failing test**

```tsx
// src/__tests__/dashboard-header.test.tsx
it('renders a distinct header zone with "Dein Bazodiac"', () => {
  render(<Dashboard {...mockProps} />);
  const heading = screen.getByRole('heading', { name: /Dein Bazodiac/i });
  expect(heading.tagName).toMatch(/H[12]/);
  // Should be large — at least text-3xl (30px)
  expect(heading.className).toMatch(/text-[34]/);
});
```

**Step 3: Create header component**

```tsx
// src/components/Header.tsx
interface HeaderProps {
  username?: string;
}

export function Header({ username }: HeaderProps) {
  return (
    <header className="w-full py-8 px-6 border-b border-gold/10 bg-obsidian/60 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto">
        <h1 className="font-serif text-4xl md:text-5xl text-gold tracking-wide">
          Dein Bazodiac
        </h1>
        {username && (
          <p className="font-sans text-sm text-gold-deep/50 mt-1">
            {username}
          </p>
        )}
      </div>
    </header>
  );
}
```

**Step 4: Use Header in Dashboard.tsx**

Replace the existing heading element with `<Header username={...} />` at the top of the Dashboard JSX.

**Step 5: Run and commit**
```bash
npx vitest run src/__tests__/dashboard-header.test.tsx
npm run lint
git add src/components/Header.tsx src/components/Dashboard.tsx src/__tests__/dashboard-header.test.tsx
git commit -m "feat(header): new standalone Header component, prominent Dein Bazodiac heading (S-DP-19)"
```

---

## Work Package 7 — Silent Failures (Stretch Only)

**Sprint tasks:** S-DP-20, S-DP-21, S-DP-22 — only tackle after WP 1-6 complete.

### Task 9: Add error logging to silent catch blocks

**Files:**
- Modify: `src/components/fusion-ring-website/FusionRingCanvasV2.tsx`
- Modify: `src/hooks/usePremium.ts`
- Modify: Tour-related components (search for `tour_completed`)

**Step 1: Find silent failures**
```bash
grep -n "catch {}\|catch (e) {}" src/components/fusion-ring-website/FusionRingCanvasV2.tsx src/hooks/usePremium.ts
grep -rn "tour_completed" src/
```

**Step 2: For each silent catch, add logging**

Pattern:
```ts
// Before:
} catch {}

// After:
} catch (e) {
  console.error('[FusionRingCanvasV2] post-processing error:', e);
}
```

**Step 3: Commit**
```bash
git add src/components/fusion-ring-website/FusionRingCanvasV2.tsx src/hooks/usePremium.ts
git commit -m "fix: surface silent failures in FusionRingCanvasV2, usePremium, tour_completed (S-DP-20 to S-DP-22)"
```

---

## Final Verification

```bash
npm run lint          # Must be clean
npm run test          # No new failures
```

Manually verify in browser (clear localStorage first):
```js
localStorage.removeItem('bazodiac_tour_completed');
```
- [ ] Ghost UI items gone from Dashboard top menu
- [ ] No English placeholder text in Blueprint section
- [ ] Wu-Xing Metal icon is correct (not Wind)
- [ ] WuXingPage shows extended content for premium / PremiumGate for free
- [ ] Dashboard no longer shows houses section
- [ ] Levi section: no italic, one button, correct position in layout
- [ ] Planetarium shows birth date label at bottom
- [ ] Navigation variants A/B/C visible at chosen route

---

## Decisions Needed (ask Ben before proceeding)

| # | Question | Format | Before Task |
|---|----------|--------|-------------|
| 1 | Confirm "Dein Bazodiac" heading text? | Confirm or suggest | Task 8 |
| 2 | Pick navigation variant | A / B / C | After Task 7 |
| 3 | Cosmic Blueprint: separate page or stay on Dashboard? | A (separate) / B (stay) | Task 2 |
| 4 | Date picker in Planetarium: build or defer? | A (build) / B (defer) | Task 6 |

---

*Plan created: 2026-03-24 — Sprint S-DASH-POLISH*
*Source: Sprints/sprint-dashboard-polish/SPRINT.md*
