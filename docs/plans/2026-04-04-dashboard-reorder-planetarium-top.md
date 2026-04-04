# Dashboard Reorder: Planetarium Top + Section Hierarchy

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move Planetarium to the top of the Dashboard, extract it from DashboardAstroSection, fix its height, and reorder all Dashboard sections into the correct information hierarchy.

**Architecture:** Three tasks executed sequentially: (1) Fix the Planetarium height by adding a CSS class with proper aspect ratio; (2) Extract the Orrery from DashboardAstroSection into Dashboard.tsx as a standalone top-level section; (3) Reorder all Dashboard.tsx sections into the target hierarchy and tighten spacing.

**Tech Stack:** React 19, Tailwind CSS v4, Three.js (BirthChartOrrery), Vitest, motion/react

---

## Current State

**Dashboard.tsx section order (lines 269–474):**
1. Issues banner
2. Page header (title, birth date)
3. Identity cards (BigFour + MiniSignature) — `gap-20`
4. TagesImpuls (DashboardTagesEnergie / CosmicWeatherCard)
5. InfluenceGauges
6. CosmicInfluenceSection
7. DashboardAstroSection (contains: HeroNav + AstroDetailModal + **Orrery** + SkyModeToggle + BaZi/WuXing)
8. Agents (grid of AgentSection)
9. Upgrade banner
10. Interpretation (premium)
11. ShareCard + LegalFooter

**Target order:**
1. Issues banner
2. Page header
3. **Planetarium** (extracted, full-width, proper height)
4. SkyModeToggle (when planetarium mode on)
5. Identity cards + MiniSignature (left/right layout kept)
6. TagesImpuls (Daily Pulse)
7. InfluenceGauges + CosmicInfluence (tighter grouping)
8. DashboardAstroSection (HeroNav + BaZi/WuXing, **without Orrery**)
9. Agents
10. Upgrade banner
11. Interpretation
12. ShareCard + LegalFooter

**Planetarium height bug:**
- `BirthChartOrrery.tsx:1106` uses class `orrery-canvas-container` but NO CSS definition exists
- Height falls through to `clientHeight` fallback of 260px — results in a thin strip
- Comment at line 1103 says "height via .orrery-canvas-container in index.css" — but it was never created

---

### Task 1: Fix Planetarium Height (TASK-planetarium-height-fix)

**Files:**
- Modify: `src/index.css` (add `.orrery-canvas-container` class)
- Modify: `src/components/BirthChartOrrery.tsx:1004` (fallback container)
- Create: `src/__tests__/orrery-container-height.test.tsx`

**Step 1: Write the failing test**

Create `src/__tests__/orrery-container-height.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';

describe('Orrery container CSS', () => {
  it('orrery-canvas-container class defines a minimum height', () => {
    // Parse index.css for the class definition
    const css = document.querySelector('style')?.textContent || '';
    // In JSDOM we can't easily test CSS, so we verify the class exists
    // by checking the rendered container has the right aspect ratio class
    expect(true).toBe(true); // placeholder — real test below
  });
});

describe('Orrery container aspect ratio', () => {
  it('container has aspect-[16/10] class for proper window proportion', async () => {
    // We can't mount BirthChartOrrery in JSDOM (Three.js needs WebGL),
    // so we do a static grep-style verification that the class is present
    const fs = await import('fs');
    const source = fs.readFileSync(
      'src/components/BirthChartOrrery.tsx', 'utf-8'
    );
    expect(source).toContain('aspect-[16/10]');
  });

  it('CSS defines orrery-canvas-container with min-height', async () => {
    const fs = await import('fs');
    const css = fs.readFileSync('src/index.css', 'utf-8');
    expect(css).toContain('.orrery-canvas-container');
    expect(css).toMatch(/min-height:\s*3[0-9]{2}px/);
  });

  it('fallback container also uses aspect ratio class', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      'src/components/BirthChartOrrery.tsx', 'utf-8'
    );
    // The renderFailed fallback div should also have the aspect class
    const fallbackMatch = source.match(/renderFailed[\s\S]*?aspect-\[16\/10\]/);
    expect(fallbackMatch).not.toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/orrery-container-height.test.tsx`
Expected: FAIL — `aspect-[16/10]` not found in source, no CSS class exists

**Step 3: Add CSS class to index.css**

Add to `src/index.css` (near the end of the custom component styles section):

```css
/* ── Orrery Canvas Container ──────────────────────────────────────── */
.orrery-canvas-container {
  width: 100%;
  aspect-ratio: 16 / 10;
  min-height: 360px;
  max-height: 70vh;
}
```

**Step 4: Add aspect-ratio class to the canvas container div**

In `src/components/BirthChartOrrery.tsx`, change line ~1106:

```tsx
// BEFORE:
        className="orrery-canvas-container"

// AFTER:
        className="orrery-canvas-container aspect-[16/10]"
```

Also update the fallback container at line ~1004:

```tsx
// BEFORE:
      <div className="relative w-full rounded-2xl overflow-hidden border border-[#8B6914]/15 bg-[#0a1628]/90 shadow-[0_4px_32px_rgba(0,20,60,0.15)] orrery-canvas-container flex items-center justify-center">

// AFTER:
      <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden border border-[#8B6914]/15 bg-[#0a1628]/90 shadow-[0_4px_32px_rgba(0,20,60,0.15)] orrery-canvas-container flex items-center justify-center">
```

**Step 5: Update the Suspense fallback in DashboardAstroSection**

In `src/components/dashboard/DashboardAstroSection.tsx` line ~183:

```tsx
// BEFORE:
        <Suspense fallback={<div className="w-full aspect-square bg-[#0A0A14] rounded-2xl animate-pulse" />}>

// AFTER:
        <Suspense fallback={<div className="w-full aspect-[16/10] min-h-[360px] bg-[#0A0A14] rounded-2xl animate-pulse" />}>
```

**Step 6: Run tests**

Run: `npx vitest run src/__tests__/orrery-container-height.test.tsx`
Expected: PASS (3 tests)

**Step 7: Commit**

```bash
git add src/index.css src/components/BirthChartOrrery.tsx src/components/dashboard/DashboardAstroSection.tsx src/__tests__/orrery-container-height.test.tsx
git commit -m "fix(orrery): add proper aspect ratio and min-height to Planetarium container

The orrery-canvas-container CSS class was referenced but never defined,
causing the canvas to collapse to a 260px-high strip. Add 16:10 aspect
ratio with 360px min-height, capped at 70vh."
```

---

### Task 2: Extract Planetarium from DashboardAstroSection (TASK-planetarium-top)

**Files:**
- Modify: `src/components/dashboard/DashboardAstroSection.tsx` — remove Orrery block + related props
- Modify: `src/components/Dashboard.tsx` — add standalone Orrery section at top
- Create: `src/__tests__/dashboard-section-order.test.tsx`

**Step 1: Write the failing test**

Create `src/__tests__/dashboard-section-order.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';

describe('Dashboard section order', () => {
  it('Planetarium section appears before Identity section in Dashboard.tsx', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

    const planetariumIdx = source.indexOf('SECTION: PLANETARIUM');
    const identityIdx = source.indexOf('IDENTITY');

    expect(planetariumIdx).toBeGreaterThan(-1);
    expect(identityIdx).toBeGreaterThan(-1);
    expect(planetariumIdx).toBeLessThan(identityIdx);
  });

  it('Orrery is NOT rendered inside DashboardAstroSection', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      'src/components/dashboard/DashboardAstroSection.tsx', 'utf-8'
    );
    // BirthChartOrrery should no longer be imported or rendered
    expect(source).not.toContain('BirthChartOrrery');
  });

  it('DashboardAstroSection no longer accepts birthDate prop', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync(
      'src/components/dashboard/DashboardAstroSection.tsx', 'utf-8'
    );
    // birthDate was only needed for the Orrery
    expect(source).not.toMatch(/birthDate\s*[?:]/);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/dashboard-section-order.test.tsx`
Expected: FAIL — no `SECTION: PLANETARIUM` comment, BirthChartOrrery still in AstroSection

**Step 3: Remove Orrery from DashboardAstroSection**

In `src/components/dashboard/DashboardAstroSection.tsx`:

3a. **Remove the lazy import** (line 5):
```tsx
// DELETE this line:
const BirthChartOrrery = lazy(() => import("../BirthChartOrrery").then(m => ({ default: m.BirthChartOrrery })));
```

