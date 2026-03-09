import { useRef, useEffect, useCallback } from 'react';
import type { FusionRingSignal } from '../lib/fusion-ring/signal';
import { drawFusionRing } from '../lib/fusion-ring/draw';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FusionRingProps {
  signal: FusionRingSignal;
  /** Transit sector influences [0..1] × 12 — optional overlay. */
  transitSignals?: number[];
  /** How strongly transit overlay blends in (0..1). Default 0. */
  transitBlend?: number;
  /** px — canvas is rendered square at this size. Default 400. */
  size?: number;
  showLabels?: boolean;
  showKorona?: boolean;
  showTension?: boolean;
  /** Run continuous rAF loop (breathing + korona). Default true. */
  animated?: boolean;
  /** Draw deep space background + star field. Default true. */
  withBackground?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FusionRing({
  signal,
  transitSignals,
  transitBlend = 0,
  size = 400,
  showLabels = true,
  showKorona = true,
  showTension = true,
  animated = true,
  withBackground = true,
  className,
}: FusionRingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(performance.now());

  const draw = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;

      drawFusionRing(ctx, w, h, signal.sectors, {
        transitSignals,
        transitBlend,
        time,
        withBackground,
        showLabels,
        showKorona,
        showTension,
      });
    },
    [signal, transitSignals, transitBlend, withBackground, showLabels, showKorona, showTension],
  );

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);

    if (animated) {
      const loop = () => {
        const t = (performance.now() - startRef.current) / 1000;
        draw(t);
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    } else {
      draw(0);
    }

    return () => cancelAnimationFrame(rafRef.current);
  }, [animated, draw]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size }}
    />
  );
}
