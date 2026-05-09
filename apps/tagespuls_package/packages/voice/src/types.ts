export type DayMode = 'pulse' | 'trace' | 'spannung';
export type Locale = 'de' | 'en';
export type CouncilKey = 'sonne' | 'mond' | 'aszendent' | 'day_master' | 'jahrestier' | 'wuxing_dom';

export interface WuxingVector {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
}

export interface CouncilFigure {
  key: CouncilKey;
  displayName: string;
  signOrElement: string;
}

export interface Aphorism {
  id: string;
  status: 'approved';
  text: { de: string; en: string; original?: string | null };
  source: {
    author: string;
    work?: string | null;
    year?: number | null;
    original_language: string;
    translator_de?: string | null;
    translator_en?: string | null;
  };
  copyright: 'PD' | 'Zitatrecht' | 'eigene-Übersetzung' | 'lizenziert';
  attribution_status: 'verified' | 'disputed' | 'apocryphal' | 'folkloric';
  attribution_note?: string | null;
  mode_tags: DayMode[];
  tone_tags: string[];
  element_affinity: string[];
  figure_affinity: CouncilKey[];
  season_affinity: string[];
  quality_rating: number;
  first_used: string | null;
  cooldown_days: number;
}

export interface DailyPulse {
  id: string;
  userId: string;
  date: string;
  locale: Locale;
  mode: DayMode;
  intensity: number;
  aphorismId: string;
  slot1: string;
  slot2: string;
  slot3: string;
}

export interface DailyInterpretation {
  id: string;
  dailyPulseId: string;
  selectedArchetype: CouncilFigure;
  text: string;
}
