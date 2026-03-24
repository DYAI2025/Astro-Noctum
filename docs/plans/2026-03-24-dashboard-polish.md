# Dashboard Polish & Navigation — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the Dashboard production-ready: remove all unspecified UI elements, fix German copy, fix Wu-Xing icon tooltip, improve Levi layout, enhance Planetarium, and build 3 navigation variants for Ben's review.

**Architecture:** Primarily surgical edits to existing components. No new libraries. All visual changes must respect `CON-dark-luxury-aesthetic` (obsidian/gold palette) and `CON-german-ui` (all UI text in German). WuXingPage is extended in-place. Navigation variants are standalone React components.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Three.js (Planetarium), motion/react, existing i18n via `useLanguage()` + `src/i18n/translations.ts`.

**Pre-flight note:** Ghost UI tests in `src/__tests__/dashboard-ghost-ui.test.tsx` already pass — the listed ghost elements are not in the DOM. The plan verifies them first and fixes only what is actually broken.

---

## Work Package 1: Ghost UI Cleanup + Verification

### Task 1: Verify Ghost UI State and Fix KI-Synthese Label

**Files:**
- Verify: `src/__tests__/dashboard-ghost-ui.test.tsx`
- Modify if needed: `src/components/dashboard/DashboardInterpretationSection.tsx`

**Step 1: Run existing ghost UI tests**

```bash
npx vitest run src/__tests__/dashboard-ghost-ui.test.tsx
```

Expected: 4/4 PASS. If all pass, S-DP-01 through S-DP-03 are already clean.

**Step 2: Audit for KI-Synthese visible heading (S-DP-04)**

```bash
grep -n "sectionLabel\|KI-Synthese" src/components/dashboard/DashboardInterpretationSection.tsx
```

If a JSX element renders `t('dashboard.interpretation.sectionLabel')` visibly (as a badge, chip, or heading), remove that element.

**Step 3: Run lint**

```bash
npm run lint
```

**Step 4: Run ghost UI tests again**

```bash
npx vitest run src/__tests__/dashboard-ghost-ui.test.tsx
```

Expected: 4/4 PASS.

**Step 5: Commit (only if changes were made)**

```bash
git add src/components/dashboard/DashboardInterpretationSection.tsx
git commit -m "fix(dashboard): remove KI-Synthese section label badge (ghost UI)"
```

---

## Work Package 2: i18n & Copy Fixes

### Task 2: Fix Mixed DE/EN in interpretation.sectionTitle

**Files:**
- Modify: `src/i18n/translations.ts`
- Verify: `src/__tests__/blueprint-card-i18n.test.tsx`

**Step 1: Write the failing test**

Open `src/__tests__/blueprint-card-i18n.test.tsx`. Read the file, then add this test if not already present:

```typescript
it('DE interpretation sectionTitle contains no English words', () => {
  // translations_de is the DE branch of translations
  // import { translations } from '../../i18n/translations';
  // const de = translations.de.dashboard.interpretation.sectionTitle;
  expect(de).not.toMatch(/cosmic/i);
});
```

**Step 2: Run to verify it fails**

```bash
npx vitest run src/__tests__/blueprint-card-i18n.test.tsx
```

Expected: FAIL — "Dein Cosmic Blueprint" contains English "Cosmic".

**Step 3: Fix translations.ts**

In `src/i18n/translations.ts`, find the DE `interpretation` block (around line 369):

Change:
```typescript
interpretation: {
  sectionLabel: "KI-Synthese",
  sectionTitle: "Dein Cosmic Blueprint",
},
```

To:
```typescript
interpretation: {
  sectionLabel: "KI-Auswertung",
  sectionTitle: "Dein Kosmischer Blueprint",
},
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/__tests__/blueprint-card-i18n.test.tsx
```

Expected: PASS.

**Step 5: Check BlueprintCard.tsx for hardcoded English copy**

```bash
grep -n '"Cosmic\|"Your Bazaar\|"Your Cosmic' src/components/dashboard/BlueprintCard.tsx
```

