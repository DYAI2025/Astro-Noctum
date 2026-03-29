/**
 * DashboardTagesEnergie — Hero Tages-Impuls Sektion
 *
 * Die erste Frage des Tages: "Wie ist meine Energie heute? Was erwartet mich?"
 * Immer vollständig sichtbar. Kein Akkordeon, kein Expand, kein Fold.
 *
 * Struktur:
 *  1. Label + Day-Pulse/Trace Badge
 *  2. Element-Icon + Headline
 *  3. Body-Narrativ (fusion.synthesis, 2–3 Sätze, always visible)
 *  4. Day-Trace Reibungs-Kontext (kursiv, nur wenn isTrace)
 *  5. Einladung / fusion.action (hinter PremiumGate)
 *  6. Kosmoswetter-Strip (Icon-Pillen: Sturm, Flare, CME, HSS, SEP, Transit)
 *  7. Resonanz-Indikator (Balken + Beschriftung)
 *
 * Implements: REQ-F-signatur-day-night-pulse § Dashboard Tages-Impuls
 * Wireframe:  docs/wireframes/dashboard-v2.md § F3
 */

import { useMemo, type ReactNode } from 'react';
import { motion } from 'motion/react';
import {
  Zap,
  Flame,
  Waves,
  Wind,
  Activity,
  CircleDot,
  Leaf,
  Droplets,
  Sparkles,
  Mountain,
  ArrowRight,
} from 'lucide-react';
import type { DailyResponse } from '@/src/lib/schemas/experience';
import type { DayHarmonicState } from '@/src/lib/fusion-ring/day-harmonic';
import type { SpaceWeatherState } from '@/src/hooks/useSpaceWeather';
import type { SpaceWeatherExtended } from '@/src/lib/schemas/space-weather';
import { PremiumGate } from '../PremiumGate';

// ── Types ────────────────────────────────────────────────────────────────────

export interface DashboardTagesEnergieProps {
  daily: DailyResponse | null;
  dayHarmonic: DayHarmonicState | null;
  spaceWeather: SpaceWeatherState;
  loading?: boolean;
  onOpenDayModal?: () => void;
}

type WeatherEvent = SpaceWeatherExtended['events'][number];

// ── Element mapping (BaZi day-master stem → Wu-Xing Element) ─────────────────

const DAY_MASTER_TO_ELEMENT: Record<string, 'holz' | 'feuer' | 'erde' | 'metall' | 'wasser'> = {
  '甲': 'holz', '乙': 'holz',
  '丙': 'feuer', '丁': 'feuer',
  '戊': 'erde', '己': 'erde',
  '庚': 'metall', '辛': 'metall',
  '壬': 'wasser', '癸': 'wasser',
  // Latin romanization fallback
  'jia': 'holz', 'yi': 'holz',
  'bing': 'feuer', 'ding': 'feuer',
  'wu': 'erde', 'ji': 'erde',
  'geng': 'metall', 'xin': 'metall',
  'ren': 'wasser', 'gui': 'wasser',
};

type WuXingElement = 'holz' | 'feuer' | 'erde' | 'metall' | 'wasser';

interface ElementConfig {
  icon: ReactNode;
  label: string;
  color: string;
  accent: string;
}

function getElementConfig(el: WuXingElement | null): ElementConfig {
  switch (el) {
    case 'feuer':
      return { icon: <Flame className="w-5 h-5" />, label: 'Feuer', color: '#ef4444', accent: 'rgba(239,68,68,0.12)' };
    case 'wasser':
      return { icon: <Droplets className="w-5 h-5" />, label: 'Wasser', color: '#60a5fa', accent: 'rgba(96,165,250,0.12)' };
    case 'holz':
      return { icon: <Leaf className="w-5 h-5" />, label: 'Holz', color: '#4ade80', accent: 'rgba(74,222,128,0.12)' };
    case 'metall':
      return { icon: <Sparkles className="w-5 h-5" />, label: 'Metall', color: '#e2e8f0', accent: 'rgba(226,232,240,0.10)' };
    case 'erde':
      return { icon: <Mountain className="w-5 h-5" />, label: 'Erde', color: '#fbbf24', accent: 'rgba(251,191,36,0.12)' };
    default:
      return { icon: <CircleDot className="w-5 h-5" />, label: '', color: '#D4AF37', accent: 'rgba(212,175,55,0.10)' };
  }
}

