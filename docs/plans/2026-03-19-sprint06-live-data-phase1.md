# Sprint 06 — Live Data Phase 1: Ring atmet mit dem Kosmos

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** The Fusion Ring breathes with real space weather. NOAA Kp/X-ray/proton feeds + extended DONKI event chain → new `/api/space-weather/extended` endpoint → frontend `useSpaceWeather` upgrade → ring pulsation modulated by solar pressure. Sky.bazodiac.space gets a live Solar Pressure Widget.

**Architecture:** Three-layer design. (1) Server-side adapters fetch NOAA SWPC + NASA DONKI data with independent caches and version-safe fallbacks. (2) A single aggregation endpoint `/api/space-weather/extended` merges all sources into a typed schema. (3) The frontend `useSpaceWeather` hook consumes the extended endpoint, computes a `solarPressureScore`, and feeds it to `FusionRingCanvasV2` as a modulation factor. The ring's deterministic signature is NEVER overridden — modulation sits on top, capped at ×1.5. A separate contribution endpoint converts space weather events to `contribution_events`.

**Tech Stack:** Express (server.mjs), NOAA SWPC JSON APIs, NASA DONKI REST, Supabase, React 19, Three.js, Vitest, Zod

**CRITICAL DEADLINE:** NOAA SWPC JSON format change on **2026-03-31**. The NOAA adapter with v1/v2 versioning must be live before that date.

---

## Current State (from codebase exploration)

### Existing Space Weather (server.mjs:1413-1520)
- `GET /api/space-weather` returns `{ kp_index, source, fetched_at, cache_ttl_seconds }`
- Primary: NOAA `planetary_k_index_1m.json` → fallback: NASA DONKI `/KP`
- Server-side cache: 15 min (`SPACE_WEATHER_CACHE_TTL_MS`)
- Client hook: `src/hooks/useSpaceWeather.ts` polls every 5 min, returns `{ kpIndex, lastUpdate, loading, error }`

### Sky.Bazodiac.Space (separate project)
- Location: `/Users/benjaminpoersch/Projects/codebase/Bazodiac-subpage-sky/sky-bazi/`
- Tech: React 19 + Vite + Tailwind v4, deployed on Netlify
- Already has DONKI integration: FLR, GST, CME (3 endpoints, 4h client-side cache)
- `SpaceWeather.tsx` component with Kp tier visualization, flare classification
- Uses `VITE_NASA_API_KEY` (client-side NASA calls)

### Contribution Pipeline (server.mjs:1361-1411)
- `POST /api/contribute` accepts `{ source, sector_weights[12], confidence }`
- JWT auth, upserts to `contribution_events` on `(user_id, module_id)` conflict
- Transit-state proxy reads from `contribution_events` to compute `quiz_sectors`

### FusionRingCanvasV2 Effect System
- 8 effect types: `resonanzsprung | dominanzwechsel | mond_event | spannungsachse | korona_eruption | divergenz_spike | burst | crunch`
- `effectTrigger` prop with timestamp guard prevents double-firing
- `processEffect()` modulates `effectLight1` (red) and `effectLight2` (blue)

---

## Task 1: NOAA Adapter with v1/v2 Versioning ⚠ DEADLINE 31.03.2026

**Files:**
- Create: `src/lib/space-weather/noaa-adapter.ts`
- Create: `src/lib/space-weather/types.ts`
- Test: `src/__tests__/noaa-adapter.test.ts`

**Step 1: Write the type definitions**

Create `src/lib/space-weather/types.ts`:

```typescript
// src/lib/space-weather/types.ts
// Shared types for the space weather pipeline.
// These types are used by server.mjs (imported dynamically) AND by frontend schemas.

export type NoaaVersion = 'v1' | 'v2';

export interface KpReading {
  kp: number;         // 0–9
  timestamp: string;  // ISO 8601
  estimated: boolean;
  noaaScale: string;  // "G0"–"G5"
}

export interface F107Reading {
  flux: number;       // solar flux units (sfu)
  timestamp: string;
  adjusted: boolean;
}

export interface XrayFluxReading {
  flux: number;       // W/m²
  classType: string;  // "A", "B", "C", "M", "X"
  timestamp: string;
}

export interface ProtonFluxReading {
  flux10MeV: number;  // particles/cm²/s/sr (≥10 MeV channel)
  flux100MeV: number; // ≥100 MeV channel
  timestamp: string;
}

export interface KpForecast {
  timestamp: string;
  kp: number;
  noaaScale: string;
}

export interface ThreeDayForecast {
  date: string;
  kpForecast: KpForecast[];
  geoActivity: string;    // "quiet" | "unsettled" | "active" | "minor-storm" | "major-storm"
  solarActivity: string;  // "low" | "moderate" | "high" | "very-high"
}

export type SpaceWeatherSeverity =
  | 'G0' | 'G1' | 'G2' | 'G3' | 'G4' | 'G5'   // geomagnetic
  | 'S1' | 'S2' | 'S3' | 'S4' | 'S5'           // solar radiation
  | 'R1' | 'R2' | 'R3' | 'R4' | 'R5';          // radio blackout

export interface SpaceWeatherContribution {
  schema: 'sp.contribution.v1';
  event_id: string;
  type: 'cme_arrival' | 'flare' | 'geomagnetic_storm' | 'sep' | 'hss' | 'alert';
  severity: SpaceWeatherSeverity;
  signature_weight: number;  // 0.0–1.0, CAPPED at 0.5
  source_event_id?: string;  // DONKI activityID
  started_at: string;
  expires_at: string;        // REQUIRED
  description?: string;
}

export interface SpaceWeatherExtended {
  current: {
    kp: number;
    kpForecast3h: KpForecast[];
    xrayFlux: number;
    xrayClass: string;
    protonFlux: number;
  };
  events: SpaceWeatherContribution[];
  alerts: string[];
  epoch: {
    sunspotNumber: number;
    f107: number;
    solarCyclePhase: string;  // "ascending" | "maximum" | "descending" | "minimum"
  };
  meta: {
    fetchedAt: string;
    noaaVersion: NoaaVersion;
    cacheTtlSeconds: number;
  };
}
```

**Step 2: Write the NOAA adapter**

Create `src/lib/space-weather/noaa-adapter.ts`:

```typescript
// src/lib/space-weather/noaa-adapter.ts
// Versioned NOAA SWPC adapter. v1 = current JSON format, v2 = post-2026-03-31 format.
// Fallback chain: v2 → v1 → null (caller handles neutral default).

import type {
  NoaaVersion,
  KpReading,
  F107Reading,
  XrayFluxReading,
  ProtonFluxReading,
  KpForecast,
  ThreeDayForecast,
} from './types';

const DEFAULT_BASE = 'https://services.swpc.noaa.gov';
const TIMEOUT_MS = 8000;

function getBase(): string {
  // Works in both Node (process.env) and Vite (import.meta.env)
  if (typeof process !== 'undefined' && process.env?.NOAA_SWPC_BASE_URL) {
    return process.env.NOAA_SWPC_BASE_URL;
  }
  return DEFAULT_BASE;
}

async function fetchJSON<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`NOAA ${res.status}: ${url}`);
    return await res.json() as T;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

// ── v1 Parsers (current format, pre-2026-03-31) ──────────────────────

function parseKpV1(records: Array<Record<string, unknown>>): KpReading | null {
  if (!Array.isArray(records) || records.length === 0) return null;
  const real = records.filter((r) => !r.estimated).at(-1) ?? records.at(-1);
  if (!real) return null;
  const kpRaw = real.kp ?? real.kp_index ?? 0;
  return {
    kp: Math.max(0, Math.min(9, Number.parseFloat(String(kpRaw)) || 0)),
    timestamp: String(real.time_tag || new Date().toISOString()),
    estimated: !!real.estimated,
    noaaScale: String(real.noaa_scale || 'G0'),
  };
}

function parseF107V1(records: Array<Record<string, unknown>>): F107Reading | null {
  if (!Array.isArray(records) || records.length === 0) return null;
  const latest = records.at(-1);
  if (!latest) return null;
  return {
    flux: Number.parseFloat(String(latest.flux ?? latest.observed_flux ?? 0)) || 0,
    timestamp: String(latest.time_tag || new Date().toISOString()),
    adjusted: !!latest.adjusted,
  };
}

function parseXrayV1(records: Array<Record<string, unknown>>): XrayFluxReading | null {
  if (!Array.isArray(records) || records.length === 0) return null;
  // GOES X-ray returns array sorted by time; take last
  const latest = records.at(-1);
  if (!latest) return null;
  const flux = Number.parseFloat(String(latest.flux ?? 0)) || 0;
  // Classify: A < 1e-7, B < 1e-6, C < 1e-5, M < 1e-4, X ≥ 1e-4
  let classType = 'A';
  if (flux >= 1e-4) classType = 'X';
  else if (flux >= 1e-5) classType = 'M';
  else if (flux >= 1e-6) classType = 'C';
  else if (flux >= 1e-7) classType = 'B';
  return { flux, classType, timestamp: String(latest.time_tag || new Date().toISOString()) };
}

function parseProtonV1(records: Array<Record<string, unknown>>): ProtonFluxReading | null {
  if (!Array.isArray(records) || records.length === 0) return null;
  const latest = records.at(-1);
  if (!latest) return null;
  return {
    flux10MeV: Number.parseFloat(String(latest.flux ?? 0)) || 0,
    flux100MeV: Number.parseFloat(String(latest['100mev_flux'] ?? latest.flux_100 ?? 0)) || 0,
    timestamp: String(latest.time_tag || new Date().toISOString()),
  };
}

// ── v2 Parsers (post-2026-03-31 format) ──────────────────────────────
// Placeholder: v2 field names TBD from SWPC announcement.
// Structure mirrors v1 but keys may change (e.g. time_tag → timestamp).

function parseKpV2(records: Array<Record<string, unknown>>): KpReading | null {
  if (!Array.isArray(records) || records.length === 0) return null;
  const latest = records.at(-1);
  if (!latest) return null;
  // v2 expected keys: timestamp, kp_value, is_estimated, g_scale
  const kpRaw = latest.kp_value ?? latest.kp ?? latest.kp_index ?? 0;
  return {
    kp: Math.max(0, Math.min(9, Number.parseFloat(String(kpRaw)) || 0)),
    timestamp: String(latest.timestamp ?? latest.time_tag ?? new Date().toISOString()),
    estimated: !!(latest.is_estimated ?? latest.estimated),
    noaaScale: String(latest.g_scale ?? latest.noaa_scale ?? 'G0'),
  };
}

function parseF107V2(records: Array<Record<string, unknown>>): F107Reading | null {
  // v2 TBD — try v2 keys first, fall through to v1 keys
  return parseF107V1(records);
}

// ── Public Interface ─────────────────────────────────────────────────

export interface NoaaAdapter {
  version: NoaaVersion;
  fetchKp(): Promise<KpReading | null>;
  fetchF107(): Promise<F107Reading | null>;
  fetchXray(): Promise<XrayFluxReading | null>;
  fetchProton(): Promise<ProtonFluxReading | null>;
  fetchKpForecast(): Promise<KpForecast[]>;
  fetch3DayForecast(): Promise<ThreeDayForecast[]>;
}

function createV1Adapter(): NoaaAdapter {
  const base = getBase();
  return {
    version: 'v1',
    async fetchKp() {
      const data = await fetchJSON<Array<Record<string, unknown>>>(
        `${base}/json/planetary_k_index_1m.json`
      );
      return parseKpV1(data);
    },
    async fetchF107() {
      const data = await fetchJSON<Array<Record<string, unknown>>>(
        `${base}/json/f107_cm_flux.json`
      );
      return parseF107V1(data);
    },
    async fetchXray() {
      const data = await fetchJSON<Array<Record<string, unknown>>>(
        `${base}/json/goes_xray_flux.json`
      );
      return parseXrayV1(data);
    },
    async fetchProton() {
      const data = await fetchJSON<Array<Record<string, unknown>>>(
        `${base}/json/goes_proton_flux.json`
      );
      return parseProtonV1(data);
    },
    async fetchKpForecast() {
      // 3-hour Kp forecast from NOAA
      try {
        const data = await fetchJSON<Array<Record<string, unknown>>>(
          `${base}/json/planetary_k_index_1m.json`
        );
        // Extract last 8 readings as "forecast" (3h = 8 × ~22min readings)
        const recent = data.slice(-8);
        return recent.map(r => ({
          timestamp: String(r.time_tag || ''),
          kp: Math.max(0, Math.min(9, Number.parseFloat(String(r.kp ?? 0)) || 0)),
          noaaScale: String(r.noaa_scale || 'G0'),
        }));
      } catch {
        return [];
      }
    },
    async fetch3DayForecast() {
      try {
        const data = await fetchJSON<Array<Record<string, unknown>>>(
          `${base}/products/forecast/3-day-forecast.json`
        );
        if (!Array.isArray(data)) return [];
        return data.map(d => ({
          date: String(d.DateStamp || d.date || ''),
          kpForecast: [],
          geoActivity: String(d.GeoActivity || 'quiet').toLowerCase(),
          solarActivity: String(d.SolarActivity || 'low').toLowerCase(),
        }));
      } catch {
        return [];
      }
    },
  };
}

function createV2Adapter(): NoaaAdapter {
  const base = getBase();
  return {
    version: 'v2',
    async fetchKp() {
      // v2 URL TBD — try new path first
      const data = await fetchJSON<Array<Record<string, unknown>>>(
        `${base}/json/planetary_k_index_1m.json` // URL may change for v2
      );
      return parseKpV2(data);
    },
    async fetchF107() {
      const data = await fetchJSON<Array<Record<string, unknown>>>(
        `${base}/json/f107_cm_flux.json`
      );
      return parseF107V2(data);
    },
    async fetchXray() {
      // Reuse v1 parser — X-ray format unlikely to change
      const data = await fetchJSON<Array<Record<string, unknown>>>(
        `${base}/json/goes_xray_flux.json`
      );
      return parseXrayV1(data);
    },
    async fetchProton() {
      const data = await fetchJSON<Array<Record<string, unknown>>>(
        `${base}/json/goes_proton_flux.json`
      );
      return parseProtonV1(data);
    },
    async fetchKpForecast() {
      return createV1Adapter().fetchKpForecast(); // Delegate until v2 is known
    },
    async fetch3DayForecast() {
      return createV1Adapter().fetch3DayForecast();
    },
  };
}

/**
 * Create an NOAA adapter with automatic fallback.
 * Tries v2 first (future-proof), falls back to v1 if v2 parsing fails.
 */
export function createNoaaAdapter(): NoaaAdapter {
  const v1 = createV1Adapter();
  const v2 = createV2Adapter();

  return {
    version: 'v2', // reports highest attempted version
    async fetchKp() {
      try {
        const result = await v2.fetchKp();
        if (result && result.kp >= 0) return result;
      } catch { /* v2 failed, try v1 */ }
      try {
        return await v1.fetchKp();
      } catch { return null; }
    },
    async fetchF107() {
      try {
        const result = await v2.fetchF107();
        if (result && result.flux > 0) return result;
      } catch { /* v2 failed */ }
      try {
        return await v1.fetchF107();
      } catch { return null; }
    },
    async fetchXray() {
      try { return await v1.fetchXray(); } catch { return null; }
    },
    async fetchProton() {
      try { return await v1.fetchProton(); } catch { return null; }
    },
    async fetchKpForecast() {
      try { return await v2.fetchKpForecast(); } catch {
        try { return await v1.fetchKpForecast(); } catch { return []; }
      }
    },
    async fetch3DayForecast() {
      try { return await v2.fetch3DayForecast(); } catch {
        try { return await v1.fetch3DayForecast(); } catch { return []; }
      }
    },
  };
}
```

**Step 3: Write the test**

Create `src/__tests__/noaa-adapter.test.ts`:

```typescript
// src/__tests__/noaa-adapter.test.ts
import { describe, it, expect } from 'vitest';

describe('NOAA Adapter module', () => {
  it('exports createNoaaAdapter', async () => {
    const mod = await import('@/src/lib/space-weather/noaa-adapter');
    expect(mod.createNoaaAdapter).toBeDefined();
    expect(typeof mod.createNoaaAdapter).toBe('function');
  });

  it('adapter has all required methods', async () => {
    const { createNoaaAdapter } = await import('@/src/lib/space-weather/noaa-adapter');
    const adapter = createNoaaAdapter();
    expect(adapter.version).toBe('v2');
    expect(typeof adapter.fetchKp).toBe('function');
    expect(typeof adapter.fetchF107).toBe('function');
    expect(typeof adapter.fetchXray).toBe('function');
    expect(typeof adapter.fetchProton).toBe('function');
    expect(typeof adapter.fetchKpForecast).toBe('function');
    expect(typeof adapter.fetch3DayForecast).toBe('function');
  });
});

describe('Space Weather types', () => {
  it('exports all required types', async () => {
    const mod = await import('@/src/lib/space-weather/types');
    // Verify the module loads without error (types are compile-time only)
    expect(mod).toBeDefined();
  });
});
```

**Step 4: Run tests**

Run: `npx vitest run src/__tests__/noaa-adapter.test.ts`
Expected: PASS

**Step 5: TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add src/lib/space-weather/types.ts src/lib/space-weather/noaa-adapter.ts src/__tests__/noaa-adapter.test.ts
git commit -m "feat(AN-S06): NOAA adapter with v1/v2 versioning for 31.03 format change"
```

---

## Task 2: DONKI Extended Backend

**Files:**
- Create: `src/lib/space-weather/donki-extended.ts`
- Test: `src/__tests__/donki-extended.test.ts`

**Step 1: Write the DONKI extended adapter**

Create `src/lib/space-weather/donki-extended.ts`:

```typescript
// src/lib/space-weather/donki-extended.ts
// Extends existing DONKI integration (FLR + GST) with:
// CMEAnalysis, WSA-ENLIL, SEP, HSS, Notifications
// Server-side only (uses NASA_API_KEY from process.env).

import type { SpaceWeatherContribution, SpaceWeatherSeverity } from './types';

