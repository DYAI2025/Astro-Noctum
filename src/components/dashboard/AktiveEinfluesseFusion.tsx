/**
 * AktiveEinfluesseFusion — 6 planet cards showing Western transit data + BaZi resonance.
 *
 * Implements: REQ-F-dashboard-bazi-fusion-bridge, REQ-F-dashboard-live-daily-signals
 * Decision:   DEC-dashboard-volatile-first (position 2)
 * Decision:   DEC-fusion-bazi-sheng-ke (planet-element mapping, Sheng/Ke algorithm)
 * Decision:   DEC-no-number-without-explanation (source comment above every rendered value)
 *
 * Data sources per card:
 *   Western block — useDailyTransit() → /api/calculate/western (geocentric noon UTC)
 *   BaZi block    — calculatePlanetBaziResonance(germanPlanet, dayMasterStem) — pure function
 *
 * Renders a skeleton while transit data loads.
 * When dayMasterStem is absent, always renders — planet cards show Western block + "BaZi-Profil nicht verfügbar" notice.
 */

import { useDailyTransit } from '../../hooks/useDailyTransit';
import {
  calculatePlanetBaziResonance,
  STEM_ELEMENT,
  type PlanetName,
  type HeavenlyStem,
  type WuXingElement,
  type ResonanceType,
  type ResonanceResult,
} from '../../lib/fusion-bazi/resonance';
import { ZODIAC_SIGNS_DATA } from '../../lib/astro-data/zodiacSigns';
import { useLanguage } from '../../contexts/LanguageContext';
import { Tooltip } from '../Tooltip';

// ── Planet configuration ──────────────────────────────────────────────────────

interface PlanetConfig {
  /** Key used by BAFE /calculate/western bodies map */
  bafeKey: string;
  /** German name used by calculatePlanetBaziResonance */
  baziName: PlanetName;
  /** Display name */
  label: { de: string; en: string };
  /** Astrological symbol */
  symbol: string;
}

// Six transiting planets (Sun excluded — personal natal Sun, not a transit body card)
const PLANETS: PlanetConfig[] = [
  { bafeKey: 'Moon',    baziName: 'Mond',    symbol: '☽', label: { de: 'Mond',    en: 'Moon'    } },
  { bafeKey: 'Mercury', baziName: 'Merkur',  symbol: '☿', label: { de: 'Merkur',  en: 'Mercury' } },
  { bafeKey: 'Venus',   baziName: 'Venus',   symbol: '♀', label: { de: 'Venus',   en: 'Venus'   } },
  { bafeKey: 'Mars',    baziName: 'Mars',    symbol: '♂', label: { de: 'Mars',    en: 'Mars'    } },
  { bafeKey: 'Jupiter', baziName: 'Jupiter', symbol: '♃', label: { de: 'Jupiter', en: 'Jupiter' } },
  { bafeKey: 'Saturn',  baziName: 'Saturn',  symbol: '♄', label: { de: 'Saturn',  en: 'Saturn'  } },
];

// ── Wu-Xing element display ───────────────────────────────────────────────────

const ELEMENT_LABEL: Record<WuXingElement, { de: string; en: string }> = {
  wood:  { de: 'Holz',   en: 'Wood'  },
  fire:  { de: 'Feuer',  en: 'Fire'  },
  earth: { de: 'Erde',   en: 'Earth' },
  metal: { de: 'Metall', en: 'Metal' },
  water: { de: 'Wasser', en: 'Water' },
};

const ELEMENT_COLOR: Record<WuXingElement, string> = {
  wood:  '#5BA05A',
  fire:  '#E05C2A',
  earth: '#B09040',
  metal: '#A8A8C0',
  water: '#3A7AB0',
};

// ── Resonance type display ────────────────────────────────────────────────────

const RESONANCE_LABEL: Record<ResonanceType, { de: string; en: string }> = {
  gleichklang: { de: 'Gleichklang', en: 'Harmony'    },
  naehrung:    { de: 'Nährung',     en: 'Nurturing'  },
  kontrolle:   { de: 'Kontrolle',   en: 'Control'    },
  neutral:     { de: 'Neutral',     en: 'Neutral'    },
};

const RESONANCE_BADGE_COLOR: Record<ResonanceType, string> = {
  gleichklang: '#D4AF37',
  naehrung:    '#7AB07A',
  kontrolle:   '#B06060',
  neutral:     '#787878',
};

