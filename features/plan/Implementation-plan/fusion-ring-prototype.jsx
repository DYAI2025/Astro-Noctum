import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════
// SECTOR DEFINITIONS — Archetypal colors, not rainbow
// ═══════════════════════════════════════════════════════════════
const SECTORS = [
  { id: 0,  sign: "Widder",      en: "Aries",       domain: "Impuls",        color: "#E63946", glowColor: "rgba(230,57,70,0.6)" },
  { id: 1,  sign: "Stier",       en: "Taurus",      domain: "Sinnlichkeit",  color: "#C9A227", glowColor: "rgba(201,162,39,0.6)" },
  { id: 2,  sign: "Zwillinge",   en: "Gemini",      domain: "Kognition",     color: "#E9C46A", glowColor: "rgba(233,196,106,0.6)" },
  { id: 3,  sign: "Krebs",       en: "Cancer",      domain: "Emotion",       color: "#A8DADC", glowColor: "rgba(168,218,220,0.6)" },
  { id: 4,  sign: "Löwe",        en: "Leo",         domain: "Ausdruck",      color: "#F4A261", glowColor: "rgba(244,162,97,0.6)" },
  { id: 5,  sign: "Jungfrau",    en: "Virgo",       domain: "Analyse",       color: "#6B9080", glowColor: "rgba(107,144,128,0.6)" },
  { id: 6,  sign: "Waage",       en: "Libra",       domain: "Harmonie",      color: "#D4A5A5", glowColor: "rgba(212,165,165,0.6)" },
  { id: 7,  sign: "Skorpion",    en: "Scorpio",     domain: "Tiefe",         color: "#9B2335", glowColor: "rgba(155,35,53,0.8)" },
  { id: 8,  sign: "Schütze",     en: "Sagittarius", domain: "Freiheit",      color: "#7B2D8E", glowColor: "rgba(123,45,142,0.6)" },
  { id: 9,  sign: "Steinbock",   en: "Capricorn",   domain: "Struktur",      color: "#2B2D42", glowColor: "rgba(43,45,66,0.6)" },
  { id: 10, sign: "Wassermann",  en: "Aquarius",    domain: "Kollektiv",     color: "#00B4D8", glowColor: "rgba(0,180,216,0.6)" },
  { id: 11, sign: "Fische",      en: "Pisces",      domain: "Intuition",     color: "#48BFE3", glowColor: "rgba(72,191,227,0.6)" },
];

// ═══════════════════════════════════════════════════════════════
// PROFILE DATA — Real examples from the Semantic Marker Mapping
// ═══════════════════════════════════════════════════════════════
const PROFILES = {
  flamme: {
    name: "Die Flamme",
    description: "Physical Touch · Sinnlichkeit · Hingabe",
    // From the proof calculation in the spec (v2)
    base:    [0.08, 0.53, 0.00, 0.15, 0.17, 0.00, 0.13, 1.00, 0.00, 0.00, 0.07, 0.55],
    transit: [0.00, 0.05, 0.00, 0.00, 0.00, 0.00, 0.00, 0.15, 0.00, 0.00, 0.00, 0.03],
  },
  wolf: {
    name: "Der Wolf",
    description: "Rudeltreue · Urinstinkt · Schutzverantwortung",
    // From the Wolf event calculation (v2)
    base:    [0.91, 0.00, 0.00, 0.57, 0.00, 0.33, 0.20, 0.73, 0.00, 0.83, 1.00, 0.91],
    transit: [0.08, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.05, 0.10, 0.03, 0.00, 0.00],
  },
  analytiker: {
    name: "Der Analytiker",
    description: "Kognition · Präzision · Expansion",
    base:    [0.00, 0.00, 0.85, 0.00, 0.10, 1.00, 0.00, 0.00, 0.45, 0.35, 0.00, 0.00],
    transit: [0.00, 0.00, 0.04, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.08, 0.00, 0.00],
  },
  heiler: {
    name: "Der Heiler",
    description: "Empathie · Spiritualität · Fürsorge",
    base:    [0.00, 0.15, 0.00, 0.70, 0.00, 0.25, 0.30, 0.10, 0.00, 0.00, 0.20, 1.00],
    transit: [0.00, 0.00, 0.00, 0.06, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.10],
  },
};

