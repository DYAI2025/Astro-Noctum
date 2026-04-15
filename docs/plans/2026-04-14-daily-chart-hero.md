# Daily Chart Hero Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace three separate volatile dashboard cards (KohaerenzHero + AktiveEinfluesseFusion + DayPulseExpanded) with one unified `DailyChartHero` component that shows coherence baseline+delta ring, driver strip, active planets with expandable "Warum?", and day-impulse text — all in a single mobile-first card.

**Architecture:** `DailyChartHero` is a pure presentational component that receives all data as props from `Dashboard.tsx`. The server's `computeActiveImpactsCore()` is extended to compute `base_coherence` / `positive_daily_delta` / `displayed_coherence` alongside the existing `harmony_index`. The schema and hook are updated to expose these fields. Dashboard wiring replaces 3 `SectionErrorBoundary` blocks with one.

**Tech Stack:** React 19, TypeScript, Tailwind v4, CSS custom properties (`--tile-*`), Vitest + Testing Library, Zod schemas, SVG rings.

---

## Context: Current State

The dashboard today renders in this order:
1. `KohaerenzHero` — ring + driver strip (uses `impactHarmonyIndex` from `useActiveImpacts`)
2. `AktiveEinfluesseFusion` — 6 planet cards (uses `impactPlanets`)
3. `DayPulseExpanded` — day mode badge + transit event text (uses `transitEvents`)

**Target:** Single `DailyChartHero` at position 1 (replacing all three), with sections:
- **A** Coherence ring (split: gold baseline arc + lighter delta overlay arc) + label
- **B** Driver strip (Kp / Solardruck / Transit-Aktivität / Tagesfeld)
- **C** Active planets — strength-sorted, each expandable to show "Warum?" explanation
- **D** Day-impulse block — mode badge + primary transit event text

## Key Files

| File | Role |
|------|------|
| `server.mjs:1880–1919` | `computeActiveImpactsCore()` — compute & return coherence fields |
| `src/lib/schemas/active-impacts.ts` | Zod schema for `ACTIVE_IMPACTS_v1` |
| `src/hooks/useActiveImpacts.ts` | Hook consuming the schema |
| `src/components/dashboard/KohaerenzHero.tsx` | To be replaced (keep file, mark deprecated) |
| `src/components/dashboard/AktiveEinfluesseFusion.tsx` | To be replaced (keep file, mark deprecated) |
| `src/components/dashboard/DayPulseExpanded.tsx` | To be replaced (keep file, mark deprecated) |
| `src/components/dashboard/DailyChartHero.tsx` | New unified component (create) |
| `src/components/Dashboard.tsx` | Wire in DailyChartHero, remove 3 blocks |
| `src/__tests__/daily-chart-hero.test.tsx` | New test file (create) |
| `src/__tests__/contract-impact.test.ts` | Update: add tests for new schema fields |

---

## Task 1: Extend `/api/impact/active` with coherence split fields

**Files:**
- Modify: `server.mjs:1880–1919` (inside `computeActiveImpactsCore`)
- Modify: `src/lib/schemas/active-impacts.ts`
- Modify: `src/hooks/useActiveImpacts.ts`
- Modify: `src/__tests__/contract-impact.test.ts`

### Step 1: Read the computation block

Open `server.mjs` at line 1880 and understand:
```js
const baseHarmony = profile.astro_json?.fusion?.harmony_index ?? 0.5;   // 0–1 natal baseline
const sw = spaceWeatherCache?.payload;
const solarPressure = sw?.solar_pressure_score ?? 0;                     // 0–1
const hWeight = 0.65;
const sWeight = 0.35;
const harmonyIndex = Math.round((baseHarmony * hWeight + solarPressure * sWeight) * 100);
```

### Step 2: Write failing contract test first

Add to `src/__tests__/contract-impact.test.ts`, inside `ActiveImpactsSchema — valid response parsing`:

```ts
it('parses base_coherence when present', () => {
  const withCoherence = {
    ...VALID_ACTIVE_IMPACTS,
    base_coherence: 65,
    positive_daily_delta: 7,
    displayed_coherence: 72,
  };
  const parsed = ActiveImpactsSchema.parse(withCoherence);
  expect(parsed.base_coherence).toBe(65);
  expect(parsed.positive_daily_delta).toBe(7);
  expect(parsed.displayed_coherence).toBe(72);
});

it('still parses when base_coherence is absent (backward compat)', () => {
  expect(() => ActiveImpactsSchema.parse(VALID_ACTIVE_IMPACTS)).not.toThrow();
});
```

Run: `npx vitest run src/__tests__/contract-impact.test.ts`
Expected: FAIL ("received undefined")

