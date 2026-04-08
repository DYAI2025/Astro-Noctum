# Dashboard Live Components Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build three new Dashboard components — `DayPulseExpanded`, `AktiveEinfluesseFusion`, and `MagnetsturmKarte` — that replace static placeholders with live BAFE-backed content.

**Architecture:** Each component is a pure presentational leaf that receives pre-fetched data via props (passed from Dashboard, which already owns the hooks). `DayPulseExpanded` renders transit events verbatim from the existing `useFusionSignal` pipeline. `AktiveEinfluesseFusion` renders 6 planet cards using `useDailyTransit` (new) + `calculatePlanetBaziResonance` (new). `MagnetsturmKarte` renders conditionally from the existing `useSpaceWeather` hook.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Vitest + @testing-library/react, existing Lucide icons

**Pre-conditions (must be done before this plan):**
- `src/lib/fusion-bazi/resonance.ts` exists (TASK-fusion-bazi-resonance-module)
- `src/hooks/useDailyTransit.ts` exists (TASK-daily-transit-hook)
- Both are tested and green

---

## Codebase conventions to know before you start

- Path alias `@/` maps to **project root** (not `src/`) — so `@/src/hooks/useSpaceWeather` is correct
- CSS variables for colors: `var(--tile-bg)`, `var(--tile-border)`, `var(--tile-text-primary)`, `var(--tile-text-secondary)`, `var(--element-accent)` — use these instead of raw Tailwind color classes for dark/light mode compat
- Wu-Xing element CSS vars: `--color-element-fire: #C53030`, `--color-element-water: #2B6CB0`, `--color-element-wood: #3D8B37`, `--color-element-earth: #D69E2E`, `--color-element-metal: #718096`
- Glass card pattern: `className="rounded-xl border p-4"` with inline `style={{ background: 'var(--tile-bg)', borderColor: 'var(--tile-border)' }}`
- Test mocks: always mock `'../contexts/LanguageContext'` with `{ useLanguage: () => ({ t: (k: string) => k }) }` and `'../contexts/AuthContext'` with `{ useAuth: () => ({ isPremium: false }) }`
- Brand voice: "Du" address, no "Horoskop", "Schicksal", "enthuellen". No emojis in component text copy.
- Every rendered number must have a source comment directly above the JSX line: `{/* Source: useSpaceWeather().kpIndex */}`
- `TransitEvent` type is imported from `'@/src/lib/schemas/transit-state'`
- `SpaceWeatherState` type is imported from `'@/src/hooks/useSpaceWeather'`

---

## Task 8: DayPulseExpanded

**Files:**
- Create: `src/components/dashboard/DayPulseExpanded.tsx`
- Create: `src/__tests__/day-pulse-expanded.test.tsx`

### Context

`useFusionSignal(userId)` returns `events: TransitEvent[]`. Each event has:
- `description_de: string` — BAFE-generated German text (≤500 chars), render verbatim
- `personal_context: string` — personalized German context, render verbatim
- `type: 'resonance_jump' | 'moon_event'`
- `priority: number`

The component shows `events[0]` (highest-priority event). If `events` is empty, show the fallback sentence.

### Step 1: Write the failing test

