import { useEffect, useRef } from 'react';
import type { ChladniParams } from '../../lib/cymatics/bazi-to-chladni';
import { ELEMENT_COLORS } from '../../lib/cymatics/bazi-to-chladni';
import { chladni, lerp } from '../../lib/cymatics/chladni-math';

const N_PARTICLES = 16_000;
const MAX_SIZE = 600;

// Fraction of bg blended in per frame — creates particle trail effect
const TRAIL_ALPHA = 18 / 255; // matches Cymantics prototype "bg alpha 18"

const LERP_MN = 0.04;
const LERP_AB = 0.03;

// Theme background colours — exported for tests
export const CYMATICS_DARK_BG  = { r: 10,  g: 32,  b: 48  } as const; // #0a2030
export const CYMATICS_BRIGHT_BG = { r: 241, g: 245, b: 249 } as const; // #f1f5f9

// Scatter effect duration in animation frames (~1.5s at 60fps)
const SCATTER_FRAMES = 90;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export interface SignaturCymaticsCanvasProps {
  params: ChladniParams;
  planetariumMode?: boolean;
  onFailed?: () => void;
  className?: string;
}

/**
 * Canvas2D Chladni particle simulation.
 *
 * 16 000 particles wander stochastically toward nodal lines of the
 * Chladni equation. Params change is smooth-interpolated per frame
 * (no hard reset). M/N changes trigger a brief scatter burst (~1.5s)
 * before the new pattern crystallises.
 *
 * Dark mode: near-black (#0a2030) background, element-coloured glow.
 * Bright mode: near-white (#f1f5f9) background, inverted (dark) particles.
 */
