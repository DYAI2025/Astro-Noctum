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

import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import {
  type PoleState,
  type SignaturV3Config,
  type V3DissonanceState,
  type V3MorphState,
  type DayHarmonicState,
  type SolarModulation,
  DIMENSIONS,
  initializePoles,
  computeV3Dissonance,
  createV3Morph,
  tickV3Morph,
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
  /** Quality tier override: 'auto' selects based on canvas size */
  quality?: 'high' | 'medium' | 'low' | 'auto';
}

// ═══════════════════════════════════════
//  ADAPTIVE CONFIG — trail tier selection
// ═══════════════════════════════════════

type QualityTier = 'high' | 'medium' | 'low';

const TIER_CONFIGS: Record<QualityTier, Omit<SignaturV3Config, 'maxR'>> = {
  high: { maxTrailLength: 2000, trailPersistence: 0.85, timeScale: 1.0 },
  medium: { maxTrailLength: 800, trailPersistence: 0.82, timeScale: 1.0 },
  low: { maxTrailLength: 300, trailPersistence: 0.78, timeScale: 1.0 },
};

export function selectQualityTier(width: number, height: number): QualityTier {
  const size = Math.min(width, height);
  if (size >= 400) return 'high';
  if (size >= 250) return 'medium';
  return 'low';
}

export function buildConfig(width: number, height: number, quality: 'high' | 'medium' | 'low' | 'auto'): SignaturV3Config {
  const tier = quality === 'auto' ? selectQualityTier(width, height) : quality;
  return { ...TIER_CONFIGS[tier], maxR: Math.min(width, height) * 0.4 };
}

// ═══════════════════════════════════════
//  RENDER HELPERS
// ═══════════════════════════════════════

/**
 * Shift RGB color toward cool (Ke) or warm (Sheng) based on elemental quality.
 * elementalQuality: -1 = Ke (cool/crystalline), +1 = Sheng (warm/organic)
 */
function applyColorTemp(r: number, g: number, b: number, elementalQuality: number): [number, number, number] {
  const strength = Math.abs(elementalQuality) * 0.2; // max 20% shift
  if (elementalQuality < 0) {
    // Ke: shift toward cool blue (crystalline)
    return [Math.max(r - strength, 0), g, Math.min(b + strength * 0.8, 1)];
  } else if (elementalQuality > 0) {
    // Sheng: shift toward warm gold (organic)
    return [Math.min(r + strength * 0.4, 1), Math.min(g + strength * 0.15, 1), Math.max(b - strength * 0.3, 0)];
  }
  return [r, g, b];
}

