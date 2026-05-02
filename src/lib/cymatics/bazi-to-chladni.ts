import type { MappedPillar } from '../../types/bafe';

export type WuxingElement = 'Wood' | 'Fire' | 'Earth' | 'Metal' | 'Water';

export interface ChladniParams {
  m: number;            // integer 2..6 — nodal line count (x-axis)
  n: number;            // integer 2..6 — nodal line count (y-axis)
  a: number;            // float 0.3..1.0 — amplitude coefficient
  b: number;            // float 0.1..0.7 — amplitude coefficient
  dominantElement: WuxingElement;
  harmonyIndex: number; // float 0..1
}

export interface PlanetFrequency {
  name: string;
  name_de: string;
  symbol: string;
  hz: number;
  wuxing_element: WuxingElement;
  color: string;
  archetype_de: string;
}

/** Hans Cousto "Cosmic Octave" — planetary orbital periods octaved into audible/visual range (1978) */
export const PLANET_FREQUENCIES: PlanetFrequency[] = [
  { name: 'Sun',     name_de: 'Sonne',   symbol: '☉', hz: 126.22, wuxing_element: 'Fire',  color: '#FFD700', archetype_de: 'Identität & Lebenskraft' },
  { name: 'Moon',    name_de: 'Mond',    symbol: '☽', hz: 210.42, wuxing_element: 'Water', color: '#C0C8E0', archetype_de: 'Emotion & Resonanz' },
  { name: 'Mercury', name_de: 'Merkur',  symbol: '☿', hz: 141.27, wuxing_element: 'Metal', color: '#8ED6CF', archetype_de: 'Kognition & Kommunikation' },
  { name: 'Venus',   name_de: 'Venus',   symbol: '♀', hz: 221.23, wuxing_element: 'Earth', color: '#FF9EBC', archetype_de: 'Liebe & Harmonie' },
  { name: 'Mars',    name_de: 'Mars',    symbol: '♂', hz: 144.72, wuxing_element: 'Fire',  color: '#FF6B4A', archetype_de: 'Antrieb & Durchsetzung' },
  { name: 'Jupiter', name_de: 'Jupiter', symbol: '♃', hz: 183.58, wuxing_element: 'Wood',  color: '#B8A0E8', archetype_de: 'Expansion & Weisheit' },
  { name: 'Saturn',  name_de: 'Saturn',  symbol: '♄', hz: 147.85, wuxing_element: 'Earth', color: '#A0B8D8', archetype_de: 'Struktur & Transformation' },
  { name: 'Uranus',  name_de: 'Uranus',  symbol: '♅', hz: 207.36, wuxing_element: 'Metal', color: '#7AF0E0', archetype_de: 'Erneuerung & Freiheit' },
  { name: 'Neptune', name_de: 'Neptun',  symbol: '♆', hz: 211.44, wuxing_element: 'Water', color: '#4F6EF7', archetype_de: 'Auflösung & Intuition' },
  { name: 'Pluto',   name_de: 'Pluto',   symbol: '♇', hz: 140.25, wuxing_element: 'Water', color: '#9B59B6', archetype_de: 'Tiefenwandel & Kraft' },
];

/** Wu-Xing element particle colors */
export const ELEMENT_COLORS: Record<WuxingElement, string> = {
  Wood:  '#66BB6A',
  Fire:  '#FF9800',
  Earth: '#FFD54F',
  Metal: '#CFD8DC',
  Water: '#42A5F5',
};



const CANONICAL_WUXING_ELEMENTS: readonly WuxingElement[] = ['Wood', 'Fire', 'Earth', 'Metal', 'Water'] as const;

function normalizeWuxingElementKey(raw: string): WuxingElement | null {
  const key = raw.trim().toLowerCase();
  switch (key) {
    case 'wood':
    case 'holz':
      return 'Wood';
    case 'fire':
    case 'feuer':
      return 'Fire';
    case 'earth':
    case 'erde':
      return 'Earth';
    case 'metal':
    case 'metall':
      return 'Metal';
    case 'water':
    case 'wasser':
      return 'Water';
    default:
      return null;
  }
}

function dominantElementFromWeights(wuxingWeights: Record<string, number>): WuxingElement {
  let best: WuxingElement = 'Water';
  let bestValue = Number.NEGATIVE_INFINITY;

  for (const el of CANONICAL_WUXING_ELEMENTS) {
    const v = Number(wuxingWeights[el] ?? Number.NEGATIVE_INFINITY);
    if (v > bestValue) {
      best = el;
      bestValue = v;
    }
  }

  for (const [rawKey, rawValue] of Object.entries(wuxingWeights)) {
    const el = normalizeWuxingElementKey(rawKey);
    if (!el) continue;
    const v = Number(rawValue);
    if (!Number.isFinite(v)) continue;
    if (v > bestValue) {
      best = el;
      bestValue = v;
    }
  }

  return best;
}

