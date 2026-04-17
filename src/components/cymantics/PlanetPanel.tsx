import { PLANETS } from "./planetaryFrequencies";

interface PlanetPanelProps {
  weights: number[];
  dominantIdx: number;
}

export function PlanetPanel({ weights, dominantIdx }: PlanetPanelProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {PLANETS.map((planet, i) => {
        const w = weights[i] ?? 0.5;
        const isDominant = i === dominantIdx;
        return (
          <div
            key={planet.name}
            style={{
              borderColor: isDominant ? planet.color : "rgba(26,26,46,0.8)",
              background: isDominant
                ? `linear-gradient(135deg, rgba(26,26,46,0.9), ${planet.color}18)`
                : "rgba(10,10,18,0.7)",
            }}
            className="relative p-3 rounded-lg border backdrop-blur-sm transition-all duration-700"
          >
            {isDominant && (
              <div
                className="absolute top-1.5 right-1.5 text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded"
                style={{ background: planet.color + "30", color: planet.color }}
              >
                dominant
              </div>
            )}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl" style={{ color: planet.color }}>
                {planet.symbol}
              </span>
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-white/60">
                  {planet.name}
                </div>
                <div className="text-[10px]" style={{ color: planet.color + "bb" }}>
                  {planet.baseFrequency.toFixed(2)} Hz
                </div>
              </div>
            </div>
            <div className="text-[11px] text-white/40 leading-tight mb-2">
              {planet.archetype_de}
            </div>
            {/* Intensity bar */}
            <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${w * 100}%`,
                  background: `linear-gradient(90deg, ${planet.color}88, ${planet.color})`,
                }}
              />
            </div>
            <div className="text-right text-[10px] mt-1 font-mono" style={{ color: planet.color + "88" }}>
              {Math.round(w * 100)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
