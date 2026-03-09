import { useRef, useEffect, useState, useCallback } from 'react';
import type { FusionRingSignal } from '../lib/fusion-ring/signal';
import { drawFusionRing, SECTOR_ARCHETYPAL_COLORS } from '../lib/fusion-ring/draw';
import { generateTransitTimeline, todayOffset, type DayTransit } from '../lib/fusion-ring/transit';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TIME_RANGES = [7, 14, 30] as const;
type TimeRange = typeof TIME_RANGES[number];

const SPEEDS = [0.5, 1, 2, 4] as const;
type Speed = typeof SPEEDS[number];

// ---------------------------------------------------------------------------
// Sparkline component
// ---------------------------------------------------------------------------

interface SparklineProps {
  timeline: DayTransit[];
  currentDay: number;
  soulprint: number[];
  onSeek: (day: number) => void;
}

function TimelineSparkline({ timeline, currentDay, soulprint, onSeek }: SparklineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || timeline.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const barW = Math.max(1, (w / timeline.length) - 1);

    for (let d = 0; d < timeline.length; d++) {
      const day = timeline[d];

      // Total energy = sum of (combined - soulprint) above baseline
      const combined = soulprint.map((s, i) =>
        Math.min(1, s + (day.signals[i] ?? 0) * 0.35),
      );
      const totalEnergy = combined.reduce((acc, v) => acc + v, 0) / 12;
      const barH = Math.max(2, totalEnergy * h * 0.9);

      // Dominant sector determines bar color
      let maxIdx = 0;
      combined.forEach((v, i) => { if (v > combined[maxIdx]) maxIdx = i; });
      const color = SECTOR_ARCHETYPAL_COLORS[maxIdx];

      const x = (d / timeline.length) * w;
      const isActive = d === currentDay;

      ctx.fillStyle = isActive ? '#FFFFFF' : `${color}99`;
      ctx.fillRect(x, h - barH, barW, barH);

      if (isActive) {
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fillRect(x, 0, barW, h);
      }
    }

    // Current day line
    const lineX = (currentDay / timeline.length) * w + barW / 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(lineX, 0);
    ctx.lineTo(lineX, h);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [timeline, currentDay, soulprint]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || timeline.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const day = Math.floor((x / rect.width) * timeline.length);
    onSeek(Math.max(0, Math.min(timeline.length - 1, day)));
  }, [timeline, onSeek]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={60}
      onClick={handleClick}
      className="w-full rounded cursor-pointer"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface FusionRingTimelineProps {
  signal: FusionRingSignal;
  size?: number;
  className?: string;
}

export default function FusionRingTimeline({
  signal,
  size = 420,
  className,
}: FusionRingTimelineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(performance.now());

  const [timeRange, setTimeRange] = useState<TimeRange>(14);
  const [currentDay, setCurrentDay] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(1);
  const [timeline, setTimeline] = useState<DayTransit[]>([]);

  // Generate / regenerate timeline when time range changes
  useEffect(() => {
    const offset = todayOffset();
    const tl = generateTransitTimeline(timeRange, offset);
    setTimeline(tl);
    setCurrentDay(0);
  }, [timeRange]);

  // Autoplay: advance currentDay on interval
  useEffect(() => {
    if (!isPlaying || timeline.length === 0) return;
    const ms = 800 / speed;
    const id = setInterval(() => {
      setCurrentDay(prev => {
        const next = prev + 1;
        if (next >= timeline.length) {
          setIsPlaying(false);
          return prev;
        }
        return next;
      });
    }, ms);
    return () => clearInterval(id);
  }, [isPlaying, speed, timeline.length]);

  // Canvas draw loop
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || timeline.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const t = (performance.now() - startRef.current) / 1000;
    const day = timeline[currentDay];
    if (!day) return;

    drawFusionRing(ctx, canvas.width, canvas.height, signal.sectors, {
      transitSignals: day.signals,
      transitBlend: 1,
      time: t,
      withBackground: true,
      showLabels: true,
      showKorona: true,
      showTension: true,
    });
  }, [signal.sectors, timeline, currentDay]);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    const loop = () => {
      draw();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  // Derived display values
  const currentTransit = timeline[currentDay];
  const displayDate = currentTransit
    ? new Date(Date.now() + currentDay * 86_400_000).toLocaleDateString('de-DE', {
        weekday: 'short', day: 'numeric', month: 'short',
      })
    : '—';

  return (
    <div className={`flex flex-col items-center gap-4 ${className ?? ''}`}>
      {/* Time range selector */}
      <div className="flex gap-2">
        {TIME_RANGES.map(r => (
          <button
            key={r}
            onClick={() => setTimeRange(r)}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              timeRange === r
                ? 'bg-gold text-obsidian'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            {r}T
          </button>
        ))}
      </div>

      {/* Ring canvas */}
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="rounded-full"
        style={{ width: size, height: size }}
      />

      {/* Active transits display */}
      {currentTransit && currentTransit.activeTransits.length > 0 && (
        <div className="flex gap-3 text-sm">
          {currentTransit.activeTransits.map((at, idx) => (
            <span
              key={idx}
              className="flex items-center gap-1 text-white/70"
            >
              <span className="text-base">{at.symbol}</span>
              <span className="text-white/40">{at.planet}</span>
            </span>
          ))}
        </div>
      )}

      {/* Sparkline */}
      {timeline.length > 0 && (
        <div className="w-full px-2">
          <TimelineSparkline
            timeline={timeline}
            currentDay={currentDay}
            soulprint={signal.sectors}
            onSeek={setCurrentDay}
          />
        </div>
      )}

      {/* Date + scrubber */}
      <div className="w-full flex flex-col items-center gap-2 px-2">
        <span className="text-white/50 text-xs">{displayDate}</span>
        <input
          type="range"
          min={0}
          max={Math.max(0, timeline.length - 1)}
          value={currentDay}
          onChange={e => {
            setCurrentDay(Number(e.target.value));
            setIsPlaying(false);
          }}
          className="w-full accent-gold"
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {/* Play / Pause */}
        <button
          onClick={() => setIsPlaying(p => !p)}
          className="px-4 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        {/* Speed */}
        <div className="flex gap-1">
          {SPEEDS.map(s => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                speed === s
                  ? 'bg-white/30 text-white'
                  : 'bg-white/10 text-white/50 hover:bg-white/20'
              }`}
            >
              {s}×
            </button>
          ))}
        </div>

        {/* Reset */}
        <button
          onClick={() => { setCurrentDay(0); setIsPlaying(false); }}
          className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white/60 text-sm transition-colors"
        >
          ↺
        </button>
      </div>
    </div>
  );
}