/**
 * Heavenly Stem name → index 0..9.
 * This is the PRIMARY lookup because MappedPillar.stem is a string
 * (BAFE does not return stem_index in the mapped response).
 *
 * Supports both Chinese characters and Pinyin because BAFE has historically
 * returned both forms in different versions. Prod data (verified 2026-04-19
 * against 50 astro_profiles on BaZidiac) uses Pinyin exclusively — omitting
 * the Pinyin keys caused every lookup to fall back to 0, collapsing all users
 * to (m=2, n=2) in the 2D Cymatics visualisation.
 */
function normaliseStemName(stem: string): string {
  return stem
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

const STEM_NAME_TO_INDEX_BASE: Record<string, number> = {
  // Chinese characters (kept for historical/mixed inputs)
  '甲': 0, '乙': 1, '丙': 2, '丁': 3, '戊': 4,
  '己': 5, '庚': 6, '辛': 7, '壬': 8, '癸': 9,
  // Pinyin — normalized to lowercase for case-insensitive matching
  'jia': 0, 'yi':  1, 'bing': 2, 'ding': 3, 'wu':  4,
  'ji':  5, 'geng': 6, 'xin':  7, 'ren':  8, 'gui': 9,
};

export const STEM_NAME_TO_INDEX: Record<string, number> = new Proxy(STEM_NAME_TO_INDEX_BASE, {
  get(target, prop: string | symbol): number | undefined {
    if (typeof prop !== 'string') {
      return Reflect.get(target, prop) as number | undefined;
    }

    return target[prop] ?? target[normaliseStemName(prop)];
  },
  has(target, prop: string | symbol): boolean {
    if (typeof prop !== 'string') {
      return Reflect.has(target, prop);
    }

    return prop in target || normaliseStemName(prop) in target;
  },
});
type BaziPillars = {
  year: MappedPillar;
  month: MappedPillar;
  day: MappedPillar;
  hour: MappedPillar;
};

/**
 * Derive Chladni simulation parameters deterministically from BaZi four-pillar data.
 *
 * @param baziPillars   - Four BaZi pillars from apiData.bazi.pillars
 * @param wuxingWeights - Element weights from apiData.wuxing.elements (e.g. { Wood: 0.3, ... })
 * @param harmonyIndex  - Balance score 0..1 (default 0.5 — MappedWuxing does not expose this field)
 */
export function baziToChladniParams(
  baziPillars: BaziPillars,
  wuxingWeights: Record<string, number>,
  harmonyIndex = 0.5,
): ChladniParams {
  const yi = STEM_NAME_TO_INDEX[baziPillars.year.stem]  ?? 0;
  const mi = STEM_NAME_TO_INDEX[baziPillars.month.stem] ?? 0;
  const di = STEM_NAME_TO_INDEX[baziPillars.day.stem]   ?? 0;
  const hi = STEM_NAME_TO_INDEX[baziPillars.hour.stem]  ?? 0;

  // Single integer in 0..359 that encodes the four-pillar combination
  const numericSig = (yi * 1000 + mi * 100 + di * 10 + hi) % 360;

  // m and n are deliberately derived with different modular offsets (7/5 factor)
  // to minimise correlation — maximises visual diversity across the 10^4 stem space
  const m = 2 + (numericSig % 5);                          // 2..6
  const n = 2 + (Math.floor(numericSig * 7 / 5) % 5);     // 2..6
  const a = 0.3 + harmonyIndex * 0.7;                      // 0.30..1.00
  const b = 1.0 - a * 0.6;                                 // ~0.40..0.82

  const dominantElement = dominantElementFromWeights(wuxingWeights);

  return { m, n, a, b, dominantElement, harmonyIndex };
}

// ──────────────────────────────────────────────────────────────────────────────
// natalWeightsToChladniPreview
// ──────────────────────────────────────────────────────────────────────────────
//
// Preview helper used by the onboarding SignatureReveal. Unlike baziToChladniParams
// it does NOT need the raw BaZi pillars — it accepts the already-computed
// 12-sector soulprint array and an animation progress (0..1) that interpolates
// between a visual-neutral state and the user-derived target state.
//
// Value domain (matches baziToChladniParams):
//   m: integer 2..6
//   n: integer 2..6
//   a: 0.30..1.00
//   b: 0.10..0.70
//   harmonyIndex: 0..1
//
// Neutral preset (visually calm Chladni figure):
//   { m: 3, n: 3, a: 0.4, b: 0.4, harmonyIndex: 0.5, dominantElement: 'Earth' }
// ──────────────────────────────────────────────────────────────────────────────

/** Clamp x into [lo, hi]. */
function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

/**
 * 12 soulprint sectors map to the five Wu-Xing elements via the canonical
 * zodiac→element assignment. Indices: 0=Aries, 1=Taurus, ..., 11=Pisces.
 */
const SECTOR_TO_ELEMENT: readonly WuxingElement[] = [
  'Fire',  // 0  Aries
  'Earth', // 1  Taurus
  'Metal', // 2  Gemini (Air → Metal in the Wu-Xing mapping used by this project)
  'Water', // 3  Cancer
  'Fire',  // 4  Leo
  'Earth', // 5  Virgo
  'Metal', // 6  Libra
  'Water', // 7  Scorpio
  'Fire',  // 8  Sagittarius
  'Earth', // 9  Capricorn
  'Metal', // 10 Aquarius
  'Water', // 11 Pisces
];

const NEUTRAL_PREVIEW: ChladniParams = Object.freeze({
  m: 3,
  n: 3,
  a: 0.4,
  b: 0.4,
  harmonyIndex: 0.5,
  dominantElement: 'Earth',
});

/**
 * Derive a Chladni preview (target state) from a 12-sector soulprint array.
 * Wood is absent from SECTOR_TO_ELEMENT (no direct zodiac carrier) and defaults
 * to 0 — that's acceptable because the preview only needs a visually plausible
 * target; the full BaZi-driven ChladniParams is produced later by
 * `baziToChladniParams` once the actual pillars are computed.
 */
function sectorsToTarget(sectors: number[]): ChladniParams {
  // Sum top-3 sector weights → m (range 2..6)
  const sorted = [...sectors].sort((a, b) => b - a);
  const top3Sum = (sorted[0] ?? 0) + (sorted[1] ?? 0) + (sorted[2] ?? 0);
  // top3Sum is typically 1.5..3.0 for sector values in [0, 1]. Map to 2..6.
  const mRaw = 2 + Math.round((clamp(top3Sum, 0, 3) / 3) * 4);
  const m = clamp(mRaw, 2, 6);

  // Variance → n (higher spread = higher n)
  const mean = sectors.reduce((acc, v) => acc + v, 0) / sectors.length;
  const variance = sectors.reduce((acc, v) => acc + (v - mean) * (v - mean), 0) / sectors.length;
  // Variance domain for sector values in [0,1] is [0, 0.25]. Map to 2..6.
  const nRaw = 2 + Math.round((clamp(variance, 0, 0.25) / 0.25) * 4);
  const n = clamp(nRaw, 2, 6);

  // Harmony ≈ 1 - normalised variance (low spread → high harmony)
  const harmonyIndex = clamp(1 - variance / 0.25, 0, 1);

  const a = 0.3 + harmonyIndex * 0.7; // 0.30..1.00
  // b clamped to [0.1, 0.7] for visual legibility.
  // Theoretical range from REQ-F-signatur-cymatics formula b = 1 - a*0.6 with a ∈ [0.3, 1.0] is [0.40, 0.82],
  // but the Chladni canvas reads too chaotic near 0.82, so we clamp tighter here.
  const b = clamp(1.0 - a * 0.6, 0.1, 0.7);

  // Dominant element: sum sectors per element, pick the max
  const elementSums: Record<WuxingElement, number> = {
    Wood: 0, Fire: 0, Earth: 0, Metal: 0, Water: 0,
  };
  for (let i = 0; i < sectors.length && i < SECTOR_TO_ELEMENT.length; i++) {
    elementSums[SECTOR_TO_ELEMENT[i]] += sectors[i] ?? 0;
  }
  const dominantElement = (
    Object.entries(elementSums).sort(([, v1], [, v2]) => v2 - v1)[0]?.[0] ?? 'Water'
  ) as WuxingElement;

  return { m, n, a, b, dominantElement, harmonyIndex };
}

/**
 * Linear interpolation of ChladniParams between `NEUTRAL_PREVIEW` and the
 * weight-derived target state, driven by `progress ∈ [0, 1]`.
 *
 * - At progress=0 → identical to NEUTRAL_PREVIEW (m=3, n=3, a=0.4).
 * - At progress=1 → identical to sectorsToTarget(weights).
 * - Intermediate progress → linear blend of numeric fields. `m` and `n` are
 *   interpolated as floats then rounded, so the visual transition is stepped
 *   (Chladni nodal counts are integers). `dominantElement` flips at progress=1.
 *
 * @param weights  12-sector soulprint array. Undefined/empty → returns neutral.
 * @param progress Clamped to [0, 1] internally.
 */
export function natalWeightsToChladniPreview(
  weights: number[] | undefined,
  progress: number,
): ChladniParams {
  if (!weights || weights.length === 0) return { ...NEUTRAL_PREVIEW };
  const p = clamp(progress, 0, 1);
  if (p === 0) return { ...NEUTRAL_PREVIEW };

  const target = sectorsToTarget(weights);
  if (p === 1) return target;

  const lerp = (a: number, b: number) => a + (b - a) * p;
  return {
    m: Math.round(lerp(NEUTRAL_PREVIEW.m, target.m)),
    n: Math.round(lerp(NEUTRAL_PREVIEW.n, target.n)),
    a: lerp(NEUTRAL_PREVIEW.a, target.a),
    b: lerp(NEUTRAL_PREVIEW.b, target.b),
    harmonyIndex: lerp(NEUTRAL_PREVIEW.harmonyIndex, target.harmonyIndex),
    // Dominant element flips when we're past the midpoint of the morph.
    dominantElement: p < 0.5 ? NEUTRAL_PREVIEW.dominantElement : target.dominantElement,
  };
}
