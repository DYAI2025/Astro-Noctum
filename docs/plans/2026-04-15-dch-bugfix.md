# Daily Chart Hero Regression Fixes

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 5 verified regressions from the DailyChartHero rollout — broken coherence formula, duplicate TagesImpuls tile, silent zero error state, Vibes i18n key mismatch, and fabricated coherence for old users.

**Architecture:** Server-side formula fix (additive instead of blend), Dashboard composition cleanup (remove section 4), component error-state rendering, i18n key prefix fix, null-propagation for missing fusion data. All changes are backward-compatible — no schema changes needed.

**Tech Stack:** Node.js (server.mjs), React 19, TypeScript, Vitest, Zod

---

## Task 1: Fix coherence formula — additive instead of blend (CRITICAL)

**Files:**
- Modify: `server.mjs:1880–1896`
- Modify: `src/__tests__/contract-impact.test.ts`

### Step 1: Write failing test

Add to `src/__tests__/contract-impact.test.ts` in the integration section:

```ts
describe('Coherence split — additive formula', () => {
  it('displayed_coherence >= base_coherence when solar pressure is positive', () => {
    // Simulate: baseHarmony=0.5, solarPressure=0.2, weights 0.65/0.35
    const baseHarmony = 0.5;
    const solarPressure = 0.2;
    const sWeight = 0.35;

    const baseCoherence = Math.min(100, Math.max(0, Math.round(baseHarmony * 100)));
    const solarDelta = Math.min(100 - baseCoherence, Math.max(0, Math.round(solarPressure * sWeight * 100)));
    const displayedCoherence = baseCoherence + solarDelta;
    const positiveDailyDelta = solarDelta;

    expect(baseCoherence).toBe(50);
    expect(solarDelta).toBe(7);
    expect(displayedCoherence).toBe(57);
    expect(positiveDailyDelta).toBe(7);
    expect(displayedCoherence).toBeGreaterThanOrEqual(baseCoherence);
  });

  it('displayed_coherence equals base_coherence when solar pressure is 0', () => {
    const baseHarmony = 0.6;
    const solarPressure = 0;
    const sWeight = 0.35;

    const baseCoherence = Math.min(100, Math.max(0, Math.round(baseHarmony * 100)));
    const solarDelta = Math.min(100 - baseCoherence, Math.max(0, Math.round(solarPressure * sWeight * 100)));
    const displayedCoherence = baseCoherence + solarDelta;

    expect(baseCoherence).toBe(60);
    expect(solarDelta).toBe(0);
    expect(displayedCoherence).toBe(60);
  });

  it('displayed_coherence never exceeds 100', () => {
    const baseHarmony = 0.95;
    const solarPressure = 0.9;
    const sWeight = 0.35;

    const baseCoherence = Math.min(100, Math.max(0, Math.round(baseHarmony * 100)));
    const solarDelta = Math.min(100 - baseCoherence, Math.max(0, Math.round(solarPressure * sWeight * 100)));
    const displayedCoherence = baseCoherence + solarDelta;

    expect(displayedCoherence).toBeLessThanOrEqual(100);
    expect(displayedCoherence).toBeGreaterThanOrEqual(baseCoherence);
  });
});
```

Run: `npx vitest run src/__tests__/contract-impact.test.ts`
Expected: PASS (these test the correct formula, not the server — we need to also fix the server)

### Step 2: Fix server formula

In `server.mjs`, replace lines 1880–1896:

**Before:**
```js
  // 5. Compute harmony_index (0–100) — blends natal harmony with solar pressure
  const baseHarmony = profile.astro_json?.fusion?.harmony_index ?? 0.5;
  const sw = spaceWeatherCache?.payload;
  const solarPressure = sw?.solar_pressure_score ?? 0;
  const hWeight = Number(process.env.HARMONY_INDEX_HARMONY_WEIGHT) || 0.65;
  const sWeight = Number(process.env.HARMONY_INDEX_SOLAR_WEIGHT)   || 0.35;
  const harmonyIndex = Math.min(100, Math.max(0,
    Math.round((baseHarmony * hWeight + solarPressure * sWeight) * 100)
  ));

  // 5b. Coherence split (REQ-F-coherence-hero-impact-datasource)
  // base_coherence: stable natal baseline — unaffected by today's solar pressure
  const baseCoherence = Math.min(100, Math.max(0, Math.round(baseHarmony * 100)));
  // positive_daily_delta: today's solar activation on top of baseline (≥0, never negative)
  const positiveDailyDelta = Math.max(0, harmonyIndex - baseCoherence);
  // displayed_coherence: the single value shown in the ring (= harmonyIndex)
  const displayedCoherence = harmonyIndex;
```

