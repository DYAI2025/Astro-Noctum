/**
 * DailyChartHero — Unified volatile dashboard hero.
 *
 * Replaces: KohaerenzHero + AktiveEinfluesseFusion + DayPulseExpanded
 * Implements: REQ-F-daily-chart-coherence-hero, REQ-F-coherence-hero-impact-datasource,
 *             REQ-F-active-planets-frontend, REQ-USA-daily-chart-responsive-readability
 * Decision: DEC-dashboard-volatile-first (position 1 — unified hero)
 */

import { useMemo } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useLanguage } from '../../contexts/LanguageContext';
import { ActiveImpactsList } from '../shared/ActiveImpactsList';
import type { SpaceWeatherState } from '../../hooks/useSpaceWeather';
import type { TransitEvent } from '../../lib/schemas/transit-state';

// ── Coherence tooltip copy (canonical source: docs/KOHAERENZ_INDEX.md §3.1–3.2) ──

const COHERENCE_TOOLTIP_DE =
  'Der Kohärenzindex misst, wie stark deine Natal-Signatur gerade mit der Welt resoniert. ' +
  'Er setzt sich aus Natal-Kern, heutigem Transit, deiner Quiz-Kalibrierung und der kosmischen ' +
  'Membran (Kp, Sonnenwind) zusammen. Er sagt nicht aus, wer du bist, sondern wie laut deine ' +
  'Struktur heute spricht.';

const COHERENCE_TOOLTIP_EN =
  'The coherence index measures how strongly your natal signature resonates with the world ' +
  'right now. It combines natal core, today\'s transits, your quiz calibration, and the cosmic ' +
  'membrane (Kp, solar wind). It does not say who you are — it says how loudly your structure ' +
  'speaks today.';

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
  transitEvents: TransitEvent[];
  dayMode: 'pulse' | 'trace' | 'spannung';
  /**
   * Western zodiac sign (e.g. "Aries"). Drives the `ActiveImpactsList`
   * compact variant rendered below the driver strip.
   */
  birthSign?: string | null;
  /**
   * Real daily horoscope text (Phase 5). Populate from
   * `dailyData.fusion.synthesis ?? dailyData.fusion.summary`
   * (Experience API `/api/experience/daily` → useFirstRunDaily).
   * When empty/undefined, the Tagesimpuls section is suppressed —
   * preferred over rendering a meaningless placeholder.
   */
  impulsText?: string;
  /**
   * True when the user's birth data (date + coordinates) is missing in the DB,
   * causing useFirstRunDaily to exit early without fetching.
   * Renders a profile-completion nudge in place of the Tagesimpuls section
   * instead of silently showing nothing.
   */
  profileIncomplete?: boolean;
  /** Called when the user clicks the profile-completion CTA. Typically onReset. */
  onCompleteProfile?: () => void;
  /** Optional callback to open the day-detail modal (feature-flagged) */
  onOpenDayModal?: () => void;
  /**
   * Error state propagated from useFirstRunDaily when the daily-pulse fetch failed.
   * When non-null, Task 1.10 will render a prominent `[CODE] message` block in
   * place of the Tagesimpuls section. Per project doctrine 2026-05-08:
   * errors are surfaced, not masked.
   *
   * Wire established in Task 1.11. Render branch landing in Task 1.10.
   */
  error?: { code: string; message: string } | null;
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

// ── Coherence subtitle (dynamic, delta-direction-aware) ───────────────────────