Create `src/__tests__/day-pulse-expanded.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DayPulseExpanded } from '../components/dashboard/DayPulseExpanded';
import type { TransitEvent } from '../lib/schemas/transit-state';

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (k: string) => k }),
}));

const MOCK_EVENT: TransitEvent = {
  type: 'resonance_jump',
  priority: 80,
  sector: 3,
  trigger_planet: 'Mars',
  description_de: 'Mars zieht durch deinen Feuersektor. Heute ist Präzision gefragt.',
  personal_context: 'Dein Tagmeister Geng empfängt Verstärkung. Nutze die Schärfe.',
};

describe('DayPulseExpanded', () => {
  it('renders description_de verbatim from first event', () => {
    render(<DayPulseExpanded events={[MOCK_EVENT]} loading={false} />);
    expect(screen.getByText('Mars zieht durch deinen Feuersektor. Heute ist Präzision gefragt.')).toBeInTheDocument();
  });

  it('renders personal_context verbatim from first event', () => {
    render(<DayPulseExpanded events={[MOCK_EVENT]} loading={false} />);
    expect(screen.getByText('Dein Tagmeister Geng empfängt Verstärkung. Nutze die Schärfe.')).toBeInTheDocument();
  });

  it('shows fallback when events array is empty', () => {
    render(<DayPulseExpanded events={[]} loading={false} />);
    expect(screen.getByText('Heute keine markanten Ereignisse. Nutze die Ruhe.')).toBeInTheDocument();
  });

  it('shows skeleton when loading', () => {
    render(<DayPulseExpanded events={[]} loading={true} />);
    expect(screen.getByTestId('day-pulse-skeleton')).toBeInTheDocument();
  });

  it('does not render an accordion or collapse control', () => {
    render(<DayPulseExpanded events={[MOCK_EVENT]} loading={false} />);
    expect(screen.queryByRole('button', { name: /expand|collapse|mehr/i })).not.toBeInTheDocument();
  });
});
```

### Step 2: Run to verify it fails

```bash
npx vitest run src/__tests__/day-pulse-expanded.test.tsx
```

Expected: **5 FAIL** — component doesn't exist yet.

### Step 3: Implement DayPulseExpanded

Create `src/components/dashboard/DayPulseExpanded.tsx`:

```tsx
/**
 * DayPulseExpanded — First-fold Dashboard section
 *
 * Always visible, always fully expanded. No accordion, no collapse.
 * Shows today's top transit event from BAFE /api/transit-state pipeline.
 * Text is rendered verbatim — not rewritten by the client.
 *
 * Implements: REQ-F-dashboard-live-daily-signals
 * Decision: DEC-dashboard-volatile-first
 */

import type { TransitEvent } from '@/src/lib/schemas/transit-state';

interface DayPulseExpandedProps {
  events: TransitEvent[];
  loading: boolean;
}

/** Format today's date in German: "8. April 2026" */
function formatDateDE(date: Date): string {
  return date.toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function DayPulseExpanded({ events, loading }: DayPulseExpandedProps) {
  const today = formatDateDE(new Date());

  if (loading) {
    return (
      <div
        data-testid="day-pulse-skeleton"
        className="rounded-xl border p-5 space-y-3 animate-pulse"
        style={{ background: 'var(--tile-bg)', borderColor: 'var(--tile-border)' }}
      >
        <div className="h-3 w-32 rounded" style={{ background: 'var(--tile-text-secondary)', opacity: 0.3 }} />
        <div className="h-4 w-full rounded" style={{ background: 'var(--tile-text-secondary)', opacity: 0.2 }} />
        <div className="h-4 w-3/4 rounded" style={{ background: 'var(--tile-text-secondary)', opacity: 0.2 }} />
      </div>
    );
  }

  // Source: useFusionSignal(userId).events — populated from /api/transit-state, events[].description_de
  const topEvent = events[0] ?? null;

  return (
    <section
      className="rounded-xl border p-5 space-y-4"
      style={{ background: 'var(--tile-bg)', borderColor: 'var(--tile-border)' }}
      aria-label="Heutige Impulse"
    >
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <span
          className="text-[10px] font-sans font-bold uppercase tracking-[0.2em]"
          style={{ color: 'var(--tile-text-secondary)' }}
        >
          Tagesimpuls
        </span>
        <span
          className="text-[11px] font-mono"
          style={{ color: 'var(--tile-text-secondary)' }}
        >
          {today}
        </span>
      </div>

      {topEvent ? (
        <div className="space-y-3">
          {/* Source: /api/transit-state → events[0].description_de — verbatim BAFE text */}
          <p
            className="font-serif text-base leading-relaxed"
            style={{ color: 'var(--tile-text-primary)' }}
          >
            {topEvent.description_de}
          </p>

          {topEvent.personal_context && (
            /* Source: /api/transit-state → events[0].personal_context — verbatim BAFE text */
            <p
              className="font-serif text-sm italic leading-relaxed"
              style={{ color: 'var(--tile-text-secondary)' }}
            >
              {topEvent.personal_context}
            </p>
          )}
        </div>
      ) : (
        <p
          className="font-serif text-sm italic"
          style={{ color: 'var(--tile-text-secondary)' }}
        >
          Heute keine markanten Ereignisse. Nutze die Ruhe.
        </p>
      )}
    </section>
  );
}
```

