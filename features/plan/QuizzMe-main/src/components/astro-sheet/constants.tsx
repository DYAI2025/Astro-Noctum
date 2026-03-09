/**
 * AstroSheet Constants
 *
 * These constants serve as fallback/default values when user data is not yet computed.
 * They are NOT mock data to be removed - they provide reasonable defaults for new users.
 */

import { Stat, Badge, QuizItem, Agent, MasterIdentity } from './types';

export const COLORS = {
  bg: '#000000',
  teal: '#6CA192',
  purple: '#8B5A8B',
  darkBlue: '#0F3045',
  darkGold: '#A77D38',
  gold: '#D2A95A',
  offWhite: '#F7F0E6',
  darkTeal: '#2D5A4C',
  deepCyan: '#053B3F',
  deepPurple: '#4A0E4E',
};

/** Default stats shown when user has no computed profile data */
export const CORE_STATS: Stat[] = [
  { label: 'Energie-Aufladung', value: 84 },
  { label: 'Bindung', value: 52 },
  { label: 'Kommunikation', value: 91 },
  { label: 'Struktur', value: 70 },
  { label: 'Analyse ↔ Intuition', value: 48 },
];

/** Default identity shown when user has no computed astro data */
export const IDENTITY_DATA: MasterIdentity = {
  tierkreis: "Metall Pferd",
  monatstier: "Ziege (Wei)",
  tagestier: "Holz-Hahn (Yi You)",
  stundenMeister: "Metall (Jahr), Yin-Wasser (Tag-Meister)",
  element: "Metall / Wasser Hybrid",
  konstellation: {
    sun: "Fische",
    moon: "Skorpion",
    rising: "Waage"
  },
  bedeutung: "Spannungsfeld zwischen hoher Sensibilität (Wasser) und rationaler Struktur (Metall); diplomatische Fassade (Waage) als Schutzschild; Bedürfnis nach Autonomie (Pferd/Wassermann)."
};

export const IDENTITY_BADGES: Badge[] = [
  { label: 'Sonne: Steinbock', type: 'western', subType: 'sun', signKey: 'capricorn' },
  { label: 'Mond: Stier', type: 'western', subType: 'moon', signKey: 'taurus' },
  { label: 'AC: Skorpion', type: 'western', subType: 'rising', signKey: 'scorpio' },
  { label: 'Holz-Tiger', type: 'bazi' },
  { label: 'Metall-Hahn', type: 'bazi' },
  { label: 'Wasser-Schwein', type: 'bazi' },
  { label: 'Erde-Ratte', type: 'bazi' },
];

/** Sample quiz progress - will be replaced with real DB data in future */
export const QUIZZES: QuizItem[] = [
  { id: '1', title: 'Naturkind', status: 'completed' },
  { id: '2', title: 'Mentalist', status: 'in_progress', progress: 45, recommendation: 'Reflexions-Tiefe' },
];

/** Available AI agents - matches /agents page configuration */
export const AGENTS: Agent[] = [
  { id: 'atlas', name: 'ATLAS', type: 'Ba Zi', description: 'Analytische Matrix-Schnittstelle' },
  { id: 'vika', name: 'VIKA', type: 'Westlich', description: 'Harmonische Resonanz-Einheit', premium: true },
];

export interface ZodiacInfo {
  ruler: string;
  element: string;
  modality: string;
  keywords: string;
}

export const ZODIAC_DATA: Record<string, ZodiacInfo> = {
  capricorn: { ruler: 'Saturn', element: 'Erde', modality: 'Kardinal', keywords: 'Struktur • Ambition • Zeit' },
  taurus: { ruler: 'Venus', element: 'Erde', modality: 'Fix', keywords: 'Materie • Wert • Genuss' },
  scorpio: { ruler: 'Mars / Pluto', element: 'Wasser', modality: 'Fix', keywords: 'Tiefe • Macht • Geheimnis' },
  leo: { ruler: 'Sonne', element: 'Feuer', modality: 'Fix', keywords: 'Zentrum • Glanz • Herz' },
  sagittarius: { ruler: 'Jupiter', element: 'Feuer', modality: 'Veränderlich', keywords: 'Weite • Wahrheit • Ziel' },
  virgo: { ruler: 'Merkur', element: 'Erde', modality: 'Veränderlich', keywords: 'Detail • Ordnung • Geist' },
  gemini: { ruler: 'Merkur', element: 'Luft', modality: 'Veränderlich', keywords: 'Dualität • Brücke • Wort' },
  aquarius: { ruler: 'Saturn / Uranus', element: 'Luft', modality: 'Fix', keywords: 'Netzwerk • Morgen • Freiheit' },
  pisces: { ruler: 'Jupiter / Neptun', element: 'Wasser', modality: 'Veränderlich', keywords: 'Traum • Einheit • Stille' },
  cancer: { ruler: 'Mond', element: 'Wasser', modality: 'Kardinal', keywords: 'Wurzel • Gefühl • Schutz' },
  libra: { ruler: 'Venus', element: 'Luft', modality: 'Kardinal', keywords: 'Waage • Harmonie • Du' },
  aries: { ruler: 'Mars', element: 'Feuer', modality: 'Kardinal', keywords: 'Ich • Wille • Initial' },
};

export const ZODIAC_SHIELDS: Record<string, string> = {
  leo: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=60',
  sagittarius: 'https://images.unsplash.com/photo-1506318137071-a8e063b4b477?w=400&auto=format&fit=crop&q=60',
  taurus: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=60',
  virgo: 'https://images.unsplash.com/photo-1464802686167-b939a67e06a1?w=400&auto=format&fit=crop&q=60',
  gemini: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&auto=format&fit=crop&q=60',
  aquarius: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&auto=format&fit=crop&q=60',
  scorpio: 'https://images.unsplash.com/photo-1475274047050-1d0c0975c63e?w=400&auto=format&fit=crop&q=60',
  pisces: 'https://images.unsplash.com/photo-1439405326854-014607f694d7?w=400&auto=format&fit=crop&q=60',
  cancer: 'https://images.unsplash.com/photo-1504333638930-c8787321eee0?w=400&auto=format&fit=crop&q=60',
  libra: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=400&auto=format&fit=crop&q=60',
  capricorn: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=400&auto=format&fit=crop&q=60',
  aries: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&auto=format&fit=crop&q=60',
};