function coherenceSubtitle(
  base: number,
  displayed: number,
  delta: number,
  lang: 'de' | 'en',
): string {
  const b = Math.round(base);
  const d = Math.round(displayed);
  if (delta > 0.01) {
    return lang === 'de'
      ? `Dein Basiswert ${b}, heute durch kosmische Aktivierung angehoben auf ${d}.`
      : `Your baseline ${b}, elevated by today's cosmic activation to ${d}.`;
  }
  if (delta < -0.01) {
    return lang === 'de'
      ? `Dein Basiswert ${b}, heute durch kosmische Spannung auf ${d} gedämpft.`
      : `Your baseline ${b}, dampened by today's cosmic tension to ${d}.`;
  }
  return lang === 'de'
    ? `Dein Basiswert ${b}, heute ohne spürbare kosmische Modulation.`
    : `Your baseline ${b}, today without noticeable cosmic modulation.`;
}

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
  transitEvents,
  dayMode,
  birthSign,
  impulsText,
  profileIncomplete,
  onCompleteProfile,
  onOpenDayModal,
  error,
}: DailyChartHeroProps) {
  const { lang } = useLanguage();
  const isDe = lang === 'de';

  const displayed = displayedCoherence ?? (baseCoherence ?? 0);
  const base = baseCoherence ?? displayed;
  const delta = positiveDailyDelta ?? 0;

  // Defensive null-guards: spaceWeather and individual values may be null/undefined
  // during NOAA SWPC outages, before useSpaceWeather() resolves, or when an old
  // localStorage cache hydrates with missing keys. Render em-dash "—" for any
  // missing value — visible degraded state, no crash, no misleading "Kp null"
  // or "0%" rendering. (TASK-4.3)
  const kp = spaceWeather?.kpIndex;
  const sp = spaceWeather?.solarPressure;
  const transitCount = transitEvents?.length;
  const drivers = useMemo(() => [
    {
      label: isDe ? 'Geomagnetik' : 'Geomagnetic',
      value: kp != null && Number.isFinite(kp) ? `Kp ${kp}` : '—',
      state: kp != null && Number.isFinite(kp) ? classifyKp(kp) : 'calm' as const,
    },
    {
      label: isDe ? 'Solardruck' : 'Solar pressure',
      value: sp != null && Number.isFinite(sp) ? `${Math.round(sp * 100)}%` : '—',
      state: sp != null && Number.isFinite(sp) ? classifySolarPressure(sp) : 'calm' as const,
    },
    {
      label: isDe ? 'Transit-Aktivität' : 'Transit activity',
      value: transitCount != null
        ? `${transitCount} ${isDe ? 'aktiv' : 'active'}`
        : '—',
      state: transitCount != null
        ? classifyTransitCount(transitCount)
        : 'calm' as const,
    },
  ], [kp, sp, transitCount, isDe]);

  if (loading) return <DailyChartHeroSkeleton />;

  const isUnavailable = displayedCoherence == null && baseCoherence == null;

  // dayMode still drives the subtle tile-glow accent (gold for pulse,
  // lavender for trace, terracotta for spannung); Phase 5 removed the
  // mode-badge/description UI that also consumed it.
  const accentColor =
    dayMode === 'pulse' ? '#D4AF37'
    : dayMode === 'spannung' ? '#E27D60'
    : '#9B8EC4';
  const hasImpuls = typeof impulsText === 'string' && impulsText.trim().length > 0;

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
          <Tooltip.Provider delayDuration={500}>
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <div
                  data-testid="coherence-ring"
                  tabIndex={0}
                  aria-label={isDe ? 'Kohärenzindex-Erklärung anzeigen' : 'Show coherence index explanation'}
                  className="cursor-help focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tile-accent)] rounded-full"
                >
                  <SplitCoherenceRing
                    baseCoherence={base}
                    positiveDailyDelta={delta}
                    displayedCoherence={displayed}
                  />
                </div>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  sideOffset={8}
                  className="z-50 max-w-sm rounded-lg p-3 text-xs leading-relaxed shadow-xl"
                  style={{
                    background: 'var(--tile-bg, rgba(10, 8, 20, 0.96))',
                    color: 'var(--tile-text-primary, #fff)',
                    border: '1px solid var(--tile-border, rgba(212, 175, 55, 0.2))',
                  }}
                >
                  {isDe ? COHERENCE_TOOLTIP_DE : COHERENCE_TOOLTIP_EN}
                  <Tooltip.Arrow
                    width={10}
                    height={6}
                    style={{ fill: 'var(--tile-bg, rgba(10, 8, 20, 0.96))' }}
                  />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </Tooltip.Provider>
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
              data-testid="coherence-subtitle"
            >
              {coherenceSubtitle(base, displayed, delta, lang)}
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

      {/* ── C. Active Impacts — shared with Signatur page ──────────────── */}
      <div
        className="pt-4 border-t"
        style={{ borderColor: 'var(--tile-border)' }}
        data-testid="active-impacts-section"
      >
        <p
          className="text-[9px] font-bold uppercase tracking-[0.2em] mb-3"
          style={{ color: 'var(--tile-text-secondary)', opacity: 0.5 }}
        >
          {isDe ? 'Aktive Einflüsse' : 'Active influences'}
        </p>
        <ActiveImpactsList
          birthSign={birthSign ?? undefined}
          variant="compact"
          maxItems={4}
          hideHeader
        />
      </div>


      {/* ── D. Tagesimpuls — error state wins, then real horoscope, then profile nudge ──
            Per project doctrine 2026-05-08: errors are surfaced, not masked.
            Error renders a prominent [CODE] block with role="alert" and beats
            stale impulsText so a cached value from a prior successful fetch never
            appears alongside an active error (no masquerade). */}
      {error ? (
        <section
          className="mt-2 pt-5 border-t"
          style={{ borderColor: 'var(--tile-border)' }}
          data-testid="daily-pulse-error"
          role="alert"
        >
          <div
            className="rounded-lg border px-4 py-3 max-w-prose mx-auto"
            style={{
              borderColor: 'var(--color-error-border, rgba(220, 38, 38, 0.4))',
              background: 'var(--color-error-bg, rgba(220, 38, 38, 0.08))',
            }}
          >
            <p
              className="text-xs font-mono mb-1"
              style={{ color: 'var(--color-error-code, rgb(248, 113, 113))' }}
              data-testid="daily-pulse-error-code"
            >
              [{error.code}]
            </p>
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'var(--tile-text-primary)' }}
              data-testid="daily-pulse-error-message"
            >
              {error.message}
            </p>
          </div>
        </section>
      ) : hasImpuls ? (
        <section
          className="mt-2 pt-5 border-t"
          style={{ borderColor: 'var(--tile-border)' }}
          data-testid="day-impulse-section"
        >
          <h3
            className="text-center font-serif text-2xl mb-3"
            style={{ color: 'var(--tile-text-primary)' }}
          >
            {isDe ? 'Tagesimpuls' : 'Daily impulse'}
          </h3>
          <p
            className="text-sm leading-relaxed text-center max-w-prose mx-auto"
            style={{ color: 'var(--tile-text-secondary)' }}
          >
            {impulsText}
          </p>
          {onOpenDayModal && (
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={onOpenDayModal}
                className="text-[10px] font-serif tracking-wide focus-visible:ring-1 focus-visible:ring-current focus-visible:outline-none rounded"
                style={{ color: 'var(--tile-accent)', opacity: 0.7 }}
                data-testid="day-detail-trigger"
              >
                {isDe ? 'vertiefen \u2192' : 'explore \u2192'}
              </button>
            </div>
          )}
        </section>
      ) : profileIncomplete ? (
        <section
          className="mt-2 pt-5 border-t text-center"
          style={{ borderColor: 'var(--tile-border)' }}
          data-testid="day-impulse-incomplete"
        >
          <p
            className="text-sm leading-relaxed max-w-prose mx-auto"
            style={{ color: 'var(--tile-text-secondary)', opacity: 0.6 }}
          >
            {isDe
              ? 'Der Tagesimpuls wird berechnet, sobald dein Geburtsprofil vollst\u00e4ndig ist.'
              : 'Your daily impulse is calculated once your birth profile is complete.'}
          </p>
          {onCompleteProfile && (
            <button
              type="button"
              onClick={onCompleteProfile}
              className="mt-3 text-[10px] font-serif tracking-wide focus-visible:ring-1 focus-visible:ring-current focus-visible:outline-none rounded"
              style={{ color: 'var(--tile-accent)', opacity: 0.7 }}
              data-testid="complete-profile-trigger"
            >
              {isDe ? 'Profil vervollst\u00e4ndigen \u2192' : 'Complete profile \u2192'}
            </button>
          )}
        </section>
      ) : null}
    </div>
  );
}
