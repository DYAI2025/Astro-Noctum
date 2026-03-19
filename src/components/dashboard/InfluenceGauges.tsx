interface GaugeProps {
  label: string;
  value: number; // 0 to 1
  color?: string;
}

function Gauge({ label, value, color = "bg-white" }: GaugeProps) {
  return (
    <div className="space-y-3 group">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] group-hover:text-zinc-400 transition-colors">
          {label}
        </span>
        <span className="text-[10px] font-mono text-zinc-400">
          {Math.round(value * 100)}%
        </span>
      </div>
      <div className="h-[6px] w-full bg-zinc-900/50 rounded-full overflow-hidden border border-white/5 relative">
        <div
          className="absolute inset-y-0 left-0 bg-white/10 blur-[4px]"
          style={{ width: `${value * 100}%` }}
        />
        <div
          className={`h-full ${color} transition-all duration-1000 ease-out relative z-10`}
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  );
}

export interface InfluenceData {
  label: string;
  value: number;
  color: string;
}

interface InfluenceGaugesProps {
  influences?: InfluenceData[];
}

const DEFAULT_INFLUENCES: InfluenceData[] = [
  { label: "Mars-Sektor", value: 0.82, color: "bg-gradient-to-r from-red-500 to-orange-400" },
  { label: "Jupiter-Sektor", value: 0.65, color: "bg-gradient-to-r from-cyan-400 to-blue-500" },
  { label: "Venus-Balance", value: 0.45, color: "bg-gradient-to-r from-purple-400 to-pink-400" },
  { label: "Saturn-Fokus", value: 0.30, color: "bg-gradient-to-r from-zinc-400 to-zinc-200" },
];

export default function InfluenceGauges({ influences = DEFAULT_INFLUENCES }: InfluenceGaugesProps) {
  return (
    <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2rem] space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">Heutige Einflüsse</h2>
        <div className="text-[8px] font-mono text-zinc-600">LIVE FEED</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
        {influences.map((inf, i) => (
          <Gauge key={i} label={inf.label} value={inf.value} color={inf.color} />
        ))}
      </div>
    </div>
  );
}
