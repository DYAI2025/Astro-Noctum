import { useNeoVisitors } from '@/src/hooks/useNeoVisitors';

export function NeoRibbon() {
  const { objects, loading } = useNeoVisitors();

  if (loading || objects.length === 0) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-3">
      <h2 className="text-xs uppercase tracking-widest text-white/40">
        Near-Earth Visitors (7 Tage)
      </h2>

      <div className="space-y-2">
        {objects.map(neo => (
          <div key={neo.designation} className="flex items-center justify-between text-sm">
            <div>
              <span className="text-white/70">{neo.name || neo.designation}</span>
              {neo.isPotentiallyHazardous && (
                <span className="ml-2 text-[10px] text-red-400 uppercase">PHA</span>
              )}
            </div>
            <div className="text-right text-xs text-white/40">
              <div>{neo.distanceEarthRadii} ER | {neo.velocityKmS} km/s</div>
              <div>{neo.estimatedDiameterM}m est.</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
