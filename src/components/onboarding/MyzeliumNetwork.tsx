import { useMemo } from 'react';

interface Point { x: number; y: number; }

interface MyzeliumNetworkProps {
  leftAnchor: Point;
  rightAnchor: Point;
  active?: boolean;
  intensity?: number;
  className?: string;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

interface Tendril { d: string; duration: number; delay: number; }

function generateTendrils(left: Point, right: Point, count: number): Tendril[] {
  const rand = seededRandom(42);
  const tendrils: Tendril[] = [];
  const midX = (left.x + right.x) / 2;
  const spread = Math.abs(right.x - left.x) * 0.25;

  for (let i = 0; i < count; i++) {
    const yOff = (rand() - 0.5) * spread * 2;
    const cp1x = left.x + (midX - left.x) * 0.4 + (rand() - 0.5) * spread * 0.5;
    const cp1y = left.y + yOff * 0.6;
    const cp2x = midX + (right.x - midX) * 0.6 + (rand() - 0.5) * spread * 0.5;
    const cp2y = right.y + yOff * 0.4;
    const d = `M ${left.x} ${left.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${right.x} ${right.y}`;
    tendrils.push({ d, duration: 2 + rand() * 2, delay: rand() * 0.8 });
  }
  return tendrils;
}

interface JunctionNode { cx: number; cy: number; r: number; }

function generateJunctions(left: Point, right: Point, count: number): JunctionNode[] {
  const rand = seededRandom(99);
  const nodes: JunctionNode[] = [];
  const spread = Math.abs(right.y - left.y) + 60;

  for (let i = 0; i < count; i++) {
    const t = 0.2 + rand() * 0.6;
    nodes.push({
      cx: left.x + (right.x - left.x) * t,
      cy: (left.y + right.y) / 2 + (rand() - 0.5) * spread,
      r: 1.5 + rand() * 2,
    });
  }
  return nodes;
}

export function MyzeliumNetwork({
  leftAnchor,
  rightAnchor,
  active = true,
  intensity = 0.5,
  className = '',
}: MyzeliumNetworkProps) {
  const tendrils = useMemo(
    () => generateTendrils(leftAnchor, rightAnchor, 5),
    [leftAnchor.x, leftAnchor.y, rightAnchor.x, rightAnchor.y],
  );

  const junctions = useMemo(
    () => generateJunctions(leftAnchor, rightAnchor, 4),
    [leftAnchor.x, leftAnchor.y, rightAnchor.x, rightAnchor.y],
  );

  return (
    <svg
      data-testid="myzelium-svg"
      className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-1000 ${active ? '' : 'opacity-0'} ${className}`}
      viewBox={`0 0 ${Math.max(rightAnchor.x + 100, 800)} ${Math.max(rightAnchor.y + 100, 600)}`}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="myzel-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#D4AF37" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#00F5FF" stopOpacity="0.5" />
        </linearGradient>
        <filter id="myzel-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {tendrils.map((t, i) => (
        <path
          key={`tendril-${i}`}
          d={t.d}
          fill="none"
          stroke="url(#myzel-grad)"
          strokeWidth={0.8}
          strokeLinecap="round"
          filter="url(#myzel-glow)"
          style={{
            strokeDasharray: '1000',
            strokeDashoffset: active ? '0' : '1000',
            transition: `stroke-dashoffset ${t.duration}s ease-out ${t.delay}s`,
          }}
        />
      ))}

      {junctions.map((n, i) => (
        <circle
          key={`node-${i}`}
          cx={n.cx}
          cy={n.cy}
          r={n.r}
          fill="#D4AF37"
          opacity={active ? 0.4 : 0}
          style={{ transition: 'opacity 1.5s ease-out' }}
        >
          <animate attributeName="opacity" values="0.2;0.5;0.2" dur={`${2 + i * 0.5}s`} repeatCount="indefinite" />
          <animate attributeName="r" values={`${n.r};${n.r * 1.3};${n.r}`} dur={`${3 + i * 0.3}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}
