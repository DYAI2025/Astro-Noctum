/**
 * Chladni Pattern Signature — p5.js particle simulation
 * Based on the cymatics repo's approach:
 * chladni(x, y, a, b, m, n) = a*sin(π*n*x)*sin(π*m*y) + b*sin(π*m*x)*sin(π*n*y)
 *
 * Particles settle at nodal lines (where chladni ≈ 0),
 * forming the unique geometric signature for each birthchart.
 */

import { useEffect, useRef } from "react";

interface ChladniParams {
  m: number;   // nodal lines X — drives from bazi numeric_signature
  n: number;   // nodal lines Y
  a: number;   // amplitude coefficient
  b: number;   // amplitude coefficient
  element: "Wood" | "Fire" | "Earth" | "Metal" | "Water" | null;
  harmonyIndex: number; // 0..1 — affects vibration strength
}

interface ChladniSignatureProps {
  params: ChladniParams;
  active: boolean;
  size?: number;
}

// Wu-Xing element colors
const ELEMENT_COLORS: Record<string, { primary: string; glow: string; rgb: [number, number, number] }> = {
  Wood:  { primary: "#66BB6A", glow: "#2E7D32", rgb: [102, 187, 106] },
  Fire:  { primary: "#FF9800", glow: "#E65100", rgb: [255, 152, 0] },
  Earth: { primary: "#FFD54F", glow: "#BF8C00", rgb: [255, 213, 79] },
  Metal: { primary: "#CFD8DC", glow: "#78909C", rgb: [207, 216, 220] },
  Water: { primary: "#42A5F5", glow: "#1565C0", rgb: [66, 165, 245] },
};

function chladni(x: number, y: number, a: number, b: number, m: number, n: number): number {
  return (
    a * Math.sin(Math.PI * n * x) * Math.sin(Math.PI * m * y) +
    b * Math.sin(Math.PI * m * x) * Math.sin(Math.PI * n * y)
  );
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function Cymantics2D({ params, active, size = 500 }: ChladniSignatureProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Ref = useRef<any>(null);
  const paramsRef = useRef(params);
  const smoothParamsRef = useRef({ ...params });
  const activeRef = useRef(active);

  // Keep refs synced
  useEffect(() => { paramsRef.current = params; }, [params]);
  useEffect(() => { activeRef.current = active; }, [active]);

  useEffect(() => {
    if (!containerRef.current) return;
    let p5Instance: any = null;

    const initP5 = async () => {
      const P5 = (await import("p5")).default;
      const N_PARTICLES = 16000;

      type Particle = {
        x: number; y: number;
        stochastic: number;
        xOff: number; yOff: number;
      };

      const particles: Particle[] = [];

      const sketch = (p: any) => {
        p.setup = () => {
          const cnv = p.createCanvas(size, size);
          if (containerRef.current) cnv.parent(containerRef.current);
          p.background(10, 32, 48);

          for (let i = 0; i < N_PARTICLES; i++) {
            particles.push({ x: p.random(0, 1), y: p.random(0, 1), stochastic: 0, xOff: 0, yOff: 0 });
          }
        };

        p.draw = () => {
          const sp = smoothParamsRef.current;
          const tp = paramsRef.current;

          // Smooth interpolate params
          sp.m = lerp(sp.m, tp.m, 0.04);
          sp.n = lerp(sp.n, tp.n, 0.04);
          sp.a = lerp(sp.a, tp.a, 0.03);
          sp.b = lerp(sp.b, tp.b, 0.03);
          sp.harmonyIndex = lerp(sp.harmonyIndex, tp.harmonyIndex, 0.03);

          const elem = tp.element || "Water";
          const col = ELEMENT_COLORS[elem] || ELEMENT_COLORS.Water;
          const vibration = activeRef.current ? (0.003 + sp.harmonyIndex * 0.004) : 0.0008;

          // Semi-transparent background for trails
          p.background(10, 32, 48, 18);

          p.strokeWeight(1.2);

          const activeCount = activeRef.current ? N_PARTICLES : Math.floor(N_PARTICLES * 0.3);

          for (let i = 0; i < activeCount; i++) {
            const pt = particles[i];
            const eq = chladni(pt.x, pt.y, sp.a, sp.b, sp.m, sp.n);
            let stoch = vibration * Math.abs(eq);
            if (stoch <= 0.0008) stoch = 0.0008;

            pt.x += p.random(-stoch, stoch);
            pt.y += p.random(-stoch, stoch);
            pt.x = Math.max(0, Math.min(1, pt.x));
            pt.y = Math.max(0, Math.min(1, pt.y));

            pt.xOff = p.width * pt.x;
            pt.yOff = p.height * pt.y;

            // Color based on distance to nodal line (|eq| near 0 = settled = brighter)
            const proximity = 1 - Math.min(1, Math.abs(eq) * 8);
            const alpha = activeRef.current ? (proximity * 200 + 30) : (proximity * 100 + 15);
            p.stroke(col.rgb[0], col.rgb[1], col.rgb[2], alpha);
            p.point(pt.xOff, pt.yOff);
          }
        };
      };

      p5Instance = new P5(sketch);
      p5Ref.current = p5Instance;
    };

    initP5();

    return () => {
      if (p5Instance) {
        try { p5Instance.remove(); } catch {}
      }
    };
  }, [size]);

  // Resize canvas when size changes
  useEffect(() => {
    if (p5Ref.current) {
      try { p5Ref.current.resizeCanvas(size, size); } catch {}
    }
  }, [size]);

  return (
    <div
      ref={containerRef}
      style={{
        width: size, height: size,
        borderRadius: "50%",
        overflow: "hidden",
        position: "relative",
      }}
    />
  );
}
