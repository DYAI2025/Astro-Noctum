/**
 * DailyChartHero — Unified volatile dashboard hero.
 *
 * Replaces: KohaerenzHero + AktiveEinfluesseFusion + DayPulseExpanded
 * Implements: REQ-F-daily-chart-coherence-hero, REQ-F-coherence-hero-impact-datasource,
 *             REQ-F-active-planets-frontend, REQ-USA-daily-chart-responsive-readability
 * Decision: DEC-dashboard-volatile-first (position 1 — unified hero)
 */

import { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import type { ActivePlanet } from '../../lib/schemas/active-impacts';
import type { SpaceWeatherState } from '../../hooks/useSpaceWeather';
import type { TransitEvent } from '../../lib/schemas/transit-state';

// ── Props ─────────────────────────────────────────────────────────────────────

export interface DailyChartHeroProps {
  loading: boolean;
  /** Stable natal baseline (0–100) */
  baseCoherence: number | null;
  /** Today's positive solar/transit activation (≥0) */
  positiveDailyDelta: number | null;
  /** Value shown in ring = base + delta (0–100) */
  displayedCoherence: number | null;
  spaceWeather: SpaceWeatherState;
  activePlanets: ActivePlanet[];
  transitEvents: TransitEvent[];
  dayMode: 'pulse' | 'trace';
  /** Optional callback to open the day-detail modal (feature-flagged) */
  onOpenDayModal?: () => void;
}

// ── Split Coherence Ring ───────────────────────────────────────────────────────

function SplitCoherenceRing({
  baseCoherence,
  positiveDailyDelta,
  displayedCoherence,
  size = 120,
}: {
  baseCoherence: number;
  positiveDailyDelta: number;
  displayedCoherence: number;
  size?: number;
}) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const baseOffset = circumference * (1 - baseCoherence / 100);
  const deltaOffset = circumference * (1 - displayedCoherence / 100);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        {/* Track */}
        <circle cx={size / 2} cy={size / 2} r={radius}
          fill="none" strokeWidth={6} stroke="var(--tile-border)" />
        {/* Delta overlay (lighter) — full displayed value */}
        {positiveDailyDelta > 0 && (
          <circle cx={size / 2} cy={size / 2} r={radius}
            fill="none" strokeWidth={6}
            stroke="var(--tile-accent)"
            strokeDasharray={circumference}
            strokeDashoffset={deltaOffset}
            strokeLinecap="round"
            opacity={0.35}
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        )}
        {/* Baseline arc — gold, primary */}
        <circle cx={size / 2} cy={size / 2} r={radius}
          fill="none" strokeWidth={6}
          stroke="var(--tile-accent)"
          strokeDasharray={circumference}
          strokeDashoffset={baseOffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-serif text-3xl leading-none"
          style={{ color: 'var(--tile-text-primary)' }}
          data-testid="coherence-value"
        >
          {displayedCoherence}
        </span>
        {positiveDailyDelta > 0 && (
          <span
            className="text-[8px] font-mono mt-0.5"
            style={{ color: 'var(--tile-accent)', opacity: 0.7 }}
          >
            +{positiveDailyDelta}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Driver Strip ───────────────────────────────────────────────────────────────

type DriverState = 'calm' | 'active' | 'tense';

const STATE_CLASSES: Record<DriverState, string> = {
  calm:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  active: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  tense:  'bg-red-500/10 text-red-400 border-red-500/20',
};

function classifyKp(kp: number): DriverState {
  if (kp <= 2) return 'calm';
  if (kp <= 4) return 'active';
  return 'tense';
}
function classifySolarPressure(sp: number): DriverState {
  if (sp < 0.3) return 'calm';
  if (sp <= 0.6) return 'active';
  return 'tense';
}
function classifyTransitCount(n: number): DriverState {
  if (n <= 1) return 'calm';
  if (n <= 3) return 'active';
  return 'tense';
}

// ── Planet Card ────────────────────────────────────────────────────────────────

function PlanetCard({ planet, isDe }: { planet: ActivePlanet; isDe: boolean }) {
  const [open, setOpen] = useState(false);

  const strengthLabel = planet.strength >= 0.7
    ? (isDe ? 'Stark' : 'Strong')
    : planet.strength >= 0.4
      ? (isDe ? 'Mittel' : 'Moderate')
      : (isDe ? 'Gering' : 'Mild');

  const explanation = isDe
    ? `${planet.planet} bildet einen ${planet.aspect_type} (${planet.orb.toFixed(1)}°) zu deinem Natal-${planet.natal_planet}${planet.wu_xing_element ? ` — ${planet.wu_xing_element}-Feld aktiv` : ''}.`
    : `${planet.planet} forms a ${planet.aspect_type} (${planet.orb.toFixed(1)}°) to your natal ${planet.natal_planet}${planet.wu_xing_element ? ` — ${planet.wu_xing_element} field active` : ''}.`;

  return (
    <div
      className="rounded-xl border p-3 text-[11px] space-y-1.5"
      style={{ borderColor: 'var(--tile-border)', background: 'var(--tile-bg)' }}
    >
      <div className="flex items-center gap-2">
        <span className="font-semibold" style={{ color: 'var(--tile-text-primary)' }}>
          {planet.planet}
        </span>
        <span
          className="text-[9px] px-1.5 py-0.5 rounded-full font-mono"
          style={{ background: 'var(--tile-glow)', color: 'var(--tile-accent)' }}
        >
          {strengthLabel}
        </span>
        <button
          className="ml-auto flex items-center gap-0.5 text-[9px] uppercase tracking-wide focus-visible:ring-1 focus-visible:ring-current focus-visible:outline-none rounded"
          style={{ color: 'var(--tile-accent)', opacity: 0.7 }}
          onClick={() => setOpen(v => !v)}
          aria-expanded={open}
          aria-label={isDe ? `Erklärung für ${planet.planet}` : `Explanation for ${planet.planet}`}
        >
          {isDe ? 'Warum?' : 'Why?'}
          <ChevronDown
            className="w-3 h-3 transition-transform duration-200"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
            aria-hidden="true"
          />
        </button>
      </div>
      <div className="flex items-center gap-1.5" style={{ color: 'var(--tile-text-secondary)', opacity: 0.65 }}>
        <span>{planet.aspect_type}</span>
        <span>·</span>
        <span>{isDe ? 'Natal' : 'natal'} {planet.natal_planet}</span>
      </div>
      {open && (
        <p
          className="text-[10px] leading-relaxed pt-1 border-t"
          style={{ color: 'var(--tile-text-secondary)', opacity: 0.8, borderColor: 'var(--tile-border)' }}
          data-testid={`planet-explanation-${planet.planet}`}
        >
          {explanation}
        </p>
      )}
    </div>
  );
}

// ── Day-Impulse Text ───────────────────────────────────────────────────────────

const MODE_LABEL: Record<'pulse' | 'trace', { de: string; en: string }> = {
  pulse: { de: 'Tages-Impuls', en: 'Day Pulse' },
  trace: { de: 'Tages-Spur',  en: 'Day Trace' },
};
const MODE_DESC: Record<'pulse' | 'trace', { de: string; en: string }> = {
  pulse: { de: 'Aktiver Tag — Bewegung, Sichtbarkeit, Außenwirkung.', en: 'Active day — movement, visibility, outward energy.' },
  trace: { de: 'Reflexiver Tag — nach innen horchen, Muster erkennen.', en: 'Reflective day — listen inward, recognise patterns.' },
};

// ── Skeleton ───────────────────────────────────────────────────────────────────

function DailyChartHeroSkeleton() {
  return (
    <div
      className="cosmic-tile p-6 sm:p-8 rounded-[2rem] space-y-5 animate-pulse"
      data-testid="daily-chart-hero-skeleton"
    >
      <div className="flex items-center gap-6 sm:gap-8">
        <div className="w-[120px] h-[120px] rounded-full bg-white/5 shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-2 w-20 rounded bg-white/10" />
          <div className="h-5 w-40 rounded bg-white/10" />
          <div className="h-2 w-56 rounded bg-white/10" />
        </div>
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-7 flex-1 rounded-lg bg-white/5" />)}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function DailyChartHero({
  loading,
  baseCoherence,
  positiveDailyDelta,
  displayedCoherence,
  spaceWeather,
  activePlanets,
  transitEvents,
  dayMode,
  onOpenDayModal,
}: DailyChartHeroProps) {
  const { lang } = useLanguage();
  const isDe = lang === 'de';

  const displayed = displayedCoherence ?? (baseCoherence ?? 0);
  const base = baseCoherence ?? displayed;
  const delta = positiveDailyDelta ?? 0;

  const drivers = useMemo(() => [
    {
      label: isDe ? 'Geomagnetik' : 'Geomagnetic',
      value: `Kp ${spaceWeather.kpIndex}`,
      state: classifyKp(spaceWeather.kpIndex),
    },
    {
      label: isDe ? 'Solardruck' : 'Solar pressure',
      value: `${Math.round(spaceWeather.solarPressure * 100)}%`,
      state: classifySolarPressure(spaceWeather.solarPressure),
    },
    {
      label: isDe ? 'Transit-Aktivität' : 'Transit activity',
      value: `${transitEvents.length} ${isDe ? 'aktiv' : 'active'}`,
      state: classifyTransitCount(transitEvents.length),
    },
    {
      label: isDe ? 'Tagesfeld' : 'Day field',
      value: dayMode === 'pulse' ? (isDe ? 'Impuls' : 'Pulse') : (isDe ? 'Spur' : 'Trace'),
      state: (dayMode === 'pulse' ? 'calm' : 'active') as DriverState,
    },
  ], [spaceWeather.kpIndex, spaceWeather.solarPressure, transitEvents.length, dayMode, isDe]);

  const sortedPlanets = useMemo(
    () => [...activePlanets].sort((a, b) => b.strength - a.strength),
    [activePlanets],
  );

  const primaryEvent = useMemo(
    () => [...transitEvents].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0],
    [transitEvents],
  );

  if (loading) return <DailyChartHeroSkeleton />;

  const isUnavailable = displayedCoherence == null && baseCoherence == null;

  const modeLabel = isDe ? MODE_LABEL[dayMode].de : MODE_LABEL[dayMode].en;
  const modeDesc  = isDe ? MODE_DESC[dayMode].de  : MODE_DESC[dayMode].en;
  const accentColor = dayMode === 'pulse' ? '#D4AF37' : '#9B8EC4';
  const hasEventText = (primaryEvent?.description_de ?? '').length > 0;

  return (
    <div
      className="daily-chart-hero cosmic-tile p-6 sm:p-8 rounded-[2rem] space-y-5 group"
      data-testid="daily-chart-hero"
      style={{ '--tile-glow-color': `${accentColor}99` } as React.CSSProperties}
    >
      {/* ── A. Coherence Ring + Label ─────────────────────────────────── */}
      {isUnavailable ? (
        <div className="flex items-center gap-6 sm:gap-8" data-testid="coherence-unavailable">
          <div className="relative shrink-0 w-[120px] h-[120px] flex items-center justify-center">
            <svg width={120} height={120} className="-rotate-90" aria-hidden="true">
              <circle cx={60} cy={60} r={54} fill="none" strokeWidth={6} stroke="var(--tile-border)" strokeDasharray="8 4" />
            </svg>
            <span className="absolute text-lg font-serif" style={{ color: 'var(--tile-text-secondary)', opacity: 0.4 }}>—</span>
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-[9px] font-sans uppercase tracking-[0.3em]" style={{ color: 'var(--tile-accent)', opacity: 0.6 }}>
              {isDe ? 'Kohärenzindex' : 'Coherence index'}
            </p>
            <p className="font-serif text-base sm:text-lg leading-snug" style={{ color: 'var(--tile-text-secondary)', opacity: 0.6 }}>
              {isDe ? 'Derzeit nicht verfügbar' : 'Currently unavailable'}
            </p>
            <p className="text-[10px] leading-relaxed" style={{ color: 'var(--tile-text-secondary)', opacity: 0.45 }}>
              {isDe ? 'Der Kohärenzindex wird berechnet, sobald dein Profil vollständig ist.' : 'The coherence index will be computed once your profile is complete.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-6 sm:gap-8">
          <SplitCoherenceRing
            baseCoherence={base}
            positiveDailyDelta={delta}
            displayedCoherence={displayed}
          />
          <div className="flex-1 min-w-0 space-y-1">
            <p
              className="text-[9px] font-sans uppercase tracking-[0.3em]"
              style={{ color: 'var(--tile-accent)', opacity: 0.6 }}
            >
              {isDe ? 'Kohärenzindex' : 'Coherence index'}
            </p>
            <p
              className="font-serif text-base sm:text-lg leading-snug"
              style={{ color: 'var(--tile-text-primary)' }}
              data-testid="coherence-baseline-label"
            >
              {isDe
                ? `Basis ${base} · Heute +${delta}`
                : `Base ${base} · Today +${delta}`}
            </p>
            <p
              className="text-[10px] leading-relaxed"
              style={{ color: 'var(--tile-text-secondary)', opacity: 0.65 }}
            >
              {isDe
                ? 'Dein persönlicher Grundwert, heute durch kosmische Aktivierung erhöht.'
                : 'Your personal baseline, elevated by today\'s cosmic activation.'}
            </p>
          </div>
        </div>
      )}

      {/* ── B. Driver Strip ───────────────────────────────────────────── */}
      <div
        className="flex flex-wrap gap-2 pt-4 border-t"
        style={{ borderColor: 'var(--tile-border)' }}
        data-testid="driver-strip"
      >
        {drivers.map(driver => (
          <div
            key={driver.label}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-mono ${STATE_CLASSES[driver.state]}`}
          >
            <span className="opacity-70">{driver.label}</span>
            <span className="font-semibold">{driver.value}</span>
          </div>
        ))}
      </div>

      {/* ── C. Active Planets ─────────────────────────────────────────── */}
      {sortedPlanets.length > 0 ? (
        <div
          className="space-y-2 pt-4 border-t"
          style={{ borderColor: 'var(--tile-border)' }}
          data-testid="active-planets-section"
        >
          <p
            className="text-[9px] font-bold uppercase tracking-[0.2em]"
            style={{ color: 'var(--tile-text-secondary)', opacity: 0.5 }}
          >
            {isDe ? 'Aktive Planeten' : 'Active planets'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sortedPlanets.map(planet => (
              <PlanetCard key={`${planet.planet}-${planet.natal_planet}`} planet={planet} isDe={isDe} />
            ))}
          </div>
        </div>
      ) : (
        <div
          className="pt-4 border-t"
          style={{ borderColor: 'var(--tile-border)' }}
          data-testid="no-active-planets"
        >
          <p
            className="text-[10px] text-center"
            style={{ color: 'var(--tile-text-secondary)', opacity: 0.5 }}
          >
            {isDe ? 'Keine aktiven Planeteneinflüsse heute.' : 'No active planetary influences today.'}
          </p>
        </div>
      )}

      {/* ── D. Day-Impulse Block ──────────────────────────────────────── */}
      <div
        className="space-y-2 pt-4 border-t"
        style={{ borderColor: 'var(--tile-border)' }}
        data-testid="day-impulse-section"
      >
        <div className="flex items-center gap-2">
          <span
            className="text-[9px] font-bold tracking-[0.25em] uppercase px-2 py-0.5 rounded-full"
            style={{ background: `${accentColor}22`, color: accentColor }}
          >
            {modeLabel}
          </span>
        </div>
        <p
          className="text-[11px] leading-relaxed"
          style={{ color: 'var(--tile-text-secondary)', opacity: 0.7 }}
        >
          {modeDesc}
        </p>
        {hasEventText ? (
          <div className="space-y-1">
            <p className="text-sm leading-relaxed" style={{ color: 'var(--tile-text-primary)' }}>
              {primaryEvent!.description_de}
            </p>
            {(primaryEvent?.personal_context ?? '').length > 0 && (
              <p className="text-xs leading-relaxed italic" style={{ color: 'var(--tile-text-secondary)', opacity: 0.75 }}>
                {primaryEvent!.personal_context}
              </p>
            )}
          </div>
        ) : (
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'var(--tile-text-secondary)', opacity: 0.6 }}
            data-testid="impulse-fallback"
          >
            {isDe ? 'Heute keine markanten Ereignisse. Nutze die Ruhe.' : 'No significant events today. Use the quiet.'}
          </p>
        )}
        {primaryEvent?.trigger_planet && (
          <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--tile-text-secondary)', opacity: 0.5 }}>
            {primaryEvent.trigger_symbol && <span aria-hidden="true">{primaryEvent.trigger_symbol}</span>}
            <span>{primaryEvent.trigger_planet}</span>
            {primaryEvent.sector_domain && <span>· {primaryEvent.sector_domain}</span>}
          </div>
        )}
        {onOpenDayModal && (
          <button
            onClick={onOpenDayModal}
            className="self-start text-[10px] font-serif tracking-wide focus-visible:ring-1 focus-visible:ring-current focus-visible:outline-none rounded"
            style={{ color: 'var(--tile-accent)', opacity: 0.7 }}
            data-testid="day-detail-trigger"
          >
            {isDe ? 'vertiefen \u2192' : 'explore \u2192'}
          </button>
        )}
      </div>
    </div>
  );
}
