import type { ChladniParams } from '@/src/lib/cymatics/bazi-to-chladni';

interface ChladniParamsBadgeProps {
  params: ChladniParams;
  planetariumMode?: boolean;
  className?: string;
}

interface Chip {
  label: string;
  value: string;
  tooltip: string;
}

export function ChladniParamsBadge({
  params,
  planetariumMode = true,
  className,
}: ChladniParamsBadgeProps) {
  const dark = planetariumMode;

  const chips: Chip[] = [
    {
      label: 'm',
      value: String(params.m),
      tooltip: 'Knotenlinien auf der x-Achse — aus deiner BaZi-Vier-Säulen-Signatur abgeleitet',
    },
    {
      label: 'n',
      value: String(params.n),
      tooltip: 'Knotenlinien auf der y-Achse — aus deiner numerischen BaZi-Signatur abgeleitet',
    },
    {
      label: 'α',
      value: params.a.toFixed(3),
      tooltip: 'Amplitudenkoeffizient — proportional zu deinem Wu-Xing Harmonie-Index (0,3–1,0)',
    },
    {
      label: 'β',
      value: params.b.toFixed(3),
      tooltip: 'Gegenkoeffizient — Komplement zu α: β = 1 − α × 0,6',
    },
    {
      label: 'Harmonie',
      value: `${Math.round(params.harmonyIndex * 100)}%`,
      tooltip: 'Ausgleich der fünf Elemente in deinem Geburtsmoment — 0 % = polar unausgeglichen, 100 % = vollständig harmonisch',
    },
  ];

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-2 ${className ?? ''}`}
      data-testid="chladni-params-badge"
      aria-label="Chladni Signatur-Parameter"
    >
      {chips.map(chip => (
        <div
          key={chip.label}
          title={chip.tooltip}
          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-mono cursor-default select-none ${
            dark
              ? 'border-white/8 bg-white/[0.04] text-white/50 hover:border-white/15 hover:text-white/70'
              : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:text-slate-700'
          } transition-colors duration-150`}
        >
          <span className={dark ? 'text-white/30' : 'text-slate-400'}>{chip.label}</span>
          <span className={`font-medium ${dark ? 'text-white/65' : 'text-slate-600'}`}>
            {chip.value}
          </span>
        </div>
      ))}
    </div>
  );
}
