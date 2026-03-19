import { useState, useEffect, useCallback, useRef } from 'react';

interface ParallaxOffset {
  x: number;
  y: number;
}

/**
 * Mouse parallax hook. Returns pixel offset based on cursor position.
 *
 * @param factor - Pixel magnitude. Positive = follows mouse, negative = opposes.
 * @param enabled - Set false to disable (e.g., on mobile). Returns {0,0}.
 */
export function useParallax(factor: number, enabled = true): ParallaxOffset {
  const [offset, setOffset] = useState<ParallaxOffset>({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;
      setOffset({ x: nx * factor, y: ny * factor });
      rafRef.current = null;
    });
  }, [factor]);

  useEffect(() => {
    if (!enabled) {
      setOffset({ x: 0, y: 0 });
      return;
    }

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [enabled, handleMouseMove]);

  return offset;
}