If any hardcoded EN strings are found, route them through `t()` calls.

**Step 6: Commit**

```bash
git add src/i18n/translations.ts src/components/dashboard/BlueprintCard.tsx
git commit -m "fix(i18n): replace mixed-language Cosmic Blueprint title with German copy"
```

---

## Work Package 3: Wu-Xing Fixes

### Task 3: Fix Metal Icon Tooltip (shows "diamond" instead of "Metall")

**Background:** `CosmicSymbols.tsx` maps `Metal → IconMetal` which is `Diamond.jsx`. That SVG has `<title>diamond</title>`, causing the browser to show "diamond" as tooltip on hover. Sprint reports "Wind" — may have been a previous regression. Current fix: add a German `aria-label` via a wrapper so hover shows the correct label.

**Files:**
- Modify: `src/components/animated-icons/CosmicSymbols.tsx`
- Test: `src/__tests__/wuxing.test.ts`

**Step 1: Write the failing test**

Open `src/__tests__/wuxing.test.ts`. Read it, then add at the end of the file:

```typescript
import { render } from '@testing-library/react';
import { WuXingIcon } from '../components/animated-icons/CosmicSymbols';

describe('WuXingIcon accessibility', () => {
  it('Metal renders with aria-label "Metall"', () => {
    const { container } = render(<WuXingIcon element="Metal" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-label')).toBe('Metall');
  });

  it('Water renders with aria-label "Wasser"', () => {
    const { container } = render(<WuXingIcon element="Water" />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('aria-label')).toBe('Wasser');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/__tests__/wuxing.test.ts
```

Expected: FAIL — svg has aria-label "diamond", not "Metall".

**Step 3: Modify CosmicSymbols.tsx**

Read `src/components/animated-icons/CosmicSymbols.tsx` first, then add a label map and pass it to the Icon:

```typescript
const ELEMENT_LABEL: Record<string, string> = {
  Wood: 'Holz', Fire: 'Feuer', Earth: 'Erde', Metal: 'Metall', Water: 'Wasser',
  Holz: 'Holz', Feuer: 'Feuer', Erde: 'Erde', Metall: 'Metall', Wasser: 'Wasser',
};

export function WuXingIcon({ element, className = 'w-6 h-6', showColor = true }: ElementIconProps) {
  const entry = ELEMENT_ICON_MAP[element];
  if (!entry) return <IconStar className={className} />;
  const { icon: Icon, color } = entry;
  const label = ELEMENT_LABEL[element] ?? element;
  return (
    <Icon
      className={className}
      style={showColor ? { color } : undefined}
      aria-label={label}
      role="img"
    />
  );
}
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/__tests__/wuxing.test.ts
```

Expected: All tests PASS.

**Step 5: Commit**

```bash
git add src/components/animated-icons/CosmicSymbols.tsx src/__tests__/wuxing.test.ts
git commit -m "fix(wuxing): add German aria-label to WuXingIcon — Metal no longer shows 'diamond' on hover"
```

---

### Task 4: Extend WuXingPage with PremiumGate + Receive Western Houses

**Files:**
- Modify: `src/pages/WuXingPage.tsx`
- Modify: `src/components/dashboard/DashboardAstroSection.tsx`
- Verify: `src/__tests__/wuxing-page-detail.test.tsx`

**Step 1: Run existing WuXing page tests**

```bash
npx vitest run src/__tests__/wuxing-page-detail.test.tsx
```

Note all passing tests — your changes must not break them.

**Step 2: Locate Western Houses in DashboardAstroSection**

```bash
grep -n "houses\|Houses\|Häuser\|western.*house\|house.*western" src/components/dashboard/DashboardAstroSection.tsx -i | head -20
```

Identify the JSX section. Note what data props it receives.

**Step 3: Extract Western Houses to WuXingPage**

In `src/pages/WuXingPage.tsx`, after the existing pentagon/balance content, add:

```tsx
import { PremiumGate } from '../components/PremiumGate';

// Inside WuXingPage component, after the ElementBalanceChart section:
<PremiumGate feature="wu-xing-extended">
  <section className="mt-10 space-y-6" data-testid="wuxing-extended">
    <h2 className="font-serif text-2xl text-white/80">
      {lang === 'de' ? 'Westliche Häuser' : 'Western Houses'}
    </h2>
    {/* Houses content here — copy from DashboardAstroSection */}
  </section>
</PremiumGate>
```

WuXingPage already gets `apiData` via `useAppLayout()`. Check: `const { apiData } = useAppLayout();` — `apiData.western.houses` has the houses data.

**Step 4: Remove Western Houses from DashboardAstroSection**

In `src/components/dashboard/DashboardAstroSection.tsx`, find the Western Houses JSX block. Delete it. Add a comment:

```tsx
{/* Western Houses moved to WuXingPage — see src/pages/WuXingPage.tsx */}
```

**Step 5: Run tests + lint**

```bash
npx vitest run src/__tests__/wuxing-page-detail.test.tsx
npm run lint
```

Expected: All tests pass (premium gate tests should still pass since PremiumGate is already tested).

**Step 6: Commit**

```bash
git add src/pages/WuXingPage.tsx src/components/dashboard/DashboardAstroSection.tsx
git commit -m "feat(wuxing): add extended detail page with PremiumGate; move Western Houses from Dashboard"
```

---

## Work Package 4: Levi Layer Fixes

### Task 5: Fix Levi Section Text Colors and Alignment

**Background:** `DashboardLeviSection` uses `text-[#1E2A3A]/60` which is dark navy — fine on a light `morning-card` background, but the Dashboard itself is dark. The `morning-card` CSS class controls the card background. Check if the card is light or dark, and fix text visibility accordingly.

**Files:**
- Modify: `src/components/dashboard/DashboardLeviSection.tsx`
- Verify: `src/__tests__/levi-section.test.tsx`

**Step 1: Run existing Levi tests**

```bash
npx vitest run src/__tests__/levi-section.test.tsx
```

Note all passing tests.

**Step 2: Audit morning-card background color**

```bash
grep -n "morning-card" src/index.css
```

If `morning-card` has a light background (e.g., `background: white` or `background: #f0f0f0`), the dark text color is correct. If it has a dark/transparent background, the text is invisible.

**Step 3: Fix text color if needed**

In `src/components/dashboard/DashboardLeviSection.tsx`, line 82:

```tsx
// If morning-card is dark background, change:
// FROM:
<p className="text-base text-[#1E2A3A]/60 leading-relaxed mt-1">
// TO:
<p className="text-base text-white/55 leading-relaxed mt-1">
```

Also ensure `Badge` variant text is readable. The Badge shows "Levi Bazi Bereit" — verify it's visible with its current variant.

**Step 4: Verify no duplicate button**

In the current code, the premium state shows `callBtn`/`hangUpBtn`, and non-premium shows the upgrade button. These are exclusive (`isPremium ? A : B`). Confirm no duplicate by reading the component.

**Step 5: Run tests + lint**

```bash
npx vitest run src/__tests__/levi-section.test.tsx
npm run lint
```

**Step 6: Commit**

```bash
git add src/components/dashboard/DashboardLeviSection.tsx
git commit -m "fix(levi): fix text color for dark background aesthetic"
```

---

### Task 6: Reorder Dashboard — Confirm Levi Position

**Files:**
- Verify/Modify: `src/components/Dashboard.tsx`

**Step 1: Confirm current layout order**

Read `src/components/Dashboard.tsx` lines 340–410. Current order is:
1. Astro Section (Orrery + Western + BaZi/WuXing)
2. **Levi Section** ← currently here
3. Blueprint Card
4. Interpretation Section

The sprint wants Levi "above Blueprint, above lower sections" — which it already is. Verify this visually by reading the JSX order.

**Step 2: If Levi is already correctly positioned, skip to Task 7**

Only make changes if Levi is incorrectly below Blueprint or Interpretation.

**Step 3: If reorder is needed**

Cut the `<SectionErrorBoundary name="Levi">` block and paste it immediately after the Astro Section's closing `</SectionErrorBoundary>`.

