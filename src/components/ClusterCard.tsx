import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, ChevronDown, ChevronUp, Check } from 'lucide-react';
import type { ClusterDef } from '@/src/lib/fusion-ring/clusters';
import { clusterProgress } from '@/src/lib/fusion-ring/clusters';

interface ClusterCardProps {
  cluster: ClusterDef;
  completedModules: Set<string>;
  onStartQuiz: (quizId: string) => void;
  isPremium: boolean;
  lang: 'de' | 'en';
}

// Map moduleId → quiz display ID (used by QuizOverlay QUIZ_MAP)
const MODULE_TO_QUIZ_ID: Record<string, string> = {
  'quiz.aura_colors.v1': 'aura_colors',
  'quiz.krafttier.v1': 'krafttier',
  'quiz.blumenwesen.v1': 'blumenwesen',
  'quiz.energiestein.v1': 'energiestein',
  'quiz.love_languages.v1': 'love_languages',
  'quiz.charme.v1': 'charme',
  'quiz.eq.v1': 'eq',
  'quiz.personality.v1': 'personality',
  'quiz.career_dna.v2': 'career_dna',
  'quiz.social_role.v2': 'social_role',
  'quiz.spotlight.v2': 'spotlight',
  'quiz.destiny.v1': 'destiny',
  'quiz.rpg_identity.v1': 'rpg_identity',
  'quiz.party_need.v1': 'party_need',
  'quiz.celebrity_soulmate.v1': 'celebrity_soulmate',
  'quiz.kinky_01.v1': 'kinky_01',
  'quiz.kinky_02.v1': 'kinky_02',
  'quiz.kinky_03.v1': 'kinky_03',
  'quiz.kinky_04.v1': 'kinky_04',
  'quiz.partner_match_01.v1': 'partner_match_01',
  'quiz.partner_match_02.v1': 'partner_match_02',
  'quiz.partner_match_03.v1': 'partner_match_03',
};

// Human-readable quiz names
const QUIZ_NAMES: Record<string, { de: string; en: string }> = {
  'quiz.aura_colors.v1': { de: 'Aura-Farben', en: 'Aura Colors' },
  'quiz.krafttier.v1': { de: 'Krafttier', en: 'Spirit Animal' },
  'quiz.blumenwesen.v1': { de: 'Blumenwesen', en: 'Flower Being' },
  'quiz.energiestein.v1': { de: 'Energiestein', en: 'Energy Stone' },
  'quiz.love_languages.v1': { de: 'Liebessprache', en: 'Love Language' },
  'quiz.charme.v1': { de: 'Charme', en: 'Charm' },
  'quiz.eq.v1': { de: 'EQ-Signatur', en: 'EQ Signature' },
  'quiz.personality.v1': { de: 'Persönlichkeit', en: 'Personality' },
  'quiz.career_dna.v2': { de: 'Karriere-DNA', en: 'Career DNA' },
  'quiz.social_role.v2': { de: 'Soziale Rolle', en: 'Social Role' },
  'quiz.spotlight.v2': { de: 'Spotlight', en: 'Spotlight' },
  'quiz.destiny.v1': { de: 'Destiny', en: 'Destiny' },
  'quiz.rpg_identity.v1': { de: 'RPG-Identität', en: 'RPG Identity' },
  'quiz.party_need.v1': { de: 'Party-Bedürfnis', en: 'Party Need' },
  'quiz.celebrity_soulmate.v1': { de: 'Celebrity Soulmate', en: 'Celebrity Soulmate' },
  'quiz.kinky_01.v1': { de: 'Sichtbarkeit', en: 'Visibility' },
  'quiz.kinky_02.v1': { de: 'Innerer Antrieb', en: 'Inner Drive' },
  'quiz.kinky_03.v1': { de: 'Grenzbereitschaft', en: 'Boundary Readiness' },
  'quiz.kinky_04.v1': { de: 'Identität', en: 'Identity' },
  'quiz.partner_match_01.v1': { de: 'Chemie & Ausdruck', en: 'Chemistry & Expression' },
  'quiz.partner_match_02.v1': { de: 'Alltag & Eigenarten', en: 'Everyday Fit & Quirks' },
  'quiz.partner_match_03.v1': { de: 'Vorlieben & Lebensstil', en: 'Preferences & Lifestyle' },
};

export function ClusterCard({ cluster, completedModules, onStartQuiz, isPremium, lang }: ClusterCardProps) {
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
                ? (lang === 'de' ? 'Abgeschlossen' : 'Completed')
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
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
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
                        {lang === 'de' ? 'Starten' : 'Start'} →
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