### Step 4: Run tests

```bash
npx vitest run src/__tests__/day-pulse-expanded.test.tsx
```

Expected: **5 PASS**.

### Step 5: Run full suite to check for regressions

```bash
npm run test
```

Expected: all previously passing tests still pass.

### Step 6: Commit

```bash
git add src/components/dashboard/DayPulseExpanded.tsx src/__tests__/day-pulse-expanded.test.tsx
git commit -m "feat(TASK-day-pulse-expanded): DayPulseExpanded — always-open transit event section (BUG-23-follow)"
```

---

## Task 9: AktiveEinfluesseFusion

**Files:**
- Create: `src/components/dashboard/AktiveEinfluesseFusion.tsx`
- Create: `src/__tests__/aktive-einfluesse-fusion.test.tsx`

### Context

**Pre-conditions:** `src/lib/fusion-bazi/resonance.ts` and `src/hooks/useDailyTransit.ts` must exist.

`useDailyTransit()` returns:
```typescript
{
  bodies: Record<string, BafeWesternBody> | null;
  loading: boolean;
  error: Error | null;
}
```

`BafeWesternBody` has:
- `degree_in_sign?: number | null` — degree within sign (0–30)
- `zodiac_sign?: number | null` — 0-based index (0=Aries…11=Pisces)
- `is_retrograde?: boolean`
- `speed?: number | null`

`calculatePlanetBaziResonance(planet: PlanetName, dayMaster: HeavenlyStem)` returns:
```typescript
{
  type: 'gleichklang' | 'naehrung' | 'kontrolle' | 'neutral';
  intensity: number;  // 0-1
  planetElement: WuXingElement;  // 'wood' | 'fire' | 'earth' | 'metal' | 'water'
  dayMasterElement: WuXingElement;
  quote: string;  // German, brand-voice compliant
}
```

The 6 planets to display (German names, matching PLANET_ELEMENT keys):
`['Sonne', 'Mond', 'Merkur', 'Venus', 'Mars', 'Jupiter', 'Saturn']` — pick the 6 non-Sonne ones for visual density: `['Mond', 'Merkur', 'Venus', 'Mars', 'Jupiter', 'Saturn']`.

Zodiac sign names (0-based): `['Widder', 'Stier', 'Zwillinge', 'Krebs', 'Löwe', 'Jungfrau', 'Waage', 'Skorpion', 'Schütze', 'Steinbock', 'Wassermann', 'Fische']`

Wu-Xing element names in German: `{ wood: 'Holz', fire: 'Feuer', earth: 'Erde', metal: 'Metall', water: 'Wasser' }`

Wu-Xing element CSS vars: use `--color-element-{wood|fire|earth|metal|water}` for the left accent stripe.

The `dayMaster` comes from `apiData?.bazi?.day_master` (string like `"Jia"`, `"Yi"`, `"Geng"`, etc.).

The component calls `useDailyTransit()` internally. It receives `dayMasterStem` and `loading` as props from Dashboard.

### Step 1: Write the failing test

