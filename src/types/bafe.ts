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

// RFC 9457 Problem Details — BAFE will adopt this in C2
export interface BafeProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
}
