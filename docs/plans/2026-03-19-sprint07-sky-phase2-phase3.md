# Sprint 07: sky.bazodiac.space Phase 2+3 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform sky.bazodiac.space from a static observatorium into a live, daily-return kosmos-monitor with Jieqi solar terms, aurora visibility, geometry event gating, flare-to-field timeline, NEO ribbon, and epoch mood layer.

**Architecture:** New `/sky` route (lazy-loaded `SkyPage`) as the primary product page for sky.bazodiac.space. Server-side data proxies in `server.mjs` for NOAA aurora-ovation, GFZ Kp, JPL Horizons, JPL SBDB, and SIDC/SILSO. Existing space-weather pipeline (NOAA adapter + DONKI extended) is reused and extended. All external APIs are server-proxied with caching (never direct from frontend). Feature flags gate each major feature.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Three.js (for aurora viz), Express (server.mjs), Zod schemas, Vitest, existing NOAA/DONKI adapters.

**Branch:** `feature/sprint07-sky-phase2-3`

---

## Phase 2 Tasks (P2 — Priority)

---

### Task 1: Feature Flags + Sky Route Shell

**Files:**
- Modify: `src/lib/feature-flags.ts`
- Create: `src/pages/SkyPage.tsx`
- Modify: `src/router.tsx`

**Step 1: Add feature flags for all Sprint 07 features**

```typescript
// src/lib/feature-flags.ts — add to DEFAULT_FLAGS
sky_jieqi_banner: true,
sky_flare_timeline: true,
sky_aurora_layer: true,
sky_geometry_gating: true,
sky_neo_ribbon: false,      // P3 — off by default
sky_epoch_mood: false,       // P3 — off by default
sky_jpl_proxy: false,        // P3 — off by default
```

**Step 2: Create SkyPage shell**

```typescript
// src/pages/SkyPage.tsx
import { useSpaceWeather } from '@/src/hooks/useSpaceWeather';
import { isFeatureEnabled } from '@/src/lib/feature-flags';

export default function SkyPage() {
  const weather = useSpaceWeather();

  return (
    <div className="min-h-screen bg-obsidian text-white">
      <header className="px-6 py-4 border-b border-white/10">
        <h1 className="font-serif text-2xl text-gold">sky.bazodiac.space</h1>
        <p className="text-sm text-white/40 mt-1">Dein persoenlicher Kosmos-Monitor</p>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Task 2: JieqiBanner */}
        {/* Task 4: FlareTimeline */}
        {/* Task 5: AuroraLayer */}
        {/* Task 8: NeoRibbon */}
        {/* Task 9: EpochMoodLayer */}
      </main>
    </div>
  );
}
```

**Step 3: Add route**

```typescript
// src/router.tsx — add lazy import + route
const SkyPage = lazy(() => import('./pages/SkyPage'));

// Inside <Routes> before the catch-all:
<Route path="/sky" element={<SkyPage />} />
```

**Step 4: Verify**

Run: `npm run lint`
Expected: PASS (no type errors)

**Step 5: Commit**

```bash
git add src/lib/feature-flags.ts src/pages/SkyPage.tsx src/router.tsx
git commit -m "feat(AN-S07): add /sky route shell + Sprint 07 feature flags"
```

---

### Task 2: Jieqi Data Layer + Server Proxy

**Files:**
- Create: `src/lib/jieqi/types.ts`
- Create: `src/lib/jieqi/jieqi-data.ts`
- Create: `src/lib/jieqi/compute.ts`
- Create: `src/__tests__/jieqi-compute.test.ts`
- Modify: `server.mjs`

**Step 1: Write Jieqi types**

```typescript
// src/lib/jieqi/types.ts
export interface JieqiTerm {
  /** Index 0-23 */
  index: number;
  /** Chinese name */
  name: string;
  /** German translation */
  nameDE: string;
  /** Solar ecliptic longitude in degrees */
  longitude: number;
  /** Approximate date string (month-day) */
  approxDate: string;
}

export interface JieqiState {
  current: JieqiTerm;
  next: JieqiTerm;
  /** ISO timestamp of next transition */
  nextTransitionAt: string;
  /** Seconds until next transition */
  secondsToNext: number;
  /** true when within 48h of a transition */
  isTransitionWindow: boolean;
}
```

**Step 2: Write the 24 Jieqi definitions**

```typescript
// src/lib/jieqi/jieqi-data.ts
import type { JieqiTerm } from './types';

/**
 * 24 Solar Terms — ordered by ecliptic longitude starting at Li Chun (315 deg).
 * Based on SOLAR_TERMS_SUMMARY.md reference.
 */
export const JIEQI_TERMS: JieqiTerm[] = [
  { index: 0, name: 'Li Chun', nameDE: 'Fruehlingsbeginn', longitude: 315, approxDate: '02-04' },
  { index: 1, name: 'Yu Shui', nameDE: 'Regenwasser', longitude: 330, approxDate: '02-19' },
  { index: 2, name: 'Jing Zhe', nameDE: 'Erwachen der Insekten', longitude: 345, approxDate: '03-06' },
  { index: 3, name: 'Chun Fen', nameDE: 'Fruehlings-Tagundnachtgleiche', longitude: 0, approxDate: '03-21' },
  { index: 4, name: 'Qing Ming', nameDE: 'Lichte Klarheit', longitude: 15, approxDate: '04-05' },
  { index: 5, name: 'Gu Yu', nameDE: 'Getreideregen', longitude: 30, approxDate: '04-20' },
  { index: 6, name: 'Li Xia', nameDE: 'Sommerbeginn', longitude: 45, approxDate: '05-06' },
  { index: 7, name: 'Xiao Man', nameDE: 'Kleine Fuelle', longitude: 60, approxDate: '05-21' },
  { index: 8, name: 'Mang Zhong', nameDE: 'Kornreife', longitude: 75, approxDate: '06-06' },
  { index: 9, name: 'Xia Zhi', nameDE: 'Sommersonnenwende', longitude: 90, approxDate: '06-21' },
  { index: 10, name: 'Xiao Shu', nameDE: 'Kleine Hitze', longitude: 105, approxDate: '07-07' },
  { index: 11, name: 'Da Shu', nameDE: 'Grosse Hitze', longitude: 120, approxDate: '07-23' },
  { index: 12, name: 'Li Qiu', nameDE: 'Herbstbeginn', longitude: 135, approxDate: '08-07' },
  { index: 13, name: 'Chu Shu', nameDE: 'Ende der Hitze', longitude: 150, approxDate: '08-23' },
  { index: 14, name: 'Bai Lu', nameDE: 'Weisser Tau', longitude: 165, approxDate: '09-08' },
  { index: 15, name: 'Qiu Fen', nameDE: 'Herbst-Tagundnachtgleiche', longitude: 180, approxDate: '09-23' },
  { index: 16, name: 'Han Lu', nameDE: 'Kalter Tau', longitude: 195, approxDate: '10-08' },
  { index: 17, name: 'Shuang Jiang', nameDE: 'Frostabstieg', longitude: 210, approxDate: '10-23' },
  { index: 18, name: 'Li Dong', nameDE: 'Winterbeginn', longitude: 225, approxDate: '11-07' },
  { index: 19, name: 'Xiao Xue', nameDE: 'Kleiner Schnee', longitude: 240, approxDate: '11-22' },
  { index: 20, name: 'Da Xue', nameDE: 'Grosser Schnee', longitude: 255, approxDate: '12-07' },
  { index: 21, name: 'Dong Zhi', nameDE: 'Wintersonnenwende', longitude: 270, approxDate: '12-22' },
  { index: 22, name: 'Xiao Han', nameDE: 'Kleine Kaelte', longitude: 285, approxDate: '01-06' },
  { index: 23, name: 'Da Han', nameDE: 'Grosse Kaelte', longitude: 300, approxDate: '01-20' },
];
```