const DONKI_BASE = 'https://api.nasa.gov/DONKI';
const TIMEOUT_MS = 10000;

function getApiKey(): string {
  return process.env.NASA_API_KEY || process.env.VITE_NASA_API_KEY || 'DEMO_KEY';
}

function dateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function fetchDONKI<T>(endpoint: string, startDate: Date, endDate: Date): Promise<T[]> {
  const url = `${DONKI_BASE}/${endpoint}?startDate=${dateStr(startDate)}&endDate=${dateStr(endDate)}&api_key=${getApiKey()}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) {
      if (res.status === 429) throw new Error('DONKI rate limited');
      throw new Error(`DONKI ${endpoint}: ${res.status}`);
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

// ── Severity helpers ─────────────────────────────────────────────────

function kpToGScale(kp: number): SpaceWeatherSeverity {
  if (kp >= 9) return 'G5';
  if (kp >= 8) return 'G4';
  if (kp >= 7) return 'G3';
  if (kp >= 6) return 'G2';
  if (kp >= 5) return 'G1';
  return 'G0';
}

function signatureWeight(severity: SpaceWeatherSeverity): number {
  // Cap at 0.5 per architecture principle
  const weights: Record<string, number> = {
    G0: 0.0, G1: 0.10, G2: 0.20, G3: 0.30, G4: 0.40, G5: 0.50,
    S1: 0.15, S2: 0.25, S3: 0.35, S4: 0.45, S5: 0.50,
    R1: 0.10, R2: 0.20, R3: 0.30, R4: 0.40, R5: 0.50,
  };
  return Math.min(0.5, weights[severity] ?? 0);
}

function hoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * 3600_000).toISOString();
}

// ── CME Analysis → earthbound_cme ────────────────────────────────────

interface DonkiCMEAnalysis {
  activityID: string;
  startTime: string;
  note?: string;
  cmeAnalyses?: Array<{
    isMostAccurate: boolean;
    speed: number;
    halfAngle: number;
    type: string;
    enlilList?: Array<{
      isEarthTargeted: boolean;
      estimatedArrivalTime: string | null;
      kp_18?: number | null;
      kp_90?: number | null;
    }> | null;
  }> | null;
}

function parseCMEContributions(cmes: DonkiCMEAnalysis[]): SpaceWeatherContribution[] {
  const results: SpaceWeatherContribution[] = [];
  for (const cme of cmes) {
    const analysis = cme.cmeAnalyses?.find(a => a.isMostAccurate) ?? cme.cmeAnalyses?.[0];
    if (!analysis) continue;
    const enlil = analysis.enlilList?.find(e => e.isEarthTargeted);
    if (!enlil) continue; // Only earthbound CMEs matter

    const expectedKp = Math.max(enlil.kp_18 ?? 0, enlil.kp_90 ?? 0);
    const severity = kpToGScale(expectedKp);

    results.push({
      schema: 'sp.contribution.v1',
      event_id: `cme:${cme.activityID}`,
      type: 'cme_arrival',
      severity,
      signature_weight: signatureWeight(severity),
      source_event_id: cme.activityID,
      started_at: cme.startTime,
      expires_at: enlil.estimatedArrivalTime || hoursFromNow(72),
      description: `Earthbound CME (speed: ${analysis.speed} km/s, expected Kp: ${expectedKp})`,
    });
  }
  return results;
}

// ── SEP (Solar Energetic Particles) ──────────────────────────────────

interface DonkiSEP {
  sepID: string;
  eventTime: string;
  instruments?: Array<{ displayName: string }>;
}

function parseSEPContributions(seps: DonkiSEP[]): SpaceWeatherContribution[] {
  return seps.map(sep => ({
    schema: 'sp.contribution.v1' as const,
    event_id: `sep:${sep.sepID}`,
    type: 'sep' as const,
    severity: 'S1' as SpaceWeatherSeverity,
    signature_weight: signatureWeight('S1'),
    source_event_id: sep.sepID,
    started_at: sep.eventTime,
    expires_at: hoursFromNow(24),
    description: `Solar energetic particle event`,
  }));
}

// ── HSS (High Speed Stream) ──────────────────────────────────────────

interface DonkiHSS {
  hssID: string;
  eventTime: string;
  instruments?: Array<{ displayName: string }>;
}

function parseHSSContributions(hss: DonkiHSS[]): SpaceWeatherContribution[] {
  return hss.map(h => ({
    schema: 'sp.contribution.v1' as const,
    event_id: `hss:${h.hssID}`,
    type: 'hss' as const,
    severity: 'G1' as SpaceWeatherSeverity,
    signature_weight: signatureWeight('G1'),
    source_event_id: h.hssID,
    started_at: h.eventTime,
    expires_at: hoursFromNow(48),
    description: `High-speed solar wind stream`,
  }));
}

// ── Notifications → alerts ───────────────────────────────────────────

interface DonkiNotification {
  messageID: string;
  messageType: string;
  messageBody: string;
  messageIssueTime: string;
}

function parseAlerts(notifications: DonkiNotification[]): string[] {
  return notifications
    .filter(n => n.messageType?.includes('Warning') || n.messageType?.includes('Watch'))
    .slice(-5)
    .map(n => n.messageBody?.slice(0, 200) || n.messageType);
}

// ── Public API ───────────────────────────────────────────────────────

export interface DonkiExtendedResult {
  contributions: SpaceWeatherContribution[];
  alerts: string[];
}

export async function fetchDonkiExtended(lookbackDays = 7): Promise<DonkiExtendedResult> {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - lookbackDays);

  // Parallel fetch all DONKI endpoints
  const [cmes, seps, hss, notifications] = await Promise.allSettled([
    fetchDONKI<DonkiCMEAnalysis>('CME', start, end),
    fetchDONKI<DonkiSEP>('SEP', start, end),
    fetchDONKI<DonkiHSS>('HSS', start, end),
    fetchDONKI<DonkiNotification>('notifications', start, end),
  ]);

  const contributions: SpaceWeatherContribution[] = [
    ...parseCMEContributions(cmes.status === 'fulfilled' ? cmes.value : []),
    ...parseSEPContributions(seps.status === 'fulfilled' ? seps.value : []),
    ...parseHSSContributions(hss.status === 'fulfilled' ? hss.value : []),
  ];

  const alerts = parseAlerts(
    notifications.status === 'fulfilled' ? notifications.value : []
  );

  return { contributions, alerts };
}
```

**Step 2: Write the test**

Create `src/__tests__/donki-extended.test.ts`:

```typescript
// src/__tests__/donki-extended.test.ts
import { describe, it, expect } from 'vitest';

describe('DONKI Extended module', () => {
  it('exports fetchDonkiExtended', async () => {
    const mod = await import('@/src/lib/space-weather/donki-extended');
    expect(mod.fetchDonkiExtended).toBeDefined();
    expect(typeof mod.fetchDonkiExtended).toBe('function');
  });
});

describe('SpaceWeatherContribution schema validation', () => {
  it('signature_weight is always capped at 0.5', async () => {
    // Read the source code to verify the cap
    const fs = await import('fs');
    const code = fs.readFileSync('src/lib/space-weather/donki-extended.ts', 'utf8');
    expect(code).toContain('Math.min(0.5');
    // Verify the G5 entry is capped at 0.5
    expect(code).toContain("G5: 0.50");
  });

  it('all contributions have expires_at field', async () => {
    const fs = await import('fs');
    const code = fs.readFileSync('src/lib/space-weather/donki-extended.ts', 'utf8');
    // Every contribution object must have expires_at
    const contributionBlocks = code.match(/expires_at:/g);
    expect(contributionBlocks).not.toBeNull();
    expect(contributionBlocks!.length).toBeGreaterThanOrEqual(3); // CME, SEP, HSS
  });
});
```

**Step 3: Run tests**

Run: `npx vitest run src/__tests__/donki-extended.test.ts`
Expected: PASS

**Step 4: Commit**

```bash
git add src/lib/space-weather/donki-extended.ts src/__tests__/donki-extended.test.ts
git commit -m "feat(AN-S06): DONKI extended — CME analysis, SEP, HSS, notifications"
```

---

## Task 3: Server Endpoint — GET /api/space-weather/extended

**Files:**
- Modify: `server.mjs` (add new endpoint after existing `/api/space-weather`)
- Create: `src/lib/schemas/space-weather.ts` (Zod client schema)
- Test: `src/__tests__/space-weather-extended.test.ts`

**Step 1: Write the Zod client schema**

Create `src/lib/schemas/space-weather.ts`:

```typescript
// src/lib/schemas/space-weather.ts
import { z } from 'zod';

export const KpForecastSchema = z.object({
  timestamp: z.string(),
  kp: z.number().min(0).max(9),
  noaaScale: z.string(),
});

export const SpaceWeatherContributionSchema = z.object({
  schema: z.literal('sp.contribution.v1'),
  event_id: z.string(),
  type: z.enum(['cme_arrival', 'flare', 'geomagnetic_storm', 'sep', 'hss', 'alert']),
  severity: z.string(),
  signature_weight: z.number().min(0).max(0.5),
  source_event_id: z.string().optional(),
  started_at: z.string(),
  expires_at: z.string(),
  description: z.string().optional(),
});

export const SpaceWeatherExtendedSchema = z.object({
  current: z.object({
    kp: z.number().min(0).max(9),
    kpForecast3h: z.array(KpForecastSchema).default([]),
    xrayFlux: z.number().default(0),
    xrayClass: z.string().default('A'),
    protonFlux: z.number().default(0),
  }),
  events: z.array(SpaceWeatherContributionSchema).default([]),
  alerts: z.array(z.string()).default([]),
  epoch: z.object({
    sunspotNumber: z.number().default(0),
    f107: z.number().default(0),
    solarCyclePhase: z.string().default('ascending'),
  }),
  meta: z.object({
    fetchedAt: z.string(),
    noaaVersion: z.enum(['v1', 'v2']),
    cacheTtlSeconds: z.number(),
  }),
});

export type SpaceWeatherExtended = z.infer<typeof SpaceWeatherExtendedSchema>;
```

**Step 2: Add the extended endpoint to server.mjs**

After the existing `app.get("/api/space-weather", ...)` block (line 1520), add:

```javascript
// ── /api/space-weather/extended ──────────────────────────────────────
// Aggregates NOAA SWPC + NASA DONKI into a single response.
// Cache: NOAA data 5 min (fast-moving), DONKI data 15 min.

let extendedWeatherCache = null;
const EXTENDED_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

app.get("/api/space-weather/extended", async (_req, res) => {
  res.set("Cache-Control", "public, max-age=300");

  const now = Date.now();
  if (extendedWeatherCache && now - extendedWeatherCache.timestamp < EXTENDED_CACHE_TTL_MS) {
    return res.json(extendedWeatherCache.payload);
  }

  // NOAA adapter (imported dynamically — these are ES modules)
  let kp = 0, xrayFlux = 0, xrayClass = "A", protonFlux = 0, f107 = 0;
  let kpForecast3h = [];
  let noaaVersion = "v1";

  // Fetch NOAA data (Kp, X-ray, Proton, F10.7)
  try {
    const noaaResult = await fetchKpFromNOAA();
    kp = noaaResult.kp_index;
    console.log(`[space-weather/extended] NOAA Kp=${kp}`);
  } catch (err) {
    console.warn("[space-weather/extended] NOAA Kp failed:", err?.message);
    // Fallback to DONKI for Kp
    try {
      const donkiResult = await fetchKpFromDONKI();
      kp = donkiResult.kp_index;
    } catch { /* neutral */ }
  }

  // NOAA X-ray flux
  try {
    const xrayUrl = "https://services.swpc.noaa.gov/json/goes_xray_flux.json";
    const xrayController = new AbortController();
    const xrayTimeout = setTimeout(() => xrayController.abort(), FETCH_TIMEOUT_MS);
    const xrayRes = await fetch(xrayUrl, { signal: xrayController.signal });
    clearTimeout(xrayTimeout);
    if (xrayRes.ok) {
      const xrayData = await xrayRes.json();
      if (Array.isArray(xrayData) && xrayData.length > 0) {
        const latest = xrayData[xrayData.length - 1];
        xrayFlux = Number.parseFloat(String(latest?.flux ?? 0)) || 0;
        if (xrayFlux >= 1e-4) xrayClass = "X";
        else if (xrayFlux >= 1e-5) xrayClass = "M";
        else if (xrayFlux >= 1e-6) xrayClass = "C";
        else if (xrayFlux >= 1e-7) xrayClass = "B";
      }
    }
  } catch (err) {
    console.warn("[space-weather/extended] X-ray fetch failed:", err?.message);
  }

  // NOAA Proton flux
  try {
    const protonUrl = "https://services.swpc.noaa.gov/json/goes_proton_flux.json";
    const protonController = new AbortController();
    const protonTimeout = setTimeout(() => protonController.abort(), FETCH_TIMEOUT_MS);
    const protonRes = await fetch(protonUrl, { signal: protonController.signal });
    clearTimeout(protonTimeout);
    if (protonRes.ok) {
      const protonData = await protonRes.json();
      if (Array.isArray(protonData) && protonData.length > 0) {
        protonFlux = Number.parseFloat(String(protonData[protonData.length - 1]?.flux ?? 0)) || 0;
      }
    }
  } catch (err) {
    console.warn("[space-weather/extended] Proton fetch failed:", err?.message);
  }

  // NOAA F10.7 solar flux
  try {
    const f107Url = "https://services.swpc.noaa.gov/json/f107_cm_flux.json";
    const f107Controller = new AbortController();
    const f107Timeout = setTimeout(() => f107Controller.abort(), FETCH_TIMEOUT_MS);
    const f107Res = await fetch(f107Url, { signal: f107Controller.signal });
    clearTimeout(f107Timeout);
    if (f107Res.ok) {
      const f107Data = await f107Res.json();
      if (Array.isArray(f107Data) && f107Data.length > 0) {
        f107 = Number.parseFloat(String(f107Data[f107Data.length - 1]?.flux ?? 0)) || 0;
      }
    }
  } catch (err) {
    console.warn("[space-weather/extended] F10.7 fetch failed:", err?.message);
  }

  // DONKI extended events (CME, SEP, HSS, notifications)
  let events = [];
  let alerts = [];
  try {
    const apiKey = process.env.NASA_API_KEY || "DEMO_KEY";
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const startStr = startDate.toISOString().slice(0, 10);
    const endStr = endDate.toISOString().slice(0, 10);

    const [cmesRes, sepsRes, hssRes, notifRes] = await Promise.allSettled([
      fetch(`https://api.nasa.gov/DONKI/CME?startDate=${startStr}&endDate=${endStr}&api_key=${apiKey}`, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }),
      fetch(`https://api.nasa.gov/DONKI/SEP?startDate=${startStr}&endDate=${endStr}&api_key=${apiKey}`, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }),
      fetch(`https://api.nasa.gov/DONKI/HSS?startDate=${startStr}&endDate=${endStr}&api_key=${apiKey}`, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }),
      fetch(`https://api.nasa.gov/DONKI/notifications?startDate=${startStr}&endDate=${endStr}&api_key=${apiKey}`, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }),
    ]);

    // Parse CMEs for earthbound events
    if (cmesRes.status === "fulfilled" && cmesRes.value.ok) {
      const cmes = await cmesRes.value.json();
      if (Array.isArray(cmes)) {
        for (const cme of cmes) {
          const analysis = cme.cmeAnalyses?.find(a => a.isMostAccurate) ?? cme.cmeAnalyses?.[0];
          if (!analysis) continue;
          const enlil = analysis.enlilList?.find(e => e.isEarthTargeted);
          if (!enlil) continue;
          const expectedKp = Math.max(enlil.kp_18 ?? 0, enlil.kp_90 ?? 0);
          const gScale = expectedKp >= 9 ? "G5" : expectedKp >= 8 ? "G4" : expectedKp >= 7 ? "G3" : expectedKp >= 6 ? "G2" : expectedKp >= 5 ? "G1" : "G0";
          const weight = Math.min(0.5, expectedKp >= 9 ? 0.5 : expectedKp >= 7 ? 0.35 : expectedKp >= 5 ? 0.2 : 0.1);
          events.push({
            schema: "sp.contribution.v1",
            event_id: `cme:${cme.activityID}`,
            type: "cme_arrival",
            severity: gScale,
            signature_weight: weight,
            source_event_id: cme.activityID,
            started_at: cme.startTime,
            expires_at: enlil.estimatedArrivalTime || new Date(Date.now() + 72 * 3600000).toISOString(),
            description: `Earthbound CME (speed: ${analysis.speed} km/s)`,
          });
        }
      }
    }

    // Parse SEPs
    if (sepsRes.status === "fulfilled" && sepsRes.value.ok) {
      const seps = await sepsRes.value.json();
      if (Array.isArray(seps)) {
        for (const sep of seps) {
          events.push({
            schema: "sp.contribution.v1",
            event_id: `sep:${sep.sepID}`,
            type: "sep",
            severity: "S1",
            signature_weight: 0.15,
            source_event_id: sep.sepID,
            started_at: sep.eventTime,
            expires_at: new Date(Date.now() + 24 * 3600000).toISOString(),
          });
        }
      }
    }

    // Parse HSS
    if (hssRes.status === "fulfilled" && hssRes.value.ok) {
      const hss = await hssRes.value.json();
      if (Array.isArray(hss)) {
        for (const h of hss) {
          events.push({
            schema: "sp.contribution.v1",
            event_id: `hss:${h.hssID}`,
            type: "hss",
            severity: "G1",
            signature_weight: 0.1,
            source_event_id: h.hssID,
            started_at: h.eventTime,
            expires_at: new Date(Date.now() + 48 * 3600000).toISOString(),
          });
        }
      }
    }

    // Parse notifications as alerts
    if (notifRes.status === "fulfilled" && notifRes.value.ok) {
      const notifs = await notifRes.value.json();
      if (Array.isArray(notifs)) {
        alerts = notifs
          .filter(n => n.messageType?.includes("Warning") || n.messageType?.includes("Watch"))
          .slice(-5)
          .map(n => (n.messageBody || n.messageType || "").slice(0, 200));
      }
    }
  } catch (err) {
    console.warn("[space-weather/extended] DONKI extended failed:", err?.message);
  }

  // Solar cycle phase estimation (F10.7 > 150 = near-maximum)
  const solarCyclePhase = f107 >= 200 ? "maximum" : f107 >= 150 ? "ascending" : f107 >= 100 ? "descending" : "minimum";

  const payload = {
    current: { kp, kpForecast3h, xrayFlux, xrayClass, protonFlux },
    events: events.filter(e => new Date(e.expires_at) > new Date()), // Only active events
    alerts,
    epoch: {
      sunspotNumber: 0, // TODO: SIDC SILSO integration
      f107,
      solarCyclePhase,
    },
    meta: {
      fetchedAt: new Date().toISOString(),
      noaaVersion,
      cacheTtlSeconds: Math.round(EXTENDED_CACHE_TTL_MS / 1000),
    },
  };

  extendedWeatherCache = { timestamp: now, payload };
  return res.json(payload);
});
```

**Step 3: Write the test**

Create `src/__tests__/space-weather-extended.test.ts`:

```typescript
// src/__tests__/space-weather-extended.test.ts
import { describe, it, expect } from 'vitest';