Create `src/__tests__/aktive-einfluesse-fusion.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AktiveEinfluesseFusion } from '../components/dashboard/AktiveEinfluesseFusion';
import type { BafeWesternBody } from '../types/bafe';

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (k: string) => k }),
}));

// Mock useDailyTransit to return controlled data
vi.mock('../hooks/useDailyTransit', () => ({
  useDailyTransit: vi.fn(),
}));

// Mock resonance module
vi.mock('../lib/fusion-bazi/resonance', () => ({
  calculatePlanetBaziResonance: vi.fn().mockReturnValue({
    type: 'naehrung',
    intensity: 0.75,
    planetElement: 'fire',
    dayMasterElement: 'metal',
    quote: 'Mars naehrt dich. Annehmen, nicht kaempfen.',
  }),
}));

const MOCK_BODIES: Record<string, BafeWesternBody> = {
  Mond:    { degree_in_sign: 22, zodiac_sign: 4, is_retrograde: false, speed: 13.5 },
  Merkur:  { degree_in_sign: 8,  zodiac_sign: 11, is_retrograde: true,  speed: -0.5 },
  Venus:   { degree_in_sign: 11, zodiac_sign: 1,  is_retrograde: false, speed: 1.2 },
  Mars:    { degree_in_sign: 23, zodiac_sign: 0,  is_retrograde: false, speed: 0.7 },
  Jupiter: { degree_in_sign: 17, zodiac_sign: 1,  is_retrograde: false, speed: 0.1 },
  Saturn:  { degree_in_sign: 4,  zodiac_sign: 11, is_retrograde: false, speed: 0.05 },
};

describe('AktiveEinfluesseFusion', () => {
  beforeEach(() => {
    const { useDailyTransit } = vi.mocked(await import('../hooks/useDailyTransit'));
    useDailyTransit.mockReturnValue({ bodies: MOCK_BODIES, loading: false, error: null });
  });

  it('renders 6 planet cards', () => {
    render(<AktiveEinfluesseFusion dayMasterStem="Geng" />);
    // Each card has a planet name heading
    expect(screen.getByText('Mond')).toBeInTheDocument();
    expect(screen.getByText('Merkur')).toBeInTheDocument();
    expect(screen.getByText('Venus')).toBeInTheDocument();
    expect(screen.getByText('Mars')).toBeInTheDocument();
    expect(screen.getByText('Jupiter')).toBeInTheDocument();
    expect(screen.getByText('Saturn')).toBeInTheDocument();
  });

  it('shows degree and sign for a planet', () => {
    render(<AktiveEinfluesseFusion dayMasterStem="Geng" />);
    // Mars: 23° Widder (zodiac_sign 0 = Widder)
    expect(screen.getByText(/23°.*Widder/)).toBeInTheDocument();
  });

  it('shows retrograde indicator for retrograde planet', () => {
    render(<AktiveEinfluesseFusion dayMasterStem="Geng" />);
    // Merkur is retrograde
    const merkurCard = screen.getByTestId('planet-card-Merkur');
    expect(merkurCard).toHaveTextContent('R');
  });

  it('shows German resonance quote from BaZi block', () => {
    render(<AktiveEinfluesseFusion dayMasterStem="Geng" />);
    // Mock returns same quote for all planets
    expect(screen.getAllByText('Mars naehrt dich. Annehmen, nicht kaempfen.').length).toBeGreaterThan(0);
  });

  it('shows skeleton when loading', () => {
    const { useDailyTransit } = vi.mocked(await import('../hooks/useDailyTransit'));
    useDailyTransit.mockReturnValue({ bodies: null, loading: true, error: null });

    render(<AktiveEinfluesseFusion dayMasterStem="Geng" />);
    expect(screen.getByTestId('aktive-einfluesse-skeleton')).toBeInTheDocument();
  });

  it('shows BaZi unavailable notice when dayMasterStem is missing', () => {
    render(<AktiveEinfluesseFusion dayMasterStem={undefined} />);
    expect(screen.getAllByText('BaZi-Profil nicht verfügbar').length).toBeGreaterThan(0);
  });
});
```

**Note on async mock:** Replace the `beforeEach` with a top-level import if dynamic import causes issues. Alternative:

```tsx
import { useDailyTransit } from '../hooks/useDailyTransit';
// then in beforeEach:
(useDailyTransit as ReturnType<typeof vi.fn>).mockReturnValue({...});
```

### Step 2: Run to verify it fails

```bash
npx vitest run src/__tests__/aktive-einfluesse-fusion.test.tsx
```

Expected: **FAIL** — component doesn't exist.

### Step 3: Implement AktiveEinfluesseFusion

Create `src/components/dashboard/AktiveEinfluesseFusion.tsx`:

