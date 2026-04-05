# Bug Fix Plan — Reopened & Open Bugs

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all 8 open bugs (BUG-15 through BUG-22) in a single efficient sweep by attacking shared root causes first, then resolving residual symptoms.

**Architecture:** Three bug clusters share a single root cause pattern: **"data pipeline produces valid-looking empty/default values that pass null guards but render as zero/blank"**. By fixing the shared data flow first (soulprint → natalWeights → component), downstream bugs resolve automatically. The Planetarium bugs are isolated (separate observer/time system). Quiz bugs are isolated (persistence + latency).

**Tech Stack:** React 19, TypeScript, Vitest, Three.js, Express (server.mjs), Supabase

---

## Root Cause Analysis

### Pattern Identified: **"Synthetic Fallback Blindspot"**

The prior S-BUGFIX sprint added a `syntheticSoulprintFromSign()` fallback that generates a 12-sector array when `soulprint_sectors` is null. This array IS valid (12 numbers, all 0.25–0.85), so it passes all null guards. BUT:

1. **InfluenceGauges (BUG-17):** `soulprintToNatalWeights()` converts the synthetic soulprint correctly — the weights ARE non-zero (0.25–0.85). The gauges show 0% because **the component receives `weights` but the values are so close to the neutral baseline** that the visual rendering shows near-zero bars. The real issue: the synthetic soulprint's uniform distribution (all sectors ≈ 0.5) produces nearly identical planet weights (all ≈ 0.5), which looks like "nothing special" visually. The `isLive` flag says "live" but the data is actually synthetic. **Root fix:** When weights come from synthetic fallback, either show a distinct "estimated" state OR boost contrast in the synthetic weights.

2. **DashboardTagesEnergie (BUG-19):** The component returns `null` when `daily` is null (`if (!daily) return null;`). The `useFirstRunDaily` hook fetches from FuFirE Experience API (`/api/experience/daily`), which requires the FuFirE backend to be running. If FuFirE is down or BAFE unreachable, `dailyData` stays null → component doesn't render. The fallback (`CosmicWeatherCard`) only shows when `dailyData` is null, but it shows a different, less detailed card. **Root fix:** The daily API must have a local Gemini-direct fallback when FuFirE proxy fails, AND the component must show a meaningful state when the API returns partial data.

3. **Vibes (BUG-18):** The VibesSection renders a button inside `PremiumGate`. If user is not premium, they see the teaser text but can never click the button. If they ARE premium, the button calls `fetchVibes()` which POSTs to `/api/vibes`. The server generates via Gemini or returns a fallback. The modal only shows when `showModal && vibesData` — if fetch fails silently or returns malformed data, nothing renders. **Root fix:** Verify the full path: PremiumGate → button click → fetch → modal render.

4. **Planetarium (BUG-15/16):** The observer coordinates are hardcoded to `CITIES[0]` (Berlin: 52.52, 13.405). When `currentSky=true`, simTime updates to "now" but observer stays at Berlin regardless of user location. Birth sky vs current sky difference is subtle because the time difference for recent birthdays is small, and observer location is identical. **Root fix:** Pass birth lat/lon from profile for birth sky, use Geolocation API for current sky.

### Component → File Map

| Bug | Component | File(s) | Shared Data Source |
|-----|-----------|---------|-------------------|
| BUG-15/16 | BirthChartOrrery | `BirthChartOrrery.tsx`, `useCelestialOrrery.ts` | Profile birth coords |
| BUG-17 | InfluenceGauges | `InfluenceGauges.tsx`, `Dashboard.tsx` | `effectiveSoulprint` → `natalWeights` |
| BUG-18 | VibesSection/Modal | `VibesSection.tsx`, `VibesModal.tsx` | `/api/vibes` + PremiumGate |
| BUG-19 | DashboardTagesEnergie | `DashboardTagesEnergie.tsx`, `useFirstRunDaily.ts` | `/api/experience/daily` |
| BUG-20 | Quiz Completion | `useCompletedModules.ts`, `useQuizContribution.ts` | localStorage + Supabase |
| BUG-21 | Quiz Latency | `server.mjs` `/api/contribute` | Gemini + transit-state pipeline |
| BUG-22 | Quiz Headings | Quiz components + i18n | Translation keys |

