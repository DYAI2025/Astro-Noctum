import type {
  BafeBaziResponse,
  BafeWesternResponse,
  BafeFusionResponse,
  BafeWuxingResponse,
  BafeTstResponse,
  BafePillarRaw,
  MappedBazi,
  MappedWestern,
  MappedWuxing,
  MappedPillar,
  ChartResponse,
} from '../types/bafe';
import { supabase } from '../lib/supabase';
import { retryWithBackoff } from '../lib/retryWithBackoff';

export interface BirthData {
  date: string; // ISO 8601 local date time e.g. 2024-02-10T14:30:00
  tz: string;
  lon: number;
  lat: number;
}

export interface ApiIssue {
  endpoint: "bazi" | "western" | "fusion" | "wuxing" | "tst";
  message: string;
}

export interface ApiResults {
  bazi: MappedBazi;
  western: MappedWestern;
  fusion: BafeFusionResponse;
  wuxing: MappedWuxing;
  tst: BafeTstResponse;
  issues: ApiIssue[];
  _reading_id?: number | null;
}

// Route through same-origin proxy (/api/calculate/…) to avoid CORS.
// Dev: Vite proxy rewrites /api → BAFE.  Prod: Express server.mjs proxies.
const BASE_URL = "/api";

// ── Zodiac sign mapping (index 0-11 → name) ────────────────────────
const SIGN_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

function signFromIndex(idx: number | string | undefined | null): string | undefined {
  if (idx == null) return undefined;
  // BAFE may return a 0-based number index or an English sign name string
  if (typeof idx === 'number') {
    if (idx < 0 || idx > 11) return undefined;
    return SIGN_NAMES[idx];
  }
  // String: check if it's already a known sign name (case-insensitive)
  const normalized = idx.charAt(0).toUpperCase() + idx.slice(1).toLowerCase();
  return SIGN_NAMES.includes(normalized as typeof SIGN_NAMES[number]) ? normalized : undefined;
}

function signFromDegrees(deg: number | undefined | null): string | undefined {
  if (deg == null) return undefined;
  return SIGN_NAMES[Math.floor(((deg % 360) + 360) % 360 / 30)];
}

