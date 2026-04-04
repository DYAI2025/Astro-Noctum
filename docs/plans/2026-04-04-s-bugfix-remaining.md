# Current Sky Live Location Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** When the Dashboard orrery is in "current sky" mode, use the browser Geolocation API for the observer position so constellations/horizon render accurately for the user's real location. Fallback chain: last granted position -> profile birth location -> Berlin default.

**Architecture:** New `useCurrentLocation` hook wraps the Geolocation API with permission tracking and caching. `BirthChartOrrery` gets new optional `observerLat`/`observerLon` props that override the default `CITIES[0]` coordinates. `Dashboard.tsx` wires the hook output into the orrery when `currentSky` is active. A small fallback badge shows which location source is active.

**Tech Stack:** React 19, TypeScript, Vitest, navigator.geolocation API, localStorage (cache last-known position)

---

### Task 1: Create `useCurrentLocation` hook

**Files:**
- Create: `src/hooks/useCurrentLocation.ts`
- Create: `src/__tests__/use-current-location.test.ts`

**Step 1: Write the test file**

Create `src/__tests__/use-current-location.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCurrentLocation } from '../hooks/useCurrentLocation';

// ── Mock localStorage ────────────────────────────────────────────────────────
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// ── Mock navigator.geolocation ───────────────────────────────────────────────
type GeoSuccess = (pos: { coords: { latitude: number; longitude: number; accuracy: number } }) => void;
type GeoError = (err: { code: number; message: string }) => void;

let mockGetCurrentPosition: ReturnType<typeof vi.fn>;
let mockPermissionsQuery: ReturnType<typeof vi.fn>;

beforeEach(() => {
  localStorageMock.clear();

  mockGetCurrentPosition = vi.fn();
  Object.defineProperty(navigator, 'geolocation', {
    value: { getCurrentPosition: mockGetCurrentPosition },
    writable: true,
    configurable: true,
  });

  mockPermissionsQuery = vi.fn().mockResolvedValue({ state: 'prompt' });
  Object.defineProperty(navigator, 'permissions', {
    value: { query: mockPermissionsQuery },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useCurrentLocation', () => {
  it('returns null coords and "idle" status initially when not enabled', () => {
    const { result } = renderHook(() => useCurrentLocation({ enabled: false }));
    expect(result.current.latitude).toBeNull();
    expect(result.current.longitude).toBeNull();
    expect(result.current.source).toBe('none');
  });

  it('resolves to live coords when geolocation succeeds', async () => {
    mockGetCurrentPosition.mockImplementation((success: GeoSuccess) => {
      success({ coords: { latitude: 48.8566, longitude: 2.3522, accuracy: 50 } });
    });

    const { result } = renderHook(() => useCurrentLocation({ enabled: true }));

    // Wait for the async effect to settle
    await act(async () => { await new Promise(r => setTimeout(r, 0)); });

    expect(result.current.latitude).toBe(48.8566);
    expect(result.current.longitude).toBe(2.3522);
    expect(result.current.source).toBe('live');
    expect(result.current.permissionState).toBe('granted');
  });

  it('falls back to cached position when geolocation is denied', async () => {
    // Pre-seed localStorage cache
    localStorageMock.setItem('bazodiac_last_location', JSON.stringify({
      latitude: 40.7128,
      longitude: -74.006,
      timestamp: Date.now(),
    }));

    mockGetCurrentPosition.mockImplementation((_s: GeoSuccess, error: GeoError) => {
      error({ code: 1, message: 'User denied Geolocation' });
    });

    const { result } = renderHook(() => useCurrentLocation({ enabled: true }));

    await act(async () => { await new Promise(r => setTimeout(r, 0)); });

    expect(result.current.latitude).toBe(40.7128);
    expect(result.current.longitude).toBe(-74.006);
    expect(result.current.source).toBe('cached');
    expect(result.current.permissionState).toBe('denied');
  });

  it('falls back to provided fallback coords when no cache exists and geolocation denied', async () => {
    mockGetCurrentPosition.mockImplementation((_s: GeoSuccess, error: GeoError) => {
      error({ code: 1, message: 'User denied Geolocation' });
    });

    const { result } = renderHook(() =>
      useCurrentLocation({
        enabled: true,
        fallbackLat: 52.52,
        fallbackLon: 13.405,
      }),
    );

    await act(async () => { await new Promise(r => setTimeout(r, 0)); });

    expect(result.current.latitude).toBe(52.52);
    expect(result.current.longitude).toBe(13.405);
    expect(result.current.source).toBe('fallback');
  });

  it('caches successful position to localStorage', async () => {
    mockGetCurrentPosition.mockImplementation((success: GeoSuccess) => {
      success({ coords: { latitude: 35.69, longitude: 139.69, accuracy: 100 } });
    });

    renderHook(() => useCurrentLocation({ enabled: true }));

    await act(async () => { await new Promise(r => setTimeout(r, 0)); });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'bazodiac_last_location',
      expect.stringContaining('"latitude":35.69'),
    );
  });

  it('returns null when disabled even if fallback provided', () => {
    const { result } = renderHook(() =>
      useCurrentLocation({ enabled: false, fallbackLat: 52.52, fallbackLon: 13.405 }),
    );
    expect(result.current.latitude).toBeNull();
    expect(result.current.longitude).toBeNull();
    expect(result.current.source).toBe('none');
  });
});
```