function drawPoleTrail(
  ctx: CanvasRenderingContext2D,
  pole: PoleState,
  dim: typeof DIMENSIONS[number],
  config: SignaturV3Config,
  centerX: number,
  centerY: number,
  elementalQuality: number,
): void {
  if (pole.trailLength < 2) return;

  const baseColor = pole.pole === 'A' ? dim.colorA : dim.colorB;
  const [r, g, b] = applyColorTemp(baseColor[0], baseColor[1], baseColor[2], elementalQuality);

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
  elementalQuality: number,
): void {
  const baseColor = pole.pole === 'A' ? dim.colorA : dim.colorB;
  const [r, g, b] = applyColorTemp(baseColor[0], baseColor[1], baseColor[2], elementalQuality);
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
  quality = 'auto',
}: SignaturV3Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const prefersReducedMotion = useReducedMotion();
  const polesRef = useRef<PoleState[] | null>(null);
  const dissonanceRef = useRef<V3DissonanceState | null>(null);
  const morphRef = useRef<V3MorphState | null>(null);
  // Queue of pending morph targets — applied sequentially after active morph completes
  const morphQueueRef = useRef<V3DissonanceState[]>([]);
  const dayHarmonicRef = useRef<DayHarmonicState | undefined>(dayHarmonic);
  const solarRef = useRef<SolarModulation | undefined>(solarModulation);
  const timeRef = useRef(0);
  const lastFrameRef = useRef(0);
  const visibleRef = useRef(true);

  // Responsive sizing — uses ResizeObserver when no explicit width/height
  const isResponsive = width == null && height == null;
  const [containerSize, setContainerSize] = useState({ w: width || 500, h: height || 500 });

  useEffect(() => {
    if (!isResponsive) {
      setContainerSize({ w: width || 500, h: height || 500 });
      return;
    }
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry) setContainerSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [isResponsive, width, height]);

  const effectiveW = containerSize.w;
  const effectiveH = containerSize.h;

  // Keep refs in sync with props (avoids restarting animation loop on each change)
  dayHarmonicRef.current = dayHarmonic;
  solarRef.current = solarModulation;

  const config = useMemo(
    () => buildConfig(effectiveW, effectiveH, quality),
    [effectiveW, effectiveH, quality],
  );

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

  // Refs for morph: hold latest natal/external values without triggering re-init
  const natalMapMorphRef = useRef(natalMap);
  natalMapMorphRef.current = natalMap;
  const externalDissonanceMorphRef = useRef(externalDissonance);
  externalDissonanceMorphRef.current = externalDissonance;

  // Re-initialize poles only when canvas config or natal chart changes.
  // Quiz weight changes do NOT reset poles — they trigger a morph instead.
  useEffect(() => {
    polesRef.current = initializePoles(config, natalMap, quizMap);
    dissonanceRef.current = computeV3Dissonance(natalMap, quizMap, externalDissonance);
    morphRef.current = null; // clear any active morph on hard re-init
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, natalMap]);

  // Morph dissonance state when quiz weights change — continuous transition, no pole reset.
  // prefers-reduced-motion: apply instantly (no animation).
  // Rapid updates (<2s): queue behind the active morph; never skip a completion.
  useEffect(() => {
    if (!polesRef.current || !dissonanceRef.current) return;
    const newTarget = computeV3Dissonance(
      natalMapMorphRef.current,
      quizMap,
      externalDissonanceMorphRef.current,
    );

    if (prefersReducedMotion) {
      // Instant update — no transition, no ringbuffer flush
      dissonanceRef.current = newTarget;
      morphRef.current = null;
      morphQueueRef.current = [];
      return;
    }

    if (morphRef.current?.active) {
      // Another morph is running — queue this target for sequential playback
      morphQueueRef.current.push(newTarget);
    } else {
      morphRef.current = createV3Morph(dissonanceRef.current, newTarget, 2.0);
      morphQueueRef.current = [];
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizMap, externalDissonance, prefersReducedMotion]);

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
    if (!canvas || !poles || !dissonanceRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = effectiveW * dpr;
    const h = effectiveH * dpr;

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = effectiveW / 2;
    const cy = effectiveH / 2;

    // Delta time for frame-rate-independent animation
    const now = performance.now();
    const dt = lastFrameRef.current ? Math.min((now - lastFrameRef.current) / 1000, 0.05) : 0.016;
    lastFrameRef.current = now;
    timeRef.current += dt;

    // Advance morph if active — smoothly interpolates dissonance toward new quiz weights.
    // When a morph completes, drain the queue and start the next pending morph.
    if (morphRef.current?.active) {
      dissonanceRef.current = tickV3Morph(morphRef.current, dt);
      if (!morphRef.current.active && morphQueueRef.current.length > 0) {
        // Previous morph just finished — start next queued target
        const next = morphQueueRef.current.shift()!;
        morphRef.current = createV3Morph(dissonanceRef.current, next, 2.0);
      }
    }

    // Apply day-harmonic config modulation (trail persistence etc.)
    const activeConfig = dayHarmonicRef.current
      ? modulateConfig(config, dayHarmonicRef.current)
      : config;

    // Update pole positions
    updatePoles(poles, dissonanceRef.current, activeConfig, timeRef.current, dayHarmonicRef.current, solarRef.current);

    // === RENDER ===

    // Semi-transparent clear — trails persist through partial fade
    // Solar storms increase fade rate slightly (more energy = brighter trails)
    const solarFadeMod = solarRef.current ? (solarRef.current.ringModulation - 1.0) * 0.01 : 0;
    // During morph: accelerate trail fade so old geometry gives way to new geometry organically.
    // Uses a bell-curve envelope peaking at 50% morph progress for a symmetrical crossfade.
    const morphFade = (() => {
      const m = morphRef.current;
      if (!m?.active) return 0;
      const p = m.duration > 0 ? m.elapsed / m.duration : 0;
      return 4 * p * (1 - p) * 0.018; // bell curve: 0 at start/end, 0.018 at midpoint
    })();
    ctx.fillStyle = `rgba(8, 5, 15, ${0.02 + dissonanceRef.current.dNatal * 0.03 - solarFadeMod + morphFade})`;
    ctx.fillRect(0, 0, effectiveW, effectiveH);

    // Dimension axes (very subtle guide lines)
    for (const dim of DIMENSIONS) {
      drawDimensionAxis(ctx, dim, config, cx, cy);
    }

    const { elementalQuality } = dissonanceRef.current;

    // Draw all trails
    ctx.globalCompositeOperation = 'lighter'; // additive blending — overlapping trails brighten
    for (let i = 0; i < poles.length; i++) {
      const pole = poles[i]!;
      const dimIdx = Math.floor(i / 2);
      const dim = DIMENSIONS[dimIdx]!;
      drawPoleTrail(ctx, pole, dim, activeConfig, cx, cy, elementalQuality);
    }

    // Draw pole heads (the moving points)
    for (let i = 0; i < poles.length; i++) {
      const pole = poles[i]!;
      const dimIdx = Math.floor(i / 2);
      const dim = DIMENSIONS[dimIdx]!;
      const d = dissonanceRef.current.dimensional.get(dim.id) ?? 0;
      drawPoleHead(ctx, pole, dim, cx, cy, d, elementalQuality);
    }
    ctx.globalCompositeOperation = 'source-over';

    // Center singularity
    drawCenter(ctx, cx, cy);

    animRef.current = requestAnimationFrame(render);
  }, [effectiveW, effectiveH, config]);

  useEffect(() => {
    lastFrameRef.current = performance.now();
    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, [render]);

  if (isResponsive) {
    return (
      <div ref={containerRef} className={className} style={{ width: '100%', height: '100%' }}>
        <canvas
          ref={canvasRef}
          className={className}
          style={{
            width: effectiveW,
            height: effectiveH,
            background: 'radial-gradient(ellipse at center, #0d0a1a 0%, #050308 100%)',
          }}
        />
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: effectiveW,
        height: effectiveH,
        background: 'radial-gradient(ellipse at center, #0d0a1a 0%, #050308 100%)',
        borderRadius: '50%',
      }}
    />
  );
}