**Step 3: Write Jieqi computation (approximate solar longitude)**

```typescript
// src/lib/jieqi/compute.ts
import type { JieqiState } from './types';
import { JIEQI_TERMS } from './jieqi-data';

/**
 * Approximate solar ecliptic longitude for a given Date.
 * Uses the "equation of center" correction (C1+C2) for ~0.01 deg accuracy.
 * Reference: SOLAR_TERMS_ALGORITHMS.md
 */
export function solarLongitude(date: Date): number {
  const JD = dateToJD(date);
  const T = (JD - 2451545.0) / 36525; // centuries since J2000.0

  // Mean anomaly (degrees)
  const M = (357.5291 + 35999.0503 * T) % 360;
  const Mrad = M * Math.PI / 180;

  // Equation of center
  const C = 1.9146 * Math.sin(Mrad) + 0.02 * Math.sin(2 * Mrad);

  // Sun's ecliptic longitude
  const omega = 280.4665 + 36000.7698 * T; // mean longitude
  let lambda = (omega + C) % 360;
  if (lambda < 0) lambda += 360;

  return lambda;
}

function dateToJD(date: Date): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate() + date.getUTCHours() / 24 + date.getUTCMinutes() / 1440;

  let Y = y, M = m;
  if (M <= 2) { Y -= 1; M += 12; }

  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);

  return Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + d + B - 1524.5;
}

/**
 * Compute current Jieqi state from a Date.
 * Determines which term we're in, which is next, and countdown.
 */
export function computeJieqiState(date: Date = new Date()): JieqiState {
  const lambda = solarLongitude(date);

  // Find current term: the last term whose longitude we passed
  // Terms are ordered by longitude: 315, 330, 345, 0, 15, 30, ...
  // Need to handle the 315->0 wrap

  let currentIdx = 0;
  for (let i = 0; i < JIEQI_TERMS.length; i++) {
    const termLon = JIEQI_TERMS[i].longitude;
    // Normalize comparison: shift so 315 maps to 0
    const normLambda = (lambda - 315 + 360) % 360;
    const normTerm = (termLon - 315 + 360) % 360;
    if (normLambda >= normTerm) {
      currentIdx = i;
    }
  }

  const nextIdx = (currentIdx + 1) % JIEQI_TERMS.length;
  const current = JIEQI_TERMS[currentIdx];
  const next = JIEQI_TERMS[nextIdx];

  // Estimate time to next transition
  const nextLon = next.longitude;
  let degToNext = (nextLon - lambda + 360) % 360;
  if (degToNext === 0) degToNext = 360; // full cycle if exactly on boundary

  // Sun moves ~0.9856 deg/day
  const daysToNext = degToNext / 0.9856;
  const secondsToNext = Math.round(daysToNext * 86400);

  const nextTransitionAt = new Date(date.getTime() + secondsToNext * 1000).toISOString();
  const isTransitionWindow = secondsToNext < 48 * 3600; // within 48h

  return {
    current,
    next,
    nextTransitionAt,
    secondsToNext,
    isTransitionWindow,
  };
}
```

**Step 4: Write test for Jieqi computation**

```typescript
// src/__tests__/jieqi-compute.test.ts
import { describe, it, expect } from 'vitest';
import { computeJieqiState, solarLongitude } from '../lib/jieqi/compute';

describe('solarLongitude', () => {
  it('returns ~0 deg around March equinox (2026-03-20)', () => {
    const date = new Date('2026-03-20T12:00:00Z');
    const lon = solarLongitude(date);
    // Should be near 0 degrees (Spring Equinox)
    expect(lon).toBeGreaterThan(355);
    // Could also wrap to near 0
  });

  it('returns ~90 deg around June solstice (2026-06-21)', () => {
    const date = new Date('2026-06-21T12:00:00Z');
    const lon = solarLongitude(date);
    expect(lon).toBeGreaterThan(85);
    expect(lon).toBeLessThan(95);
  });
});

describe('computeJieqiState', () => {
  it('returns valid JieqiState with current and next term', () => {
    const state = computeJieqiState(new Date('2026-03-19T12:00:00Z'));
    expect(state.current.name).toBeDefined();
    expect(state.next.name).toBeDefined();
    expect(state.secondsToNext).toBeGreaterThan(0);
    expect(typeof state.isTransitionWindow).toBe('boolean');
  });

  it('identifies Chun Fen (Spring Equinox) period around 2026-03-21', () => {
    // On March 19, we should be in Jing Zhe (345 deg) heading toward Chun Fen (0 deg)
    const state = computeJieqiState(new Date('2026-03-19T12:00:00Z'));
    expect(state.current.name).toBe('Jing Zhe');
    expect(state.next.name).toBe('Chun Fen');
    expect(state.isTransitionWindow).toBe(true); // ~1 day away
  });

  it('returns positive countdown', () => {
    const state = computeJieqiState();
    expect(state.secondsToNext).toBeGreaterThan(0);
    expect(state.nextTransitionAt).toBeTruthy();
  });
});
```

**Step 5: Run test to verify**

Run: `npx vitest run src/__tests__/jieqi-compute.test.ts`
Expected: PASS (all 4 tests)

**Step 6: Add server proxy endpoint for Jieqi**

Add to `server.mjs` (near the other space-weather endpoints):

```javascript
// ── /api/jieqi/current ──────────────────────────────────────────────
// Returns current Jieqi state. Computed server-side (no external API needed).
// If FuFirE is available, prefer FuFirE response; else use local computation.
import { computeJieqiState } from './src/lib/jieqi/compute.js';

app.get("/api/jieqi/current", async (_req, res) => {
  res.set("Cache-Control", "public, max-age=3600"); // 1h cache

  try {
    const state = computeJieqiState();
    return res.json(state);
  } catch (err) {
    console.error("[jieqi] computation error:", err?.message);
    return res.status(500).json({ error: "Jieqi computation failed" });
  }
});
```

**Note:** Since `server.mjs` is CommonJS/ESM, the Jieqi compute module needs to be importable. If server.mjs uses dynamic import, use `await import()`. The Jieqi math is pure TypeScript — it will need to either be compiled first or duplicated as a small `.mjs` helper. **Decision:** duplicate the minimal math in `server.mjs` as a `computeJieqiServer()` function (avoid build dependency), or use `tsx` to import TS. Match existing patterns in server.mjs.

**Step 7: Commit**

```bash
git add src/lib/jieqi/ src/__tests__/jieqi-compute.test.ts server.mjs
git commit -m "feat(AN-S07): Jieqi solar term computation + server proxy"
```

---

### Task 3: Jieqi x Sky Banner Component

**Files:**
- Create: `src/components/sky/JieqiBanner.tsx`
- Create: `src/hooks/useJieqi.ts`
- Modify: `src/pages/SkyPage.tsx`

**Step 1: Create useJieqi hook**

