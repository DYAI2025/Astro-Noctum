# S-DASH-UX Remaining Tasks — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete all 21 remaining S-DASH-UX tasks — Dashboard brandmark, bright-mode fixes, Cluster K bug handoffs, layout restructure, identity accordion, and polish.

**Architecture:** All changes are frontend-only (Dashboard.tsx, component files, i18n). No server or API changes. Two tasks (TASK-influence-tooltips-personalized, TASK-cosmic-values-explained) are marked NEEDS REFINEMENT and will be stubbed with TODO comments pending PO decision.

**Tech Stack:** React 19, TypeScript, Tailwind v4 CSS vars, Framer Motion, Three.js (Planetarium), Vitest

---

## Batch 1: P1 Quick Wins (3 tasks, parallel-safe)

### Task 1: TASK-dashboard-brandmark-heading-restyle

**Files:**
- Modify: `src/components/Dashboard.tsx:326-353`
- Modify: `src/i18n/translations.ts` (dashboard.title, dashboard.welcome keys)

**Step 1: Update i18n keys**

In `src/i18n/translations.ts`, change:
- EN: `dashboard.title` → `"Bazodiac"`, `dashboard.welcome` → `"Your Cosmic Atlas"`
- DE: `dashboard.title` → `"Bazodiac"`, `dashboard.welcome` → `"Dein kosmischer Atlas"`

**Step 2: Restyle header in Dashboard.tsx**

Replace lines 326-353 (the PAGE HEADER block):

```tsx
{/* ═══ PAGE HEADER ═══════════════════════════════════════════════ */}
<motion.header
  className="flex items-start justify-between border-b border-[#D4AF37]/15 pb-6"
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.7, ease: "easeOut" }}
>
  <div>
    <div className="w-12 h-px mb-5" style={{ background: 'var(--tile-accent)', opacity: 0.3 }} />
    <h1 className="font-serif text-6xl sm:text-7xl leading-none tracking-tight" style={{ color: '#D4AF37' }}>
      {t("dashboard.title")}
    </h1>
    <div className="w-16 h-px mt-3 mb-2" style={{
      background: 'linear-gradient(90deg, #D4AF37 0%, transparent 100%)',
      opacity: 0.5
    }} />
    <p className="text-[9px] uppercase tracking-[0.5em]" style={{ color: 'var(--tile-text-secondary)', opacity: 0.6 }}>
      {t("dashboard.welcome")}
    </p>
    {birthDate && (
      <p className="mt-1.5 text-xs tracking-wide" style={{ color: 'var(--tile-text-secondary)' }}>
        {t("dashboard.birthDate")}{": "}
        <span style={{ color: 'var(--tile-text-secondary)' }}>{birthDate}</span>
      </p>
    )}
  </div>
  <div className="flex shrink-0 items-center gap-3 pt-1">
  </div>
</motion.header>
```

Key changes: `font-serif text-6xl sm:text-7xl` (Cormorant Garamond), gold `#D4AF37` color, ornamental gradient underline, subtitle below (not above).

**Step 3: Run tests**

Run: `npx vitest run src/__tests__/dashboard-sections.test.ts`
Expected: PASS (existing tests should still find header element)

**Step 4: Verify visually**

Run: `npm run dev` — check Dashboard header renders gold "Bazodiac" with ornamental underline at 375px and 1280px.

**Step 5: Commit**

```bash
git add src/components/Dashboard.tsx src/i18n/translations.ts
git commit -m "feat(dashboard): brandmark heading 'Bazodiac' with gold serif styling"
```

---

### Task 2: TASK-cosmic-influence-bright-audit

**Files:**
- Modify: `src/components/dashboard/CosmicInfluenceSection.tsx:102-170`

**Step 1: Replace hardcoded dark colors with CSS vars**

In `CosmicInfluenceSection.tsx`:
- Line 155: `bg-zinc-900/40 border border-zinc-800` → `bg-[var(--tile-bg)] border border-[var(--tile-border)]`
- Line 158: `text-zinc-300` → `text-[var(--tile-text-secondary)]`
- GaugeBar component (~line 102-127):
  - `text-zinc-300` → `text-[var(--tile-text-secondary)]`
  - `bg-zinc-900/50` → `bg-[var(--tile-bg)]/50`
  - `border-white/5` → `border-[var(--tile-border)]`
  - `text-zinc-500` → `text-[var(--tile-text-tertiary,var(--tile-text-secondary))]`
