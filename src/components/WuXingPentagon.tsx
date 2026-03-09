import { useMemo } from "react";
import { motion } from "motion/react";
import { WUXING_ELEMENTS } from "../lib/astro-data/wuxing";

interface WuXingPentagonProps {
  balance: Record<string, number>;
  lang: "en" | "de";
  size?: number;
  planetariumMode?: boolean;
}

// Pentagon vertices at 5 positions (top-center start, clockwise)
function pentagonPoint(index: number, radius: number, cx: number, cy: number): [number, number] {
  // Start from top (-90°), go clockwise
  const angle = ((index * 72) - 90) * (Math.PI / 180);
  return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
}

// Element order for pentagon (matches traditional WuXing cycle)
const ELEMENT_ORDER = ["Wood", "Fire", "Earth", "Metal", "Water"];

export function WuXingPentagon({ balance, lang, size = 280, planetariumMode }: WuXingPentagonProps) {
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = size * 0.38;
  const labelRadius = size * 0.46;

  // Normalize balance to 0-1 range
  const normalized = useMemo(() => {
    const values = ELEMENT_ORDER.map((key) => balance[key] ?? 0);
    const max = Math.max(...values, 0.01);
    return values.map((v) => v / max);
  }, [balance]);

  // Pentagon grid lines (20%, 40%, 60%, 80%, 100%)
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  // Data polygon points
  const dataPoints = useMemo(() => {
    return ELEMENT_ORDER.map((_, i) => {
      const r = maxRadius * Math.max(normalized[i], 0.05);
      return pentagonPoint(i, r, cx, cy);
    });
  }, [normalized, maxRadius, cx, cy]);

  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ") + "Z";

  return (
    <div className="flex justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="select-none">
        {/* Grid pentagons */}
        {gridLevels.map((level) => {
          const points = ELEMENT_ORDER.map((_, i) =>
            pentagonPoint(i, maxRadius * level, cx, cy),
          );
          const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ") + "Z";
          return (
            <path
              key={level}
              d={path}
              fill="none"
              stroke={planetariumMode ? "rgba(212,175,55,0.08)" : "rgba(30,42,58,0.06)"}
              strokeWidth={level === 1.0 ? 1.5 : 0.5}
            />
          );
        })}

        {/* Axis lines */}
        {ELEMENT_ORDER.map((_, i) => {
          const [px, py] = pentagonPoint(i, maxRadius, cx, cy);
          return (
            <line
              key={`axis-${i}`}
              x1={cx} y1={cy} x2={px} y2={py}
              stroke={planetariumMode ? "rgba(212,175,55,0.06)" : "rgba(30,42,58,0.04)"}
              strokeWidth={0.5}
            />
          );
        })}

        {/* Data fill */}
        <motion.path
          d={dataPath}
          fill="rgba(212,175,55,0.12)"
          stroke="rgba(212,175,55,0.5)"
          strokeWidth={1.5}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        />

        {/* Data points */}
        {dataPoints.map(([px, py], i) => {
          const el = WUXING_ELEMENTS.find((e) => e.key === ELEMENT_ORDER[i]);
          const rawValue = balance[ELEMENT_ORDER[i]] ?? 0;
          const isExtreme = rawValue > 0.7 || rawValue < 0.1;
          return (
            <g key={`point-${i}`}>
              <circle
                cx={px} cy={py} r={isExtreme ? 5 : 3.5}
                fill={el?.color ?? "#D4AF37"}
                stroke={isExtreme ? "#fff" : "none"}
                strokeWidth={isExtreme ? 1.5 : 0}
              />
              {isExtreme && (
                <motion.circle
                  cx={px} cy={py}
                  fill="none"
                  stroke={el?.color ?? "#D4AF37"}
                  strokeWidth={1}
                  initial={{ opacity: 0.2, r: 6 }}
                  animate={{ opacity: [0.2, 0.5, 0.2], r: [6, 10, 6] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
            </g>
          );
        })}

        {/* Labels */}
        {ELEMENT_ORDER.map((key, i) => {
          const el = WUXING_ELEMENTS.find((e) => e.key === key);
          const [lx, ly] = pentagonPoint(i, labelRadius, cx, cy);
          const rawValue = balance[key] ?? 0;
          const pct = Math.round(rawValue * 100);
          return (
            <g key={`label-${i}`}>
              <text
                x={lx} y={ly - 8}
                textAnchor="middle"
                className="text-[14px] font-serif"
                fill={el?.color ?? "#8B6914"}
              >
                {el?.chinese}
              </text>
              <text
                x={lx} y={ly + 6}
                textAnchor="middle"
                className="text-[9px]"
                fill={planetariumMode ? "rgba(255,255,255,0.5)" : "rgba(30,42,58,0.45)"}
              >
                {el?.name[lang]}
              </text>
              <text
                x={lx} y={ly + 18}
                textAnchor="middle"
                className="text-[8px] font-mono"
                fill={planetariumMode ? "rgba(255,255,255,0.3)" : "rgba(30,42,58,0.3)"}
              >
                {pct}%
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
