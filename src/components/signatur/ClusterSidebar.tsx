import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Check, ChevronDown, ChevronUp } from 'lucide-react';
import {
  CLUSTER_REGISTRY,
  clusterProgress,
  isClusterComplete,
  type ClusterDef,
} from '@/src/lib/fusion-ring/clusters';
import { MODULE_TO_QUIZ_ID, QUIZ_NAMES } from '@/src/lib/fusion-ring/quiz-maps';

interface ClusterSidebarProps {
  completedModuleIds: Set<string>;
  onStartQuiz: (quizId: string) => void;
  onPremiumClick?: (clusterName: string) => void;
  isPremium: boolean;
  lang: 'de' | 'en';
  suggestedModule: string | null;
}

function ClusterPanel({
  cluster,
  completedModuleIds,
  onStartQuiz,
  onPremiumClick,
  isPremium,
  lang,
  suggestedModule,
}: {
  cluster: ClusterDef;
  completedModuleIds: Set<string>;
  onStartQuiz: (quizId: string) => void;
  onPremiumClick?: (clusterName: string) => void;
  isPremium: boolean;
  lang: 'de' | 'en';
  suggestedModule: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const progress = clusterProgress(cluster, completedModuleIds);
  const complete = isClusterComplete(cluster, completedModuleIds);
  const done = cluster.quizModuleIds.filter(id => completedModuleIds.has(id)).length;
  const total = cluster.quizModuleIds.length;

  return (
    <div
      className="relative rounded-2xl border transition-all duration-300"
      style={{
        backdropFilter: 'blur(12px)',
        background: complete
          ? `linear-gradient(135deg, ${cluster.color}18, ${cluster.color}08)`
          : 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
        borderColor: complete ? `${cluster.color}60` : 'rgba(255,255,255,0.1)',
        boxShadow: complete ? `0 0 24px ${cluster.color}30` : 'none',
      }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        className="flex w-full cursor-pointer items-center justify-between p-3"
        aria-expanded={expanded}
        aria-controls={`cluster-panel-${cluster.id}`}
      >
        <div className="flex items-center gap-2.5">
          <span className="text-lg" aria-hidden="true">{cluster.icon}</span>
          <div className="text-left">
            <h3 className="text-sm font-medium text-white/90">{cluster.name}</h3>
            <span className="text-[10px] text-white/60">
              {complete
                ? (lang === 'de' ? 'Abgeschlossen' : 'Completed')
                : `${done}/${total}`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {complete && <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />}
          {expanded
            ? <ChevronUp className="h-3.5 w-3.5 text-white/40" aria-hidden="true" />
            : <ChevronDown className="h-3.5 w-3.5 text-white/40" aria-hidden="true" />
          }
        </div>
      </button>

      {/* Progress bar */}
      {!complete && progress > 0 && (
        <div className="px-3 pb-2">
          <div
            className="h-0.5 overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-valuenow={Math.round(progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${cluster.name} ${Math.round(progress * 100)}%`}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: cluster.color }}
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>
      )}

      {/* Quiz slots */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            id={`cluster-panel-${cluster.id}`}
            role="region"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-1.5 px-3 pb-3">
              {cluster.quizModuleIds.map((moduleId) => {
                const quizDone = completedModuleIds.has(moduleId);
                const quizId = MODULE_TO_QUIZ_ID[moduleId];
                const name = QUIZ_NAMES[moduleId]?.[lang] ?? moduleId;
                const isSuggested = suggestedModule === moduleId;
                const needsPremium = (
                  cluster.id === 'cluster.kinky.v1' ||
                  cluster.id === 'cluster.partner_match.v1'
                ) && !isPremium;

                return (
                  <button
                    key={moduleId}
                    type="button"
                    disabled={quizDone}
                    onClick={() => {
                      if (needsPremium && onPremiumClick) {
                        onPremiumClick(cluster.name);
                      } else if (quizId) {
                        onStartQuiz(quizId);
                      }
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-all ${
                      quizDone
                        ? 'border opacity-60'
                        : needsPremium
                        ? 'cursor-not-allowed border border-white/5 bg-white/[0.02] opacity-30'
                        : 'cursor-pointer border border-white/5 bg-white/[0.04] hover:bg-white/[0.08]'
                    }`}
                    style={
                      quizDone
                        ? {
                            background: `linear-gradient(135deg, ${cluster.color}30, ${cluster.color}15)`,
                            borderColor: `${cluster.color}50`,
                            boxShadow: `0 0 8px ${cluster.color}20`,
                          }
                        : isSuggested && !needsPremium
                        ? {
                            borderColor: '#D4AF37',
                            boxShadow: '0 0 12px rgba(212,175,55,0.25)',
                            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                          }
                        : undefined
                    }
                  >
                    <span className={quizDone ? 'text-white/80' : 'text-white/60'}>
                      {name}
                    </span>
                    {quizDone ? (
                      <>
                        <Check className="h-3 w-3 shrink-0 text-emerald-400" aria-hidden="true" />
                        <span className="sr-only">{lang === 'de' ? 'Abgeschlossen' : 'Completed'}</span>
                      </>
                    ) : needsPremium ? (
                      <>
                        <Lock className="h-3 w-3 shrink-0 text-white/30" aria-hidden="true" />
                        <span className="sr-only">Premium</span>
                      </>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ClusterSidebar({
  completedModuleIds,
  onStartQuiz,
  onPremiumClick,
  isPremium,
  lang,
  suggestedModule,
}: ClusterSidebarProps) {
  return (
    <nav
      aria-label={lang === 'de' ? 'Quiz-Cluster' : 'Quiz clusters'}
      className="flex w-64 shrink-0 flex-col gap-2 overflow-y-auto pr-1"
    >
      {CLUSTER_REGISTRY.map(cluster => (
        <ClusterPanel
          key={cluster.id}
          cluster={cluster}
          completedModuleIds={completedModuleIds}
          onStartQuiz={onStartQuiz}
          isPremium={isPremium}
          lang={lang}
          suggestedModule={suggestedModule}
        />
      ))}
    </nav>
  );
}
