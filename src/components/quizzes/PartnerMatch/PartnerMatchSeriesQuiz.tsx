import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { ContributionEvent } from '@/src/lib/lme/types';
import { partnerMatchSeriesQuizToEvent } from '@/src/lib/fusion-ring/quiz-to-event';
import { useLanguage } from '@/src/contexts/LanguageContext';

// JSON imports
import quiz01 from './partner_match_01_chemie_ausdruck.json';
import quiz02 from './partner_match_02_alltag_eigenarten.json';
import quiz03 from './partner_match_03_vorlieben_lebensstil.json';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface PartnerMatchSeriesQuizProps {
  onComplete: (event: ContributionEvent) => void;
  onClose: () => void;
  quizIndex: number; // 1-3
}

interface QuizOption {
  id: string;
  label: { 'de-DE': string; 'en-US': string };
  cluster_scores: Record<string, number>;
  type_scores: Record<string, number>;
  duo_trait_deltas: Record<string, number>;
}

interface QuizQuestion {
  id: string;
  prompt: { 'de-DE': string; 'en-US': string };
  options: QuizOption[];
}

interface QuizProfile {
  id: string;
  title: { 'de-DE': string; 'en-US': string };
  tagline: { 'de-DE': string; 'en-US': string };
  description: { 'de-DE': string; 'en-US': string };
  stats: Array<{ label: { 'de-DE': string; 'en-US': string }; value: number }>;
  allies: string[];
  challenge: string;
}

type I18nString = { 'de-DE': string; 'en-US': string };

interface QuizData {
  series: { title: I18nString; quiz_index: number; quiz_count: number; theme: I18nString };
  meta: { facet_label: I18nString; axis_key: string };
  questions: QuizQuestion[];
  profiles: QuizProfile[];
  marker_emission: {
    cluster_domain_map: Record<string, string>;
    cluster_keyword_map: Record<string, string>;
  };
  contribution_event: { series_id: string };
  disclaimer: I18nString;
}

type Screen = 'intro' | 'quiz' | 'loading' | 'result';
type LocaleKey = 'de-DE' | 'en-US';
const LOCALE_KEY: Record<'de' | 'en', LocaleKey> = { de: 'de-DE', en: 'en-US' };

// ═══════════════════════════════════════════════════════════════
// QUIZ DATA REGISTRY
// ═══════════════════════════════════════════════════════════════

const QUIZ_DATA: Record<number, QuizData> = {
  1: quiz01 as unknown as QuizData,
  2: quiz02 as unknown as QuizData,
  3: quiz03 as unknown as QuizData,
};

// Series theme colors
const SERIES_ACCENT = '#9B3A6A';
const SERIES_ACCENT_LIGHT = '#C45B8F';

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function ProgressBar({ current, total, lk }: { current: number; total: number; lk: LocaleKey }) {
  const pct = ((current + 1) / total) * 100;
  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs text-white/40 uppercase tracking-widest font-sans">{lk === 'de-DE' ? 'Frage' : 'Question'}</span>
        <span className="text-sm font-medium tabular-nums" style={{ color: SERIES_ACCENT }}>
          {current + 1} / {total}
        </span>
      </div>
      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(to right, ${SERIES_ACCENT}, ${SERIES_ACCENT_LIGHT})` }}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

function SeriesDots({ quizIndex, total }: { quizIndex: number; total: number }) {
  return (
    <div className="flex gap-2 justify-center mb-4">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-colors ${i + 1 === quizIndex ? 'scale-125' : 'opacity-40'}`}
          style={{ backgroundColor: i + 1 <= quizIndex ? SERIES_ACCENT : 'rgba(255,255,255,0.3)' }}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCREEN: INTRO
// ═══════════════════════════════════════════════════════════════