```tsx
/**
 * AktiveEinfluesseFusion — Live planet cards with Western + BaZi fusion
 *
 * Each card shows:
 * - Western block: degree, sign, retrograde indicator, live speed context
 * - BaZi block: Wu-Xing element, Sheng/Ke resonance type badge, German quote
 *
 * Every rendered number has a source comment.
 * No hardcoded values — all from useDailyTransit() or calculatePlanetBaziResonance().
 *
 * Implements: REQ-F-dashboard-bazi-fusion-bridge, REQ-F-dashboard-live-daily-signals
 * Decisions: DEC-fusion-bazi-sheng-ke, DEC-no-number-without-explanation
 */

import { useDailyTransit } from '@/src/hooks/useDailyTransit';
import {
  calculatePlanetBaziResonance,
  type PlanetName,
  type WuXingElement,
} from '@/src/lib/fusion-bazi/resonance';
import type { BafeWesternBody } from '@/src/types/bafe';

// ── Constants ─────────────────────────────────────────────────────────────────

// DEC-fusion-bazi-sheng-ke: planet display order (Sonne omitted for visual density)
const PLANETS: PlanetName[] = ['Mond', 'Merkur', 'Venus', 'Mars', 'Jupiter', 'Saturn'];

// Zodiac sign names DE (0-based, 0=Widder)
const SIGNS_DE = [
  'Widder', 'Stier', 'Zwillinge', 'Krebs', 'Löwe', 'Jungfrau',
  'Waage', 'Skorpion', 'Schütze', 'Steinbock', 'Wassermann', 'Fische',
];

// Wu-Xing element names DE
const ELEMENT_DE: Record<WuXingElement, string> = {
  wood: 'Holz', fire: 'Feuer', earth: 'Erde', metal: 'Metall', water: 'Wasser',
};

// Wu-Xing element CSS var names (defined in index.css @theme)
const ELEMENT_CSS_VAR: Record<WuXingElement, string> = {
  wood:  'var(--color-element-wood)',
  fire:  'var(--color-element-fire)',
  earth: 'var(--color-element-earth)',
  metal: 'var(--color-element-metal)',
  water: 'var(--color-element-water)',
};

// Resonance type badge labels DE
const RESONANCE_LABEL: Record<string, string> = {
  gleichklang: 'Gleichklang',
  naehrung:    'Nährung',
  kontrolle:   'Kontrolle',
  neutral:     'Neutral',
};

// ── Sub-components ────────────────────────────────────────────────────────────

interface PlanetCardProps {
  planet: PlanetName;
  body: BafeWesternBody | undefined;
  dayMasterStem: string | undefined;
}

function PlanetCard({ planet, body, dayMasterStem }: PlanetCardProps) {
  // Source: useDailyTransit() → bodies[planet].degree_in_sign
  const degree = body?.degree_in_sign != null ? Math.round(body.degree_in_sign) : null;
  // Source: useDailyTransit() → bodies[planet].zodiac_sign (0-based index)
  const signName = body?.zodiac_sign != null ? SIGNS_DE[body.zodiac_sign] : null;
  // Source: useDailyTransit() → bodies[planet].is_retrograde
  const isRetrograde = body?.is_retrograde === true;

  const resonance = dayMasterStem
    ? calculatePlanetBaziResonance(planet, dayMasterStem as Parameters<typeof calculatePlanetBaziResonance>[1])
    : null;

  const accentColor = resonance ? ELEMENT_CSS_VAR[resonance.planetElement] : 'var(--color-gold)';

  return (
    <div
      data-testid={`planet-card-${planet}`}
      className="rounded-xl border overflow-hidden"
      style={{ background: 'var(--tile-bg)', borderColor: 'var(--tile-border)' }}
    >
      {/* Left accent stripe — Wu-Xing element color */}
      <div className="flex">
        <div className="w-1 flex-shrink-0" style={{ background: accentColor }} />

        <div className="flex-1 p-4 space-y-3">
          {/* ── Western block ─────────────────────────────────── */}
          <div className="flex items-baseline justify-between">
            <span
              className="font-serif text-lg font-semibold"
              style={{ color: 'var(--tile-text-primary)' }}
            >
              {planet}
            </span>
            {isRetrograde && (
              /* Source: useDailyTransit() → bodies[planet].is_retrograde */
              <span
                className="text-[10px] font-mono px-1.5 py-0.5 rounded border"
                style={{ color: 'var(--color-gold)', borderColor: 'var(--color-gold-muted)' }}
                aria-label="Rückläufig"
              >
                R
              </span>
            )}
          </div>

          {degree != null && signName ? (
            /* Source: useDailyTransit() → bodies[planet].degree_in_sign + zodiac_sign */
            <p className="font-mono text-xs" style={{ color: 'var(--tile-text-secondary)' }}>
              {degree}° {signName}
            </p>
          ) : (
            <p className="font-mono text-xs italic" style={{ color: 'var(--tile-text-secondary)' }}>
              Position nicht verfügbar
            </p>
          )}

          {/* ── BaZi block ────────────────────────────────────── */}
          <div
            className="rounded-lg p-3 space-y-1.5 mt-1"
            style={{ background: 'rgba(212,175,55,0.05)', borderTop: '1px solid var(--tile-border)' }}
          >
            {resonance ? (
              <>
                <div className="flex items-center gap-2">
                  {/* Source: DEC-fusion-bazi-sheng-ke → PLANET_ELEMENT[planet] */}
                  <span
                    className="text-[10px] font-mono font-bold uppercase tracking-wider"
                    style={{ color: accentColor }}
                  >
                    {ELEMENT_DE[resonance.planetElement]}
                  </span>
                  {/* Source: calculatePlanetBaziResonance() → type */}
                  <span
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded-full border"
                    style={{ color: 'var(--tile-text-secondary)', borderColor: 'var(--tile-border)' }}
                  >
                    {RESONANCE_LABEL[resonance.type] ?? resonance.type}
                  </span>
                </div>
                {/* Source: calculatePlanetBaziResonance() → quote */}
                <p className="font-serif text-xs italic leading-snug" style={{ color: 'var(--tile-text-secondary)' }}>
                  {resonance.quote}
                </p>
              </>
            ) : (
              <p className="text-[10px] font-mono italic" style={{ color: 'var(--tile-text-secondary)' }}>
                BaZi-Profil nicht verfügbar
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface AktiveEinfluesseFusionProps {
  dayMasterStem: string | undefined;
}

export function AktiveEinfluesseFusion({ dayMasterStem }: AktiveEinfluesseFusionProps) {
  // Source: BAFE POST /calculate/western (today's date) — via useDailyTransit
  const { bodies, loading } = useDailyTransit();

  if (loading) {
    return (
      <div data-testid="aktive-einfluesse-skeleton" className="space-y-3">
        <div
          className="h-3 w-40 rounded animate-pulse"
          style={{ background: 'var(--tile-text-secondary)', opacity: 0.3 }}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {PLANETS.map(p => (
            <div
              key={p}
              className="rounded-xl border h-36 animate-pulse"
              style={{ background: 'var(--tile-bg)', borderColor: 'var(--tile-border)' }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <section aria-label="Aktive Einflüsse">
      <header className="mb-3">
        <span
          className="text-[10px] font-sans font-bold uppercase tracking-[0.2em]"
          style={{ color: 'var(--tile-text-secondary)' }}
        >
          Aktive Einflüsse
        </span>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {PLANETS.map(planet => (
          <PlanetCard
            key={planet}
            planet={planet}
            body={bodies?.[planet]}
            dayMasterStem={dayMasterStem}
          />
        ))}
      </div>
    </section>
  );
}
```

