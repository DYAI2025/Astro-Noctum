import { useAurora } from '@/src/hooks/useAurora';

export function AuroraLayer() {
  const { aurora, loading } = useAurora();

  if (loading) return null;
  if (!aurora || !aurora.auroraActive) return null;

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-purple-500/5 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <h2 className="text-xs uppercase tracking-widest text-emerald-400/70">Aurora-Alarm</h2>
      </div>

      <p className="text-sm text-white/70">{aurora.visibilityDE}</p>

      <div className="flex gap-4 text-xs text-white/40">
        <span>Kp {aurora.kp.toFixed(1)}</span>
        {aurora.gfzKp != null && <span>GFZ: {aurora.gfzKp.toFixed(1)}</span>}
      </div>

      {aurora.europeForecast.length > 0 && (
        <div className="relative h-32 rounded-lg bg-obsidian overflow-hidden">
          <svg viewBox="-15 45 55 27" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            {aurora.europeForecast.map((p, i) => (
              <circle
                key={i}
                cx={p.lon}
                cy={72 - p.lat}
                r={0.5}
                fill={`rgba(52, 211, 153, ${Math.min(1, p.probability / 100)})`}
              />
            ))}
            <text x="8" y="22" fill="rgba(255,255,255,0.1)" fontSize="2">Europa</text>
          </svg>
          <div className="absolute bottom-1 right-2 text-[9px] text-white/20">NOAA Ovation</div>
        </div>
      )}
    </div>
  );
}
