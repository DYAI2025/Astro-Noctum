// ─────────────────────────────────────────────────────────────
// Shared canvas drawing utilities for the Fusion Ring.
// Used by FusionRing.tsx (static/animated ring) and
// FusionRingTimeline.tsx (transit timeline view).
// ─────────────────────────────────────────────────────────────

// ── Archetypal sector palette ─────────────────────────────────

/** Archetypal colors — one per zodiac sign (Aries=0 … Pisces=11). */
export const SECTOR_ARCHETYPAL_COLORS: string[] = [
  '#E63946', // 0  Widder     — Marsrot
  '#C9A227', // 1  Stier      — Erdgold
  '#E9C46A', // 2  Zwillinge  — Sonnengold
  '#A8DADC', // 3  Krebs      — Mondaquamarin
  '#F4A261', // 4  Löwe       — Bernstein
  '#6B9080', // 5  Jungfrau   — Salbeigrün
  '#D4A5A5', // 6  Waage      — Rosenquarz
  '#9B2335', // 7  Skorpion   — Tiefrot
  '#7B2D8E', // 8  Schütze    — Violett
  '#2B2D42', // 9  Steinbock  — Mitternachtsblau
  '#00B4D8', // 10 Wassermann — Cyanblau
  '#48BFE3', // 11 Fische     — Hellblau
];

/** Glow/highlight variants (brighter, more saturated). */
export const ARCHETYPAL_GLOW_COLORS: string[] = [
  '#FF6B7A', // 0  Widder
  '#FFD700', // 1  Stier
  '#FFE88A', // 2  Zwillinge
  '#C4EAEC', // 3  Krebs
  '#FFB27E', // 4  Löwe
  '#8DB0A0', // 5  Jungfrau
  '#EDB8B8', // 6  Waage
  '#C93350', // 7  Skorpion
  '#9B3DAE', // 8  Schütze
  '#3D3F5C', // 9  Steinbock
  '#33D4F0', // 10 Wassermann
  '#6AD0F5', // 11 Fische
];

/** Domain keyword per sector (label inside ring at low intensity). */
export const SECTOR_DOMAINS: string[] = [
  'Antrieb',       // 0  Widder
  'Beständigkeit', // 1  Stier
  'Kommunikation', // 2  Zwillinge
  'Gefühl',        // 3  Krebs
  'Ausdruck',      // 4  Löwe
  'Ordnung',       // 5  Jungfrau
  'Ausgleich',     // 6  Waage
  'Tiefe',         // 7  Skorpion
  'Weisheit',      // 8  Schütze
  'Struktur',      // 9  Steinbock
  'Vision',        // 10 Wassermann
  'Wandel',        // 11 Fische
];

const ZODIAC_SYMBOLS: string[] = [
  '♈', '♉', '♊', '♋', '♌', '♍',
  '♎', '♏', '♐', '♑', '♒', '♓',
];

// ── Options ───────────────────────────────────────────────────

export type DrawFusionRingOptions = {
  /** 12 normalized [0..1] transit sector influences. */
  transitSignals?: number[];
  /** How strongly transit overlay blends in (0..1). */
  transitBlend?: number;
  /** Seconds — drives breathing + korona animation. */
  time?: number;
  /** Draw deep space background + star dust. */
  withBackground?: boolean;
  /** Draw sector labels (sign / domain / %). */
  showLabels?: boolean;
  /** Draw energy filaments at peak sectors. */
  showKorona?: boolean;
  /** Draw tension/opposition dashed line between strongest opposing peaks. */
  showTension?: boolean;
};

// ── Color helpers ─────────────────────────────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const c = hex.replace('#', '');
  return {
    r: parseInt(c.substring(0, 2), 16),
    g: parseInt(c.substring(2, 4), 16),
    b: parseInt(c.substring(4, 6), 16),
  };
}