```typescript
// src/hooks/useJieqi.ts
import { useEffect, useRef, useState } from 'react';
import type { JieqiState } from '@/src/lib/jieqi/types';

export function useJieqi() {
  const [state, setState] = useState<JieqiState | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchJieqi = async () => {
      try {
        const res = await fetch('/api/jieqi/current');
        if (!res.ok) throw new Error(`Jieqi fetch failed: ${res.status}`);
        const data = await res.json();
        if (mountedRef.current) {
          setState(data);
          setLoading(false);
        }
      } catch {
        if (mountedRef.current) setLoading(false);
      }
    };

    void fetchJieqi();
    // Refresh every 30 min
    const interval = setInterval(fetchJieqi, 30 * 60 * 1000);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, []);

  return { jieqi: state, loading };
}
```

**Step 2: Create JieqiBanner component**

```typescript
// src/components/sky/JieqiBanner.tsx
import { useEffect, useState } from 'react';
import { useJieqi } from '@/src/hooks/useJieqi';
import type { SpaceWeatherState } from '@/src/hooks/useSpaceWeather';

interface JieqiBannerProps {
  weather: SpaceWeatherState;
}

function formatCountdown(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}T ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function JieqiBanner({ weather }: JieqiBannerProps) {
  const { jieqi, loading } = useJieqi();
  const [countdown, setCountdown] = useState('');

  // Live countdown ticker
  useEffect(() => {
    if (!jieqi) return;

    const tick = () => {
      const now = Date.now();
      const target = new Date(jieqi.nextTransitionAt).getTime();
      const remaining = Math.max(0, Math.floor((target - now) / 1000));
      setCountdown(formatCountdown(remaining));
    };

    tick();
    const interval = setInterval(tick, 60_000); // update every minute
    return () => clearInterval(interval);
  }, [jieqi]);

  if (loading || !jieqi) return null;

  const isBazodicMoment =
    jieqi.isTransitionWindow &&
    (weather.kpIndex >= 5 || weather.events.some(e => e.type === 'cme_arrival'));

  return (
    <div className={`
      rounded-xl border p-5 transition-all duration-500
      ${isBazodicMoment
        ? 'border-gold/60 bg-gradient-to-r from-gold/10 via-obsidian to-gold/10 shadow-[0_0_30px_rgba(212,175,55,0.15)]'
        : 'border-white/10 bg-white/[0.03]'
      }
    `}>
      {isBazodicMoment && (
        <div className="text-xs font-bold text-gold uppercase tracking-widest mb-2 animate-pulse">
          Bazodiac-Moment
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-white/40 uppercase tracking-wider">Aktueller Jieqi</div>
          <div className="text-lg font-serif text-white mt-1">{jieqi.current.nameDE}</div>
          <div className="text-xs text-white/30 mt-0.5">{jieqi.current.name}</div>
        </div>

        <div className="text-right">
          <div className="text-xs text-white/40 uppercase tracking-wider">Naechster Uebergang</div>
          <div className="text-lg font-mono text-gold mt-1">{countdown}</div>
          <div className="text-xs text-white/30 mt-0.5">{jieqi.next.nameDE}</div>
        </div>
      </div>

      {/* Solar Activity Overlay */}
      {weather.kpIndex > 0 && (
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-3">
          <div className={`
            w-2 h-2 rounded-full
            ${weather.kpIndex >= 5 ? 'bg-red-500 animate-pulse' : weather.kpIndex >= 3 ? 'bg-amber-400' : 'bg-green-400'}
          `} />
          <span className="text-xs text-white/50">
            {weather.gScale} — Kp {weather.kpIndex.toFixed(1)}
            {weather.xrayClass !== 'A' && ` | ${weather.xrayClass}-class`}
          </span>
        </div>
      )}
    </div>
  );
}
```

**Step 3: Mount in SkyPage**

```typescript
// src/pages/SkyPage.tsx — add import and render
import { JieqiBanner } from '@/src/components/sky/JieqiBanner';
import { isFeatureEnabled } from '@/src/lib/feature-flags';

// Inside <main>:
{isFeatureEnabled('sky_jieqi_banner') && <JieqiBanner weather={weather} />}
```

**Step 4: Verify**

Run: `npm run lint`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/sky/JieqiBanner.tsx src/hooks/useJieqi.ts src/pages/SkyPage.tsx
git commit -m "feat(AN-S07): Jieqi x Sky banner with countdown + Bazodiac-Moment state"
```

---

### Task 4: Geometry x Disturbance Gating Logic

**Files:**
- Create: `src/lib/space-weather/geometry-gating.ts`
- Create: `src/__tests__/geometry-gating.test.ts`

**Step 1: Write the failing test**

```typescript
// src/__tests__/geometry-gating.test.ts
import { describe, it, expect } from 'vitest';
import { isSignificantGeometryEvent } from '../lib/space-weather/geometry-gating';