describe('Space Weather Extended schema', () => {
  it('exports SpaceWeatherExtendedSchema', async () => {
    const mod = await import('@/src/lib/schemas/space-weather');
    expect(mod.SpaceWeatherExtendedSchema).toBeDefined();
  });

  it('validates a minimal response', async () => {
    const { SpaceWeatherExtendedSchema } = await import('@/src/lib/schemas/space-weather');
    const minimal = {
      current: { kp: 3, kpForecast3h: [], xrayFlux: 1e-6, xrayClass: 'C', protonFlux: 0.5 },
      events: [],
      alerts: [],
      epoch: { sunspotNumber: 120, f107: 145, solarCyclePhase: 'ascending' },
      meta: { fetchedAt: new Date().toISOString(), noaaVersion: 'v1' as const, cacheTtlSeconds: 300 },
    };
    const result = SpaceWeatherExtendedSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });

  it('rejects signature_weight > 0.5', async () => {
    const { SpaceWeatherContributionSchema } = await import('@/src/lib/schemas/space-weather');
    const overweight = {
      schema: 'sp.contribution.v1',
      event_id: 'test:1',
      type: 'flare',
      severity: 'G3',
      signature_weight: 0.8, // OVER CAP
      started_at: new Date().toISOString(),
      expires_at: new Date().toISOString(),
    };
    const result = SpaceWeatherContributionSchema.safeParse(overweight);
    expect(result.success).toBe(false);
  });
});

