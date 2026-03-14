// Characterization types — derived from actual BAFE responses (2026-03).
// Will be replaced by generated types once BAFE OpenAPI (C2/C3) is stable.

// ── Raw BAFE shapes (German keys as BAFE returns them) ──────────────

export interface BafePillarRaw {
  stamm?: string;
  zweig?: string;
  tier?: string;
  element?: string;
  // English fallbacks (BAFE may switch)
  stem?: string;
  branch?: string;
  animal?: string;
}

export interface BafeBaziResponse {
  pillars?: {
    year: BafePillarRaw;
    month: BafePillarRaw;
    day: BafePillarRaw;
    hour: BafePillarRaw;
  };
  chinese?: {
    day_master?: string;
    year?: { animal?: string };
  };
  [key: string]: unknown;
}

export interface BafeWesternBody {
  zodiac_sign?: number; // 0-based index
  longitude?: number;
  latitude?: number;
  speed?: number;
}

export interface BafeWesternResponse {
  bodies?: Record<string, BafeWesternBody>;
  angles?: { Ascendant?: number; MC?: number; [key: string]: number | undefined };
  houses?: Record<string, number | string>;
  [key: string]: unknown;
}

export interface BafeWuxingResponse {
  wu_xing_vector?: Record<string, number>;
  dominant_element?: string;
  [key: string]: unknown;
}

export interface BafeFusionResponse {
  theme?: string;
  summary?: string;
  [key: string]: unknown;
}

export interface BafeTstResponse {
  [key: string]: unknown;
}

// ── Mapped shapes (what Dashboard consumes after api.ts transforms) ──

export interface MappedPillar {
  stem: string;
  branch: string;
  animal: string;
  element: string;
}

export interface MappedBazi {
  pillars?: {
    year: MappedPillar;
    month: MappedPillar;
    day: MappedPillar;
    hour: MappedPillar;
  };
  day_master: string;
  zodiac_sign: string;
  [key: string]: unknown;
}

export interface MappedWestern {
  zodiac_sign?: string;
  moon_sign?: string;
  ascendant_sign?: string;
  houses: Record<string, string>;
  bodies?: Record<string, BafeWesternBody>;
  angles?: Record<string, number | undefined>;
  [key: string]: unknown;
}

export interface MappedWuxing {
  elements: Record<string, number>;
  dominant_element: string;
  wu_xing_vector?: Record<string, number>;
  [key: string]: unknown;
}

/** Composite type for the full API response after mapping in api.ts */
export interface ApiData {
  bazi?: MappedBazi;
  western?: MappedWestern;
  wuxing?: MappedWuxing;
  fusion?: BafeFusionResponse;
  tst?: BafeTstResponse;
}

// RFC 9457 Problem Details — BAFE will adopt this in C2
export interface BafeProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
}

// ── AstroProfileJson — versioned storage format ──────────────────────
// v1 (current): flat format, explicit version field
// legacy (pre-2026-03): BAFE data nested under 'bafe' key, no version

export interface AstroProfileJsonV1 {
  version: 1;
  bazi: MappedBazi | undefined;
  western: MappedWestern | undefined;
  fusion: BafeFusionResponse | undefined;
  wuxing: MappedWuxing | undefined;
  tst: BafeTstResponse | undefined;
  interpretation: string;
  tiles: Record<string, string>;
  houses: Record<string, string>;
}

interface AstroProfileJsonLegacy {
  version?: never;
  bafe?: {
    bazi?: unknown;
    western?: unknown;
    fusion?: unknown;
    wuxing?: unknown;
    tst?: unknown;
    interpretation?: string;
  };
  // Pre-legacy: some profiles had these at top level
  bazi?: unknown;
  western?: unknown;
  fusion?: unknown;
  wuxing?: unknown;
  tst?: unknown;
  interpretation?: string;
  tiles?: unknown;
  houses?: unknown;
}

export type AstroProfileJson = AstroProfileJsonV1 | AstroProfileJsonLegacy;

export interface ParsedAstroProfile {
  apiData: ApiData;
  interpretation: string;
  tiles: Record<string, string>;
  houses: Record<string, string>;
}

export function parseAstroProfileJson(raw: unknown): ParsedAstroProfile | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const json = raw as AstroProfileJson;

  let bazi: unknown;
  let western: unknown;
  let fusion: unknown;
  let wuxing: unknown;
  let tst: unknown;
  let interpretation: string;
  let tiles: Record<string, string>;
  let houses: Record<string, string>;

  if ('version' in json && json.version === 1) {
    // V1 flat format
    bazi = json.bazi;
    western = json.western;
    fusion = json.fusion;
    wuxing = json.wuxing;
    tst = json.tst;
    interpretation = json.interpretation || '';

    const rawTilesV1 = json.tiles;
    tiles = (rawTilesV1 && typeof rawTilesV1 === 'object' && !Array.isArray(rawTilesV1))
      ? (rawTilesV1 as Record<string, string>)
      : {};

    const rawHousesV1 = json.houses;
    houses = (rawHousesV1 && typeof rawHousesV1 === 'object' && !Array.isArray(rawHousesV1))
      ? (rawHousesV1 as Record<string, string>)
      : {};
  } else {
    // Legacy format — data may be under 'bafe' key or at top level
    const legacy = json as AstroProfileJsonLegacy;
    bazi    = legacy.bazi    ?? legacy.bafe?.bazi;
    western = legacy.western ?? legacy.bafe?.western;
    fusion  = legacy.fusion  ?? legacy.bafe?.fusion;
    wuxing  = legacy.wuxing  ?? legacy.bafe?.wuxing;
    tst     = legacy.tst     ?? legacy.bafe?.tst;
    interpretation = (legacy.interpretation ?? legacy.bafe?.interpretation) || '';
    const rawTiles = legacy.tiles;
    tiles = (rawTiles && typeof rawTiles === 'object' && !Array.isArray(rawTiles))
      ? (rawTiles as Record<string, string>) : {};
    const rawHouses = legacy.houses;
    houses = (rawHouses && typeof rawHouses === 'object' && !Array.isArray(rawHouses))
      ? (rawHouses as Record<string, string>) : {};
  }

  // Casts below are deliberate trust boundaries: we validated the object shape
  // in the if/else above (version check + dual-path legacy extraction).
  // These will be replaced by generated types once BAFE OpenAPI spec is stable.
  return {
    apiData: {
      bazi: bazi as MappedBazi | undefined,
      western: western as MappedWestern | undefined,
      fusion: fusion as BafeFusionResponse | undefined,
      wuxing: wuxing as MappedWuxing | undefined,
      tst: tst as BafeTstResponse | undefined,
    },
    interpretation,
    tiles,
    houses,
  };
}
