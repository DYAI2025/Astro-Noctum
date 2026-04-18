import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, ChevronDown, ChevronUp, Check } from 'lucide-react';
import type { ClusterDef } from '@/src/lib/signatur/clusters';
import { clusterProgress } from '@/src/lib/signatur/clusters';
import { MODULE_TO_QUIZ_ID, QUIZ_NAMES } from '@/src/lib/signatur/quiz-maps';
import { useLanguage } from '@/src/contexts/LanguageContext';

interface ClusterCardProps {
  cluster: ClusterDef;
  completedModules: Set<string>;
  onStartQuiz: (quizId: string) => void;
  isPremium: boolean;
  lang: 'de' | 'en';
}

export function ClusterCard({ cluster, completedModules, onStartQuiz, isPremium, lang }: ClusterCardProps) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const progress = clusterProgress(cluster, completedModules);
  const done = cluster.quizModuleIds.filter(id => completedModules.has(id)).length;
  const total = cluster.quizModuleIds.length;
  const isComplete = done === total;

  return (
    <motion.div
      className="relative rounded-xl border border-gold/10 bg-obsidian/80 backdrop-blur-sm overflow-hidden"
      style={{
        boxShadow: progress > 0 && !isComplete
          ? `inset 0 0 ${20 * progress}px ${cluster.color}30, 0 0 ${30 * progress}px ${cluster.color}15`
          : isComplete
          ? `inset 0 0 12px ${cluster.color}20`
          : 'none',
      }}
      animate={progress > 0 && !isComplete ? { scale: [1, 1.003, 1] } : {}}
      transition={progress > 0 && !isComplete ? { duration: 0.6, ease: 'easeOut' } : {}}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        className="w-full flex items-center justify-between p-4 cursor-pointer"
        aria-expanded={expanded}
        aria-controls={`cluster-panel-${cluster.id}`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{cluster.icon}</span>
          <div className="text-left">
            <h3 className="font-serif text-base text-gold/90">{cluster.name}</h3>
            <span className="text-xs text-gold/40">
              {isComplete
                ? t('cluster.completed')
                : `${done}/${total}`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isComplete && <Check className="w-4 h-4 text-emerald-500" />}
          {expanded ? <ChevronUp className="w-4 h-4 text-gold/40" /> : <ChevronDown className="w-4 h-4 text-gold/40" />}
        </div>
      </button>

      {/* Progress bar */}
      {!isComplete && (
        <div className="px-4 pb-2">
          <div
            className="h-1 rounded-full bg-gold/10 overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.round(progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: cluster.color }}
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      {/* Expanded quiz list */}
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
            <div className="px-4 pb-4 space-y-2">
              {cluster.quizModuleIds.map((moduleId, idx) => {
                const quizDone = completedModules.has(moduleId);
                const isFirst = idx === 0;
                const needsPremium = !isFirst && !isPremium;
                const quizId = MODULE_TO_QUIZ_ID[moduleId];
                const name = QUIZ_NAMES[moduleId]?.[lang] ?? moduleId;

                return (
                  <button
                    key={moduleId}
                    type="button"
                    disabled={quizDone || needsPremium}
                    onClick={() => quizId && onStartQuiz(quizId)}
                    className={`w-full flex items-center justify-between p-3 min-h-11 rounded-lg text-left transition-colors ${
                      quizDone
                        ? 'bg-gold/5 opacity-60'
                        : needsPremium
                        ? 'bg-gold/5 opacity-40 cursor-not-allowed'
                        : 'bg-gold/5 hover:bg-gold/10 cursor-pointer'
                    }`}
                  >
                    <span className="text-sm text-gold/80 truncate">{name}</span>
                    {quizDone ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    ) : needsPremium ? (
                      <div className="flex items-center gap-1.5 text-gold/40 shrink-0">
                        <Lock className="w-3 h-3" />
                        <span className="text-xs">Premium</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gold/40 shrink-0">
                        {t('cluster.start')} →
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
