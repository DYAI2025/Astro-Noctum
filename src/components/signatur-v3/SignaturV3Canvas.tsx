/**
 * Bazodiac Signature V3 — Bipolar Trail Canvas
 *
 * Renders 12 poles (6 bipolar dimension pairs) that move and draw trails.
 * The accumulated trails ARE the signature.
 *
 * Rendering approach:
 * 1. Each pole draws its current position as a glowing point
 * 2. Each pole's trail is drawn as a fading line
 * 3. Where trails overlap → brightness accumulates → form emerges
 * 4. A subtle density glow shows the emergent structure
 */

import { useRef, useEffect, useCallback, useMemo } from 'react';
import {
  type PoleState,
  type SignaturV3Config,
  type V3DissonanceState,
  type DayHarmonicState,
  type SolarModulation,
  DIMENSIONS,
  initializePoles,
  computeV3Dissonance,
  updatePoles,
  modulateConfig,
} from './bipolar-engine';
import type { DissonanceResult } from '../../lib/fusion-ring/dissonance';

// ═══════════════════════════════════════
//  PROPS
// ═══════════════════════════════════════

export interface SignaturV3Props {
  /** 6 natal dimension weights [0,1] keyed by dimension id */
  natalWeights: Record<string, number>;
  /** 6 quiz dimension weights [0,1] keyed by dimension id */
  quizWeights: Record<string, number>;
  /** Day harmonic state — modulates trail persistence and Lissajous blend */
  dayHarmonic?: DayHarmonicState;
  /** External 3-layer dissonance from useDissonance hook */
  externalDissonance?: DissonanceResult | null;
  /** Space weather modulation from useSpaceWeather */
  solarModulation?: SolarModulation;
  /** Canvas CSS class */
  className?: string;
  /** Width override */
  width?: number;
  /** Height override */
  height?: number;
}

// ═══════════════════════════════════════
//  DEFAULT CONFIG
// ═══════════════════════════════════════

const DEFAULT_CONFIG: SignaturV3Config = {
  maxR: 200,
  maxTrailLength: 2000,
  trailPersistence: 0.85,
  timeScale: 1.0,
};

// ═══════════════════════════════════════
//  RENDER HELPERS
// ═══════════════════════════════════════

