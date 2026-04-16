import { useMemo } from 'react';
import { Cymantics3D, type SolarModulation } from './Cymantics3D';
import { PLANETS } from './planetaryFrequencies';

export interface CymanticsSignatureProps {
  natalWeights: Record<string, number>;
  quizWeights: Record<string, number>;
  solarModulation?: SolarModulation;
  transits?: Array<{ planet: string; intensity: number }>;
  className?: string;
  width?: number;
  height?: number;
}

/**
 * CymanticsSignature — The unified kymatic identity component.
 * Replaces Signatur V3 with a real-frequency driven 3D Chladni engine.
 */
export function CymanticsSignature({
  natalWeights,
  quizWeights,
  solarModulation,
  transits,
  className,
  width,
  height,
}: CymanticsSignatureProps) {
  
  // Find the dominant planet from natal weights for primary coloring/glow
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

  return (
    <div className={`relative ${className}`} style={{ width: width || '100%', height: height || '100%' }}>
      <Cymantics3D
        natalWeights={natalWeights}
        quizWeights={quizWeights}
        solarModulation={solarModulation}
        dominantPlanet={dominantPlanet}
        width={width}
        height={height}
      />
      
      {/* Transit Overlays could be added here as additional particle layers if needed */}
      {transits?.map((t) => (
        <div key={t.planet} className="absolute inset-0 pointer-events-none">
           {/* Future: Individual transit frequency rings or ripples */}
        </div>
      ))}
    </div>
  );
}