const fetchWithTimeout = async (url: string, options: RequestInit, timeoutMs = 15000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

/** Error with HTTP status — enables retry logic to distinguish 4xx from 5xx. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly endpoint: string,
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isRetriable(): boolean {
    return this.status >= 500;
  }
}

function validateBirthData(data: BirthData) {
  if (!data.date || !data.tz) {
    throw new Error("Birth data is incomplete: date and timezone are required.");
  }

  if (!Number.isFinite(data.lat) || data.lat < -90 || data.lat > 90) {
    throw new Error("Latitude must be a valid number between -90 and 90.");
  }

  if (!Number.isFinite(data.lon) || data.lon < -180 || data.lon > 180) {
    throw new Error("Longitude must be a valid number between -180 and 180.");
  }
}

async function postCalculation<T = unknown>(
  endpoint: string,
  payload: Record<string, unknown>,
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  return retryWithBackoff(
    async () => {
      const res = await fetchWithTimeout(`${BASE_URL}/calculate/${endpoint}`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        let detail = text;

        // Try parsing as JSON (BAFE Problem+JSON or Express error format)
        try {
          const parsed = JSON.parse(text);
          const coerce = (v: unknown) => typeof v === 'string' ? v : JSON.stringify(v);
          if (parsed.detail) detail = coerce(parsed.detail);
          else if (parsed.title) detail = coerce(parsed.title);
          else if (parsed.error) detail = coerce(parsed.error);   // Express format
        } catch {
          // Not JSON — use raw text (e.g. plain "Service Unavailable" from proxy)
        }

        // Fallback: if detail is empty, use the HTTP status text
        if (!detail) detail = res.statusText || `HTTP ${res.status}`;

        throw new ApiError(
          `Failed to calculate ${endpoint}: ${res.status} ${detail}`,
          res.status,
          endpoint,
        );
      }

      return res.json() as Promise<T>;
    },
    {
      maxRetries: 2,          // initial + 2 retries = 3 total attempts
      baseDelay: 800,         // 800ms → 1600ms backoff (enough for Railway wake)
      shouldRetry: (err) => err instanceof ApiError && err.isRetriable,
      onRetry: (attempt, err) => {
        console.warn(`[api] Retry ${attempt} for ${endpoint}:`, (err as Error).message);
      },
    },
  );
}

/**
 * @deprecated Since API-ONB-CHART-001 — use calculateAll() which calls /chart atomically.
 * Kept for potential direct use; remove once confirmed unused.
 */
export async function calculateBazi(data: BirthData): Promise<MappedBazi> {
  validateBirthData(data);
  const raw = await postCalculation<BafeBaziResponse>("bazi", {
    date: data.date,
    tz: data.tz,
    lon: data.lon,
    lat: data.lat,
    standard: "CIVIL",
    boundary: "midnight",
    strict: true,
    ambiguousTime: "earlier",
    nonexistentTime: "error",
  });

  // Map BAFE response to Dashboard-expected shape.
  // BAFE pillars use German keys (stamm/zweig/tier/element).
  // Dashboard expects stem/branch plus English animal names.
  const mapPillar = (p: BafePillarRaw | undefined): MappedPillar => ({
    stem: p?.stamm || p?.stem || "",
    branch: p?.zweig || p?.branch || "",
    animal: p?.tier || p?.animal || "",
    element: p?.element || "",
  });

  return {
    ...raw,
    // Normalised pillars the Dashboard can iterate
    pillars: raw.pillars
      ? {
          year: mapPillar(raw.pillars.year),
          month: mapPillar(raw.pillars.month),
          day: mapPillar(raw.pillars.day),
          hour: mapPillar(raw.pillars.hour),
        }
      : undefined,
    // Convenience fields
    day_master: raw.chinese?.day_master || raw.pillars?.day?.stamm || "",
    zodiac_sign: raw.chinese?.year?.animal || raw.pillars?.year?.tier || "",
  };
}

/**
 * @deprecated Since API-ONB-CHART-001 — use calculateAll() which calls /chart atomically.
 * Kept for potential direct use; remove once confirmed unused.
 */
export async function calculateWestern(data: BirthData): Promise<MappedWestern> {
  validateBirthData(data);
  const raw = await postCalculation<BafeWesternResponse>("western", {
    date: data.date,
    tz: data.tz,
    lon: data.lon,
    lat: data.lat,
    ambiguousTime: "earlier",
    nonexistentTime: "error",
  });

  // BAFE returns zodiac_sign as 0-based index and ascendant as degrees.
  // Dashboard expects English sign name strings.
  const sunSign = signFromIndex(raw.bodies?.Sun?.zodiac_sign);
  const moonSign = signFromIndex(raw.bodies?.Moon?.zodiac_sign);
  const ascendantDeg = raw.angles?.Ascendant;
  const ascendantSign = signFromDegrees(ascendantDeg);

  // BAFE returns houses as degree values: {"1": 123.45, "2": 155.6, ...}
  // Dashboard needs sign names per house. Convert cusp degrees → sign.
  const normalizedHouses: Record<string, string> = {};
  if (raw.houses && typeof raw.houses === "object") {
    Object.entries(raw.houses).forEach(([key, deg]) => {
      if (typeof deg === "number") {
        normalizedHouses[key] = signFromDegrees(deg) || "";
      } else if (typeof deg === "string") {
        normalizedHouses[key] = deg;
      }
    });
  }

  return {
    ...raw,
    zodiac_sign: sunSign,
    moon_sign: moonSign,
    ascendant_sign: ascendantSign,
    houses: normalizedHouses,
  };
}

/**
 * @deprecated Since API-ONB-CHART-001 — use calculateAll() which calls /chart atomically.
 * Kept for potential direct use; remove once confirmed unused.
 */
export async function calculateFusion(data: BirthData): Promise<BafeFusionResponse> {
  validateBirthData(data);
  return postCalculation<BafeFusionResponse>("fusion", {
    date: data.date,
    tz: data.tz,
    lon: data.lon,
    lat: data.lat,
    ambiguousTime: "earlier",
    nonexistentTime: "error",
    bazi_pillars: null,
  });
}

/**
 * @deprecated Since API-ONB-CHART-001 — use calculateAll() which calls /chart atomically.
 * Kept for potential direct use; remove once confirmed unused.
 */
export async function calculateWuxing(data: BirthData): Promise<MappedWuxing> {
  validateBirthData(data);
  const raw = await postCalculation<BafeWuxingResponse>("wuxing", {
    date: data.date,
    tz: data.tz,
    lon: data.lon,
    lat: data.lat,
    ambiguousTime: "earlier",
    nonexistentTime: "error",
  });

  // BAFE returns `wu_xing_vector: {Holz: x, Feuer: x, ...}` (German keys).
  // Dashboard expects `elements` and `dominant_element`.
  const vec = raw.wu_xing_vector || {};

  return {
    ...raw,
    // Provide both German (original) AND English-keyed element counts
    // so Dashboard's fallback chain `el.key ?? el.name.de` always hits.
    elements: {
      Wood:  vec.Holz   ?? vec.Wood  ?? 0,
      Fire:  vec.Feuer  ?? vec.Fire  ?? 0,
      Earth: vec.Erde   ?? vec.Earth ?? 0,
      Metal: vec.Metall ?? vec.Metal ?? 0,
      Water: vec.Wasser ?? vec.Water ?? 0,
      // Also keep German keys for downstream lookup
      Holz:   vec.Holz   ?? vec.Wood  ?? 0,
      Feuer:  vec.Feuer  ?? vec.Fire  ?? 0,
      Erde:   vec.Erde   ?? vec.Earth ?? 0,
      Metall: vec.Metall ?? vec.Metal ?? 0,
      Wasser: vec.Wasser ?? vec.Water ?? 0,
    },
    dominant_element: raw.dominant_element || "",
  };
}

/**
 * @deprecated Since API-ONB-CHART-001 — use calculateAll() which calls /chart atomically.
 * Kept for potential direct use; remove once confirmed unused.
 */
export async function calculateTst(data: BirthData): Promise<BafeTstResponse> {
  validateBirthData(data);
  return postCalculation<BafeTstResponse>("tst", {
    date: data.date,
    tz: data.tz,
    lon: data.lon,
    lat: data.lat,
    ambiguousTime: "earlier",
    nonexistentTime: "error",
  });
}

export function mapChartToApiResults(raw: ChartResponse): Omit<ApiResults, 'issues' | '_reading_id'> {
  if (!raw.bazi?.pillars) {
    throw new Error('/chart response missing bazi.pillars');
  }
  const bodiesSource = raw.positions || raw.bodies;
  if (!bodiesSource) {
    throw new Error('/chart response missing positions/bodies');
  }
  if (!raw.wuxing) {
    throw new Error('/chart response missing wuxing');
  }

  const mapPillar = (p: BafePillarRaw | undefined): MappedPillar => ({
    stem:    p?.stamm   || (p as unknown as { stem?: string })?.stem   || '',
    branch:  p?.zweig   || (p as unknown as { branch?: string })?.branch || '',
    animal:  p?.tier    || (p as unknown as { animal?: string })?.animal || '',
    element: p?.element || '',
  });

  const bazi: MappedBazi = {
    ...raw.bazi,
    pillars: {
      year:  mapPillar(raw.bazi.pillars.year),
      month: mapPillar(raw.bazi.pillars.month),
      day:   mapPillar(raw.bazi.pillars.day),
      hour:  mapPillar(raw.bazi.pillars.hour),
    },
    day_master: raw.bazi.chinese?.day_master || raw.bazi.pillars.day?.stamm || (raw.bazi.pillars.day as unknown as { stem?: string })?.stem || '',
    zodiac_sign: raw.bazi.chinese?.year?.animal || raw.bazi.pillars.year?.tier || '',
  };

  const sunBody = bodiesSource?.Sun as Record<string, unknown> | undefined;
  const moonBody = bodiesSource?.Moon as Record<string, unknown> | undefined;
  const sunSign        = signFromIndex(sunBody?.zodiac_sign as number | string | undefined)
                      || signFromIndex(sunBody?.sign as number | string | undefined)
                      || (sunBody?.longitude != null ? signFromDegrees(sunBody.longitude as number) : undefined);
  const moonSign       = signFromIndex(moonBody?.zodiac_sign as number | string | undefined)
                      || signFromIndex(moonBody?.sign as number | string | undefined)
                      || (moonBody?.longitude != null ? signFromDegrees(moonBody.longitude as number) : undefined);
  const ascendantSign  = signFromDegrees(raw.angles?.Ascendant);

  const normalizedHouses: Record<string, string> = {};
  if (raw.houses && typeof raw.houses === 'object') {
    Object.entries(raw.houses).forEach(([key, deg]) => {
      if (typeof deg === 'number') {
        normalizedHouses[key] = signFromDegrees(deg) || '';
      } else if (typeof deg === 'string') {
        normalizedHouses[key] = deg;
      }
    });
  }

  const western: MappedWestern = {
    ...raw,
    bodies: bodiesSource,
    angles: raw.angles,
    zodiac_sign:    sunSign,
    moon_sign:      moonSign,
    ascendant_sign: ascendantSign,
    houses:         normalizedHouses,
  };

  // wu_xing_vector is the primary source; fallback: sum from_planets + from_bazi sub-vectors
  const rawWx = raw.wuxing as Record<string, unknown>;
  const vec = (raw.wuxing.wu_xing_vector || {}) as Record<string, number>;
  const fp = (rawWx.from_planets || {}) as Record<string, number>;
  const fb = (rawWx.from_bazi || {}) as Record<string, number>;
  const hasVec = Object.values(vec).some(v => typeof v === 'number' && v > 0);
  const src = hasVec ? vec : {
    Holz:   (fp.Holz ?? fp.Wood ?? 0) + (fb.Holz ?? fb.Wood ?? 0),
    Feuer:  (fp.Feuer ?? fp.Fire ?? 0) + (fb.Feuer ?? fb.Fire ?? 0),
    Erde:   (fp.Erde ?? fp.Earth ?? 0) + (fb.Erde ?? fb.Earth ?? 0),
    Metall: (fp.Metall ?? fp.Metal ?? 0) + (fb.Metall ?? fb.Metal ?? 0),
    Wasser: (fp.Wasser ?? fp.Water ?? 0) + (fb.Wasser ?? fb.Water ?? 0),
  };
  const wuxing: MappedWuxing = {
    ...raw.wuxing,
    elements: {
      Wood:   src.Holz   ?? src.Wood   ?? 0,
      Fire:   src.Feuer  ?? src.Fire   ?? 0,
      Earth:  src.Erde   ?? src.Earth  ?? 0,
      Metal:  src.Metall ?? src.Metal  ?? 0,
      Water:  src.Wasser ?? src.Water  ?? 0,
      Holz:   src.Holz   ?? src.Wood   ?? 0,
      Feuer:  src.Feuer  ?? src.Fire   ?? 0,
      Erde:   src.Erde   ?? src.Earth  ?? 0,
      Metall: src.Metall ?? src.Metal  ?? 0,
      Wasser: vec.Wasser ?? vec.Water  ?? 0,
    },
    dominant_element: raw.wuxing.dominant_element || '',
  };

  const fusion: BafeFusionResponse = raw.fusion || {};
  const tst: BafeTstResponse = raw.time_scales || {};

  return { bazi, western, wuxing, fusion, tst };
}

export async function calculateAll(data: BirthData): Promise<ApiResults> {
  validateBirthData(data);

  try {
    await supabase.auth.refreshSession();
  } catch (refreshErr) {
    console.warn('[api] Session refresh failed, proceeding with cached token:', refreshErr);
  }

  // Call /chart directly — postCalculation() would prepend /calculate/ yielding
  // /calculate/chart which FuFirE does not expose.
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const res = await fetchWithTimeout(`${BASE_URL}/chart`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      local_datetime:  data.date,
      tz:              data.tz,
      lon:             data.lon,
      lat:             data.lat,
      ambiguousTime:   'earlier',
      nonexistentTime: 'error',
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(`Failed to calculate chart: ${res.status} ${text}`, res.status, 'chart');
  }

  const raw = await res.json() as ChartResponse;
  const mapped = mapChartToApiResults(raw);
  return { ...mapped, issues: [] };
}