function drawPoleTrail(
  ctx: CanvasRenderingContext2D,
  pole: PoleState,
  dim: typeof DIMENSIONS[number],
  config: SignaturV3Config,
  centerX: number,
  centerY: number,
): void {
  if (pole.trailLength < 2) return;

  const color = pole.pole === 'A' ? dim.colorA : dim.colorB;
  const [r, g, b] = color;

  // Draw trail as connected line segments with fading opacity
  ctx.beginPath();
  let started = false;

  for (let i = 0; i < pole.trailLength; i++) {
    // Read from oldest to newest
    const readIdx = (pole.trailHead - pole.trailLength + i + config.maxTrailLength) % config.maxTrailLength;
    const x = centerX + pole.trail[readIdx * 2]!;
    const y = centerY + pole.trail[readIdx * 2 + 1]!;

    if (!started) {
      ctx.moveTo(x, y);
      started = true;
    } else {
      ctx.lineTo(x, y);
    }
  }

  // Trail line — thin, semi-transparent, colored
  const freshness = Math.min(pole.trailLength / 200, 1);
  ctx.strokeStyle = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${0.15 * freshness})`;
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Draw recent trail segments with higher opacity (the "fresh ink")
  const recentCount = Math.min(80, pole.trailLength);
  if (recentCount > 1) {
    ctx.beginPath();
    for (let i = pole.trailLength - recentCount; i < pole.trailLength; i++) {
      const readIdx = (pole.trailHead - pole.trailLength + i + config.maxTrailLength) % config.maxTrailLength;
      const x = centerX + pole.trail[readIdx * 2]!;
      const y = centerY + pole.trail[readIdx * 2 + 1]!;
      const localAge = (pole.trailLength - i) / recentCount;
      const alpha = (1 - localAge) * 0.6;

      if (i === pole.trailLength - recentCount) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.strokeStyle = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, 0.4)`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawPoleHead(
  ctx: CanvasRenderingContext2D,
  pole: PoleState,
  dim: typeof DIMENSIONS[number],
  centerX: number,
  centerY: number,
  dissonance: number,
): void {
  const color = pole.pole === 'A' ? dim.colorA : dim.colorB;
  const [r, g, b] = color;
  const px = centerX + pole.x;
  const py = centerY + pole.y;

  // Glow radius scales with dissonance — more tension = bigger glow
  const glowR = 8 + dissonance * 12;

  // Outer glow
  const gradient = ctx.createRadialGradient(px, py, 0, px, py, glowR);
  gradient.addColorStop(0, `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, 0.6)`);
  gradient.addColorStop(0.4, `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, 0.15)`);
  gradient.addColorStop(1, `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, 0)`);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(px, py, glowR, 0, Math.PI * 2);
  ctx.fill();

  // Core dot
  ctx.fillStyle = `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, 0.9)`;
  ctx.beginPath();
  ctx.arc(px, py, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawCenter(ctx: CanvasRenderingContext2D, cx: number, cy: number): void {
  // Subtle center singularity
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 12);
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0.8)');
  gradient.addColorStop(0.3, 'rgba(20, 15, 30, 0.4)');
  gradient.addColorStop(0.7, 'rgba(40, 30, 50, 0.1)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.fill();
}

function drawDimensionAxis(
  ctx: CanvasRenderingContext2D,
  dim: typeof DIMENSIONS[number],
  config: SignaturV3Config,
  cx: number,
  cy: number,
): void {
  // Very subtle axis line showing the dimension's home angle
  const axisLen = config.maxR * 0.9;
  const x1 = cx + Math.cos(dim.baseAngle) * axisLen;
  const y1 = cy + Math.sin(dim.baseAngle) * axisLen;
  const x2 = cx + Math.cos(dim.baseAngle + Math.PI) * axisLen;
  const y2 = cy + Math.sin(dim.baseAngle + Math.PI) * axisLen;

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

// ═══════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════

export default function SignaturV3Canvas({
  natalWeights,
  quizWeights,
  dayHarmonic,
  externalDissonance,
  solarModulation,
  className,
  width = 500,
  height = 500,
}: SignaturV3Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const polesRef = useRef<PoleState[] | null>(null);
  const dissonanceRef = useRef<V3DissonanceState | null>(null);
  const dayHarmonicRef = useRef<DayHarmonicState | undefined>(dayHarmonic);
  const solarRef = useRef<SolarModulation | undefined>(solarModulation);
  const timeRef = useRef(0);
  const lastFrameRef = useRef(0);
  const visibleRef = useRef(true);

  // Keep refs in sync with props (avoids restarting animation loop on each change)
  dayHarmonicRef.current = dayHarmonic;
  solarRef.current = solarModulation;

  const config = useMemo(() => ({
    ...DEFAULT_CONFIG,
    maxR: Math.min(width, height) * 0.4,
  }), [width, height]);

  const natalMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const [k, v] of Object.entries(natalWeights)) m.set(k, v);
    return m;
  }, [natalWeights]);

  const quizMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const [k, v] of Object.entries(quizWeights)) m.set(k, v);
    return m;
  }, [quizWeights]);

  // Initialize poles when weights change
  useEffect(() => {
    polesRef.current = initializePoles(config, natalMap, quizMap);
    dissonanceRef.current = computeV3Dissonance(natalMap, quizMap, externalDissonance);
  }, [config, natalMap, quizMap, externalDissonance]);

  // Pause when tab hidden, resume on visible
  useEffect(() => {
    const onVisibilityChange = () => {
      visibleRef.current = !document.hidden;
      if (!document.hidden) {
        lastFrameRef.current = performance.now();
        animRef.current = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  // Animation loop with delta time
  const render = useCallback(() => {
    if (!visibleRef.current) return;

    const canvas = canvasRef.current;
    const poles = polesRef.current;
    const dissonance = dissonanceRef.current;
    if (!canvas || !poles || !dissonance) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = width * dpr;
    const h = height * dpr;

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = width / 2;
    const cy = height / 2;

    // Delta time for frame-rate-independent animation
    const now = performance.now();
    const dt = lastFrameRef.current ? Math.min((now - lastFrameRef.current) / 1000, 0.05) : 0.016;
    lastFrameRef.current = now;
    timeRef.current += dt;

    // Apply day-harmonic config modulation (trail persistence etc.)
    const activeConfig = dayHarmonicRef.current
      ? modulateConfig(config, dayHarmonicRef.current)
      : config;

    // Update pole positions
    updatePoles(poles, dissonance, activeConfig, timeRef.current, dayHarmonicRef.current, solarRef.current);

    // === RENDER ===

    // Semi-transparent clear — trails persist through partial fade
    // Solar storms increase fade rate slightly (more energy = brighter trails)
    const solarFadeMod = solarRef.current ? (solarRef.current.ringModulation - 1.0) * 0.01 : 0;
    ctx.fillStyle = `rgba(8, 5, 15, ${0.02 + dissonance.dNatal * 0.03 - solarFadeMod})`;
    ctx.fillRect(0, 0, width, height);

    // Dimension axes (very subtle guide lines)
    for (const dim of DIMENSIONS) {
      drawDimensionAxis(ctx, dim, config, cx, cy);
    }

    // Draw all trails
    ctx.globalCompositeOperation = 'lighter'; // additive blending — overlapping trails brighten
    for (let i = 0; i < poles.length; i++) {
      const pole = poles[i]!;
      const dimIdx = Math.floor(i / 2);
      const dim = DIMENSIONS[dimIdx]!;
      drawPoleTrail(ctx, pole, dim, activeConfig, cx, cy);
    }

    // Draw pole heads (the moving points)
    for (let i = 0; i < poles.length; i++) {
      const pole = poles[i]!;
      const dimIdx = Math.floor(i / 2);
      const dim = DIMENSIONS[dimIdx]!;
      const d = dissonance.dimensional.get(dim.id) ?? 0;
      drawPoleHead(ctx, pole, dim, cx, cy, d);
    }
    ctx.globalCompositeOperation = 'source-over';

    // Center singularity
    drawCenter(ctx, cx, cy);

    animRef.current = requestAnimationFrame(render);
  }, [width, height, config]);

  useEffect(() => {
    lastFrameRef.current = performance.now();
    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, [render]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width,
        height,
        background: 'radial-gradient(ellipse at center, #0d0a1a 0%, #050308 100%)',
        borderRadius: '50%',
      }}
    />
  );
}