// ── Feldstärke (field-strength) indicator ────────────────────────────────────

/**
 * Three qualitative tiers derived from resonance.intensity.
 *
 * Thresholds derived from DEC-fusion-bazi-sheng-ke intensity ranges:
 *   gleichklang: 0.80–0.90 → stark
 *   naehrung:    0.60–0.80 → mittel / stark
 *   kontrolle:   0.65–0.75 → mittel / stark
 *   neutral:     ≤ 0.45    → gering
 *
 * Intentionally qualitative — no float or % shown (DEC-no-number-without-explanation).
 */
type FieldStrengthTier = 'gering' | 'mittel' | 'stark';

export function intensityToTier(intensity: number): FieldStrengthTier {
  if (intensity >= 0.75) return 'stark';
  if (intensity >= 0.60) return 'mittel';
  return 'gering';
}

const FIELD_STRENGTH_LABEL: Record<FieldStrengthTier, { de: string; en: string }> = {
  gering: { de: 'Gering',  en: 'Low'    },
  mittel: { de: 'Mittel',  en: 'Medium' },
  stark:  { de: 'Stark',   en: 'High'   },
};

/** Number of filled segments (out of 3) per tier */
const FIELD_STRENGTH_SEGMENTS: Record<FieldStrengthTier, number> = {
  gering: 1,
  mittel: 2,
  stark:  3,
};

function FeldstaerkeBar({
  intensity,
  isDe,
}: {
  intensity: number;
  isDe: boolean;
}) {
  const tier = intensityToTier(intensity);
  const filledCount = FIELD_STRENGTH_SEGMENTS[tier];
  const label = isDe ? FIELD_STRENGTH_LABEL[tier].de : FIELD_STRENGTH_LABEL[tier].en;

  return (
    <div
      className="flex items-center gap-1.5"
      data-testid="feldstaerke-bar"
      data-tier={tier}
      aria-label={`Feldstärke: ${label}`}
    >
      <span
        className="text-[8px] font-bold tracking-[0.12em] uppercase"
        style={{ color: 'var(--tile-text-secondary)', opacity: 0.5 }}
      >
        {isDe ? 'Feldstärke' : 'Field strength'}
      </span>
      {/* Source: intensityToTier(resonance.intensity) — qualitative tier, no raw float */}
      <div className="flex gap-0.5" aria-hidden="true">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="w-3 h-1.5 rounded-sm"
            style={{
              background: i < filledCount
                ? 'var(--tile-text-secondary)'
                : 'rgba(255,255,255,0.12)',
              opacity: i < filledCount ? 0.7 : 1,
            }}
          />
        ))}
      </div>
      <span
        className="text-[8px]"
        style={{ color: 'var(--tile-text-secondary)', opacity: 0.5 }}
      >
        {label}
      </span>
    </div>
  );
}

/**
 * Dual-dimension card styling — REQ-F-dashboard-live-daily-signals AC 4+5
 *
 * Semantic mapping:
 *   gleichklang / naehrung  → resonance dimension → cool blue
 *   kontrolle               → tension dimension   → warm red
 *   neutral                 → no dominant pole    → muted gold
 *
 * Element colors (ELEMENT_COLOR) are deliberately NOT used here — the card
 * background communicates resonance/tension semantics, not Wu-Xing identity.
 * The element badge inside the card still uses ELEMENT_COLOR.
 */
export const RESONANCE_CARD_STYLE: Record<ResonanceType, { bg: string; border: string }> = {
  gleichklang: { bg: 'rgba(60, 130, 210, 0.07)',  border: '2px solid rgba(60, 130, 210, 0.40)' },
  naehrung:    { bg: 'rgba(60, 130, 210, 0.07)',  border: '2px solid rgba(60, 130, 210, 0.40)' },
  kontrolle:   { bg: 'rgba(200, 80,  80,  0.07)', border: '2px solid rgba(200, 80,  80,  0.40)' },
  neutral:     { bg: 'rgba(180, 150, 50,  0.05)', border: '2px solid rgba(180, 150, 50,  0.25)' },
};

// ── Personalized resonance tooltip ───────────────────────────────────────────
//
// Explains the Wu-Xing relationship between the transiting planet element and
// the user's day master element in user-centric language (REQ-F-transparency-rule).
// Exported for unit-testing — pure function, no side effects.

