import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ═══════════════════════════════════════════════════════════════
// SECTOR DEFINITIONS
// ═══════════════════════════════════════════════════════════════
const SECTORS = [
  { id: 0,  sign: "Widder",      en: "Aries",       domain: "Impuls",        color: "#E63946" },
  { id: 1,  sign: "Stier",       en: "Taurus",      domain: "Sinnlichkeit",  color: "#C9A227" },
  { id: 2,  sign: "Zwillinge",   en: "Gemini",      domain: "Kognition",     color: "#E9C46A" },
  { id: 3,  sign: "Krebs",       en: "Cancer",      domain: "Emotion",       color: "#A8DADC" },
  { id: 4,  sign: "Löwe",        en: "Leo",         domain: "Ausdruck",      color: "#F4A261" },
  { id: 5,  sign: "Jungfrau",    en: "Virgo",       domain: "Analyse",       color: "#6B9080" },
  { id: 6,  sign: "Waage",       en: "Libra",       domain: "Harmonie",      color: "#D4A5A5" },
  { id: 7,  sign: "Skorpion",    en: "Scorpio",     domain: "Tiefe",         color: "#9B2335" },
  { id: 8,  sign: "Schütze",     en: "Sagittarius", domain: "Freiheit",      color: "#7B2D8E" },
  { id: 9,  sign: "Steinbock",   en: "Capricorn",   domain: "Struktur",      color: "#2B2D42" },
  { id: 10, sign: "Wassermann",  en: "Aquarius",    domain: "Kollektiv",     color: "#00B4D8" },
  { id: 11, sign: "Fische",      en: "Pisces",      domain: "Intuition",     color: "#48BFE3" },
];

// ═══════════════════════════════════════════════════════════════
// SIMULATED PLANETARY TRANSITS OVER 30 DAYS
// Each planet influences specific sectors as it moves
// ═══════════════════════════════════════════════════════════════
const PLANETS = [
  { name: "Mars",    symbol: "♂", speed: 1.0,  strength: 0.18, sectors: [0, 7, 4] },
  { name: "Venus",   symbol: "♀", speed: 0.8,  strength: 0.14, sectors: [1, 6, 3] },
  { name: "Merkur",  symbol: "☿", speed: 1.6,  strength: 0.10, sectors: [2, 5, 8] },
  { name: "Jupiter", symbol: "♃", speed: 0.15, strength: 0.12, sectors: [8, 4, 11] },
  { name: "Saturn",  symbol: "♄", speed: 0.08, strength: 0.15, sectors: [9, 5, 10] },
  { name: "Mond",    symbol: "☽", speed: 13.0, strength: 0.08, sectors: [3, 11, 1] },
];

function generateTransitTimeline(days) {
  // Generate daily transit influences for each sector over N days
  const timeline = [];
  for (let d = 0; d < days; d++) {
    const signals = new Array(12).fill(0);
    const activeTransits = [];

    for (const planet of PLANETS) {
      // Planet position moves through sectors over time
      const pos = (d * planet.speed * (360 / 365)) % 360;
      const primarySector = Math.floor((pos / 360) * 12) % 12;

      // Planet influences its current sector and adjacent ones
      const influence = planet.strength * (0.7 + 0.3 * Math.sin(d * 0.2 + planet.speed));
      signals[primarySector] += influence;
      signals[(primarySector + 1) % 12] += influence * 0.4;
      signals[(primarySector + 11) % 12] += influence * 0.3;

      // Aspect-based resonance with natal sectors
      for (const natal of planet.sectors) {
        const dist = Math.abs(primarySector - natal);
        if (dist === 0) signals[natal] += influence * 0.5; // Conjunction
        else if (dist === 6) signals[natal] += influence * 0.35; // Opposition
        else if (dist === 4 || dist === 8) signals[natal] += influence * 0.25; // Trine
        else if (dist === 3 || dist === 9) signals[natal] += influence * 0.15; // Square
      }

      if (influence > 0.05) {
        activeTransits.push({
          planet: planet.name,
          symbol: planet.symbol,
          sector: primarySector,
          strength: influence,
        });
      }
    }

    // Normalize
    const maxS = Math.max(...signals, 0.01);
    const normalized = signals.map(s => Math.min(s / maxS, 1));

    timeline.push({
      day: d,
      signals: normalized,
      transits: activeTransits.sort((a, b) => b.strength - a.strength).slice(0, 3),
    });
  }
  return timeline;
}