function lerpColor(a: string, b: string, t: number): string {
  const ca = hexToRgb(a);
  const cb = hexToRgb(b);
  const r = Math.round(ca.r + (cb.r - ca.r) * t);
  const g = Math.round(ca.g + (cb.g - ca.g) * t);
  const bv = Math.round(ca.b + (cb.b - ca.b) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bv.toString(16).padStart(2, '0')}`;
}

// ── Signal interpolation ──────────────────────────────────────

/**
 * Cubic smooth-step interpolation across 12 signal values.
 * @param signals 12 values [0..1]
 * @param angle   radians in [0, 2π] where 0 = Aries (top)
 */
export function smoothInterpolate(signals: number[], angle: number): number {
  const normalized = ((angle / (Math.PI * 2)) * 12 + 12) % 12;
  const left = Math.floor(normalized) % 12;
  const right = (left + 1) % 12;
  const t = normalized - Math.floor(normalized);
  const smooth = t * t * (3 - 2 * t);
  return signals[left] * (1 - smooth) + signals[right] * smooth;
}

function colorAtAngle(signals: number[], angle: number): string {
  const normalized = ((angle / (Math.PI * 2)) * 12 + 12) % 12;
  const left = Math.floor(normalized) % 12;
  const right = (left + 1) % 12;
  const t = normalized - Math.floor(normalized);
  const smooth = t * t * (3 - 2 * t);
  const base = lerpColor(SECTOR_ARCHETYPAL_COLORS[left], SECTOR_ARCHETYPAL_COLORS[right], smooth);
  const glow = lerpColor(ARCHETYPAL_GLOW_COLORS[left], ARCHETYPAL_GLOW_COLORS[right], smooth);
  const signal = signals[left] * (1 - smooth) + signals[right] * smooth;
  return lerpColor(base, glow, signal * 0.6);
}

// ── Sub-draw routines ─────────────────────────────────────────

function drawBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  cx: number,
  cy: number,
  outerR: number,
): void {
  ctx.fillStyle = '#00050A';
  ctx.fillRect(0, 0, w, h);

  // Radial vignette
  const vig = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.7);
  vig.addColorStop(0, 'rgba(0,5,10,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  // Star dust — deterministic positions (no RNG so stable per frame)
  for (let i = 0; i < 120; i++) {
    const sx = ((i * 137.508 + 23) % w + w) % w;
    const sy = ((i * 97.3 + 71) % h + h) % h;
    const sr = 0.5 + (i % 3) * 0.4;
    const sa = 0.15 + (i % 5) * 0.1;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200,220,255,${sa})`;
    ctx.fill();
  }

  // Ambient ring glow
  const rg = ctx.createRadialGradient(cx, cy, outerR * 0.5, cx, cy, outerR * 1.4);
  rg.addColorStop(0, 'rgba(30,20,60,0)');
  rg.addColorStop(0.5, 'rgba(30,20,60,0.08)');
  rg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, w, h);
}

function drawCenterSun(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  innerR: number,
  time: number,
): void {
  const pulse = 1 + 0.04 * Math.sin(time * 0.8);
  const sunR = innerR * 0.35 * pulse;

  const sunGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, sunR * 2.5);
  sunGlow.addColorStop(0, 'rgba(255,240,180,0.9)');
  sunGlow.addColorStop(0.3, 'rgba(255,200,80,0.4)');
  sunGlow.addColorStop(0.7, 'rgba(200,140,40,0.1)');
  sunGlow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.beginPath();
  ctx.arc(cx, cy, sunR * 2.5, 0, Math.PI * 2);
  ctx.fillStyle = sunGlow;
  ctx.fill();

  const sunCore = ctx.createRadialGradient(cx, cy, 0, cx, cy, sunR);
  sunCore.addColorStop(0, '#FFFDE7');
  sunCore.addColorStop(0.6, '#FFD54F');
  sunCore.addColorStop(1, 'rgba(255,180,50,0)');
  ctx.beginPath();
  ctx.arc(cx, cy, sunR, 0, Math.PI * 2);
  ctx.fillStyle = sunCore;
  ctx.fill();
}

function drawKoronaStrands(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerR: number,
  signals: number[],
  time: number,
): void {
  const steps = 720;
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2 - Math.PI / 2;
    const val = smoothInterpolate(signals, angle + Math.PI / 2);
    if (val < 0.4) continue;

    const strandCount = Math.floor(val * 7) + 2;
    const sectorIdx = Math.floor(((angle + Math.PI / 2) / (Math.PI * 2)) * 12 + 12) % 12;
    const { r, g, b } = hexToRgb(ARCHETYPAL_GLOW_COLORS[sectorIdx]);

    for (let s = 0; s < strandCount; s++) {
      const seed = i * 13 + s * 7;
      const spread = ((seed % 30) - 15) * (Math.PI / 180);
      const sa = angle + spread;
      const len = outerR * (0.15 + val * 0.25 + (seed % 10) * 0.01);
      const wave = Math.sin(time * 2.5 + seed * 0.3) * 0.08;

      const x0 = cx + Math.cos(sa) * outerR;
      const y0 = cy + Math.sin(sa) * outerR;
      const ctrlX = cx + Math.cos(sa + wave) * (outerR + len * 0.5);
      const ctrlY = cy + Math.sin(sa + wave) * (outerR + len * 0.5);
      const x1 = cx + Math.cos(sa + wave * 0.5) * (outerR + len);
      const y1 = cy + Math.sin(sa + wave * 0.5) * (outerR + len);

      const grad = ctx.createLinearGradient(x0, y0, x1, y1);
      grad.addColorStop(0, `rgba(${r},${g},${b},${0.6 * val})`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);

      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(ctrlX, ctrlY, x1, y1);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 0.5 + val * 0.8;
      ctx.stroke();
    }
  }
}