function resolveElement(daily: DailyResponse | null): WuXingElement | null {
  if (!daily) return null;
  const dm = daily.eastern?.evidence?.day_master ?? '';
  const key = dm.toLowerCase().trim();
  return DAY_MASTER_TO_ELEMENT[dm] ?? DAY_MASTER_TO_ELEMENT[key] ?? null;
}

// ── Resonance computation ────────────────────────────────────────────────────

function computeResonance(harmonyIndex: number, solarPressure: number): number {
  return Math.max(0, Math.min(1, harmonyIndex * 0.65 + solarPressure * 0.35));
}

function resonanceLabel(r: number): string {
  if (r > 0.7) return 'deine Signatur verstärkt den solaren Impuls';
  if (r > 0.5) return 'deine Signatur schwingt mit dem Kosmos';
  if (r > 0.3) return 'leichte kosmische Berührung spürbar';
  return 'deine Energie fließt heute unabhängig';
}

// ── Kosmoswetter icons ────────────────────────────────────────────────────────

interface WeatherPill {
  key: string;
  icon: ReactNode;
  label: string;
  color: string;
  bg: string;
}

function buildWeatherPills(sw: SpaceWeatherState, daily: DailyResponse | null): WeatherPill[] {
  const pills: WeatherPill[] = [];

  // 1. Geomagnetischer Sturm (Kp-basiert, immer wenn kp ≥ 2)
  if (sw.kpIndex >= 2) {
    const isStrong = sw.kpIndex >= 6;
    const isMedium = sw.kpIndex >= 4;
    pills.push({
      key: 'kp',
      icon: <Zap className="w-3 h-3" />,
      label: `${sw.gScale} Magnetsturm`,
      color: isStrong ? '#D4AF37' : isMedium ? '#fbbf24' : 'rgba(255,255,255,0.5)',
      bg: isStrong ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.06)',
    });
  }

  // 2. Solarer Flare (nur M / X Klasse)
  const flareClass = sw.xrayClass ?? 'A';
  if (flareClass === 'X' || flareClass === 'M') {
    pills.push({
      key: 'flare',
      icon: <Flame className="w-3 h-3" />,
      label: `${flareClass}-Flare`,
      color: flareClass === 'X' ? '#ef4444' : '#f97316',
      bg: flareClass === 'X' ? 'rgba(239,68,68,0.15)' : 'rgba(249,115,22,0.12)',
    });
  }

  // 3. Events aus dem Space Weather Pipeline
  const seenTypes = new Set<WeatherEvent['type']>();
  const priorityOrder: WeatherEvent['type'][] = ['cme_arrival', 'geomagnetic_storm', 'hss', 'sep'];

  for (const type of priorityOrder) {
    if (seenTypes.has(type)) continue;
    const event = sw.events.find((e) => e.type === type);
    if (!event) continue;
    seenTypes.add(type);

    if (type === 'cme_arrival') {
      pills.push({
        key: 'cme',
        icon: <Waves className="w-3 h-3" />,
        label: 'CME-Ankunft',
        color: '#22d3ee',
        bg: 'rgba(34,211,238,0.12)',
      });
    } else if (type === 'hss') {
      pills.push({
        key: 'hss',
        icon: <Wind className="w-3 h-3" />,
        label: 'Hochgeschw.-Strom',
        color: '#93c5fd',
        bg: 'rgba(147,197,253,0.12)',
      });
    } else if (type === 'geomagnetic_storm') {
      // G-scale string compare works correctly for single digits (G0–G5)
      const isStrong = event.severity >= 'G3';
      const isMedium = event.severity === 'G2';
      pills.push({
        key: 'geo-storm',
        icon: <Zap className="w-3 h-3" />,
        label: `Magnetsturm ${event.severity}`,
        color: isStrong ? '#D4AF37' : isMedium ? '#fbbf24' : 'rgba(255,255,255,0.5)',
        bg: isStrong ? 'rgba(212,175,55,0.15)' : 'rgba(255,255,255,0.06)',
      });
    } else if (type === 'sep') {
      pills.push({
        key: 'sep',
        icon: <Activity className="w-3 h-3" />,
        label: 'Protonenfluss',
        color: '#fb923c',
        bg: 'rgba(251,146,60,0.12)',
      });
    }

    if (pills.length >= 4) break;
  }

  // 4. Planetentransit (aus Daily-Evidence)
  const transitFocus =
    daily?.western?.evidence?.natal_focus?.[0] ??
    daily?.eastern?.evidence?.natal_focus?.[0];
  if (transitFocus && pills.length < 5) {
    pills.push({
      key: 'transit',
      icon: <CircleDot className="w-3 h-3" />,
      label: transitFocus,
      color: 'rgba(212,175,55,0.7)',
      bg: 'rgba(212,175,55,0.08)',
    });
  }

  return pills;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function TagesEnergieSkeleton() {
  return (
    <div className="w-full rounded-2xl border border-white/8 bg-[#00050A]/60 p-5 sm:p-6 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-2 w-24 bg-white/10 rounded" />
        <div className="h-5 w-24 bg-white/8 rounded-full" />
      </div>
      <div className="space-y-2 pt-1">
        <div className="h-4 w-3/4 bg-white/10 rounded" />
        <div className="h-3 w-full bg-white/6 rounded" />
        <div className="h-3 w-5/6 bg-white/6 rounded" />
        <div className="h-3 w-4/6 bg-white/6 rounded" />
      </div>
      <div className="flex gap-2 pt-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-6 w-24 bg-white/6 rounded-full" />
        ))}
      </div>
      <div className="h-2 w-full bg-white/8 rounded-full mt-2" />
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DashboardTagesEnergie({
  daily,
  dayHarmonic,
  spaceWeather,
  loading = false,
  onOpenDayModal,
}: DashboardTagesEnergieProps) {

  if (loading && !daily) return <TagesEnergieSkeleton />;
  if (!daily) return null;

  const isTrace = (dayHarmonic?.mode ?? daily.fusion.day_mode) === 'trace';
  const harmonyIndex = dayHarmonic?.harmonyIndex ?? daily.fusion.harmony_index;
  const solarPressure = spaceWeather.solarPressure;

  const element = resolveElement(daily);
  const elemConfig = getElementConfig(element);

  const resonance = computeResonance(harmonyIndex, solarPressure);
  const resonancePct = Math.round(resonance * 100);
  // Memoize: spaceWeather reference changes on every 5-min poll (new state object).
  // daily changes at most once per day. Aligns with InfluenceGauges.tsx pattern.
  const weatherPills = useMemo(
    () => buildWeatherPills(spaceWeather, daily),
    [spaceWeather, daily],
  );

  // Body: synthesis ist der Haupt-Narrativ.
  // Fallback wenn KI-Generierung leer zurückgibt (z.string() erlaubt "").
  const bodyText =
    daily.fusion.synthesis ||
    daily.fusion.summary ||
    'Tagesimpuls wird gerade berechnet …';

  // Reibungs-Kontext (nur Day-Trace)
  const frictionText = isTrace
    ? daily.eastern?.caution || daily.western?.caution || null
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      className="w-full"
    >
      <div
        className="rounded-2xl border border-white/10 overflow-hidden"
        style={{ background: 'linear-gradient(160deg, rgba(0,5,10,0.92) 0%, rgba(10,8,0,0.88) 100%)' }}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between gap-3">
          <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/35 font-bold">
            Tages-Impuls
          </span>
          <span
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-mono uppercase tracking-wider font-bold"
            style={{
              background: isTrace ? 'rgba(212,175,55,0.15)' : 'rgba(160,180,204,0.12)',
              color: isTrace ? '#D4AF37' : '#a0b4cc',
              border: `1px solid ${isTrace ? 'rgba(212,175,55,0.25)' : 'rgba(160,180,204,0.20)'}`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: isTrace ? '#D4AF37' : '#a0b4cc' }}
            />
            {isTrace ? 'Day-Trace' : 'Day-Pulse'}
          </span>
        </div>

        {/* ── Element + Headline ───────────────────────────────── */}
        <div className="px-5 pb-3 flex items-start gap-3">
          {element && (
            <div
              className="shrink-0 mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: elemConfig.accent, color: elemConfig.color }}
            >
              {elemConfig.icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            {/* Gold accent line */}
            <div className="w-8 h-[2px] bg-gradient-to-r from-[#D4AF37]/50 to-transparent mb-2" />
            {/* Themes as kicker — only when themes are available */}
            {(daily.western?.themes?.length ?? 0) > 0 && (
              <p className="text-[10px] font-mono uppercase tracking-widest text-[#D4AF37]/50 mb-1">
                {daily.western!.themes!.slice(0, 2).join(' · ')}
              </p>
            )}
          </div>
        </div>

        {/* ── Body — ALWAYS FULLY VISIBLE ─────────────────────── */}
        <div className="px-5 pb-4 space-y-3">
          <p className="text-sm sm:text-[15px] text-white/80 leading-relaxed font-serif">
            {bodyText}
          </p>

          {/* Day-Trace: Reibungs-Kontext */}
          {frictionText && (
            <p className="text-xs text-[#D4AF37]/60 leading-relaxed italic border-l-2 border-[#D4AF37]/20 pl-3">
              {frictionText}
            </p>
          )}

          {/* Einladung / Action — via PremiumGate (kapselt isPremium intern) */}
          <PremiumGate teaser="Deine persönliche Einladung für heute">
            <div
              className="flex items-start gap-2 rounded-xl p-3 mt-1"
              style={{ background: 'rgba(212,175,55,0.07)', border: '1px solid rgba(212,175,55,0.12)' }}
            >
              <span className="text-[#D4AF37] text-sm mt-0.5 shrink-0">✦</span>
              <p className="text-xs text-white/65 leading-relaxed italic">
                {daily.fusion.action}
              </p>
            </div>
          </PremiumGate>
        </div>

        {/* ── Kosmoswetter Strip ──────────────────────────────── */}
        {weatherPills.length > 0 && (
          <div className="mx-5 mb-4 pt-3 border-t border-white/6">
            <p className="text-[8px] font-mono uppercase tracking-[0.3em] text-white/25 mb-2">
              Kosmoswetter
            </p>
            <div className="flex flex-wrap gap-1.5">
              {weatherPills.map((pill) => (
                <span
                  key={pill.key}
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-mono"
                  style={{ background: pill.bg, color: pill.color, border: `1px solid ${pill.color}22` }}
                >
                  {pill.icon}
                  {pill.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Resonanz-Indikator ───────────────────────────────── */}
        <div className="mx-5 mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[9px] text-white/30 font-mono">Resonanz</p>
            <p className="text-[9px] text-white/30 font-mono">{resonancePct}%</p>
          </div>
          {/* Bar */}
          <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div
              role="progressbar"
              aria-valuenow={resonancePct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Resonanz mit dem Kosmos: ${resonancePct}%`}
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${resonancePct}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
              style={{
                background: `linear-gradient(90deg, #D4AF37 0%, ${resonance > 0.5 ? '#22d3ee' : '#8B6914'} 100%)`,
                minWidth: resonancePct > 0 ? undefined : '3px',
              }}
            />
          </div>
          <p className="text-[9px] text-white/25 mt-1.5 font-mono">
            {resonanceLabel(resonance)}
          </p>
        </div>

        {/* ── Vertiefen Link (öffnet DayModeModal on-demand) ──── */}
        {onOpenDayModal && (
          <button
            onClick={onOpenDayModal}
            className="w-full flex items-center justify-end gap-1 px-5 py-3 text-[9px] font-mono uppercase tracking-wider text-white/35 hover:text-white/60 transition-colors border-t border-white/5"
          >
            vertiefen
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