// ═══════════════════════════════════════════════════════════════
// MATH HELPERS
// ═══════════════════════════════════════════════════════════════
function smoothInterpolate(values, angle) {
  const n = values.length;
  const sector = (angle / (Math.PI * 2)) * n;
  const i = Math.floor(sector) % n;
  const j = (i + 1) % n;
  const t = sector - Math.floor(sector);
  // Cubic smoothstep for organic feel
  const s = t * t * (3 - 2 * t);
  return values[i] * (1 - s) + values[j] * s;
}

function lerp(a, b, t) { return a + (b - a) * t; }

function lerpColor(c1, c2, t) {
  const r1 = parseInt(c1.slice(1,3), 16), g1 = parseInt(c1.slice(3,5), 16), b1 = parseInt(c1.slice(5,7), 16);
  const r2 = parseInt(c2.slice(1,3), 16), g2 = parseInt(c2.slice(3,5), 16), b2 = parseInt(c2.slice(5,7), 16);
  const r = Math.round(lerp(r1, r2, t)), g = Math.round(lerp(g1, g2, t)), b = Math.round(lerp(b1, b2, t));
  return `rgb(${r},${g},${b})`;
}

function getColorAtAngle(angle) {
  const n = SECTORS.length;
  const sector = ((angle / (Math.PI * 2)) * n + n) % n;
  const i = Math.floor(sector) % n;
  const j = (i + 1) % n;
  const t = sector - Math.floor(sector);
  return lerpColor(SECTORS[i].color, SECTORS[j].color, t);
}

