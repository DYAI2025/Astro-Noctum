import FusionRing from './FusionRing';
import { ClusterCard } from './ClusterCard';
import { CLUSTER_REGISTRY } from '@/src/lib/fusion-ring/clusters';
import type { FusionRingSignal } from '@/src/lib/fusion-ring';

interface ClusterEnergySystemProps {
  signal: FusionRingSignal | null;
  completedModules: Set<string>;
  onStartQuiz: (quizId: string) => void;
  isPremium: boolean;
  lang: 'de' | 'en';
}

export function ClusterEnergySystem({
  signal,
  completedModules,
  onStartQuiz,
  isPremium,
  lang,
}: ClusterEnergySystemProps) {
  return (
    <div className="flex flex-col items-center gap-8">
      {/* Ring */}
      {signal && (
        <div className="flex flex-col items-center gap-3">
          <FusionRing signal={signal} size={340} showLabels animated />
          {signal.resolution < 100 && (
            <p className="text-xs text-center text-gold/45">
              {lang === 'de'
                ? `Auflösung: ${signal.resolution}% — Schließe Cluster ab`
                : `Resolution: ${signal.resolution}% — Complete clusters`}
            </p>
          )}
        </div>
      )}

      {/* Cluster Cards */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        {CLUSTER_REGISTRY.map(cluster => (
          <ClusterCard
            key={cluster.id}
            cluster={cluster}
            completedModules={completedModules}
            onStartQuiz={onStartQuiz}
            isPremium={isPremium}
            lang={lang}
          />
        ))}
      </div>
    </div>
  );
}