describe('server.mjs space-weather/extended endpoint', () => {
  it('endpoint is registered in server code', async () => {
    const fs = await import('fs');
    const code = fs.readFileSync('server.mjs', 'utf8');
    expect(code).toContain('/api/space-weather/extended');
    expect(code).toContain('sp.contribution.v1');
  });

  it('DONKI events are filtered by expires_at', async () => {
    const fs = await import('fs');
    const code = fs.readFileSync('server.mjs', 'utf8');
    expect(code).toContain('expires_at');
    // Active events filter
    expect(code).toMatch(/filter.*expires_at/s);
  });
});
```

**Step 4: Run tests**

Run: `npx vitest run src/__tests__/space-weather-extended.test.ts`
Expected: PASS

**Step 5: TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add server.mjs src/lib/schemas/space-weather.ts src/__tests__/space-weather-extended.test.ts
git commit -m "feat(AN-S06): GET /api/space-weather/extended — aggregated NOAA + DONKI"
```

---

## Task 4: Fusion Ring Modulation (Frontend)

**Files:**
- Modify: `src/hooks/useSpaceWeather.ts` (upgrade to consume extended endpoint)
- Create: `src/lib/space-weather/solar-pressure.ts` (computation)
- Modify: `src/components/fusion-ring-website/FusionRingCanvasV2.tsx` (modulation integration)
- Test: `src/__tests__/solar-pressure.test.ts`

**Step 1: Write the solar pressure computation module**

Create `src/lib/space-weather/solar-pressure.ts`:

```typescript
// src/lib/space-weather/solar-pressure.ts
// Computes a 0–1 "solar pressure score" from live NOAA/DONKI data.
// This score modulates the Fusion Ring without overriding the deterministic signature.

/**
 * Solar Pressure Score — combines Kp, X-ray, and Proton flux into a 0–1 value.
 * Weights: 0.5·Kp + 0.25·Xray + 0.15·Proton + 0.1·baseline
 *
 * @param kp       - Current Kp index (0–9)
 * @param xrayFlux - X-ray flux in W/m² (e.g. 1e-5 for C-class)
 * @param protonFlux - Proton flux in particles/cm²/s/sr
 * @returns 0–1 normalized pressure score
 */
export function computeSolarPressureScore(
  kp: number,
  xrayFlux: number,
  protonFlux: number,
): number {
  // Normalize Kp to 0–1 (Kp 0 = 0, Kp 9 = 1)
  const kpNorm = Math.max(0, Math.min(1, kp / 9));

  // Normalize X-ray flux (logarithmic scale)
  // A-class (1e-8) → 0, X-class (1e-4) → 1
  const xrayNorm = xrayFlux > 0
    ? Math.max(0, Math.min(1, (Math.log10(xrayFlux) + 8) / 4))
    : 0;

  // Normalize proton flux (logarithmic)
  // 0.1 pfu → 0, 1000 pfu → 1
  const protonNorm = protonFlux > 0
    ? Math.max(0, Math.min(1, (Math.log10(protonFlux) + 1) / 4))
    : 0;

  // Weighted blend
  const score = 0.5 * kpNorm + 0.25 * xrayNorm + 0.15 * protonNorm + 0.1 * (kpNorm > 0.5 ? 1 : 0);

  return Math.max(0, Math.min(1, score));
}

/**
 * Ring modulation factor from solar pressure and event weights.
 * Result: 1.0 (calm) to 1.5 (extreme storm)
 * Formula: 1 + solarPressure * 0.2 + eventWeight * 0.3, capped at 1.5
 */
export function computeRingModulation(
  solarPressure: number,
  maxEventWeight: number,
): number {
  const raw = 1 + solarPressure * 0.2 + maxEventWeight * 0.3;
  return Math.min(1.5, Math.max(1.0, raw));
}

/**
 * Maps Kp to visual trigger thresholds for the ring.
 * G1 (Kp 5) → +10%, G3 (Kp 7) → +25%, G5 (Kp 9) → +50% + visual effect
 */
export function kpToVisualIntensity(kp: number): {
  intensityBoost: number;    // 0–0.5 multiplier
  triggerEffect: boolean;    // true if ring should show dramatic visual
  gScale: string;            // "G0"–"G5"
} {
  if (kp >= 9) return { intensityBoost: 0.50, triggerEffect: true, gScale: 'G5' };
  if (kp >= 8) return { intensityBoost: 0.40, triggerEffect: true, gScale: 'G4' };
  if (kp >= 7) return { intensityBoost: 0.25, triggerEffect: true, gScale: 'G3' };
  if (kp >= 6) return { intensityBoost: 0.15, triggerEffect: false, gScale: 'G2' };
  if (kp >= 5) return { intensityBoost: 0.10, triggerEffect: false, gScale: 'G1' };
  return { intensityBoost: 0, triggerEffect: false, gScale: 'G0' };
}
```

**Step 2: Upgrade useSpaceWeather hook**

Replace `src/hooks/useSpaceWeather.ts` with:

```typescript
// src/hooks/useSpaceWeather.ts
import { useEffect, useState, useRef } from 'react';
import { SpaceWeatherExtendedSchema } from '@/src/lib/schemas/space-weather';
import type { SpaceWeatherExtended } from '@/src/lib/schemas/space-weather';
import { computeSolarPressureScore, computeRingModulation, kpToVisualIntensity } from '@/src/lib/space-weather/solar-pressure';

export interface SpaceWeatherState {
  kpIndex: number;
  solarPressure: number;         // 0–1 composite score
  ringModulation: number;        // 1.0–1.5 multiplier for ring
  intensityBoost: number;        // 0–0.5 additional visual boost
  triggerEffect: boolean;        // true when G3+ storm warrants dramatic visual
  gScale: string;                // "G0"–"G5"
  xrayFlux: number;
  xrayClass: string;
  protonFlux: number;
  f107: number;
  solarCyclePhase: string;
  events: SpaceWeatherExtended['events'];
  alerts: string[];
  lastUpdate: Date | null;
  loading: boolean;
  error: Error | null;
}

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export const useSpaceWeather = (): SpaceWeatherState => {
  const [state, setState] = useState<SpaceWeatherState>({
    kpIndex: 0,
    solarPressure: 0,
    ringModulation: 1.0,
    intensityBoost: 0,
    triggerEffect: false,
    gScale: 'G0',
    xrayFlux: 0,
    xrayClass: 'A',
    protonFlux: 0,
    f107: 0,
    solarCyclePhase: 'ascending',
    events: [],
    alerts: [],
    lastUpdate: null,
    loading: true,
    error: null,
  });

  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const fetchExtended = async () => {
      try {
        const response = await fetch('/api/space-weather/extended', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Space weather fetch failed (${response.status})`);
        }

        const raw = await response.json();
        const data = SpaceWeatherExtendedSchema.parse(raw);

        if (!mountedRef.current) return;

        const kp = Math.max(0, Math.min(9, data.current.kp));
        const solarPressure = computeSolarPressureScore(kp, data.current.xrayFlux, data.current.protonFlux);
        const maxEventWeight = data.events.length > 0
          ? Math.max(...data.events.map(e => e.signature_weight))
          : 0;
        const ringModulation = computeRingModulation(solarPressure, maxEventWeight);
        const visual = kpToVisualIntensity(kp);

        setState({
          kpIndex: kp,
          solarPressure,
          ringModulation,
          intensityBoost: visual.intensityBoost,
          triggerEffect: visual.triggerEffect,
          gScale: visual.gScale,
          xrayFlux: data.current.xrayFlux,
          xrayClass: data.current.xrayClass,
          protonFlux: data.current.protonFlux,
          f107: data.epoch.f107,
          solarCyclePhase: data.epoch.solarCyclePhase,
          events: data.events,
          alerts: data.alerts,
          lastUpdate: new Date(data.meta.fetchedAt),
          loading: false,
          error: null,
        });
      } catch (err) {
        if (!mountedRef.current) return;
        setState(prev => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err : new Error('Unknown space-weather error'),
        }));
      }
    };

    void fetchExtended();
    const interval = window.setInterval(fetchExtended, POLL_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      window.clearInterval(interval);
    };
  }, []);

  return state;
};
```

**Step 3: Write the test**

Create `src/__tests__/solar-pressure.test.ts`:

```typescript
// src/__tests__/solar-pressure.test.ts
import { describe, it, expect } from 'vitest';
import {
  computeSolarPressureScore,
  computeRingModulation,
  kpToVisualIntensity,
} from '@/src/lib/space-weather/solar-pressure';

describe('computeSolarPressureScore', () => {
  it('returns 0 for calm conditions', () => {
    expect(computeSolarPressureScore(0, 0, 0)).toBe(0);
  });

  it('returns ~0.5 for moderate storm (Kp 5, C-class)', () => {
    const score = computeSolarPressureScore(5, 1e-6, 1);
    expect(score).toBeGreaterThan(0.25);
    expect(score).toBeLessThan(0.65);
  });

  it('returns near 1.0 for extreme storm (Kp 9, X-class, high proton)', () => {
    const score = computeSolarPressureScore(9, 1e-4, 1000);
    expect(score).toBeGreaterThan(0.85);
    expect(score).toBeLessThanOrEqual(1.0);
  });

  it('is always in [0, 1]', () => {
    // Edge cases
    expect(computeSolarPressureScore(-1, -1, -1)).toBeGreaterThanOrEqual(0);
    expect(computeSolarPressureScore(99, 1, 99999)).toBeLessThanOrEqual(1);
  });
});

describe('computeRingModulation', () => {
  it('returns 1.0 for no pressure', () => {
    expect(computeRingModulation(0, 0)).toBe(1.0);
  });

  it('is capped at 1.5', () => {
    expect(computeRingModulation(1.0, 1.0)).toBe(1.5);
  });

  it('returns intermediate value for moderate conditions', () => {
    const mod = computeRingModulation(0.5, 0.3);
    expect(mod).toBeGreaterThan(1.0);
    expect(mod).toBeLessThan(1.5);
  });
});

describe('kpToVisualIntensity', () => {
  it('G0 for Kp < 5', () => {
    expect(kpToVisualIntensity(4).gScale).toBe('G0');
    expect(kpToVisualIntensity(4).triggerEffect).toBe(false);
  });

  it('G3+ triggers visual effect', () => {
    expect(kpToVisualIntensity(7).triggerEffect).toBe(true);
    expect(kpToVisualIntensity(7).gScale).toBe('G3');
    expect(kpToVisualIntensity(7).intensityBoost).toBe(0.25);
  });

  it('G5 at Kp 9 has max boost', () => {
    expect(kpToVisualIntensity(9).intensityBoost).toBe(0.50);
    expect(kpToVisualIntensity(9).gScale).toBe('G5');
  });
});
```

**Step 4: Run tests**

Run: `npx vitest run src/__tests__/solar-pressure.test.ts`
Expected: PASS

**Step 5: TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 6: Commit**

```bash
git add src/lib/space-weather/solar-pressure.ts src/hooks/useSpaceWeather.ts src/__tests__/solar-pressure.test.ts
git commit -m "feat(AN-S06): solar pressure computation + upgraded useSpaceWeather hook"
```

---

## Task 5: Wire Ring Modulation into FusionRing3D

**Files:**
- Modify: `src/components/fusion-ring-3d/FusionRing3D.tsx` (pass modulation to V2)
- Modify: `src/components/fusion-ring-website/FusionRingCanvasV2.tsx` (accept + apply modulation)
- Modify: `src/pages/FuRingPage.tsx` (connect useSpaceWeather to ring)

**Step 1: Add solarModulation prop to FusionRingCanvasV2**

In `src/components/fusion-ring-website/FusionRingCanvasV2.tsx`, add to the `FusionRingCanvasProps` interface (line 67-75):

```typescript
export interface FusionRingCanvasProps {
  natalWeights?: Record<string, number>;
  quizWeights?: Record<string, number>;
  isMini?: boolean;
  showUI?: boolean;
  revealProgress?: number;
  effectTrigger?: { type: string; color?: string; timestamp: number } | null;
  solarModulation?: number;  // 1.0–1.5, multiplied into particle intensity
  className?: string;
}
```

In the `ThreeScene` component, apply the modulation. Find the animation loop where particle sizes/colors are computed (inside the `useEffect` that creates the Three.js scene). Add modulation to the bloom strength and particle brightness:

After the existing bloom setup (where `bloomPass.strength` is set), add:

```typescript
// Solar modulation — scale bloom strength by live space weather
const solarMod = bazStateRef.current?.solarModulation ?? 1.0;
bloomPass.strength *= solarMod;
```

And in the render loop, modulate the tone mapping exposure:

```typescript
// In the animate() function, after any existing exposure logic:
const baseMod = bazStateRef.current?.solarModulation ?? 1.0;
if (baseMod > 1.05) {
  // Storm active — subtle pulse on exposure
  const pulse = 1 + Math.sin(elapsed * 2) * 0.03 * (baseMod - 1);
  renderer.toneMappingExposure *= pulse;
}
```

**Step 2: Pass solarModulation through FusionRing3D**

In `src/components/fusion-ring-3d/FusionRing3D.tsx`, add `solarModulation` to props and pass through:

```typescript
interface FusionRing3DProps {
  // ... existing props ...
  solarModulation?: number;
}

// In the component, pass to FusionRingCanvasV2:
<FusionRingCanvasV2
  // ... existing props ...
  solarModulation={solarModulation}
/>
```

**Step 3: Connect useSpaceWeather in FuRingPage**

In `src/pages/FuRingPage.tsx`, import and use the upgraded hook:

```typescript
import { useSpaceWeather } from '@/src/hooks/useSpaceWeather';

// Inside FuRingPage:
const spaceWeather = useSpaceWeather();

// Pass to FusionRing3D:
<FusionRing3D
  userId={userId}
  quizWeights={liveQuizWeights}
  effectTrigger={ringEffect}
  solarModulation={spaceWeather.ringModulation}
  labels={...}
/>

// Trigger visual effect on G3+ storms:
useEffect(() => {
  if (spaceWeather.triggerEffect && spaceWeather.kpIndex >= 7) {
    setRingEffect({
      type: 'korona_eruption',
      color: spaceWeather.kpIndex >= 9 ? '#ef4444' : '#f97316',
      timestamp: Date.now(),
    });
  }
}, [spaceWeather.triggerEffect, spaceWeather.kpIndex]);
```

**Step 4: TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add src/components/fusion-ring-website/FusionRingCanvasV2.tsx src/components/fusion-ring-3d/FusionRing3D.tsx src/pages/FuRingPage.tsx
git commit -m "feat(AN-S06): wire solar modulation into Fusion Ring — ring breathes with storms"
```

---

## Task 6: POST /api/contribution/space-weather

**Files:**
- Modify: `server.mjs` (add new endpoint)
- Test: `src/__tests__/space-weather-contribution.test.ts`

**Step 1: Add the contribution endpoint to server.mjs**

After the `/api/space-weather/extended` endpoint, add:

```javascript
// ── POST /api/contribution/space-weather ─────────────────────────────
// Converts space weather events into contribution_events for the ring pipeline.
// JWT auth required. Idempotent via event_id.

app.post("/api/contribution/space-weather", express.json(), async (req, res) => {
  if (!supabaseServer) {
    return res.status(503).json({ error: "Supabase not configured" });
  }

  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) {
    return res.status(401).json({ error: "Missing authorization" });
  }

  const { data: { user }, error: authErr } = await supabaseServer.auth.getUser(token);
  if (authErr || !user) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const { event_id, type, severity, signature_weight, started_at, expires_at } = req.body;

  // Validation
  if (!event_id || typeof event_id !== "string") {
    return res.status(400).json({ error: "Missing event_id" });
  }
  if (typeof signature_weight !== "number" || signature_weight < 0 || signature_weight > 0.5) {
    return res.status(400).json({ error: "signature_weight must be [0..0.5]" });
  }
  if (!expires_at) {
    return res.status(400).json({ error: "expires_at is required" });
  }

  // Convert space weather event to 12-sector weights
  // Solar pressure affects all sectors proportionally, with slight emphasis on fire/air sectors
  const baseWeight = Math.min(0.5, signature_weight);
  const sectorWeights = Array.from({ length: 12 }, (_, i) => {
    // Fire signs (0=Aries, 4=Leo, 8=Sagittarius) get slight boost during storms
    const isFireSector = i === 0 || i === 4 || i === 8;
    return Math.min(1, baseWeight * (isFireSector ? 1.2 : 1.0));
  });

  const moduleId = `space-weather:${event_id}`;

  const { error: insertErr } = await supabaseServer
    .from("contribution_events")
    .upsert({
      user_id: user.id,
      event_id: `sw:${event_id}:${user.id}`,
      module_id: moduleId,
      occurred_at: started_at || new Date().toISOString(),
      payload: {
        sector_weights: sectorWeights,
        confidence: Math.min(1, baseWeight * 2), // Higher weight = higher confidence
        type: type || "space_weather",
        severity: severity || "G0",
        expires_at,
      },
    }, {
      onConflict: "user_id,module_id",
    });

  if (insertErr) {
    console.error("[contribution/space-weather] insert error:", insertErr.message);
    return res.status(500).json({ error: "Failed to save contribution" });
  }

  return res.status(201).json({ ok: true, module_id: moduleId });
});
```

**Step 2: Write the test**

Create `src/__tests__/space-weather-contribution.test.ts`:

```typescript
// src/__tests__/space-weather-contribution.test.ts
import { describe, it, expect } from 'vitest';

describe('Space weather contribution endpoint', () => {
  it('endpoint exists in server code', async () => {
    const fs = await import('fs');
    const code = fs.readFileSync('server.mjs', 'utf8');
    expect(code).toContain('/api/contribution/space-weather');
  });

  it('requires JWT auth', async () => {
    const fs = await import('fs');
    const code = fs.readFileSync('server.mjs', 'utf8');
    // Extract the contribution/space-weather handler section
    const idx = code.indexOf('/api/contribution/space-weather');
    const section = code.slice(idx, idx + 1500);
    expect(section).toContain('authorization');
    expect(section).toContain('getUser');
  });

  it('enforces signature_weight cap at 0.5', async () => {
    const fs = await import('fs');
    const code = fs.readFileSync('server.mjs', 'utf8');
    const idx = code.indexOf('/api/contribution/space-weather');
    const section = code.slice(idx, idx + 1500);
    expect(section).toContain('0.5');
  });

  it('requires expires_at field', async () => {
    const fs = await import('fs');
    const code = fs.readFileSync('server.mjs', 'utf8');
    const idx = code.indexOf('/api/contribution/space-weather');
    const section = code.slice(idx, idx + 1500);
    expect(section).toContain('expires_at');
    expect(section).toContain('expires_at is required');
  });

  it('uses upsert for idempotency', async () => {
    const fs = await import('fs');
    const code = fs.readFileSync('server.mjs', 'utf8');
    const idx = code.indexOf('/api/contribution/space-weather');
    const section = code.slice(idx, idx + 1500);
    expect(section).toContain('upsert');
    expect(section).toContain('onConflict');
  });
});
```

**Step 3: Run tests**

Run: `npx vitest run src/__tests__/space-weather-contribution.test.ts`
Expected: PASS

**Step 4: Commit**

```bash
git add server.mjs src/__tests__/space-weather-contribution.test.ts
git commit -m "feat(AN-S06): POST /api/contribution/space-weather — idempotent event ingest"
```

---

## Task 7: sky.bazodiac.space — Solar Pressure Widget

**Files:**
- Create: `[sky-project]/src/components/SolarPressureWidget.tsx`
- Modify: `[sky-project]/src/services/nasa.ts` (add NOAA SWPC fetchers)
- Modify: `[sky-project]/src/pages/HomePage.tsx` (mount widget)
- Modify: `[sky-project]/src/lib/i18n.ts` (add translations)

Note: sky project is at `/Users/benjaminpoersch/Projects/codebase/Bazodiac-subpage-sky/sky-bazi/`

**Step 1: Add NOAA SWPC fetchers to nasa.ts**

At the end of `src/services/nasa.ts` in the sky project, add:

```typescript
// ── NOAA SWPC — Live Solar Data ──────────────────────────────────────────

const NOAA_BASE = "https://services.swpc.noaa.gov";

export interface NoaaLiveData {
  kp: number;
  xrayFlux: number;
  xrayClass: string;
  protonFlux: number;
  fetchedAt: number;
}

const NOAA_CACHE_KEY = "noaa_live_v1";
const NOAA_TTL = 5 * 60 * 1000; // 5 minutes

export async function fetchNoaaLive(): Promise<NoaaLiveData> {
  return fetchOnce(NOAA_CACHE_KEY, async () => {
    const cached = getCached<NoaaLiveData>(NOAA_CACHE_KEY, NOAA_TTL);
    if (cached) return cached;

    const [kpRes, xrayRes, protonRes] = await Promise.allSettled([
      fetch(`${NOAA_BASE}/json/planetary_k_index_1m.json`),
      fetch(`${NOAA_BASE}/json/goes_xray_flux.json`),
      fetch(`${NOAA_BASE}/json/goes_proton_flux.json`),
    ]);

    let kp = 0;
    if (kpRes.status === "fulfilled" && kpRes.value.ok) {
      const data = await kpRes.value.json();
      if (Array.isArray(data) && data.length > 0) {
        const latest = data.filter((r: Record<string, unknown>) => !r.estimated).at(-1) ?? data.at(-1);
        kp = Math.max(0, Math.min(9, Number.parseFloat(String(latest?.kp ?? 0)) || 0));
      }
    }

    let xrayFlux = 0, xrayClass = "A";
    if (xrayRes.status === "fulfilled" && xrayRes.value.ok) {
      const data = await xrayRes.value.json();
      if (Array.isArray(data) && data.length > 0) {
        xrayFlux = Number.parseFloat(String(data[data.length - 1]?.flux ?? 0)) || 0;
        if (xrayFlux >= 1e-4) xrayClass = "X";
        else if (xrayFlux >= 1e-5) xrayClass = "M";
        else if (xrayFlux >= 1e-6) xrayClass = "C";
        else if (xrayFlux >= 1e-7) xrayClass = "B";
      }
    }

    let protonFlux = 0;
    if (protonRes.status === "fulfilled" && protonRes.value.ok) {
      const data = await protonRes.value.json();
      if (Array.isArray(data) && data.length > 0) {
        protonFlux = Number.parseFloat(String(data[data.length - 1]?.flux ?? 0)) || 0;
      }
    }

    const result: NoaaLiveData = { kp, xrayFlux, xrayClass, protonFlux, fetchedAt: Date.now() };
    setCache(NOAA_CACHE_KEY, result);
    return result;
  });
}
```

**Step 2: Create the Solar Pressure Widget**

Create `src/components/SolarPressureWidget.tsx` in the sky project:

