import { useFlareTimeline } from '@/src/hooks/useFlareTimeline';

export function FlareTimeline() {
  const { timeline, loading } = useFlareTimeline();

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <div className="h-48 skeleton-dust rounded" />
      </div>
    );
  }
  if (!timeline) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
      <h2 className="text-xs uppercase tracking-widest text-white/40">Flare-to-Field Timeline</h2>

      {/* X-ray Curve (SVG sparkline) */}
      {timeline.xrayCurve.length > 0 && (
        <div className="relative h-24">
          <svg viewBox="0 0 360 100" className="w-full h-full" preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke="#D4AF37"
              strokeWidth="1.5"
              opacity="0.7"
              points={timeline.xrayCurve.map((p, i) => {
                const x = (i / Math.max(timeline.xrayCurve.length - 1, 1)) * 360;
                const y = 100 - (Math.log10(Math.max(p.flux, 1e-9)) + 9) / 5 * 100;
                return `${x},${Math.max(0, Math.min(100, y))}`;
              }).join(' ')}
            />
          </svg>
          <div className="absolute top-0 left-0 text-[10px] text-white/20">GOES X-ray</div>
        </div>
      )}

      {/* Kp Bars */}
      {timeline.kpBars.length > 0 && (
        <div className="flex items-end gap-0.5 h-16">
          {timeline.kpBars.map((bar, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-sm transition-all"
              style={{
                height: `${(bar.kp / 9) * 100}%`,
                backgroundColor: bar.kp >= 5 ? '#ef4444' : bar.kp >= 3 ? '#f59e0b' : '#22c55e',
                opacity: 0.6,
              }}
              title={`Kp ${bar.kp.toFixed(1)} (${bar.noaaScale})`}
            />
          ))}
        </div>
      )}

      {/* DONKI Event Markers */}
      {timeline.events.length > 0 && (
        <div className="space-y-1">
          {timeline.events.slice(0, 5).map(evt => (
            <div key={evt.id} className="flex items-center gap-2 text-xs">
              <span className={`w-1.5 h-1.5 rounded-full ${
                evt.type === 'flare' ? 'bg-amber-400' : evt.type === 'cme_arrival' ? 'bg-red-500' : 'bg-blue-400'
              }`} />
              <span className="text-white/50">{evt.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* WSA-ENLIL arrival window */}
      {timeline.enlilWindow?.startAt && (
        <div className="text-xs text-white/30 border-t border-white/5 pt-2">
          CME-Ankunftsfenster: {new Date(timeline.enlilWindow.startAt).toLocaleDateString('de-DE')}
          {timeline.enlilWindow.endAt && ` — ${new Date(timeline.enlilWindow.endAt).toLocaleDateString('de-DE')}`}
        </div>
      )}
    </div>
  );
}
