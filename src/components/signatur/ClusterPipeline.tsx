import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface ClusterPipelineProps {
  clusterId: string;
  clusterColor: string;
  isComplete: boolean;
}

const STORAGE_PREFIX = 'bazodiac_pipeline_shown_';

export function ClusterPipeline({ clusterId, clusterColor, isComplete }: ClusterPipelineProps) {
  const prefersReducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<'idle' | 'animate' | 'static'>('idle');
  const storageKey = `${STORAGE_PREFIX}${clusterId}`;

  useEffect(() => {
    if (!isComplete) return;

    const alreadyShown = localStorage.getItem(storageKey) === 'true';
    if (alreadyShown) {
      setPhase('static');
      return;
    }

    localStorage.setItem(storageKey, 'true');

    if (prefersReducedMotion) {
      setPhase('static');
      return;
    }

    setPhase('animate');
    const timer = setTimeout(() => setPhase('static'), 2500);
    return () => clearTimeout(timer);
  }, [isComplete, storageKey, prefersReducedMotion]);

  if (!isComplete || phase === 'idle') return null;

  return (
    <div
      className="pointer-events-none relative flex h-6 items-center overflow-hidden"
      aria-hidden="true"
    >
      {/* Base glow line */}
      {phase === 'static' && (
        <div
          className="h-[1px] w-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${clusterColor}60, ${clusterColor}15, transparent)`,
            boxShadow: `0 0 6px ${clusterColor}30`,
          }}
        />
      )}

      {/* Animated flow */}
      {phase === 'animate' && (
        <>
          {/* Growing line */}
          <motion.div
            className="absolute h-[2px] rounded-full"
            style={{
              background: `linear-gradient(90deg, ${clusterColor}, ${clusterColor}80, transparent)`,
              boxShadow: `0 0 10px ${clusterColor}, 0 0 24px ${clusterColor}50`,
            }}
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '100%', opacity: 1 }}
            transition={{ duration: 1.0, ease: 'easeOut' }}
          />

          {/* Particle 1 — fast */}
          <motion.div
            className="absolute h-1.5 w-1.5 rounded-full"
            style={{
              backgroundColor: clusterColor,
              boxShadow: `0 0 8px ${clusterColor}, 0 0 16px ${clusterColor}80`,
            }}
            initial={{ left: '0%', opacity: 1, scale: 1 }}
            animate={{ left: '105%', opacity: 0, scale: 0.3 }}
            transition={{ duration: 1.2, ease: 'easeIn', delay: 0.2 }}
          />

          {/* Particle 2 — medium */}
          <motion.div
            className="absolute h-1 w-1 rounded-full"
            style={{
              backgroundColor: clusterColor,
              boxShadow: `0 0 6px ${clusterColor}`,
            }}
            initial={{ left: '0%', opacity: 0.8, scale: 0.8 }}
            animate={{ left: '105%', opacity: 0, scale: 0.2 }}
            transition={{ duration: 1.5, ease: 'easeIn', delay: 0.5 }}
          />

          {/* Particle 3 — slow trailing */}
          <motion.div
            className="absolute h-0.5 w-0.5 rounded-full"
            style={{
              backgroundColor: clusterColor,
              boxShadow: `0 0 4px ${clusterColor}`,
            }}
            initial={{ left: '0%', opacity: 0.6 }}
            animate={{ left: '105%', opacity: 0 }}
            transition={{ duration: 1.8, ease: 'easeIn', delay: 0.8 }}
          />

          {/* Ring-side burst flash */}
          <motion.div
            className="absolute right-0 h-3 w-3 rounded-full"
            style={{
              backgroundColor: clusterColor,
              boxShadow: `0 0 20px ${clusterColor}, 0 0 40px ${clusterColor}60`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 0.6, delay: 1.4, ease: 'easeOut' }}
          />
        </>
      )}
    </div>
  );
}
