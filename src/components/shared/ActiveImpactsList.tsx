// ═══════════════════════════════════════════════════════════════════════════
// ACTIVE IMPACTS LIST — shared planet-influence visualisation
// Used by Signatur page (variant="full") and Dashboard (variant="compact").
// Extracted from src/components/signatur/TransitResonancePanels.tsx in Phase 4
// of docs/plans/2026-04-20-dashboard-signatur-gaps.md.
//
// Data source: computeTodayPlanetInfluences() — client-side Kepler computation.
// ═══════════════════════════════════════════════════════════════════════════

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import {
  computeTodayPlanetInfluences,
  type PlanetInfluence,
} from '@/src/lib/astro-data/planetInfluences';

// ── Planet → Signatur pole mapping ────────────────────────────────────────

interface PlanetConfig {
  symbol: string;
  /** German planet name for display */
  nameDe: string;
  /** DIMENSION_DEFS id */
  dimensionId: string;
  /** Pole label e.g. "Durchsetzung–Hingabe" */
  poleName: string;
}

const PLANET_CONFIG: Record<string, PlanetConfig> = {
  Mars: {
    symbol: '♂',
    nameDe: 'Mars',
    dimensionId: 'assertion',
    poleName: 'Durchsetzung – Hingabe',
  },
  Venus: {
    symbol: '♀',
    nameDe: 'Venus',
    dimensionId: 'empathy',
    poleName: 'Einfühlung – Abgrenzung',
  },
  Jupiter: {
    symbol: '♃',
    nameDe: 'Jupiter',
    dimensionId: 'intuition',
    poleName: 'Ahnung – Evidenz',
  },
  Saturn: {
    symbol: '♄',
    nameDe: 'Saturn',
    dimensionId: 'discipline',
    poleName: 'Ordnung – Freiheit',
  },
} as const;

// ── Aspect metadata ────────────────────────────────────────────────────────

interface AspectInfo {
  name: string;
  quality: string;
  colorClass: string;
}

const ASPECT_MAP: Record<number, { name: string; quality: string }> = {
  0:   { name: 'Konjunktion', quality: 'Verschmelzung' },
  30:  { name: 'Halbsextil',  quality: 'Kontakt' },
  60:  { name: 'Sextil',      quality: 'Harmonie' },
  90:  { name: 'Quadrat',     quality: 'Spannung' },
  120: { name: 'Trigon',      quality: 'Fluss' },
  150: { name: 'Quincunx',    quality: 'Anpassung' },
  180: { name: 'Opposition',  quality: 'Gegenüber' },
};

function getAspectInfo(aspectDeg: number, isResonant: boolean): AspectInfo {
  const found = ASPECT_MAP[aspectDeg] ?? { name: `${aspectDeg}°`, quality: 'Transit' };
  return {
    name: found.name,
    quality: found.quality,
    colorClass: isResonant
      ? 'border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37]'
      : 'border-[#4B7BEC]/40 bg-[#4B7BEC]/10 text-[#7EA8F0]',
  };
}

// ── Explanation text ──────────────────────────────────────────────────────

const ASPECT_FRAMING: Partial<Record<number, string>> = {
  0:   'steht in direkter Verbindung mit',
  60:  'bildet ein unterstützendes Sextil zu',
  90:  'bildet ein forderndes Quadrat zu',
  120: 'bildet ein harmonisches Trigon zu',
  150: 'braucht Anpassung zu',
  180: 'steht im Gegenüber zu',
};

const ZODIAC_DE: Record<string, string> = {
  Aries: 'Widder', Taurus: 'Stier', Gemini: 'Zwillinge', Cancer: 'Krebs',
  Leo: 'Löwe', Virgo: 'Jungfrau', Libra: 'Waage', Scorpio: 'Skorpion',
  Sagittarius: 'Schütze', Capricorn: 'Steinbock', Aquarius: 'Wassermann', Pisces: 'Fische',
};