export function buildResonanceTooltip(resonance: ResonanceResult, isDe: boolean): string {
  const pel = isDe
    ? ELEMENT_LABEL[resonance.planetElement].de
    : ELEMENT_LABEL[resonance.planetElement].en;
  const mel = isDe
    ? ELEMENT_LABEL[resonance.dayMasterElement].de
    : ELEMENT_LABEL[resonance.dayMasterElement].en;

  if (resonance.type === 'gleichklang') {
    return isDe
      ? `${pel} und dein Tagmeister ${mel} teilen dasselbe Element — ihr schwingst im Einklang. Diese Energie verstärkt sich heute für dich.`
      : `${pel} and your day master ${mel} share the same element — you resonate as one. This energy amplifies for you today.`;
  }

  if (resonance.type === 'naehrung') {
    if (resonance.direction === 'forward') {
      return isDe
        ? `${pel} erzeugt ${mel}: der Planet gibt Energie an deinen Tagmeister ab. Du wirst heute gestärkt.`
        : `${pel} generates ${mel}: the planet feeds your day master. You receive energy today.`;
    }
    // backward: day master generates planet
    return isDe
      ? `Dein ${mel} erzeugt ${pel}: dein Tagmeister gibt Energie weiter. Handle heute mit Bedacht.`
      : `Your ${mel} generates ${pel}: your day master feeds this planet. Act thoughtfully today.`;
  }

  if (resonance.type === 'kontrolle') {
    if (resonance.direction === 'forward') {
      return isDe
        ? `${pel} kontrolliert ${mel}: eine ordnende Kraft wirkt auf deinen Tagmeister. Bleib in deiner Mitte.`
        : `${pel} controls ${mel}: a structuring force acts on your day master. Stay centered.`;
    }
    // backward: day master controls planet
    return isDe
      ? `Dein ${mel} kontrolliert ${pel}: du gestaltest dieses Feld. Nutze den Einfluss bewusst.`
      : `Your ${mel} controls ${pel}: you shape this field. Use your influence mindfully.`;
  }

  // neutral (mathematically unreachable safety net)
  return isDe
    ? `Kein direktes Wu-Xing-Verhältnis zwischen ${pel} und ${mel}. Dieser Planet wirkt heute neutral.`
    : `No direct Wu-Xing relationship between ${pel} and ${mel}. This planet acts neutrally today.`;
}

// ── Zodiac sign index → DE name ───────────────────────────────────────────────

function signNameDe(idx: number | undefined): string | null {
  if (idx == null || idx < 0 || idx > 11) return null;
  return ZODIAC_SIGNS_DATA[idx]?.name.de ?? null;
}

function signNameEn(idx: number | undefined): string | null {
  if (idx == null || idx < 0 || idx > 11) return null;
  return ZODIAC_SIGNS_DATA[idx]?.name.en ?? null;
}

// ── Valid HeavenlyStem guard ──────────────────────────────────────────────────