describe('isSignificantGeometryEvent', () => {
  const baseContext = { kp: 2, hasCME: false, isJieqiTransition: false };

  it('returns false for conjunction without solar context', () => {
    expect(isSignificantGeometryEvent({ type: 'conjunction' }, baseContext)).toBe(false);
  });

  it('returns false for non-geometry event even with storm', () => {
    expect(isSignificantGeometryEvent({ type: 'transit' }, { ...baseContext, kp: 7 })).toBe(false);
  });

  it('returns true for conjunction + Kp >= 5', () => {
    expect(isSignificantGeometryEvent({ type: 'conjunction' }, { ...baseContext, kp: 5 })).toBe(true);
  });

  it('returns true for opposition + CME arrival', () => {
    expect(isSignificantGeometryEvent({ type: 'opposition' }, { ...baseContext, hasCME: true })).toBe(true);
  });

  it('returns true for equinox + Jieqi transition', () => {
    expect(isSignificantGeometryEvent({ type: 'equinox' }, { ...baseContext, isJieqiTransition: true })).toBe(true);
  });

  it('returns true for solstice + Kp >= 5', () => {
    expect(isSignificantGeometryEvent({ type: 'solstice' }, { ...baseContext, kp: 6 })).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/geometry-gating.test.ts`
Expected: FAIL (module not found)

**Step 3: Write implementation**

```typescript
// src/lib/space-weather/geometry-gating.ts

export type GeometryEventType = 'conjunction' | 'opposition' | 'equinox' | 'solstice' | 'trine' | 'square' | 'transit';

export interface GeometryEvent {
  type: GeometryEventType | string;
  planets?: string[];
  angleDeg?: number;
}

export interface DisturbanceContext {
  kp: number;
  hasCME: boolean;
  isJieqiTransition: boolean;
}

const SIGNIFICANT_GEOMETRY: Set<string> = new Set([
  'conjunction', 'opposition', 'equinox', 'solstice',
]);

/**
 * Gating function: only emit a Contribution Event when a geometry event
 * coincides with active solar disturbance or Jieqi transition.
 *
 * Prevents event spam: a standard conjunction without solar context = no event.
 */
export function isSignificantGeometryEvent(
  event: GeometryEvent,
  context: DisturbanceContext,
): boolean {
  if (!SIGNIFICANT_GEOMETRY.has(event.type)) return false;

  const hasDisturbance =
    context.kp >= 5 ||
    context.hasCME ||
    context.isJieqiTransition;

  return hasDisturbance;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/geometry-gating.test.ts`
Expected: PASS (all 6 tests)

**Step 5: Commit**

```bash
git add src/lib/space-weather/geometry-gating.ts src/__tests__/geometry-gating.test.ts
git commit -m "feat(AN-S07): isSignificantGeometryEvent gating logic with tests"
```

---

### Task 5: Flare-to-Field Timeline Component

**Files:**
- Create: `src/lib/schemas/flare-timeline.ts`
- Modify: `server.mjs` (new `/api/space-weather/timeline` endpoint)
- Create: `src/hooks/useFlareTimeline.ts`
- Create: `src/components/sky/FlareTimeline.tsx`
- Modify: `src/pages/SkyPage.tsx`

**Step 1: Define Zod schema for timeline data**

```typescript
// src/lib/schemas/flare-timeline.ts
import { z } from 'zod';

export const TimelineEventSchema = z.object({
  id: z.string(),
  type: z.enum(['flare', 'cme', 'cme_arrival', 'kp_peak', 'sep']),
  timestamp: z.string(),
  label: z.string(),
  /** 0-1 severity for visual height */
  intensity: z.number().min(0).max(1),
  details: z.string().optional(),
});

export const XrayCurvePointSchema = z.object({
  timestamp: z.string(),
  flux: z.number(),
});

export const KpBarSchema = z.object({
  timestamp: z.string(),
  kp: z.number(),
  noaaScale: z.string(),
});

export const FlareTimelineSchema = z.object({
  xrayCurve: z.array(XrayCurvePointSchema),
  kpBars: z.array(KpBarSchema),
  events: z.array(TimelineEventSchema),
  enlilWindow: z.object({
    startAt: z.string().nullable(),
    endAt: z.string().nullable(),
  }).nullable(),
});

export type FlareTimeline = z.infer<typeof FlareTimelineSchema>;
export type TimelineEvent = z.infer<typeof TimelineEventSchema>;
```

**Step 2: Server endpoint (aggregate GOES X-ray + Kp history + DONKI events)**

Add to `server.mjs`:

```javascript
// ── /api/space-weather/timeline ─────────────────────────────────────
// Aggregates GOES X-ray curve + Kp bars + DONKI event markers for timeline viz.
let timelineCache = null;
const TIMELINE_CACHE_TTL_MS = 10 * 60 * 1000; // 10 min

app.get("/api/space-weather/timeline", async (_req, res) => {
  res.set("Cache-Control", "public, max-age=600");

  const now = Date.now();
  if (timelineCache && now - timelineCache.timestamp < TIMELINE_CACHE_TTL_MS) {
    return res.json(timelineCache.payload);
  }

  try {
    // Parallel fetch: GOES X-ray (6h), Kp history (3d), DONKI events (7d)
    const [xrayRes, kpRes] = await Promise.allSettled([
      fetch("https://services.swpc.noaa.gov/json/goes/primary/xrays-6-hour.json", { signal: AbortSignal.timeout(8000) }),
      fetch("https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json", { signal: AbortSignal.timeout(8000) }),
    ]);

    const xrayCurve = [];
    if (xrayRes.status === "fulfilled" && xrayRes.value.ok) {
      const xrayData = await xrayRes.value.json();
      if (Array.isArray(xrayData)) {
        for (const point of xrayData.slice(-360)) { // last 6h at 1-min resolution
          if (point.time_tag && point.flux != null) {
            xrayCurve.push({ timestamp: point.time_tag, flux: point.flux });
          }
        }
      }
    }

    const kpBars = [];
    if (kpRes.status === "fulfilled" && kpRes.value.ok) {
      const kpData = await kpRes.value.json();
      if (Array.isArray(kpData)) {
        // Skip header row, take last 24 entries (3 days x 8 per day)
        for (const row of kpData.slice(-24)) {
          if (Array.isArray(row) && row.length >= 2) {
            const kp = parseFloat(row[1]);
            const noaaScale = kp >= 9 ? "G5" : kp >= 8 ? "G4" : kp >= 7 ? "G3" : kp >= 6 ? "G2" : kp >= 5 ? "G1" : "G0";
            kpBars.push({ timestamp: row[0], kp, noaaScale });
          }
        }
      }
    }

    // Reuse DONKI events from extended endpoint
    const donkiEvents = []; // populated from existing extendedWeatherCache
    if (extendedWeatherCache?.payload?.events) {
      for (const evt of extendedWeatherCache.payload.events) {
        donkiEvents.push({
          id: evt.event_id,
          type: evt.type,
          timestamp: evt.started_at,
          label: evt.description || evt.type,
          intensity: evt.signature_weight,
          details: `Severity: ${evt.severity}`,
        });
      }
    }

    // WSA-ENLIL arrival window from DONKI CME analyses
    let enlilWindow = null;
    if (extendedWeatherCache?.payload?.events) {
      const cmeArrival = extendedWeatherCache.payload.events.find(e => e.type === "cme_arrival");
      if (cmeArrival) {
        enlilWindow = {
          startAt: cmeArrival.started_at,
          endAt: cmeArrival.expires_at,
        };
      }
    }

    const payload = {
      xrayCurve,
      kpBars,
      events: donkiEvents,
      enlilWindow,
    };

    timelineCache = { timestamp: now, payload };
    return res.json(payload);
  } catch (err) {
    console.error("[timeline] error:", err?.message);
    if (timelineCache?.payload) return res.json(timelineCache.payload);
    return res.status(502).json({ error: "Timeline data unavailable" });
  }
});
```

**Step 3: Create useFlareTimeline hook**

```typescript
// src/hooks/useFlareTimeline.ts
import { useEffect, useRef, useState } from 'react';
import { FlareTimelineSchema, type FlareTimeline } from '@/src/lib/schemas/flare-timeline';

export function useFlareTimeline() {
  const [data, setData] = useState<FlareTimeline | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchTimeline = async () => {
      try {
        const res = await fetch('/api/space-weather/timeline');
        if (!res.ok) throw new Error(`Timeline fetch failed: ${res.status}`);
        const raw = await res.json();
        const parsed = FlareTimelineSchema.parse(raw);
        if (mountedRef.current) {
          setData(parsed);
          setLoading(false);
        }
      } catch {
        if (mountedRef.current) setLoading(false);
      }
    };

    void fetchTimeline();
    const interval = setInterval(fetchTimeline, 10 * 60 * 1000); // 10 min

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, []);

  return { timeline: data, loading };
}
```

**Step 4: Create FlareTimeline component**

```typescript
// src/components/sky/FlareTimeline.tsx
import { useFlareTimeline } from '@/src/hooks/useFlareTimeline';

export function FlareTimeline() {
  const { timeline, loading } = useFlareTimeline();

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <div className="h-48 skeleton-dust rounded" />
      </div>
    );
  }

  if (!timeline) return null;

  const maxFlux = Math.max(...timeline.xrayCurve.map(p => p.flux), 1e-8);

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
      <h2 className="text-xs uppercase tracking-widest text-white/40">
        Flare-to-Field Timeline
      </h2>

      {/* X-ray Curve (SVG sparkline) */}
      <div className="relative h-24">
        <svg viewBox="0 0 360 100" className="w-full h-full" preserveAspectRatio="none">
          <polyline
            fill="none"
            stroke="#D4AF37"
            strokeWidth="1.5"
            opacity="0.7"
            points={timeline.xrayCurve.map((p, i) => {
              const x = (i / Math.max(timeline.xrayCurve.length - 1, 1)) * 360;
              const y = 100 - (Math.log10(Math.max(p.flux, 1e-9)) + 9) / 5 * 100;
              return `${x},${Math.max(0, Math.min(100, y))}`;
            }).join(' ')}
          />
        </svg>
        <div className="absolute top-0 left-0 text-[10px] text-white/20">GOES X-ray</div>
      </div>

      {/* Kp Bars */}
      {timeline.kpBars.length > 0 && (
        <div className="flex items-end gap-0.5 h-16">
          {timeline.kpBars.map((bar, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-sm transition-all"
              style={{
                height: `${(bar.kp / 9) * 100}%`,
                backgroundColor: bar.kp >= 5 ? '#ef4444' : bar.kp >= 3 ? '#f59e0b' : '#22c55e',
                opacity: 0.6,
              }}
              title={`Kp ${bar.kp.toFixed(1)} (${bar.noaaScale})`}
            />
          ))}
        </div>
      )}

      {/* DONKI Event Markers */}
      {timeline.events.length > 0 && (
        <div className="space-y-1">
          {timeline.events.slice(0, 5).map(evt => (
            <div key={evt.id} className="flex items-center gap-2 text-xs">
              <span className={`
                w-1.5 h-1.5 rounded-full
                ${evt.type === 'flare' ? 'bg-amber-400' : evt.type === 'cme_arrival' ? 'bg-red-500' : 'bg-blue-400'}
              `} />
              <span className="text-white/50">{evt.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* WSA-ENLIL arrival window */}
      {timeline.enlilWindow && (
        <div className="text-xs text-white/30 border-t border-white/5 pt-2">
          CME-Ankunftsfenster: {new Date(timeline.enlilWindow.startAt!).toLocaleDateString('de-DE')}
          {timeline.enlilWindow.endAt && ` — ${new Date(timeline.enlilWindow.endAt).toLocaleDateString('de-DE')}`}
        </div>
      )}
    </div>
  );
}
```

**Step 5: Mount in SkyPage**

```typescript
// src/pages/SkyPage.tsx — add
import { FlareTimeline } from '@/src/components/sky/FlareTimeline';

// Inside <main>:
{isFeatureEnabled('sky_flare_timeline') && <FlareTimeline />}
```

**Step 6: Verify + commit**

Run: `npm run lint`

```bash
git add src/lib/schemas/flare-timeline.ts src/hooks/useFlareTimeline.ts src/components/sky/FlareTimeline.tsx src/pages/SkyPage.tsx server.mjs
git commit -m "feat(AN-S07): Flare-to-Field timeline with X-ray curve, Kp bars, DONKI markers"
```

---

### Task 6: Aurora Response Layer

**Files:**
- Create: `src/lib/schemas/aurora.ts`
- Modify: `server.mjs` (new `/api/aurora` endpoint)
- Create: `src/hooks/useAurora.ts`
- Create: `src/components/sky/AuroraLayer.tsx`
- Modify: `src/pages/SkyPage.tsx`

**Step 1: Define aurora schema**

```typescript
// src/lib/schemas/aurora.ts
import { z } from 'zod';

export const AuroraDataSchema = z.object({
  /** Current Kp index */
  kp: z.number(),
  /** Is Kp >= 5 (aurora likely) */
  auroraActive: z.boolean(),
  /** NOAA aurora ovation probability data (lat/lon/probability) — simplified for Europe */
  europeForecast: z.array(z.object({
    lat: z.number(),
    lon: z.number(),
    probability: z.number().min(0).max(100),
  })),
  /** GFZ Kp/Hp30 nowcast for Europe */
  gfzKp: z.number().nullable(),
  /** Sichtbarkeits-Einschaetzung */
  visibilityDE: z.string(),
  /** Last data update timestamp */
  updatedAt: z.string(),
});

export type AuroraData = z.infer<typeof AuroraDataSchema>;
```

**Step 2: Server endpoint (NOAA ovation + GFZ)**

Add to `server.mjs`:

```javascript
// ── /api/aurora ─────────────────────────────────────────────────────
// Aurora visibility: NOAA ovation + GFZ Kp. Only returns useful data when Kp >= 5.
let auroraCache = null;
const AURORA_CACHE_TTL_MS = 30 * 60 * 1000; // 30 min

app.get("/api/aurora", async (_req, res) => {
  res.set("Cache-Control", "public, max-age=1800");

  const now = Date.now();
  if (auroraCache && now - auroraCache.timestamp < AURORA_CACHE_TTL_MS) {
    return res.json(auroraCache.payload);
  }

  // Get current Kp from existing space weather cache
  let currentKp = 0;
  if (extendedWeatherCache?.payload?.current?.kp) {
    currentKp = extendedWeatherCache.payload.current.kp;
  }

  // Only fetch aurora data when Kp >= 3 (aurora possible at high latitudes)
  let europeForecast = [];
  let gfzKp = null;

  if (currentKp >= 3) {
    // NOAA Aurora Ovation (JSON)
    try {
      const ovationRes = await fetch(
        "https://services.swpc.noaa.gov/json/ovation_aurora_latest.json",
        { signal: AbortSignal.timeout(8000) }
      );
      if (ovationRes.ok) {
        const ovationData = await ovationRes.json();
        if (Array.isArray(ovationData)) {
          // Filter for Europe (lat 45-72, lon -15 to 40)
          europeForecast = ovationData
            .filter(p => p[1] >= 45 && p[1] <= 72 && p[2] >= -15 && p[2] <= 40 && p[3] > 5)
            .map(p => ({ lat: p[1], lon: p[2], probability: p[3] }))
            .slice(0, 200); // cap for payload size
        }
      }
    } catch (err) {
      console.warn("[aurora] NOAA ovation fetch failed:", err?.message);
    }

    // GFZ Potsdam Kp (optional — may not have CORS-friendly endpoint)
    try {
      const gfzBase = process.env.GFZ_KP_BASE_URL || "https://www-app3.gfz-potsdam.de/kp_index/";
      const gfzRes = await fetch(`${gfzBase}Kp_ap_nowcast.txt`, { signal: AbortSignal.timeout(5000) });
      if (gfzRes.ok) {
        const text = await gfzRes.text();
        // Parse last line for Kp value (format varies)
        const lines = text.trim().split('\n').filter(l => !l.startsWith('#'));
        const lastLine = lines[lines.length - 1];
        if (lastLine) {
          const parts = lastLine.trim().split(/\s+/);
          const kpVal = parseFloat(parts[parts.length - 2]); // Kp is second-to-last column
          if (!isNaN(kpVal)) gfzKp = kpVal;
        }
      }
    } catch (err) {
      console.warn("[aurora] GFZ fetch failed:", err?.message);
    }
  }

  // Visibility assessment (German)
  let visibilityDE = "Keine Aurora-Aktivitaet erwartet.";
  if (currentKp >= 8) visibilityDE = "Aussergewoehnlich starke Aurora — moeglicherweise bis Sueddeutschland sichtbar!";
  else if (currentKp >= 7) visibilityDE = "Starke Aurora — in Norddeutschland gut sichtbar, vereinzelt bis Mitteldeutschland.";
  else if (currentKp >= 6) visibilityDE = "Aurora moeglich — am noerdlichen Horizont in Norddeutschland sichtbar bei klarem Himmel.";
  else if (currentKp >= 5) visibilityDE = "Aurora-Aktivitaet erhoet — in Skandinavien gut sichtbar, vereinzelt in Norddeutschland.";
  else if (currentKp >= 4) visibilityDE = "Schwache Aurora — nur in hohen Breitengraden (Skandinavien) sichtbar.";

  const payload = {
    kp: currentKp,
    auroraActive: currentKp >= 5,
    europeForecast,
    gfzKp,
    visibilityDE,
    updatedAt: new Date().toISOString(),
  };

  auroraCache = { timestamp: now, payload };
  return res.json(payload);
});
```

**Step 3: Create useAurora hook**

```typescript
// src/hooks/useAurora.ts
import { useEffect, useRef, useState } from 'react';
import { AuroraDataSchema, type AuroraData } from '@/src/lib/schemas/aurora';

export function useAurora() {
  const [data, setData] = useState<AuroraData | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchAurora = async () => {
      try {
        const res = await fetch('/api/aurora');
        if (!res.ok) throw new Error(`Aurora fetch failed: ${res.status}`);
        const raw = await res.json();
        const parsed = AuroraDataSchema.parse(raw);
        if (mountedRef.current) {
          setData(parsed);
          setLoading(false);
        }
      } catch {
        if (mountedRef.current) setLoading(false);
      }
    };

    void fetchAurora();
    const interval = setInterval(fetchAurora, 30 * 60 * 1000);
    return () => { mountedRef.current = false; clearInterval(interval); };
  }, []);

  return { aurora: data, loading };
}
```

**Step 4: Create AuroraLayer component**

```typescript
// src/components/sky/AuroraLayer.tsx
import { useAurora } from '@/src/hooks/useAurora';

export function AuroraLayer() {
  const { aurora, loading } = useAurora();

  if (loading) return null;
  if (!aurora || !aurora.auroraActive) return null;

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-purple-500/5 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <h2 className="text-xs uppercase tracking-widest text-emerald-400/70">Aurora-Alarm</h2>
      </div>

      <p className="text-sm text-white/70">{aurora.visibilityDE}</p>

      <div className="flex gap-4 text-xs text-white/40">
        <span>Kp {aurora.kp.toFixed(1)}</span>
        {aurora.gfzKp != null && <span>GFZ: {aurora.gfzKp.toFixed(1)}</span>}
      </div>

      {/* Simplified probability heatmap for Europe */}
      {aurora.europeForecast.length > 0 && (
        <div className="relative h-32 rounded-lg bg-obsidian overflow-hidden">
          <svg viewBox="-15 45 55 27" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            {aurora.europeForecast.map((p, i) => (
              <circle
                key={i}
                cx={p.lon}
                cy={72 - p.lat} // flip Y for SVG coords
                r={0.5}
                fill={`rgba(52, 211, 153, ${Math.min(1, p.probability / 100)})`}
              />
            ))}
            {/* Europe outline hint */}
            <text x="8" y="22" fill="rgba(255,255,255,0.1)" fontSize="2">Europa</text>
          </svg>
          <div className="absolute bottom-1 right-2 text-[9px] text-white/20">NOAA Ovation</div>
        </div>
      )}
    </div>
  );
}
```

**Step 5: Mount in SkyPage**

```typescript
// src/pages/SkyPage.tsx — add
import { AuroraLayer } from '@/src/components/sky/AuroraLayer';

// Inside <main>:
{isFeatureEnabled('sky_aurora_layer') && <AuroraLayer />}
```

**Step 6: Commit**

```bash
git add src/lib/schemas/aurora.ts src/hooks/useAurora.ts src/components/sky/AuroraLayer.tsx src/pages/SkyPage.tsx server.mjs
git commit -m "feat(AN-S07): Aurora response layer with NOAA ovation + GFZ + Europe heatmap"
```

---

## Phase 3 Tasks (P3 — Lower Priority)

---

### Task 7: JPL Horizons Backend Proxy

**Files:**
- Modify: `server.mjs`
- Create: `src/lib/schemas/geometry-event.ts`

**Step 1: Add server endpoint**

```javascript
// server.mjs — add near space-weather endpoints
// ── /api/geometry/verify ────────────────────────────────────────────
// JPL Horizons proxy for verified geometry events. 1h cache per query.
const geometryCache = new Map(); // key -> { timestamp, payload }
const GEOMETRY_CACHE_TTL_MS = 60 * 60 * 1000; // 1h

app.get("/api/geometry/verify", async (req, res) => {
  const { body1, body2, date } = req.query;
  if (!body1 || !body2 || !date) {
    return res.status(400).json({ error: "body1, body2, date required" });
  }

  const cacheKey = `${body1}-${body2}-${date}`;
  const cached = geometryCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < GEOMETRY_CACHE_TTL_MS) {
    return res.json(cached.payload);
  }

  try {
    const jplBase = process.env.JPL_HORIZONS_BASE_URL || "https://ssd.jpl.nasa.gov/api/horizons.api";
    const params = new URLSearchParams({
      format: "json",
      COMMAND: String(body1),
      CENTER: "500@399", // Earth geocentric
      EPHEM_TYPE: "OBSERVER",
      START_TIME: String(date),
      STOP_TIME: String(date),
      STEP_SIZE: "1d",
      QUANTITIES: "1,20", // RA/DEC + angular separation
    });

    const jplRes = await fetch(`${jplBase}?${params}`, { signal: AbortSignal.timeout(15000) });
    if (!jplRes.ok) throw new Error(`JPL returned ${jplRes.status}`);
    const jplData = await jplRes.json();

    const payload = {
      body1,
      body2,
      date,
      raw: jplData.result?.substring(0, 2000), // truncate to avoid massive payloads
      verified: true,
      source: "JPL Horizons",
    };

    geometryCache.set(cacheKey, { timestamp: Date.now(), payload });

    // Evict old cache entries
    if (geometryCache.size > 100) {
      const oldest = [...geometryCache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp);
      geometryCache.delete(oldest[0][0]);
    }

    return res.json(payload);
  } catch (err) {
    console.error("[geometry/verify] JPL Horizons error:", err?.message);
    return res.status(502).json({ error: "JPL Horizons unavailable" });
  }
});
```

**Step 2: Commit**

```bash
git add server.mjs
git commit -m "feat(AN-S07): JPL Horizons backend proxy with 1h cache"
```

---

### Task 8: Near-Earth Visitor Ribbon

**Files:**
- Create: `src/lib/schemas/neo.ts`
- Modify: `server.mjs` (new `/api/neo/upcoming` endpoint)
- Create: `src/hooks/useNeoVisitors.ts`
- Create: `src/components/sky/NeoRibbon.tsx`
- Modify: `src/pages/SkyPage.tsx`

**Step 1: Schema**

```typescript
// src/lib/schemas/neo.ts
import { z } from 'zod';

export const NeoObjectSchema = z.object({
  designation: z.string(),
  name: z.string().nullable(),
  closeApproachDate: z.string(),
  distanceKm: z.number(),
  distanceEarthRadii: z.number(),
  velocityKmS: z.number(),
  estimatedDiameterM: z.number(),
  isPotentiallyHazardous: z.boolean(),
});

export const NeoResponseSchema = z.object({
  objects: z.array(NeoObjectSchema),
  fetchedAt: z.string(),
});

export type NeoObject = z.infer<typeof NeoObjectSchema>;
```

**Step 2: Server endpoint (NASA NeoWs API)**

```javascript
// server.mjs
// ── /api/neo/upcoming ───────────────────────────────────────────────
let neoCache = null;
const NEO_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h

app.get("/api/neo/upcoming", async (_req, res) => {
  res.set("Cache-Control", "public, max-age=21600");

  const now = Date.now();
  if (neoCache && now - neoCache.timestamp < NEO_CACHE_TTL_MS) {
    return res.json(neoCache.payload);
  }

  try {
    const apiKey = process.env.NASA_API_KEY || "DEMO_KEY";
    const today = new Date().toISOString().slice(0, 10);
    const endDate = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

    const neoRes = await fetch(
      `https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${endDate}&api_key=${apiKey}`,
      { signal: AbortSignal.timeout(15000) }
    );
    if (!neoRes.ok) throw new Error(`NeoWs returned ${neoRes.status}`);

    const neoData = await neoRes.json();
    const objects = [];

    for (const [, dayObjects] of Object.entries(neoData.near_earth_objects || {})) {
      for (const neo of dayObjects) {
        const approach = neo.close_approach_data?.[0];
        if (!approach) continue;

        const distKm = parseFloat(approach.miss_distance?.kilometers || "0");
        const EARTH_RADIUS_KM = 6371;

        objects.push({
          designation: neo.neo_reference_id || neo.id,
          name: neo.name || null,
          closeApproachDate: approach.close_approach_date_full || approach.close_approach_date,
          distanceKm: distKm,
          distanceEarthRadii: Math.round((distKm / EARTH_RADIUS_KM) * 10) / 10,
          velocityKmS: Math.round(parseFloat(approach.relative_velocity?.kilometers_per_second || "0") * 10) / 10,
          estimatedDiameterM: Math.round(
            (parseFloat(neo.estimated_diameter?.meters?.estimated_diameter_min || "0") +
             parseFloat(neo.estimated_diameter?.meters?.estimated_diameter_max || "0")) / 2
          ),
          isPotentiallyHazardous: neo.is_potentially_hazardous_asteroid || false,
        });
      }
    }

    // Sort by distance (closest first), take top 5
    objects.sort((a, b) => a.distanceKm - b.distanceKm);

    const payload = {
      objects: objects.slice(0, 5),
      fetchedAt: new Date().toISOString(),
    };

    neoCache = { timestamp: now, payload };
    return res.json(payload);
  } catch (err) {
    console.error("[neo] fetch error:", err?.message);
    if (neoCache?.payload) return res.json(neoCache.payload);
    return res.status(502).json({ error: "NEO data unavailable" });
  }
});
```

**Step 3: Hook + Component**

```typescript
// src/hooks/useNeoVisitors.ts
import { useEffect, useRef, useState } from 'react';
import { NeoResponseSchema, type NeoObject } from '@/src/lib/schemas/neo';

export function useNeoVisitors() {
  const [objects, setObjects] = useState<NeoObject[]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchNeo = async () => {
      try {
        const res = await fetch('/api/neo/upcoming');
        if (!res.ok) throw new Error(`NEO fetch failed: ${res.status}`);
        const raw = await res.json();
        const parsed = NeoResponseSchema.parse(raw);
        if (mountedRef.current) {
          setObjects(parsed.objects);
          setLoading(false);
        }
      } catch {
        if (mountedRef.current) setLoading(false);
      }
    };

    void fetchNeo();
    return () => { mountedRef.current = false; };
  }, []);

  return { objects, loading };
}
```

```typescript
// src/components/sky/NeoRibbon.tsx
import { useNeoVisitors } from '@/src/hooks/useNeoVisitors';

