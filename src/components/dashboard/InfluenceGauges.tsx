import { useMemo } from 'react';
import { Tooltip } from "../Tooltip";
import { useLanguage } from '../../contexts/LanguageContext';

interface GaugeProps {
  label: string;
  value: number; // 0 to 1
  color?: string;
  tooltip?: string;
}

function Gauge({ label, value, color = "bg-white", tooltip }: GaugeProps) {
  // Safeguard: handle NaN, undefined or out-of-range values
  const safeValue = isNaN(value) || value === undefined ? 0 : Math.max(0, Math.min(1, value));
  const percent = Math.round(safeValue * 100);

  const inner = (
    <div
      className={`space-y-3 group${tooltip ? " cursor-help" : ""}`}
      tabIndex={tooltip ? 0 : undefined}
    >
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] transition-colors" style={{ color: 'var(--tile-text-secondary)' }}>
          {label}
        </span>
        <span className="text-[10px] font-sans" style={{ color: 'var(--tile-text-secondary)', opacity: 0.7 }}>
          {percent}%
        </span>
      </div>
      <div className="influence-track">
        <div
          className={`h-full ${color} transition-all duration-1000 ease-out relative z-10`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );

  if (tooltip) {
    return <Tooltip content={tooltip} wide dark>{inner}</Tooltip>;
  }
  return inner;
}

export interface InfluenceData {
  label: string;
  value: number;
  color: string;
  tooltip?: string;
}

function useInfluences(weights?: Record<string, number>): InfluenceData[] {
  const { t } = useLanguage();
  return useMemo(() => [
    {
      label: t("dashboard.influences.marsLabel"),
      value: weights?.Mars ?? 0.82,
      color: "bg-gradient-to-r from-red-500 to-orange-400",
      tooltip: t("dashboard.influences.marsTooltip"),
    },
    {
      label: t("dashboard.influences.jupiterLabel"),
      value: weights?.Jupiter ?? 0.65,
      color: "bg-gradient-to-r from-cyan-400 to-blue-500",
      tooltip: t("dashboard.influences.jupiterTooltip"),
    },
    {
      label: t("dashboard.influences.venusLabel"),
      value: weights?.Venus ?? 0.45,
      color: "bg-gradient-to-r from-purple-400 to-pink-400",
      tooltip: t("dashboard.influences.venusTooltip"),
    },
    {
      label: t("dashboard.influences.saturnLabel"),
      value: weights?.Saturn ?? 0.30,
      color: "bg-gradient-to-r from-zinc-400 to-zinc-200",
      tooltip: t("dashboard.influences.saturnTooltip"),
    },
  ], [t, weights]);
}

export default function InfluenceGauges({ weights }: { weights?: Record<string, number> }) {
  const { t } = useLanguage();
  const items = useInfluences(weights);

  return (
    <div className="cosmic-tile p-6 rounded-[2rem] space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase" style={{ color: 'var(--tile-text-secondary)' }}>{t('dashboard.influences.sectionTitle')}</h2>
        <div className="text-[8px] font-sans" style={{ color: 'var(--tile-text-secondary)', opacity: 0.5 }}>TRANSIT</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
        {items.map((inf, i) => (
          <Gauge key={i} label={inf.label} value={inf.value} color={inf.color} tooltip={inf.tooltip} />
        ))}
      </div>
    </div>
  );
}