**Step 4: Run full tests**

```bash
npm run test
```

Expected: No regressions.

**Step 5: Commit only if changed**

```bash
git add src/components/Dashboard.tsx
git commit -m "fix(dashboard): move Levi section before Blueprint Card in layout order"
```

---

## Work Package 5: Planetarium Enhancement

### Task 7: Increase Date/Time Display and Add Constellation Description

**Files:**
- Modify: `src/components/BirthChartOrrery.tsx`

**Step 1: Find existing date/time display**

```bash
grep -n "date\|time\|birthDate\|birth_date\|text-xs\|text-sm\|formatDate\|font" src/components/BirthChartOrrery.tsx | head -30
```

Identify the HTML overlay or Three.js text that shows the birth date/time.

**Step 2: Increase font size to minimum 18px**

If HTML overlay: change from `text-xs` or `text-sm` to `text-lg` or `text-xl`:

```tsx
// FROM:
<span className="text-xs text-white/40">

// TO:
<span className="text-xl font-serif text-white/70 tracking-wide">
```

If Three.js canvas text: find `font:` string in the canvas context and increase:

```typescript
// FROM: ctx.font = '12px Sora, sans-serif';
// TO:
ctx.font = '20px Sora, sans-serif';
```

**Step 3: Add constellation description label at bottom**

Find the outer container div of the orrery (should be `position: relative`). Add below the Three.js canvas:

```tsx
{birthData && (
  <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none z-10">
    <div className="px-5 py-2 bg-black/60 backdrop-blur-sm rounded-full">
      <p className="text-sm font-serif text-[#D4AF37]/80 tracking-wide text-center">
        Planetenposition am{' '}
        <span className="text-white/90">
          {new Date(birthData.date).toLocaleDateString('de-DE', {
            day: 'numeric', month: 'long', year: 'numeric',
          })}
        </span>
      </p>
    </div>
  </div>
)}
```

**Step 4: Run lint**

```bash
npm run lint
```

Expected: Clean.

**Step 5: Commit**

```bash
git add src/components/BirthChartOrrery.tsx
git commit -m "feat(planetarium): increase date/time font size, add constellation description label"
```

---

### Task 8: Show Current Planet Positions Alongside Birth Positions

**Files:**
- Modify: `src/components/BirthChartOrrery.tsx`
- Modify: `src/contexts/PlanetariumContext.tsx`

**Step 1: Check how existing planetary positions are computed**

```bash
grep -n "import\|astronomy\|orbital\|planets\|computePos\|getPosition" src/components/BirthChartOrrery.tsx | head -20
ls src/lib/astronomy/
```

Understand the position-computation API already in the codebase (likely in `src/lib/astronomy/`).

**Step 2: Add currentDate state to PlanetariumContext**

In `src/contexts/PlanetariumContext.tsx`, add:

```typescript
const [currentDate] = useState<Date>(() => new Date());
// Expose via context value
```

**Step 3: Compute current positions in BirthChartOrrery**

After birth planet meshes are created, add a second pass with `currentDate`:

```typescript
// Import the same position computer used for birth chart
import { computePlanetPosition } from '../lib/astronomy/';

// After scene setup:
const currentPlanets = PLANET_NAMES.map(name => {
  const pos = computePlanetPosition(name, currentDate);
  return { name, pos };
});

currentPlanets.forEach(({ name, pos }) => {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.03),
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      opacity: 0.4,
      transparent: true,
    })
  );
  mesh.position.set(pos.x, pos.y, pos.z);
  mesh.userData.label = `${name} (heute)`;
  scene.add(mesh);
});
```

**Step 4: Add a visual legend**

In the HTML overlay, add a small legend:

```tsx
<div className="absolute top-4 right-4 flex flex-col gap-1 pointer-events-none">
  <div className="flex items-center gap-2 text-xs text-white/50">
    <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />
    <span>Geburt</span>
  </div>
  <div className="flex items-center gap-2 text-xs text-white/50">
    <div className="w-2 h-2 rounded-full bg-white/40 border border-white/60" />
    <span>Heute</span>
  </div>
</div>
```

