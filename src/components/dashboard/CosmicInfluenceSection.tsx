/**
 * CosmicInfluenceSection — Cosmic weather as a first-class influence card
 *
 * Shows geomagnetic activity (Kp index) and solar pressure as gauges,
 * plus active space-weather event pills derived from the NOAA/NASA DONKI pipeline.
 *
 * Implements: REQ-F-dashboard-live-daily-signals
 * - "cosmic weather is shown as a first-class influence using the existing pipeline"
 * - "falls back to a calm or unavailable state without fake event severity"
 */

import { useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Tooltip } from '../Tooltip';
import type { SpaceWeatherState } from '../../hooks/useSpaceWeather';

interface CosmicInfluenceSectionProps {
  spaceWeather: SpaceWeatherState;
}

// ── G-scale severity colors ──────────────────────────────────────────────────

function gScaleStyle(gScale: string): { bar: string; badge: string } {
  const n = parseInt(gScale.replace('G', ''), 10) || 0;
  if (n === 0) return {
    bar: 'bg-gradient-to-r from-emerald-700 to-emerald-400',
    badge: 'bg-emerald-500/15 text-emerald-400',
  };
  if (n <= 2) return {
    bar: 'bg-gradient-to-r from-amber-600 to-amber-400',
    badge: 'bg-amber-500/15 text-amber-400',
  };
  return {
    bar: 'bg-gradient-to-r from-red-600 to-orange-400',
    badge: 'bg-red-500/15 text-red-400',
  };
}

// ── X-ray class badge style ──────────────────────────────────────────────────

function xrayStyle(xrayClass: string): string {
  const cls = xrayClass[0]?.toUpperCase() ?? 'A';
  if (cls === 'X') return 'bg-red-500/15 text-red-400';
  if (cls === 'M') return 'bg-orange-500/15 text-orange-400';
  if (cls === 'C') return 'bg-amber-500/15 text-amber-400';
  return 'bg-zinc-700/50 text-zinc-300';
}

// ── Event pills ──────────────────────────────────────────────────────────────

interface EventPillProps {
  type: string;
  severity: string;
}

function eventLabel(type: string, t: (key: string) => string): string {
  const map: Record<string, string> = {
    cme_arrival:       t('dashboard.cosmicInfluence.eventCme'),
    flare:             t('dashboard.cosmicInfluence.eventFlare'),
    geomagnetic_storm: t('dashboard.cosmicInfluence.eventStorm'),
    sep:               t('dashboard.cosmicInfluence.eventSep'),
    hss:               t('dashboard.cosmicInfluence.eventHss'),
    alert:             t('dashboard.cosmicInfluence.eventAlert'),
  };
  return map[type] ?? type.toUpperCase();
}

function EventPill({ type, severity }: EventPillProps) {
  const { t } = useLanguage();
  const isHighSeverity = ['extreme', 'severe', 'strong', 'X', 'M'].some(s =>
    severity.toLowerCase().includes(s.toLowerCase())
  );
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider border ${
        isHighSeverity
          ? 'bg-red-500/10 text-red-400 border-red-500/20'
          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      }`}
    >
      {eventLabel(type, t)}
    </span>
  );
}

// ── Gauge bar ────────────────────────────────────────────────────────────────

interface GaugeBarProps {
  label: string;
  percent: number;
  barClass: string;
  tooltip: string;
  badge?: { text: string; className: string };
}

function GaugeBar({ label, percent, barClass, tooltip, badge }: GaugeBarProps) {
  const safePercent = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <Tooltip content={tooltip} wide dark>
      <div className="space-y-3 group cursor-help" tabIndex={0}>
        <div className="flex justify-between items-end">
          <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.2em] group-hover:text-zinc-100 transition-colors">
            {label}
          </span>
          <div className="flex items-center gap-1.5">
            {badge && (
              <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${badge.className}`}>
                {badge.text}
              </span>
            )}
            <span className="text-[10px] font-mono text-zinc-300">{safePercent}%</span>
          </div>
        </div>
        <div className="h-[6px] w-full bg-zinc-900/50 rounded-full overflow-hidden border border-white/5 relative">
          <div
            className="absolute inset-y-0 left-0 bg-white/10 blur-[4px]"
            style={{ width: `${safePercent}%` }}
          />
          <div
            className={`h-full ${barClass} transition-all duration-1000 ease-out relative z-10`}
            style={{ width: `${safePercent}%` }}
          />
        </div>
      </div>
    </Tooltip>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function CosmicInfluenceSection({ spaceWeather }: CosmicInfluenceSectionProps) {
  const { t } = useLanguage();

  const isLive = !spaceWeather.loading && !spaceWeather.error;

  // Kp normalised to [0,1] — Kp=9 is the maximum meaningful value
  const kpPercent = Math.round((spaceWeather.kpIndex / 9) * 100);
  const solarPressurePercent = Math.round(spaceWeather.solarPressure * 100);

  const gStyle = gScaleStyle(spaceWeather.gScale);
  const xClass = xrayStyle(spaceWeather.xrayClass);

  // Active events: filter expired ones using expires_at.
  // new Date() is called inline so expiry is evaluated against the time of
  // each re-render (driven by the 5-min useSpaceWeather poll), not mount time.
  const activeEvents = useMemo(
    () => {
      const now = new Date();
      return spaceWeather.events.filter((e) => new Date(e.expires_at) > now);
    },
    [spaceWeather.events],
  );

  return (
    <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-[2rem] space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-[10px] font-bold tracking-[0.2em] text-zinc-300 uppercase">
          {t('dashboard.cosmicInfluence.sectionTitle')}
        </h2>
        <div className={`text-[8px] font-mono ${isLive ? 'text-emerald-500' : 'text-zinc-600'}`}>
          {isLive ? t('dashboard.cosmicInfluence.liveLabel') : t('dashboard.cosmicInfluence.noDataLabel')}
        </div>
      </div>

      {/* Gauges */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12 transition-opacity duration-300 ${isLive ? '' : 'opacity-40'}`}>
        <GaugeBar
          label={t('dashboard.cosmicInfluence.kpLabel')}
          percent={kpPercent}
          barClass={gStyle.bar}
          tooltip={t('dashboard.cosmicInfluence.kpTooltip')}
          badge={{ text: spaceWeather.gScale, className: gStyle.badge }}
        />
        <GaugeBar
          label={t('dashboard.cosmicInfluence.solarPressureLabel')}
          percent={solarPressurePercent}
          barClass="bg-gradient-to-r from-amber-500 to-orange-400"
          tooltip={t('dashboard.cosmicInfluence.solarPressureTooltip')}
          badge={{ text: spaceWeather.xrayClass, className: xClass }}
        />
      </div>

      {/* Event pills / calm state */}
      {isLive && (
        <div className="pt-2">
          {activeEvents.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {activeEvents.map((event) => (
                <EventPill key={event.event_id} type={event.type} severity={event.severity} />
              ))}
            </div>
          ) : (
            <p className="text-[9px] text-zinc-600 uppercase tracking-[0.2em]">
              {t('dashboard.cosmicInfluence.noEventsLabel')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