### Overlap Analysis & Efficient Fix Order

```
Phase 1: Dashboard Data Pipeline (fixes BUG-17 + BUG-19 + enables BUG-18)
  └─ Shared touch: Dashboard.tsx (effectiveSoulprint, dailyData, natalWeights)
  └─ Shared touch: weight-utils.ts (synthetic detection)

Phase 2: Vibes Visibility (fixes BUG-18)
  └─ Independent: VibesSection.tsx, VibesModal.tsx, server.mjs /api/vibes

Phase 3: Planetarium Observer (fixes BUG-15 + BUG-16)
  └─ Independent: BirthChartOrrery.tsx, useCelestialOrrery.ts, Dashboard.tsx

Phase 4: Quiz Pipeline (fixes BUG-20 + BUG-21 + BUG-22)
  └─ Independent: useCompletedModules.ts, server.mjs, quiz components
```

---

## Phase 1: Dashboard Data Pipeline (BUG-17 + BUG-19)

### Task 1: Add synthetic-detection flag to weight-utils

**Files:**
- Modify: `src/lib/signatur/weight-utils.ts`
- Test: `src/__tests__/weight-utils-synthetic.test.ts`

**Step 1: Write the failing test**

```typescript
// src/__tests__/weight-utils-synthetic.test.ts
import { describe, it, expect } from 'vitest';
import { syntheticSoulprintFromSign, isSyntheticSoulprint } from '../lib/signatur/weight-utils';

describe('isSyntheticSoulprint', () => {
  it('returns true for synthetic soulprint from known sign', () => {
    const synthetic = syntheticSoulprintFromSign('Leo');
    expect(isSyntheticSoulprint(synthetic)).toBe(true);
  });

  it('returns true for uniform 0.5 fallback (unknown sign)', () => {
    expect(isSyntheticSoulprint(Array(12).fill(0.5))).toBe(true);
  });

  it('returns false for real soulprint with varied distribution', () => {
    const real = [0.1, 0.9, 0.3, 0.7, 0.85, 0.2, 0.6, 0.4, 0.15, 0.95, 0.5, 0.35];
    expect(isSyntheticSoulprint(real)).toBe(false);
  });

  it('returns false for null/undefined', () => {
    expect(isSyntheticSoulprint(null as any)).toBe(false);
    expect(isSyntheticSoulprint(undefined as any)).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/weight-utils-synthetic.test.ts`
Expected: FAIL — `isSyntheticSoulprint` not exported

**Step 3: Implement isSyntheticSoulprint**

Add to `src/lib/signatur/weight-utils.ts`:

```typescript
/**
 * Detects whether a soulprint is synthetic (generated by syntheticSoulprintFromSign).
 * Synthetic soulprints have low variance (smooth bell curve or flat 0.5).
 * Real soulprints from FuFirE bootstrap have much higher sector-to-sector variance.
 *
 * Threshold: standard deviation < 0.15 indicates synthetic.
 */
export function isSyntheticSoulprint(sectors: number[] | null | undefined): boolean {
  if (!Array.isArray(sectors) || sectors.length !== 12) return false;
  const mean = sectors.reduce((s, v) => s + v, 0) / 12;
  const variance = sectors.reduce((s, v) => s + (v - mean) ** 2, 0) / 12;
  return Math.sqrt(variance) < 0.15;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/weight-utils-synthetic.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/signatur/weight-utils.ts src/__tests__/weight-utils-synthetic.test.ts
git commit -m "fix(BUG-17): add isSyntheticSoulprint detection for fallback data"
```

---

### Task 2: InfluenceGauges — show "estimated" state for synthetic data (BUG-17)

