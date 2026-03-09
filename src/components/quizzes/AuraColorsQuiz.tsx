import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { ContributionEvent } from '@/src/lib/lme/types';
import { auraToEvent } from '@/src/lib/fusion-ring/quiz-to-event';
import {
  questions,
  profiles,
  elements,
  quizMeta,
  dimensions,
  normalizeScores,
  calculateColorScores,
  determinePrimaryColor,
  determineSecondaryColor,
  determineElement,
  type DimensionScores,
  type AuraProfile,
  type ElementInfo
} from './aura-colors/data';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface AuraColorsQuizProps {
  onComplete: (event: ContributionEvent) => void;
  onClose: () => void;
}

interface QuizResult {
  primary: AuraProfile;
  secondary: AuraProfile;
  element: ElementInfo;
}

interface CollectedMarker {
  id: string;
  weight: number;
}

type Screen = 'intro' | 'quiz' | 'loading' | 'result';

// Micro-win messages
const microWinMessages = [
  "Die Energie fließt...",
  "Interessant...",
  "Deine Aura formt sich...",
  "Ein Muster entsteht...",
  "Weiter so...",
  "Tiefe Einblicke...",
  "Die Farben werden klarer...",
  "Fast da..."
];

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute top-4 right-4 z-50 w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
      aria-label="Schließen"
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
      {/* Aura Icon */}
      <div className="w-28 h-28 mb-8 relative">
        <svg viewBox="0 0 120 120" fill="none" className="w-full h-full animate-pulse">
          <defs>
            <radialGradient id="auraGrad1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.8"/>
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0"/>
            </radialGradient>
            <linearGradient id="goldLine" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E8C878"/>
              <stop offset="100%" stopColor="#A77D38"/>
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r="50" fill="url(#auraGrad1)"/>
          <circle cx="60" cy="60" r="35" stroke="url(#goldLine)" strokeWidth="1.5" fill="none" opacity="0.6"/>
          <circle cx="60" cy="60" r="20" stroke="url(#goldLine)" strokeWidth="1" fill="none" opacity="0.4"/>
          <circle cx="60" cy="60" r="8" fill="#D4AF37"/>
          <path d="M60 20 L60 10 M60 110 L60 100 M20 60 L10 60 M110 60 L100 60" stroke="#D4AF37" strokeWidth="1" opacity="0.5"/>
          <path d="M32 32 L26 26 M88 32 L94 26 M32 88 L26 94 M88 88 L94 94" stroke="#D4AF37" strokeWidth="1" opacity="0.3"/>
        </svg>
      </div>

      <h1 className="font-serif text-2xl sm:text-3xl text-white mb-4 leading-tight">
        {quizMeta.title}
      </h1>

      <p className="text-white/60 text-sm sm:text-base max-w-md mb-8 leading-relaxed">
        {quizMeta.subtitle} &mdash; und die Farbe, in der deine Seele spricht.
      </p>

      <div className="flex gap-6 text-white/40 text-xs mb-10">
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span>3 Minuten</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          </svg>
          <span>12 Fragen</span>
        </div>
      </div>

      <button
        onClick={onStart}
        className="bg-[#D4AF37] text-[#00050A] font-semibold px-8 py-3.5 rounded-xl text-base hover:bg-[#E8C878] transition-colors shadow-lg shadow-[#D4AF37]/20"
      >
        Enth&uuml;lle deine Aura
      </button>

      <p className="text-[11px] text-white/30 text-center mt-8 max-w-sm">
        {quizMeta.disclaimer}
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
  dimensionLabel,
  onAnswer,
}: {
  question: typeof questions[0];
  index: number;
  total: number;
  dimensionLabel?: string;
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

      {dimensionLabel && (
        <p className="text-[#D4AF37]/70 text-xs uppercase tracking-widest mb-3 font-sans">
          {dimensionLabel}
        </p>
      )}
      <h2 className="font-serif text-xl sm:text-2xl text-white mb-3 leading-snug">
        {question.text}
      </h2>
      {question.context && (
        <p className="text-white/40 text-sm italic mb-6 border-l-2 border-[#D4AF37]/30 pl-4">
          {question.context}
        </p>
      )}

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
      <p className="font-serif text-xl text-white mb-2">Deine Aura entfaltet sich...</p>
      <p className="text-sm text-white/50">Die Farben werden sichtbar</p>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCREEN: RESULT
// ═══════════════════════════════════════════════════════════════

function ResultScreen({
  result,
  onRestart,
  onClose,
  showDescription,
  setShowDescription,
}: {
  result: QuizResult;
  onRestart: () => void;
  onClose: () => void;
  showDescription: boolean;
  setShowDescription: (v: boolean) => void;
}) {
  const { primary, secondary, element } = result;

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

        {/* Dynamic glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${primary.color}25 0%, transparent 60%)`
          }}
        />

        <div className="relative z-10">
          {/* Badge */}
          <p className="text-[#D4AF37] text-xs font-semibold uppercase tracking-[0.12em] mb-3 text-center">
            Deine Aura
          </p>

          {/* Aura Visual */}
          <div className="w-32 h-32 mx-auto mb-6 relative">
            <div
              className="w-full h-full rounded-full opacity-60 animate-[pulse_3s_ease-in-out_infinite]"
              style={{
                background: `radial-gradient(circle, ${primary.color} 0%, transparent 70%)`
              }}
            />
            <div
              className="absolute top-1/4 left-1/4 w-1/2 h-1/2 rounded-full"
              style={{
                background: primary.color,
                boxShadow: `0 0 40px ${primary.color}`
              }}
            />
          </div>

          {/* Title & Archetype */}
          <h2 className="font-serif text-2xl text-white mb-1 text-center">{primary.title}</h2>
          <p className="font-serif text-base text-[#C4A86C] italic text-center mb-6">
            &bdquo;{primary.archetype}&ldquo;
          </p>
          <p className="text-sm text-white/60 leading-relaxed text-center mb-5">
            {primary.tagline}
          </p>

          {/* Secondary Color & Element */}
          <div className="flex justify-center gap-6 mb-6 p-4 rounded-xl bg-black/20">
            <div className="text-center">
              <div className="text-xs uppercase tracking-wider mb-2 text-white/50">Zweitfarbe</div>
              <div className="flex items-center gap-2 text-white">
                <span
                  className="w-3 h-3 rounded-full inline-block"
                  style={{ background: secondary.color }}
                />
                <span className="font-serif">{secondary.title.split(' ').pop()}</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs uppercase tracking-wider mb-2 text-white/50">Element</div>
              <div className="font-serif text-white">{element.name}</div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {primary.stats.map((stat) => (
              <div key={stat.label} className="bg-[#041726]/50 rounded-lg p-3 text-center">
                <p className="text-[10px] text-white/50 uppercase tracking-wider mb-1">{stat.label}</p>
                <p className="font-serif text-lg font-semibold text-[#D4AF37]">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Compatibility */}
          <div className="bg-[#041726]/40 rounded-xl p-4 mb-5">
            <div className="flex justify-between items-center text-sm mb-2 pb-2 border-b border-white/10">
              <span className="text-white/50">Verb&uuml;ndete</span>
              <div className="flex gap-2">
                {primary.allies.map(ally => (
                  <span
                    key={ally}
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{ background: profiles[ally]?.color }}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-white/50">Herausforderung</span>
              <div className="flex gap-2">
                {primary.nemesis.map(nem => (
                  <span
                    key={nem}
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{ background: profiles[nem]?.color }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Description Toggle */}
          <div className="rounded-2xl p-4 bg-black/15">
            <button
              onClick={() => setShowDescription(!showDescription)}
              className="w-full flex items-center justify-center gap-2 text-sm py-2 text-[#D4AF37]"
            >
              <span>Mehr &uuml;ber deine Aura erfahren</span>
              <span className={`transition-transform duration-200 ${showDescription ? 'rotate-180' : 'rotate-0'}`}>
                &#9660;
              </span>
            </button>
            {showDescription && (
              <p className="mt-4 text-sm leading-relaxed whitespace-pre-line text-left text-white/60">
                {primary.description}
              </p>
            )}
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
        {quizMeta.disclaimer}
      </p>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function AuraColorsQuiz({ onComplete, onClose }: AuraColorsQuizProps) {
  const [screen, setScreen] = useState<Screen>('intro');
  const [questionIdx, setQuestionIdx] = useState(0);
  const [scores, setScores] = useState<DimensionScores>({
    energiefluss: 0,
    rhythmus: 0,
    wahrnehmung: 0,
    resonanz: 0
  });
  const [collectedMarkers, setCollectedMarkers] = useState<CollectedMarker[]>([]);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [showDescription, setShowDescription] = useState(false);

  const currentQ = questions[questionIdx];
  const currentDimension = dimensions.find(d => d.id === currentQ?.dimension);

  const handleStart = useCallback(() => {
    setScreen('quiz');
    setQuestionIdx(0);
    setScores({ energiefluss: 0, rhythmus: 0, wahrnehmung: 0, resonanz: 0 });
    setCollectedMarkers([]);
    setResult(null);
    setShowDescription(false);
  }, []);

  const handleAnswer = useCallback(
    (optionIdx: number) => {
      const question = questions[questionIdx];
      const option = question.options[optionIdx];

      // Accumulate scores
      setScores((prev) => {
        const next = { ...prev };
        if (option.scores) {
          for (const [key, value] of Object.entries(option.scores)) {
            next[key] = (next[key] ?? 0) + value;
          }
        }
        return next;
      });

      // Collect markers
      if (option.markers) {
        setCollectedMarkers((prev) => [...prev, ...option.markers!]);
      }

      if (questionIdx + 1 < questions.length) {
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
      const normalized = normalizeScores(scores);
      const colorScores = calculateColorScores(normalized);

      const primaryColorId = determinePrimaryColor(colorScores);
      const secondaryColorId = determineSecondaryColor(colorScores, primaryColorId);
      const elementId = determineElement(normalized);

      const primary = profiles[primaryColorId];
      const secondary = profiles[secondaryColorId];
      const element = elements[elementId];

      setResult({ primary, secondary, element });
      setScreen('result');
      onComplete(auraToEvent(primaryColorId, colorScores));
    }, 2200);
    return () => clearTimeout(timer);
  }, [screen, scores, collectedMarkers, onComplete]);

  return (
    <div className="relative w-full h-full min-h-[500px] flex flex-col">
      <CloseButton onClick={onClose} />

      <AnimatePresence mode="wait">
        {screen === 'intro' && <IntroScreen key="intro" onStart={handleStart} />}

        {screen === 'quiz' && (
          <QuestionScreen
            key={`q-${questionIdx}`}
            question={currentQ}
            index={questionIdx}
            total={questions.length}
            dimensionLabel={currentDimension?.label}
            onAnswer={handleAnswer}
          />
        )}

        {screen === 'loading' && <LoadingScreen key="loading" />}

        {screen === 'result' && result && (
          <ResultScreen
            key="result"
            result={result}
            onRestart={handleStart}
            onClose={onClose}
            showDescription={showDescription}
            setShowDescription={setShowDescription}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