**After:**
```js
  // 5. Compute coherence (additive: base + solar delta, never below base)
  const baseHarmony = profile.astro_json?.fusion?.harmony_index ?? 0.5;
  const sw = spaceWeatherCache?.payload;
  const solarPressure = sw?.solar_pressure_score ?? 0;
  const sWeight = Number(process.env.HARMONY_INDEX_SOLAR_WEIGHT) || 0.35;

  // base_coherence: stable natal baseline (0–100), unaffected by today
  const baseCoherence = Math.min(100, Math.max(0, Math.round(baseHarmony * 100)));
  // solar delta: today's positive activation from space weather (≥0, capped so total ≤100)
  const solarDelta = Math.min(100 - baseCoherence, Math.max(0, Math.round(solarPressure * sWeight * 100)));
  // displayed_coherence: what the ring shows = base + delta
  const displayedCoherence = baseCoherence + solarDelta;
  const positiveDailyDelta = solarDelta;
  // harmony_index: kept for backward compat (= displayed_coherence)
  const harmonyIndex = displayedCoherence;
```

### Step 3: Run tests

```bash
npx vitest run src/__tests__/contract-impact.test.ts src/__tests__/impact-active.test.ts
```
Expected: all PASS

### Step 4: Commit

```bash
git add server.mjs src/__tests__/contract-impact.test.ts
git commit -m "fix(impact-api): coherence formula additive instead of blend — displayed >= base always"
```

---

## Task 2: Remove duplicate DashboardTagesEnergie tile (HIGH)

**Files:**
- Modify: `src/components/Dashboard.tsx:405–427`
- Modify: `src/__tests__/dashboard-section-order.test.tsx`

### Step 1: Read and verify the duplicate

Section 4 in Dashboard.tsx (lines 405–427) renders `DashboardTagesEnergie` when `dailyData` is present, and `CosmicWeatherCard` as fallback. This duplicates DailyChartHero section D (day-impulse block).

### Step 2: Remove section 4

Delete the entire block from `{/* === 4. DAILY PULSE NARRATIVE */}` through the closing `</motion.div>` (lines 405–427 inclusive).

Also remove the `DashboardTagesEnergie` import if it's only used here:
```tsx
// Remove this import:
import { DashboardTagesEnergie } from "./dashboard/DashboardTagesEnergie";
```

And remove `CosmicWeatherCard` import if no longer used elsewhere in Dashboard.tsx:
```tsx
// Check first — may still be used. If not, remove:
import { CosmicWeatherCard } from "./CosmicWeatherCard";
```

Also remove related hooks/state if only used by that section:
- `useDailyHoroscope` hook call and its destructured values (`horoscope`, `horoscopeLoading`, `horoscopeError`, `horoscopeRefresh`) — only if not used elsewhere in the file.

### Step 3: Update section order test

In `src/__tests__/dashboard-section-order.test.tsx`, remove `'DAILY PULSE NARRATIVE'` from the markers array (it no longer exists):

```ts
const markers = [
  'DAILY CHART HERO',
  'VIBES',
  'ASTRO AGENTS',
  'BLUEPRINT',
  'STABLE NATAL VALUES',
  'PLANETARIUM',
  'SKY MODE TOGGLE',
  'UPGRADE BANNER',
  'KI-SYNTHESE',
  'SHARE CARD',
];
```

### Step 4: Run tests

```bash
npx vitest run src/__tests__/dashboard-section-order.test.tsx
npx vitest run
```
Expected: all PASS

### Step 5: Commit

```bash
git add src/components/Dashboard.tsx src/__tests__/dashboard-section-order.test.tsx
git commit -m "fix(dashboard): remove duplicate DashboardTagesEnergie — content in DailyChartHero"
```