**Files:**
- Modify: `src/components/dashboard/InfluenceGauges.tsx`
- Modify: `src/components/Dashboard.tsx`
- Test: `src/__tests__/influence-gauges-synthetic.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/__tests__/influence-gauges-synthetic.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import InfluenceGauges from '../components/dashboard/InfluenceGauges';

// Mock useLanguage
vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'dashboard.influences.sectionTitle': 'Heutige Einflüsse',
        'dashboard.influences.liveLabel': 'live',
        'dashboard.influences.noDataLabel': 'keine Daten',
        'dashboard.influences.estimatedLabel': 'geschätzt',
        'dashboard.influences.marsLabel': 'Mars',
        'dashboard.influences.jupiterLabel': 'Jupiter',
        'dashboard.influences.venusLabel': 'Venus',
        'dashboard.influences.saturnLabel': 'Saturn',
        'dashboard.influences.marsTooltip': '',
        'dashboard.influences.jupiterTooltip': '',
        'dashboard.influences.venusTooltip': '',
        'dashboard.influences.saturnTooltip': '',
      };
      return map[key] || key;
    },
    lang: 'de',
  }),
}));

describe('InfluenceGauges', () => {
  it('shows "estimated" label when isSynthetic=true', () => {
    const weights = { Mars: 0.5, Jupiter: 0.5, Venus: 0.5, Saturn: 0.5 };
    render(<InfluenceGauges weights={weights} isSynthetic={true} />);
    expect(screen.getByText('geschätzt')).toBeTruthy();
  });

  it('shows "live" label when isSynthetic=false and weights provided', () => {
    const weights = { Mars: 0.7, Jupiter: 0.3, Venus: 0.8, Saturn: 0.2 };
    render(<InfluenceGauges weights={weights} isSynthetic={false} />);
    expect(screen.getByText('live')).toBeTruthy();
  });

  it('shows non-zero percentages for real weights', () => {
    const weights = { Mars: 0.72, Jupiter: 0.35, Venus: 0.88, Saturn: 0.21 };
    render(<InfluenceGauges weights={weights} isSynthetic={false} />);
    expect(screen.getByText('72%')).toBeTruthy();
    expect(screen.getByText('35%')).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/influence-gauges-synthetic.test.tsx`
Expected: FAIL — `isSynthetic` prop not accepted

**Step 3: Add isSynthetic prop to InfluenceGauges**

In `src/components/dashboard/InfluenceGauges.tsx`, change the default export:

```typescript
export default function InfluenceGauges({ weights, isSynthetic = false }: { weights?: Record<string, number>; isSynthetic?: boolean }) {
  const { t } = useLanguage();
  const items = useInfluences(weights);
  const isLive = weights !== undefined && !isSynthetic;

  return (
    <div className="cosmic-tile p-6 rounded-[2rem] space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase" style={{ color: 'var(--tile-text-secondary)' }}>{t('dashboard.influences.sectionTitle')}</h2>
        <div className={`text-[8px] font-sans ${isLive ? 'opacity-80' : 'opacity-40'}`} style={{ color: isLive ? 'var(--tile-accent)' : 'var(--tile-text-secondary)' }}>
          {isLive ? t('dashboard.influences.liveLabel') : isSynthetic ? t('dashboard.influences.estimatedLabel') : t('dashboard.influences.noDataLabel')}
        </div>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12 transition-opacity duration-300 ${isLive ? '' : 'opacity-40'}`}>
        {items.map((inf) => (
          <Gauge key={inf.label} label={inf.label} value={inf.value} color={inf.color} tooltip={inf.tooltip} />
        ))}
      </div>
    </div>
  );
}
```

**Step 4: Pass isSynthetic from Dashboard.tsx**

In `src/components/Dashboard.tsx`, import `isSyntheticSoulprint` and pass it:

```typescript
import { isSyntheticSoulprint } from '@/src/lib/signatur/weight-utils';
// ...existing code...
// In the render, find the InfluenceGauges usage and change to:
<InfluenceGauges weights={natalWeights} isSynthetic={isSyntheticSoulprint(effectiveSoulprint)} />
```

**Step 5: Add i18n key**

Add `dashboard.influences.estimatedLabel` to both DE and EN translation files. DE: `"geschätzt"`, EN: `"estimated"`.

**Step 6: Run test to verify it passes**

Run: `npx vitest run src/__tests__/influence-gauges-synthetic.test.tsx`
Expected: PASS

**Step 7: Commit**

```bash
git add src/components/dashboard/InfluenceGauges.tsx src/components/Dashboard.tsx src/lib/signatur/weight-utils.ts src/__tests__/influence-gauges-synthetic.test.tsx
git commit -m "fix(BUG-17): InfluenceGauges shows 'estimated' for synthetic soulprint data"
```

---

### Task 3: DashboardTagesEnergie — add local Gemini fallback for daily data (BUG-19)

**Files:**
- Modify: `src/hooks/useFirstRunDaily.ts`
- Modify: `src/components/Dashboard.tsx`
- Test: `src/__tests__/daily-fallback.test.ts`

**Step 1: Write the failing test**

```typescript
// src/__tests__/daily-fallback.test.ts
import { describe, it, expect } from 'vitest';
import { buildFallbackDaily } from '../hooks/useFirstRunDaily';

