import { useMemo, Suspense, lazy } from 'react';
import { Cymantics3D, type SolarModulation } from './Cymantics3D';
import { PLANETS } from './planetaryFrequencies';

const Cymantics2D = lazy(() => import('./Cymantics2D').then(m => ({ default: m.Cymantics2D })));

export interface CymanticsSignatureProps {
  natalWeights: Record<string, number>;
  quizWeights: Record<string, number>;
  chladniParams?: { m: number; n: number; a: number; b: number; harmonyIndex: number };
  solarModulation?: SolarModulation;
  transits?: Array<{ planet: string; intensity: number }>;
  className?: string;
  width?: number;
  height?: number;
  mode?: '3d' | '2d' | 'hybrid';
}

/**
 * CymanticsSignature — The unified kymatic identity component.
 * Integrates 3D frequency sphere and 2D particle simulation.
 */
export function CymanticsSignature({
  natalWeights,
  quizWeights,
  chladniParams,
  solarModulation,
  transits,
  className,
  width,
  height,
  mode = '3d'
}: CymanticsSignatureProps) {
  
  const dominantPlanet = useMemo(() => {
    let maxW = -1;
    let dom = PLANETS[0];
    for (const p of PLANETS) {
      const w = natalWeights[p.name] ?? 0;
      if (w > maxW) {
        maxW = w;
        dom = p;
      }
    }
    return dom;
  }, [natalWeights]);

  const element = (dominantPlanet?.wuxing_element as any) || "Water";

  return (
    <div className={`relative ${className}`} style={{ width: width || '100%', height: height || '100%' }}>
      {/* Background 2D Particle Layer for Hybrid Mode */}
      {(mode === '2d' || mode === 'hybrid') && chladniParams && (
        <div className="absolute inset-0 opacity-40 mix-blend-screen">
          <Suspense fallback={null}>
            <Cymantics2D
              params={{
                m: chladniParams.m,
                n: chladniParams.n,
                a: chladniParams.a,
                b: chladniParams.b,
                harmonyIndex: chladniParams.harmonyIndex,
                element: element
              }}
              active={true}
              size={width || 500}
            />
          </Suspense>
        </div>
      )}

      {/* Main 3D Sphere Layer */}
      {(mode === '3d' || mode === 'hybrid') && (
        <Cymantics3D
          natalWeights={natalWeights}
          quizWeights={quizWeights}
          solarModulation={solarModulation}
          dominantPlanet={dominantPlanet}
          width={width}
          height={height}
        />
      )}
      
      {/* Transit Overlays */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {transits?.map((t, i) => (
          <div key={i} className="absolute inset-0 animate-pulse opacity-20" style={{ boxShadow: `inset 0 0 100px -20px ${PLANETS.find(p => p.name === t.planet)?.color || 'white'}` }} />
        ))}
      </div>
    </div>
  );
}
