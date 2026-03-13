import { apiFetch } from "./api";

export interface BirthData {
  date: string;
  tz: string;
  lon: number;
  lat: number;
}

export interface ApiIssue {
  endpoint: "bazi" | "western" | "fusion" | "wuxing" | "tst";
  message: string;
}

export interface ApiResults {
  bazi: any;
  western: any;
  fusion: any;
  wuxing: any;
  tst: any;
  issues: ApiIssue[];
}

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
  return SIGN_NAMES[Math.floor((((deg % 360) + 360) % 360) / 30)];
}

async function postCalculation<T = unknown>(endpoint: string, payload: BirthData): Promise<T> {
  const response = await apiFetch(`/api/calculate/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`calculate ${endpoint} failed (${response.status}) ${text.slice(0, 240)}`);
  }

  return response.json() as Promise<T>;
}

async function calculateBazi(data: BirthData): Promise<any> {
  const raw = await postCalculation<any>("bazi", data);
  const mapPillar = (pillar: any) => ({
    stem: pillar?.stamm || pillar?.stem || "",
    branch: pillar?.zweig || pillar?.branch || "",
    animal: pillar?.tier || pillar?.animal || "",
    element: pillar?.element || "",
  });

  return {
    ...raw,
    pillars: raw?.pillars
      ? {
          year: mapPillar(raw.pillars.year),
          month: mapPillar(raw.pillars.month),
          day: mapPillar(raw.pillars.day),
          hour: mapPillar(raw.pillars.hour),
        }
      : undefined,
    day_master: raw?.chinese?.day_master || raw?.pillars?.day?.stamm || "",
    zodiac_sign: raw?.chinese?.year?.animal || raw?.pillars?.year?.tier || "",
  };
}

async function calculateWestern(data: BirthData): Promise<any> {
  const raw = await postCalculation<any>("western", data);

  const normalizedHouses: Record<string, string> = {};
  if (raw?.houses && typeof raw.houses === "object") {
    Object.entries(raw.houses).forEach(([key, value]) => {
      if (typeof value === "number") {
        normalizedHouses[key] = signFromDegrees(value) || "";
      } else if (typeof value === "string") {
        normalizedHouses[key] = value;
      }
    });
  }

  return {
    ...raw,
    zodiac_sign: signFromIndex(raw?.bodies?.Sun?.zodiac_sign),
    moon_sign: signFromIndex(raw?.bodies?.Moon?.zodiac_sign),
    ascendant_sign: signFromDegrees(raw?.angles?.Ascendant),
    houses: normalizedHouses,
  };
}

async function calculateWuxing(data: BirthData): Promise<any> {
  const raw = await postCalculation<any>("wuxing", data);
  const vector = raw?.wu_xing_vector || {};

  return {
    ...raw,
    elements: {
      Wood: vector.Holz ?? vector.Wood ?? 0,
      Fire: vector.Feuer ?? vector.Fire ?? 0,
      Earth: vector.Erde ?? vector.Earth ?? 0,
      Metal: vector.Metall ?? vector.Metal ?? 0,
      Water: vector.Wasser ?? vector.Water ?? 0,
      Holz: vector.Holz ?? vector.Wood ?? 0,
      Feuer: vector.Feuer ?? vector.Fire ?? 0,
      Erde: vector.Erde ?? vector.Earth ?? 0,
      Metall: vector.Metall ?? vector.Metal ?? 0,
      Wasser: vector.Wasser ?? vector.Water ?? 0,
    },
    dominant_element: raw?.dominant_element || "",
  };
}

function emptyFallback() {
  return {
    bazi: { day_master: "", zodiac_sign: "", pillars: undefined },
    western: { zodiac_sign: "", moon_sign: "", ascendant_sign: "", houses: {} },
    fusion: {},
    wuxing: { dominant_element: "", elements: {} },
    tst: {},
  };
}

export async function calculateAll(data: BirthData): Promise<ApiResults> {
  const fallback = emptyFallback();
  const issues: ApiIssue[] = [];

  async function withFallback<T>(
    endpoint: ApiIssue["endpoint"],
    action: () => Promise<T>,
    fallbackValue: T,
  ): Promise<T> {
    try {
      return await action();
    } catch (error) {
      issues.push({
        endpoint,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      return fallbackValue;
    }
  }

  const [bazi, western, fusion, wuxing, tst] = await Promise.all([
    withFallback("bazi", () => calculateBazi(data), fallback.bazi),
    withFallback("western", () => calculateWestern(data), fallback.western),
    withFallback("fusion", () => postCalculation<any>("fusion", data), fallback.fusion),
    withFallback("wuxing", () => calculateWuxing(data), fallback.wuxing),
    withFallback("tst", () => postCalculation<any>("tst", data), fallback.tst),
  ]);

  return { bazi, western, fusion, wuxing, tst, issues };
}

export async function generateInterpretation(data: ApiResults, lang: "en" | "de"): Promise<string> {
  const response = await apiFetch("/api/interpret", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data, lang }),
  });

  if (!response.ok) {
    throw new Error(`interpretation failed (${response.status})`);
  }

  const payload = await response.json();
  return payload?.interpretation || "";
}