function isHeavenlyStem(s: string | undefined): s is HeavenlyStem {
  return s != null && s in STEM_ELEMENT;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface AktiveEinfluesseFusionProps {
  /**
   * Day master stem from the user's BaZi chart (apiData.bazi?.day_master).
   * When absent, planet cards show the Western block only + a "BaZi-Profil
   * nicht verfügbar" notice in the BaZi slot (REQ-F-dashboard-bazi-fusion-bridge AC 9).
   */
  dayMasterStem: string | undefined;
  /**
   * Active planets from POST /api/impact/active (REQ-F-active-planets-frontend).
   * When provided and non-empty, renders only these planets instead of the static 6-planet pool.
   * When empty array, shows a meaningful empty state.
   * When undefined/null, falls back to the static 6-planet rendering.
   */
  activePlanets?: import('@/src/lib/schemas/active-impacts').ActivePlanet[] | null;
  /** True while useActiveImpacts() is loading */
  impactLoading?: boolean;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="cosmic-tile p-5 sm:p-6 space-y-4 animate-pulse" aria-hidden="true">
      <div className="h-3 w-40 rounded bg-white/10" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div className="h-3 w-16 rounded bg-white/10" />
            <div className="h-4 w-24 rounded bg-white/10" />
            <div className="h-3 w-32 rounded bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Planet card ───────────────────────────────────────────────────────────────

function PlanetCard({
  planet,
  dayMasterStem,
  transitBodies,
  isDe,
}: {
  planet: PlanetConfig;
  /** null when BaZi profile is incomplete — renders Western block + notice instead of BaZi block */
  dayMasterStem: HeavenlyStem | null;
  transitBodies: ReturnType<typeof useDailyTransit>['bodies'];
  isDe: boolean;
}) {
  // Source: useDailyTransit() → /api/calculate/western (geocentric noon UTC, lat=0 lon=0)
  const body = transitBodies?.[planet.bafeKey];

  // Source: calculatePlanetBaziResonance() — pure, locked by DEC-fusion-bazi-sheng-ke
  // Only computed when a valid Day Master stem is available.
  const resonance = dayMasterStem
    ? calculatePlanetBaziResonance(planet.baziName, dayMasterStem)
    : null;

  // Source: TransitBody.zodiac_sign — 0-based index from BAFE /calculate/western
  const signName = isDe
    ? signNameDe(body?.zodiac_sign)
    : signNameEn(body?.zodiac_sign);

  // Source: TransitBody.degree_in_sign — longitude % 30, computed in useDailyTransit mapBody()
  const degree = body?.degree_in_sign;

  // Source: TransitBody.is_retrograde — speed < 0, computed in useDailyTransit mapBody()
  const isRetrograde = body?.is_retrograde ?? false;

  // Source: RESONANCE_CARD_STYLE — dual-dimension semantic color encoding
  // (REQ-F-dashboard-live-daily-signals AC 5; element-color intentionally NOT used here)
  const cardStyle = resonance
    ? RESONANCE_CARD_STYLE[resonance.type]
    : { bg: 'rgba(255,255,255,0.03)', border: '2px solid rgba(255,255,255,0.08)' };

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ background: cardStyle.bg, borderLeft: cardStyle.border }}
      data-planet={planet.bafeKey}
    >
      {/* ── Planet header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {/* Source: static symbol map */}
          <span className="text-base" aria-hidden="true">{planet.symbol}</span>
          <span
            className="text-xs font-semibold"
            style={{ color: 'var(--tile-text-primary)' }}
          >
            {isDe ? planet.label.de : planet.label.en}
          </span>
        </div>
        {/* Source: TransitBody.is_retrograde (speed < 0) */}
        {isRetrograde && (
          <span
            className="text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(255,100,80,0.15)', color: '#FF8060' }}
            title={isDe ? 'Rückläufig' : 'Retrograde'}
          >
            ℞
          </span>
        )}
      </div>

      {/* ── Western block ──────────────────────────────────────────── */}
      {body && signName && (
        <div className="space-y-0.5">
          {/* Source: TransitBody.degree_in_sign (longitude % 30) + zodiac_sign (0-based index) */}
          <p
            className="text-sm font-medium tabular-nums"
            style={{ color: 'var(--tile-text-primary)' }}
          >
            {degree != null ? `${degree.toFixed(1)}° ` : ''}{signName}
          </p>
        </div>
      )}

      {/* ── BaZi block or unavailability notice ────────────────────── */}
      {resonance ? (
        <div className="space-y-1.5">
          {/* Source: PLANET_ELEMENT (DEC-fusion-bazi-sheng-ke locked mapping) */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[9px] font-bold tracking-[0.15em] uppercase px-1.5 py-0.5 rounded"
              style={{
                background: `${ELEMENT_COLOR[resonance.planetElement]}22`,
                color: ELEMENT_COLOR[resonance.planetElement],
              }}
            >
              {isDe
                ? ELEMENT_LABEL[resonance.planetElement].de
                : ELEMENT_LABEL[resonance.planetElement].en}
            </span>
            {/* Source: calculatePlanetBaziResonance() resonance type — tooltip explains relationship */}
            <Tooltip content={buildResonanceTooltip(resonance, isDe)} dark wide>
              <span
                className="text-[9px] font-bold tracking-[0.15em] uppercase px-1.5 py-0.5 rounded cursor-help"
                style={{
                  background: `${RESONANCE_BADGE_COLOR[resonance.type]}18`,
                  color: RESONANCE_BADGE_COLOR[resonance.type],
                }}
                data-testid="resonance-badge"
              >
                {isDe
                  ? RESONANCE_LABEL[resonance.type].de
                  : RESONANCE_LABEL[resonance.type].en}
              </span>
            </Tooltip>
          </div>

          {/* Source: intensityToTier(resonance.intensity) — qualitative field-strength, REQ-F-dashboard-live-daily-signals AC 7 */}
          <FeldstaerkeBar intensity={resonance.intensity} isDe={isDe} />

          {/* Source: ResonanceResult.quote — brand-voice German quote, ≤80 chars */}
          <p
            className="text-[11px] leading-relaxed italic"
            style={{ color: 'var(--tile-text-secondary)', opacity: 0.65 }}
          >
            {resonance.quote}
          </p>
        </div>
      ) : (
        /* REQ-F-dashboard-bazi-fusion-bridge AC 9: neutral notice when profile incomplete */
        <p
          className="text-[10px] italic"
          style={{ color: 'var(--tile-text-secondary)', opacity: 0.4 }}
          data-testid="bazi-unavailable-notice"
        >
          {isDe ? 'BaZi-Profil nicht verfügbar' : 'BaZi profile unavailable'}
        </p>
      )}
    </div>
  );
}

