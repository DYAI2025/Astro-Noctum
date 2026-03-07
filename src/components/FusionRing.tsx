import { useRef, useEffect, useCallback } from 'react';
import type { FusionRingSignal } from '../lib/fusion-ring/signal';
import { powerCurve } from '../lib/fusion-ring/math';
import { SECTOR_GLOW_COLORS, lerpSectorColor } from '../lib/fusion-ring/colors';
import { SECTOR_COUNT, SECTORS } from '../lib/fusion-ring/constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FusionRingProps {
  signal: FusionRingSignal;
  size?: number;           // default 360
  showLabels?: boolean;
  animated?: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ZODIAC_SYMBOLS = [
  '\u2648', '\u2649', '\u264A', '\u264B', '\u264C', '\u264D',
  '\u264E', '\u264F', '\u2650', '\u2651', '\u2652', '\u2653',
];

const TWO_PI = Math.PI * 2;
const SECTOR_ARC = TWO_PI / SECTOR_COUNT;
const POINTS = 360; // one per degree for smooth interpolation
const ANGLE_STEP = TWO_PI / POINTS;

const MIN_SIZE = 280;
const MAX_SIZE = 480;

const DAMPING = 0.08;
const ANIMATION_THRESHOLD = 0.0005;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Compute the 12 target radii from signal values. */
function computeTargetRadii(
  sectors: number[],
  baseRadius: number,
): number[] {
  const radii: number[] = [];
  for (let s = 0; s < SECTOR_COUNT; s++) {
    const sig = sectors[s] ?? 0;
    const power = powerCurve(sig);
    const deviation =
      power >= 0
        ? power * baseRadius * 0.60
        : power * baseRadius * 0.25;
    radii.push(baseRadius + deviation);
  }
  return radii;
}

/** Get the interpolated outer radius at a given angle. */
function radiusAtAngle(angle: number, radii: number[]): number {
  // Normalize angle to [0, TWO_PI)
  const a = ((angle % TWO_PI) + TWO_PI) % TWO_PI;
  const sectorIdx = Math.floor(a / SECTOR_ARC) % SECTOR_COUNT;
  const nextIdx = (sectorIdx + 1) % SECTOR_COUNT;
  const t = (a - sectorIdx * SECTOR_ARC) / SECTOR_ARC;
  return lerp(radii[sectorIdx], radii[nextIdx], smoothstep(t));
}

/** Build the aria-label from peak sectors. */
function buildAriaLabel(signal: FusionRingSignal): string {
  const peaks = signal.peakSectors
    .map((idx) => {
      const sector = SECTORS[idx];
      const strength = Math.abs(signal.sectors[idx]);
      return `${sector.sign} (${(strength * 100).toFixed(0)}%)`;
    })
    .join(', ');
  return `Bazahuawa Fusion Ring. Peak sectors: ${peaks}. Resolution: ${signal.resolution}%.`;
}

// ---------------------------------------------------------------------------
// Hex color parsing for glow alpha manipulation
// ---------------------------------------------------------------------------

