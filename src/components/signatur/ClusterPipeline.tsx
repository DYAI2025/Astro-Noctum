import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

interface ClusterPipelineProps {
  clusterId: string;
  clusterColor: string;
  isComplete: boolean;
}

const STORAGE_PREFIX = 'bazodiac_pipeline_shown_';

export function ClusterPipeline({ clusterId, clusterColor, isComplete }: ClusterPipelineProps) {
  const [showAnimation, setShowAnimation] = useState(false);
  const [showStaticLine, setShowStaticLine] = useState(false);
  const storageKey = `${STORAGE_PREFIX}${clusterId}`;

  useEffect(() => {
    if (!isComplete) return;

    const alreadyShown = localStorage.getItem(storageKey) === 'true';
    if (alreadyShown) {
      setShowStaticLine(true);
      return;
    }

    // First time seeing this cluster complete — animate
    setShowAnimation(true);
    localStorage.setItem(storageKey, 'true');

    const timer = setTimeout(() => {
      setShowAnimation(false);
      setShowStaticLine(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isComplete, storageKey]);

  if (!isComplete) return null;

  return (
    <div className="pointer-events-none relative my-1 flex items-center justify-center">
      {showAnimation && (
        <motion.div
          className="absolute h-[2px] rounded-full"
          style={{
            background: `linear-gradient(90deg, ${clusterColor}, transparent)`,
            boxShadow: `0 0 8px ${clusterColor}, 0 0 20px ${clusterColor}60`,
          }}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: '100%', opacity: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      )}

      {showAnimation && (
        <motion.div
          className="absolute h-2 w-2 rounded-full"
          style={{
            backgroundColor: clusterColor,
            boxShadow: `0 0 12px ${clusterColor}, 0 0 24px ${clusterColor}80`,
          }}
          initial={{ x: '-50%', opacity: 1 }}
          animate={{ x: '150%', opacity: 0 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
        />
      )}

      {showStaticLine && (
        <div
          className="h-[1px] w-full rounded-full opacity-40"
          style={{
            background: `linear-gradient(90deg, ${clusterColor}80, ${clusterColor}20)`,
            boxShadow: `0 0 4px ${clusterColor}40`,
          }}
        />
      )}
    </div>
  );
}