**Step 2: Verify test fails (no implementation yet)**

```bash
npx vitest run src/__tests__/use-current-location.test.ts
```

Expected: FAIL (module not found)

**Step 3: Implement the hook**

Create `src/hooks/useCurrentLocation.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

export type LocationSource = 'none' | 'live' | 'cached' | 'fallback';
export type PermissionState = 'prompt' | 'granted' | 'denied' | 'unavailable';

export interface UseCurrentLocationOptions {
  /** Whether to actively request geolocation. When false, hook returns nulls. */
  enabled: boolean;
  /** Fallback latitude (e.g. birth location) when geolocation unavailable and no cache. */
  fallbackLat?: number;
  /** Fallback longitude. */
  fallbackLon?: number;
}

export interface UseCurrentLocationResult {
  latitude: number | null;
  longitude: number | null;
  source: LocationSource;
  permissionState: PermissionState;
  /** Re-request location (e.g. after user grants permission). */
  refresh: () => void;
}

// ── Constants ────────────────────────────────────────────────────────────────

const CACHE_KEY = 'bazodiac_last_location';
/** Max age of cached position in ms (24 hours). */
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000;

// ── Helpers ──────────────────────────────────────────────────────────────────

interface CachedLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
}

function readCache(): CachedLocation | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: CachedLocation = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > CACHE_MAX_AGE) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(lat: number, lon: number): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      latitude: lat,
      longitude: lon,
      timestamp: Date.now(),
    }));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useCurrentLocation(options: UseCurrentLocationOptions): UseCurrentLocationResult {
  const { enabled, fallbackLat, fallbackLon } = options;

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [source, setSource] = useState<LocationSource>('none');
  const [permissionState, setPermissionState] = useState<PermissionState>('prompt');
  const [requestCount, setRequestCount] = useState(0);

  const refresh = useCallback(() => {
    setRequestCount(c => c + 1);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLatitude(null);
      setLongitude(null);
      setSource('none');
      return;
    }

    if (!navigator.geolocation) {
      setPermissionState('unavailable');
      // Try cache, then fallback
      const cached = readCache();
      if (cached) {
        setLatitude(cached.latitude);
        setLongitude(cached.longitude);
        setSource('cached');
      } else if (fallbackLat != null && fallbackLon != null) {
        setLatitude(fallbackLat);
        setLongitude(fallbackLon);
        setSource('fallback');
      }
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lon } = position.coords;
        setLatitude(lat);
        setLongitude(lon);
        setSource('live');
        setPermissionState('granted');
        writeCache(lat, lon);
      },
      (error) => {
        const denied = error.code === 1; // PERMISSION_DENIED
        setPermissionState(denied ? 'denied' : 'prompt');

        // Fallback chain: cache → provided fallback → null
        const cached = readCache();
        if (cached) {
          setLatitude(cached.latitude);
          setLongitude(cached.longitude);
          setSource('cached');
        } else if (fallbackLat != null && fallbackLon != null) {
          setLatitude(fallbackLat);
          setLongitude(fallbackLon);
          setSource('fallback');
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 5 * 60 * 1000, // Accept 5-min-old position
      },
    );
  }, [enabled, fallbackLat, fallbackLon, requestCount]);

  return { latitude, longitude, source, permissionState, refresh };
}
```

**Step 4: Verify tests pass**

```bash
npx vitest run src/__tests__/use-current-location.test.ts
```

Expected: PASS (all 6 tests)

**Step 5: Commit**

