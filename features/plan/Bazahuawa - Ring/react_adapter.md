/**
 * @motion-ring/react
 * Type-safe React wrapper for the Motion Ring engine.
 */

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { createMotionRing, MotionRing } from '@motion-ring/core';

export interface MotionRingProps {
  radius?: number;
  pointCount?: number;
  omega?: number;
  signal?: number; // -1 to 1
  className?: string;
}

export const MotionRingReact = forwardRef<MotionRing | null, MotionRingProps>(
  ({ radius = 180, pointCount = 240, omega = 0.005, signal = 0, className }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<MotionRing | null>(null);

    useEffect(() => {
      if (!canvasRef.current) return;
      
      const engine = createMotionRing(canvasRef.current, {
        radius,
        pointCount,
        omega
      });
      
      engineRef.current = engine;
      engine.start();

      return () => engine.stop();
    }, []);

    // Reactive updates
    useEffect(() => {
      engineRef.current?.updateConfig({ radius, pointCount, omega });
    }, [radius, pointCount, omega]);

    useEffect(() => {
      engineRef.current?.setSignals(signal);
    }, [signal]);

    useImperativeHandle(ref, () => engineRef.current!);

    return (
      <canvas 
        ref={canvasRef} 
        className={className} 
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    );
  }
);

/* Usage Example:
   
function App() {
  const [val, setVal] = useState(0);
  
  return (
    <div className="h-screen w-full bg-white">
      <MotionRingReact 
        signal={val} 
        radius={200} 
        pointCount={300} 
      />
    </div>
  );
}
*/
