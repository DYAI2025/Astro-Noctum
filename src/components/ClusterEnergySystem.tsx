import { Link } from 'react-router-dom';
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
  const resolution = signal ? Math.round(signal.resolution * 100) : 0;

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Resolution summary + link to full ring */}
      {signal && (
        <div className="flex flex-col items-center gap-3 w-full max-w-sm">
          <div className="w-full h-1.5 rounded-sm bg-[#1E2A3A]/10 overflow-hidden">
            <div
              className="h-full rounded-sm transition-[width] duration-700"
              style={{ width: `${resolution}%`, background: '#D4AF37', opacity: 0.6 }}
            />
          </div>
          <div className="flex items-center justify-between w-full text-xs">
            <span className="text-[#1E2A3A]/45">
              {lang === 'de' ? `Auflösung: ${resolution}%` : `Resolution: ${resolution}%`}
            </span>
            <Link
              to="/fu-ring"
              className="text-[#8B6914]/60 hover:text-[#8B6914] transition-colors"
            >
              {lang === 'de' ? 'Fu-Ring öffnen →' : 'Open Fu-Ring →'}
            </Link>
          </div>
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