export function SignaturCymaticsCanvas({
  params,
  planetariumMode = true,
  onFailed,
  className,
}: SignaturCymaticsCanvasProps) {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Live refs — read by the RAF loop, updated on prop changes
  const paramsRef      = useRef<ChladniParams>(params);
  const planetariumRef = useRef(planetariumMode);

  // Smooth-interpolated params — mutated in-place each frame
  const smoothRef = useRef({
    m: params.m, n: params.n,
    a: params.a, b: params.b,
    harmonyIndex: params.harmonyIndex,
  });

  // Scatter burst when m or n changes
  const scatterRef  = useRef(0);
  const prevMNRef   = useRef({ m: params.m, n: params.n });

  useEffect(() => {
    paramsRef.current = params;
    const prev = prevMNRef.current;
    if (params.m !== prev.m || params.n !== prev.n) {
      scatterRef.current = SCATTER_FRAMES;
      prevMNRef.current = { m: params.m, n: params.n };
    }
  }, [params]);

  useEffect(() => {
    planetariumRef.current = planetariumMode;
  }, [planetariumMode]);

  // Main simulation — mounts once, reads live refs each frame
  useEffect(() => {
    const canvas    = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let ctx: CanvasRenderingContext2D | null;
    try {
      ctx = canvas.getContext('2d');
    } catch {
      onFailed?.();
      return;
    }
    if (!ctx) {
      onFailed?.();
      return;
    }
    const context = ctx;

    let size = Math.min(container.clientWidth || MAX_SIZE, MAX_SIZE);
    canvas.width  = size;
    canvas.height = size;

    // Flat array: [x0, y0, x1, y1, ...] — particle positions in [0,1]²
    const particles = new Float32Array(N_PARTICLES * 2);
    for (let i = 0; i < particles.length; i++) particles[i] = Math.random();

    // Sync smooth params with current values
    const sp = smoothRef.current;
    const ip = paramsRef.current;
    sp.m = ip.m; sp.n = ip.n; sp.a = ip.a; sp.b = ip.b; sp.harmonyIndex = ip.harmonyIndex;

    // Full initial background fill
    const initBg = planetariumRef.current ? CYMATICS_DARK_BG : CYMATICS_BRIGHT_BG;
    context.fillStyle = `rgb(${initBg.r},${initBg.g},${initBg.b})`;
    context.fillRect(0, 0, size, size);

    let rafId  = 0;
    let active = true;

    const draw = () => {
      if (!active) return;

      const tp   = paramsRef.current;
      const dark = planetariumRef.current;
      const bg   = dark ? CYMATICS_DARK_BG : CYMATICS_BRIGHT_BG;

      // Smooth-interpolate toward target params
      sp.m = lerp(sp.m, tp.m, LERP_MN);
      sp.n = lerp(sp.n, tp.n, LERP_MN);
      sp.a = lerp(sp.a, tp.a, LERP_AB);
      sp.b = lerp(sp.b, tp.b, LERP_AB);
      sp.harmonyIndex = lerp(sp.harmonyIndex, tp.harmonyIndex, LERP_AB);

      // Fade-toward-background trail effect
      context.fillStyle = `rgba(${bg.r},${bg.g},${bg.b},${TRAIL_ALPHA})`;
      context.fillRect(0, 0, size, size);

      // Element particle colour (inverted for bright mode)
      const hexColor = ELEMENT_COLORS[tp.dominantElement] ?? ELEMENT_COLORS.Water;
      let [pr, pg, pb] = hexToRgb(hexColor);
      if (!dark) { pr = 255 - pr; pg = 255 - pg; pb = 255 - pb; }

      // Scatter burst boosts vibration on m/n change
      const scatterBoost = scatterRef.current > 0 ? (scatterRef.current / SCATTER_FRAMES) * 0.012 : 0;
      if (scatterRef.current > 0) scatterRef.current--;

      const vibration = 0.003 + sp.harmonyIndex * 0.004 + scatterBoost;

      for (let i = 0; i < N_PARTICLES; i++) {
        const xi = i * 2;
        const yi = xi + 1;

        const eq    = chladni(particles[xi], particles[yi], sp.a, sp.b, sp.m, sp.n);
        let   stoch = vibration * Math.abs(eq);
        if (stoch < 0.0008) stoch = 0.0008;

        particles[xi] = Math.max(0, Math.min(1, particles[xi] + (Math.random() * 2 - 1) * stoch));
        particles[yi] = Math.max(0, Math.min(1, particles[yi] + (Math.random() * 2 - 1) * stoch));

        // Brightness ∝ proximity to nodal line (|eq| ≈ 0 → fully settled → brighter)
        const proximity = 1 - Math.min(1, Math.abs(eq) * 8);
        const alpha     = (proximity * 200 + 30) / 255;

        context.fillStyle = `rgba(${pr},${pg},${pb},${alpha})`;
        context.fillRect(particles[xi] * size, particles[yi] * size, 1.5, 1.5);
      }

      rafId = requestAnimationFrame(draw);
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        cancelAnimationFrame(rafId);
      } else {
        rafId = requestAnimationFrame(draw);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    // Resize: keep canvas at min(container width, MAX_SIZE)
    const ro = new ResizeObserver(() => {
      const newSize = Math.min(container.clientWidth, MAX_SIZE);
      if (newSize > 0 && newSize !== size) {
        size = newSize;
        canvas.width  = size;
        canvas.height = size;
        const bg = planetariumRef.current ? CYMATICS_DARK_BG : CYMATICS_BRIGHT_BG;
        context.fillStyle = `rgb(${bg.r},${bg.g},${bg.b})`;
        context.fillRect(0, 0, size, size);
      }
    });
    ro.observe(container);

    rafId = requestAnimationFrame(draw);

    return () => {
      active = false;
      cancelAnimationFrame(rafId);
      document.removeEventListener('visibilitychange', onVisibility);
      ro.disconnect();
    };
  }, []); // mount once — all state accessed via refs

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', maxWidth: MAX_SIZE }}
      data-testid="cymatics-canvas-container"
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%', borderRadius: '50%' }}
        data-testid="cymatics-canvas"
      />
    </div>
  );
}