### Step 4: Fix test mock pattern

The test uses dynamic `import()` in `beforeEach` which is fragile. Replace with this simpler pattern in the test file:

```tsx
import { useDailyTransit } from '../hooks/useDailyTransit';

// top-level mock
vi.mock('../hooks/useDailyTransit');

describe('AktiveEinfluesseFusion', () => {
  beforeEach(() => {
    vi.mocked(useDailyTransit).mockReturnValue({ bodies: MOCK_BODIES, loading: false, error: null });
  });

  // ... tests
});
```

Update `src/__tests__/aktive-einfluesse-fusion.test.tsx` to use this pattern.

### Step 5: Run tests

```bash
npx vitest run src/__tests__/aktive-einfluesse-fusion.test.tsx
```

Expected: **6 PASS**.

### Step 6: Run full suite

```bash
npm run test
```

Expected: all previously passing tests still pass.

### Step 7: Commit

```bash
git add src/components/dashboard/AktiveEinfluesseFusion.tsx src/__tests__/aktive-einfluesse-fusion.test.tsx
git commit -m "feat(TASK-aktive-einfluesse-fusion): planet cards with live Western + BaZi Sheng/Ke fusion"
```

---

## Task 10: MagnetsturmKarte

**Files:**
- Create: `src/components/dashboard/MagnetsturmKarte.tsx`
- Create: `src/__tests__/magnetsturm-karte.test.tsx`

