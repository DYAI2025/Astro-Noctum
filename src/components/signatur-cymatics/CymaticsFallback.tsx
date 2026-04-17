import type { WuxingElement } from '../../lib/cymatics/bazi-to-chladni';
import { ELEMENT_COLORS } from '../../lib/cymatics/bazi-to-chladni';

export interface CymaticsFallbackProps {
  dominantElement?: WuxingElement;
  planetariumMode?: boolean;
  className?: string;
}

/**
 * CSS/SVG animated fallback rendered when Canvas2D is unavailable.
 *
 * Shows pulsing concentric Chladni-like distorted rings in the Wu-Xing
 * element colour of the user's dominant element. No Canvas or WebGL required.
 * Adapted from Cymantics/SignatureCanvas.tsx CssSignatureFallback.
 */
export function CymaticsFallback({
  dominantElement = 'Water',
  planetariumMode = true,
  className,
}: CymaticsFallbackProps) {
  const color = ELEMENT_COLORS[dominantElement] ?? ELEMENT_COLORS.Water;
  const bg    = planetariumMode ? '#0a2030' : '#f1f5f9';

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1 / 1',
        maxWidth: 600,
        background: bg,
        borderRadius: '50%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      data-testid="cymatics-fallback"
      data-element={dominantElement}
    >
      <style>{`
        @keyframes cymatics-pulse {
          0%,100% { opacity: 0.15; transform: scale(1); }
          50%      { opacity: 0.45; transform: scale(1.05); }
        }
        @keyframes cymatics-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes cymatics-spin-rev {
          from { transform: rotate(360deg); }
          to   { transform: rotate(0deg); }
        }
        .cym-ring {
          position: absolute;
          border-radius: 50%;
          border: 1px solid;
          animation: cymatics-pulse 4s ease-in-out infinite;
        }
      `}</style>

      {/* Pulsing concentric rings at different sizes */}
      {([0.85, 0.70, 0.55, 0.40] as const).map((scale, i) => (
        <div
          key={i}
          className="cym-ring"
          style={{
            width: `${scale * 100}%`,
            height: `${scale * 100}%`,
            borderColor: `${color}${['22', '1a', '14', '0e'][i]}`,
            animationDelay: `${i * 0.7}s`,
            animationDuration: `${4 + i * 0.8}s`,
          }}
        />
      ))}

      {/* Spinning dashed rings */}
      <div style={{
        position: 'absolute',
        inset: '15%',
        border: `1px dashed ${color}28`,
        borderRadius: '50%',
        animation: 'cymatics-spin 20s linear infinite',
      }} />
      <div style={{
        position: 'absolute',
        inset: '25%',
        border: `1px solid ${color}18`,
        borderRadius: '50%',
        borderTopColor: `${color}70`,
        animation: 'cymatics-spin-rev 14s linear infinite',
      }} />

      {/* Chladni-like SVG distorted rings */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        viewBox="0 0 320 320"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="cym-center-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor={color} stopOpacity="0.12" />
            <stop offset="100%" stopColor={color} stopOpacity="0"    />
          </radialGradient>
        </defs>
        <circle cx="160" cy="160" r="130" fill="url(#cym-center-glow)" />

        {/* Radial axes (Chladni nodal line approximation) */}
        {[0, 30, 60, 90, 120, 150].map((angleDeg) => {
          const rad = (angleDeg * Math.PI) / 180;
          const x1  = 160 + Math.cos(rad) * 130;
          const y1  = 160 + Math.sin(rad) * 130;
          const x2  = 160 - Math.cos(rad) * 130;
          const y2  = 160 - Math.sin(rad) * 130;
          return (
            <line
              key={angleDeg}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={`${color}20`}
              strokeWidth="0.5"
            />
          );
        })}

        {/* Distorted concentric ring paths */}
        {([40, 70, 100] as const).map((r, ri) => (
          <path
            key={ri}
            d={buildChladniPath(160, 160, r, 6, 0.16 * (ri + 1))}
            fill="none"
            stroke={`${color}${['45', '30', '20'][ri]}`}
            strokeWidth="0.8"
          />
        ))}
        {([55, 88] as const).map((r, ri) => (
          <path
            key={`b${ri}`}
            d={buildChladniPath(160, 160, r, 4, 0.10 * (ri + 1))}
            fill="none"
            stroke={`${color}28`}
            strokeWidth="0.6"
          />
        ))}
      </svg>

      {/* Core glow */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 22,
        height: 22,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color}cc, ${color}33)`,
        boxShadow: `0 0 18px ${color}55, 0 0 36px ${color}18`,
      }} />
    </div>
  );
}

/** Generate a distorted ring path that mimics Chladni nodal lines. */
function buildChladniPath(
  cx: number,
  cy: number,
  r: number,
  nodes: number,
  amplitude: number,
): string {
  const steps = 120;
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const t      = (i / steps) * Math.PI * 2;
    const distort = 1 + amplitude * Math.sin(nodes * t);
    const x      = cx + Math.cos(t) * r * distort;
    const y      = cy + Math.sin(t) * r * distort;
    d += i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : ` L ${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return `${d} Z`;
}