- Line 161-163: `text-emerald-500` (live indicator) can stay — accent color is intentional
- Line 164: `text-zinc-600` → `text-[var(--tile-text-secondary)]`

**Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/dashboard/CosmicInfluenceSection.tsx
git commit -m "fix(dashboard): CosmicInfluenceSection uses CSS vars for bright mode"
```

---

### Task 3: TASK-mini-signature-alignment-fix

**Files:**
- Modify: `src/components/dashboard/MiniSignature.tsx:40-70`
- Modify: `src/components/Dashboard.tsx:388` (container sizing)

**Step 1: Fix responsive canvas sizing**

In `MiniSignature.tsx`:
- Line 40: change `aspect-square` to explicit responsive sizing
- Line 62: reduce aggressive hover scale from `scale-125 group-hover:scale-150` to `scale-110 group-hover:scale-125` to prevent viewport clipping at 375px
- Canvas wrapper: ensure `overflow-hidden rounded-full` contains the canvas at all sizes

In `Dashboard.tsx` line 388:
- Change `w-[200px] md:w-[240px]` to `w-[180px] sm:w-[200px] md:w-[240px]` for 375px screens

**Step 2: Write test for responsive container**

Create or update test verifying MiniSignature renders without overflow at small container sizes.

**Step 3: Run tests**

Run: `npx vitest run src/__tests__/`
Expected: PASS

**Step 4: Commit**

```bash
git add src/components/dashboard/MiniSignature.tsx src/components/Dashboard.tsx
git commit -m "fix(dashboard): MiniSignature alignment at 375px and 768px breakpoints"
```

---

## Batch 2: P1 Cluster K Bug Fixes (4 tasks)

### Task 4: TASK-vibe-visibility-fix

**Files:**
- Modify: `src/components/dashboard/VibesSection.tsx`
- Modify: `src/i18n/translations.ts` (verify namespace)
- Test: `src/__tests__/vibes-section.test.ts` (new or update)

**Step 1: Audit i18n namespace**

Check whether VibesSection uses `t('vibesSection.*')` (root-level) but translations define `dashboard.vibesSection.*`. If mismatch: update VibesSection to use `t('dashboard.vibesSection.*')` OR move translation keys to root `vibesSection.*` to match existing code.

**Step 2: Verify PremiumGate mount path**

In VibesSection.tsx:
- Confirm `PremiumGate` wrapping lets premium users reach the CTA button
- Confirm `VibesModal` renders outside `PremiumGate` scope (it should — AnimatePresence block)
- If CTA is unreachable due to section order: Dashboard.tsx line 424 placement between TagesImpuls and Influences is correct per F4 hierarchy

**Step 3: Write failing test**

```ts
it('renders Vibe CTA button for premium users', () => {
  // Mock usePremium to return isPremium: true
  // Render VibesSection with userId
  // Expect CTA button to be in document
});
```

**Step 4: Fix and verify**

Apply namespace fix. Ensure `fetchVibes` response maps correctly to modal content.

**Step 5: Run tests**

Run: `npx vitest run src/__tests__/vibes-section.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add src/components/dashboard/VibesSection.tsx src/i18n/translations.ts src/__tests__/vibes-section.test.ts
git commit -m "fix(dashboard): Vibe CTA visibility — i18n namespace + PremiumGate mount"
```

---

### Task 5: TASK-current-sky-behavior-fix

**Files:**
- Modify: `src/components/BirthChartOrrery.tsx:147-180,672-680`
- Test: `src/__tests__/orrery-sky-mode.test.ts` (new)

**Step 1: Diagnose root cause**

In BirthChartOrrery.tsx:
- `currentSky` effect (line 171-179) updates `simTime` to `daysSinceJ2000(new Date())` — correct
- But `observerLat`/`observerLon` remain anchored to birth location (from `useCelestialOrrery(CITIES[0], birthDate)`)
- Constellation rendering and horizon use birth coordinates — current sky should use a neutral reference or user's current location

**Step 2: Write failing test**

```ts
describe('BirthChartOrrery sky mode', () => {
  it('uses different simTime for current sky vs birth sky', () => {
    // Verify simTime differs when currentSky=true vs false
  });
  it('current sky produces visibly different planet positions', () => {
    // Verify at least 3 planets have different positions
  });
});
```

**Step 3: Fix observer sync**

When `currentSky=true`:
- Set `simTimeRef.current = daysSinceJ2000(new Date())` (already done)
- Update constellation epoch to match current date (not birth date)
- Use a latitude/longitude that represents "now" — if Geolocation API not available (that's TASK-current-sky-live-location, separate), use the same birth coordinates but ensure the time-based planet positions are materially different

The key fix: ensure the animation loop in line 672-677 doesn't just set simTime but also forces planet position recalculation with the new epoch. Check if `computePlanetPositions()` uses `simTimeRef` or a stale cached value.

**Step 4: Run tests**

Run: `npx vitest run src/__tests__/orrery-sky-mode.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/BirthChartOrrery.tsx src/__tests__/orrery-sky-mode.test.ts
git commit -m "fix(planetarium): current sky epoch sync — visibly different from birth sky"
```

---

### Task 6: TASK-daily-pulse-influences-live-fix

**Files:**
- Modify: `src/components/dashboard/InfluenceGauges.tsx:85-95`
- Modify: `src/hooks/useFirstRunDaily.ts` (verify date boundary)
- Test: `src/__tests__/influence-gauges-live.test.ts` (new)

**Step 1: Audit data freshness**

1. `InfluenceGauges` receives `weights` from `natalWeights` — these are birth chart weights (static), NOT live transit data
2. The "LIVE" indicator (line ~91) shows when `weights !== undefined` — misleading for natal weights
3. `useFirstRunDaily` caches by `todayKey()` — verify this rotates at midnight

**Step 2: Write failing test**

```ts
it('shows date-specific label instead of generic LIVE for natal weights', () => {
  // Render with natalWeights
  // Expect NOT to find "LIVE" text when data is natal, not transit
});

