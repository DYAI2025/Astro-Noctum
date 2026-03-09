import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { ContributionEvent } from '@/src/lib/lme/types';
import { celebritySoulmateToEvent } from '@/src/lib/fusion-ring/quiz-to-event';
import { celebrities, Celebrity } from './celebrity-soulmate/data';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface CelebritySoulmateQuizProps {
  onComplete: (event: ContributionEvent) => void;
  onClose: () => void;
}

type Screen = 'intro' | 'quiz' | 'loading' | 'result';

interface QuizQuestion {
  scenario: string;
  question: string;
  options: Array<{
    text: string;
    emoji: string;
    scores: { E: number; K: number; B: number; A: number };
  }>;
}

interface MatchResult {
  match: Celebrity & { matchPercent: number };
  runnerUps: Array<Celebrity & { matchPercent: number }>;
  ally: Celebrity;
  rival: Celebrity;
}

// ═══════════════════════════════════════════════════════════════
// QUESTIONS (inline, same as source)
// ═══════════════════════════════════════════════════════════════

const QUESTIONS: QuizQuestion[] = [
  {
    scenario: "Ein spontaner Roadtrip wird geplant...",
    question: "Wie reagierst du?",
    options: [
      { text: "Ich \u00fcbernehme die Planung \u2013 jemand muss ja", emoji: "\ud83d\udccb", scores: { E: 0, K: -1, B: 1, A: 1 } },
      { text: "Klingt wild, ich bin dabei \u2013 wohin geht\u2019s?", emoji: "\ud83d\ude97", scores: { E: 2, K: 1, B: 1, A: 0 } },
      { text: "K\u00f6nnte ich dar\u00fcber nachdenken? Spontan ist nicht so meins", emoji: "\ud83e\udd14", scores: { E: -2, K: 0, B: 0, A: 0 } },
      { text: "Nur wenn ich die Playlist kontrolliere", emoji: "\ud83c\udfb5", scores: { E: 0, K: 2, B: 0, A: -1 } }
    ]
  },
  {
    scenario: "Dein Projekt wird \u00f6ffentlich kritisiert...",
    question: "Was ist dein erster Impuls?",
    options: [
      { text: "Die Kritik analysieren \u2013 ist da was dran?", emoji: "\ud83d\udd0d", scores: { E: -1, K: 0, B: 0, A: 1 } },
      { text: "Verteidigen, was ich gemacht habe", emoji: "\u2694\ufe0f", scores: { E: 1, K: 0, B: -1, A: 1 } },
      { text: "Mit Freunden dar\u00fcber reden, das tut gut", emoji: "\ud83d\udcac", scores: { E: 1, K: 0, B: 2, A: 0 } },
      { text: "Ignorieren und weitermachen \u2013 Hater gonna hate", emoji: "\ud83d\ude0e", scores: { E: 0, K: 1, B: -1, A: 0 } }
    ]
  },
  {
    scenario: "Du gewinnst unerwartet 10.000\u20ac...",
    question: "Was passiert damit?",
    options: [
      { text: "Investieren \u2013 langfristig denken", emoji: "\ud83d\udcc8", scores: { E: -1, K: 0, B: 0, A: 2 } },
      { text: "Ein Teil f\u00fcr mich, ein Teil f\u00fcr andere", emoji: "\ud83d\udc9d", scores: { E: 0, K: 0, B: 2, A: 0 } },
      { text: "Endlich das kreative Projekt starten", emoji: "\ud83c\udfa8", scores: { E: 0, K: 2, B: 0, A: 1 } },
      { text: "Erstmal feiern \u2013 das Leben ist kurz", emoji: "\ud83c\udf89", scores: { E: 2, K: 1, B: 1, A: -1 } }
    ]
  },
  {
    scenario: "Auf einer Party kennst du niemanden...",
    question: "Wie verh\u00e4ltst du dich?",
    options: [
      { text: "Aktiv auf Leute zugehen und Gespr\u00e4che starten", emoji: "\ud83d\ude4b", scores: { E: 2, K: 0, B: 1, A: 0 } },
      { text: "Erstmal beobachten, dann selektiv ansprechen", emoji: "\ud83d\udc40", scores: { E: -1, K: 1, B: 0, A: 0 } },
      { text: "Eine Person finden und tiefes Gespr\u00e4ch f\u00fchren", emoji: "\ud83e\udec2", scores: { E: 0, K: 0, B: 2, A: 0 } },
      { text: "Ehrlich? Wahrscheinlich fr\u00fch gehen", emoji: "\ud83d\udeaa", scores: { E: -2, K: 0, B: -1, A: 0 } }
    ]
  },
  {
    scenario: "Dir wird eine F\u00fchrungsposition angeboten...",
    question: "Was denkst du zuerst?",
    options: [
      { text: "Endlich \u2013 das habe ich verdient", emoji: "\ud83d\udc51", scores: { E: 1, K: 0, B: 0, A: 2 } },
      { text: "Kann ich das Team gut f\u00fchren?", emoji: "\ud83e\udd1d", scores: { E: 0, K: 0, B: 2, A: 1 } },
      { text: "Weniger kreative Freiheit \u2013 ist es das wert?", emoji: "\ud83c\udfad", scores: { E: 0, K: 2, B: 0, A: -1 } },
      { text: "Ich brauche Zeit, das zu verarbeiten", emoji: "\u23f8\ufe0f", scores: { E: -1, K: 0, B: 0, A: 0 } }
    ]
  },
  {
    scenario: "Ein Freund ist emotional am Limit...",
    question: "Wie hilfst du?",
    options: [
      { text: "Praktische L\u00f6sungen vorschlagen", emoji: "\ud83d\udee0\ufe0f", scores: { E: 0, K: 0, B: 0, A: 2 } },
      { text: "Einfach da sein und zuh\u00f6ren", emoji: "\ud83d\udc9c", scores: { E: 0, K: 0, B: 2, A: -1 } },
      { text: "Ablenkung organisieren \u2013 rausgehen, was unternehmen", emoji: "\ud83c\udfaa", scores: { E: 2, K: 1, B: 1, A: 0 } },
      { text: "Tief eintauchen in die Gef\u00fchle, gemeinsam durcharbeiten", emoji: "\ud83c\udf0a", scores: { E: -1, K: 1, B: 2, A: 0 } }
    ]
  },
  {
    scenario: "Du musst dich zwischen zwei Jobs entscheiden...",
    question: "Was wiegt schwerer?",
    options: [
      { text: "Das Gehalt und die Sicherheit", emoji: "\ud83c\udfe6", scores: { E: 0, K: -1, B: 0, A: 2 } },
      { text: "Das Team und die Kultur", emoji: "\ud83d\udc65", scores: { E: 1, K: 0, B: 2, A: 0 } },
      { text: "Die kreative Freiheit und Lernchancen", emoji: "\ud83d\ude80", scores: { E: 0, K: 2, B: 0, A: 0 } },
      { text: "Der Impact und die Bedeutung der Arbeit", emoji: "\ud83c\udf0d", scores: { E: 0, K: 1, B: 1, A: 1 } }
    ]
  },
  {
    scenario: "Dein Wochenende ist komplett frei...",
    question: "Was klingt am verlockendsten?",
    options: [
      { text: "Socializing \u2013 Freunde treffen, Aktivit\u00e4ten planen", emoji: "\ud83c\udf8a", scores: { E: 2, K: 0, B: 2, A: 0 } },
      { text: "Kreatives Projekt \u2013 endlich Zeit daf\u00fcr", emoji: "\u270f\ufe0f", scores: { E: -1, K: 2, B: 0, A: 0 } },
      { text: "Produktiv sein \u2013 Dinge erledigen", emoji: "\u2705", scores: { E: 0, K: -1, B: 0, A: 2 } },
      { text: "Absolute Ruhe \u2013 allein aufladen", emoji: "\ud83e\uddd8", scores: { E: -2, K: 0, B: -1, A: 0 } }
    ]
  },
  {
    scenario: "In einer Diskussion merkst du, dass du falsch liegst...",
    question: "Was passiert?",
    options: [
      { text: "Sofort zugeben \u2013 Ehrlichkeit ist wichtiger als Ego", emoji: "\ud83e\udd32", scores: { E: 0, K: 0, B: 2, A: 0 } },
      { text: "Erstmal die andere Position verstehen wollen", emoji: "\ud83e\uddd0", scores: { E: -1, K: 1, B: 1, A: 0 } },
      { text: "Zugeben, aber meine urspr\u00fcngliche Logik erkl\u00e4ren", emoji: "\ud83d\udcca", scores: { E: 0, K: 0, B: 0, A: 1 } },
      { text: "Inner cringe, aber smooth wechseln", emoji: "\ud83d\ude2c", scores: { E: 1, K: 1, B: 0, A: 0 } }
    ]
  },
  {
    scenario: "Du hast eine kontroverse Meinung...",
    question: "Wie gehst du damit um?",
    options: [
      { text: "Laut und stolz vertreten \u2013 authentisch bleiben", emoji: "\ud83d\udce2", scores: { E: 2, K: 1, B: -1, A: 0 } },
      { text: "Nur mit engen Freunden teilen", emoji: "\ud83e\udd2b", scores: { E: -1, K: 0, B: 1, A: 0 } },
      { text: "Diplomatisch verpacken, aber aussprechen", emoji: "\ud83c\udf81", scores: { E: 1, K: 0, B: 1, A: 1 } },
      { text: "F\u00fcr mich behalten \u2013 nicht jeder muss alles wissen", emoji: "\ud83d\udd12", scores: { E: -2, K: 0, B: 0, A: 1 } }
    ]
  },
  {
    scenario: "Ein riesige Chance kommt, aber das Timing ist schlecht...",
    question: "Was tust du?",
    options: [
      { text: "Zugreifen \u2013 solche Chancen kommen nicht oft", emoji: "\u26a1", scores: { E: 1, K: 1, B: -1, A: 2 } },
      { text: "Ablehnen \u2013 die bestehenden Commitments z\u00e4hlen", emoji: "\ud83e\udd1d", scores: { E: -1, K: 0, B: 2, A: 0 } },
      { text: "Verhandeln \u2013 vielleicht geht beides", emoji: "\ud83c\udfad", scores: { E: 1, K: 1, B: 0, A: 1 } },
      { text: "Rat holen bei Menschen, denen ich vertraue", emoji: "\ud83d\udcac", scores: { E: 0, K: 0, B: 2, A: 0 } }
    ]
  },
  {
    scenario: "Du k\u00f6nntest eine Sache an dir \u00e4ndern...",
    question: "Was w\u00e4re es?",
    options: [
      { text: "Weniger Overthinking, mehr Aktion", emoji: "\ud83e\udde0", scores: { E: -1, K: 1, B: 0, A: -1 } },
      { text: "Mehr Geduld mit anderen", emoji: "\u23f3", scores: { E: 0, K: 0, B: 1, A: 1 } },
      { text: "Mehr Selbstbewusstsein", emoji: "\ud83d\udcaa", scores: { E: -1, K: 0, B: 0, A: 0 } },
      { text: "Mehr Work-Life-Balance", emoji: "\u2696\ufe0f", scores: { E: 1, K: 0, B: 1, A: 2 } }
    ]
  }
];

