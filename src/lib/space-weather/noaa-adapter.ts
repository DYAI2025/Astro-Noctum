// ---------------------------------------------------------------------------
// NOAA SWPC Adapter  --  v1/v2 versioned fetcher with automatic fallback
// ---------------------------------------------------------------------------

import type {
  NoaaVersion,
  KpReading,
  F107Reading,
  XrayFluxReading,
  ProtonFluxReading,
  KpForecast,
  ThreeDayForecast,
} from './types';

// ---- Public interface -----------------------------------------------------

export interface NoaaAdapter {
  version: NoaaVersion;
  fetchKp(): Promise<KpReading | null>;
  fetchF107(): Promise<F107Reading | null>;
  fetchXray(): Promise<XrayFluxReading | null>;
  fetchProton(): Promise<ProtonFluxReading | null>;
  fetchKpForecast(): Promise<KpForecast[]>;
  fetch3DayForecast(): Promise<ThreeDayForecast[]>;
}

// ---- Helpers --------------------------------------------------------------

const FETCH_TIMEOUT_MS = 8_000;

function getBase(): string {
  return (
    (typeof process !== 'undefined' && process.env?.NOAA_SWPC_BASE_URL) ||
    'https://services.swpc.noaa.gov'
  );
}

async function fetchJSON<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`NOAA fetch ${res.status}: ${url}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

// ---- X-ray flux classification --------------------------------------------

function classifyXray(flux: number): XrayFluxReading['classType'] {
  if (flux >= 1e-4) return 'X';
  if (flux >= 1e-5) return 'M';
  if (flux >= 1e-6) return 'C';
  if (flux >= 1e-7) return 'B';
  return 'A';
}

// ---- v1 parsers (current NOAA SWPC JSON format) ---------------------------

interface KpV1Raw {
  kp_index?: number;
  time_tag?: string;
  estimated?: boolean | string;
  noaa_scale?: string;
}

async function parseKpV1(base: string): Promise<KpReading | null> {
  try {
    const data = await fetchJSON<KpV1Raw[]>(
      `${base}/json/planetary_k_index_1m.json`,
    );
    if (!Array.isArray(data) || data.length === 0) return null;

    // Walk backwards to find first non-estimated reading
    for (let i = data.length - 1; i >= 0; i--) {
      const row = data[i];
      const isEstimated =
        row.estimated === true || row.estimated === 'true';
      if (!isEstimated && row.kp_index != null) {
        return {
          kp: row.kp_index,
          timestamp: row.time_tag ?? new Date().toISOString(),
          estimated: false,
          noaaScale: row.noaa_scale ?? 'G0',
        };
      }
    }

    // Fallback: latest entry (may be estimated)
    const last = data[data.length - 1];
    return {
      kp: last.kp_index ?? 0,
      timestamp: last.time_tag ?? new Date().toISOString(),
      estimated: true,
      noaaScale: last.noaa_scale ?? 'G0',
    };
  } catch {
    return null;
  }
}

interface F107V1Raw {
  flux?: number;
  time_tag?: string;
  adjusted?: boolean;
}

async function parseF107V1(base: string): Promise<F107Reading | null> {
  try {
    const data = await fetchJSON<F107V1Raw[]>(
      `${base}/json/f107_cm_flux.json`,
    );
    if (!Array.isArray(data) || data.length === 0) return null;

    const last = data[data.length - 1];
    return {
      flux: last.flux ?? 0,
      timestamp: last.time_tag ?? new Date().toISOString(),
      adjusted: last.adjusted ?? false,
    };
  } catch {
    return null;
  }
}

interface XrayV1Raw {
  flux?: number;
  time_tag?: string;
}

async function parseXrayV1(base: string): Promise<XrayFluxReading | null> {
  try {
    const data = await fetchJSON<XrayV1Raw[]>(
      `${base}/json/goes_xray_flux.json`,
    );
    if (!Array.isArray(data) || data.length === 0) return null;

    const last = data[data.length - 1];
    const flux = last.flux ?? 0;
    return {
      flux,
      classType: classifyXray(flux),
      timestamp: last.time_tag ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

interface ProtonV1Raw {
  flux?: number;
  '100mev_flux'?: number;
  time_tag?: string;
}

async function parseProtonV1(base: string): Promise<ProtonFluxReading | null> {
  try {
    const data = await fetchJSON<ProtonV1Raw[]>(
      `${base}/json/goes_proton_flux.json`,
    );
    if (!Array.isArray(data) || data.length === 0) return null;

    const last = data[data.length - 1];
    return {
      flux10MeV: last.flux ?? 0,
      flux100MeV: last['100mev_flux'] ?? 0,
      timestamp: last.time_tag ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

async function parseKpForecastV1(_base: string): Promise<KpForecast[]> {
  // Kp forecast is embedded in 3-day forecast; standalone endpoint not always available.
  return [];
}

interface ThreeDayRaw {
  date?: string;
  kp_forecast?: Array<{ timestamp?: string; kp?: number; noaa_scale?: string }>;
  geo_activity?: string;
  solar_activity?: string;
}

async function parse3DayForecastV1(
  base: string,
): Promise<ThreeDayForecast[]> {
  try {
    const data = await fetchJSON<ThreeDayRaw[]>(
      `${base}/products/forecast/3-day-forecast.json`,
    );
    if (!Array.isArray(data)) return [];

    return data.map((d) => ({
      date: d.date ?? '',
      kpForecast: (d.kp_forecast ?? []).map((k) => ({
        timestamp: k.timestamp ?? '',
        kp: k.kp ?? 0,
        noaaScale: k.noaa_scale ?? 'G0',
      })),
      geoActivity: d.geo_activity ?? '',
      solarActivity: d.solar_activity ?? '',
    }));
  } catch {
    return [];
  }
}

// ---- v2 parsers (placeholder for post-31.03 format) -----------------------
// v2 attempts new keys first, then falls through to v1 keys.

interface KpV2Raw extends KpV1Raw {
  kp_value?: number;
  timestamp?: string;
  is_estimated?: boolean;
  g_scale?: string;
}

async function parseKpV2(base: string): Promise<KpReading | null> {
  try {
    const data = await fetchJSON<KpV2Raw[]>(
      `${base}/json/planetary_k_index_1m.json`,
    );
    if (!Array.isArray(data) || data.length === 0) return null;

    for (let i = data.length - 1; i >= 0; i--) {
      const row = data[i];

      // Try v2 keys first
      const kp = row.kp_value ?? row.kp_index;
      const ts = row.timestamp ?? row.time_tag;
      const est = row.is_estimated ?? row.estimated;
      const scale = row.g_scale ?? row.noaa_scale;

      const isEstimated = est === true || est === 'true';
      if (!isEstimated && kp != null) {
        return {
          kp,
          timestamp: ts ?? new Date().toISOString(),
          estimated: false,
          noaaScale: scale ?? 'G0',
        };
      }
    }

    const last = data[data.length - 1];
    return {
      kp: last.kp_value ?? last.kp_index ?? 0,
      timestamp: last.timestamp ?? last.time_tag ?? new Date().toISOString(),
      estimated: true,
      noaaScale: last.g_scale ?? last.noaa_scale ?? 'G0',
    };
  } catch {
    return null;
  }
}

// For the remaining v2 parsers, delegate to v1 (format unchanged so far).
const parseF107V2 = parseF107V1;
const parseXrayV2 = parseXrayV1;
const parseProtonV2 = parseProtonV1;
const parseKpForecastV2 = parseKpForecastV1;
const parse3DayForecastV2 = parse3DayForecastV1;

// ---- Factory functions ----------------------------------------------------

export function createV1Adapter(): NoaaAdapter {
  const base = getBase();
  return {
    version: 'v1',
    fetchKp: () => parseKpV1(base),
    fetchF107: () => parseF107V1(base),
    fetchXray: () => parseXrayV1(base),
    fetchProton: () => parseProtonV1(base),
    fetchKpForecast: () => parseKpForecastV1(base),
    fetch3DayForecast: () => parse3DayForecastV1(base),
  };
}

export function createV2Adapter(): NoaaAdapter {
  const base = getBase();
  return {
    version: 'v2',
    fetchKp: () => parseKpV2(base),
    fetchF107: () => parseF107V2(base),
    fetchXray: () => parseXrayV2(base),
    fetchProton: () => parseProtonV2(base),
    fetchKpForecast: () => parseKpForecastV2(base),
    fetch3DayForecast: () => parse3DayForecastV2(base),
  };
}

/**
 * Creates a composite NOAA adapter that tries v2 first and falls back to v1.
 *
 * Each individual method on the returned adapter will:
 * 1. Attempt the v2 parser
 * 2. On failure, attempt the v1 parser
 * 3. Return null / [] on total failure
 */
export function createNoaaAdapter(): NoaaAdapter {
  const v1 = createV1Adapter();
  const v2 = createV2Adapter();

  function withFallback<T>(
    primary: () => Promise<T>,
    fallback: () => Promise<T>,
  ): () => Promise<T> {
    return async () => {
      try {
        const result = await primary();
        if (result === null || (Array.isArray(result) && result.length === 0)) {
          return fallback();
        }
        return result;
      } catch {
        try {
          return await fallback();
        } catch {
          return null as unknown as T;
        }
      }
    };
  }

  return {
    version: 'v2' as NoaaVersion,
    fetchKp: withFallback(v2.fetchKp, v1.fetchKp),
    fetchF107: withFallback(v2.fetchF107, v1.fetchF107),
    fetchXray: withFallback(v2.fetchXray, v1.fetchXray),
    fetchProton: withFallback(v2.fetchProton, v1.fetchProton),
    fetchKpForecast: withFallback(v2.fetchKpForecast, v1.fetchKpForecast),
    fetch3DayForecast: withFallback(v2.fetch3DayForecast, v1.fetch3DayForecast),
  };
}