function hexToRGBA(hex: string, alpha: number): string {
  const clean = hex.startsWith('#') ? hex.slice(1) : hex;
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------

function drawRing(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  radii: number[],
  signal: FusionRingSignal,
  showLabels: boolean,
  dpr: number,
) {
  const cx = width / 2;
  const cy = height / 2;
  const halfSize = Math.min(cx, cy);
  const baseRadius = halfSize * 0.38;
  const innerFactor = 0.60; // inner edge is 60% of outer radius

  // Clear
  ctx.clearRect(0, 0, width, height);

  // ---- 1. Glow layer (drawn first, behind everything) ----
  ctx.save();
  for (const peakIdx of signal.peakSectors) {
    const strength = Math.abs(signal.sectors[peakIdx]);
    if (strength < 0.01) continue;

    const glowColor = SECTOR_GLOW_COLORS[peakIdx];
    const blurAmount = strength * 40 * (dpr > 1 ? 1 : 1);
    const alpha = Math.min(0.5, strength * 0.6);

    ctx.shadowColor = glowColor;
    ctx.shadowBlur = blurAmount;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw a glow arc at the peak sector position
    const startAngle = peakIdx * SECTOR_ARC - Math.PI / 2;
    const endAngle = startAngle + SECTOR_ARC;
    const peakOuterR = radiusAtAngle(startAngle + SECTOR_ARC / 2 + Math.PI / 2, radii);
    const peakInnerR = peakOuterR * innerFactor;
    const midR = (peakOuterR + peakInnerR) / 2;
    const bandWidth = (peakOuterR - peakInnerR) * 0.8;

    ctx.beginPath();
    ctx.arc(cx, cy, midR, startAngle, endAngle);
    ctx.lineWidth = bandWidth;
    ctx.strokeStyle = hexToRGBA(glowColor, alpha);
    ctx.stroke();
  }
  ctx.restore();

  // ---- 2. Filled ring shape (radial slices) ----
  // Draw thin wedge slices for smooth color blending
  ctx.save();
  for (let i = 0; i < POINTS; i++) {
    const angle = i * ANGLE_STEP;
    const nextAngle = (i + 1) * ANGLE_STEP;

    // Compute outer and inner radii at this angle
    const outerR = radiusAtAngle(angle, radii);
    const outerRNext = radiusAtAngle(nextAngle, radii);
    const innerR = outerR * innerFactor;
    const innerRNext = outerRNext * innerFactor;

    // Determine color at this angle via sector blending
    const sectorIdx = Math.floor(((angle % TWO_PI) + TWO_PI) % TWO_PI / SECTOR_ARC) % SECTOR_COUNT;
    const nextSectorIdx = (sectorIdx + 1) % SECTOR_COUNT;
    const t = (angle - sectorIdx * SECTOR_ARC) / SECTOR_ARC;
    const color = lerpSectorColor(sectorIdx, nextSectorIdx, smoothstep(t));

    // Draw angle is rotated -90deg so sector 0 (Aries) is at top
    const drawAngle = angle - Math.PI / 2;
    const drawAngleNext = nextAngle - Math.PI / 2;

    // Build wedge slice path
    ctx.beginPath();
    // Outer edge
    ctx.moveTo(
      cx + Math.cos(drawAngle) * outerR,
      cy + Math.sin(drawAngle) * outerR,
    );
    ctx.lineTo(
      cx + Math.cos(drawAngleNext) * outerRNext,
      cy + Math.sin(drawAngleNext) * outerRNext,
    );
    // Inner edge (reverse)
    ctx.lineTo(
      cx + Math.cos(drawAngleNext) * innerRNext,
      cy + Math.sin(drawAngleNext) * innerRNext,
    );
    ctx.lineTo(
      cx + Math.cos(drawAngle) * innerR,
      cy + Math.sin(drawAngle) * innerR,
    );
    ctx.closePath();

    ctx.fillStyle = color;
    ctx.globalAlpha = 0.85;
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;
  ctx.restore();

  // ---- 3. Base ring reference circle ----
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, baseRadius, 0, TWO_PI);
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  // ---- 4. Zodiac labels ----
  if (showLabels) {
    ctx.save();
    const fontSize = Math.max(10, Math.min(14, halfSize * 0.04));
    ctx.font = `${fontSize}px serif`;
    ctx.fillStyle = '#D4AF37';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let s = 0; s < SECTOR_COUNT; s++) {
      // Center of the sector arc, rotated -90deg
      const angle = s * SECTOR_ARC + SECTOR_ARC / 2;
      const drawAngle = angle - Math.PI / 2;

      // Place labels just outside the maximum possible outer radius
      const outerR = radiusAtAngle(angle, radii);
      const labelR = Math.max(outerR + fontSize * 1.2, baseRadius * 1.7);

      const lx = cx + Math.cos(drawAngle) * labelR;
      const ly = cy + Math.sin(drawAngle) * labelR;

      ctx.fillText(ZODIAC_SYMBOLS[s], lx, ly);
    }
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FusionRing({
  signal,
  size = 360,
  showLabels = false,
  animated = false,
  className,
}: FusionRingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafIdRef = useRef<number>(0);

  // Animation state kept in refs to avoid re-renders
  const animatedRadii = useRef<number[]>(new Array(SECTOR_COUNT).fill(0));
  const targetRadii = useRef<number[]>(new Array(SECTOR_COUNT).fill(0));
  const isAnimating = useRef(false);
  const signalRef = useRef(signal);
  const showLabelsRef = useRef(showLabels);

  signalRef.current = signal;
  showLabelsRef.current = showLabels;

  // Measure actual canvas dimensions and set up DPR scaling
  const configureCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return { width: 0, height: 0, dpr: 1 };

    const rect = container.getBoundingClientRect();
    let cssSize = Math.max(MIN_SIZE, Math.floor(rect.width));
    if (size != null) cssSize = Math.max(MIN_SIZE, Math.min(size, cssSize));
    cssSize = Math.min(cssSize, MAX_SIZE);

    const dpr = window.devicePixelRatio || 1;
    canvas.width = cssSize * dpr;
    canvas.height = cssSize * dpr;
    canvas.style.width = `${cssSize}px`;
    canvas.style.height = `${cssSize}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    return { width: cssSize, height: cssSize, dpr };
  }, [size]);

  // Compute base radius from current canvas logical size
  const getBaseRadius = useCallback((logicalSize: number) => {
    return (logicalSize / 2) * 0.38;
  }, []);

  // Static (non-animated) render
  const renderStatic = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { width, height, dpr } = configureCanvas();
    if (width === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const baseRadius = getBaseRadius(width);
    const radii = computeTargetRadii(signalRef.current.sectors, baseRadius);
    animatedRadii.current = [...radii];
    targetRadii.current = [...radii];

    drawRing(ctx, width, height, radii, signalRef.current, showLabelsRef.current, dpr);
  }, [configureCanvas, getBaseRadius]);

  // Animation loop
  const startAnimationLoop = useCallback(() => {
    if (isAnimating.current) return;
    isAnimating.current = true;

    const tick = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        isAnimating.current = false;
        return;
      }

      const { width, height, dpr } = configureCanvas();
      if (width === 0) {
        isAnimating.current = false;
        return;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        isAnimating.current = false;
        return;
      }

      // Dampen toward targets
      let stillMoving = false;
      for (let s = 0; s < SECTOR_COUNT; s++) {
        const diff = targetRadii.current[s] - animatedRadii.current[s];
        if (Math.abs(diff) > ANIMATION_THRESHOLD) {
          animatedRadii.current[s] += diff * DAMPING;
          stillMoving = true;
        } else {
          animatedRadii.current[s] = targetRadii.current[s];
        }
      }

      drawRing(
        ctx,
        width,
        height,
        animatedRadii.current,
        signalRef.current,
        showLabelsRef.current,
        dpr,
      );

      if (stillMoving) {
        rafIdRef.current = requestAnimationFrame(tick);
      } else {
        isAnimating.current = false;
      }
    };

    rafIdRef.current = requestAnimationFrame(tick);
  }, [configureCanvas]);

  // Update targets when signal changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    let cssSize = Math.max(MIN_SIZE, Math.floor(rect.width));
    if (size != null) cssSize = Math.max(MIN_SIZE, Math.min(size, cssSize));
    cssSize = Math.min(cssSize, MAX_SIZE);

    const baseRadius = getBaseRadius(cssSize);
    const newTargets = computeTargetRadii(signal.sectors, baseRadius);
    targetRadii.current = newTargets;

    if (animated) {
      startAnimationLoop();
    } else {
      renderStatic();
    }
  }, [signal, animated, size, getBaseRadius, renderStatic, startAnimationLoop]);

  // ResizeObserver for responsive sizing
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      if (animated) {
        // Recompute targets for new size, restart animation
        const rect = container.getBoundingClientRect();
        let cssSize = Math.max(MIN_SIZE, Math.floor(rect.width));
        if (size != null) cssSize = Math.max(MIN_SIZE, Math.min(size, cssSize));
        cssSize = Math.min(cssSize, MAX_SIZE);

        const baseRadius = getBaseRadius(cssSize);
        targetRadii.current = computeTargetRadii(signalRef.current.sectors, baseRadius);
        // Reset animated radii to force re-lerp from current visual state
        animatedRadii.current = computeTargetRadii(signalRef.current.sectors, baseRadius);
        startAnimationLoop();
      } else {
        renderStatic();
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [animated, size, getBaseRadius, renderStatic, startAnimationLoop]);

  // Cleanup rAF on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      isAnimating.current = false;
    };
  }, []);

  // Initial render
  useEffect(() => {
    // Initialize animated radii on mount
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    let cssSize = Math.max(MIN_SIZE, Math.floor(rect.width));
    if (size != null) cssSize = Math.max(MIN_SIZE, Math.min(size, cssSize));
    cssSize = Math.min(cssSize, MAX_SIZE);

    const baseRadius = getBaseRadius(cssSize);
    const initial = computeTargetRadii(signal.sectors, baseRadius);
    animatedRadii.current = [...initial];
    targetRadii.current = [...initial];

    if (animated) {
      startAnimationLoop();
    } else {
      renderStatic();
    }
    // Only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ariaLabel = buildAriaLabel(signal);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        aspectRatio: '1 / 1',
        maxWidth: size != null ? `${Math.min(size, MAX_SIZE)}px` : `${MAX_SIZE}px`,
        minWidth: `${MIN_SIZE}px`,
        width: '100%',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <canvas
        ref={canvasRef}
        aria-label={ariaLabel}
        role="img"
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
}