// ═══════════════════════════════════════════════════════════════
// SCORING LOGIC
// ═══════════════════════════════════════════════════════════════

function computeMatch(finalScores: { E: number; K: number; B: number; A: number }): MatchResult {
  const matches = celebrities.map(celeb => {
    const distance = Math.sqrt(
      Math.pow(finalScores.E - celeb.E, 2) +
      Math.pow(finalScores.K - celeb.K, 2) +
      Math.pow(finalScores.B - celeb.B, 2) +
      Math.pow(finalScores.A - celeb.A, 2)
    );
    const matchPercent = Math.round(Math.max(0, 100 - (distance * 5.5)));
    return { ...celeb, distance, matchPercent };
  });

  matches.sort((a, b) => a.distance - b.distance);

  const topMatch = matches[0];
  const runnerUps = matches.slice(1, 6);
  const ally = matches.find(c => c.name !== topMatch.name && Math.abs(c.E - topMatch.E) <= 2 && c.category !== topMatch.category) || matches[2];
  const rival = matches.filter(c => c.name !== topMatch.name && (Math.abs(c.E - topMatch.E) >= 3 || Math.abs(c.A - topMatch.A) >= 3))[0] || matches[matches.length - 5];

  return { match: topMatch, runnerUps, ally, rival };
}