### Step 3: Update Zod schema

In `src/lib/schemas/active-impacts.ts`, add optional fields to `ActiveImpactsSchema`:

```ts
export const ActiveImpactsSchema = z.object({
  schema: z.literal('ACTIVE_IMPACTS_v1'),
  date: z.string(),
  harmony_index: z.number().min(0).max(100),
  // Coherence split fields (REQ-F-coherence-hero-impact-datasource)
  base_coherence: z.number().min(0).max(100).optional(),
  positive_daily_delta: z.number().min(0).max(100).optional(),
  displayed_coherence: z.number().min(0).max(100).optional(),
  active_planets: z.array(ActivePlanetSchema),
  resonance_badges: z.array(ResonanceBadgeSchema),
  meta: z.object({
    engine: z.string(),
    solar_pressure_source: z.string().optional(),
    cached: z.boolean().optional(),
  }),
});
```

Run: `npx vitest run src/__tests__/contract-impact.test.ts`
Expected: PASS

### Step 4: Update server.mjs to compute and return split fields

In `server.mjs`, after the `harmonyIndex` computation (line ~1888), add:

```js
// Coherence split (REQ-F-coherence-hero-impact-datasource)
// base_coherence: the stable natal baseline — unaffected by today's solar pressure
const baseCoherence = Math.min(100, Math.max(0, Math.round(baseHarmony * 100)));
// positive_daily_delta: today's solar activation on top of baseline (≥0, never negative)
const positiveDailyDelta = Math.max(0, harmonyIndex - baseCoherence);
// displayed_coherence: the single value shown in the ring (= harmonyIndex, renamed for clarity)
const displayedCoherence = harmonyIndex;
```

Then in the response object (around line 1903), add the three fields:

```js
const response = {
  schema: 'ACTIVE_IMPACTS_v1',
  date: dateStr,
  harmony_index: harmonyIndex,
  base_coherence: baseCoherence,
  positive_daily_delta: positiveDailyDelta,
  displayed_coherence: displayedCoherence,
  active_planets: activePlanets,
  resonance_badges: badges,
  meta: { ... },
};
```

### Step 5: Update hook to expose split fields

In `src/hooks/useActiveImpacts.ts`:

Add to `ActiveImpactsState` interface:
```ts
export interface ActiveImpactsState {
  harmonyIndex: number | null;
  baseCoherence: number | null;          // add
  positiveDailyDelta: number | null;     // add
  displayedCoherence: number | null;     // add
  activePlanets: ActivePlanet[];
  resonanceBadges: ResonanceBadge[];
  loading: boolean;
  error: Error | null;
}
```

Update initial state (cached path):
```ts
{
  harmonyIndex: cached?.harmony_index ?? null,
  baseCoherence: cached?.base_coherence ?? null,
  positiveDailyDelta: cached?.positive_daily_delta ?? null,
  displayedCoherence: cached?.displayed_coherence ?? null,
  ...
}
```

Update `setState` in `fetchImpacts`:
```ts
setState({
  harmonyIndex: parsed.data.harmony_index,
  baseCoherence: parsed.data.base_coherence ?? null,
  positiveDailyDelta: parsed.data.positive_daily_delta ?? null,
  displayedCoherence: parsed.data.displayed_coherence ?? null,
  ...
});
```

### Step 6: Run full test suite

```bash
npx vitest run src/__tests__/contract-impact.test.ts src/__tests__/use-active-impacts.test.ts
```
Expected: all green

### Step 7: Commit

```bash
git add server.mjs src/lib/schemas/active-impacts.ts src/hooks/useActiveImpacts.ts src/__tests__/contract-impact.test.ts
git commit -m "feat(impact-api): add base_coherence/positive_daily_delta/displayed_coherence to ACTIVE_IMPACTS_v1"
```

---

## Task 2: DailyChartHero — shell + split coherence ring

**Files:**
- Create: `src/components/dashboard/DailyChartHero.tsx`
- Create: `src/__tests__/daily-chart-hero.test.tsx`

### Step 1: Write failing test

