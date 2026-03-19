import { useState, useEffect, lazy, Suspense } from 'react';

const FusionRingCanvasV2 = lazy(() => import('../fusion-ring-website/FusionRingCanvasV2'));

const FallbackLoader = () => (
  <div className="w-full h-full bg-black flex items-center justify-center">
    <div className="w-32 h-32 rounded-full border border-cyan-900/30 animate-pulse" />
  </div>
);

interface FusionRingRevealProps {
  natalWeights?: Record<string, number>;
  quizWeights?: Record<string, number>;
  onComplete?: () => void;
  autoReveal?: boolean;
}

export default function FusionRingReveal({
  natalWeights,
  quizWeights,
  onComplete,
  autoReveal = true,
}: FusionRingRevealProps) {
  const [revealProgress, setRevealProgress] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    if (autoReveal) {
      const timer = setTimeout(() => {
        setIsRevealed(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoReveal]);

  useEffect(() => {
    if (isRevealed) {
      let startTime: number | null = null;
      const duration = 2500; // 2.5 seconds for full reveal
      let frameId: number | null = null;

      const animate = (time: number) => {
        if (startTime === null) startTime = time;
        const progress = Math.min((time - startTime) / duration, 1);
        setRevealProgress(progress);

        if (progress < 1) {
          frameId = requestAnimationFrame(animate);
        } else if (onComplete) {
          onComplete();
        }
      };

      frameId = requestAnimationFrame(animate);

      return () => {
        if (frameId !== null) {
          cancelAnimationFrame(frameId);
        }
      };
    }
  }, [isRevealed, onComplete]);

  return (
    <div className="w-full h-full relative">
      <Suspense fallback={<FallbackLoader />}>
        <FusionRingCanvasV2
          natalWeights={natalWeights}
          quizWeights={quizWeights}
          revealProgress={revealProgress}
          showUI={false}
          isMini={false}
        />
      </Suspense>

      {/* Overlay reveal effect */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
        style={{
          background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.8) 70%, black 100%)',
          opacity: 1 - revealProgress * 0.7,
        }}
      />
    </div>
  );
}