function generateDescription(match: Celebrity): string {
  const parts = [];
  parts.push(match.E >= 7 ? "Du teilst ihre F\u00e4higkeit, R\u00e4ume zu f\u00fcllen und Energie zu verbreiten" : match.E <= 4 ? "Wie du wei\u00df auch " + match.name + ", dass wahre St\u00e4rke in der Stille liegt" : "Ihr teilt die Gabe, Energie dosiert und strategisch einzusetzen");
  parts.push(match.K >= 7 ? "Eure K\u00f6pfe arbeiten \u00e4hnlich \u2013 unkonventionell, \u00fcberraschend, manchmal genial" : match.K <= 4 ? "Ihr beide sch\u00e4tzt das Bew\u00e4hrte und baut darauf auf" : "Kreativit\u00e4t ist f\u00fcr euch beide ein Werkzeug, kein Selbstzweck");
  parts.push(match.B >= 7 ? "Menschen sind f\u00fcr euch beide keine Ressourcen, sondern der eigentliche Punkt" : match.B <= 4 ? "Ihr braucht beide viel Freiraum und w\u00e4hlt eure Menschen sehr bewusst" : "Eure sozialen Batterien funktionieren \u00e4hnlich \u2013 selektiv, aber loyal");
  parts.push(match.A >= 7 ? "Ihr teilt den unbedingten Willen, Ergebnisse zu sehen" : match.A <= 4 ? "F\u00fcr euch beide z\u00e4hlt der Weg mindestens so sehr wie das Ziel" : "Ambition ja, aber nicht um jeden Preis \u2013 das verbindet euch");
  return parts.join(". ") + ".";
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
      <div className="text-6xl mb-8">\u2728\ud83c\udf1f\u2728</div>

      <h1 className="font-serif text-2xl sm:text-3xl text-white mb-4 leading-tight">
        Welcher <span className="text-[#D4AF37]">Star</span> ist dein Seelenverwandter?
      </h1>

      <p className="text-white/60 text-sm sm:text-base max-w-md mb-8 leading-relaxed">
        Entdecke, welcher von 100 Celebrities deine Energie teilt &ndash; basierend auf deiner
        Pers&ouml;nlichkeit, nicht deinem Geschmack.
      </p>

      <div className="flex gap-6 text-white/40 text-xs mb-10">
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span>~4 Minuten</span>
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
          <span>100 Stars</span>
        </div>
      </div>

      <button
        onClick={onStart}
        className="bg-[#D4AF37] text-[#00050A] font-semibold px-8 py-3.5 rounded-xl text-base hover:bg-[#E8C878] transition-colors shadow-lg shadow-[#D4AF37]/20"
      >
        Seelenverwandten finden
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
  onAnswer,
}: {
  question: QuizQuestion;
  index: number;
  total: number;
  onAnswer: (scores: { E: number; K: number; B: number; A: number }) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  const handleSelect = useCallback(
    (idx: number) => {
      if (selected !== null) return;
      setSelected(idx);
      setTimeout(() => onAnswer(question.options[idx].scores), 350);
    },
    [selected, onAnswer, question.options],
  );

  return (
    <motion.div
      key={`cq-${index}`}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="flex flex-col px-6 py-8 min-h-full"
    >
      <ProgressBar current={index} total={total} />

      <p className="text-[#D4AF37]/70 text-xs uppercase tracking-widest mb-3 font-sans">
        {question.scenario}
      </p>
      <h2 className="font-serif text-xl sm:text-2xl text-white mb-8 leading-snug">
        {question.question}
      </h2>

      <div className="flex flex-col gap-3">
        {question.options.map((option, idx) => {
          const isSelected = selected === idx;
          return (
            <button
              key={idx}
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
              <div className="flex items-center gap-3">
                <span className="text-2xl opacity-80">{option.emoji}</span>
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
      <p className="font-serif text-xl text-white mb-2">Scanne 100 Celebrity-Profile...</p>
      <p className="text-sm text-white/50">Berechne deine Seelenverwandtschaft</p>
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
}: {
  result: MatchResult;
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
            Dein Celebrity-Seelenverwandter
          </p>
          <h2 className="font-serif text-2xl text-white mb-2">{result.match.name}</h2>
          <p className="font-serif text-base text-[#C4A86C] italic">&quot;{result.match.tagline}&quot;</p>
        </div>

        {/* Match percentage */}
        <div className="flex justify-center mb-5">
          <span className="px-4 py-2 bg-[#D4AF37]/15 text-[#D4AF37] rounded-full font-bold border border-[#D4AF37]/30 text-sm">
            {result.match.matchPercent}% Seelenverwandtschaft
          </span>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent my-5" />

        {/* Description */}
        <p className="text-sm text-white/60 leading-relaxed text-center mb-5">
          {generateDescription(result.match)}
        </p>

        {/* Traits Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {result.match.traits.map((t, i) => (
            <div key={i} className="bg-[#041726]/50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-white/50 uppercase tracking-wider mb-1">Trait</p>
              <p className="font-serif text-sm font-semibold text-[#D4AF37]">{t}</p>
            </div>
          ))}
        </div>

        {/* Dynamics */}
        <div className="bg-[#041726]/40 rounded-xl p-4">
          <p className="text-[10px] text-center text-white/40 uppercase tracking-widest mb-3">
            Eure Celebrity-Dynamik
          </p>
          <div className="flex justify-between items-center text-sm mb-2 pb-2 border-b border-white/10">
            <span className="text-white/50">Beste Combo mit</span>
            <span className="font-medium text-[#8FB8A8]">{result.ally.name}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-white/50">Spannung mit</span>
            <span className="font-medium text-[#C45D4A]">{result.rival.name}</span>
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
        Dieser Test dient der spielerischen Selbstreflexion und stellt{' '}
        <strong>keine</strong> psychologische Diagnose dar.
      </p>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function CelebritySoulmateQuiz({ onComplete, onClose }: CelebritySoulmateQuizProps) {
  const [screen, setScreen] = useState<Screen>('intro');
  const [questionIdx, setQuestionIdx] = useState(0);
  const [scores, setScores] = useState({ E: 5, K: 5, B: 5, A: 5 });
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);

  const handleStart = useCallback(() => {
    setScreen('quiz');
    setQuestionIdx(0);
    setScores({ E: 5, K: 5, B: 5, A: 5 });
    setMatchResult(null);
  }, []);

  const handleAnswer = useCallback(
    (optionScores: { E: number; K: number; B: number; A: number }) => {
      setScores((prev) => ({
        E: Math.max(1, Math.min(10, prev.E + optionScores.E)),
        K: Math.max(1, Math.min(10, prev.K + optionScores.K)),
        B: Math.max(1, Math.min(10, prev.B + optionScores.B)),
        A: Math.max(1, Math.min(10, prev.A + optionScores.A)),
      }));

      if (questionIdx + 1 < QUESTIONS.length) {
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
      const result = computeMatch(scores);
      setMatchResult(result);
      setScreen('result');

      // Map scores to event mapper dimensions
      const norm = (v: number) => (v - 1) / 9;
      const eventScores: Record<string, number> = {
        charisma: norm(scores.E) * 100,
        creativity: norm(scores.K) * 100,
        empathy: norm(scores.B) * 100,
        ambition: norm(scores.A) * 100,
      };
      onComplete(celebritySoulmateToEvent(eventScores, result.match.name));
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
            question={QUESTIONS[questionIdx]}
            index={questionIdx}
            total={QUESTIONS.length}
            onAnswer={handleAnswer}
          />
        )}

        {screen === 'loading' && <LoadingScreen key="loading" />}

        {screen === 'result' && matchResult && (
          <ResultScreen key="result" result={matchResult} onRestart={handleStart} onClose={onClose} />
        )}
      </AnimatePresence>
    </div>
  );
}
