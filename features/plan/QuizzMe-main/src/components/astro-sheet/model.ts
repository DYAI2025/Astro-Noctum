// ═══════════════════════════════════════════════════════════════════════════
// BA ZI (FOUR PILLARS) TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type WuXing = 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water';
export type WuXingDE = 'Holz' | 'Feuer' | 'Erde' | 'Metall' | 'Wasser';
export type Polarity = 'Yang' | 'Yin';

export interface BaZiPillar {
  stem: string;
  stemCN: string;
  branch: string;
  branchCN: string;
  element: WuXing;
  polarity: Polarity;
  animal: string;
  animalDE: string;
}

export interface BaZiData {
  year: BaZiPillar;
  month: BaZiPillar;
  day: BaZiPillar;
  hour: BaZiPillar;
  dayMaster: {
    stem: string;
    stemCN: string;
    element: WuXing;
    polarity: Polarity;
  };
  fullNotation: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// FUSION TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface FusionData {
  elementVector: {
    combined: [number, number, number, number, number]; // Wood, Fire, Earth, Metal, Water
    eastern: [number, number, number, number, number];
    western: [number, number, number, number, number];
    dominantElement: WuXing;
    dominantElementDE: WuXingDE;
    deficientElement: WuXing;
    deficientElementDE: WuXingDE;
  };
  harmonyIndex: number; // 0-1
  harmonyInterpretation: string;
  resonances: Array<{
    type: string;
    eastern: string;
    western: string;
    strength: number;
    quality: 'harmony' | 'tension' | 'neutral';
    description?: string;
  }>;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN VIEW MODEL
// ═══════════════════════════════════════════════════════════════════════════

export interface AstroSheetViewModel {
  identity: {
    displayName: string;
    solarSign: string;
    lunarSign: string;
    ascendantSign: string;
    level: number;
    status: string;
    element?: string;
    animal?: string;
    symbol?: {
      svg: string;
      description: string;
      prompt?: string;
    };
  };
  bazi: BaZiData | null;
  fusion: FusionData | null;
  stats: Array<{
    label: string;
    value: number;
    suffix?: string;
  }>;
  quizzes: Array<{
    id: string;
    title: string;
    href: string;
    status: 'completed' | 'in_progress' | 'locked';
    progress: number;
  }>;
  agents: Array<{
    id: string;
    name: string;
    description: string;
    status: 'online' | 'offline' | 'premium_only';
  }>;
  monetization: {
    isPremium: boolean;
    showAds: boolean;
  };
  natal: {
    planets: NatalBody[];
    houses: HousePlacement[];
    aspects: NatalAspect[];
  };
  validation: {
    needsCompute: boolean;
    hasAmbiguousTime: boolean;
    errorMessage?: string;
    status?: string;
    computedAt?: string | null;
  };
}

export interface NatalBody {
  name: string;
  sign: string;
  degree: number;
  house?: number;
}

export interface HousePlacement {
  number: number;
  sign: string;
  degree: number;
}

export interface NatalAspect {
  from: string;
  to: string;
  type: string;
  orb?: number;
}

export type AstroProfileRow = {
  user_id: string;
  username: string;
  birth_date: string;
  birth_time: string;
  birth_time_local?: string;
  iana_time_zone: string;
  fold: number | null;
  // ... other fields
  birth_place_name?: string;
  birth_place_country?: string | null;
  birth_lat?: number;
  birth_lng?: number;
  sun_sign: string | null;
  moon_sign: string | null;
  asc_sign: string | null;
  astro_json: Record<string, any>;
  astro_meta_json?: Record<string, any> | null;
  astro_validation_json?: Record<string, any> | null;
  astro_compute_hash?: string | null;
  astro_computed_at?: string | null;
  account_tier: 'free' | 'premium';
  astro_validation_status: string | null; // e.g. "ok", "error", "ambiguous"
  input_status?: 'ready' | 'computing' | 'computed' | 'error';
};

export interface AstroInputData {
  name: string;
  year: string;
  date: string;
  time: string;
  location: string;
  timeUnknown?: boolean;
  timezone?: string;
}
