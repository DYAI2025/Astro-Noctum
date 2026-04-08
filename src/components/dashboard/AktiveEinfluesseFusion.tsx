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
} from '../../lib/fusion-bazi/resonance';
import { ZODIAC_SIGNS_DATA } from '../../lib/astro-data/zodiacSigns';
import { useLanguage } from '../../contexts/LanguageContext';

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

  const cardBg = resonance
    ? `${ELEMENT_COLOR[resonance.planetElement]}0A`
    : 'rgba(255,255,255,0.03)';
  const cardBorder = resonance
    ? `2px solid ${ELEMENT_COLOR[resonance.planetElement]}55`
    : '2px solid rgba(255,255,255,0.08)';

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ background: cardBg, borderLeft: cardBorder }}
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
            {/* Source: calculatePlanetBaziResonance() resonance type */}
            <span
              className="text-[9px] font-bold tracking-[0.15em] uppercase px-1.5 py-0.5 rounded"
              style={{
                background: `${RESONANCE_BADGE_COLOR[resonance.type]}18`,
                color: RESONANCE_BADGE_COLOR[resonance.type],
              }}
            >
              {isDe
                ? RESONANCE_LABEL[resonance.type].de
                : RESONANCE_LABEL[resonance.type].en}
            </span>
          </div>

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

// ── Main component ────────────────────────────────────────────────────────────

export function AktiveEinfluesseFusion({ dayMasterStem }: AktiveEinfluesseFusionProps) {
  const { lang } = useLanguage();
  const isDe = lang === 'de';

  const { bodies, loading } = useDailyTransit();

  if (loading && !bodies) return <Skeleton />;

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

      {/* ── 6 planet cards ───────────────────────────────────────────── */}
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

      {/* ── Data provenance footnote ─────────────────────────────────── */}
      {/* Source: footnote — no bare numbers, qualitative framing per DEC-no-number-without-explanation */}
      <p
        className="text-[9px] leading-relaxed"
        style={{ color: 'var(--tile-text-secondary)', opacity: 0.35 }}
      >
        {isDe
          ? 'Positionen: geozentrisch, Mittag UTC · BaZi-Resonanz: Wu-Xing-Klassik'
          : 'Positions: geocentric, noon UTC · BaZi resonance: classical Wu-Xing'}
      </p>
    </div>
  );
}