// ═══════════════════════════════════════════════════════════════
// BASE PROFILE — Die Flamme
// ═══════════════════════════════════════════════════════════════
const BASE_PROFILE = {
  name: "Die Flamme",
  description: "Physical Touch · Sinnlichkeit · Hingabe",
  base: [0.08, 0.53, 0.00, 0.15, 0.17, 0.00, 0.13, 1.00, 0.00, 0.00, 0.07, 0.55],
};

// ═══════════════════════════════════════════════════════════════
// MATH
// ═══════════════════════════════════════════════════════════════
function smoothInterpolate(values, angle) {
  const n = values.length;
  const sector = (angle / (Math.PI * 2)) * n;
  const i = Math.floor(sector) % n;
  const j = (i + 1) % n;
  const t = sector - Math.floor(sector);
  const s = t * t * (3 - 2 * t);
  return values[((i % n) + n) % n] * (1 - s) + values[((j % n) + n) % n] * s;
}

function lerp(a, b, t) { return a + (b - a) * t; }

function lerpColor(c1, c2, t) {
  const r1 = parseInt(c1.slice(1,3), 16), g1 = parseInt(c1.slice(3,5), 16), b1 = parseInt(c1.slice(5,7), 16);
  const r2 = parseInt(c2.slice(1,3), 16), g2 = parseInt(c2.slice(3,5), 16), b2 = parseInt(c2.slice(5,7), 16);
  return `rgb(${Math.round(lerp(r1, r2, t))},${Math.round(lerp(g1, g2, t))},${Math.round(lerp(b1, b2, t))})`;
}

function getColorAtAngle(angle) {
  const n = SECTORS.length;
  const sector = ((angle / (Math.PI * 2)) * n + n) % n;
  const i = Math.floor(sector) % n;
  const j = (i + 1) % n;
  const t = sector - Math.floor(sector);
  return lerpColor(SECTORS[i].color, SECTORS[j].color, t);
}

function colorToRgb(hex) {
  return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
}

