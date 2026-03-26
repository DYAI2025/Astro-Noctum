import { Tooltip } from "../Tooltip";
import { useLanguage } from '../../contexts/LanguageContext';

interface GaugeProps {
  label: string;
  value: number; // 0 to 1
  color?: string;
  tooltip?: string;
}

function Gauge({ label, value, color = "bg-white", tooltip }: GaugeProps) {
  const inner = (
    <div className="space-y-3 group cursor-help">
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

const DEFAULT_INFLUENCES: InfluenceData[] = [
  {
    label: "Mars-Sektor",
    value: 0.82,
    color: "bg-gradient-to-r from-red-500 to-orange-400",
    tooltip: "Mars steht für Antrieb, Durchsetzungskraft und körperliche Energie. Ein hoher Mars-Sektor-Wert zeigt eine Phase erhöhter Tatkraft und Entschlossenheit an.",
  },
  {
    label: "Jupiter-Sektor",
    value: 0.65,
    color: "bg-gradient-to-r from-cyan-400 to-blue-500",
    tooltip: "Jupiter repräsentiert Wachstum, Weisheit und Expansion. Dieser Wert spiegelt das Potenzial für neue Erkenntnisse, Optimismus und günstige Entwicklungen wider.",
  },
  {
    label: "Venus-Balance",
    value: 0.45,
    color: "bg-gradient-to-r from-purple-400 to-pink-400",
    tooltip: "Venus steht für Harmonie, Beziehungen und ästhetisches Empfinden. Die Venus-Balance zeigt, wie stark die Einflüsse von Liebe, Schönheit und Verbundenheit heute wirken.",
  },
  {
    label: "Saturn-Fokus",
    value: 0.30,
    color: "bg-gradient-to-r from-zinc-400 to-zinc-200",
    tooltip: "Saturn verkörpert Struktur, Disziplin und Verantwortung. Ein niedriger Saturn-Fokus deutet auf eine Phase mit weniger äußeren Beschränkungen und mehr Gestaltungsfreiheit hin.",
  },
];

export default function InfluenceGauges({ influences = DEFAULT_INFLUENCES }: { influences?: InfluenceData[] }) {
  const { lang } = useLanguage();
  return (
    <div className="bg-zinc-900/40 border border-zinc-800 p-8 rounded-[2rem] space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase">{lang === 'de' ? 'Heutige Einflüsse' : "Today's Influences"}</h2>
        <div className="text-[8px] font-mono text-zinc-600">TRANSIT</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
        {influences.map((inf, i) => (
          <Gauge key={i} label={inf.label} value={inf.value} color={inf.color} tooltip={inf.tooltip} />
        ))}
      </div>
    </div>
  );
}