### Context

`useSpaceWeather()` returns `SpaceWeatherState` with:
- `kpIndex: number` — render only when >= 4
- `gScale: string` — e.g. `"G1"`, `"G2"`, `"G3"`
- `solarPressure: number` — solar pressure score 0–1
- `triggerEffect: boolean` — true at G3+ (kpIndex >= 6)
- `loading: boolean`

The component receives the already-fetched `spaceWeather` as a prop (Dashboard owns `useSpaceWeather()`). It returns `null` when `kpIndex < 4`.

G-scale German labels: `{ G0: 'Ruhig', G1: 'Schwach', G2: 'Moderat', G3: 'Stark', G4: 'Sehr stark', G5: 'Extrem' }`

G3+ pulse animation: add CSS `animate-pulse` to the border div when `triggerEffect` is true.

### Step 1: Write the failing test

Create `src/__tests__/magnetsturm-karte.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MagnetsturmKarte } from '../components/dashboard/MagnetsturmKarte';
import type { SpaceWeatherState } from '../hooks/useSpaceWeather';

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (k: string) => k }),
}));

function makeWeather(overrides: Partial<SpaceWeatherState>): SpaceWeatherState {
  return {
    kpIndex: 0, solarPressure: 0, ringModulation: 1,
    intensityBoost: 0, triggerEffect: false, gScale: 'G0',
    xrayFlux: 0, xrayClass: 'A', protonFlux: 0, f107: 0,
    solarCyclePhase: 'ascending', events: [], alerts: [],
    lastUpdate: null, loading: false, error: null,
    ...overrides,
  };
}

describe('MagnetsturmKarte', () => {
  it('renders nothing when kpIndex < 4', () => {
    const { container } = render(<MagnetsturmKarte spaceWeather={makeWeather({ kpIndex: 3.9, gScale: 'G1' })} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders when kpIndex >= 4', () => {
    render(<MagnetsturmKarte spaceWeather={makeWeather({ kpIndex: 4.2, gScale: 'G2' })} />);
    expect(screen.getByRole('region')).toBeInTheDocument();
  });

  it('shows Kp value', () => {
    render(<MagnetsturmKarte spaceWeather={makeWeather({ kpIndex: 5.7, gScale: 'G2' })} />);
    expect(screen.getByText(/5\.7/)).toBeInTheDocument();
  });

  it('shows G-scale label', () => {
    render(<MagnetsturmKarte spaceWeather={makeWeather({ kpIndex: 5, gScale: 'G2' })} />);
    expect(screen.getByText(/Moderat/)).toBeInTheDocument();
  });

  it('applies pulse animation at G3+ (triggerEffect = true)', () => {
    render(<MagnetsturmKarte spaceWeather={makeWeather({ kpIndex: 6, gScale: 'G3', triggerEffect: true })} />);
    const card = screen.getByRole('region');
    expect(card.className).toMatch(/pulse/);
  });

  it('does NOT apply pulse animation below G3', () => {
    render(<MagnetsturmKarte spaceWeather={makeWeather({ kpIndex: 4, gScale: 'G1', triggerEffect: false })} />);
    const card = screen.getByRole('region');
    expect(card.className).not.toMatch(/pulse/);
  });
});
```

### Step 2: Run to verify it fails

```bash
npx vitest run src/__tests__/magnetsturm-karte.test.tsx
```

Expected: **FAIL** — component doesn't exist.

### Step 3: Implement MagnetsturmKarte

Create `src/components/dashboard/MagnetsturmKarte.tsx`:

```tsx
/**
 * MagnetsturmKarte — Conditional geomagnetic storm card
 *
 * Self-hides when Kp < 4. No placeholder card rendered — returns null.
 * At G3+ (triggerEffect = true), border pulses to match FuRingPage G3+ effect.
 *
 * Implements: REQ-F-dashboard-live-daily-signals
 * Decision: DEC-dashboard-volatile-first
 */

import type { SpaceWeatherState } from '@/src/hooks/useSpaceWeather';

// G-scale German labels
const G_LABEL: Record<string, string> = {
  G0: 'Ruhig', G1: 'Schwach', G2: 'Moderat',
  G3: 'Stark', G4: 'Sehr stark', G5: 'Extrem',
};

interface MagnetsturmKarteProps {
  spaceWeather: SpaceWeatherState;
}

export function MagnetsturmKarte({ spaceWeather }: MagnetsturmKarteProps) {
  // Source: useSpaceWeather() → kpIndex from NOAA SWPC via /api/space-weather/extended
  if (spaceWeather.kpIndex < 4) {
    return null;
  }

  // Source: useSpaceWeather() → triggerEffect (true at kpIndex >= 6)
  const isPulsing = spaceWeather.triggerEffect;

  return (
    <section
      role="region"
      aria-label="Geomagnetischer Sturm"
      className={`rounded-xl border p-5 space-y-3 ${isPulsing ? 'animate-pulse' : ''}`}
      style={{
        background: 'var(--tile-bg)',
        borderColor: isPulsing ? 'var(--color-gold)' : 'var(--color-element-water)',
      }}
    >
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <span
          className="text-[10px] font-sans font-bold uppercase tracking-[0.2em]"
          style={{ color: 'var(--color-element-water)' }}
        >
          Geomagnetischer Sturm aktiv
        </span>
        {/* Source: useSpaceWeather() → gScale (derived from kpIndex via kpToVisualIntensity) */}
        <span
          className="text-[10px] font-mono px-2 py-0.5 rounded border"
          style={{ color: 'var(--color-element-water)', borderColor: 'var(--color-element-water)' }}
        >
          {spaceWeather.gScale} — {G_LABEL[spaceWeather.gScale] ?? spaceWeather.gScale}
        </span>
      </div>

      {/* Kp bar */}
      <div>
        <div className="flex justify-between text-[10px] font-mono mb-1" style={{ color: 'var(--tile-text-secondary)' }}>
          <span>Kp Index</span>
          {/* Source: useSpaceWeather() → kpIndex */}
          <span>{spaceWeather.kpIndex.toFixed(1)}</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--tile-border)' }}>
          {/* Source: kpIndex / 9 — Kp scale maximum is 9 */}
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${Math.min(100, (spaceWeather.kpIndex / 9) * 100).toFixed(1)}%`,
              background: 'var(--color-element-water)',
            }}
          />
        </div>
      </div>

      {/* Context */}
      <p className="font-serif text-sm italic leading-relaxed" style={{ color: 'var(--tile-text-secondary)' }}>
        Geomagnetische Aktivität kann Konzentration und Schlaf beeinflussen. Bleib geerdet.
      </p>

      <p className="text-[9px] font-mono" style={{ color: 'var(--tile-text-secondary)', opacity: 0.6 }}>
        Live von NOAA SWPC
      </p>
    </section>
  );
}
```

### Step 4: Run tests

```bash
npx vitest run src/__tests__/magnetsturm-karte.test.tsx
```

Expected: **6 PASS**.

### Step 5: Run full suite

```bash
npm run test
```

Expected: all previously passing tests still pass.

### Step 6: Commit

```bash
git add src/components/dashboard/MagnetsturmKarte.tsx src/__tests__/magnetsturm-karte.test.tsx
git commit -m "feat(TASK-magnetsturm-karte): conditional G1+ space weather card with G3+ pulse effect"
```

---

## Final verification after all three tasks

```bash
npm run test
npm run typecheck
```

Both must be green before proceeding to Task 11 (`NatalSignaturStatic`) and Task 12 (`Dashboard.tsx` reorder).
