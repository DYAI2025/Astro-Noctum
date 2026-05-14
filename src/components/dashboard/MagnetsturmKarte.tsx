/**
 * MagnetsturmKarte — Geomagnetic storm card.
 *
 * Implements: REQ-F-dashboard-live-daily-signals
 * Decision:   DEC-dashboard-volatile-first (position 3 — self-hides when Kp < 4)
 * Decision:   DEC-no-number-without-explanation (source comment above every value)
 *
 * Visibility rule: renders null when kpIndex < 4. No empty placeholder card.
 *
 * Data source: prop `spaceWeather` (TASK-5.2 — prop-driven).
 * Dashboard.tsx is the single caller of useSpaceWeather() for the dashboard
 * tree and passes the value down. This deduplicates the 5-minute NOAA poller
 * (was 2 instances per dashboard mount, now 1).
 *
 * Note on solar wind speed / Bz: The current SpaceWeatherExtendedSchema does not
 * include solar wind plasma speed or Bz (IMF z-component) — these require
 * NOAA ACE/DSCOVR endpoints not yet wired. xrayClass and solarPressure are used
 * as available proxies. When those fields are added to the schema, replace the
 * proxy display here (search: FUTURE-BZ-WIND).
 */

import type { SpaceWeatherState } from '../../hooks/useSpaceWeather';
import { useLanguage } from '../../contexts/LanguageContext';

// ── G-scale → display colour ──────────────────────────────────────────────────

function gScaleColor(gScale: string): string {
  if (gScale >= 'G5') return '#FF2020';
  if (gScale >= 'G4') return '#FF5500';
  if (gScale >= 'G3') return '#FF8C00';
  if (gScale >= 'G2') return '#FFB300';
  return '#D4AF37'; // G1 / G0 fallback (component won't render below G1 threshold)
}

// ── Labels ────────────────────────────────────────────────────────────────────

const G_SCALE_DE: Record<string, string> = {
  G1: 'Schwacher Magnetsturm',
  G2: 'Mäßiger Magnetsturm',
  G3: 'Starker Magnetsturm',
  G4: 'Sehr starker Magnetsturm',
  G5: 'Extremer Magnetsturm',
};

const G_SCALE_EN: Record<string, string> = {
  G1: 'Minor geomagnetic storm',
  G2: 'Moderate geomagnetic storm',
  G3: 'Strong geomagnetic storm',
  G4: 'Severe geomagnetic storm',
  G5: 'Extreme geomagnetic storm',
};

// ── Component ─────────────────────────────────────────────────────────────────

interface MagnetsturmKarteProps {
  /** Live space-weather state, owned by Dashboard.tsx (single poller). */
  spaceWeather: SpaceWeatherState;
}