// ═══════════════════════════════════════════════════════════════
// RING RENDERER
// ═══════════════════════════════════════════════════════════════
function drawRing(ctx, w, h, baseSignals, transitSignals, transitBlend, time) {
  const cx = w / 2;
  const cy = h / 2;
  const baseRadius = Math.min(w, h) * 0.28;
  const maxDeform = baseRadius * 0.38;
  const ringWidth = Math.min(w, h) * 0.022;

  ctx.clearRect(0, 0, w, h);

  // Background
  const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.7);
  bgGrad.addColorStop(0, "#0a0a1a");
  bgGrad.addColorStop(0.5, "#060612");
  bgGrad.addColorStop(1, "#020208");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Stars
  for (let i = 0; i < 60; i++) {
    const sx = (Math.sin(i * 127.1 + 42) * 0.5 + 0.5) * w;
    const sy = (Math.cos(i * 311.7 + 42) * 0.5 + 0.5) * h;
    const dist = Math.sqrt((sx - cx) ** 2 + (sy - cy) ** 2);
    if (dist < baseRadius * 0.5 || dist > baseRadius * 2.5) {
      ctx.fillStyle = `rgba(180,200,255,${0.1 + 0.1 * Math.sin(time * 0.3 + i)})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 0.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Combined signals: base + transit influence
  const combined = baseSignals.map((b, i) => {
    const t = transitSignals[i] * transitBlend * 0.35; // Transit max 35% influence
    return Math.min(b + t, 1.2);
  });

  // Previous frame ghost (the transit-change area)
  const baseOnly = [...baseSignals];

  const steps = 600;
  const outerPts = [];
  const innerPts = [];
  const basePts = [];

  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2 - Math.PI / 2;
    const normAngle = ((angle + Math.PI / 2) + Math.PI * 2) % (Math.PI * 2);
    const signal = smoothInterpolate(combined, normAngle);
    const baseSignal = smoothInterpolate(baseOnly, normAngle);

    const pulse = 1 + 0.012 * Math.sin(time * 1.2 + angle * 3) * (0.3 + signal * 0.7);
    const micro = 1 + 0.004 * Math.sin(time * 3.7 + angle * 7);

    const deform = signal * maxDeform * pulse * micro;
    const baseDeform = baseSignal * maxDeform;
    const r = baseRadius + deform;
    const rInner = r - ringWidth * (0.5 + signal * 0.7);
    const rBase = baseRadius + baseDeform;

    outerPts.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r, r, angle, signal, normAngle });
    innerPts.push({ x: cx + Math.cos(angle) * rInner, y: cy + Math.sin(angle) * rInner });
    basePts.push({ x: cx + Math.cos(angle) * rBase, y: cy + Math.sin(angle) * rBase, r: rBase });
  }

  // ── Transit change zone (difference between base and combined) ──
  if (transitBlend > 0.01) {
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      if (i === 0) ctx.moveTo(outerPts[i].x, outerPts[i].y);
      else ctx.lineTo(outerPts[i].x, outerPts[i].y);
    }
    for (let i = steps; i >= 0; i--) {
      ctx.lineTo(basePts[i].x, basePts[i].y);
    }
    ctx.closePath();
    ctx.fillStyle = `rgba(255,255,255,${0.03 * transitBlend})`;
    ctx.fill();
  }

  // ── Glow around peaks ──
  for (let i = 0; i < steps; i += 3) {
    const p = outerPts[i];
    if (p.signal > 0.25) {
      const glowR = ringWidth * 2 + p.signal * ringWidth * 5;
      const alpha = p.signal * 0.1 * (0.7 + 0.3 * Math.sin(time * 1.5 + p.angle * 2));
      const color = getColorAtAngle(p.normAngle);
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
      const m = color.match(/\d+/g);
      if (m) {
        glow.addColorStop(0, `rgba(${m[0]},${m[1]},${m[2]},${alpha})`);
        glow.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // ── Korona strands ──
  for (let s = 0; s < 12; s++) {
    const val = combined[s];
    if (val < 0.2) continue;
    const sectorAngle = (s / 12) * Math.PI * 2;
    const strandCount = Math.floor(val * 7) + 2;
    const [cr, cg, cb] = colorToRgb(SECTORS[s].color);

    for (let j = 0; j < strandCount; j++) {
      const spread = (j / strandCount - 0.5) * 0.3;
      const a = sectorAngle + spread - Math.PI / 2;
      const r0 = baseRadius + val * maxDeform;
      const len = val * maxDeform * (0.3 + 0.5 * Math.sin(time * 2 + j * 1.3 + s));

      const x0 = cx + Math.cos(a) * r0;
      const y0 = cy + Math.sin(a) * r0;
      const wiggle = (j - strandCount / 2) * 0.02;
      const x1 = cx + Math.cos(a + wiggle) * (r0 + len);
      const y1 = cy + Math.sin(a + wiggle) * (r0 + len);

      const alpha = val * 0.45 * (0.4 + 0.6 * Math.sin(time * 1.8 + j + s * 0.7));
      ctx.strokeStyle = `rgba(${cr},${cg},${cb},${alpha})`;
      ctx.lineWidth = 0.8 + val * 1.2;
      ctx.beginPath();
      const cpx = (x0 + x1) / 2 + Math.sin(time + j) * val * 6;
      const cpy = (y0 + y1) / 2 + Math.cos(time + j) * val * 6;
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(cpx, cpy, x1, y1);
      ctx.stroke();
    }
  }

  // ── Main ring ──
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    if (i === 0) ctx.moveTo(outerPts[i].x, outerPts[i].y);
    else ctx.lineTo(outerPts[i].x, outerPts[i].y);
  }
  for (let i = steps; i >= 0; i--) {
    ctx.lineTo(innerPts[i].x, innerPts[i].y);
  }
  ctx.closePath();
  ctx.save();
  ctx.clip();

  for (let i = 0; i < steps; i++) {
    const p = outerPts[i];
    const pN = outerPts[i + 1] || outerPts[0];
    const pi = innerPts[i];
    const piN = innerPts[i + 1] || innerPts[0];
    const color = getColorAtAngle(p.normAngle);
    const brightness = 0.35 + p.signal * 0.65;
    const m = color.match(/\d+/g);
    if (m) {
      ctx.fillStyle = `rgb(${Math.round(m[0]*brightness)},${Math.round(m[1]*brightness)},${Math.round(m[2]*brightness)})`;
    }
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(pN.x, pN.y);
    ctx.lineTo(piN.x, piN.y);
    ctx.lineTo(pi.x, pi.y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Edge
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    if (i === 0) ctx.moveTo(outerPts[i].x, outerPts[i].y);
    else ctx.lineTo(outerPts[i].x, outerPts[i].y);
  }
  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // ── Base ring ghost line (shows soulprint underneath) ──
  if (transitBlend > 0.05) {
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      if (i === 0) ctx.moveTo(basePts[i].x, basePts[i].y);
      else ctx.lineTo(basePts[i].x, basePts[i].y);
    }
    ctx.strokeStyle = `rgba(255,255,255,${0.06 * transitBlend})`;
    ctx.lineWidth = 0.5;
    ctx.setLineDash([2, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // ── Center sun ──
  const sunR = baseRadius * 0.06;
  const sunGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, sunR * 5);
  sunGlow.addColorStop(0, "rgba(255,240,200,0.12)");
  sunGlow.addColorStop(0.3, "rgba(255,220,150,0.04)");
  sunGlow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = sunGlow;
  ctx.beginPath();
  ctx.arc(cx, cy, sunR * 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgba(255,245,220,${0.2 + 0.1 * Math.sin(time * 0.5)})`;
  ctx.beginPath();
  ctx.arc(cx, cy, sunR, 0, Math.PI * 2);
  ctx.fill();

  // ── Sector labels for top peaks ──
  const sorted = combined.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v);
  const topPeaks = sorted.filter(s => s.v > 0.15).slice(0, 5);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let s = 0; s < 12; s++) {
    const a = (s / 12) * Math.PI * 2 - Math.PI / 2;
    const isTop = topPeaks.some(t => t.i === s);
    if (isTop) {
      const r = baseRadius + combined[s] * maxDeform + ringWidth * 3 + combined[s] * ringWidth * 2;
      const lx = cx + Math.cos(a) * r;
      const ly = cy + Math.sin(a) * r;
      const fs = Math.round(Math.min(w, h) * (0.018 + combined[s] * 0.01));
      ctx.font = `500 ${fs}px -apple-system, sans-serif`;
      ctx.fillStyle = SECTORS[s].color;
      ctx.globalAlpha = 0.5 + combined[s] * 0.5;
      ctx.fillText(SECTORS[s].sign, lx, ly - fs * 0.5);
      ctx.font = `300 ${Math.round(fs * 0.65)}px -apple-system, sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.fillText(SECTORS[s].domain, lx, ly + fs * 0.35);
      ctx.globalAlpha = 1;
    } else {
      const r = baseRadius - ringWidth * 2.5;
      const lx = cx + Math.cos(a) * r;
      const ly = cy + Math.sin(a) * r;
      ctx.font = `${Math.round(Math.min(w, h) * 0.013)}px -apple-system, sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      ctx.fillText(SECTORS[s].sign, lx, ly);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// TIMELINE SPARKLINE COMPONENT
// ═══════════════════════════════════════════════════════════════
function TimelineSparkline({ timeline, currentDay, width, height }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Draw energy accumulation per day as stacked area
    const days = timeline.length;
    const barW = width / days;

    // Total energy per day
    for (let d = 0; d < days; d++) {
      const total = timeline[d].signals.reduce((a, b) => a + b, 0) / 12;
      const x = d * barW;
      const h = total * height * 0.8;

      // Color = dominant sector color
      const maxS = Math.max(...timeline[d].signals);
      const maxI = timeline[d].signals.indexOf(maxS);
      const [r, g, b] = colorToRgb(SECTORS[maxI].color);

      const isCurrent = d === currentDay;
      const alpha = isCurrent ? 0.9 : (d < currentDay ? 0.4 : 0.15);

      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.fillRect(x, height - h, barW - 0.5, h);
    }

    // Current day marker
    const cx = currentDay * barW + barW / 2;
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.fillRect(cx - 0.5, 0, 1, height);

  }, [timeline, currentDay, width, height]);

  return <canvas ref={canvasRef} style={{ width, height, display: "block" }} />;
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function FusionRingTimeline() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const [currentDay, setCurrentDay] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRange, setTimeRange] = useState(30); // 7, 14, 30
  const [speed, setSpeed] = useState(1);
  const playRef = useRef(null);
  const lastTickRef = useRef(0);

  const timeline = useMemo(() => generateTransitTimeline(timeRange), [timeRange]);

  // Accumulated transit: blend current day's transits into ring
  const currentTransit = timeline[currentDay]?.signals || new Array(12).fill(0);
  const currentTransits = timeline[currentDay]?.transits || [];

  // Auto-play
  useEffect(() => {
    if (!isPlaying) {
      if (playRef.current) clearInterval(playRef.current);
      return;
    }
    const interval = Math.max(60, 400 / speed);
    playRef.current = setInterval(() => {
      setCurrentDay(d => {
        if (d >= timeRange - 1) {
          setIsPlaying(false);
          return d;
        }
        return d + 1;
      });
    }, interval);
    return () => clearInterval(playRef.current);
  }, [isPlaying, speed, timeRange]);

  // Canvas animation
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const time = performance.now() / 1000;
    drawRing(ctx, rect.width, rect.height, BASE_PROFILE.base, currentTransit, 1.0, time);
    animRef.current = requestAnimationFrame(animate);
  }, [currentTransit]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [animate]);

  // Date label
  const startDate = new Date(2026, 2, 8); // March 8 2026
  const currentDate = new Date(startDate);
  currentDate.setDate(startDate.getDate() + currentDay);
  const dateStr = currentDate.toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" });

  // Dominant shift description
  const baseMax = Math.max(...BASE_PROFILE.base);
  const baseMaxI = BASE_PROFILE.base.indexOf(baseMax);
  const transitMax = Math.max(...currentTransit);
  const transitMaxI = currentTransit.indexOf(transitMax);

  return (
    <div style={{
      width: "100%",
      height: "100vh",
      background: "#020208",
      display: "flex",
      flexDirection: "column",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      color: "white",
      overflow: "hidden",
      position: "relative",
    }}>
      {/* Ring canvas */}
      <canvas
        ref={canvasRef}
        style={{ flex: 1, width: "100%", display: "block" }}
      />

      {/* Top overlay */}
      <div style={{
        position: "absolute",
        top: 16,
        left: 20,
        right: 20,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        pointerEvents: "none",
      }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: 3 }}>
            Fusion Ring · Transit-Verlauf
          </div>
          <div style={{ fontSize: 24, fontWeight: 200, color: "rgba(255,255,255,0.85)" }}>
            {BASE_PROFILE.name}
          </div>
          <div style={{ fontSize: 12, fontWeight: 300, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
            {BASE_PROFILE.description}
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 22, fontWeight: 200, color: "rgba(255,255,255,0.7)" }}>
            {dateStr}
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>
            Tag {currentDay + 1} / {timeRange}
          </div>
        </div>
      </div>

      {/* Active transits */}
      <div style={{
        position: "absolute",
        top: 80,
        right: 20,
        pointerEvents: "none",
      }}>
        {currentTransits.map((t, i) => (
          <div key={i} style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 4,
            opacity: 0.3 + t.strength * 3,
          }}>
            <span style={{ fontSize: 16, color: SECTORS[t.sector].color }}>{t.symbol}</span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>{t.planet}</span>
            <span style={{ fontSize: 10, color: SECTORS[t.sector].color }}>→ {SECTORS[t.sector].sign}</span>
          </div>
        ))}
      </div>

      {/* Bottom controls */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: "12px 20px 16px",
        background: "linear-gradient(transparent, rgba(2,2,8,0.97))",
      }}>
        {/* Sparkline timeline */}
        <div style={{ marginBottom: 8, borderRadius: 4, overflow: "hidden", background: "rgba(255,255,255,0.03)", padding: "4px 0" }}>
          <TimelineSparkline timeline={timeline} currentDay={currentDay} width={360} height={32} />
        </div>

        {/* Scrubber */}
        <div style={{ marginBottom: 10 }}>
          <input
            type="range"
            min={0}
            max={timeRange - 1}
            value={currentDay}
            onChange={(e) => { setCurrentDay(parseInt(e.target.value)); setIsPlaying(false); }}
            style={{
              width: "100%",
              height: 4,
              appearance: "none",
              background: "rgba(255,255,255,0.1)",
              borderRadius: 2,
              outline: "none",
              cursor: "pointer",
              accentColor: "#9B2335",
            }}
          />
        </div>

        {/* Controls row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Play/Pause */}
          <button
            onClick={() => {
              if (currentDay >= timeRange - 1) setCurrentDay(0);
              setIsPlaying(!isPlaying);
            }}
            style={{
              width: 36, height: 36,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.2)",
              background: isPlaying ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)",
              color: "white",
              fontSize: 14,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isPlaying ? "⏸" : "▶"}
          </button>

          {/* Speed */}
          <div style={{ display: "flex", gap: 4 }}>
            {[0.5, 1, 2, 4].map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                style={{
                  padding: "3px 8px",
                  borderRadius: 10,
                  border: speed === s ? "1px solid rgba(255,255,255,0.25)" : "1px solid rgba(255,255,255,0.06)",
                  background: speed === s ? "rgba(255,255,255,0.08)" : "transparent",
                  color: speed === s ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.25)",
                  fontSize: 10,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Time range */}
          <div style={{ display: "flex", gap: 4, marginLeft: 8 }}>
            {[7, 14, 30].map(r => (
              <button
                key={r}
                onClick={() => { setTimeRange(r); setCurrentDay(0); setIsPlaying(false); }}
                style={{
                  padding: "3px 10px",
                  borderRadius: 10,
                  border: timeRange === r ? "1px solid rgba(255,255,255,0.25)" : "1px solid rgba(255,255,255,0.06)",
                  background: timeRange === r ? "rgba(255,255,255,0.08)" : "transparent",
                  color: timeRange === r ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.25)",
                  fontSize: 10,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {r}T
              </button>
            ))}
          </div>

          <div style={{ marginLeft: "auto", fontSize: 9, color: "rgba(255,255,255,0.12)", letterSpacing: "0.1em" }}>
            BAZODIAC · TRANSIT TIMELINE v0.1
          </div>
        </div>
      </div>
    </div>
  );
}
