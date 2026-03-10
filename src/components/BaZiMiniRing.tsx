import { useMemo } from "react";
import { Link } from "react-router-dom";
import { SECTOR_COUNT, SECTORS } from "../lib/fusion-ring/constants";
import { SECTOR_COLORS } from "../lib/fusion-ring/colors";

interface BaZiMiniRingProps {
  baziSignals: number[];
  lang: "en" | "de";
  size?: number;
  onNavigateToRing?: () => void;
}

function polarToXY(cx: number, cy: number, r: number, angle: number) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function sectorPath(cx: number, cy: number, innerR: number, outerR: number, startAngle: number, endAngle: number) {
  const p1 = polarToXY(cx, cy, innerR, startAngle);
  const p2 = polarToXY(cx, cy, outerR, startAngle);
  const p3 = polarToXY(cx, cy, outerR, endAngle);
  const p4 = polarToXY(cx, cy, innerR, endAngle);
  const large = endAngle - startAngle > Math.PI ? 1 : 0;
  return [
    `M ${p1.x} ${p1.y}`,
    `L ${p2.x} ${p2.y}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${p3.x} ${p3.y}`,
    `L ${p4.x} ${p4.y}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${p1.x} ${p1.y}`,
    "Z",
  ].join(" ");
}

export function BaZiMiniRing({ baziSignals, lang, size = 200 }: BaZiMiniRingProps) {
  const normalizedSignals = useMemo(() => {
    if (!baziSignals || baziSignals.length !== SECTOR_COUNT) {
      return new Array(SECTOR_COUNT).fill(0.3);
    }
    const max = Math.max(...baziSignals, 0.01);
    return baziSignals.map((v) => Math.max(v / max, 0.08));
  }, [baziSignals]);

  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.42;
  const innerR = size * 0.22;
  const angleStep = (Math.PI * 2) / SECTOR_COUNT;

  const peakSectors = useMemo(() => {
    const indexed = normalizedSignals.map((val, idx) => ({ val, idx }));
    indexed.sort((a, b) => b.val - a.val);
    return indexed.slice(0, 3).map((e) => SECTORS[e.idx]);
  }, [normalizedSignals]);

  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={
          lang === "de"
            ? "Mini-Ring Vorschau: BaZi-Beitrag zu den 12 Sektoren"
            : "Mini-Ring preview: BaZi contribution to 12 sectors"
        }
      >
        {normalizedSignals.map((signal, s) => {
          const startAngle = s * angleStep - Math.PI / 2;
          const endAngle = startAngle + angleStep;
          const r = innerR + (maxR - innerR) * signal;
          const color = SECTOR_COLORS[s];
          return (
            <g key={s}>
              <path
                d={sectorPath(cx, cy, innerR, r, startAngle, endAngle)}
                fill={color}
                fillOpacity={0.25}
              />
              <path
                d={sectorPath(cx, cy, r - 0.75, r + 0.75, startAngle, endAngle)}
                fill={color}
                fillOpacity={0.5}
              />
            </g>
          );
        })}
        <text x={cx} y={cy - 3} textAnchor="middle" dominantBaseline="middle" fill="rgba(139,105,20,0.4)" fontSize={8}>
          B(s)
        </text>
        <text x={cx} y={cy + 8} textAnchor="middle" dominantBaseline="middle" fill="rgba(139,105,20,0.25)" fontSize={7}>
          BaZi
        </text>
      </svg>
      <p className="text-[10px] text-[#1E2A3A]/40 text-center max-w-[260px] leading-relaxed">
        {lang === "de"
          ? `Dein BaZi-Profil formt 30% deines Fusion Rings. Stärkste Sektoren: ${peakSectors.map((s) => s.label_de).join(", ")}.`
          : `Your BaZi profile shapes 30% of your Fusion Ring. Strongest sectors: ${peakSectors.map((s) => s.sign.charAt(0).toUpperCase() + s.sign.slice(1)).join(", ")}.`}
      </p>
      <Link
        to="/fu-ring"
        className="text-[9px] uppercase tracking-[0.3em] text-[#8B6914]/50 hover:text-[#8B6914] transition-colors focus-visible:ring-2 focus-visible:ring-gold/50 rounded"
      >
        {lang === "de" ? "→ Zum Fusion Ring" : "→ View Fusion Ring"}
      </Link>
    </div>
  );
}