3b. **Remove `Suspense` import** if no longer used (check — it's used for BirthChartOrrery only). Remove from the `import { ... }` at line 1:
```tsx
// BEFORE:
import { useEffect, useState, useMemo, lazy, Suspense } from "react";
// AFTER:
import { useEffect, useState, useMemo } from "react";
```

3c. **Remove from props interface** (lines 68-75) — remove `birthDate` and `isFirstReading`:
```tsx
interface DashboardAstroSectionProps {
  apiData: ApiData;
  isPremium: boolean;
  tileTexts?: TileTexts;
  leviSlot?: React.ReactNode;
}
```

3d. **Remove from destructuring** (lines 81-88):
```tsx
export function DashboardAstroSection({
  apiData,
  isPremium,
  tileTexts,
  leviSlot,
}: DashboardAstroSectionProps) {
```

3e. **Remove all Orrery-related code from the component body:**
- Remove `showBirthSkyWelcome` state + useEffect (lines 96-106)
- Remove `orreryDate` memo (lines 141-145)
- Remove `birthConstellationKey` memo (lines 148-151)
- Remove the `SkyModeToggle` import and the `SkyModeToggle` render block (lines 223-228)

3f. **Remove the entire Orrery render block** (lines 180-227 — from `{/* ═══ 3D ORRERY */}` through the SkyModeToggle):
Delete the `<div id="section-western" />` anchor, the `<motion.div>` wrapping the Suspense/BirthChartOrrery, the Birth Sky Welcome Banner AnimatePresence block, and the SkyModeToggle conditional.

3g. **Remove unused imports**: `AnimatePresence` (if not used elsewhere in file), `getConstellationForSign`, `SkyModeToggle`.

**Step 4: Add Planetarium as standalone section in Dashboard.tsx**

4a. **Add imports** at the top of `src/components/Dashboard.tsx`:
```tsx
import { lazy, Suspense } from "react";
const BirthChartOrrery = lazy(() => import("./BirthChartOrrery").then(m => ({ default: m.BirthChartOrrery })));
import { SkyModeToggle } from "./dashboard/SkyModeToggle";
import { getConstellationForSign } from "../lib/astro-data/constellationFromSign";
```

Note: `lazy` and `Suspense` may already be in imports — add only if missing.

4b. **Add computed values** inside the Dashboard component body (before the `return`), after `metaLoading`/`metaError`:

```tsx
  // ── Planetarium data ──────────────────────────────────────────────
  const { planetariumMode, skyMode } = usePlanetarium();

  const orreryDate = useMemo(() => {
    if (!birthDate) return new Date();
    const d = new Date(birthDate);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [birthDate]);

  const sunSign = apiData?.western?.zodiac_sign || '';
  const birthConstellationKey = useMemo(
    () => getConstellationForSign(sunSign)?.key,
    [sunSign],
  );
```

Note: `usePlanetarium` is already imported (line 39). Check if `planetariumMode` is already destructured — it is (line 110). Reuse those existing bindings. `sunSign` may already be computed — avoid duplicates by checking existing code.

4c. **Add the Planetarium section** in the JSX, right after the Page Header and before the Identity section. Insert between the `</motion.header>` (line 326) and the `{/* ═══ IDENTITY` comment (line 328):

```tsx
      {/* ═══ SECTION: PLANETARIUM ═════════════════════════════════════ */}
      <motion.div className="-mx-4 md:-mx-6" {...fadeIn(0.02)}>
        <Suspense fallback={<div className="w-full aspect-[16/10] min-h-[360px] bg-[#0A0A14] rounded-2xl animate-pulse" />}>
          <BirthChartOrrery
            birthDate={orreryDate}
            planetariumMode={planetariumMode}
            birthConstellation={birthConstellationKey}
            autoPlay={isFirstReading}
            currentSky={skyMode === 'current'}
          />
        </Suspense>
      </motion.div>

      {/* ═══ SKY MODE TOGGLE ═══════════════════════════════════════════ */}
      {planetariumMode && (
        <motion.div className="-mt-8" {...fadeIn(0.04)}>
          <SkyModeToggle />
        </motion.div>
      )}
```

4d. **Update DashboardAstroSection call** — remove `birthDate` and `isFirstReading` props (lines 398-404):

```tsx
      <SectionErrorBoundary name="Astro">
        <DashboardAstroSection
          apiData={apiData}
          isPremium={isPremium}
          tileTexts={tileTexts}
        />
      </SectionErrorBoundary>
```

**Step 5: Run tests**

Run: `npx vitest run src/__tests__/dashboard-section-order.test.tsx`
Expected: PASS (3 tests)

Then run the full suite to check for regressions:
Run: `npx vitest run`
Expected: All tests pass. Some tests may reference `birthDate` on `DashboardAstroSectionProps` — fix if needed.

**Step 6: Commit**

```bash
git add src/components/Dashboard.tsx src/components/dashboard/DashboardAstroSection.tsx src/__tests__/dashboard-section-order.test.tsx
git commit -m "feat(dashboard): extract Planetarium to top of page as entry point

Move BirthChartOrrery + SkyModeToggle from DashboardAstroSection into
Dashboard.tsx as standalone first section. The Planetarium is now the
visual entry point per S-DASH-UX requirements."
```

---

### Task 3: Reorder Dashboard Sections + Tighten Spacing (TASK-dashboard-reorder)

**Files:**
- Modify: `src/components/Dashboard.tsx` — reorder sections, reduce gap
- Modify: `src/__tests__/dashboard-section-order.test.tsx` — add order tests

**Step 1: Extend the section order test**

Add to `src/__tests__/dashboard-section-order.test.tsx`:

```tsx
describe('Dashboard full section order', () => {
  it('sections appear in correct hierarchy order', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

    const markers = [
      'SECTION: PLANETARIUM',
      'SKY MODE TOGGLE',
      'IDENTITY',
      'TAGES-IMPULS',
      'INFLUENCE GAUGES',
      'COSMIC INFLUENCE',
      'KOSMISCHER BLUEPRINT',
      'VOICE AGENTS',
      'UPGRADE BANNER',
      'KI-SYNTHESE',
      'SHARE CARD',
    ];

    let lastIdx = -1;
    for (const marker of markers) {
      const idx = source.indexOf(marker);
      expect(idx, `"${marker}" should exist in Dashboard.tsx`).toBeGreaterThan(-1);
      expect(idx, `"${marker}" should come after previous section`).toBeGreaterThan(lastIdx);
      lastIdx = idx;
    }
  });

  it('main container uses tighter spacing than gap-20', async () => {
    const fs = await import('fs');
    const source = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');
    // Should use gap-12 instead of gap-20
    expect(source).toContain('gap-12');
    expect(source).not.toContain('gap-20');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/dashboard-section-order.test.tsx`
Expected: FAIL — section order is still old, gap-20 still present

**Step 3: Reorder sections in Dashboard.tsx**

3a. **Change the main container gap** from `gap-20` to `gap-12`:

```tsx
// BEFORE (line ~274):
      className="w-full max-w-6xl mx-auto px-4 md:px-6 flex flex-col gap-20"

// AFTER:
      className="w-full max-w-6xl mx-auto px-4 md:px-6 flex flex-col gap-12"
```

3b. **Reorder the JSX blocks** inside the return statement to match this exact sequence:

1. Tour sentinel (planetarium) + Issues banner
2. Page header
3. **SECTION: PLANETARIUM** (added in Task 2)
4. **SKY MODE TOGGLE** (added in Task 2)
5. **IDENTITY** — BigFour + MiniSignature (existing)
6. **TAGES-IMPULS** — DashboardTagesEnergie / CosmicWeatherCard (existing)
7. **INFLUENCE GAUGES** (existing) — add comment `{/* ═══ INFLUENCE GAUGES ═══ */}`
8. **COSMIC INFLUENCE** (existing) — reduce top spacing, group tighter with influences
9. Tour sentinel (astro) — move this sentinel to just before the AstroSection
10. **KOSMISCHER BLUEPRINT** — DashboardAstroSection (existing, renamed comment)
11. Tour sentinel (levi)
12. **VOICE AGENTS** — Agents grid (existing)
13. **UPGRADE BANNER** (existing)
14. Tour sentinel (nav hints)
15. **KI-SYNTHESE** — Interpretation (existing)
16. **SHARE CARD** + LegalFooter (existing)

3c. **Group InfluenceGauges + CosmicInfluence tighter** by wrapping them in a single container with reduced internal spacing:

```tsx
      {/* ═══ INFLUENCES CLUSTER (Daily Pulse context) ════════════════ */}
      <div className="flex flex-col gap-6">
        <motion.div {...fadeIn(0.15)}>
          <SectionErrorBoundary name="InfluenceGauges">
            <InfluenceGauges weights={natalWeights} />
          </SectionErrorBoundary>
        </motion.div>

        <motion.div {...fadeIn(0.2)}>
          <SectionErrorBoundary name="CosmicInfluence">
            <CosmicInfluenceSection spaceWeather={spaceWeather} />
          </SectionErrorBoundary>
        </motion.div>
      </div>
```

**Step 4: Run all tests**

Run: `npx vitest run src/__tests__/dashboard-section-order.test.tsx`
Expected: PASS

Run: `npx vitest run`
Expected: All tests pass

**Step 5: Commit**

```bash
git add src/components/Dashboard.tsx src/__tests__/dashboard-section-order.test.tsx
git commit -m "feat(dashboard): reorder sections into target information hierarchy

Planetarium → Identity → Daily Pulse → Influences → Blueprint → Agents.
Reduce main gap from 80px (gap-20) to 48px (gap-12). Group InfluenceGauges
+ CosmicInfluence into tighter cluster with gap-6."
```

---

## Risk Notes

- **Tour system**: The `useDashboardTour` anchors via sentinel refs. Moving sections changes scroll positions, but sentinels move with their sections so IntersectionObserver still works.
- **Birth Sky Welcome Banner**: In Task 2, the `showBirthSkyWelcome` state was in DashboardAstroSection. When extracting, this state needs to move to Dashboard.tsx or be simplified to just `isFirstReading` passed as `autoPlay` to the Orrery.
- **Three.js in JSDOM**: Orrery can't be rendered in test environment — all tests use file-content assertions instead of render tests.
- **DashboardAstroSection consumers**: Only `Dashboard.tsx` imports `DashboardAstroSection`. No other callers to update.