export function MagnetsturmKarte({ spaceWeather: sw }: MagnetsturmKarteProps) {
  const { lang } = useLanguage();
  const isDe = lang === 'de';

  // Self-hide when Kp < 4 (below G1 threshold)
  // Source: spaceWeather.kpIndex (NOAA SWPC /api/space-weather/extended via Dashboard)
  if (sw.loading || sw.kpIndex < 4) return null;

  // Source: spaceWeather.gScale (derived from kpIndex in solar-pressure.ts)
  const color = gScaleColor(sw.gScale);
  const label = isDe
    ? (G_SCALE_DE[sw.gScale] ?? sw.gScale)
    : (G_SCALE_EN[sw.gScale] ?? sw.gScale);

  // G3+ = kpIndex >= 7 → pulse border animation
  const isG3Plus = sw.gScale >= 'G3';

  return (
    <div
      className="cosmic-tile p-5 sm:p-6 space-y-4 group"
      data-testid="magnetsturm-karte"
      style={{
        borderColor: `${color}55`,
        // G3+ pulse: animated border glow
        boxShadow: isG3Plus
          ? `0 0 0 1px ${color}66, 0 0 16px ${color}33`
          : undefined,
        animation: isG3Plus ? 'magnetsturm-pulse 2s ease-in-out infinite' : undefined,
        '--tile-glow-color': `${color}99`,
      } as React.CSSProperties}
    >
      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Source: spaceWeather.gScale */}
          <span
            className="text-[9px] font-bold tracking-[0.25em] uppercase px-2 py-0.5 rounded-full"
            style={{ background: `${color}22`, color }}
          >
            {/* Source: spaceWeather.gScale (NOAA Kp→G-scale conversion) */}
            {sw.gScale}
          </span>
          <span
            className="text-xs font-medium"
            style={{ color: 'var(--tile-text-primary)' }}
          >
            {label}
          </span>
        </div>
        {isG3Plus && (
          <span
            className="text-[9px] uppercase tracking-widest font-bold animate-pulse"
            style={{ color }}
          >
            AKTIV
          </span>
        )}
      </div>

      {/* ── Values ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Kp Index */}
        {/* Source: spaceWeather.kpIndex (NOAA SWPC Kp 3-hour index) */}
        <ValueCell
          label={isDe ? 'Kp-Index' : 'Kp Index'}
          value={sw.kpIndex.toFixed(1)}
          unit=""
          color={color}
          tooltip={isDe
            ? 'Planetarischer K-Index — misst globale geomagnetische Aktivität (0–9)'
            : 'Planetary K-index — measures global geomagnetic activity (0–9)'}
        />

        {/* Solar pressure */}
        {/* Source: spaceWeather.solarPressure (computeSolarPressureScore in solar-pressure.ts) */}
        <ValueCell
          label={isDe ? 'Solardruck' : 'Solar pressure'}
          value={Math.round(sw.solarPressure * 100).toString()}
          unit="%"
          color={color}
          tooltip={isDe
            ? 'Kombinierter Solardruck aus Kp, Röntgenstrahlung und Protonenflusss (0–100 %)'
            : 'Combined solar pressure from Kp, X-ray, and proton flux (0–100 %)'}
        />

        {/* X-ray class — FUTURE-BZ-WIND: replace with solar wind speed km/s when available */}
        {/* Source: spaceWeather.xrayClass (NOAA SWPC GOES X-ray 1-8 Å) */}
        {sw.xrayClass !== 'A' && (
          <ValueCell
            label={isDe ? 'Röntgenklasse' : 'X-ray class'}
            value={sw.xrayClass}
            unit=""
            color={color}
            tooltip={isDe
              ? 'GOES-Röntgenstrahlungsklasse: A < B < C < M < X'
              : 'GOES X-ray flux class: A < B < C < M < X'}
          />
        )}

        {/* Proton flux if elevated (≥ 10 pfu = threshold for proton event) */}
        {/* Source: spaceWeather.protonFlux (NOAA SWPC GOES proton ≥10 MeV) */}
        {sw.protonFlux >= 10 && (
          <ValueCell
            label={isDe ? 'Protonenfluss' : 'Proton flux'}
            value={sw.protonFlux.toFixed(0)}
            unit=" pfu"
            color={color}
            tooltip={isDe
              ? 'Protonenfluss ≥10 MeV in Partikel·Flussdichte-Einheiten (pfu)'
              : 'Proton flux ≥10 MeV in particle flux units (pfu)'}
          />
        )}
      </div>

      {/* ── Signatur impact note ───────────────────────────────────── */}
      {/* Source: derived label — no bare number, qualitative description only */}
      <p
        className="text-[11px] leading-relaxed"
        style={{ color: 'var(--tile-text-secondary)', opacity: 0.6 }}
      >
        {isDe
          ? isG3Plus
            ? 'Starke geomagnetische Aktivität — deine Signatur pulsiert mit erhöhter Intensität.'
            : 'Erhöhte geomagnetische Aktivität — deine Signatur reagiert auf den Sonnenwind.'
          : isG3Plus
          ? 'Strong geomagnetic activity — your Signatur pulses with elevated intensity.'
          : 'Elevated geomagnetic activity — your Signatur responds to the solar wind.'}
      </p>
    </div>
  );
}

// ── ValueCell sub-component ───────────────────────────────────────────────────

function ValueCell({
  label,
  value,
  unit,
  color,
  tooltip,
}: {
  label: string;
  value: string;
  unit: string;
  color: string;
  tooltip: string;
}) {
  return (
    <div
      className="rounded-xl p-3 space-y-0.5"
      style={{ background: `${color}0D` }}
      title={tooltip}
    >
      <p
        className="text-[9px] uppercase tracking-widest"
        style={{ color: 'var(--tile-text-secondary)', opacity: 0.6 }}
      >
        {label}
      </p>
      <p
        className="text-base font-semibold tabular-nums"
        style={{ color }}
      >
        {value}
        {unit && (
          <span className="text-[10px] font-normal ml-0.5 opacity-70">{unit}</span>
        )}
      </p>
    </div>
  );
}
