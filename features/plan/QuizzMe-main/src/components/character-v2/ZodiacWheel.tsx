"use client";

/**
 * Zodiac Wheel Component
 *
 * Displays a circular zodiac wheel with highlighted sun sign.
 * Pure component - takes sunSign as prop.
 */

type ZodiacSign =
  | "aries"
  | "taurus"
  | "gemini"
  | "cancer"
  | "leo"
  | "virgo"
  | "libra"
  | "scorpio"
  | "sagittarius"
  | "capricorn"
  | "aquarius"
  | "pisces";

type ZodiacWheelProps = {
  sunSign?: string;
  moonSign?: string;
  ascendant?: string;
  size?: number;
};

// Zodiac data with symbols and colors
const ZODIAC_DATA: Record<
  ZodiacSign,
  { symbol: string; color: string; element: string }
> = {
  aries: { symbol: "\u2648", color: "#ef4444", element: "fire" },
  taurus: { symbol: "\u2649", color: "#22c55e", element: "earth" },
  gemini: { symbol: "\u264a", color: "#fbbf24", element: "air" },
  cancer: { symbol: "\u264b", color: "#60a5fa", element: "water" },
  leo: { symbol: "\u264c", color: "#f97316", element: "fire" },
  virgo: { symbol: "\u264d", color: "#84cc16", element: "earth" },
  libra: { symbol: "\u264e", color: "#f472b6", element: "air" },
  scorpio: { symbol: "\u264f", color: "#a855f7", element: "water" },
  sagittarius: { symbol: "\u2650", color: "#dc2626", element: "fire" },
  capricorn: { symbol: "\u2651", color: "#65a30d", element: "earth" },
  aquarius: { symbol: "\u2652", color: "#06b6d4", element: "air" },
  pisces: { symbol: "\u2653", color: "#8b5cf6", element: "water" },
};

const ZODIAC_ORDER: ZodiacSign[] = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
];

export function ZodiacWheel({
  sunSign,
  size = 120,
}: ZodiacWheelProps) {
  const radius = size / 2;
  const innerRadius = radius * 0.5;
  const signRadius = radius * 0.75;

  return (
    <div
      className="relative"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={radius}
          cy={radius}
          r={radius - 2}
          fill="none"
          stroke="#1e293b"
          strokeWidth={4}
        />

        {/* Inner circle */}
        <circle
          cx={radius}
          cy={radius}
          r={innerRadius}
          fill="#0f172a"
          stroke="#334155"
          strokeWidth={1}
        />

        {/* Zodiac segments */}
        {ZODIAC_ORDER.map((sign, index) => {
          const angle = (index * 30 - 90) * (Math.PI / 180);
          const x = radius + signRadius * Math.cos(angle);
          const y = radius + signRadius * Math.sin(angle);

          const isActive = sunSign === sign;
          const data = ZODIAC_DATA[sign];

          return (
            <g key={sign} className="transform rotate-90" style={{ transformOrigin: `${radius}px ${radius}px` }}>
              {/* Highlight arc for active sign */}
              {isActive && (
                <path
                  d={describeArc(radius, radius, radius - 2, index * 30 - 15, index * 30 + 15)}
                  fill="none"
                  stroke={data.color}
                  strokeWidth={6}
                  opacity={0.8}
                />
              )}

              {/* Sign symbol */}
              <text
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={isActive ? 18 : 12}
                fill={isActive ? data.color : "#64748b"}
                className="transition-all duration-300"
                style={{ transformOrigin: `${x}px ${y}px`, transform: "rotate(90deg)" }}
              >
                {data.symbol}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Center label */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ pointerEvents: "none" }}
      >
        {sunSign && ZODIAC_DATA[sunSign as ZodiacSign] && (
          <span
            className="text-2xl font-bold"
            style={{ color: ZODIAC_DATA[sunSign as ZodiacSign].color }}
          >
            {ZODIAC_DATA[sunSign as ZodiacSign].symbol}
          </span>
        )}
        {!sunSign && (
          <span className="text-slate-500 text-2xl">?</span>
        )}
      </div>
    </div>
  );
}

// Helper function to create SVG arc path
function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number
): string {
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;

  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);

  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}
