import type {
  BafeBaziResponse,
  BafeWesternResponse,
  BafeFusionResponse,
  BafeWuxingResponse,
  BafeTstResponse,
  BafePillarRaw,
  BafeProblemDetail,
  MappedBazi,
  MappedWestern,
  MappedWuxing,
  MappedPillar,
} from '@/src/types/bafe';

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

function signFromIndex(idx: number | undefined | null): string | undefined {
  if (idx == null || idx < 0 || idx > 11) return undefined;
  return SIGN_NAMES[idx];
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
  const res = await fetchWithTimeout(`${BASE_URL}/calculate/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let detail = text;

    // Try parsing as Problem+JSON (BAFE C2 format)
    try {
      const problem: BafeProblemDetail = JSON.parse(text);
      if (problem.detail) detail = problem.detail;
      else if (problem.title) detail = problem.title;
    } catch {
      // Not JSON — use raw text
    }

    throw new Error(`Failed to calculate ${endpoint}: ${res.status} ${detail}`);
  }

  return res.json() as Promise<T>;
}

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

// Fallback data is intentionally empty so the Dashboard shows "—" instead of
// fake values when the API is unreachable.
const MOCK_DATA: {
  bazi: MappedBazi;
  western: MappedWestern;
  wuxing: MappedWuxing;
  fusion: BafeFusionResponse;
  tst: BafeTstResponse;
} = {
  bazi: {
    day_master: "",
    zodiac_sign: "",
    pillars: undefined,
  },
  western: {
    zodiac_sign: "",
    moon_sign: "",
    ascendant_sign: "",
    houses: {},
  },
  wuxing: {
    dominant_element: "",
    elements: {},
  },
  fusion: {},
  tst: {},
};

export async function calculateAll(data: BirthData): Promise<ApiResults> {
  const issues: ApiIssue[] = [];

  const withFallback = async <T>(
    endpoint: ApiIssue["endpoint"],
    fn: () => Promise<T>,
    fallback: T,
  ): Promise<T> => {
    try {
      return await fn();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      issues.push({ endpoint, message });
      console.warn(`${endpoint} API failed, using mock data:`, error);
      return fallback;
    }
  };

  const [bazi, western, fusion, wuxing, tst] = await Promise.all([
    withFallback("bazi", () => calculateBazi(data), MOCK_DATA.bazi),
    withFallback("western", () => calculateWestern(data), MOCK_DATA.western),
    withFallback("fusion", () => calculateFusion(data), MOCK_DATA.fusion),
    withFallback("wuxing", () => calculateWuxing(data), MOCK_DATA.wuxing),
    withFallback("tst", () => calculateTst(data), MOCK_DATA.tst),
  ]);

  return { bazi, western, fusion, wuxing, tst, issues };
}