function poleInsight(dimensionId: string, isResonant: boolean): string {
  const insights: Record<string, { resonant: string; tension: string }> = {
    assertion:  { resonant: 'kraftvolles, zielgerichtetes Handeln', tension: 'bewusstes Innehalten und Neuausrichtung' },
    empathy:    { resonant: 'tiefes Mitgefühl und emotionale Verbindung', tension: 'gesunde Grenzen und Selbstfürsorge' },
    intuition:  { resonant: 'Weitblick und expansives Denken', tension: 'das Wesentliche klar zu erfassen' },
    discipline: { resonant: 'nachhaltige Strukturen und Verlässlichkeit', tension: 'neue Freiräume durch bewusstes Loslassen' },
  };
  const dim = insights[dimensionId];
  if (!dim) return 'neue Möglichkeiten';
  return isResonant ? dim.resonant : dim.tension;
}

function buildExplanation(
  config: PlanetConfig,
  influence: PlanetInfluence,
  birthSign: string,
): string {
  const { isResonant, aspectDeg } = influence;
  const birthSignDe = ZODIAC_DE[birthSign] ?? birthSign;
  const direction = isResonant ? 'aktiviert' : 'schärft';
  const quality = isResonant ? 'öffnet Räume für' : 'lädt ein zur';
  const connection = ASPECT_FRAMING[aspectDeg] ?? 'steht in Beziehung zu';
  return `${config.nameDe} ${connection} deinem Geburtszeichen ${birthSignDe}. Dieser Transit ${direction} deinen ${config.poleName}-Pol und ${quality} ${poleInsight(config.dimensionId, isResonant)}.`;
}

// ── Panel data ────────────────────────────────────────────────────────────

interface TransitPanelData {
  planetKey: string;
  config: PlanetConfig;
  influence: PlanetInfluence;
  aspectInfo: AspectInfo;
  explanation: string;
}

function buildPanels(birthSign: string): TransitPanelData[] {
  const influences = computeTodayPlanetInfluences(birthSign);
  if (!influences) return [];

  return Object.entries(influences)
    .filter(([key]) => key in PLANET_CONFIG)
    .sort(([, a], [, b]) => b.fieldStrength - a.fieldStrength)
    .map(([key, influence]) => {
      const config = PLANET_CONFIG[key]!;
      const aspectInfo = getAspectInfo(influence.aspectDeg, influence.isResonant);
      const explanation = buildExplanation(config, influence, birthSign);
      return { planetKey: key, config, influence, aspectInfo, explanation };
    });
}

// ── Field strength bar ────────────────────────────────────────────────────