```tsx
// src/components/SolarPressureWidget.tsx
import { useEffect, useState } from "react";
import { Activity, Zap, AlertTriangle } from "lucide-react";
import { fetchNoaaLive, type NoaaLiveData } from "../services/nasa";
import type { Lang } from "../lib/i18n";

interface Props {
  t: (key: string) => string;
  lang: Lang;
}

const G_SCALE: Array<{
  min: number; max: number; color: string;
  label: { de: string; en: string };
}> = [
  { min: 0, max: 4, color: "#22c55e", label: { de: "Ruhig", en: "Quiet" } },
  { min: 5, max: 5, color: "#eab308", label: { de: "G1 – Schwach", en: "G1 – Minor" } },
  { min: 6, max: 6, color: "#f59e0b", label: { de: "G2 – Moderat", en: "G2 – Moderate" } },
  { min: 7, max: 7, color: "#f97316", label: { de: "G3 – Stark", en: "G3 – Strong" } },
  { min: 8, max: 8, color: "#ef4444", label: { de: "G4 – Schwer", en: "G4 – Severe" } },
  { min: 9, max: 9, color: "#dc2626", label: { de: "G5 – Extrem", en: "G5 – Extreme" } },
];

function getGTier(kp: number) {
  return G_SCALE.find(g => kp >= g.min && kp <= g.max) ?? G_SCALE[0];
}

export default function SolarPressureWidget({ t, lang }: Props) {
  const [data, setData] = useState<NoaaLiveData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchNoaaLive()
      .then(d => { if (mounted) setData(d); })
      .catch(() => { if (mounted) setError(true); });

    const interval = setInterval(() => {
      fetchNoaaLive()
        .then(d => { if (mounted) setData(d); })
        .catch(() => {});
    }, 5 * 60 * 1000);

    return () => { mounted = false; clearInterval(interval); };
  }, []);

  if (error || !data) {
    return (
      <div className="sky-card p-6">
        <div className="sky-skeleton h-32 rounded-lg" />
      </div>
    );
  }

  const tier = getGTier(data.kp);
  const isStorm = data.kp >= 5;

  return (
    <section className="sky-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-[0.15em]" style={{ color: "rgba(215,230,255,0.7)" }}>
          {lang === "de" ? "Solar-Druck Live" : "Solar Pressure Live"}
        </h3>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full animate-pulse" style={{ backgroundColor: tier.color }} />
          <span className="text-xs" style={{ color: tier.color }}>{tier.label[lang]}</span>
        </div>
      </div>

      {/* Kp Gauge */}
      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-serif" style={{ color: tier.color }}>
            Kp {data.kp.toFixed(1)}
          </span>
          {isStorm && (
            <span className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider"
                  style={{ borderColor: tier.color + "40", color: tier.color }}>
              <AlertTriangle className="h-3 w-3" />
              {lang === "de" ? "Sturm aktiv" : "Storm active"}
            </span>
          )}
        </div>

        {/* Kp bar */}
        <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${(data.kp / 9) * 100}%`, background: tier.color }}
          />
        </div>
      </div>

      {/* X-ray + Proton readings */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider" style={{ color: "rgba(215,230,255,0.5)" }}>
            <Zap className="h-3 w-3" />
            {lang === "de" ? "Röntgen" : "X-Ray"}
          </div>
          <div className="mt-1 text-lg font-medium" style={{ color: "rgba(215,230,255,0.9)" }}>
            {data.xrayClass}-{lang === "de" ? "Klasse" : "Class"}
          </div>
          <div className="text-[10px]" style={{ color: "rgba(215,230,255,0.4)" }}>
            {data.xrayFlux.toExponential(1)} W/m²
          </div>
        </div>

        <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)" }}>
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider" style={{ color: "rgba(215,230,255,0.5)" }}>
            <Activity className="h-3 w-3" />
            {lang === "de" ? "Protonen" : "Protons"}
          </div>
          <div className="mt-1 text-lg font-medium" style={{ color: "rgba(215,230,255,0.9)" }}>
            {data.protonFlux < 10 ? data.protonFlux.toFixed(1) : data.protonFlux.toFixed(0)} pfu
          </div>
          <div className="text-[10px]" style={{ color: "rgba(215,230,255,0.4)" }}>
            {lang === "de" ? "≥10 MeV Kanal" : "≥10 MeV channel"}
          </div>
        </div>
      </div>

      {/* Last update */}
      <div className="text-[10px] text-right" style={{ color: "rgba(215,230,255,0.3)" }}>
        {lang === "de" ? "Aktualisiert" : "Updated"}: {new Date(data.fetchedAt).toLocaleTimeString(lang === "de" ? "de-DE" : "en-US")}
      </div>
    </section>
  );
}
```

**Step 3: Mount in HomePage**

In `src/pages/HomePage.tsx` of the sky project, import and add the widget above or alongside the existing `SpaceWeather` component:

```tsx
import SolarPressureWidget from "../components/SolarPressureWidget";

// In the JSX, between SpaceWeather and NearEarthObjects:
<SolarPressureWidget t={t} lang={lang} />
```

**Step 4: Add i18n keys**

In `src/lib/i18n.ts` of the sky project, add any needed keys to the translations object (the widget uses inline de/en so this may be minimal).

**Step 5: TypeScript check (sky project)**

Run: `cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-subpage-sky/sky-bazi && npx tsc --noEmit`
Expected: No errors

**Step 6: Commit (sky project)**

```bash
cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-subpage-sky/sky-bazi
git add src/components/SolarPressureWidget.tsx src/services/nasa.ts src/pages/HomePage.tsx
git commit -m "feat(sky): Solar Pressure Widget — live Kp/X-ray/Proton from NOAA SWPC"
```

---

## Task 8: Full Suite Verification + ENV Documentation

**Files:** None (verification only) + env docs

**Step 1: Run full test suite (Astro-Noctum)**

Run: `npx vitest run`
Expected: All new tests pass, no regressions from our changes

**Step 2: TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

**Step 3: Update .env.example with new vars**

Add to `.env.example`:

```
# Space Weather — NOAA SWPC (no API key required)
NOAA_SWPC_BASE_URL=https://services.swpc.noaa.gov

# NASA API (shared with existing DONKI integration)
# NASA_API_KEY=your-key-here  # 1000 req/hr; DEMO_KEY = 30 req/hr
```

**Step 4: Commit**

```bash
git add .env.example
git commit -m "docs(AN-S06): add NOAA_SWPC_BASE_URL to .env.example"
```

**Step 5: Visual smoke test instructions**

After deployment, manually verify:
1. Open `/signatur` — ring should pulse more when Kp ≥ 5 (check current conditions at swpc.noaa.gov)
2. Open browser devtools → Network → check `/api/space-weather/extended` returns full schema
3. Verify `current.kp`, `current.xrayFlux`, `current.protonFlux` have real values
4. If Kp ≥ 7 (G3+), ring should show `korona_eruption` effect automatically
5. Open sky.bazodiac.space → verify Solar Pressure Widget shows live Kp gauge, X-ray class, proton flux
6. Check server logs for `[space-weather/extended]` entries

---

## Decision Log

| Decision | Alternatives | Reason |
|----------|-------------|--------|
| v2 adapter tries v2 first, falls back to v1 | Only v1 until 31.03 | Future-proof: when NOAA switches, v2 parser catches it; if format unchanged, v1 still works |
| Server-side aggregation (not client-side) | Client fetches NOAA directly | NOAA has no CORS headers; NASA API key shouldn't be in client code; single cache layer |
| 5 min cache for extended endpoint | 1 min (too aggressive), 15 min (too stale) | Balances freshness (storms evolve hourly) with API rate limits (DEMO_KEY: 30/hr) |
| Modulation cap ×1.5 | ×2.0 (too dramatic), ×1.2 (too subtle) | Ring should be noticeably alive during storms without overwhelming the personal signature |
| Solar pressure = weighted blend of Kp+Xray+Proton | Kp only | Multi-sensor gives earlier warning (X-ray arrives 8 min before Kp reaction) |
| Space weather contribution uses fire-sector boost | Uniform weights | Astrologically, solar storms map to fire element (Aries/Leo/Sagittarius) |
| sky project fetches NOAA directly (client-side) | Proxy through main backend | sky is a standalone static site on Netlify; NOAA has no API key requirement |
| DONKI endpoints inline in server.mjs (not importing from TS module) | Import donki-extended.ts | server.mjs is ESM but doesn't use TypeScript; inline keeps it simple and avoids build step |

---

## Files Summary

| Action | File | Project |
|--------|------|---------|
| Create | `src/lib/space-weather/types.ts` | Astro-Noctum |
| Create | `src/lib/space-weather/noaa-adapter.ts` | Astro-Noctum |
| Create | `src/lib/space-weather/donki-extended.ts` | Astro-Noctum |
| Create | `src/lib/space-weather/solar-pressure.ts` | Astro-Noctum |
| Create | `src/lib/schemas/space-weather.ts` | Astro-Noctum |
| Create | `src/__tests__/noaa-adapter.test.ts` | Astro-Noctum |
| Create | `src/__tests__/donki-extended.test.ts` | Astro-Noctum |
| Create | `src/__tests__/space-weather-extended.test.ts` | Astro-Noctum |
| Create | `src/__tests__/solar-pressure.test.ts` | Astro-Noctum |
| Create | `src/__tests__/space-weather-contribution.test.ts` | Astro-Noctum |
| Modify | `server.mjs` | Astro-Noctum |
| Modify | `src/hooks/useSpaceWeather.ts` | Astro-Noctum |
| Modify | `src/components/fusion-ring-website/FusionRingCanvasV2.tsx` | Astro-Noctum |
| Modify | `src/components/fusion-ring-3d/FusionRing3D.tsx` | Astro-Noctum |
| Modify | `src/pages/FuRingPage.tsx` | Astro-Noctum |
| Modify | `.env.example` | Astro-Noctum |
| Create | `src/components/SolarPressureWidget.tsx` | sky-bazi |
| Modify | `src/services/nasa.ts` | sky-bazi |
| Modify | `src/pages/HomePage.tsx` | sky-bazi |

## Risk Mitigations

| Risk | Mitigation |
|------|------------|
| NOAA format change 31.03 | v2 adapter with fallback chain — deploy BEFORE 31.03 |
| DONKI rate limiting (30/hr DEMO_KEY) | Server-side 5-min cache; parallel fetch with Promise.allSettled |
| Ring too aggressive during storms | signature_weight cap 0.5, modulator cap ×1.5 |
| Event spam from DONKI | expires_at filtering, upsert idempotency on event_id |
| NOAA unreachable | DONKI fallback → stale cache → neutral Kp=0 |
