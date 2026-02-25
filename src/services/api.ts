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
  bazi: unknown;
  western: unknown;
  fusion: unknown;
  wuxing: unknown;
  tst: unknown;
  issues: ApiIssue[];
  _reading_id?: number | null;
}

// Route through same-origin proxy (/api/calculate/…) to avoid CORS.
// Dev: Vite proxy rewrites /api → BAFE.  Prod: Express server.mjs proxies.
const BASE_URL = "/api";

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

async function postCalculation(endpoint: string, payload: Record<string, unknown>) {
  const res = await fetchWithTimeout(`${BASE_URL}/calculate/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const details = await res.text().catch(() => "No response body");
    throw new Error(`Failed to calculate ${endpoint}: ${res.status} ${details}`);
  }

  return res.json();
}

export async function calculateBazi(data: BirthData) {
  validateBirthData(data);
  return postCalculation("bazi", {
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
}

export async function calculateWestern(data: BirthData) {
  validateBirthData(data);
  return postCalculation("western", {
    date: data.date,
    tz: data.tz,
    lon: data.lon,
    lat: data.lat,
    ambiguousTime: "earlier",
    nonexistentTime: "error",
  });
}

export async function calculateFusion(data: BirthData) {
  validateBirthData(data);
  return postCalculation("fusion", {
    date: data.date,
    tz: data.tz,
    lon: data.lon,
    lat: data.lat,
    ambiguousTime: "earlier",
    nonexistentTime: "error",
    bazi_pillars: null,
  });
}

export async function calculateWuxing(data: BirthData) {
  validateBirthData(data);
  return postCalculation("wuxing", {
    date: data.date,
    tz: data.tz,
    lon: data.lon,
    lat: data.lat,
    ambiguousTime: "earlier",
    nonexistentTime: "error",
  });
}

export async function calculateTst(data: BirthData) {
  validateBirthData(data);
  return postCalculation("tst", {
    date: data.date,
    tz: data.tz,
    lon: data.lon,
    lat: data.lat,
    ambiguousTime: "earlier",
    nonexistentTime: "error",
  });
}

const MOCK_DATA = {
  bazi: {
    day_master: "Yang Fire",
    zodiac_sign: "Dragon",
    pillars: {
      year: { stem: "Jia", branch: "Chen" },
      month: { stem: "Bing", branch: "Yin" },
      day: { stem: "Wu", branch: "Wu" },
      hour: { stem: "Ren", branch: "Zi" },
    },
  },
  western: {
    zodiac_sign: "Aries",
    moon_sign: "Leo",
    ascendant_sign: "Scorpio",
  },
  wuxing: {
    dominant_element: "Fire",
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