function FieldBar({ strength, isResonant, compact = false }: { strength: number; isResonant: boolean; compact?: boolean }) {
  const filledBars = Math.round(strength * 5);
  return (
    <div className="flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={`h-1 ${compact ? 'w-3' : 'w-4'} rounded-sm ${
            i < filledBars
              ? isResonant
                ? 'bg-[#D4AF37]/70'
                : 'bg-[#4B7BEC]/60'
              : 'bg-white/10'
          }`}
        />
      ))}
    </div>
  );
}

// ── Single panel (variant-aware) ──────────────────────────────────────────

function TransitPanel({ data, variant }: { data: TransitPanelData; variant: 'full' | 'compact' }) {
  const [open, setOpen] = useState(false);
  const { config, influence, aspectInfo, explanation } = data;
  const compact = variant === 'compact';

  const directionLabel = influence.isResonant ? 'Verstärkend' : 'Schärfend';
  const directionColor = influence.isResonant ? 'text-[#D4AF37]' : 'text-[#7EA8F0]';
  const strengthLabel = influence.fieldStrength >= 0.75
    ? 'Stark'
    : influence.fieldStrength >= 0.5
    ? 'Mittel'
    : 'Leicht';

  return (
    <article
      className={
        compact
          ? 'rounded-xl border border-white/10 bg-black/30 p-3 transition hover:border-white/20'
          : 'rounded-2xl border border-white/10 bg-black/35 p-4 transition hover:border-white/20'
      }
    >
      <div className={`${compact ? 'mb-2' : 'mb-3'} flex items-start justify-between gap-2`}>
        <div className="flex items-center gap-2">
          <span
            className={`flex ${compact ? 'h-6 w-6 text-sm' : 'h-8 w-8 text-base'} shrink-0 items-center justify-center rounded-full border border-white/15 bg-black/50 font-serif text-white/80`}
            aria-hidden
          >
            {config.symbol}
          </span>
          <div>
            <div className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-white/90`}>{config.nameDe}</div>
            <div className={`${compact ? 'text-[9px]' : 'text-[10px]'} uppercase tracking-[0.18em] text-white/45`}>{config.poleName}</div>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <span className={`rounded-full border px-2 py-0.5 ${compact ? 'text-[9px]' : 'text-[10px]'} font-medium uppercase tracking-[0.12em] ${aspectInfo.colorClass}`}>
            {aspectInfo.name}
          </span>
          <span className={`${compact ? 'text-[8px]' : 'text-[9px]'} uppercase tracking-[0.14em] text-white/35`}>
            {aspectInfo.quality}
          </span>
        </div>
      </div>

      <div className={`${compact ? 'mb-0' : 'mb-3'} flex items-center justify-between gap-2`}>
        <div className="flex items-center gap-2">
          <FieldBar strength={influence.fieldStrength} isResonant={influence.isResonant} compact={compact} />
          <span className={`${compact ? 'text-[9px]' : 'text-[10px]'} text-white/40`}>{strengthLabel}</span>
        </div>
        <span className={`${compact ? 'text-[9px]' : 'text-[10px]'} font-medium uppercase tracking-[0.15em] ${directionColor}`}>
          {directionLabel}
        </span>
      </div>

      {!compact && (
        <>
          <button
            className="flex w-full items-center justify-between gap-1 text-[10px] uppercase tracking-[0.2em] text-white/40 transition hover:text-white/70"
            onClick={() => setOpen(v => !v)}
            aria-expanded={open}
            aria-label={`Erklärung für ${config.nameDe}-Transit`}
          >
            <span>Warum?</span>
            {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <p className="mt-3 border-t border-white/8 pt-3 text-xs leading-relaxed text-white/60">
                  {explanation}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </article>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────

function ImpactsEmptyState({ hasBirthSign, compact }: { hasBirthSign: boolean; compact: boolean }) {
  return (
    <div
      className={`col-span-full rounded-2xl border border-white/8 bg-black/20 text-center ${compact ? 'px-4 py-5' : 'px-6 py-8'}`}
    >
      <p className={`mb-1 ${compact ? 'text-xs' : 'text-sm'} text-white/50`}>Keine Transit-Daten verfügbar</p>
      <p className={`${compact ? 'text-[10px]' : 'text-[11px]'} text-white/30`}>
        {hasBirthSign
          ? 'Planetenposition konnte nicht berechnet werden.'
          : 'Geburtszeichen wird benötigt, um aktive Planetentransits zu berechnen.'}
      </p>
    </div>
  );
}

// ── Public component ──────────────────────────────────────────────────────

export interface ActiveImpactsListProps {
  /** Western zodiac sign (e.g. "Aries"). Undefined → empty state. */
  birthSign: string | undefined;
  /** full (Signatur page) keeps the "Warum?" toggle; compact (Dashboard) drops it. */
  variant?: 'full' | 'compact';
  /** Optional extra classes on the wrapper grid. */
  className?: string;
  /** Max panels to render (compact default 4). */
  maxItems?: number;
  /** Hide the section header (defaults false for full, defaults true for compact). */
  hideHeader?: boolean;
}

export function ActiveImpactsList({
  birthSign,
  variant = 'full',
  className,
  maxItems,
  hideHeader,
}: ActiveImpactsListProps) {
  const panels = useMemo(
    () => (birthSign ? buildPanels(birthSign) : []),
    [birthSign],
  );

  const effectiveMax = maxItems ?? (variant === 'compact' ? 4 : panels.length);
  const shown = panels.slice(0, effectiveMax);
  const compact = variant === 'compact';
  const showHeader = hideHeader === undefined ? !compact : !hideHeader;

  const gridClass = compact
    ? 'grid gap-2 sm:grid-cols-2'
    : 'grid gap-3 md:grid-cols-2 lg:grid-cols-4';

  return (
    <section aria-label="Aktive Planetentransits" className={className}>
      {showHeader && (
        <div className="mb-3 flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.22em] text-white/40">
            Aktive Einflüsse
          </span>
          {shown.length > 0 && (
            <span className="rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/8 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-[#D4AF37]/70">
              Live
            </span>
          )}
        </div>
      )}

      <div className={gridClass}>
        {shown.length > 0
          ? shown.map(data => <TransitPanel key={data.planetKey} data={data} variant={variant} />)
          : <ImpactsEmptyState hasBirthSign={!!birthSign} compact={compact} />}
      </div>
    </section>
  );
}
