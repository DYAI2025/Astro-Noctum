import { useMemo } from 'react';
import { Tooltip } from "../Tooltip";
import { useLanguage } from '../../contexts/LanguageContext';
import { computeTodayPlanetInfluences } from '../../lib/astro-data/planetInfluences';

// ── Gauge bar ─────────────────────────────────────────────────────────────

interface GaugeProps {
  label: string;
  value: number;         // 0-1
  isResonant: boolean;
  tooltip?: string;
}

/** Returns a CSS gradient string that shifts blue (resonant) → red (tension) */
function gaugeColor(isResonant: boolean): string {
  return isResonant
    ? 'bg-gradient-to-r from-[#2563EB] to-[#60A5FA]'
    : 'bg-gradient-to-r from-[#B91C1C] to-[#F87171]';
}

function Gauge({ label, value, isResonant, tooltip }: GaugeProps) {
  const safeValue = isNaN(value) || value === undefined ? 0 : Math.max(0, Math.min(1, value));
  const bars = Math.round(safeValue * 5); // 0-5 filled blocks
  const modeLabel = isResonant ? '◆' : '▲';

  const inner = (
    <div
      className={`space-y-3 group${tooltip ? ' cursor-help' : ''}`}
      tabIndex={tooltip ? 0 : undefined}
    >
      <div className="flex justify-between items-end">
        <span
          className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] transition-colors"
          style={{ color: 'var(--tile-text-secondary)' }}
        >
          {label}
        </span>
        {/* Field-strength indicator: filled blocks instead of raw "%" */}
        <span
          className="text-[9px] font-mono tracking-wider"
          style={{ color: isResonant ? '#60A5FA' : '#F87171', opacity: 0.9 }}
          aria-label={`Feldstärke ${bars} von 5, ${isResonant ? 'resonant' : 'Spannung'}`}
        >
          {modeLabel} {'■'.repeat(bars)}{'□'.repeat(5 - bars)}
        </span>
      </div>
      <div className="influence-track">
        <div
          className={`h-full ${gaugeColor(isResonant)} transition-all duration-1000 ease-out relative z-10`}
          style={{ width: `${Math.round(safeValue * 100)}%` }}
        />
      </div>
    </div>
  );

  if (tooltip) {
    return <Tooltip content={tooltip} wide dark>{inner}</Tooltip>;
  }
  return inner;
}

// ── Influence data assembly ───────────────────────────────────────────────

export interface InfluenceData {
  label: string;
  value: number;
  isResonant: boolean;
  tooltip?: string;
}

function useInfluences(birthSign?: string, natalWeights?: Record<string, number>, simTime?: number): {
  items: InfluenceData[];
  isLive: boolean;
} {
  const { t } = useLanguage();

  return useMemo(() => {
    // Attempt live planetary computation when birth sign is known
    const live = birthSign ? computeTodayPlanetInfluences(birthSign, simTime) : null;

    const isLive = live !== null;

    // Fallback values from natalWeights (static but better than zero)
    const fallback = (key: string, defaultVal = 0) =>
      natalWeights?.[key] ?? defaultVal;

    const items: InfluenceData[] = [
      {
        label: t('dashboard.influences.marsLabel'),
        value: live?.Mars?.fieldStrength ?? fallback('Mars', 0.5),
        isResonant: live?.Mars?.isResonant ?? true,
        tooltip: t('dashboard.influences.marsTooltip'),
      },
      {
        label: t('dashboard.influences.jupiterLabel'),
        value: live?.Jupiter?.fieldStrength ?? fallback('Jupiter', 0.5),
        isResonant: live?.Jupiter?.isResonant ?? true,
        tooltip: t('dashboard.influences.jupiterTooltip'),
      },
      {
        label: t('dashboard.influences.venusLabel'),
        value: live?.Venus?.fieldStrength ?? fallback('Venus', 0.5),
        isResonant: live?.Venus?.isResonant ?? true,
        tooltip: t('dashboard.influences.venusTooltip'),
      },
      {
        label: t('dashboard.influences.saturnLabel'),
        value: live?.Saturn?.fieldStrength ?? fallback('Saturn', 0.5),
        isResonant: live?.Saturn?.isResonant ?? false,
        tooltip: t('dashboard.influences.saturnTooltip'),
      },
    ];

    return { items, isLive };
  }, [t, birthSign, natalWeights, simTime]);
}

// ── Component ─────────────────────────────────────────────────────────────

export default function InfluenceGauges({
  birthSign,
  weights,
  isSynthetic = false,
  simTime,
}: {
  birthSign?: string;
  weights?: Record<string, number>;
  isSynthetic?: boolean;
  simTime?: number;
}) {
  const { t } = useLanguage();
  const { items, isLive } = useInfluences(birthSign, weights, simTime);
  const showLive = isLive && !isSynthetic;

  return (
    <div className="cosmic-tile p-6 rounded-[2rem] space-y-8">
      <div className="relative flex items-center justify-center">
        <h2
          className="text-xs font-sans font-bold tracking-[0.2em] uppercase text-center"
          style={{ color: 'var(--tile-text-secondary)' }}
        >
          {t('dashboard.influences.sectionTitle')}
        </h2>
        <div
          className={`absolute right-0 text-[8px] font-sans ${showLive ? 'opacity-80' : 'opacity-40'}`}
          style={{ color: showLive ? 'var(--tile-accent)' : 'var(--tile-text-secondary)' }}
        >
          {showLive
            ? t('dashboard.influences.liveLabel')
            : isSynthetic
              ? t('dashboard.influences.estimatedLabel')
              : t('dashboard.influences.noDataLabel')}
        </div>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12 transition-opacity duration-300 ${showLive ? '' : 'opacity-40'}`}>
        {items.map((inf) => (
          <Gauge
            key={inf.label}
            label={inf.label}
            value={inf.value}
            isResonant={inf.isResonant}
            tooltip={inf.tooltip}
          />
        ))}
      </div>
    </div>
  );
}