// ═══════════════════════════════════════════════════════════════
// RING RENDERER
// ═══════════════════════════════════════════════════════════════
function drawRing(ctx, w, h, profile, time, showTransit, showLabels) {
  const cx = w / 2;
  const cy = h / 2;
  const baseRadius = Math.min(w, h) * 0.30;
  const maxDeform = baseRadius * 0.35;
  const ringWidth = Math.min(w, h) * 0.025;

  ctx.clearRect(0, 0, w, h);

  // Background — deep space
  const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.7);
  bgGrad.addColorStop(0, "#0a0a1a");
  bgGrad.addColorStop(0.5, "#060612");
  bgGrad.addColorStop(1, "#020208");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Subtle star dust
  const starSeed = 42;
  for (let i = 0; i < 80; i++) {
    const sx = ((Math.sin(i * 127.1 + starSeed) * 0.5 + 0.5) * w);
    const sy = ((Math.cos(i * 311.7 + starSeed) * 0.5 + 0.5) * h);
    const dist = Math.sqrt((sx - cx) ** 2 + (sy - cy) ** 2);
    if (dist < baseRadius * 0.6 || dist > baseRadius * 2.2) {
      const alpha = 0.15 + 0.15 * Math.sin(time * 0.3 + i);
      ctx.fillStyle = `rgba(180,200,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 0.5 + Math.random() * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Compute deformed ring points
  const combined = profile.base.map((b, i) => {
    const transit = showTransit ? profile.transit[i] : 0;
    return b + transit;
  });

  const steps = 720;
  const points = [];
  const innerPoints = [];

  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2 - Math.PI / 2;
    const signal = smoothInterpolate(combined, angle + Math.PI / 2);

    // Pulse: breathing effect scaled by signal strength
    const pulse = 1 + 0.015 * Math.sin(time * 1.2 + angle * 3) * (0.3 + signal * 0.7);
    // Secondary micro-pulse for life
    const micro = 1 + 0.005 * Math.sin(time * 3.7 + angle * 7);

    const deform = signal * maxDeform * pulse * micro;
    const r = baseRadius + deform;
    const rInner = r - ringWidth * (0.6 + signal * 0.6);

    points.push({
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
      r, angle, signal, deform
    });
    innerPoints.push({
      x: cx + Math.cos(angle) * rInner,
      y: cy + Math.sin(angle) * rInner,
    });
  }

  // ── Glow layer (energy field around peaks) ──
  for (let i = 0; i < steps; i++) {
    const p = points[i];
    if (p.signal > 0.3) {
      const glowR = ringWidth * 2 + p.signal * ringWidth * 6;
      const alpha = p.signal * 0.12 * (0.8 + 0.2 * Math.sin(time * 1.5 + p.angle * 2));
      const color = getColorAtAngle(p.angle + Math.PI / 2);
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
      glow.addColorStop(0, color.replace("rgb", "rgba").replace(")", `,${alpha})`));
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Korona strands (energy filaments at peaks) ──
  for (let s = 0; s < 12; s++) {
    const val = combined[s];
    if (val < 0.25) continue;

    const sectorAngle = (s / 12) * Math.PI * 2;
    const strandCount = Math.floor(val * 8) + 2;
    const color = SECTORS[s].color;

    for (let j = 0; j < strandCount; j++) {
      const spread = (j / strandCount - 0.5) * 0.35;
      const a = sectorAngle + spread;
      const r0 = baseRadius + val * maxDeform;
      const len = val * maxDeform * (0.4 + 0.6 * Math.sin(time * 2 + j * 1.3 + s));

      const x0 = cx + Math.cos(a - Math.PI / 2) * r0;
      const y0 = cy + Math.sin(a - Math.PI / 2) * r0;
      const x1 = cx + Math.cos(a - Math.PI / 2 + (j - strandCount/2) * 0.02) * (r0 + len);
      const y1 = cy + Math.sin(a - Math.PI / 2 + (j - strandCount/2) * 0.02) * (r0 + len);

      const alpha = val * 0.5 * (0.5 + 0.5 * Math.sin(time * 1.8 + j + s * 0.7));
      ctx.strokeStyle = color.replace("#", "rgba(")
        ? `rgba(${parseInt(color.slice(1,3),16)},${parseInt(color.slice(3,5),16)},${parseInt(color.slice(5,7),16)},${alpha})`
        : `rgba(200,200,200,${alpha})`;
      ctx.lineWidth = 1 + val * 1.5;
      ctx.beginPath();
      // Bezier curve for organic strand shape
      const cpx = (x0 + x1) / 2 + (Math.sin(time + j) * val * 8);
      const cpy = (y0 + y1) / 2 + (Math.cos(time + j) * val * 8);
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(cpx, cpy, x1, y1);
      ctx.stroke();
    }
  }

  // ── Main ring body ──
  // Draw as filled shape between outer and inner paths
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const p = points[i];
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  for (let i = steps; i >= 0; i--) {
    const p = innerPoints[i];
    ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();

  // Ring gradient — color follows sectors
  // We'll fill with a pattern of colored segments
  ctx.save();
  ctx.clip();

  for (let i = 0; i < steps; i++) {
    const p = points[i];
    const pNext = points[i + 1] || points[0];
    const pi = innerPoints[i];
    const piNext = innerPoints[i + 1] || innerPoints[0];

    const color = getColorAtAngle(p.angle + Math.PI / 2);
    const brightness = 0.4 + p.signal * 0.6;
    // Parse and adjust brightness
    const match = color.match(/\d+/g);
    if (match) {
      const [r, g, b] = match.map(Number);
      ctx.fillStyle = `rgb(${Math.round(r*brightness)},${Math.round(g*brightness)},${Math.round(b*brightness)})`;
    }

    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(pNext.x, pNext.y);
    ctx.lineTo(piNext.x, piNext.y);
    ctx.lineTo(pi.x, pi.y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // ── Ring edge glow ──
  ctx.beginPath();
  for (let i = 0; i <= steps; i++) {
    const p = points[i];
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // ── Transit pulse overlay ──
  if (showTransit) {
    for (let s = 0; s < 12; s++) {
      if (profile.transit[s] < 0.02) continue;
      const a = (s / 12) * Math.PI * 2 - Math.PI / 2;
      const r = baseRadius + combined[s] * maxDeform;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      const pulseR = profile.transit[s] * maxDeform * 2 * (0.6 + 0.4 * Math.sin(time * 3 + s));
      const tGlow = ctx.createRadialGradient(px, py, 0, px, py, pulseR);
      tGlow.addColorStop(0, "rgba(255,255,255,0.25)");
      tGlow.addColorStop(0.5, `rgba(255,255,255,${0.08 * Math.sin(time * 2 + s)})`);
      tGlow.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = tGlow;
      ctx.beginPath();
      ctx.arc(px, py, pulseR, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Sector labels ──
  if (showLabels) {
    const sorted = combined.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v);
    const topN = sorted.filter(s => s.v > 0.15).slice(0, 5);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // All sector markers (dim)
    for (let s = 0; s < 12; s++) {
      const a = (s / 12) * Math.PI * 2 - Math.PI / 2;
      const labelR = baseRadius - ringWidth * 3;
      const lx = cx + Math.cos(a) * labelR;
      const ly = cy + Math.sin(a) * labelR;
      const isTop = topN.some(t => t.i === s);
      if (!isTop) {
        ctx.font = `${Math.round(Math.min(w,h) * 0.016)}px "SF Pro Display", -apple-system, sans-serif`;
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.fillText(SECTORS[s].sign, lx, ly);
      }
    }

    // Top peaks (bright, with domain label)
    for (const peak of topN) {
      const s = peak.i;
      const a = (s / 12) * Math.PI * 2 - Math.PI / 2;
      const r = baseRadius + combined[s] * maxDeform;
      const labelR = r + ringWidth * 3 + combined[s] * ringWidth * 3;
      const lx = cx + Math.cos(a) * labelR;
      const ly = cy + Math.sin(a) * labelR;

      // Sign name
      const fontSize = Math.round(Math.min(w,h) * (0.020 + combined[s] * 0.012));
      ctx.font = `500 ${fontSize}px "SF Pro Display", -apple-system, sans-serif`;
      ctx.fillStyle = SECTORS[s].color;
      ctx.globalAlpha = 0.5 + combined[s] * 0.5;
      ctx.fillText(SECTORS[s].sign, lx, ly - fontSize * 0.6);

      // Domain
      ctx.font = `300 ${Math.round(fontSize * 0.7)}px "SF Pro Display", -apple-system, sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillText(SECTORS[s].domain, lx, ly + fontSize * 0.4);

      // Value
      ctx.font = `200 ${Math.round(fontSize * 0.55)}px "SF Pro Display", -apple-system, sans-serif`;
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.fillText(`${Math.round(combined[s] * 100)}%`, lx, ly + fontSize * 1.1);

      ctx.globalAlpha = 1;
    }
  }

  // ── Center: subtle sun glow ──
  const sunR = baseRadius * 0.08;
  const sunGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, sunR * 4);
  sunGlow.addColorStop(0, "rgba(255,240,200,0.15)");
  sunGlow.addColorStop(0.3, "rgba(255,220,150,0.05)");
  sunGlow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = sunGlow;
  ctx.beginPath();
  ctx.arc(cx, cy, sunR * 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(255,245,220,0.3)";
  ctx.beginPath();
  ctx.arc(cx, cy, sunR * (0.9 + 0.1 * Math.sin(time * 0.5)), 0, Math.PI * 2);
  ctx.fill();

  // ── Tension lines between opposing peaks ──
  const sorted = combined.map((v, i) => ({ v, i })).sort((a, b) => b.v - a.v);
  if (sorted[0].v > 0.5) {
    // Find the strongest opposition
    const peak = sorted[0].i;
    const opposite = (peak + 6) % 12;
    if (combined[opposite] > 0.2) {
      const a1 = (peak / 12) * Math.PI * 2 - Math.PI / 2;
      const a2 = (opposite / 12) * Math.PI * 2 - Math.PI / 2;
      const r1 = baseRadius + combined[peak] * maxDeform * 0.7;
      const r2 = baseRadius + combined[opposite] * maxDeform * 0.7;

      const x1 = cx + Math.cos(a1) * r1 * 0.5;
      const y1 = cy + Math.sin(a1) * r1 * 0.5;
      const x2 = cx + Math.cos(a2) * r2 * 0.5;
      const y2 = cy + Math.sin(a2) * r2 * 0.5;

      const alpha = 0.06 + 0.04 * Math.sin(time * 0.8);
      ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
      ctx.lineWidth = 0.5;
      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function FusionRing() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const [activeProfile, setActiveProfile] = useState("flamme");
  const [showTransit, setShowTransit] = useState(true);
  const [showLabels, setShowLabels] = useState(true);

  const profile = PROFILES[activeProfile];

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
    drawRing(ctx, rect.width, rect.height, profile, time, showTransit, showLabels);
    animRef.current = requestAnimationFrame(animate);
  }, [profile, showTransit, showLabels]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [animate]);

  // Find dominant peaks for the info panel
  const combined = profile.base.map((b, i) => b + (showTransit ? profile.transit[i] : 0));
  const peaks = combined
    .map((v, i) => ({ v, i }))
    .sort((a, b) => b.v - a.v)
    .slice(0, 3);

  return (
    <div style={{
      width: "100%",
      height: "100vh",
      background: "#020208",
      display: "flex",
      flexDirection: "column",
      fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
      color: "white",
      overflow: "hidden",
      position: "relative",
    }}>
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          flex: 1,
          width: "100%",
          display: "block",
        }}
      />

      {/* Profile info overlay */}
      <div style={{
        position: "absolute",
        top: 24,
        left: 24,
        right: 24,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        pointerEvents: "none",
      }}>
        <div>
          <div style={{
            fontSize: 11,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.3)",
            marginBottom: 4,
          }}>
            Fusion Ring
          </div>
          <div style={{
            fontSize: 28,
            fontWeight: 200,
            letterSpacing: "-0.02em",
            color: "rgba(255,255,255,0.85)",
          }}>
            {profile.name}
          </div>
          <div style={{
            fontSize: 13,
            fontWeight: 300,
            color: "rgba(255,255,255,0.35)",
            marginTop: 2,
          }}>
            {profile.description}
          </div>
        </div>

        {/* Peak summary */}
        <div style={{ textAlign: "right" }}>
          <div style={{
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.25)",
            marginBottom: 6,
          }}>
            Dominante Sektoren
          </div>
          {peaks.map((p, idx) => (
            <div key={p.i} style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 8,
              marginBottom: 3,
              opacity: 0.4 + p.v * 0.6,
            }}>
              <span style={{
                fontSize: 12,
                fontWeight: 300,
                color: "rgba(255,255,255,0.6)",
              }}>
                {SECTORS[p.i].domain}
              </span>
              <span style={{
                fontSize: 13,
                fontWeight: 500,
                color: SECTORS[p.i].color,
              }}>
                {SECTORS[p.i].sign}
              </span>
              <div style={{
                width: 40,
                height: 3,
                background: "rgba(255,255,255,0.08)",
                borderRadius: 2,
                overflow: "hidden",
              }}>
                <div style={{
                  width: `${p.v * 100}%`,
                  height: "100%",
                  background: SECTORS[p.i].color,
                  borderRadius: 2,
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: "16px 24px 20px",
        background: "linear-gradient(transparent, rgba(2,2,8,0.95))",
      }}>
        {/* Profile selector */}
        <div style={{
          display: "flex",
          gap: 8,
          marginBottom: 12,
          flexWrap: "wrap",
        }}>
          {Object.entries(PROFILES).map(([key, p]) => (
            <button
              key={key}
              onClick={() => setActiveProfile(key)}
              style={{
                padding: "6px 16px",
                borderRadius: 20,
                border: activeProfile === key
                  ? "1px solid rgba(255,255,255,0.3)"
                  : "1px solid rgba(255,255,255,0.08)",
                background: activeProfile === key
                  ? "rgba(255,255,255,0.08)"
                  : "transparent",
                color: activeProfile === key
                  ? "rgba(255,255,255,0.9)"
                  : "rgba(255,255,255,0.35)",
                fontSize: 13,
                fontWeight: 300,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.3s ease",
              }}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Toggle row */}
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            color: "rgba(255,255,255,0.4)",
            cursor: "pointer",
            userSelect: "none",
          }}>
            <input
              type="checkbox"
              checked={showTransit}
              onChange={(e) => setShowTransit(e.target.checked)}
              style={{ accentColor: "#7B2D8E" }}
            />
            Tageshoroskop Transit
          </label>
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            color: "rgba(255,255,255,0.4)",
            cursor: "pointer",
            userSelect: "none",
          }}>
            <input
              type="checkbox"
              checked={showLabels}
              onChange={(e) => setShowLabels(e.target.checked)}
              style={{ accentColor: "#7B2D8E" }}
            />
            Sektor-Labels
          </label>
          <div style={{
            marginLeft: "auto",
            fontSize: 10,
            color: "rgba(255,255,255,0.15)",
            letterSpacing: "0.1em",
          }}>
            BAZODIAC · FUSION RING v0.1
          </div>
        </div>
      </div>
    </div>
  );
}