**Step 5: Run lint + tests**

```bash
npm run lint
npx vitest run src/__tests__/PlanetariumContext.test.tsx
```

**Step 6: Commit**

```bash
git add src/components/BirthChartOrrery.tsx src/contexts/PlanetariumContext.tsx
git commit -m "feat(planetarium): overlay current planet positions on birth chart with visual legend"
```

---

## Work Package 6: Navigation Variants

### Task 9: Build 3 Navigation Variants for Ben's A/B/C Decision

**Files:**
- Create: `src/components/navigation/NavVariantA.tsx`
- Create: `src/components/navigation/NavVariantB.tsx`
- Create: `src/components/navigation/NavVariantC.tsx`
- Create: `src/__tests__/navigation-variants.test.tsx`

All three must use German route labels, `react-router-dom` NavLink, dark luxury aesthetic (obsidian/gold), Tailwind v4 only.

---

**Step 1: Create NavVariantA (Vertical Sidebar with hover submenus)**

```tsx
// src/components/navigation/NavVariantA.tsx
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Orbit, Flame, BookOpen } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', sub: [] },
  { to: '/signatur', icon: Orbit, label: 'Signatur', sub: ['Quiz-Cluster', 'Ringe'] },
  { to: '/wu-xing', icon: Flame, label: 'Wu-Xing', sub: ['5 Elemente', 'Häuser'] },
  { to: '/wissen', icon: BookOpen, label: 'Wissen', sub: ['Artikel', 'Glossar'] },
] as const;

export function NavVariantA() {
  return (
    <nav className="fixed left-0 top-0 h-screen w-56 bg-[#00050A] border-r border-[#D4AF37]/10 flex flex-col gap-1 pt-8 px-3 z-50">
      <div className="mb-8 px-3">
        <span className="font-serif text-xl text-[#D4AF37]">Bazodiac</span>
      </div>
      {NAV_ITEMS.map(({ to, icon: Icon, label, sub }) => (
        <div key={to} className="group relative">
          <NavLink
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-[#D4AF37]/10 text-[#D4AF37]'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="font-medium tracking-wide">{label}</span>
          </NavLink>
          {sub.length > 0 && (
            <div className="hidden group-hover:flex flex-col absolute left-full top-0 ml-2 w-40 bg-[#0A0D10] border border-[#D4AF37]/15 rounded-lg py-1 shadow-xl z-50">
              {sub.map(s => (
                <div key={s} className="px-4 py-2 text-xs text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors">
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}
```

---

**Step 2: Create NavVariantB (Top Bar with dropdown menus)**

```tsx
// src/components/navigation/NavVariantB.tsx
import { useState } from 'react';
import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', sub: [] },
  { to: '/signatur', label: 'Signatur', sub: ['Quiz-Cluster', 'Ringe anzeigen'] },
  { to: '/wu-xing', label: 'Wu-Xing', sub: ['5 Elemente', 'Westliche Häuser'] },
  { to: '/wissen', label: 'Wissen', sub: ['Alle Artikel', 'Glossar'] },
] as const;

export function NavVariantB() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <nav className="fixed top-0 left-0 right-0 h-14 bg-[#00050A]/95 backdrop-blur-sm border-b border-[#D4AF37]/10 flex items-center px-8 gap-8 z-50">
      <span className="font-serif text-lg text-[#D4AF37] mr-6">Bazodiac</span>
      {NAV_ITEMS.map(({ to, label, sub }) => (
        <div
          key={to}
          className="relative"
          onMouseEnter={() => sub.length > 0 && setOpen(to)}
          onMouseLeave={() => setOpen(null)}
        >
          <NavLink
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `text-sm font-medium tracking-widest uppercase transition-colors ${
                isActive ? 'text-[#D4AF37]' : 'text-white/50 hover:text-white/80'
              }`
            }
          >
            {label}
          </NavLink>
          {sub.length > 0 && open === to && (
            <div className="absolute top-full left-0 mt-2 w-44 bg-[#0A0D10] border border-[#D4AF37]/15 rounded-lg py-1 shadow-xl">
              {sub.map(s => (
                <div key={s} className="px-4 py-2 text-xs text-white/50 hover:text-white/80 hover:bg-white/5 transition-colors">
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}
```