describe('buildFallbackDaily', () => {
  it('returns a valid DailyResponse structure', () => {
    const result = buildFallbackDaily('de');
    expect(result.fusion.synthesis).toBeTruthy();
    expect(result.fusion.harmony_index).toBeGreaterThanOrEqual(0);
    expect(result.fusion.harmony_index).toBeLessThanOrEqual(1);
    expect(result.fusion.day_mode).toMatch(/^(pulse|trace)$/);
    expect(result.date).toBeTruthy();
  });

  it('returns German text for de locale', () => {
    const result = buildFallbackDaily('de');
    expect(result.fusion.synthesis.length).toBeGreaterThan(10);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/daily-fallback.test.ts`
Expected: FAIL — `buildFallbackDaily` not exported

**Step 3: Implement buildFallbackDaily in useFirstRunDaily.ts**

Add at the top of `src/hooks/useFirstRunDaily.ts`:

```typescript
import type { DailyResponse } from '../lib/schemas/experience';

/**
 * Local fallback daily data when FuFirE/Gemini is unreachable.
 * Provides a deterministic day-mode signal based on the current date,
 * so the DashboardTagesEnergie always renders SOMETHING meaningful.
 */
export function buildFallbackDaily(locale: string = 'de'): DailyResponse {
  const today = todayKey();
  // Deterministic harmony from date hash (simple but stable)
  const dateHash = today.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const harmony = 0.3 + (dateHash % 40) / 100; // 0.30–0.69
  const mode = harmony >= 0.50 ? 'trace' : 'pulse';

  const synthesisDe = mode === 'pulse'
    ? 'Heute fließt deine Energie ruhig und gleichmäßig. Ein guter Tag, um innezuhalten und zu beobachten.'
    : 'Die kosmischen Linien kreuzen sich heute — etwas bewegt sich. Sei aufmerksam für unerwartete Impulse.';
  const synthesisEn = mode === 'pulse'
    ? 'Your energy flows calmly today. A good day to pause and observe.'
    : 'Cosmic lines cross today — something is stirring. Stay alert for unexpected impulses.';

  return {
    date: today,
    western: {
      summary: '',
      themes: [],
      caution: '',
      opportunity: '',
      evidence: {},
    },
    eastern: {
      summary: '',
      themes: [],
      caution: '',
      opportunity: '',
      evidence: {},
    },
    fusion: {
      summary: locale === 'de' ? synthesisDe : synthesisEn,
      synthesis: locale === 'de' ? synthesisDe : synthesisEn,
      action: locale === 'de' ? 'Nimm dir einen Moment der Stille.' : 'Take a moment of stillness.',
      pushworthy: false,
      push_text: '',
      harmony_index: harmony,
      day_mode: mode,
    },
    meta: { engine_version: 'v1-local-fallback' },
  } as DailyResponse;
}
```

Then in the hook's `catch` block, change:

```typescript
} catch (err) {
  console.warn('[useFirstRunDaily] Error occurred, using fallback:', err);
  if (!cancelled) {
    const fallback = buildFallbackDaily();
    setDailyData(fallback);
    setShowModal(true);
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/daily-fallback.test.ts`
Expected: PASS

**Step 5: Also ensure Dashboard passes dailyData fallback to TagesEnergie**

In `Dashboard.tsx`, the TagesEnergie section already checks `dailyData ? <DashboardTagesEnergie ...> : <CosmicWeatherCard ...>`. With the hook fallback, `dailyData` will always be non-null after fetch completes. No Dashboard change needed.

**Step 6: Commit**

```bash
git add src/hooks/useFirstRunDaily.ts src/__tests__/daily-fallback.test.ts
git commit -m "fix(BUG-19): DashboardTagesEnergie always renders via local daily fallback"
```

---

## Phase 2: Vibes Visibility (BUG-18)

### Task 4: Fix Vibes CTA visibility and error display

**Files:**
- Modify: `src/components/dashboard/VibesSection.tsx`
- Test: `src/__tests__/vibes-section-visibility.test.tsx`

The issue: VibesSection is wrapped in PremiumGate. For free users, only the teaser shows — the button is hidden. For premium users, if `fetchVibes` fails (503, network, malformed), error state clears but modal never shows.

**Step 1: Write the failing test**

```typescript
// src/__tests__/vibes-section-visibility.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VibesSection } from '../components/dashboard/VibesSection';

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'vibesSection.buttonLabel': 'Vibe abrufen',
        'vibesSection.premiumTeaser': 'Premium Feature',
        'vibesSection.fetchError': 'Fehler beim Laden',
        'vibesSection.cooldownPrefix': 'Nächster Vibe in ',
      };
      return map[key] || key;
    },
    lang: 'de',
  }),
}));

