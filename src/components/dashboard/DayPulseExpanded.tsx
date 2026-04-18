/**
 * DayPulseExpanded — always-expanded Day Pulse / Day Trace section.
 *
 * Implements: REQ-F-dashboard-live-daily-signals
 * Decision:   DEC-dashboard-volatile-first (position 1 — never collapsed)
 * Decision:   DEC-no-number-without-explanation (no bare numbers)
 *
 * Data sources:
 *   - events[]      — from useSignaturSignal().events (FuFirE /transit/state)
 *   - dayMode       — from useFirstRunDaily().dailyData.fusion.day_mode
 *
 * The component renders verbatim server-provided text. It never templates or
 * rewrites description_de / personal_context (REQ-F-dashboard-live-daily-signals AC).
 */

import { useLanguage } from '../../contexts/LanguageContext';
import type { TransitEvent } from '../../lib/schemas/transit-state';

// ── Types ────────────────────────────────────────────────────────────────────

interface DayPulseExpandedProps {
  /** Transit events from useSignaturSignal().events */
  events: TransitEvent[];
  /** 'pulse' = active / energetic day; 'trace' = reflective / inward day */
  dayMode: 'pulse' | 'trace';
  /** True while initial transit data is loading */
  loading?: boolean;
}

// ── Mode labels ──────────────────────────────────────────────────────────────

const MODE_LABEL: Record<'pulse' | 'trace', { de: string; en: string }> = {
  pulse: { de: 'Tages-Impuls', en: 'Day Pulse' },
  trace: { de: 'Tages-Spur',   en: 'Day Trace' },
};

const MODE_DESCRIPTION: Record<'pulse' | 'trace', { de: string; en: string }> = {
  pulse: {
    de: 'Aktiver Tag — Bewegung, Sichtbarkeit, Außenwirkung.',
    en: 'Active day — movement, visibility, outward energy.',
  },
  trace: {
    de: 'Reflexiver Tag — nach innen horchen, Muster erkennen.',
    en: 'Reflective day — listen inward, recognise patterns.',
  },
};

// ── Fallback copy (per REQ-F-dashboard-live-daily-signals AC) ────────────────

const FALLBACK_DE = 'Heute keine markanten Ereignisse. Nutze die Ruhe.';
const FALLBACK_EN = 'No significant events today. Use the quiet.';

// ── Skeleton ─────────────────────────────────────────────────────────────────

function DayPulseExpandedSkeleton() {
  return (
    <div className="cosmic-tile p-5 sm:p-6 space-y-3 animate-pulse">
      <div className="h-3 w-24 rounded bg-white/10" />
      <div className="h-4 w-3/4 rounded bg-white/10" />
      <div className="h-4 w-full rounded bg-white/10" />
      <div className="h-4 w-5/6 rounded bg-white/10" />
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export function DayPulseExpanded({ events, dayMode, loading = false }: DayPulseExpandedProps) {
  const { lang } = useLanguage();
  const isDe = lang === 'de';

  if (loading) return <DayPulseExpandedSkeleton />;

  // Mode badge text
  // Source: dayMode prop (from useFirstRunDaily().dailyData.fusion.day_mode)
  const modeLabel = isDe ? MODE_LABEL[dayMode].de : MODE_LABEL[dayMode].en;
  const modeDesc  = isDe ? MODE_DESCRIPTION[dayMode].de : MODE_DESCRIPTION[dayMode].en;

  // Primary event — highest-priority event for today.
  // Source: useSignaturSignal().events (FuFirE /transit/state, sorted by priority desc)
  const primaryEvent: TransitEvent | undefined = events
    .slice()
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0];

  // Event description text — verbatim server-provided copy (never templated).
  // Source: TransitEvent.description_de / .personal_context (FuFirE mapFufireEvent)
  const descriptionText = primaryEvent?.description_de || '';
  const personalContext  = primaryEvent?.personal_context || '';

  const hasEventText = descriptionText.length > 0;
  const fallback = isDe ? FALLBACK_DE : FALLBACK_EN;

  // Mode accent colour
  const accentColor = dayMode === 'pulse' ? '#D4AF37' : '#9B8EC4';

  return (
    <div
      className="cosmic-tile p-5 sm:p-6 space-y-4"
      data-testid="day-pulse-expanded"
      aria-label={modeLabel}
    >
      {/* ── Mode badge ─────────────────────────────────────────────── */}
      {/* Source: dayMode prop (useFirstRunDaily) */}
      <div className="flex items-center gap-2">
        <span
          className="text-[9px] font-bold tracking-[0.25em] uppercase px-2 py-0.5 rounded-full"
          style={{ background: `${accentColor}22`, color: accentColor }}
        >
          {modeLabel}
        </span>
      </div>

      {/* ── Mode description (1 sentence, no Horoskop/Schicksal) ──── */}
      {/* Source: static copy — MODE_DESCRIPTION keyed by dayMode */}
      <p
        className="text-xs leading-relaxed"
        style={{ color: 'var(--tile-text-secondary)', opacity: 0.7 }}
      >
        {modeDesc}
      </p>

      {/* ── Event text (verbatim) or fallback ───────────────────────── */}
      {hasEventText ? (
        <div className="space-y-2">
          {/* Source: TransitEvent.description_de (FuFirE /transit/state) */}
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'var(--tile-text-primary)' }}
          >
            {descriptionText}
          </p>

          {/* Source: TransitEvent.personal_context (FuFirE /transit/state) */}
          {personalContext.length > 0 && (
            <p
              className="text-xs leading-relaxed italic"
              style={{ color: 'var(--tile-text-secondary)', opacity: 0.75 }}
            >
              {personalContext}
            </p>
          )}
        </div>
      ) : (
        /* Fallback per REQ-F-dashboard-live-daily-signals AC — neutral, never hidden */
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'var(--tile-text-secondary)', opacity: 0.6 }}
          data-testid="day-pulse-fallback"
        >
          {fallback}
        </p>
      )}

      {/* ── Trigger planet indicator (if available) ─────────────────── */}
      {/* Source: TransitEvent.trigger_planet + .trigger_symbol (FuFirE) */}
      {primaryEvent?.trigger_planet && (
        <div
          className="flex items-center gap-1.5 text-[10px]"
          style={{ color: 'var(--tile-text-secondary)', opacity: 0.5 }}
        >
          {primaryEvent.trigger_symbol && (
            <span aria-hidden="true">{primaryEvent.trigger_symbol}</span>
          )}
          <span>{primaryEvent.trigger_planet}</span>
          {primaryEvent.sector_domain && (
            <span>· {primaryEvent.sector_domain}</span>
          )}
        </div>
      )}
    </div>
  );
}