it('labels transit-derived gauges as live', () => {
  // When weights come from transit feed, show "LIVE"
});
```

**Step 3: Fix misleading label**

In `InfluenceGauges.tsx`:
- If weights are natal (birth chart): show birth date label or "Natal" instead of "LIVE"
- If weights include transit modulation: show "LIVE" with date

Add a `source` prop or detect data freshness:
```tsx
interface InfluenceGaugesProps {
  weights?: Record<string, number>;
  isLive?: boolean; // true when transit-feed derived
}
```

In Dashboard.tsx, pass `isLive={false}` for natal weights (current behavior) — a future transit integration will pass `true`.

**Step 4: Verify useFirstRunDaily date rotation**

Check that `todayKey()` in `useFirstRunDaily.ts` produces a new key after midnight. If it uses `new Date().toLocaleDateString()`, it may not handle timezone edge cases — verify.

**Step 5: Run tests**

Run: `npx vitest run src/__tests__/influence-gauges-live.test.ts`
Expected: PASS

**Step 6: Commit**

```bash
git add src/components/dashboard/InfluenceGauges.tsx src/components/Dashboard.tsx src/__tests__/influence-gauges-live.test.ts
git commit -m "fix(dashboard): InfluenceGauges truthful label — natal vs live distinction"
```

---

### Task 7: TASK-planetarium-fullscreen-fix

**Files:**
- Modify: `src/components/BirthChartOrrery.tsx` (fullscreen handler + resize listener)
- Test: `src/__tests__/orrery-fullscreen.test.ts` (new)

**Step 1: Diagnose fullscreen rendering**

In BirthChartOrrery.tsx, find the fullscreen toggle handler (Maximize2/Minimize2 icons). When entering fullscreen:
- Three.js `renderer.setSize(width, height)` must update to full viewport
- `camera.aspect = width / height` must update
- `camera.updateProjectionMatrix()` must be called

Check if a `resize` event listener exists and fires during fullscreen transitions. If not, add one.

**Step 2: Write failing test**

```ts
it('updates camera aspect ratio on container resize', () => {
  // Mock ResizeObserver or window resize event
  // Verify camera.aspect changes when container size changes
});
```

**Step 3: Add resize handling**

Add a `ResizeObserver` on the canvas container:
```ts
useEffect(() => {
  const container = containerRef.current;
  if (!container) return;
  const observer = new ResizeObserver((entries) => {
    const { width, height } = entries[0].contentRect;
    if (renderer && camera) {
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
  });
  observer.observe(container);
  return () => observer.disconnect();
}, [renderer, camera]);
```

**Step 4: Run tests**

Run: `npx vitest run src/__tests__/orrery-fullscreen.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/BirthChartOrrery.tsx src/__tests__/orrery-fullscreen.test.ts
git commit -m "fix(planetarium): fullscreen camera aspect ratio via ResizeObserver"
```

---

## Batch 3: P1 Feature — BaZi Pillars Clickable

### Task 8: TASK-bazi-pillars-clickable

**Files:**
- Modify: `src/components/BaZiFourPillars.tsx:79-164`
- Modify: `src/i18n/translations.ts` (add `dashboard.baziPillars.expandLabel`)
- Test: `src/__tests__/bazi-pillars-click.test.ts` (new)

**Step 1: Write failing test**

```ts
it('expands pillar detail on click', () => {
  // Render BaZiFourPillars with mock data
  // Click on Year pillar
  // Expect expanded content panel to appear with stem+branch description
});

it('collapses previously expanded pillar when another is clicked', () => {
  // Single-expand accordion behavior
});
```

**Step 2: Add click-to-expand**

In `BaZiFourPillars.tsx`:
- Add `const [expandedPillar, setExpandedPillar] = useState<string | null>(null)` state
- Change `cursor-help` to `cursor-pointer`
- On click: `setExpandedPillar(prev => prev === pillarKey ? null : pillarKey)`
- Below each pillar card, conditionally render expand panel:

```tsx
{expandedPillar === pillarKey && (
  <motion.div
    initial={{ height: 0, opacity: 0 }}
    animate={{ height: 'auto', opacity: 1 }}
    exit={{ height: 0, opacity: 0 }}
    transition={{ duration: 0.3, ease: 'easeOut' }}
    className="px-4 pb-4"
  >
    <p className="text-sm" style={{ color: 'var(--tile-text-secondary)' }}>
      {/* Stem description from heavenlyStems.ts */}
      {stemDescription}
    </p>
    <p className="text-xs mt-2" style={{ color: 'var(--tile-text-tertiary, var(--tile-text-secondary))' }}>
      {/* Branch description from earthlyBranches data */}
      {branchDescription}
    </p>
  </motion.div>
)}
```

**Step 3: Wire stem/branch descriptions**

Import `heavenlyStems` from `src/lib/astro-data/heavenlyStems.ts`. Each stem has 5-part structure (identity, daily life, gifts, shadow, growth) in DE+EN. Use the `identity` section for the expanded panel content.

**Step 4: Run tests**

Run: `npx vitest run src/__tests__/bazi-pillars-click.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/BaZiFourPillars.tsx src/__tests__/bazi-pillars-click.test.ts
git commit -m "feat(dashboard): BaZi Four Pillars click-to-expand with stem descriptions"
```

---

## Batch 4: P2 Layout Restructure (5 tasks, sequential)

### Task 9: TASK-astro-three-cards

**Files:**
- Modify: `src/components/dashboard/DashboardAstroSection.tsx:133-138`
- Modify: `src/components/Dashboard.tsx:449-456`

**Step 1: Extract three-card nav to standalone row**

Currently `DashboardAstroSection` renders `DashboardHeroNav` (Sun/BaZi/WuXing tiles) inside itself. Extract these three tiles to render as a standalone `grid grid-cols-3 gap-4` row in Dashboard.tsx, directly after the Influences cluster.

In `Dashboard.tsx`, replace the `DashboardAstroSection` block with:
```tsx
{/* ═══ THREE ASTRO CARDS ═══════════════════════════════════════ */}
<motion.div className="grid grid-cols-1 sm:grid-cols-3 gap-4" {...fadeIn(0.25)}>
  <DashboardHeroNav apiData={apiData} tileTexts={tileTexts} />
</motion.div>

{/* ═══ KOSMISCHER BLUEPRINT (BaZi/WuXing detail, premium) ═════ */}
<SectionErrorBoundary name="Astro">
  <DashboardAstroSection
    apiData={apiData}
    isPremium={isPremium}
    tileTexts={tileTexts}
    hideHeroNav={true}
  />
</SectionErrorBoundary>
```

Add `hideHeroNav` prop to `DashboardAstroSection` to skip rendering `DashboardHeroNav` internally when it's rendered separately.

**Step 2: Run tests**

Run: `npx vitest run src/__tests__/dashboard-sections.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/Dashboard.tsx src/components/dashboard/DashboardAstroSection.tsx
git commit -m "refactor(dashboard): extract three astro cards as standalone row"
```

---

### Task 10: TASK-blueprint-position

**Files:**
- Modify: `src/components/Dashboard.tsx` (reorder sections)

**Step 1: Move Blueprint/Interpretation below three cards**

In Dashboard.tsx, move the `DashboardInterpretationSection` block (lines 504-514) to directly after the `DashboardAstroSection` / three-card row, before the Voice Agents section. The new order:

1. Planetarium
2. Identity + Signatur row
3. TagesImpuls
4. Vibe CTA
5. Influences cluster
6. **Three Astro Cards** (new position from Task 9)
7. **Blueprint / Interpretation** (moved up)
8. Voice Agents
9. Upgrade Banner
10. Share Card + Footer

**Step 2: Run tests**

Run: `npx vitest run src/__tests__/dashboard-sections.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "refactor(dashboard): Blueprint section directly below three astro cards"
```

---

### Task 11: TASK-daily-pulse-cluster

**Files:**
- Modify: `src/components/Dashboard.tsx:431-444`

**Step 1: Wrap Influence subsections in visual group**

Currently `InfluenceGauges` and `CosmicInfluenceSection` are in a `flex flex-col gap-6` div. Add a shared parent `cosmic-tile` container or reduce spacing to make them visually cohesive:

```tsx
<div className="cosmic-tile p-0 overflow-hidden rounded-[2rem]">
  <motion.div className="p-6" {...fadeIn(0.15)}>
    <InfluenceGauges weights={natalWeights} isLive={false} />
  </motion.div>
  <div className="border-t border-[var(--tile-border)]" />
  <motion.div className="p-6" {...fadeIn(0.2)}>
    <CosmicInfluenceSection spaceWeather={spaceWeather} />
  </motion.div>
</div>
```

**Step 2: Run tests**

Run: `npx vitest run src/__tests__/dashboard-sections.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "feat(dashboard): group Influences + CosmicInfluence as cohesive cluster"
```

---

### Task 12: TASK-dashboard-width-alignment

**Files:**
- Modify: `src/components/Dashboard.tsx` (multiple sections)

**Step 1: Audit max-width inconsistencies**

Current state:
- Outer wrapper: `max-w-6xl`
- Agent grid: `max-w-3xl mx-auto`
- DashboardAstroSection: no max-w constraint
- Other sections: inherit outer `max-w-6xl`

Fix: Remove `max-w-3xl` from the agent grid wrapper — let it fill the same width as other sections. The `grid-cols-2` already constrains card width. All sections should inherit the outer `max-w-6xl` consistently.

**Step 2: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "fix(dashboard): consistent max-width alignment across all sections"
```

---

### Task 13: TASK-daily-pulse-naming-resolve

**Files:**
- Modify: `src/i18n/translations.ts` (badge keys)
- Modify: `src/components/dashboard/DashboardTagesEnergie.tsx` (if badge rendering needs update)

**Step 1: Fix badge localization**

Per DEC-daily-pulse-naming: section title is "Daily Pulse"/"Tagesimpuls" (already correct). Sub-mode badges should be localized:
- `tagesImpuls.badgePulse`: EN "Day-Pulse" → keep; DE "Day-Pulse" → "Tages-Puls"
- `tagesImpuls.badgeTrace`: EN "Day-Trace" → keep; DE "Day-Trace" → "Tages-Spur"

**Step 2: Commit**

```bash
git add src/i18n/translations.ts
git commit -m "fix(i18n): localize Daily Pulse badge labels to German"
```

---

## Batch 5: P2 Theme & Audit (3 tasks + 2 stubs)

### Task 14: TASK-bazi-wuxing-bright-audit

**Files:**
- Modify: `src/components/BaZiFourPillars.tsx`

**Step 1: Replace hardcoded colors**

Find all `text-[#1E2A3A]` instances and replace with `text-[var(--tile-text-primary)]`. Replace any other hardcoded hex colors with CSS var equivalents from DEC-design-system-v2.

**Step 2: Commit**

```bash
git add src/components/BaZiFourPillars.tsx
git commit -m "fix(dashboard): BaZiFourPillars uses CSS vars for bright mode"
```

---

### Task 15: TASK-agents-dark-mode-hierarchy

**Files:**
- Modify: `src/components/dashboard/AgentSection.tsx:139-146`

**Step 1: Improve card differentiation**

In `AgentSection.tsx`, the inline gradient style overrides CSS vars. Add subtle tone variation between agent cards:
- Levi: slightly warmer gradient (gold-tinted)
- Eve: slightly cooler gradient (silver-tinted)

Replace the inline gradient with CSS var-aware styling that differs by agent `gradientFrom` prop while respecting dark/bright mode:

```tsx
style={{
  background: `linear-gradient(135deg, var(--tile-bg) 0%, color-mix(in srgb, ${agent.gradientFrom} 8%, var(--tile-bg)) 100%)`
}}
```

**Step 2: Commit**

```bash
git add src/components/dashboard/AgentSection.tsx
git commit -m "fix(dashboard): agent cards subtle tone variation for dark mode hierarchy"
```

---

### Task 16: TASK-influence-tooltips-personalized (STUB)

**Status: NEEDS REFINEMENT (intake #15)**

**Step 1: Add TODO comment**

In `InfluenceGauges.tsx`, above the tooltip generation:
```ts
// TODO(PO-decision): Replace generic planet tooltips with user-chart-specific
// interpretations. Pending: define whether % = intensity/relevance/tension/resonance.
// See TASK-influence-tooltips-personalized in tasks.md.
```

No code change beyond the comment — this task cannot proceed without PO decision.

**Step 2: Commit** (combine with Task 17)

---

### Task 17: TASK-cosmic-values-explained (STUB)

**Status: NEEDS REFINEMENT (intake #16)**

**Step 1: Add TODO comment**

In `CosmicInfluenceSection.tsx`, above the tooltip text:
```ts
// TODO(PO-decision): Add interpretation text for geomagnetisch/Solardruck values:
// low/medium/high label + user-relevant meaning + link to Signatur impact.
// See TASK-cosmic-values-explained in tasks.md.
```

**Step 2: Commit both stubs**

```bash
git add src/components/dashboard/InfluenceGauges.tsx src/components/dashboard/CosmicInfluenceSection.tsx
git commit -m "chore(dashboard): stub TODO for tooltip personalization pending PO decision"
```

---

## Batch 6: P3 Identity Redesign (4 tasks, sequential)

### Task 18: TASK-identity-vertical-stack

**Files:**
- Modify: `src/components/dashboard/DashboardBigFour.tsx:88-110`

**Step 1: Change grid to vertical stack**

Per DEC-identity-card-accordion: replace `grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3` with vertical left-aligned stack:

```tsx
<div className="flex flex-col gap-2">
  {items.map(item => (
    <div key={item.key} className="cosmic-tile p-4 flex items-center gap-4 rounded-2xl cursor-pointer">
      <span className="text-2xl">{item.icon}</span>
      <div>
        <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--tile-text-secondary)' }}>
          {item.label}
        </p>
        <p className="text-sm font-medium" style={{ color: 'var(--tile-text-primary)' }}>
          {item.value}
        </p>
      </div>
    </div>
  ))}
</div>
```

**Step 2: Run tests**

Run: `npx vitest run src/__tests__/dashboard-sections.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/dashboard/DashboardBigFour.tsx
git commit -m "refactor(dashboard): identity cards vertical stack per DEC-identity-card-accordion"
```

---

### Task 19: TASK-identity-accordion

**Files:**
- Modify: `src/components/dashboard/DashboardBigFour.tsx`

**Step 1: Add accordion state and animation**

```tsx
const [expandedKey, setExpandedKey] = useState<string | null>(null);

// Per card:
<div
  key={item.key}
  onClick={() => setExpandedKey(prev => prev === item.key ? null : item.key)}
  className="cosmic-tile p-4 rounded-2xl cursor-pointer transition-colors"
>
  {/* ...card content... */}
  <AnimatePresence>
    {expandedKey === item.key && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.3, ease: 'easeOut' }}
        className="overflow-hidden"
      >
        <div className="pt-3 border-t border-[var(--tile-border)] mt-3">
          <p className="text-sm leading-relaxed" style={{ color: 'var(--tile-text-secondary)' }}>
            {item.accordionContent}
          </p>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
</div>
```

**Step 2: Write test**

```ts
it('single-open: expanding one card collapses another', () => {
  // Click Sun Sign → expanded
  // Click Moon Sign → Sun collapses, Moon expands
});
```

**Step 3: Run tests and commit**

```bash
git add src/components/dashboard/DashboardBigFour.tsx src/__tests__/identity-accordion.test.ts
git commit -m "feat(dashboard): identity card single-open accordion with 300ms ease-out"
```

---

### Task 20: TASK-identity-accordion-content

**Files:**
- Modify: `src/i18n/translations.ts` (add per-sign accordion texts)
- Modify: `src/components/dashboard/DashboardBigFour.tsx` (wire content)

**Step 1: Add i18n keys**

For each of the 5 identity types, add user-specific description templates:
```ts
// EN
dashboard.bigFour.sunSign.desc.aries: "As an Aries Sun, you radiate...",
// ...for all 12 sun signs, 12 moon signs, 12 ascendants, 12 animals, 5 elements
// DE equivalents
```

This is a significant content task — approximately 53 unique descriptions (12+12+12+12+5). Use existing data from `heavenlyStems.ts` identity sections where available.

**Step 2: Wire into accordion**

Map user's actual sign/animal/element to the correct i18n key:
```ts
const accordionContent = t(`dashboard.bigFour.${item.key}.desc.${item.value.toLowerCase()}`);
```

**Step 3: Commit**

```bash
git add src/i18n/translations.ts src/components/dashboard/DashboardBigFour.tsx
git commit -m "feat(dashboard): per-sign accordion content for all 5 identity cards"
```

---

### Task 21: TASK-identity-signatur-row

**Files:**
- Modify: `src/components/Dashboard.tsx:376-398`

**Step 1: Verify layout**

The current layout at line 376 is `grid grid-cols-1 md:grid-cols-[1fr_auto]` — Identity left, MiniSignature right. This should already work with the vertical stack from Task 18.

Verify that the vertical accordion (now taller) + MiniSignature (fixed 240px) still align properly at `md:` breakpoint. On mobile (`grid-cols-1`), both stack vertically — verify order is Identity first, Signatur second.

**Step 2: Commit** (only if adjustments needed)

```bash
git add src/components/Dashboard.tsx
git commit -m "fix(dashboard): identity+signatur row alignment with vertical accordion"
```

---

## Batch 7: P3 Polish (5 tasks)

### Task 22: TASK-card-titles-centered

**Files:**
- Modify: `src/components/dashboard/DashboardTagesEnergie.tsx` (header)
- Modify: `src/components/dashboard/InfluenceGauges.tsx` (header)
- Modify: `src/components/dashboard/CosmicInfluenceSection.tsx` (header)

**Step 1: Center and enlarge section titles**

For each component's `h2` header:
- Add `text-center` class
- Increase from `text-sm` to `text-base` or `text-lg`
- Ensure consistent `font-semibold tracking-wide uppercase` styling

**Step 2: Commit**

```bash
git add src/components/dashboard/DashboardTagesEnergie.tsx src/components/dashboard/InfluenceGauges.tsx src/components/dashboard/CosmicInfluenceSection.tsx
git commit -m "fix(dashboard): center and enlarge section titles for visual hierarchy"
```

---

### Task 23: TASK-agents-parent-container + TASK-agents-intro-text

**Files:**
- Modify: `src/components/Dashboard.tsx:461-480`
- Modify: `src/i18n/translations.ts`

**Step 1: Add i18n keys**

```ts
// EN
dashboard.agents.sectionTitle: "Astro-Agents",
dashboard.agents.introText: "Your personal AI agents for daily horoscope, Signatur analysis, planetary positions, cosmic weather, and fusion profile insights.",
// DE
dashboard.agents.sectionTitle: "Astro-Agenten",
dashboard.agents.introText: "Deine persoenlichen KI-Agenten fuer Tageshoroskop, Signatur-Analyse, Planetenstaende, Kosmoswetter und Fusions-Profil.",
```

**Step 2: Wrap agent grid**

```tsx
<motion.div {...fadeIn(0.4)}>
  <SectionErrorBoundary name="Agents">
    <div className="cosmic-tile p-6 rounded-[2rem]">
      <h2 className="text-base font-semibold tracking-wide uppercase text-center mb-2"
        style={{ color: 'var(--tile-text-primary)' }}>
        {t('dashboard.agents.sectionTitle')}
      </h2>
      <p className="text-xs text-center mb-6" style={{ color: 'var(--tile-text-secondary)' }}>
        {t('dashboard.agents.introText')}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {AGENTS.map(agent => (
          <AgentSection key={agent.id} agent={agent} ... />
        ))}
      </div>
    </div>
  </SectionErrorBoundary>
</motion.div>
```

**Step 3: Commit**

```bash
git add src/components/Dashboard.tsx src/i18n/translations.ts
git commit -m "feat(dashboard): Astro-Agents parent container with section title and intro"
```

---

### Task 24: TASK-card-inner-spacing

**Files:**
- Modify: Multiple component files

**Step 1: Audit and unify**

Standardize all `cosmic-tile` cards to `p-6` consistently:
- `MiniSignature.tsx`: `p-6 md:p-8` → `p-6`
- `AgentSection.tsx`: `p-6 sm:p-8` → `p-6`
- All other cosmic-tile cards should already be `p-6`

**Step 2: Commit**

```bash
git add src/components/dashboard/MiniSignature.tsx src/components/dashboard/AgentSection.tsx
git commit -m "fix(dashboard): unified p-6 inner spacing across all cosmic-tile cards"
```

---

### Task 25: TASK-signatur-tile-expandable

**Files:**
- Modify: `src/components/dashboard/MiniSignature.tsx`

**Step 1: Evaluate expand behavior**

Current: `onExpand={() => navigate('/signatur')}` — click navigates to full Signatur page with depth transition (Phase E). This is already functional and uses the Z-axis depth navigation.

Decision: Keep `navigate('/signatur')` as the expand behavior — inline expand of a WebGL canvas would be performance-wasteful and duplicative of the full Signatur page. Add a subtle visual indicator (chevron/expand icon) to signal clickability.

**Step 2: Add expand indicator**

```tsx
<div className="absolute bottom-3 right-3 text-[var(--tile-text-secondary)] opacity-40 group-hover:opacity-70 transition-opacity">
  <Maximize2 size={14} />
</div>
```

**Step 3: Commit**

```bash
git add src/components/dashboard/MiniSignature.tsx
git commit -m "feat(dashboard): MiniSignature expand indicator icon"
```

---

### Task 26: TASK-bazi-section-card-harmony

**Files:**
- Modify: `src/components/dashboard/DashboardAstroSection.tsx`

**Step 1: Harmonize card styles**

After Task 9 (TASK-astro-three-cards) extracts the three-card row, the remaining `DashboardAstroSection` content (BaZi detail, WuXing bars) should use the same `cosmic-tile` card treatment as the extracted cards. Ensure consistent `rounded-[2rem]`, `p-6`, CSS var colors.

**Step 2: Commit**

```bash
git add src/components/dashboard/DashboardAstroSection.tsx
git commit -m "fix(dashboard): BaZi/WuXing section card style harmonized with three-card row"
```

---

## Summary

| Batch | Tasks | Priority | Est. Complexity |
|-------|-------|----------|-----------------|
| 1 | Brandmark, Bright audit, MiniSignature | P1 | Low |
| 2 | Vibe fix, Sky fix, Live data fix, Fullscreen | P1 | Medium-High |
| 3 | BaZi pillars clickable | P1 | Medium |
| 4 | Three cards, Blueprint, Pulse cluster, Width, Naming | P2 | Medium |
| 5 | BaZi bright, Agents dark, 2 stubs | P2 | Low |
| 6 | Vertical stack, Accordion, Content, Row | P3 | Medium-High |
| 7 | Titles, Agents container, Spacing, Expand, Harmony | P3 | Low |

**Coverage:**
- All 21 Todo tasks addressed
- 2 tasks (influence-tooltips, cosmic-values) stubbed pending PO refinement
- Cluster K (4 reopened bugs) in Batch 2
- Cluster J (Signatur transit panels) is NOT in this plan — it requires separate REQ-F-signatur-live-transit-panels implementation plan