```bash
git add src/hooks/useCurrentLocation.ts src/__tests__/use-current-location.test.ts
git commit -m "feat(sky): add useCurrentLocation hook with geolocation + fallback chain"
```

---

### Task 2: Add observer coordinate props to BirthChartOrrery

**Files:**
- Modify: `src/components/BirthChartOrrery.tsx`

**Step 1: Extend BirthChartOrreryProps**

In `src/components/BirthChartOrrery.tsx`, update the props interface at ~line 123:

```typescript
// BEFORE:
interface BirthChartOrreryProps {
  birthDate: Date;
  planetariumMode?: boolean;
  birthConstellation?: string;
  /** Auto-start time-lapse on mount (first visit experience) */
  autoPlay?: boolean;
  /** When true, override simTime to "now" (current sky) instead of birth date */
  currentSky?: boolean;
}

// AFTER:
interface BirthChartOrreryProps {
  birthDate: Date;
  planetariumMode?: boolean;
  birthConstellation?: string;
  /** Auto-start time-lapse on mount (first visit experience) */
  autoPlay?: boolean;
  /** When true, override simTime to "now" (current sky) instead of birth date */
  currentSky?: boolean;
  /** Override observer latitude (for current-sky live location) */
  observerLatOverride?: number;
  /** Override observer longitude (for current-sky live location) */
  observerLonOverride?: number;
}
```

**Step 2: Destructure new props and sync to hook**

Update the component function signature at ~line 137:

```typescript
// BEFORE:
export function BirthChartOrrery({
  birthDate,
  planetariumMode = false,
  birthConstellation,
  autoPlay = false,
  currentSky = false,
}: BirthChartOrreryProps) {

// AFTER:
export function BirthChartOrrery({
  birthDate,
  planetariumMode = false,
  birthConstellation,
  autoPlay = false,
  currentSky = false,
  observerLatOverride,
  observerLonOverride,
}: BirthChartOrreryProps) {
```

**Step 3: Add effect to sync observer override into the hook**

After the `currentSky` sync effect (~line 179), add:

```typescript
  // Sync observer location override (live geolocation for current-sky mode)
  useEffect(() => {
    if (observerLatOverride != null && observerLonOverride != null) {
      hook.api.setObserverLocation(observerLatOverride, observerLonOverride);
    }
  }, [observerLatOverride, observerLonOverride, hook.api]);
```

**Step 4: Run existing tests**

```bash
npx vitest run src/__tests__/birth-chart-orrery.test.tsx
```

Expected: PASS (no behavior change for existing callers — new props are optional)

**Step 5: Commit**

```bash
git add src/components/BirthChartOrrery.tsx
git commit -m "feat(sky): add observerLat/Lon override props to BirthChartOrrery"
```

---

### Task 3: Wire useCurrentLocation into Dashboard

**Files:**
- Modify: `src/components/Dashboard.tsx`

**Step 1: Import the hook**

At the top of `src/components/Dashboard.tsx`, add the import alongside other hook imports:

```typescript
import { useCurrentLocation } from '../hooks/useCurrentLocation';
```

**Step 2: Call the hook inside the Dashboard component**

After the `usePlanetarium()` call (~line 115), add:

```typescript
  // Live geolocation for current-sky mode
  const birthLat = profileMeta?.birthInput?.lat;
  const birthLon = profileMeta?.birthInput?.lon;
  const currentLocation = useCurrentLocation({
    enabled: skyMode === 'current',
    fallbackLat: birthLat,
    fallbackLon: birthLon,
  });
```

Note: `profileMeta` is already defined above this line. Since `profileMeta` may not be loaded yet when the hook first runs, the fallback props will be `undefined` initially — the hook handles this gracefully (no fallback until values appear). When `profileMeta` loads and `birthLat`/`birthLon` become defined, the hook re-runs because the deps change.

**Step 3: Pass coordinates to BirthChartOrrery**

Update the `<BirthChartOrrery>` JSX at ~line 355:

```tsx
// BEFORE:
<BirthChartOrrery
  birthDate={orreryDate}
  planetariumMode={planetariumMode}
  birthConstellation={birthConstellationKey}
  autoPlay={isFirstReading}
  currentSky={skyMode === 'current'}
/>

// AFTER:
<BirthChartOrrery
  birthDate={orreryDate}
  planetariumMode={planetariumMode}
  birthConstellation={birthConstellationKey}
  autoPlay={isFirstReading}
  currentSky={skyMode === 'current'}
  observerLatOverride={skyMode === 'current' ? (currentLocation.latitude ?? undefined) : undefined}
  observerLonOverride={skyMode === 'current' ? (currentLocation.longitude ?? undefined) : undefined}
/>
```