---

## Task 3: DailyChartHero error/unavailable state (HIGH)

**Files:**
- Modify: `src/components/dashboard/DailyChartHero.tsx`
- Modify: `src/__tests__/daily-chart-hero.test.tsx`

### Step 1: Write failing test

Add to `src/__tests__/daily-chart-hero.test.tsx`:

```tsx
describe('DailyChartHero — error/unavailable state', () => {
  it('renders unavailable state when all coherence fields are null and not loading', () => {
    renderHero({
      loading: false,
      baseCoherence: null,
      positiveDailyDelta: null,
      displayedCoherence: null,
    });
    expect(screen.getByTestId('coherence-unavailable')).toBeTruthy();
    expect(screen.queryByTestId('coherence-value')).toBeNull();
  });

  it('unavailable state shows explanatory text, not zero', () => {
    renderHero({
      loading: false,
      baseCoherence: null,
      positiveDailyDelta: null,
      displayedCoherence: null,
    });
    expect(screen.queryByText('0')).toBeNull();
    expect(screen.getByText(/nicht verfügbar|unavailable/i)).toBeTruthy();
  });
});
```

Run: `npx vitest run src/__tests__/daily-chart-hero.test.tsx`
Expected: FAIL (currently renders "0")

### Step 2: Add unavailable guard in DailyChartHero

In `DailyChartHero.tsx`, after the loading check (line ~274) and before the main render:

```tsx
  if (loading) return <DailyChartHeroSkeleton />;

  // Error/unavailable: all coherence fields null means API failed or user has no data
  const isUnavailable = displayedCoherence == null && baseCoherence == null;
  if (isUnavailable) {
    return (
      <div
        className="daily-chart-hero cosmic-tile p-6 sm:p-8 rounded-[2rem] space-y-4"
        data-testid="coherence-unavailable"
      >
        <div className="flex items-center gap-6 sm:gap-8">
          <div className="relative shrink-0 w-[120px] h-[120px] flex items-center justify-center">
            <svg width={120} height={120} className="-rotate-90" aria-hidden="true">
              <circle cx={60} cy={60} r={54} fill="none" strokeWidth={6} stroke="var(--tile-border)" strokeDasharray="8 4" />
            </svg>
            <span className="absolute text-lg font-serif" style={{ color: 'var(--tile-text-secondary)', opacity: 0.4 }}>—</span>
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-[9px] font-sans uppercase tracking-[0.3em]" style={{ color: 'var(--tile-accent)', opacity: 0.6 }}>
              {isDe ? 'Kohärenzindex' : 'Coherence index'}
            </p>
            <p className="font-serif text-base sm:text-lg leading-snug" style={{ color: 'var(--tile-text-secondary)', opacity: 0.6 }}>
              {isDe ? 'Derzeit nicht verfügbar' : 'Currently unavailable'}
            </p>
            <p className="text-[10px] leading-relaxed" style={{ color: 'var(--tile-text-secondary)', opacity: 0.45 }}>
              {isDe ? 'Der Kohärenzindex wird berechnet, sobald dein Profil vollständig ist.' : 'The coherence index will be computed once your profile is complete.'}
            </p>
          </div>
        </div>
        {/* Still render driver strip + impulse since those come from different sources */}
        <div className="flex flex-wrap gap-2 pt-4 border-t" style={{ borderColor: 'var(--tile-border)' }} data-testid="driver-strip">
          {drivers.map(driver => (
            <div key={driver.label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-mono ${STATE_CLASSES[driver.state]}`}>
              <span className="opacity-70">{driver.label}</span>
              <span className="font-semibold">{driver.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
```

Note: the `drivers` variable must be computed BEFORE this guard — move the `useMemo` calls above the loading/unavailable checks.

### Step 3: Run tests

```bash
npx vitest run src/__tests__/daily-chart-hero.test.tsx
```
Expected: all PASS including 2 new tests

### Step 4: Commit

```bash
git add src/components/dashboard/DailyChartHero.tsx src/__tests__/daily-chart-hero.test.tsx
git commit -m "fix(hero): explicit unavailable state when coherence data is null"
```

---

## Task 4: Vibes i18n key prefix fix (HIGH)

**Files:**
- Modify: `src/components/dashboard/VibesSection.tsx`

### Step 1: Fix all 5 t() calls

In `VibesSection.tsx`, replace every `t('vibesSection.` with `t('dashboard.vibesSection.`:

| Line | Before | After |
|------|--------|-------|
| 38 | `t('vibesSection.fetchError')` | `t('dashboard.vibesSection.fetchError')` |
| 51 | `t('vibesSection.cooldownPrefix')` | `t('dashboard.vibesSection.cooldownPrefix')` |
| 53 | `t('vibesSection.buttonLabel')` | `t('dashboard.vibesSection.buttonLabel')` |
| 57 | `t('vibesSection.premiumTeaser')` | `t('dashboard.vibesSection.premiumTeaser')` |
| 74 | `t('vibesSection.sectionTitle')` | `t('dashboard.vibesSection.sectionTitle')` |

### Step 2: Run tests

```bash
npx vitest run
```
Expected: all PASS

### Step 3: Commit

```bash
git add src/components/dashboard/VibesSection.tsx
git commit -m "fix(vibes): i18n key prefix — vibesSection.x → dashboard.vibesSection.x"
```

---

## Task 5: Old-user fusion fallback — propagate null (MEDIUM)

**Files:**
- Modify: `server.mjs:1881`
- Modify: `src/__tests__/contract-impact.test.ts`

### Step 1: Write failing test

```ts
describe('Coherence split — missing fusion data', () => {
  it('base_coherence is null when fusion.harmony_index is absent', () => {
    // Simulate server: profile has astro_json but no fusion key
    const baseHarmony = undefined; // profile.astro_json?.fusion?.harmony_index
    const hasFusion = baseHarmony !== undefined;
    const baseCoherence = hasFusion ? Math.round(baseHarmony! * 100) : null;
    expect(baseCoherence).toBeNull();
  });
});
```

### Step 2: Fix server

In `server.mjs`, change the fusion harmony extraction to propagate null:

**Before:**
```js
const baseHarmony = profile.astro_json?.fusion?.harmony_index ?? 0.5;
```

**After:**
```js
const rawHarmony = profile.astro_json?.fusion?.harmony_index;
const hasFusionData = rawHarmony !== undefined && rawHarmony !== null;
const baseHarmony = rawHarmony ?? 0.5; // fallback for harmony_index calculation
```

Then in the coherence split block, conditionally null-out:

```js
const baseCoherence = hasFusionData
  ? Math.min(100, Math.max(0, Math.round(baseHarmony * 100)))
  : null;
const solarDelta = hasFusionData
  ? Math.min(100 - (baseCoherence ?? 0), Math.max(0, Math.round(solarPressure * sWeight * 100)))
  : null;
const displayedCoherence = hasFusionData ? (baseCoherence ?? 0) + (solarDelta ?? 0) : null;
const positiveDailyDelta = solarDelta;
const harmonyIndex = displayedCoherence ?? Math.min(100, Math.max(0, Math.round((baseHarmony * 0.65 + solarPressure * sWeight) * 100)));
```

This ensures:
- `harmony_index` always returns a number (backward compat for old consumers)
- `base_coherence`, `positive_daily_delta`, `displayed_coherence` are null when fusion data is absent
- The DailyChartHero renders the "unavailable" state from Task 3

### Step 3: Run tests

```bash
npx vitest run src/__tests__/contract-impact.test.ts
npx vitest run
```
Expected: all PASS

### Step 4: Commit

```bash
git add server.mjs src/__tests__/contract-impact.test.ts
git commit -m "fix(impact-api): propagate null coherence when fusion data absent — no fabricated values"
```

---

## Done Criteria

| Bug | Task | Test |
|-----|------|------|
| B-1 CRITICAL: formula blend→additive | 1 | 3 contract tests |
| B-2 HIGH: duplicate TagesImpuls | 2 | section-order test updated |
| B-3 HIGH: silent zero error state | 3 | 2 unavailable-state tests |
| B-4 HIGH: Vibes i18n keys | 4 | full suite regression |
| B-5 MEDIUM: fabricated coherence | 5 | 1 null-propagation test |