// ── Impact-derived planet card ───────────────────────────────────────────────

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂', Jupiter: '♃', Saturn: '♄',
};

const PLANET_LABEL_DE: Record<string, string> = {
  Sun: 'Sonne', Moon: 'Mond', Mercury: 'Merkur', Venus: 'Venus', Mars: 'Mars', Jupiter: 'Jupiter', Saturn: 'Saturn',
};

const ASPECT_LABEL: Record<string, { de: string; en: string }> = {
  conjunction: { de: 'Konjunktion', en: 'Conjunction' },
  opposition:  { de: 'Opposition',  en: 'Opposition'  },
  trine:       { de: 'Trigon',      en: 'Trine'       },
  square:      { de: 'Quadrat',     en: 'Square'      },
  sextile:     { de: 'Sextil',      en: 'Sextile'     },
};

function ImpactPlanetCard({
  planet,
  isDe,
}: {
  planet: import('@/src/lib/schemas/active-impacts').ActivePlanet;
  isDe: boolean;
}) {
  const resonanceType = (planet.bazi_resonance ?? 'neutral') as ResonanceType;
  const cardStyle = RESONANCE_CARD_STYLE[resonanceType] ?? RESONANCE_CARD_STYLE.neutral;
  const symbol = PLANET_SYMBOLS[planet.planet] ?? '●';
  const label = isDe ? (PLANET_LABEL_DE[planet.planet] ?? planet.planet) : planet.planet;
  const aspectLabel = ASPECT_LABEL[planet.aspect_type]
    ? (isDe ? ASPECT_LABEL[planet.aspect_type].de : ASPECT_LABEL[planet.aspect_type].en)
    : planet.aspect_type;
  const elementLabel = planet.wu_xing_element
    ? (isDe ? ELEMENT_LABEL[planet.wu_xing_element as WuXingElement]?.de : ELEMENT_LABEL[planet.wu_xing_element as WuXingElement]?.en)
    : null;

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ background: cardStyle.bg, borderLeft: cardStyle.border }}
      data-planet={planet.planet}
      data-testid="impact-planet-card"
    >
      {/* ── Planet header + aspect ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-base" aria-hidden="true">{symbol}</span>
          <span className="text-xs font-semibold" style={{ color: 'var(--tile-text-primary)' }}>
            {label}
          </span>
        </div>
        {/* Source: impact.active_planets[].aspect_type + orb — CON-no-unexplained-numbers: orb shown with ° */}
        <span
          className="text-[10px] font-mono tabular-nums"
          style={{ color: 'var(--tile-text-secondary)', opacity: 0.7 }}
        >
          {aspectLabel} {planet.orb}°
        </span>
      </div>

      {/* ── Strength bar — visual indicator of transit strength ─────── */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span
            className="text-[8px] font-bold tracking-[0.12em] uppercase"
            style={{ color: 'var(--tile-text-secondary)', opacity: 0.5 }}
          >
            {isDe ? 'Stärke' : 'Strength'}
          </span>
          <span
            className="text-[9px] font-mono tabular-nums"
            style={{ color: 'var(--tile-text-secondary)', opacity: 0.5 }}
          >
            {Math.round(planet.strength * 100)}%
          </span>
        </div>
        {/* Source: strength = 1 - orb/8 — tighter aspect = higher strength */}
        <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.round(planet.strength * 100)}%`,
              background: RESONANCE_BADGE_COLOR[resonanceType] ?? 'var(--tile-accent)',
            }}
          />
        </div>
      </div>

      {/* ── BaZi resonance + element badges ────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        {elementLabel && planet.wu_xing_element && (
          <span
            className="text-[9px] font-bold tracking-[0.15em] uppercase px-1.5 py-0.5 rounded"
            style={{
              background: `${ELEMENT_COLOR[planet.wu_xing_element as WuXingElement]}22`,
              color: ELEMENT_COLOR[planet.wu_xing_element as WuXingElement],
            }}
          >
            {elementLabel}
          </span>
        )}
        {planet.bazi_resonance && (
          <span
            className="text-[9px] font-bold tracking-[0.15em] uppercase px-1.5 py-0.5 rounded"
            style={{
              background: `${RESONANCE_BADGE_COLOR[resonanceType]}18`,
              color: RESONANCE_BADGE_COLOR[resonanceType],
            }}
            data-testid="resonance-badge"
          >
            {isDe
              ? RESONANCE_LABEL[resonanceType]?.de ?? resonanceType
              : RESONANCE_LABEL[resonanceType]?.en ?? resonanceType}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Empty state when Impact returns 0 active planets ────────────────────────

function ImpactEmptyState({ isDe }: { isDe: boolean }) {
  return (
    <div
      className="rounded-xl p-6 text-center"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}
      data-testid="impact-empty-state"
    >
      <p
        className="text-xs"
        style={{ color: 'var(--tile-text-secondary)', opacity: 0.5 }}
      >
        {isDe
          ? 'Heute keine starken Transit-Aspekte zu deinem Geburtshoroskop.'
          : 'No strong transit aspects to your birth chart today.'}
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AktiveEinfluesseFusion({ dayMasterStem, activePlanets, impactLoading }: AktiveEinfluesseFusionProps) {
  const { lang } = useLanguage();
  const isDe = lang === 'de';

  const { bodies, loading } = useDailyTransit();

  // Impact data available → use natal-relative active planets (REQ-F-active-planets-frontend)
  const useImpactMode = activePlanets != null && !impactLoading;

  if (!useImpactMode && loading && !bodies) return <Skeleton />;
  if (useImpactMode && impactLoading) return <Skeleton />;

  // null when stem is absent — planet cards show Western block + notice (REQ-F-dashboard-bazi-fusion-bridge AC 9)
  const stem: HeavenlyStem | null = isHeavenlyStem(dayMasterStem) ? dayMasterStem : null;

  return (
    <div
      className="cosmic-tile p-5 sm:p-6 space-y-4"
      data-testid="aktive-einfluesse-fusion"
    >
      {/* ── Section header ───────────────────────────────────────────── */}
      <h3
        className="text-[10px] font-bold tracking-[0.2em] uppercase"
        style={{ color: 'var(--tile-text-secondary)', opacity: 0.6 }}
      >
        {isDe ? 'Aktive Einflüsse' : 'Active Influences'}
      </h3>

      {useImpactMode ? (
        // ── Impact-derived planet cards (natal-relative, orb ≤ 8°) ───
        activePlanets!.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="planet-card-grid">
            {activePlanets!.map((planet) => (
              <ImpactPlanetCard
                key={`${planet.planet}-${planet.aspect_type}-${planet.natal_planet}`}
                planet={planet}
                isDe={isDe}
              />
            ))}
          </div>
        ) : (
          <ImpactEmptyState isDe={isDe} />
        )
      ) : (
        // ── Static 6-planet fallback (existing behavior) ─────────────
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="planet-card-grid">
          {PLANETS.map((planet) => (
            <PlanetCard
              key={planet.bafeKey}
              planet={planet}
              dayMasterStem={stem}
              transitBodies={bodies}
              isDe={isDe}
            />
          ))}
        </div>
      )}

      {/* ── Data provenance footnote ─────────────────────────────────── */}
      <p
        className="text-[9px] leading-relaxed"
        style={{ color: 'var(--tile-text-secondary)', opacity: 0.35 }}
      >
        {useImpactMode
          ? (isDe
              ? 'Transit-Aspekte: natal-relativ · BaZi-Resonanz: Wu-Xing-Klassik'
              : 'Transit aspects: natal-relative · BaZi resonance: classical Wu-Xing')
          : (isDe
              ? 'Positionen: geozentrisch, Mittag UTC · BaZi-Resonanz: Wu-Xing-Klassik'
              : 'Positions: geocentric, noon UTC · BaZi resonance: classical Wu-Xing')}
      </p>
    </div>
  );
}