function IntroScreen({ data, quizIndex, lk, onStart }: { data: QuizData; quizIndex: number; lk: LocaleKey; onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center text-center px-6 py-12 min-h-full"
    >
      <SeriesDots quizIndex={quizIndex} total={data.series.quiz_count} />

      {/* Heart resonance icon */}
      <div className="w-20 h-20 mb-6 relative">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" style={{ filter: `drop-shadow(0 0 20px ${SERIES_ACCENT}66)` }}>
          <g stroke={SERIES_ACCENT} strokeWidth="1.5" fill="none">
            <path d="M50 72 C30 58, 18 44, 18 32 C18 22, 26 14, 36 14 C41 14, 46 17, 50 21 C54 17, 59 14, 64 14 C74 14, 82 22, 82 32 C82 44, 70 58, 50 72Z" strokeLinecap="round" />
            <path d="M50 60 C38 50, 30 41, 30 34 C30 28, 34 24, 38 24 C42 24, 46 27, 50 31 C54 27, 58 24, 62 24 C66 24, 70 28, 70 34 C70 41, 62 50, 50 60Z" opacity="0.5" strokeLinecap="round" />
            <circle cx="50" cy="42" r="4" fill={SERIES_ACCENT} opacity="0.4" />
          </g>
        </svg>
      </div>

      <p className="text-xs uppercase tracking-[0.15em] mb-2 font-sans" style={{ color: SERIES_ACCENT }}>
        {lk === 'de-DE' ? `Quiz ${quizIndex} von ${data.series.quiz_count}` : `Quiz ${quizIndex} of ${data.series.quiz_count}`}
      </p>

      <h1 className="font-serif text-2xl sm:text-3xl text-white mb-2 leading-tight">
        {data.meta.facet_label[lk]}
      </h1>

      <p className="text-white/40 text-xs mb-4 font-sans">
        {data.series.title[lk]}
      </p>

      <p className="text-white/60 text-sm sm:text-base max-w-md mb-8 leading-relaxed">
        {data.series.theme[lk]}
      </p>

      <div className="flex gap-6 text-white/40 text-xs mb-10">
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span>{lk === 'de-DE' ? '2 Minuten' : '2 Minutes'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          </svg>
          <span>{data.questions.length} {lk === 'de-DE' ? 'Fragen' : 'Questions'}</span>
        </div>
      </div>

      <button
        onClick={onStart}
        className="font-semibold px-8 py-3.5 rounded-xl text-base transition-colors shadow-lg text-[#00050A]"
        style={{ backgroundColor: SERIES_ACCENT, boxShadow: `0 4px 20px ${SERIES_ACCENT}40` }}
        onMouseEnter={e => (e.currentTarget.style.backgroundColor = SERIES_ACCENT_LIGHT)}
        onMouseLeave={e => (e.currentTarget.style.backgroundColor = SERIES_ACCENT)}
      >
        {lk === 'de-DE' ? 'Beginnen' : 'Start'}
      </button>
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
  lk,
  onAnswer,
}: {
  question: QuizQuestion;
  index: number;
  total: number;
  lk: LocaleKey;
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
      <ProgressBar current={index} total={total} lk={lk} />

      <h2 className="font-serif text-lg sm:text-xl text-white mb-8 leading-snug">
        {question.prompt[lk]}
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
                    ? 'border-opacity-100 text-white'
                    : 'bg-white/5 backdrop-blur border-white/10 text-white/80 hover:bg-white/8'
                }
                disabled:cursor-default
              `}
              style={isSelected ? { backgroundColor: `${SERIES_ACCENT}20`, borderColor: SERIES_ACCENT } : undefined}
              onMouseEnter={e => { if (selected === null) e.currentTarget.style.borderColor = `${SERIES_ACCENT}80`; }}
              onMouseLeave={e => { if (selected === null) e.currentTarget.style.borderColor = ''; }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors"
                  style={isSelected ? { borderColor: SERIES_ACCENT, backgroundColor: SERIES_ACCENT } : { borderColor: 'rgba(255,255,255,0.3)' }}
                >
                  {isSelected && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#00050A" strokeWidth="3" strokeLinecap="round">
                      <path d="M5 12l5 5L19 7" />
                    </svg>
                  )}
                </span>
                <span className="text-sm sm:text-base leading-relaxed">{option.label[lk]}</span>
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

function LoadingScreen({ facetLabel, lk }: { facetLabel: string; lk: LocaleKey }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center text-center px-6 min-h-full"
    >
      <div className="w-20 h-20 relative mb-8">
        <motion.div
          className="absolute inset-0 border-2 border-transparent rounded-full"
          style={{ borderTopColor: SERIES_ACCENT }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute inset-2 border-2 border-transparent rounded-full"
          style={{ borderTopColor: '#D4AF37' }}
          animate={{ rotate: -360 }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
        />
      </div>
      <p className="font-serif text-xl text-white mb-2">
        {lk === 'de-DE' ? 'Resonanz wird gelesen...' : 'Reading your resonance...'}
      </p>
      <p className="text-sm text-white/50">
        {lk === 'de-DE' ? `Dein ${facetLabel}-Profil entsteht` : `Your ${facetLabel} profile is forming`}
      </p>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCREEN: RESULT
// ═══════════════════════════════════════════════════════════════

function ResultScreen({
  profile,
  quizIndex,
  totalQuizzes,
  lk,
  disclaimer,
  onClose,
}: {
  profile: QuizProfile;
  quizIndex: number;
  totalQuizzes: number;
  lk: LocaleKey;
  disclaimer: string;
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
      <SeriesDots quizIndex={quizIndex} total={totalQuizzes} />

      <div
        className="w-full max-w-sm rounded-2xl p-6 relative overflow-hidden shadow-2xl border"
        style={{
          background: 'linear-gradient(135deg, #1A0A12 0%, #2A1020 50%, #0A0508 100%)',
          borderColor: `${SERIES_ACCENT}30`,
        }}
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: `linear-gradient(to right, transparent, ${SERIES_ACCENT}, transparent)` }}
        />

        {/* Header */}
        <div className="text-center mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] mb-3" style={{ color: SERIES_ACCENT }}>
            {lk === 'de-DE' ? 'Dein Profil' : 'Your Profile'}
          </p>
          <h2 className="font-serif text-2xl text-white mb-1">{profile.title[lk]}</h2>
          <p className="font-serif text-sm italic" style={{ color: `${SERIES_ACCENT}cc` }}>
            {profile.tagline[lk]}
          </p>
        </div>

        {/* Divider */}
        <div className="h-px my-5" style={{ background: `linear-gradient(to right, transparent, ${SERIES_ACCENT}30, transparent)` }} />

        {/* Description */}
        <p className="text-sm text-white/60 leading-relaxed mb-5">
          {profile.description[lk]}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-2 mb-5">
          {profile.stats.map((stat) => (
            <div key={stat.label[lk]} className="bg-white/5 rounded-lg p-3 flex justify-between items-center">
              <span className="text-xs text-white/50">{stat.label[lk]}</span>
              <span className="text-sm font-medium" style={{ color: SERIES_ACCENT }}>
                {Math.round(stat.value * 100)}%
              </span>
            </div>
          ))}
        </div>

        {/* Compatibility */}
        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex justify-between items-center text-sm mb-2 pb-2 border-b border-white/10">
            <span className="text-white/50">{lk === 'de-DE' ? 'Verbündete' : 'Allies'}</span>
            <span className="font-medium text-emerald-400">
              {profile.allies.join(' & ')}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-white/50">{lk === 'de-DE' ? 'Herausforderung' : 'Challenge'}</span>
            <span className="font-medium" style={{ color: `${SERIES_ACCENT}cc` }}>
              {profile.challenge}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 w-full max-w-sm mt-6">
        <button
          onClick={onClose}
          className="flex-1 rounded-xl py-3 text-sm font-semibold text-[#00050A] transition"
          style={{ backgroundColor: SERIES_ACCENT, boxShadow: `0 4px 20px ${SERIES_ACCENT}40` }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = SERIES_ACCENT_LIGHT)}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = SERIES_ACCENT)}
        >
          {quizIndex < totalQuizzes
            ? (lk === 'de-DE' ? 'Weiter zur nächsten Facette' : 'Continue to next facet')
            : (lk === 'de-DE' ? 'Fertig' : 'Done')}
        </button>
      </div>

      <p className="text-[11px] text-white/30 text-center mt-6 max-w-sm">
        {disclaimer}
      </p>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCORING ENGINE
// ═══════════════════════════════════════════════════════════════

function computeResult(
  questions: QuizQuestion[],
  answers: number[],
): {
  clusterScores: Record<string, number>;
  typeScores: Record<string, number>;
  primaryType: string;
  duoTraits: Record<string, number>;
} {
  const clusterScores: Record<string, number> = {};
  const typeScores: Record<string, number> = {};
  const duoTraits: Record<string, number> = {};

  for (let i = 0; i < questions.length; i++) {
    const option = questions[i].options[answers[i]];
    if (!option) continue;

    for (const [k, v] of Object.entries(option.cluster_scores)) {
      clusterScores[k] = (clusterScores[k] ?? 0) + v;
    }
    for (const [k, v] of Object.entries(option.type_scores)) {
      typeScores[k] = (typeScores[k] ?? 0) + v;
    }
    for (const [k, v] of Object.entries(option.duo_trait_deltas)) {
      duoTraits[k] = (duoTraits[k] ?? 0) + v;
    }
  }

  let primaryType = '';
  let maxTypeScore = -Infinity;
  for (const [type, score] of Object.entries(typeScores)) {
    if (score > maxTypeScore) {
      maxTypeScore = score;
      primaryType = type;
    }
  }

  return { clusterScores, typeScores, primaryType, duoTraits };
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function PartnerMatchSeriesQuiz({ onComplete, onClose, quizIndex }: PartnerMatchSeriesQuizProps) {
  const data = useMemo(() => QUIZ_DATA[quizIndex], [quizIndex]);
  const { lang } = useLanguage();
  const lk = LOCALE_KEY[lang];
  const [screen, setScreen] = useState<Screen>('intro');
  const [questionIdx, setQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [resultProfile, setResultProfile] = useState<QuizProfile | null>(null);
  const pendingEventRef = useRef<ContributionEvent | null>(null);

  const handleStart = useCallback(() => {
    setScreen('quiz');
    setQuestionIdx(0);
    setAnswers([]);
    setResultProfile(null);
  }, []);

  const handleAnswer = useCallback(
    (optionIdx: number) => {
      const newAnswers = [...answers, optionIdx];
      setAnswers(newAnswers);

      if (questionIdx + 1 < data.questions.length) {
        setQuestionIdx(i => i + 1);
      } else {
        setScreen('loading');
      }
    },
    [questionIdx, answers, data.questions.length],
  );

  // Compute result and transition to result screen after loading delay
  useEffect(() => {
    if (screen !== 'loading') return;
    const timer = setTimeout(() => {
      const { clusterScores, primaryType } = computeResult(data.questions, answers);
      const profile = data.profiles.find(p => p.id === primaryType) ?? data.profiles[0];
      setResultProfile(profile);

      const isSeriesComplete = quizIndex === data.series.quiz_count;
      pendingEventRef.current = partnerMatchSeriesQuizToEvent(
        quizIndex,
        primaryType,
        clusterScores,
        data.marker_emission.cluster_domain_map,
        data.marker_emission.cluster_keyword_map,
        isSeriesComplete,
      );
      setScreen('result');
    }, 2000);
    return () => clearTimeout(timer);
  }, [screen, answers, data, quizIndex]);

  // Fire onComplete only after result screen has rendered
  useEffect(() => {
    if (screen !== 'result' || !pendingEventRef.current) return;
    const event = pendingEventRef.current;
    pendingEventRef.current = null;
    onComplete(event);
  }, [screen, onComplete]);

  if (!data) return null;

  return (
    <div className="relative w-full h-full min-h-[500px] flex flex-col">
      <AnimatePresence mode="wait">
        {screen === 'intro' && (
          <IntroScreen key="intro" data={data} quizIndex={quizIndex} lk={lk} onStart={handleStart} />
        )}

        {screen === 'quiz' && (
          <QuestionScreen
            key={`q-${questionIdx}`}
            question={data.questions[questionIdx]}
            index={questionIdx}
            total={data.questions.length}
            lk={lk}
            onAnswer={handleAnswer}
          />
        )}

        {screen === 'loading' && (
          <LoadingScreen key="loading" facetLabel={data.meta.facet_label[lk]} lk={lk} />
        )}

        {screen === 'result' && resultProfile && (
          <ResultScreen
            key="result"
            profile={resultProfile}
            quizIndex={quizIndex}
            totalQuizzes={data.series.quiz_count}
            lk={lk}
            disclaimer={data.disclaimer[lk]}
            onClose={onClose}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