**Step 4: Run lint + tests**

```bash
npm run lint
npx vitest run src/__tests__/dashboard.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/Dashboard.tsx
git commit -m "feat(sky): wire live geolocation into Dashboard orrery for current-sky mode"
```

---

### Task 4: Add fallback location badge UI

**Files:**
- Create: `src/components/dashboard/LocationSourceBadge.tsx`

**Step 1: Implement the badge component**

Create `src/components/dashboard/LocationSourceBadge.tsx`:

```typescript
import { useLanguage } from '../../contexts/LanguageContext';
import type { LocationSource, PermissionState } from '../../hooks/useCurrentLocation';

interface LocationSourceBadgeProps {
  source: LocationSource;
  permissionState: PermissionState;
  onRequestPermission?: () => void;
}

const SOURCE_LABELS: Record<LocationSource, { de: string; en: string }> = {
  none:     { de: '',                        en: '' },
  live:     { de: 'Dein Standort',           en: 'Your location' },
  cached:   { de: 'Letzter Standort',        en: 'Last known location' },
  fallback: { de: 'Geburtsort',              en: 'Birth location' },
};

export function LocationSourceBadge({ source, permissionState, onRequestPermission }: LocationSourceBadgeProps) {
  const { lang } = useLanguage();

  if (source === 'none') return null;

  const label = SOURCE_LABELS[source][lang === 'de' ? 'de' : 'en'];
  const showGrantHint = permissionState === 'denied' && source !== 'live';

  return (
    <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${
        source === 'live' ? 'bg-emerald-400' : 'bg-amber-400'
      }`} />
      <span>{label}</span>
      {showGrantHint && onRequestPermission && (
        <button
          onClick={onRequestPermission}
          className="underline text-gold/70 hover:text-gold transition-colors ml-1"
        >
          {lang === 'de' ? 'Standort freigeben' : 'Share location'}
        </button>
      )}
    </div>
  );
}
```

**Step 2: Mount the badge in Dashboard below the orrery**

In `src/components/Dashboard.tsx`, import the badge:

```typescript
import { LocationSourceBadge } from './dashboard/LocationSourceBadge';
```

Then after the `</Suspense>` that wraps `BirthChartOrrery` (~line 362), before the closing `</motion.div>`, add:

```tsx
{skyMode === 'current' && (
  <div className="px-4 md:px-6 mt-1">
    <LocationSourceBadge
      source={currentLocation.source}
      permissionState={currentLocation.permissionState}
      onRequestPermission={currentLocation.refresh}
    />
  </div>
)}
```

**Step 3: Run lint + tests**

```bash
npm run lint
npm run test
```

Expected: PASS

**Step 4: Commit**

```bash
git add src/components/dashboard/LocationSourceBadge.tsx src/components/Dashboard.tsx
git commit -m "feat(sky): add LocationSourceBadge showing which location is used for current sky"
```

---

### Summary

| # | What | Files | Commit message |
|---|------|-------|---------------|
| 1 | `useCurrentLocation` hook + tests | `src/hooks/useCurrentLocation.ts`, `src/__tests__/use-current-location.test.ts` | `feat(sky): add useCurrentLocation hook with geolocation + fallback chain` |
| 2 | Extend BirthChartOrrery props | `src/components/BirthChartOrrery.tsx` | `feat(sky): add observerLat/Lon override props to BirthChartOrrery` |
| 3 | Wire into Dashboard | `src/components/Dashboard.tsx` | `feat(sky): wire live geolocation into Dashboard orrery for current-sky mode` |
| 4 | Fallback badge UI | `src/components/dashboard/LocationSourceBadge.tsx`, `src/components/Dashboard.tsx` | `feat(sky): add LocationSourceBadge showing which location is used for current sky` |

**Fallback chain:** Browser Geolocation (live) -> localStorage cache (last 24h) -> profile birth_lat/birth_lng -> Berlin default (CITIES[0] in hook).

**Edge cases handled:**
- Geolocation API not available (old browsers): `permissionState` = `'unavailable'`, falls through to cache/fallback
- User denies permission: shows cached or birth location with "Share location" re-prompt button
- `enabled: false` when `skyMode !== 'current'`: hook returns null, orrery uses its default CITIES[0]
- Profile not yet loaded: fallback coords are `undefined` until `profileMeta` resolves, hook re-runs when they appear
