import { useRef, useEffect, useMemo } from "react";
import { SECTOR_COUNT, SECTORS } from "../lib/fusion-ring/constants";
import { SECTOR_COLORS } from "../lib/fusion-ring/colors";

interface BaZiMiniRingProps {
  baziSignals: number[];  // B(s) array of 12 values
  lang: "en" | "de";
  size?: number;
  onNavigateToRing?: () => void;
}

export function BaZiMiniRing({ baziSignals, lang, size = 200, onNavigateToRing }: BaZiMiniRingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const normalizedSignals = useMemo(() => {
    if (!baziSignals || baziSignals.length !== SECTOR_COUNT) {
      return new Array(SECTOR_COUNT).fill(0.3);
    }
    const max = Math.max(...baziSignals, 0.01);
    return baziSignals.map((v) => Math.max(v / max, 0.08));
  }, [baziSignals]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const outerR = size * 0.42;
    const innerR = size * 0.22;
    const angleStep = (Math.PI * 2) / SECTOR_COUNT;

    // Draw sectors
    for (let s = 0; s < SECTOR_COUNT; s++) {
      const startAngle = s * angleStep - Math.PI / 2;
      const endAngle = startAngle + angleStep;
      const signal = normalizedSignals[s];
      const r = innerR + (outerR - innerR) * signal;
      const color = SECTOR_COLORS[s];

      // Filled wedge
      ctx.beginPath();
      ctx.moveTo(cx + innerR * Math.cos(startAngle), cy + innerR * Math.sin(startAngle));
      ctx.arc(cx, cy, r, startAngle, endAngle);
      ctx.lineTo(cx + innerR * Math.cos(endAngle), cy + innerR * Math.sin(endAngle));
      ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
      ctx.closePath();

      ctx.fillStyle = color + "40";  // 25% opacity
      ctx.fill();

      // Outer edge glow
      ctx.beginPath();
      ctx.arc(cx, cy, r, startAngle, endAngle);
      ctx.strokeStyle = color + "80";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Center label
    ctx.fillStyle = "rgba(139,105,20,0.4)";
    ctx.font = "8px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("B(s)", cx, cy - 4);
    ctx.font = "7px sans-serif";
    ctx.fillStyle = "rgba(139,105,20,0.25)";
    ctx.fillText("BaZi", cx, cy + 6);
  }, [normalizedSignals, size]);

  // Find peak sectors for description
  const peakSectors = useMemo(() => {
    const indexed = normalizedSignals.map((val, idx) => ({ val, idx }));
    indexed.sort((a, b) => b.val - a.val);
    return indexed.slice(0, 3).map((e) => SECTORS[e.idx]);
  }, [normalizedSignals]);

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        className="cursor-pointer hover:opacity-90 transition-opacity"
        onClick={onNavigateToRing}
        role="img"
        aria-label={lang === "de"
          ? "Mini-Ring Vorschau: BaZi-Beitrag zu den 12 Sektoren"
          : "Mini-Ring preview: BaZi contribution to 12 sectors"}
      />
      <p className="text-[10px] text-[#1E2A3A]/40 text-center max-w-[260px] leading-relaxed">
        {lang === "de"
          ? `Dein BaZi-Profil formt 30% deines Fusion Rings. Stärkste Sektoren: ${peakSectors.map((s) => s.label_de).join(", ")}.`
          : `Your BaZi profile shapes 30% of your Fusion Ring. Strongest sectors: ${peakSectors.map((s) => s.sign.charAt(0).toUpperCase() + s.sign.slice(1)).join(", ")}.`}
      </p>
      {onNavigateToRing && (
        <button
          onClick={onNavigateToRing}
          className="text-[9px] uppercase tracking-[0.3em] text-[#8B6914]/50 hover:text-[#8B6914] transition-colors"
        >
          {lang === "de" ? "→ Zum Fusion Ring" : "→ View Fusion Ring"}
        </button>
      )}
    </div>
  );
}