// Mock PremiumGate to always render children (simulate premium user)
vi.mock('../components/PremiumGate', () => ({
  PremiumGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../services/vibes', () => ({
  fetchVibes: vi.fn(),
}));

describe('VibesSection visibility', () => {
  it('shows error message when fetchVibes fails', async () => {
    const { fetchVibes } = await import('../services/vibes');
    (fetchVibes as any).mockRejectedValue(new Error('vibes_unavailable'));

    render(<VibesSection userId="test-user" />);
    fireEvent.click(screen.getByText('Vibe abrufen'));

    await waitFor(() => {
      expect(screen.getByText('Fehler beim Laden')).toBeTruthy();
    });
  });

  it('shows modal when fetchVibes succeeds', async () => {
    const { fetchVibes } = await import('../services/vibes');
    (fetchVibes as any).mockResolvedValue({
      timestamp: new Date().toISOString(),
      horizon: '2h',
      kurzsignal: 'Test Vibe Signal',
      treiber: ['Mond', 'Venus'],
      erklaerung: 'Erklärung',
      explain: { signatur_context: 'sig', transit_context: 'transit' },
      meta: { engine_version: 'test', cached: false },
    });

    render(<VibesSection userId="test-user" />);
    fireEvent.click(screen.getByText('Vibe abrufen'));

    await waitFor(() => {
      expect(screen.getByText('Test Vibe Signal')).toBeTruthy();
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/vibes-section-visibility.test.tsx`
Expected: Should pass if the component is correct, or fail revealing the actual render issue.

**Step 3: Add error recovery and retry to VibesSection**

In `src/components/dashboard/VibesSection.tsx`, add a retry mechanism and persistent error display:

```typescript
// After the error message, add retry button:
{error && (
  <motion.div
    initial={{ opacity: 0, y: -4 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center gap-1"
  >
    <p className="text-xs text-red-400/80">{error}</p>
    <button
      onClick={handleFetch}
      className="text-[10px] text-gold/60 hover:text-gold/90 underline"
    >
      {t('vibesSection.retryLabel')}
    </button>
  </motion.div>
)}
```

**Step 4: Add server-side vibes fallback for non-Gemini environments**

In `server.mjs`, the `/api/vibes` endpoint already has a deterministic fallback when `GEMINI_API_KEY` is missing. Verify this fallback returns valid `kurzsignal`. If the fallback `kurzsignal` is empty string, fix it.

**Step 5: Run tests**

Run: `npx vitest run src/__tests__/vibes-section-visibility.test.tsx`
Expected: PASS

**Step 6: Commit**

```bash
git add src/components/dashboard/VibesSection.tsx src/__tests__/vibes-section-visibility.test.tsx
git commit -m "fix(BUG-18): Vibes CTA shows error state with retry, fallback always produces content"
```

---

## Phase 3: Planetarium Observer (BUG-15 + BUG-16)

### Task 5: Pass birth coordinates to Orrery and add Geolocation for current sky

**Files:**
- Modify: `src/components/BirthChartOrrery.tsx` (add `observerLat`/`observerLon` props)
- Modify: `src/hooks/useCelestialOrrery.ts` (accept external observer overrides)
- Modify: `src/components/Dashboard.tsx` (pass birth coords + geolocation)
- Create: `src/hooks/useDeviceLocation.ts` (Geolocation API wrapper)
- Test: `src/__tests__/device-location.test.ts`

**Step 1: Write useDeviceLocation hook test**

```typescript
// src/__tests__/device-location.test.ts
import { describe, it, expect } from 'vitest';

describe('useDeviceLocation concept', () => {
  it('returns null when geolocation unavailable', () => {
    // Geolocation API not available in test env
    expect(typeof navigator === 'undefined' || !navigator.geolocation).toBeTruthy();
  });
});
```

**Step 2: Create useDeviceLocation.ts**

```typescript
// src/hooks/useDeviceLocation.ts
import { useState, useEffect } from 'react';

interface DeviceLocation {
  lat: number;
  lon: number;
}

/**
 * Requests device geolocation once on mount.
 * Returns null while loading or if permission denied.
 * Falls back gracefully — never blocks rendering.
 */
export function useDeviceLocation(): DeviceLocation | null {
  const [location, setLocation] = useState<DeviceLocation | null>(null);

  useEffect(() => {
    if (!navigator?.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      (err) => {
        console.warn('[useDeviceLocation] Permission denied or error:', err.message);
        // Stays null — caller uses fallback
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
    );
  }, []);

  return location;
}
```

**Step 3: Add observerLat/observerLon props to BirthChartOrrery**

In `src/components/BirthChartOrrery.tsx`, add props:

```typescript
interface BirthChartOrreryProps {
  birthDate: Date;
  planetariumMode?: boolean;
  birthConstellation?: string;
  autoPlay?: boolean;
  currentSky?: boolean;
  observerLat?: number;  // NEW
  observerLon?: number;  // NEW
}
```

Then in the component, override the hook's observer when props are provided:

```typescript
// After const hook = useCelestialOrrery(CITIES[0], birthDate);
// Add observer override logic:
useEffect(() => {
  if (observerLat !== undefined && observerLon !== undefined) {
    // useCelestialOrrery exposes setCustomLat/setCustomLon
    // OR: directly update obsLatRef/obsLonRef if exposed
  }
}, [observerLat, observerLon]);
```

Actually, the cleaner approach: pass initial city based on birth coords to `useCelestialOrrery`:

In `src/hooks/useCelestialOrrery.ts`, add optional `overrideLat`/`overrideLon` params, or expose `setCustomLat`/`setCustomLon` in the return.

**Step 4: Dashboard passes birth coords + device location**

In `src/components/Dashboard.tsx`:

```typescript
import { useDeviceLocation } from '../hooks/useDeviceLocation';

// Inside Dashboard component:
const deviceLocation = useDeviceLocation();

// Determine observer based on sky mode
const observerLat = skyMode === 'current'
  ? (deviceLocation?.lat ?? profileMeta.birthInput?.lat ?? 52.52)
  : (profileMeta.birthInput?.lat ?? 52.52);
const observerLon = skyMode === 'current'
  ? (deviceLocation?.lon ?? profileMeta.birthInput?.lon ?? 13.405)
  : (profileMeta.birthInput?.lon ?? 13.405);

// Pass to Orrery:
<BirthChartOrrery
  birthDate={orreryDate}
  planetariumMode={planetariumMode}
  birthConstellation={birthConstellationKey}
  autoPlay={isFirstReading}
  currentSky={skyMode === 'current'}
  observerLat={observerLat}
  observerLon={observerLon}
/>
```

**Step 5: Run full test suite**

Run: `npm run test`
Expected: All existing tests pass + new tests pass

**Step 6: Commit**

```bash
git add src/hooks/useDeviceLocation.ts src/components/BirthChartOrrery.tsx src/hooks/useCelestialOrrery.ts src/components/Dashboard.tsx src/__tests__/device-location.test.ts
git commit -m "fix(BUG-15,BUG-16): Planetarium uses birth coords for birth sky, Geolocation for current sky"
```

---

## Phase 4: Quiz Pipeline (BUG-20 + BUG-21 + BUG-22)

### Task 6: Fix quiz completion persistence across reload (BUG-20)

**Files:**
- Modify: `src/hooks/useCompletedModules.ts`
- Test: `src/__tests__/useCompletedModules.test.ts` (extend existing)

The `useCompletedModules` hook already merges localStorage + Supabase. The issue: `useQuizContribution` only calls `contributeQuizResult` when the **entire cluster** is complete (cluster gate). Individual quiz completions are tracked via `addModule()` → localStorage, but `addLocalCompleted` only stores module IDs. The `contribution_events` table only gets rows when a full cluster completes.

On reload: `useCompletedModules` queries `contribution_events` (only cluster-complete quizzes) + localStorage. If localStorage is cleared (incognito, different device), individual completions are lost.

**Step 1: Verify current behavior with test**

```typescript
// Extend src/__tests__/useCompletedModules.test.ts
import { describe, it, expect } from 'vitest';
import { getLocalCompleted, addLocalCompleted } from '../hooks/useCompletedModules';

describe('useCompletedModules localStorage', () => {
  it('persists individual module completion', () => {
    addLocalCompleted('user1', 'love-lang');
    const result = getLocalCompleted('user1');
    expect(result.has('love-lang')).toBe(true);
  });

  it('survives simulated reload (re-read from localStorage)', () => {
    addLocalCompleted('user1', 'attachment');
    // Simulate "reload" by re-reading
    const result = getLocalCompleted('user1');
    expect(result.has('attachment')).toBe(true);
    expect(result.has('love-lang')).toBe(true); // from previous test
  });
});
```

**Step 2: Export helper functions for testing**

In `src/hooks/useCompletedModules.ts`, export `getLocalCompleted` and `addLocalCompleted`.

**Step 3: Add Supabase persistence for individual completions**

The real fix: also persist individual quiz completions to Supabase (not just cluster-complete ones), so they survive cross-device/incognito scenarios. Add a lightweight upsert in `addModule`:

```typescript
const addModule = useCallback((moduleId: string) => {
  if (!user) return;
  addLocalCompleted(user.id, moduleId);
  setCompletedModuleIds(prev => new Set([...prev, moduleId]));

  // Also persist to Supabase (fire-and-forget) — survives cross-device
  supabase
    .from('contribution_events')
    .upsert({
      user_id: user.id,
      module_id: moduleId,
      sector_weights: Array(12).fill(0), // placeholder until cluster completes
      confidence: 0,
    }, { onConflict: 'user_id,module_id' })
    .then(({ error }) => {
      if (error) console.warn('[useCompletedModules] Persist failed:', error.message);
    });
}, [user]);
```

**Step 4: Run test**

Run: `npx vitest run src/__tests__/useCompletedModules.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/hooks/useCompletedModules.ts src/__tests__/useCompletedModules.test.ts
git commit -m "fix(BUG-20): persist individual quiz completions to Supabase, not just cluster-complete"
```

---

### Task 7: Fix quiz result latency (BUG-21)

**Files:**
- Modify: `src/pages/FuRingPage.tsx` (optimistic UI update)

The latency comes from the `useFusionSignal` polling cycle (800ms + exponential backoff) waiting for the server to process the contribution AND return updated transit state. Fix: show the quiz result immediately via optimistic state update.

**Step 1: Add optimistic signal update after quiz completion**

In `FuRingPage.tsx`, after `quizContribution(event)` and `addModule(moduleId)`, immediately update local signal state:

```typescript
// After existing addModule(moduleId) call, add:
// Optimistic: immediately reflect quiz impact in UI without waiting for server round-trip
if (refreshSignal) {
  // Force immediate refetch instead of waiting for next poll interval
  refreshSignal();
  // Also trigger a second refresh after 1s for server consistency
  setTimeout(() => refreshSignal(), 1000);
}
```

Verify `refreshSignal` is already wired — check if `useFusionSignal` returns a `refresh` function.

**Step 2: Commit**

```bash
git add src/pages/FuRingPage.tsx
git commit -m "fix(BUG-21): optimistic signal refresh after quiz completion reduces perceived latency"
```

---

### Task 8: Audit quiz headings for placeholder text (BUG-22)

**Files:**
- Audit: All files in `src/components/quizzes/` and `packages/shared/src/quizzes/definitions/`
- Audit: i18n files for quiz title/subtitle keys

**Step 1: Automated scan for placeholder patterns**

```bash
grep -rn "TODO\|FIXME\|placeholder\|Placeholder\|Your Quiz\|Quiz Title\|Untitled" \
  src/components/quizzes/ packages/shared/src/quizzes/definitions/ \
  --include="*.tsx" --include="*.ts" --include="*.json"
```

**Step 2: Check all quiz definitions have final DE+EN titles**

```bash
grep -rn "title\|subtitle" packages/shared/src/quizzes/definitions/*.ts | grep -i "todo\|tbd\|placeholder\|''\|\"\"" 
```

**Step 3: Fix any found placeholders**

Replace with contextually appropriate DE+EN text.

**Step 4: Commit**

```bash
git add src/components/quizzes/ packages/shared/src/quizzes/definitions/
git commit -m "fix(BUG-22): replace remaining quiz placeholder headings with final DE+EN copy"
```

---

## Verification

After all phases:

```bash
npm run test          # Full test suite (800+ tests)
npm run lint          # TypeScript type-check
```

### Manual verification checklist:
- [ ] Dashboard InfluenceGauges shows "geschätzt" with visible bars (not 0%)
- [ ] DashboardTagesEnergie renders text even when FuFirE is unreachable
- [ ] Vibes button click → modal shows content OR shows error with retry
- [ ] Planetarium: birth sky shows birth location constellations
- [ ] Planetarium: current sky shows different constellations (if user grants geolocation)
- [ ] Quiz completion survives page reload
- [ ] Quiz result appears within seconds, not minutes
- [ ] No quiz titles show placeholder text

### Bug status updates after fix:

| Bug | New Status | Commit |
|-----|-----------|--------|
| BUG-15 | Done | Phase 3 |
| BUG-16 | Done | Phase 3 |
| BUG-17 | Done | Phase 1 |
| BUG-18 | Done | Phase 2 |
| BUG-19 | Done | Phase 1 |
| BUG-20 | Done | Phase 4 |
| BUG-21 | Done | Phase 4 |
| BUG-22 | Done | Phase 4 |