---

**Step 3: Create NavVariantC (Icon Rail with hover detail panels)**

```tsx
// src/components/navigation/NavVariantC.tsx
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Orbit, Flame, BookOpen } from 'lucide-react';

const NAV_ITEMS = [
  {
    to: '/', icon: LayoutDashboard, label: 'Dashboard',
    panel: { title: 'Dashboard', items: ['Dein Chart', 'Planetarium', 'Elemente'] },
  },
  {
    to: '/signatur', icon: Orbit, label: 'Signatur',
    panel: { title: 'Signatur', items: ['Frequenz-Ring', 'Quiz-Cluster', 'Dissonanz'] },
  },
  {
    to: '/wu-xing', icon: Flame, label: 'Wu-Xing',
    panel: { title: 'Wu-Xing', items: ['5 Elemente', 'Zyklen', 'Häuser'] },
  },
  {
    to: '/wissen', icon: BookOpen, label: 'Wissen',
    panel: { title: 'Wissen', items: ['Artikel', 'Horoskop-Guide', 'Glossar'] },
  },
] as const;

export function NavVariantC() {
  return (
    <nav className="fixed left-0 top-0 h-screen w-16 bg-[#00050A] border-r border-[#D4AF37]/10 flex flex-col items-center gap-2 pt-6 z-50">
      <div className="mb-6">
        <span className="font-serif text-[#D4AF37] text-lg">B</span>
      </div>
      {NAV_ITEMS.map(({ to, icon: Icon, label, panel }) => (
        <div key={to} className="group relative">
          <NavLink
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center justify-center w-10 h-10 rounded-xl transition-colors ${
                isActive
                  ? 'bg-[#D4AF37]/15 text-[#D4AF37]'
                  : 'text-white/35 hover:text-white/70 hover:bg-white/5'
              }`
            }
            title={label}
          >
            <Icon className="w-5 h-5" />
          </NavLink>
          <div className="hidden group-hover:flex flex-col absolute left-full top-0 ml-3 w-44 bg-[#0A0D10] border border-[#D4AF37]/15 rounded-xl p-3 shadow-2xl z-50">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37]/60 mb-2">{panel.title}</p>
            {panel.items.map(item => (
              <div key={item} className="text-left text-sm text-white/55 hover:text-white/90 py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors">
                {item}
              </div>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}
```

---

**Step 4: Write tests for all three variants**

```typescript
// src/__tests__/navigation-variants.test.tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NavVariantA } from '../components/navigation/NavVariantA';
import { NavVariantB } from '../components/navigation/NavVariantB';
import { NavVariantC } from '../components/navigation/NavVariantC';

function wrap(Component: React.ComponentType) {
  return render(<MemoryRouter><Component /></MemoryRouter>);
}

const ROUTES = ['Dashboard', 'Signatur', 'Wu-Xing', 'Wissen'];

describe('NavVariantA', () => {
  it('renders all 4 route labels', () => {
    wrap(NavVariantA);
    ROUTES.forEach(r => expect(screen.getByText(r)).toBeTruthy());
  });
  it('renders Bazodiac brand name', () => {
    wrap(NavVariantA);
    expect(screen.getByText('Bazodiac')).toBeTruthy();
  });
});

describe('NavVariantB', () => {
  it('renders all 4 route labels', () => {
    wrap(NavVariantB);
    ROUTES.forEach(r => expect(screen.getByText(r)).toBeTruthy());
  });
});

describe('NavVariantC', () => {
  it('renders 4 nav links', () => {
    wrap(NavVariantC);
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(4);
  });
});
```

**Step 5: Run tests**

```bash
npx vitest run src/__tests__/navigation-variants.test.tsx
```

Expected: All PASS.

**Step 6: Commit**

```bash
git add src/components/navigation/ src/__tests__/navigation-variants.test.tsx
git commit -m "feat(navigation): add 3 variant proposals (A=sidebar, B=topbar, C=icon-rail) for Ben's A/B/C choice"
```

**⚠️ PAUSE — Ben must choose A/B/C before Task 10 (header redesign) is implemented.**

---

## Work Package 6b: Header Redesign (after Ben's nav choice)

### Task 10: Redesign Dashboard Header

**Files:**
- Modify: `src/components/Dashboard.tsx`
- Verify: `src/i18n/translations.ts` — `dashboard.title` key

**Step 1: Verify heading copy in translations.ts**

```bash
grep -n '"dashboard.title"\|dashboard.*title\|Dein Bazodiac\|Personaliac' src/i18n/translations.ts
```

If `dashboard.title` DE value contains any legacy term (not "Dein Bazodiac"), fix it now.

**Step 2: Enlarge heading in Dashboard.tsx**

Find the `<h1>` element in the header section (~line 295). Change:

```tsx
// FROM:
<h1 className="font-serif text-4xl leading-tight text-white">

// TO:
<h1 className="font-serif text-5xl sm:text-6xl leading-tight text-white">
```

Also add a decorative element to create a distinct header zone:

```tsx
<motion.header
  className="relative mb-10 pb-8 border-b border-[#D4AF37]/15"
  ...
>
  {/* Gold accent line above heading */}
  <div className="w-8 h-px bg-[#D4AF37]/40 mb-4" />
  <p className="text-[#D4AF37]/45 text-[9px] uppercase tracking-[0.6em] mb-3">
    {t("dashboard.welcome")}
  </p>
  <h1 className="font-serif text-5xl sm:text-6xl leading-tight text-white">
    {t("dashboard.title")}
  </h1>
  ...
</motion.header>
```

**Step 3: Run lint + full tests**

```bash
npm run lint
npm run test
```

**Step 4: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "feat(header): enlarge dashboard heading, add visual accent to header zone"
```

---

## Work Package 7: Silent Failures (Stretch — only after WP1–6 complete)

### Task 11: Add Error Logging for Silent catch Blocks

**Files:**
- Modify: `src/components/fusion-ring-website/FusionRingCanvasV2.tsx`
- Modify: `src/hooks/usePremium.ts`

**Step 1: Find empty catch blocks**

```bash
grep -n "catch.*{}" src/components/fusion-ring-website/FusionRingCanvasV2.tsx src/hooks/usePremium.ts
```

**Step 2: Replace empty catches**

For each `catch {}` found:

```typescript
// FROM:
} catch {}

// TO:
} catch (e) {
  console.error('[ComponentName] Error:', e);
}
```

For usePremium realtime fallback:

```typescript
} catch (e) {
  console.warn('[usePremium] realtime subscription failed, falling back to polling:', e);
}
```

**Step 3: Commit**

```bash
git add src/components/fusion-ring-website/FusionRingCanvasV2.tsx src/hooks/usePremium.ts
git commit -m "fix(errors): replace silent catch blocks with console.error/warn"
```

---

## Definition of Done

```bash
npm run test   # No new failures (pre-existing: cosmic-encounter-flag x2, first-time-experience-e2e x1)
npm run lint   # Clean
```

| Check | Command | Expected |
|-------|---------|----------|
| Ghost UI | `npx vitest run src/__tests__/dashboard-ghost-ui.test.tsx` | 4/4 PASS |
| i18n | `npx vitest run src/__tests__/blueprint-card-i18n.test.tsx` | PASS |
| Wu-Xing icons | `npx vitest run src/__tests__/wuxing.test.ts` | PASS |
| Navigation | `npx vitest run src/__tests__/navigation-variants.test.tsx` | PASS |
| Full suite | `npm run test` | No new failures |

## Decisions Required During Sprint

| Decision | Task | Format |
|----------|------|--------|
| Navigation variant | After Task 9 | A/B/C |
| "Dein Bazodiac" heading confirm | Before Task 10 | Confirm or suggest |
