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
import { useLanguage } from '../../contexts/LanguageContext';
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
      return { icon: <Flame className="w-5 h-5" />, label: 'Feuer', color: 'var(--color-element-fire)', accent: 'rgba(244,67,54,0.12)' };
    case 'wasser':
      return { icon: <Droplets className="w-5 h-5" />, label: 'Wasser', color: 'var(--color-element-water)', accent: 'rgba(33,150,243,0.12)' };
    case 'holz':
      return { icon: <Leaf className="w-5 h-5" />, label: 'Holz', color: 'var(--color-element-wood)', accent: 'rgba(76,175,80,0.12)' };
    case 'metall':
      return { icon: <Sparkles className="w-5 h-5" />, label: 'Metall', color: 'var(--color-element-metal)', accent: 'rgba(158,158,158,0.10)' };
    case 'erde':
      return { icon: <Mountain className="w-5 h-5" />, label: 'Erde', color: 'var(--color-element-earth)', accent: 'rgba(255,152,0,0.12)' };
    default:
      return { icon: <CircleDot className="w-5 h-5" />, label: '', color: '#D4AF37', accent: 'rgba(212,175,55,0.10)' };
  }
}

export function resolveElement(daily: DailyResponse | null): WuXingElement | null {
  if (!daily) return null;
  const dm = daily.eastern?.evidence?.day_master ?? '';
  const key = dm.toLowerCase().trim();
  return DAY_MASTER_TO_ELEMENT[dm] ?? DAY_MASTER_TO_ELEMENT[key] ?? null;
}

// ── Resonance computation ────────────────────────────────────────────────────

/** Resonance weights — defined in docs/wireframes/dashboard-v2.md § F3 */
const RESONANCE_WEIGHT_HARMONY = 0.65;
const RESONANCE_WEIGHT_SOLAR   = 0.35;

export function computeResonance(harmonyIndex: number, solarPressure: number): number {
  return Math.max(0, Math.min(1,
    harmonyIndex * RESONANCE_WEIGHT_HARMONY +
    solarPressure * RESONANCE_WEIGHT_SOLAR,
  ));
}

