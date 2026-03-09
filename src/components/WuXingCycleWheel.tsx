import { useMemo } from "react";
import { motion } from "motion/react";
import { WUXING_ELEMENTS } from "../lib/astro-data/wuxing";
import { GENERATION_CYCLE, CONTROL_CYCLE } from "../lib/astro-data/wuxing-cycles";

interface WuXingCycleWheelProps {
  balance?: Record<string, number>;
  lang: "en" | "de";
  size?: number;
  planetariumMode?: boolean;
}

const ELEMENT_ORDER = ["Wood", "Fire", "Earth", "Metal", "Water"];

function circlePoint(index: number, radius: number, cx: number, cy: number): [number, number] {
  const angle = ((index * 72) - 90) * (Math.PI / 180);
  return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
}

export function WuXingCycleWheel({ balance, lang, size = 240, planetariumMode }: WuXingCycleWheelProps) {
  const cx = size / 2;
  const cy = size / 2;
  const elemRadius = size * 0.36;

  const positions = useMemo(() => {
    return Object.fromEntries(
      ELEMENT_ORDER.map((key, i) => [key, circlePoint(i, elemRadius, cx, cy)])
    );
  }, [elemRadius, cx, cy]);

  const arrowColor = planetariumMode ? "rgba(212,175,55,0.35)" : "rgba(139,105,20,0.3)";
  const controlColor = planetariumMode ? "rgba(212,175,55,0.15)" : "rgba(139,105,20,0.12)";

  return (
    <div className="flex justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="select-none">
        <defs>
          <marker
            id="arrowGen"
            markerWidth="8" markerHeight="6"
            refX="7" refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill={arrowColor} />
          </marker>
          <marker
            id="arrowCtrl"
            markerWidth="6" markerHeight="4"
            refX="5" refY="2"
            orient="auto"
          >
            <polygon points="0 0, 6 2, 0 4" fill={controlColor} />
          </marker>
        </defs>

        {/* Generation cycle arrows (outer) */}
        {GENERATION_CYCLE.map((edge, i) => {
          const [x1, y1] = positions[edge.from];
          const [x2, y2] = positions[edge.to];
          // Shorten line so it doesn't overlap node circles
          const dx = x2 - x1;
          const dy = y2 - y1;
          const len = Math.sqrt(dx * dx + dy * dy);
          const offset = 18;
          const sx = x1 + (dx / len) * offset;
          const sy = y1 + (dy / len) * offset;
          const ex = x2 - (dx / len) * offset;
          const ey = y2 - (dy / len) * offset;

          return (
            <motion.line
              key={`gen-${i}`}
              x1={sx} y1={sy} x2={ex} y2={ey}
              stroke={arrowColor}
              strokeWidth={1.5}
              markerEnd="url(#arrowGen)"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 + i * 0.15 }}
            />
          );
        })}

        {/* Control cycle lines (inner star, dashed) */}
        {CONTROL_CYCLE.map((edge, i) => {
          const [x1, y1] = positions[edge.from];
          const [x2, y2] = positions[edge.to];
          const dx = x2 - x1;
          const dy = y2 - y1;
          const len = Math.sqrt(dx * dx + dy * dy);
          const offset = 18;
          const sx = x1 + (dx / len) * offset;
          const sy = y1 + (dy / len) * offset;
          const ex = x2 - (dx / len) * offset;
          const ey = y2 - (dy / len) * offset;

          return (
            <motion.line
              key={`ctrl-${i}`}
              x1={sx} y1={sy} x2={ex} y2={ey}
              stroke={controlColor}
              strokeWidth={1}
              strokeDasharray="4 3"
              markerEnd="url(#arrowCtrl)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 1.2 + i * 0.1 }}
            />
          );
        })}

        {/* Element nodes */}
        {ELEMENT_ORDER.map((key) => {
          const el = WUXING_ELEMENTS.find((e) => e.key === key);
          const [px, py] = positions[key];
          const val = balance?.[key] ?? 0.5;

          return (
            <g key={key}>
              <circle
                cx={px} cy={py}
                r={12 + val * 6}
                fill={`${el?.color}18`}
                stroke={el?.color}
                strokeWidth={1.5}
              />
              <text
                x={px} y={py + 1}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-[14px] font-serif"
                fill={el?.color}
              >
                {el?.chinese}
              </text>
              <text
                x={px} y={py + 22}
                textAnchor="middle"
                className="text-[8px]"
                fill={planetariumMode ? "rgba(255,255,255,0.45)" : "rgba(30,42,58,0.4)"}
              >
                {el?.name[lang]}
              </text>
            </g>
          );
        })}

        {/* Center label */}
        <text
          x={cx} y={cy - 6}
          textAnchor="middle"
          className="text-[8px] uppercase tracking-widest"
          fill={planetariumMode ? "rgba(212,175,55,0.3)" : "rgba(139,105,20,0.25)"}
        >
          {lang === "de" ? "Erzeugung" : "Generation"}
        </text>
        <text
          x={cx} y={cy + 6}
          textAnchor="middle"
          className="text-[7px] uppercase tracking-widest"
          fill={controlColor}
        >
          {lang === "de" ? "Kontrolle" : "Control"}
        </text>
      </svg>
    </div>
  );
}
