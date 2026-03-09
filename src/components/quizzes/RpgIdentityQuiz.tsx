import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { ContributionEvent } from '@/src/lib/lme/types';
import { rpgIdentityToEvent } from '@/src/lib/fusion-ring/quiz-to-event';
import { quizData, profileNames } from './rpg-identity/data';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface RpgIdentityQuizProps {
  onComplete: (event: ContributionEvent) => void;
  onClose: () => void;
}

type Scores = {
  d1: number;
  d2: number;
  d3: number;
};

type Screen = 'intro' | 'quiz' | 'loading' | 'result';

// ═══════════════════════════════════════════════════════════════
// SCORING LOGIC
// ═══════════════════════════════════════════════════════════════

function calculateResult(finalScores: Scores) {
  const d1 = finalScores.d1;
  const d2 = finalScores.d2;
  const d3 = finalScores.d3;

  const maxD1 = 60, maxD2 = 60, maxD3 = 60;
  const d1Pct = d1 / maxD1;
  const d2Pct = d2 / maxD2;
  const d3Pct = d3 / maxD3;

  let foundProfile = quizData.profiles.find(p => p.id === 'paladin'); // default

  if (d1Pct > 0.6 && d3Pct > 0.6 && d2Pct > 0.5) foundProfile = quizData.profiles.find(p => p.id === 'paladin');
  else if (d1Pct < 0.4 && d2Pct < 0.4 && d3Pct < 0.4) foundProfile = quizData.profiles.find(p => p.id === 'nekromant');
  else if (d1Pct < 0.5 && d2Pct > 0.6) foundProfile = quizData.profiles.find(p => p.id === 'heiler');
  else if (d1Pct > 0.65 && d2Pct < 0.4) foundProfile = quizData.profiles.find(p => p.id === 'berserker');
  else if (d3Pct > 0.65 && d1Pct < 0.5) foundProfile = quizData.profiles.find(p => p.id === 'stratege');
  else if (d3Pct < 0.45 && d1Pct < 0.5) foundProfile = quizData.profiles.find(p => p.id === 'seher');
  else {
    if (d1Pct >= 0.5) {
      foundProfile = d2Pct >= 0.5 ? quizData.profiles.find(p => p.id === 'paladin') : quizData.profiles.find(p => p.id === 'berserker');
    } else {
      foundProfile = d2Pct >= 0.5 ? quizData.profiles.find(p => p.id === 'heiler') : quizData.profiles.find(p => p.id === 'seher');
    }
  }

  return foundProfile || quizData.profiles[0];
}

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute top-4 right-4 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
      aria-label="Schlie\u00dfen"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    </button>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = ((current + 1) / total) * 100;
  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-white/40 uppercase tracking-widest font-sans">Frage</span>
        <span className="text-sm text-[#D4AF37] font-medium tabular-nums">
          {current + 1} / {total}
        </span>
      </div>
      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-[#D4AF37] to-[#E8C878] rounded-full"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCREEN: INTRO
// ═══════════════════════════════════════════════════════════════

function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center text-center px-6 py-12 min-h-full"
    >
      <div className="text-6xl mb-8">\u2694\ufe0f</div>

      <h1 className="font-serif text-2xl sm:text-3xl text-white mb-4 leading-tight">
        {quizData.meta.title}
      </h1>

      <p className="text-white/60 text-sm sm:text-base max-w-md mb-8 leading-relaxed">
        {quizData.meta.subtitle}
      </p>

      <div className="flex gap-6 text-white/40 text-xs mb-10">
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span>~3 Minuten</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          </svg>
          <span>12 Fragen</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" />
            <circle cx="9" cy="7" r="4" />
          </svg>
          <span>6 Klassen</span>
        </div>
      </div>

      <button
        onClick={onStart}
        className="bg-[#D4AF37] text-[#00050A] font-semibold px-8 py-3.5 rounded-xl text-base hover:bg-[#E8C878] transition-colors shadow-lg shadow-[#D4AF37]/20"
      >
        Beginne deine Reise
      </button>

      <p className="text-[11px] text-white/30 text-center mt-8 max-w-sm">
        {quizData.meta.disclaimer}
      </p>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCREEN: QUESTION
// ═══════════════════════════════════════════════════════════════

function QuestionScreen({
  question,
  index,
  total,
  onAnswer,
}: {
  question: typeof quizData.questions[0];
  index: number;
  total: number;
  onAnswer: (optionIdx: number) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = useCallback(
    (idx: number) => {
      if (selected !== null) return;
      setSelected(idx);
      setTimeout(() => onAnswer(idx), 350);
    },
    [selected, onAnswer],
  );

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex flex-col px-6 py-8 min-h-full"
    >
      <ProgressBar current={index} total={total} />

      {question.narrative && (
        <p className="text-[#D4AF37]/70 text-xs uppercase tracking-widest mb-3 font-sans">
          {question.narrative}
        </p>
      )}
      <h2 className="font-serif text-xl sm:text-2xl text-white mb-8 leading-snug">
        {question.text}
      </h2>

      <div className="flex flex-col gap-3">
        {question.options.map((option, idx) => {
          const isSelected = selected === idx;
          return (
            <button
              key={option.id}
              onClick={() => handleSelect(idx)}
              disabled={selected !== null}
              className={`
                relative text-left w-full p-4 rounded-xl border transition-all duration-200
                ${
                  isSelected
                    ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-white'
                    : 'bg-white/5 backdrop-blur border-white/10 text-white/80 hover:border-[#D4AF37]/50 hover:bg-white/8'
                }
                disabled:cursor-default
              `}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`
                    mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors
                    ${isSelected ? 'border-[#D4AF37] bg-[#D4AF37]' : 'border-white/30'}
                  `}
                >
                  {isSelected && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#00050A" strokeWidth="3" strokeLinecap="round">
                      <path d="M5 12l5 5L19 7" />
                    </svg>
                  )}
                </span>
                <span className="text-sm sm:text-base leading-relaxed">{option.text}</span>
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCREEN: LOADING
// ═══════════════════════════════════════════════════════════════

function LoadingScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center text-center px-6 min-h-full"
    >
      <div className="w-20 h-20 relative mb-8">
        <motion.div
          className="absolute inset-0 border-2 border-transparent border-t-[#D4AF37] rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-2 border-2 border-transparent border-t-[#6CA192] rounded-full"
          animate={{ rotate: -360 }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
        />
      </div>
      <p className="font-serif text-xl text-white mb-2">Die Seele wird gelesen...</p>
      <p className="text-sm text-white/50">Deine Klasse offenbart sich</p>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCREEN: RESULT
// ═══════════════════════════════════════════════════════════════

function ResultScreen({
  profile,
  onRestart,
  onClose,
}: {
  profile: typeof quizData.profiles[0];
  onRestart: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex flex-col items-center px-6 py-8 min-h-full overflow-y-auto"
    >
      {/* Result Card */}
      <div className="w-full max-w-sm bg-gradient-to-br from-[#0A2540] to-[#053B3F] border border-[#D4AF37]/30 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
        {/* Top gold line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

        {/* Header */}
        <div className="text-center mb-5">
          <p className="text-[#D4AF37] text-xs font-semibold uppercase tracking-[0.12em] mb-3">
            Deine Rollenspiel-Seele
          </p>
          <h2 className="font-serif text-2xl text-white mb-2">{profile.title}</h2>
          <p className="font-serif text-base text-[#C4A86C] italic">&quot;{profile.tagline}&quot;</p>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent my-5" />

        {/* Description */}
        <p className="text-sm text-white/60 leading-relaxed text-center mb-5 whitespace-pre-line">
          {profile.description}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {profile.stats.map((stat) => (
            <div key={stat.label} className="bg-[#041726]/50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-white/50 uppercase tracking-wider mb-1">{stat.label}</p>
              <p className="font-serif text-lg font-semibold text-[#D4AF37]">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Compatibility */}
        <div className="bg-[#041726]/40 rounded-xl p-4">
          <div className="flex justify-between items-center text-sm mb-2 pb-2 border-b border-white/10">
            <span className="text-white/50">Verb&uuml;ndete</span>
            <span className="font-medium text-[#8FB8A8]">
              {profile.compatibility.allies.map(id => (profileNames as Record<string, string>)[id] || id).join(' \u2022 ')}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-white/50">Herausforderung</span>
            <span className="font-medium text-[#C45D4A]">
              {(Array.isArray(profile.compatibility.nemesis) ? profile.compatibility.nemesis : [profile.compatibility.nemesis])
                .map(id => (profileNames as Record<string, string>)[id] || id).join(' \u2022 ')}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 w-full max-w-sm mt-6">
        <button
          onClick={onRestart}
          className="flex-1 bg-transparent border border-[#D4AF37]/30 text-white/60 text-sm py-3 rounded-xl hover:border-[#D4AF37] hover:text-white transition-colors"
        >
          Nochmal
        </button>
        <button
          onClick={onClose}
          className="flex-1 rounded-xl bg-[#D4AF37] py-3 text-sm font-semibold text-[#00050A] shadow-[0_4px_20px_rgba(212,175,55,0.25)] transition hover:bg-[#E8C878]"
        >
          Fertig
        </button>
      </div>

      <p className="text-[11px] text-white/30 text-center mt-6 max-w-sm">
        {quizData.meta.disclaimer}
      </p>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function RpgIdentityQuiz({ onComplete, onClose }: RpgIdentityQuizProps) {
  const [screen, setScreen] = useState<Screen>('intro');
  const [questionIdx, setQuestionIdx] = useState(0);
  const [scores, setScores] = useState<Scores>({ d1: 0, d2: 0, d3: 0 });
  const [resultProfile, setResultProfile] = useState<typeof quizData.profiles[0] | null>(null);

  const handleStart = useCallback(() => {
    setScreen('quiz');
    setQuestionIdx(0);
    setScores({ d1: 0, d2: 0, d3: 0 });
    setResultProfile(null);
  }, []);

  const handleAnswer = useCallback(
    (optionIdx: number) => {
      const question = quizData.questions[questionIdx];
      const option = question.options[optionIdx];

      setScores((prev) => ({
        d1: prev.d1 + (option.scores.d1 || 0),
        d2: prev.d2 + (option.scores.d2 || 0),
        d3: prev.d3 + (option.scores.d3 || 0),
      }));

      if (questionIdx + 1 < quizData.questions.length) {
        setQuestionIdx((i) => i + 1);
      } else {
        setScreen('loading');
      }
    },
    [questionIdx],
  );

  // When loading screen shows, compute result after delay
  useEffect(() => {
    if (screen !== 'loading') return;
    const timer = setTimeout(() => {
      const profile = calculateResult(scores);
      setResultProfile(profile);
      setScreen('result');
      onComplete(rpgIdentityToEvent(profile.id));
    }, 2200);
    return () => clearTimeout(timer);
  }, [screen, scores, onComplete]);

  return (
    <div className="relative w-full h-full min-h-[500px] flex flex-col">
      <CloseButton onClick={onClose} />

      <AnimatePresence mode="wait">
        {screen === 'intro' && <IntroScreen key="intro" onStart={handleStart} />}

        {screen === 'quiz' && (
          <QuestionScreen
            key={`q-${questionIdx}`}
            question={quizData.questions[questionIdx]}
            index={questionIdx}
            total={quizData.questions.length}
            onAnswer={handleAnswer}
          />
        )}

        {screen === 'loading' && <LoadingScreen key="loading" />}

        {screen === 'result' && resultProfile && (
          <ResultScreen key="result" profile={resultProfile} onRestart={handleStart} onClose={onClose} />
        )}
      </AnimatePresence>
    </div>
  );
}
