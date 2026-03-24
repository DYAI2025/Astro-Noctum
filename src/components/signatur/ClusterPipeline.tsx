import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface ClusterPipelineProps {
  clusterId: string;
  clusterColor: string;
  isComplete: boolean;
  significance?: number;
}

const STORAGE_PREFIX = 'bazodiac_pipeline_shown_';

export function ClusterPipeline({ clusterId, clusterColor, isComplete, significance = 0.7 }: ClusterPipelineProps) {
  const prefersReducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<'idle' | 'animate' | 'static'>('idle');
  const storageKey = `${STORAGE_PREFIX}${clusterId}`;

  // Scale durations and sizes by significance
  const baseDuration = 1.5 + significance * 1.5; // 1.5s–3s
  const glowSpread = 8 + significance * 16;      // 8–24px
  const burstScale = 1.5 + significance * 1.5;   // 1.5–3x
  const showComet = significance > 0.8;

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
    const timer = setTimeout(() => setPhase('static'), baseDuration * 1000 + 800);
    return () => clearTimeout(timer);
  }, [isComplete, storageKey, prefersReducedMotion, baseDuration]);

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
            boxShadow: `0 0 ${glowSpread * 0.4}px ${clusterColor}30`,
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
              boxShadow: `0 0 ${glowSpread}px ${clusterColor}, 0 0 ${glowSpread * 2}px ${clusterColor}50`,
            }}
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '100%', opacity: 1 }}
            transition={{ duration: baseDuration * 0.5, ease: 'easeOut' }}
          />

          {/* Particle 1 — fast lead */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 6 + significance * 4,
              height: 6 + significance * 4,
              backgroundColor: clusterColor,
              boxShadow: `0 0 ${glowSpread}px ${clusterColor}, 0 0 ${glowSpread * 2}px ${clusterColor}80`,
            }}
            initial={{ left: '0%', opacity: 1, scale: 1 }}
            animate={{ left: '105%', opacity: 0, scale: 0.3 }}
            transition={{ duration: baseDuration * 0.6, ease: 'easeIn', delay: 0.2 }}
          />

          {/* Particle 2 — medium */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 4 + significance * 2,
              height: 4 + significance * 2,
              backgroundColor: clusterColor,
              boxShadow: `0 0 ${glowSpread * 0.75}px ${clusterColor}`,
            }}
            initial={{ left: '0%', opacity: 0.8, scale: 0.8 }}
            animate={{ left: '105%', opacity: 0, scale: 0.2 }}
            transition={{ duration: baseDuration * 0.75, ease: 'easeIn', delay: 0.5 }}
          />

          {/* Particle 3 — slow trailing */}
          <motion.div
            className="absolute h-0.5 w-0.5 rounded-full"
            style={{
              backgroundColor: clusterColor,
              boxShadow: `0 0 ${glowSpread * 0.5}px ${clusterColor}`,
            }}
            initial={{ left: '0%', opacity: 0.6 }}
            animate={{ left: '105%', opacity: 0 }}
            transition={{ duration: baseDuration * 0.9, ease: 'easeIn', delay: 0.8 }}
          />

          {/* Particle 4 — comet trail (high significance only) */}
          {showComet && (
            <motion.div
              className="absolute rounded-full"
              style={{
                width: 8 + significance * 6,
                height: 3,
                background: `linear-gradient(90deg, ${clusterColor}, transparent)`,
                boxShadow: `0 0 ${glowSpread * 1.5}px ${clusterColor}, 0 0 ${glowSpread * 3}px ${clusterColor}40`,
                borderRadius: '50% 10% 10% 50%',
              }}
              initial={{ left: '-5%', opacity: 0, scaleX: 0.5 }}
              animate={{ left: '110%', opacity: [0, 1, 1, 0], scaleX: [0.5, 1.5, 1.2, 0.3] }}
              transition={{ duration: baseDuration * 0.7, ease: 'easeIn', delay: 0.3 }}
            />
          )}

          {/* Ring-side burst flash — scaled by significance */}
          <motion.div
            className="absolute right-0 rounded-full"
            style={{
              width: 12 + significance * 12,
              height: 12 + significance * 12,
              backgroundColor: clusterColor,
              boxShadow: `0 0 ${glowSpread * 2}px ${clusterColor}, 0 0 ${glowSpread * 4}px ${clusterColor}60`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, burstScale, 0], opacity: [0, 1, 0] }}
            transition={{ duration: 0.6 + significance * 0.4, delay: baseDuration * 0.7, ease: 'easeOut' }}
          />
        </>
      )}
    </div>
  );
}