Create `src/__tests__/daily-chart-hero.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DailyChartHero } from '../components/dashboard/DailyChartHero';
import type { ActivePlanet } from '../lib/schemas/active-impacts';
import type { SpaceWeatherState } from '../hooks/useSpaceWeather';
import type { TransitEvent } from '../lib/schemas/transit-state';

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'de', t: (k: string) => k }),
}));

const NULL_SPACE_WEATHER: SpaceWeatherState = {
  kpIndex: 0, solarPressure: 0, ringModulation: 1, intensityBoost: 0,
  gScale: 0, rawKp: 0, koronaEruption: false, loading: false, error: null,
};
const NO_PLANETS: ActivePlanet[] = [];
const NO_EVENTS: TransitEvent[] = [];

describe('DailyChartHero — skeleton', () => {
  it('renders skeleton when loading', () => {
    render(
      <DailyChartHero
        loading={true}
        baseCoherence={null}
        positiveDailyDelta={null}
        displayedCoherence={null}
        spaceWeather={NULL_SPACE_WEATHER}
        activePlanets={NO_PLANETS}
        transitEvents={NO_EVENTS}
        dayMode="pulse"
      />
    );
    expect(screen.getByTestId('daily-chart-hero-skeleton')).toBeTruthy();
  });
});

describe('DailyChartHero — coherence ring', () => {
  it('renders the displayed coherence value (0–100 integer)', () => {
    render(
      <DailyChartHero
        loading={false}
        baseCoherence={65}
        positiveDailyDelta={7}
        displayedCoherence={72}
        spaceWeather={NULL_SPACE_WEATHER}
        activePlanets={NO_PLANETS}
        transitEvents={NO_EVENTS}
        dayMode="pulse"
      />
    );
    expect(screen.getByTestId('coherence-value')).toBeTruthy();
    expect(screen.getByTestId('coherence-value').textContent).toBe('72');
  });

  it('does NOT show "Mittlere Übereinstimmung" as primary label', () => {
    render(
      <DailyChartHero
        loading={false}
        baseCoherence={40}
        positiveDailyDelta={5}
        displayedCoherence={45}
        spaceWeather={NULL_SPACE_WEATHER}
        activePlanets={NO_PLANETS}
        transitEvents={NO_EVENTS}
        dayMode="trace"
      />
    );
    expect(screen.queryByText('Mittlere Übereinstimmung')).toBeNull();
  });
});
```

Run: `npx vitest run src/__tests__/daily-chart-hero.test.tsx`
Expected: FAIL (module not found)

### Step 2: Create DailyChartHero skeleton + split ring

Create `src/components/dashboard/DailyChartHero.tsx`:

```tsx
/**
 * DailyChartHero — Unified volatile dashboard hero.
 *
 * Replaces: KohaerenzHero + AktiveEinfluesseFusion + DayPulseExpanded
 * Implements: REQ-F-daily-chart-coherence-hero, REQ-F-coherence-hero-impact-datasource,
 *             REQ-F-active-planets-frontend, REQ-USA-daily-chart-responsive-readability
 * Decision: DEC-dashboard-volatile-first (position 1 — unified hero)
 */

import { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import type { ActivePlanet } from '../../lib/schemas/active-impacts';
import type { SpaceWeatherState } from '../../hooks/useSpaceWeather';
import type { TransitEvent } from '../../lib/schemas/transit-state';

// ── Props ─────────────────────────────────────────────────────────────────────

export interface DailyChartHeroProps {
  /** True while Impact API + transit are still loading */
  loading: boolean;
  /** Stable natal baseline (0–100) — cannot be undercut by today */
  baseCoherence: number | null;
  /** Today's positive solar/transit activation on top of baseline (≥0) */
  positiveDailyDelta: number | null;
  /** Value shown in ring = baseCoherence + positiveDailyDelta (0–100) */
  displayedCoherence: number | null;
  /** Real-time space weather (Kp, solar pressure) */
  spaceWeather: SpaceWeatherState;
  /** Active transit planets from useActiveImpacts */
  activePlanets: ActivePlanet[];
  /** Transit events for day-impulse text block */
  transitEvents: TransitEvent[];
  /** 'pulse' = energetic day / 'trace' = reflective day */
  dayMode: 'pulse' | 'trace';
}

// ── Split Coherence Ring ───────────────────────────────────────────────────────
// Two SVG arcs: gold baseline + lighter delta overlay.
// Never renders "Mittlere/Hohe/Niedrige Übereinstimmung" as primary label.

function SplitCoherenceRing({
  baseCoherence,
  positiveDailyDelta,
  displayedCoherence,
  size = 120,
}: {
  baseCoherence: number;
  positiveDailyDelta: number;
  displayedCoherence: number;
  size?: number;
}) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;

  // Baseline arc — gold, solid
  const baseOffset = circumference * (1 - baseCoherence / 100);
  // Delta arc — lighter overlay, starts where baseline ends
  const deltaOffset = circumference * (1 - displayedCoherence / 100);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        {/* Track */}
        <circle cx={size / 2} cy={size / 2} r={radius}
          fill="none" strokeWidth={6} stroke="var(--tile-border)" />
        {/* Delta overlay (lighter) — full displayed value */}
        {positiveDailyDelta > 0 && (
          <circle cx={size / 2} cy={size / 2} r={radius}
            fill="none" strokeWidth={6}
            stroke="var(--tile-accent)"
            strokeDasharray={circumference}
            strokeDashoffset={deltaOffset}
            strokeLinecap="round"
            opacity={0.35}
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        )}
        {/* Baseline arc — gold, primary */}
        <circle cx={size / 2} cy={size / 2} r={radius}
          fill="none" strokeWidth={6}
          stroke="var(--tile-accent)"
          strokeDasharray={circumference}
          strokeDashoffset={baseOffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-serif text-3xl leading-none"
          style={{ color: 'var(--tile-text-primary)' }}
          data-testid="coherence-value"
        >
          {displayedCoherence}
        </span>
        {positiveDailyDelta > 0 && (
          <span
            className="text-[8px] font-mono mt-0.5"
            style={{ color: 'var(--tile-accent)', opacity: 0.7 }}
            title="Heutiger Aktivierungsbonus"
          >
            +{positiveDailyDelta}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Driver Strip ───────────────────────────────────────────────────────────────

type DriverState = 'calm' | 'active' | 'tense';

const STATE_CLASSES: Record<DriverState, string> = {
  calm:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  active: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  tense:  'bg-red-500/10 text-red-400 border-red-500/20',
};

function classifyKp(kp: number): DriverState {
  if (kp <= 2) return 'calm';
  if (kp <= 4) return 'active';
  return 'tense';
}
function classifySolarPressure(sp: number): DriverState {
  if (sp < 0.3) return 'calm';
  if (sp <= 0.6) return 'active';
  return 'tense';
}
function classifyTransitCount(n: number): DriverState {
  if (n <= 1) return 'calm';
  if (n <= 3) return 'active';
  return 'tense';
}

// ── Active Planets (collapsible Warum?) ───────────────────────────────────────

function PlanetCard({ planet, isDe }: { planet: ActivePlanet; isDe: boolean }) {
  const [open, setOpen] = useState(false);

  const strengthLabel = planet.strength >= 0.7
    ? (isDe ? 'Stark' : 'Strong')
    : planet.strength >= 0.4
      ? (isDe ? 'Mittel' : 'Moderate')
      : (isDe ? 'Gering' : 'Mild');

  const explanation = isDe
    ? `${planet.planet} bildet einen ${planet.aspect_type} (${planet.orb.toFixed(1)}°) zu deinem Natal-${planet.natal_planet}${planet.wu_xing_element ? ` — ${planet.wu_xing_element}-Feld aktiv` : ''}.`
    : `${planet.planet} forms a ${planet.aspect_type} (${planet.orb.toFixed(1)}°) to your natal ${planet.natal_planet}${planet.wu_xing_element ? ` — ${planet.wu_xing_element} field active` : ''}.`;

  return (
    <div
      className="rounded-xl border p-3 text-[11px] space-y-1.5"
      style={{ borderColor: 'var(--tile-border)', background: 'var(--tile-bg)' }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold" style={{ color: 'var(--tile-text-primary)' }}>
          {planet.planet}
        </span>
        <span
          className="text-[9px] px-1.5 py-0.5 rounded-full font-mono"
          style={{ background: 'var(--tile-glow)', color: 'var(--tile-accent)' }}
        >
          {strengthLabel}
        </span>
        <button
          className="ml-auto flex items-center gap-0.5 text-[9px] uppercase tracking-wide"
          style={{ color: 'var(--tile-accent)', opacity: 0.7 }}
          onClick={() => setOpen(v => !v)}
          aria-expanded={open}
          aria-label={isDe ? `Erklärung für ${planet.planet}` : `Explanation for ${planet.planet}`}
        >
          {isDe ? 'Warum?' : 'Why?'}
          <ChevronDown
            className="w-3 h-3 transition-transform"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </button>
      </div>
      <div className="flex items-center gap-1.5" style={{ color: 'var(--tile-text-secondary)', opacity: 0.65 }}>
        <span>{planet.aspect_type}</span>
        <span>·</span>
        <span>{isDe ? 'Natal' : 'natal'} {planet.natal_planet}</span>
      </div>
      {open && (
        <p
          className="text-[10px] leading-relaxed pt-1 border-t"
          style={{
            color: 'var(--tile-text-secondary)',
            opacity: 0.8,
            borderColor: 'var(--tile-border)',
          }}
        >
          {explanation}
        </p>
      )}
    </div>
  );
}

// ── Day-Impulse Text Block ─────────────────────────────────────────────────────

const MODE_LABEL: Record<'pulse' | 'trace', { de: string; en: string }> = {
  pulse: { de: 'Tages-Impuls', en: 'Day Pulse' },
  trace: { de: 'Tages-Spur',  en: 'Day Trace' },
};
const MODE_DESC: Record<'pulse' | 'trace', { de: string; en: string }> = {
  pulse: { de: 'Aktiver Tag — Bewegung, Sichtbarkeit, Außenwirkung.', en: 'Active day — movement, visibility, outward energy.' },
  trace: { de: 'Reflexiver Tag — nach innen horchen, Muster erkennen.', en: 'Reflective day — listen inward, recognise patterns.' },
};
const FALLBACK_DE = 'Heute keine markanten Ereignisse. Nutze die Ruhe.';
const FALLBACK_EN = 'No significant events today. Use the quiet.';

// ── Skeleton ───────────────────────────────────────────────────────────────────

function DailyChartHeroSkeleton() {
  return (
    <div
      className="cosmic-tile p-6 sm:p-8 rounded-[2rem] space-y-5 animate-pulse"
      data-testid="daily-chart-hero-skeleton"
    >
      <div className="flex items-center gap-6 sm:gap-8">
        <div className="w-[120px] h-[120px] rounded-full bg-white/5 shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-2 w-20 rounded bg-white/10" />
          <div className="h-5 w-40 rounded bg-white/10" />
          <div className="h-2 w-56 rounded bg-white/10" />
        </div>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-7 flex-1 rounded-lg bg-white/5" />)}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function DailyChartHero({
  loading,
  baseCoherence,
  positiveDailyDelta,
  displayedCoherence,
  spaceWeather,
  activePlanets,
  transitEvents,
  dayMode,
}: DailyChartHeroProps) {
  const { lang } = useLanguage();
  const isDe = lang === 'de';

  const displayed = displayedCoherence ?? (baseCoherence ?? 0);
  const base = baseCoherence ?? displayed;
  const delta = positiveDailyDelta ?? 0;

  const drivers = useMemo(() => [
    {
      label: isDe ? 'Geomagnetik' : 'Geomagnetic',
      value: `Kp ${spaceWeather.kpIndex}`,
      state: classifyKp(spaceWeather.kpIndex),
    },
    {
      label: isDe ? 'Solardruck' : 'Solar pressure',
      value: `${Math.round(spaceWeather.solarPressure * 100)}%`,
      state: classifySolarPressure(spaceWeather.solarPressure),
    },
    {
      label: isDe ? 'Transit-Aktivität' : 'Transit activity',
      value: `${transitEvents.length} ${isDe ? 'aktiv' : 'active'}`,
      state: classifyTransitCount(transitEvents.length),
    },
    {
      label: isDe ? 'Tagesfeld' : 'Day field',
      value: dayMode === 'pulse' ? (isDe ? 'Impuls' : 'Pulse') : (isDe ? 'Spur' : 'Trace'),
      state: dayMode === 'pulse' ? 'calm' as DriverState : 'active' as DriverState,
    },
  ], [spaceWeather, transitEvents.length, dayMode, isDe]);

  const sortedPlanets = useMemo(
    () => [...activePlanets].sort((a, b) => b.strength - a.strength),
    [activePlanets],
  );

  const primaryEvent = useMemo(
    () => [...transitEvents].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0],
    [transitEvents],
  );

  if (loading) return <DailyChartHeroSkeleton />;

  const modeLabel = isDe ? MODE_LABEL[dayMode].de : MODE_LABEL[dayMode].en;
  const modeDesc  = isDe ? MODE_DESC[dayMode].de  : MODE_DESC[dayMode].en;
  const accentColor = dayMode === 'pulse' ? '#D4AF37' : '#9B8EC4';
  const hasEventText = (primaryEvent?.description_de ?? '').length > 0;

  return (
    <div
      className="daily-chart-hero cosmic-tile p-6 sm:p-8 rounded-[2rem] space-y-5"
      data-testid="daily-chart-hero"
    >
      {/* ── A. Coherence Ring + Label ─────────────────────────────────── */}
      <div className="flex items-center gap-6 sm:gap-8">
        <SplitCoherenceRing
          baseCoherence={base}
          positiveDailyDelta={delta}
          displayedCoherence={displayed}
        />
        <div className="flex-1 min-w-0 space-y-1">
          <p
            className="text-[9px] font-sans uppercase tracking-[0.3em]"
            style={{ color: 'var(--tile-accent)', opacity: 0.6 }}
          >
            {isDe ? 'Kohärenzindex' : 'Coherence index'}
          </p>
          <p
            className="font-serif text-base sm:text-lg leading-snug"
            style={{ color: 'var(--tile-text-primary)' }}
            data-testid="coherence-baseline-label"
          >
            {isDe
              ? `Basis ${base} · Heute +${delta}`
              : `Base ${base} · Today +${delta}`}
          </p>
          <p
            className="text-[10px] leading-relaxed"
            style={{ color: 'var(--tile-text-secondary)', opacity: 0.65 }}
          >
            {isDe
              ? 'Dein persönlicher Grundwert, heute durch kosmische Aktivierung erhöht.'
              : 'Your personal baseline, elevated by today\'s cosmic activation.'}
          </p>
        </div>
      </div>

      {/* ── B. Driver Strip ───────────────────────────────────────────── */}
      <div
        className="flex flex-wrap gap-2 pt-4 border-t"
        style={{ borderColor: 'var(--tile-border)' }}
      >
        {drivers.map(driver => (
          <div
            key={driver.label}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-mono ${STATE_CLASSES[driver.state]}`}
          >
            <span className="opacity-70">{driver.label}</span>
            <span className="font-semibold">{driver.value}</span>
          </div>
        ))}
      </div>

      {/* ── C. Active Planets ─────────────────────────────────────────── */}
      {sortedPlanets.length > 0 && (
        <div
          className="space-y-2 pt-4 border-t"
          style={{ borderColor: 'var(--tile-border)' }}
        >
          <p
            className="text-[9px] font-bold uppercase tracking-[0.2em]"
            style={{ color: 'var(--tile-text-secondary)', opacity: 0.5 }}
          >
            {isDe ? 'Aktive Planeten' : 'Active planets'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sortedPlanets.map(planet => (
              <PlanetCard key={`${planet.planet}-${planet.natal_planet}`} planet={planet} isDe={isDe} />
            ))}
          </div>
        </div>
      )}

      {/* ── D. Day-Impulse Block ──────────────────────────────────────── */}
      <div
        className="space-y-2 pt-4 border-t"
        style={{ borderColor: 'var(--tile-border)' }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-[9px] font-bold tracking-[0.25em] uppercase px-2 py-0.5 rounded-full"
            style={{ background: `${accentColor}22`, color: accentColor }}
          >
            {modeLabel}
          </span>
        </div>
        <p
          className="text-[11px] leading-relaxed"
          style={{ color: 'var(--tile-text-secondary)', opacity: 0.7 }}
        >
          {modeDesc}
        </p>
        {hasEventText ? (
          <div className="space-y-1">
            <p className="text-sm leading-relaxed" style={{ color: 'var(--tile-text-primary)' }}>
              {primaryEvent!.description_de}
            </p>
            {(primaryEvent?.personal_context ?? '').length > 0 && (
              <p className="text-xs leading-relaxed italic" style={{ color: 'var(--tile-text-secondary)', opacity: 0.75 }}>
                {primaryEvent!.personal_context}
              </p>
            )}
          </div>
        ) : (
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'var(--tile-text-secondary)', opacity: 0.6 }}
            data-testid="impulse-fallback"
          >
            {isDe ? FALLBACK_DE : FALLBACK_EN}
          </p>
        )}
        {primaryEvent?.trigger_planet && (
          <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--tile-text-secondary)', opacity: 0.5 }}>
            {primaryEvent.trigger_symbol && <span aria-hidden="true">{primaryEvent.trigger_symbol}</span>}
            <span>{primaryEvent.trigger_planet}</span>
            {primaryEvent.sector_domain && <span>· {primaryEvent.sector_domain}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
```

### Step 3: Run tests

```bash
npx vitest run src/__tests__/daily-chart-hero.test.tsx
```
Expected: PASS

### Step 4: Expand tests to cover driver strip and planets

Add to `src/__tests__/daily-chart-hero.test.tsx`:

```tsx
const MOCK_PLANET: ActivePlanet = {
  planet: 'Mars',
  strength: 0.8,
  aspect_type: 'Quadrat',
  orb: 2.5,
  natal_planet: 'Venus',
  bazi_resonance: 'kontrolle',
  wu_xing_element: 'fire',
};

describe('DailyChartHero — driver strip', () => {
  it('renders Geomagnetik driver', () => {
    render(
      <DailyChartHero
        loading={false}
        baseCoherence={65} positiveDailyDelta={7} displayedCoherence={72}
        spaceWeather={{ ...NULL_SPACE_WEATHER, kpIndex: 3 }}
        activePlanets={NO_PLANETS} transitEvents={NO_EVENTS} dayMode="pulse"
      />
    );
    expect(screen.getByText('Kp 3')).toBeTruthy();
  });
});

describe('DailyChartHero — active planets', () => {
  it('renders planet name', () => {
    render(
      <DailyChartHero
        loading={false}
        baseCoherence={65} positiveDailyDelta={7} displayedCoherence={72}
        spaceWeather={NULL_SPACE_WEATHER}
        activePlanets={[MOCK_PLANET]} transitEvents={NO_EVENTS} dayMode="pulse"
      />
    );
    expect(screen.getByText('Mars')).toBeTruthy();
  });

  it('shows Warum? button', () => {
    render(
      <DailyChartHero
        loading={false}
        baseCoherence={65} positiveDailyDelta={7} displayedCoherence={72}
        spaceWeather={NULL_SPACE_WEATHER}
        activePlanets={[MOCK_PLANET]} transitEvents={NO_EVENTS} dayMode="pulse"
      />
    );
    expect(screen.getByRole('button', { name: /Erklärung für Mars/i })).toBeTruthy();
  });
});

describe('DailyChartHero — impulse fallback', () => {
  it('shows fallback when no transit event text', () => {
    render(
      <DailyChartHero
        loading={false}
        baseCoherence={65} positiveDailyDelta={7} displayedCoherence={72}
        spaceWeather={NULL_SPACE_WEATHER}
        activePlanets={NO_PLANETS} transitEvents={NO_EVENTS} dayMode="pulse"
      />
    );
    expect(screen.getByTestId('impulse-fallback')).toBeTruthy();
  });
});
```

Run: `npx vitest run src/__tests__/daily-chart-hero.test.tsx`
Expected: all PASS

### Step 5: Commit

```bash
git add src/components/dashboard/DailyChartHero.tsx src/__tests__/daily-chart-hero.test.tsx
git commit -m "feat(dashboard): DailyChartHero — split ring + driver strip + planets + impulse"
```

---

## Task 3: Dashboard wiring — replace 3 cards with DailyChartHero

**Files:**
- Modify: `src/components/Dashboard.tsx`

### Step 1: Read current Dashboard imports and the three volatile blocks

Open `src/components/Dashboard.tsx`. The relevant section is around lines 38–40 (imports) and 384–422 (the three SectionErrorBoundary blocks).

### Step 2: Add DailyChartHero import

In `Dashboard.tsx`, after line 51 (`import { KohaerenzHero }`), add:
```tsx
import { DailyChartHero } from "./dashboard/DailyChartHero";
```

### Step 3: Expose new hook fields

On line 283:
```tsx
// Before:
const { harmonyIndex: impactHarmonyIndex, activePlanets: impactPlanets, loading: impactLoading } = useActiveImpacts();

// After:
const {
  harmonyIndex: impactHarmonyIndex,
  baseCoherence: impactBaseCoherence,
  positiveDailyDelta: impactPositiveDailyDelta,
  displayedCoherence: impactDisplayedCoherence,
  activePlanets: impactPlanets,
  loading: impactLoading,
} = useActiveImpacts();
```

### Step 4: Replace the three volatile blocks

Replace blocks 1–3 (lines ~384–422) with a single DailyChartHero block:

```tsx
{/* ═══ 1. DAILY CHART HERO (unified volatile hero) ═══════════════ */}
<motion.div {...fadeIn(0.02)}>
  <SectionErrorBoundary name="DailyChartHero">
    <DailyChartHero
      loading={(metaLoading || transitLoading) && !impactHarmonyIndex}
      baseCoherence={impactBaseCoherence}
      positiveDailyDelta={impactPositiveDailyDelta}
      displayedCoherence={impactDisplayedCoherence}
      spaceWeather={spaceWeather}
      activePlanets={impactPlanets}
      transitEvents={transitEvents}
      dayMode={dailyData?.fusion?.day_mode ?? 'pulse'}
    />
  </SectionErrorBoundary>
</motion.div>
```

Remove (or comment with `{/* REPLACED by DailyChartHero */}`) the old blocks for:
- `SectionErrorBoundary name="CoherenceHero"` (KohaerenzHero)
- `SectionErrorBoundary name="AktiveEinfluesseFusion"`
- `SectionErrorBoundary name="DayPulseExpanded"`

Keep the sentinel divs in the same position so tour/scroll anchors are not broken.

### Step 5: Run full test suite

```bash
npx vitest run
```
Expected: all green (or only the known-flaky signatur-v3-performance timing test under load)

### Step 6: TypeScript check

```bash
npx tsc --noEmit
```
Expected: clean (no new errors)

### Step 7: Commit

```bash
git add src/components/Dashboard.tsx
git commit -m "feat(dashboard): wire DailyChartHero — replace KohaerenzHero+AktiveEinfluesse+DayPulse"
```

---

## Task 4: Dark-mode white-card contrast fix

This is the pre-existing regression where some cards render white background + white text in dark mode (Planetarium). The unified hero is built with CSS vars throughout — this task ensures legacy cards that remain (DashboardTagesEnergie, BlueprintReveal, NatalSignaturStatic) also use vars correctly.

**Files:**
- Modify: whichever tiles still use hardcoded `bg-white` or `text-white` — check with grep first

### Step 1: Identify offending cards

```bash
grep -rn "bg-white\b\|text-white\b" src/components/dashboard/ src/components/Dashboard.tsx
```

Expected output: a list of files/lines with hardcoded white

### Step 2: For each occurrence — check if it's mode-aware

A hardcoded `bg-white` in a `.cosmic-tile` context is a bug. Replace with CSS var equivalents:
- `bg-white` → use `var(--tile-bg)` via inline style or a Tailwind arbitrary value
- `text-white` → `var(--tile-text-primary)`
- `bg-white/60` → `var(--tile-bg)` (already fixed in DAUP-04 for CosmicWeatherCard — verify it's still clean)

### Step 3: Run visual check (dev server)

```bash
npm run dev
```
Open http://localhost:3000, toggle between Planetarium and Solar System. Confirm no white-on-white.

### Step 4: Write regression test

Add to `src/__tests__/daily-chart-hero.test.tsx`:

```tsx
describe('DailyChartHero — CSS var compliance', () => {
  it('does NOT contain hardcoded bg-white class', () => {
    // Check that the component source has no bg-white class
    const fs = await import('fs');
    const src = fs.readFileSync('src/components/dashboard/DailyChartHero.tsx', 'utf8');
    expect(src).not.toMatch(/className=["'][^"']*bg-white[^/]/);
  });
});
```

Run: `npx vitest run src/__tests__/daily-chart-hero.test.tsx`
Expected: PASS

### Step 5: Commit

```bash
git add src/components/dashboard/
git commit -m "fix(theme): remove hardcoded bg-white/text-white in dark-mode dashboard tiles"
```

---

## Task 5: Update SDLC task tracker + CHANGELOG

### Step 1: Add new sprint to tasks.md

In `3-code/tasks.md`, under the end of the last completed sprint, add a new sprint section `S-DAILY-CHART-HERO` and mark all 4 tasks Done.

### Step 2: Update CHANGELOG.md

Add today's entry:

```markdown
## 2026-04-14 — Sprint S-DAILY-CHART-HERO

### Features
- Unified `DailyChartHero` component: replaces KohaerenzHero + AktiveEinfluesseFusion + DayPulseExpanded
- Split coherence ring: baseline arc (gold) + positive daily delta overlay
- Active planets with collapsible "Warum?" explanation per planet
- `/api/impact/active` extended with `base_coherence`, `positive_daily_delta`, `displayed_coherence`

### Bug Fixes
- Dark-mode white-card contrast regression fixed across dashboard tiles
```

### Step 3: Update CLAUDE.md current state

In `CLAUDE.md` under `### Current State`, update the implementation progress line to reflect the new tasks.

### Step 4: Commit

```bash
git add 3-code/tasks.md CHANGELOG.md CLAUDE.md
git commit -m "docs: mark S-DAILY-CHART-HERO complete, update CHANGELOG"
```

---

## Done Criteria (maps to requirement ACs)

| AC | Source | Verified by |
|----|--------|-------------|
| Payload exposes `base_coherence`, `positive_daily_delta`, `displayed_coherence` | REQ-F-coherence-hero-impact-datasource | contract-impact.test.ts |
| Delta arc visually distinguished from baseline arc | REQ-F-coherence-hero-impact-datasource | manual + visual |
| No "Mittlere Übereinstimmung" as primary label | REQ-F-daily-chart-coherence-hero | daily-chart-hero.test.tsx |
| Driver strip shows Kp, Solardruck, Transit, Tagesfeld | REQ-F-coherence-hero-impact-datasource | daily-chart-hero.test.tsx |
| Each active planet has expandable "Warum?" button | REQ-F-active-planets-frontend | daily-chart-hero.test.tsx |
| Skeleton shown while loading | REQ-F-daily-chart-coherence-hero | daily-chart-hero.test.tsx |
| DailyChartHero is first section after page header | REQ-F-daily-chart-coherence-hero | Dashboard.tsx structure |
| Dark/Bright mode — no hardcoded white | REQ-USA-wcag-contrast | grep + manual |