export function resonanceLabel(r: number): string {
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

/**
 * Returns a valid CSS border color.
 * Appends hex alpha `22` to 7-char hex colors.
 * Falls back to subtle white for rgba/hsl to avoid invalid CSS like `rgba(...)22`.
 */
export function toBorderColor(color: string): string {
  return color.startsWith('#') && color.length === 7
    ? `${color}22`
    : 'rgba(255,255,255,0.08)';
}

function buildWeatherPills(sw: SpaceWeatherState, daily: DailyResponse | null): WeatherPill[] {
  const pills: WeatherPill[] = [];

  // 1. Geomagnetischer Sturm (Kp-basiert) — nur wenn kein server-seitiges Event vorhanden.
  // Wenn ein geomagnetic_storm-Event existiert, wird er in Abschnitt 3 gerendert (höhere Priorität).
  const hasGeoStormEvent = sw.events.some((e) => e.type === 'geomagnetic_storm');
  if (sw.kpIndex >= 2 && !hasGeoStormEvent) {
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
  const flareClass = sw.xrayClass;
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
    <div className="tages-impuls-card p-5 sm:p-6 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-2 w-24 rounded" style={{ background: 'var(--tile-border)' }} />
        <div className="h-5 w-24 rounded-full" style={{ background: 'var(--tile-border)' }} />
      </div>
      <div className="space-y-2 pt-1">
        <div className="h-4 w-3/4 rounded" style={{ background: 'var(--tile-border)' }} />
        <div className="h-3 w-full rounded" style={{ background: 'var(--tile-border)', opacity: 0.6 }} />
        <div className="h-3 w-5/6 rounded" style={{ background: 'var(--tile-border)', opacity: 0.6 }} />
        <div className="h-3 w-4/6 rounded" style={{ background: 'var(--tile-border)', opacity: 0.6 }} />
      </div>
      <div className="flex gap-2 pt-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-6 w-24 rounded-full" style={{ background: 'var(--tile-border)', opacity: 0.6 }} />
        ))}
      </div>
      <div className="h-2 w-full rounded-full mt-2" style={{ background: 'var(--tile-border)' }} />
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
  const { t } = useLanguage();
  // Must be called before any conditional return (Rules of Hooks).
  // `buildWeatherPills` is null-safe for `daily`.
  const weatherPills = useMemo(
    () => buildWeatherPills(spaceWeather, daily),
    [spaceWeather, daily],
  );

  if (loading && !daily) return <TagesEnergieSkeleton />;
  if (!daily) return null;

  const isTrace = (dayHarmonic?.mode ?? daily.fusion.day_mode) === 'trace';
  const harmonyIndex = dayHarmonic?.harmonyIndex ?? daily.fusion.harmony_index;
  const solarPressure = spaceWeather.solarPressure;

  const element = resolveElement(daily);
  const elemConfig = getElementConfig(element);

  const resonance = computeResonance(harmonyIndex, solarPressure);
  const resonancePct = Math.round(resonance * 100);

  // Body: synthesis ist der Haupt-Narrativ.
  // Fallback wenn KI-Generierung leer zurückgibt (z.string() erlaubt "").
  const bodyText =
    daily.fusion.synthesis ||
    daily.fusion.summary ||
    t('dashboard.tagesImpuls.fallbackBody');

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
      aria-live="polite"
      aria-label={t('dashboard.tagesImpuls.ariaContainer')}
    >
      <div className="tages-impuls-card">
        {/* ── Header ─────────────────────────────────────────── */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between gap-3">
          <span className="text-[9px] font-sans uppercase tracking-[0.3em] font-bold" style={{ color: 'var(--tile-text-secondary)' }}>
            {t('dashboard.tagesImpuls.sectionLabel')}
          </span>
          <span
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-sans uppercase tracking-wider font-bold"
            style={{
              background: isTrace ? 'var(--tile-glow)' : 'rgba(160,180,204,0.12)',
              color: isTrace ? 'var(--tile-accent)' : 'var(--tile-text-secondary)',
              border: `1px solid ${isTrace ? 'var(--tile-border)' : 'rgba(160,180,204,0.20)'}`,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: isTrace ? 'var(--tile-accent)' : 'var(--tile-text-secondary)' }}
            />
            {isTrace ? t('dashboard.tagesImpuls.badgeTrace') : t('dashboard.tagesImpuls.badgePulse')}
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
              <p className="text-[10px] font-sans uppercase tracking-widest mb-1" style={{ color: 'var(--tile-accent)', opacity: 0.65 }}>
                {daily.western!.themes!.slice(0, 2).join(' · ')}
              </p>
            )}
          </div>
        </div>

        {/* ── Body — ALWAYS FULLY VISIBLE ─────────────────────── */}
        <div className="px-5 pb-4 space-y-3">
          <p className="text-sm sm:text-[15px] leading-relaxed font-serif" style={{ color: 'var(--tile-text-primary)' }}>
            {bodyText}
          </p>

          {/* Day-Trace: Reibungs-Kontext */}
          {frictionText && (
            <p className="text-xs leading-relaxed italic pl-3" style={{ color: 'var(--tile-accent)', opacity: 0.7, borderLeft: '2px solid var(--tile-border)' }}>
              {frictionText}
            </p>
          )}

          {/* Einladung / Action — via PremiumGate (kapselt isPremium intern) */}
          <PremiumGate teaser="Deine persönliche Einladung für heute">
            <div
              className="flex items-start gap-2 rounded-xl p-3 mt-1"
              style={{ background: 'var(--tile-glow)', border: '1px solid var(--tile-border)' }}
            >
              <span className="text-sm mt-0.5 shrink-0" style={{ color: 'var(--tile-accent)' }}>✦</span>
              <p className="text-xs leading-relaxed italic" style={{ color: 'var(--tile-text-secondary)' }}>
                {daily.fusion.action}
              </p>
            </div>
          </PremiumGate>
        </div>

        {/* ── Kosmoswetter Strip ──────────────────────────────── */}
        {weatherPills.length > 0 && (
          <div className="mx-5 mb-4 pt-3 tages-impuls-divider">
            <p className="text-[8px] font-sans uppercase tracking-[0.3em] mb-2" style={{ color: 'var(--tile-text-secondary)', opacity: 0.6 }}>
              {t('dashboard.tagesImpuls.kosmoswetter')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {weatherPills.map((pill) => (
                <span
                  key={pill.key}
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-sans"
                  style={{ background: pill.bg, color: pill.color, border: `1px solid ${toBorderColor(pill.color)}` }}
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
            <p className="text-[9px] font-sans" style={{ color: 'var(--tile-text-secondary)', opacity: 0.6 }}>{t('dashboard.tagesImpuls.resonanz')}</p>
            <p className="text-[9px] font-sans" style={{ color: 'var(--tile-text-secondary)', opacity: 0.6 }}>{resonancePct}%</p>
          </div>
          {/* Bar */}
          <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'var(--tile-border)' }}>
            <motion.div
              role="progressbar"
              aria-valuenow={resonancePct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${t('dashboard.tagesImpuls.ariaResonanzBar')}: ${resonancePct}%`}
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${resonancePct}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
              style={{
                background: `linear-gradient(90deg, var(--tile-accent) 0%, ${resonance > 0.5 ? '#22d3ee' : 'var(--tile-accent)'} 100%)`,
                minWidth: resonancePct > 0 ? undefined : '3px',
              }}
            />
          </div>
          <p className="text-[9px] mt-1.5 font-sans" style={{ color: 'var(--tile-text-secondary)', opacity: 0.5 }}>
            {resonanceLabel(resonance)}
          </p>
        </div>

        {/* ── Vertiefen Link (öffnet DayModeModal on-demand) ──── */}
        {onOpenDayModal && (
          <button
            onClick={onOpenDayModal}
            className="w-full flex items-center justify-end gap-1 px-5 py-3 text-[9px] font-sans uppercase tracking-wider transition-opacity tages-impuls-divider opacity-50 hover:opacity-80"
            style={{ color: 'var(--tile-text-secondary)' }}
          >
            {t('dashboard.tagesImpuls.vertiefen')}
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