function drawTensionLines(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  signals: number[],
): void {
  const peakIdx = signals.indexOf(Math.max(...signals));
  const peakVal = signals[peakIdx];
  if (peakVal < 0.5) return;

  const oppIdx = (peakIdx + 6) % 12;
  const oppVal = signals[oppIdx];
  if (oppVal < 0.2) return;

  const peakAngle = (peakIdx / 12) * Math.PI * 2 - Math.PI / 2;
  const oppAngle = (oppIdx / 12) * Math.PI * 2 - Math.PI / 2;
  const peakR = innerR + (outerR - innerR) * (0.3 + peakVal * 0.7);
  const oppR = innerR + (outerR - innerR) * (0.3 + oppVal * 0.7);

  ctx.save();
  ctx.setLineDash([4, 6]);
  ctx.strokeStyle = `rgba(255,220,100,${0.15 + peakVal * 0.2})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx + Math.cos(peakAngle) * peakR, cy + Math.sin(peakAngle) * peakR);
  ctx.lineTo(cx + Math.cos(oppAngle) * oppR, cy + Math.sin(oppAngle) * oppR);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawSectorLabels(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  signals: number[],
): void {
  const peakIndices = signals
    .map((v, i) => ({ v, i }))
    .filter(({ v }) => v >= 0.55)
    .sort((a, b) => b.v - a.v)
    .slice(0, 4)
    .map(({ i }) => i);

  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 - Math.PI / 2 + Math.PI / 12;
    const val = signals[i];
    const isPeak = peakIndices.includes(i);
    const labelR = isPeak ? outerR * 1.13 : outerR * 0.68;
    const x = cx + Math.cos(angle) * labelR;
    const y = cy + Math.sin(angle) * labelR;

    ctx.save();
    ctx.translate(x, y);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (isPeak) {
      const fs = Math.max(10, outerR * 0.09);
      ctx.font = `bold ${fs}px 'Sora', sans-serif`;
      ctx.fillStyle = SECTOR_ARCHETYPAL_COLORS[i];
      ctx.fillText(ZODIAC_SYMBOLS[i], 0, -fs * 0.9);

      ctx.font = `${fs * 0.75}px 'Sora', sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fillText(SECTOR_DOMAINS[i], 0, fs * 0.3);

      ctx.font = `${fs * 0.7}px 'Sora', sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText(`${Math.round(val * 100)}%`, 0, fs * 1.3);
    } else {
      const fs = Math.max(8, outerR * 0.07);
      ctx.font = `${fs}px 'Sora', sans-serif`;
      ctx.fillStyle = `rgba(255,255,255,${0.1 + val * 0.2})`;
      ctx.fillText(SECTOR_DOMAINS[i], 0, 0);
    }

    ctx.restore();
  }
}

// ── Main export ───────────────────────────────────────────────

/**
 * Draw the Fusion Ring onto `ctx`.
 *
 * @param ctx     2D rendering context
 * @param w       canvas pixel width
 * @param h       canvas pixel height
 * @param signals 12 normalized [0..1] sector values (fused soulprint)
 * @param opts    optional visual overrides
 */
export function drawFusionRing(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  signals: number[],
  opts: DrawFusionRingOptions = {},
): void {
  const {
    transitSignals,
    transitBlend = 0,
    time = 0,
    withBackground = true,
    showLabels = true,
    showKorona = true,
    showTension = true,
  } = opts;

  const cx = w / 2;
  const cy = h / 2;
  const minDim = Math.min(w, h);
  const innerR = minDim * 0.28;
  const outerR = minDim * 0.45;
  const STEPS = 720;

  // 1. Background / clear
  if (withBackground) {
    drawBackground(ctx, w, h, cx, cy, outerR);
  } else {
    ctx.clearRect(0, 0, w, h);
  }

  // 2. Build combined signal = soulprint + transit overlay
  const combined = signals.slice();
  if (transitSignals && transitBlend > 0) {
    for (let i = 0; i < 12; i++) {
      combined[i] = Math.min(1, signals[i] + transitSignals[i] * transitBlend * 0.35);
    }
  }

  // 3. Glow pass — same ring segments with shadowBlur
  ctx.save();
  ctx.shadowBlur = 18;
  for (let i = 0; i < STEPS; i++) {
    const angle = (i / STEPS) * Math.PI * 2 - Math.PI / 2;
    const nextAngle = ((i + 1) / STEPS) * Math.PI * 2 - Math.PI / 2;
    const val = smoothInterpolate(combined, angle + Math.PI / 2);
    const breathing = 1 + 0.012 * Math.sin(time * 1.2 + angle * 3) * (0.3 + val * 0.7);
    const micro = 1 + 0.004 * Math.sin(time * 3.7 + angle * 7);
    const r = (innerR + (outerR - innerR) * (0.3 + val * 0.7)) * breathing * micro;
    const color = colorAtAngle(combined, angle + Math.PI / 2);
    const { r: cr, g: cg, b: cb } = hexToRgb(color);

    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
    ctx.arc(cx, cy, r, angle, nextAngle);
    ctx.arc(cx, cy, innerR, nextAngle, angle, true);
    ctx.closePath();
    ctx.fillStyle = `rgba(${cr},${cg},${cb},${val * 0.3})`;
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.restore();

  // 4. Base ghost ring (dashed soulprint — visible when transit is active)
  if (transitBlend > 0.05 && transitSignals) {
    ctx.save();
    ctx.setLineDash([3, 5]);
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = Math.min(1, 0.25 * transitBlend);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    for (let i = 0; i <= STEPS; i++) {
      const angle = (i / STEPS) * Math.PI * 2 - Math.PI / 2;
      const val = smoothInterpolate(signals, angle + Math.PI / 2);
      const r = innerR + (outerR - innerR) * (0.3 + val * 0.7);
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // 5. Transit change zone fill (between soulprint and combined ring)
  if (transitBlend > 0 && transitSignals) {
    ctx.save();
    ctx.globalAlpha = 0.07 * transitBlend;
    ctx.beginPath();
    for (let i = 0; i <= STEPS; i++) {
      const angle = (i / STEPS) * Math.PI * 2 - Math.PI / 2;
      const val = smoothInterpolate(combined, angle + Math.PI / 2);
      const r = innerR + (outerR - innerR) * (0.3 + val * 0.7);
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    for (let i = STEPS; i >= 0; i--) {
      const angle = (i / STEPS) * Math.PI * 2 - Math.PI / 2;
      const val = smoothInterpolate(signals, angle + Math.PI / 2);
      const r = innerR + (outerR - innerR) * (0.3 + val * 0.7);
      ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(80,180,255,1)';
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // 6. Main ring fill
  for (let i = 0; i < STEPS; i++) {
    const angle = (i / STEPS) * Math.PI * 2 - Math.PI / 2;
    const nextAngle = ((i + 1) / STEPS) * Math.PI * 2 - Math.PI / 2;
    const val = smoothInterpolate(combined, angle + Math.PI / 2);
    const breathing = 1 + 0.012 * Math.sin(time * 1.2 + angle * 3) * (0.3 + val * 0.7);
    const micro = 1 + 0.004 * Math.sin(time * 3.7 + angle * 7);
    const r = (innerR + (outerR - innerR) * (0.3 + val * 0.7)) * breathing * micro;
    const color = colorAtAngle(combined, angle + Math.PI / 2);
    const { r: cr, g: cg, b: cb } = hexToRgb(color);

    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
    ctx.arc(cx, cy, r, angle, nextAngle);
    ctx.arc(cx, cy, innerR, nextAngle, angle, true);
    ctx.closePath();
    ctx.fillStyle = `rgba(${cr},${cg},${cb},${0.6 + val * 0.4})`;
    ctx.fill();
  }

  // 7. Korona strands
  if (showKorona) {
    drawKoronaStrands(ctx, cx, cy, outerR, combined, time);
  }

  // 8. Tension / opposition line
  if (showTension) {
    drawTensionLines(ctx, cx, cy, innerR, outerR, combined);
  }

  // 9. Center sun
  drawCenterSun(ctx, cx, cy, innerR, time);

  // 10. Sector labels
  if (showLabels) {
    drawSectorLabels(ctx, cx, cy, innerR, outerR, combined);
  }
}