export function NeoRibbon() {
  const { objects, loading } = useNeoVisitors();

  if (loading || objects.length === 0) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
      <h2 className="text-xs uppercase tracking-widest text-white/40">
        Near-Earth Visitors (7 Tage)
      </h2>

      <div className="space-y-2">
        {objects.map(neo => (
          <div key={neo.designation} className="flex items-center justify-between text-sm">
            <div>
              <span className="text-white/70">{neo.name || neo.designation}</span>
              {neo.isPotentiallyHazardous && (
                <span className="ml-2 text-[10px] text-red-400 uppercase">PHA</span>
              )}
            </div>
            <div className="text-right text-xs text-white/40">
              <div>{neo.distanceEarthRadii} ER | {neo.velocityKmS} km/s</div>
              <div>{neo.estimatedDiameterM}m est.</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 4: Mount in SkyPage (behind flag)**

```typescript
// src/pages/SkyPage.tsx
import { NeoRibbon } from '@/src/components/sky/NeoRibbon';

// Inside <main>:
{isFeatureEnabled('sky_neo_ribbon') && <NeoRibbon />}
```

**Step 5: Commit**

```bash
git add src/lib/schemas/neo.ts src/hooks/useNeoVisitors.ts src/components/sky/NeoRibbon.tsx src/pages/SkyPage.tsx server.mjs
git commit -m "feat(AN-S07): Near-Earth Visitor ribbon with NASA NeoWs data"
```

---

### Task 9: Epoch-Mood Layer (SIDC/SILSO + F10.7)

**Files:**
- Create: `src/components/sky/EpochMoodLayer.tsx`
- Modify: `src/pages/SkyPage.tsx`

The epoch data already exists in the `SpaceWeatherExtended.epoch` field (`sunspotNumber`, `f107`, `solarCyclePhase`). This task just needs a UI component to display it.

**Step 1: Create component**

```typescript
// src/components/sky/EpochMoodLayer.tsx
import type { SpaceWeatherState } from '@/src/hooks/useSpaceWeather';

interface EpochMoodLayerProps {
  weather: SpaceWeatherState;
}

const PHASE_LABELS: Record<string, string> = {
  minimum: 'Solar-Minimum',
  ascending: 'Aufstiegsphase',
  maximum: 'Solar-Maximum',
  descending: 'Abstiegsphase',
};

const PHASE_COLORS: Record<string, string> = {
  minimum: 'from-blue-900/10 to-indigo-900/5',
  ascending: 'from-amber-900/10 to-orange-900/5',
  maximum: 'from-red-900/10 to-orange-900/5',
  descending: 'from-purple-900/10 to-blue-900/5',
};

export function EpochMoodLayer({ weather }: EpochMoodLayerProps) {
  const phase = weather.solarCyclePhase || 'ascending';
  const label = PHASE_LABELS[phase] || phase;
  const gradient = PHASE_COLORS[phase] || PHASE_COLORS.ascending;

  return (
    <div className={`rounded-xl border border-white/5 bg-gradient-to-r ${gradient} p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-white/30">Sonnenzyklusphase</div>
          <div className="text-sm text-white/60 mt-1">{label}</div>
        </div>
        <div className="text-right">
          {weather.f107 > 0 && (
            <div className="text-xs text-white/30">
              F10.7: {weather.f107.toFixed(0)} SFU
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Mount in SkyPage**

```typescript
// src/pages/SkyPage.tsx
import { EpochMoodLayer } from '@/src/components/sky/EpochMoodLayer';

// Inside <main>, at the bottom:
{isFeatureEnabled('sky_epoch_mood') && <EpochMoodLayer weather={weather} />}
```

**Step 3: Commit**

```bash
git add src/components/sky/EpochMoodLayer.tsx src/pages/SkyPage.tsx
git commit -m "feat(AN-S07): Epoch-Mood layer showing solar cycle phase + F10.7"
```

---

### Task 10: Final SkyPage Assembly + Environment Variables

**Files:**
- Modify: `src/pages/SkyPage.tsx` (final assembly)
- Modify: `.env.example`
- Modify: `server.mjs` (add env var docs)

**Step 1: Final SkyPage with all components**

```typescript
// src/pages/SkyPage.tsx — final version
import { useSpaceWeather } from '@/src/hooks/useSpaceWeather';
import { isFeatureEnabled } from '@/src/lib/feature-flags';
import { JieqiBanner } from '@/src/components/sky/JieqiBanner';
import { FlareTimeline } from '@/src/components/sky/FlareTimeline';
import { AuroraLayer } from '@/src/components/sky/AuroraLayer';
import { NeoRibbon } from '@/src/components/sky/NeoRibbon';
import { EpochMoodLayer } from '@/src/components/sky/EpochMoodLayer';

export default function SkyPage() {
  const weather = useSpaceWeather();

  return (
    <div className="min-h-screen bg-obsidian text-white">
      <header className="px-6 py-4 border-b border-white/10">
        <h1 className="font-serif text-2xl text-gold">sky.bazodiac.space</h1>
        <p className="text-sm text-white/40 mt-1">Dein persoenlicher Kosmos-Monitor</p>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {isFeatureEnabled('sky_jieqi_banner') && <JieqiBanner weather={weather} />}
        {isFeatureEnabled('sky_aurora_layer') && <AuroraLayer />}
        {isFeatureEnabled('sky_flare_timeline') && <FlareTimeline />}
        {isFeatureEnabled('sky_epoch_mood') && <EpochMoodLayer weather={weather} />}
        {isFeatureEnabled('sky_neo_ribbon') && <NeoRibbon />}
      </main>
    </div>
  );
}
```

**Step 2: Update .env.example**

Add to `.env.example`:

```bash
# Sprint 07 — Phase 2+3 (sky.bazodiac.space)
GFZ_KP_BASE_URL=https://www-app3.gfz-potsdam.de/kp_index/
SIDC_SILSO_BASE_URL=https://www.sidc.be/silso/
JPL_HORIZONS_BASE_URL=https://ssd.jpl.nasa.gov/api/horizons.api
```

**Step 3: Verify full build**

Run: `npm run lint && npm run build`
Expected: PASS

**Step 4: Commit**

```bash
git add src/pages/SkyPage.tsx .env.example
git commit -m "feat(AN-S07): final SkyPage assembly + env vars for Phase 2+3"
```

---

### Task 11: Tests for All New Modules

**Files:**
- Already created: `src/__tests__/jieqi-compute.test.ts`
- Already created: `src/__tests__/geometry-gating.test.ts`
- Create: `src/__tests__/flare-timeline-schema.test.ts`
- Create: `src/__tests__/aurora-schema.test.ts`
- Create: `src/__tests__/neo-schema.test.ts`

**Step 1: Schema validation tests**

```typescript
// src/__tests__/flare-timeline-schema.test.ts
import { describe, it, expect } from 'vitest';
import { FlareTimelineSchema } from '../lib/schemas/flare-timeline';

describe('FlareTimelineSchema', () => {
  it('parses valid timeline data', () => {
    const data = {
      xrayCurve: [{ timestamp: '2026-03-19T10:00:00Z', flux: 1.2e-6 }],
      kpBars: [{ timestamp: '2026-03-19T09:00:00Z', kp: 6.33, noaaScale: 'G2' }],
      events: [{
        id: 'donki-cme-1',
        type: 'cme_arrival',
        timestamp: '2026-03-19T08:00:00Z',
        label: 'Earthbound CME',
        intensity: 0.2,
      }],
      enlilWindow: { startAt: '2026-03-18T00:00:00Z', endAt: '2026-03-20T00:00:00Z' },
    };
    expect(() => FlareTimelineSchema.parse(data)).not.toThrow();
  });

  it('rejects invalid intensity', () => {
    const data = {
      xrayCurve: [],
      kpBars: [],
      events: [{ id: 'x', type: 'flare', timestamp: 't', label: 'l', intensity: 2.0 }],
      enlilWindow: null,
    };
    expect(() => FlareTimelineSchema.parse(data)).toThrow();
  });
});
```

```typescript
// src/__tests__/aurora-schema.test.ts
import { describe, it, expect } from 'vitest';
import { AuroraDataSchema } from '../lib/schemas/aurora';

describe('AuroraDataSchema', () => {
  it('parses valid aurora data', () => {
    const data = {
      kp: 6.0,
      auroraActive: true,
      europeForecast: [{ lat: 60, lon: 10, probability: 45 }],
      gfzKp: 5.7,
      visibilityDE: 'Aurora moeglich',
      updatedAt: '2026-03-19T12:00:00Z',
    };
    expect(() => AuroraDataSchema.parse(data)).not.toThrow();
  });
});
```

```typescript
// src/__tests__/neo-schema.test.ts
import { describe, it, expect } from 'vitest';
import { NeoResponseSchema } from '../lib/schemas/neo';

describe('NeoResponseSchema', () => {
  it('parses valid NEO response', () => {
    const data = {
      objects: [{
        designation: '2026-AB',
        name: '2026 AB',
        closeApproachDate: '2026-03-22',
        distanceKm: 1500000,
        distanceEarthRadii: 235.4,
        velocityKmS: 12.3,
        estimatedDiameterM: 150,
        isPotentiallyHazardous: false,
      }],
      fetchedAt: '2026-03-19T12:00:00Z',
    };
    expect(() => NeoResponseSchema.parse(data)).not.toThrow();
  });
});
```

**Step 2: Run all tests**

Run: `npx vitest run src/__tests__/jieqi-compute.test.ts src/__tests__/geometry-gating.test.ts src/__tests__/flare-timeline-schema.test.ts src/__tests__/aurora-schema.test.ts src/__tests__/neo-schema.test.ts`
Expected: ALL PASS

**Step 3: Commit**

```bash
git add src/__tests__/
git commit -m "test(AN-S07): schema + logic tests for all Sprint 07 modules"
```

---

## Dependencies Between Tasks

```
Task 1 (Feature flags + route) → all other tasks
Task 2 (Jieqi data) → Task 3 (Jieqi banner)
Task 4 (Geometry gating) → standalone, used by Task 7 (JPL verify)
Task 5 (Flare timeline) → standalone
Task 6 (Aurora layer) → standalone
Task 7 (JPL proxy) → P3, standalone
Task 8 (NEO ribbon) → P3, standalone
Task 9 (Epoch mood) → standalone (uses existing data)
Task 10 (Assembly) → all P2 tasks complete
Task 11 (Tests) → can run incrementally per task
```

## Critical Notes for Implementer

1. **server.mjs is ESM** — TypeScript modules from `src/lib/` can't be directly imported. Either duplicate minimal logic as JS in server.mjs (like existing patterns) or use dynamic `import()` with `tsx` loader. Check how existing server code handles this.

2. **NOAA ovation data format** — The `aurora-ovation` endpoint returns arrays `[timestamp, lat, lon, probability]`. Verify the actual format against https://services.swpc.noaa.gov/json/ovation_aurora_latest.json before implementing.

3. **GFZ Potsdam** may not have a JSON API — the Kp_ap_nowcast.txt is a text file. Parse carefully. If CORS blocks frontend fetch, this MUST go through the server proxy (which it does in this plan).

4. **NASA NeoWs** — DEMO_KEY has rate limits (30 req/hour). Production should use a real API key from https://api.nasa.gov.

5. **Feature flags** — P3 features (NEO, Epoch, JPL) are disabled by default. Enable via `localStorage.setItem('ff_sky_neo_ribbon', 'true')` for testing.
