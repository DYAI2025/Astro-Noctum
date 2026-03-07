import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { ContributionEvent } from '@/src/lib/lme/types';
import { krafttierToEvent } from '@/src/lib/fusion-ring/quiz-to-event';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface KrafttierQuizProps {
  onComplete: (event: ContributionEvent) => void;
  onClose: () => void;
}

interface QuizOption {
  text: string;
  scores: Record<string, number>;
}

interface QuizQuestion {
  id: string;
  scenario: string;
  text: string;
  options: QuizOption[];
}

interface AnimalStat {
  label: string;
  value: string;
}

interface AnimalProfile {
  id: string;
  name: string;
  title: string;
  emoji: string;
  description: string;
  stats: AnimalStat[];
  allies: string;
  nemesis: string;
}

type Screen = 'intro' | 'quiz' | 'loading' | 'result';

// ═══════════════════════════════════════════════════════════════
// SCORE KEYS
// ═══════════════════════════════════════════════════════════════

type ScoreKey =
  | 'mut' | 'instinkt' | 'sozial' | 'weisheit' | 'schatten'
  | 'klarheit' | 'freiheit' | 'neugier' | 'anpassung'
  | 'erdung' | 'flow' | 'freude' | 'vorsicht';

const INITIAL_SCORES: Record<ScoreKey, number> = {
  mut: 0, instinkt: 0, sozial: 0, weisheit: 0, schatten: 0,
  klarheit: 0, freiheit: 0, neugier: 0, anpassung: 0,
  erdung: 0, flow: 0, freude: 0, vorsicht: 0,
};

// ═══════════════════════════════════════════════════════════════
// QUESTIONS
// ═══════════════════════════════════════════════════════════════

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    scenario: 'Der Nebel lichtet sich...',
    text: 'Du stehst vor einem unbekannten Pfad im Wald. Wie reagierst du?',
    options: [
      { text: 'Ich gehe voran \u2013 Neuland ruft nach mir', scores: { mut: 5, instinkt: 3, freiheit: 4 } },
      { text: 'Ich beobachte erst, lese die Zeichen', scores: { weisheit: 5, klarheit: 4, vorsicht: 3 } },
      { text: 'Ich suche Begleitung f\u00fcr die Reise', scores: { sozial: 5, erdung: 3, anpassung: 2 } },
      { text: 'Ich finde meinen eigenen Weg abseits des Pfades', scores: { neugier: 4, freiheit: 5, instinkt: 3 } },
    ],
  },
  {
    id: 'q2',
    scenario: 'In einer stillen Nacht...',
    text: 'Welche Energie zieht dich am meisten an?',
    options: [
      { text: 'Die Kraft der Gemeinschaft \u2013 zusammen sind wir stark', scores: { sozial: 5, erdung: 4, mut: 2 } },
      { text: 'Die Stille der Betrachtung \u2013 Weisheit kommt von innen', scores: { weisheit: 5, schatten: 3, vorsicht: 4 } },
      { text: 'Das Feuer der Leidenschaft \u2013 leben ohne Grenzen', scores: { mut: 5, instinkt: 4, freiheit: 3 } },
      { text: 'Das Spielerische des Moments \u2013 Freude ist die Antwort', scores: { freude: 5, flow: 4, anpassung: 3 } },
    ],
  },
  {
    id: 'q3',
    scenario: 'Ein Konflikt entsteht...',
    text: 'Wie gehst du mit Herausforderungen um?',
    options: [
      { text: 'Ich stelle mich direkt \u2013 Konfrontation bringt Klarheit', scores: { mut: 5, instinkt: 4, klarheit: 3 } },
      { text: 'Ich suche den diplomatischen Weg', scores: { sozial: 4, anpassung: 5, weisheit: 3 } },
      { text: 'Ich beobachte aus der Distanz und warte ab', scores: { weisheit: 4, schatten: 4, vorsicht: 5 } },
      { text: 'Ich finde kreative Umwege', scores: { neugier: 5, anpassung: 4, flow: 3 } },
    ],
  },
  {
    id: 'q4',
    scenario: 'Der Vollmond scheint...',
    text: 'Wann f\u00fchlst du dich am lebendigsten?',
    options: [
      { text: 'Umgeben von Menschen, die ich liebe', scores: { sozial: 5, freude: 4, erdung: 3 } },
      { text: 'Allein in der Natur, eins mit allem', scores: { freiheit: 5, instinkt: 4, erdung: 3 } },
      { text: 'Wenn ich ein R\u00e4tsel gel\u00f6st habe', scores: { weisheit: 5, neugier: 4, klarheit: 3 } },
      { text: 'In Momenten purer Bewegung und Aktion', scores: { mut: 4, flow: 5, instinkt: 4 } },
    ],
  },
  {
    id: 'q5',
    scenario: 'Das Wasser ruft...',
    text: 'Was bedeutet St\u00e4rke f\u00fcr dich?',
    options: [
      { text: 'Furchtlos voranzugehen, egal was kommt', scores: { mut: 5, instinkt: 3, freiheit: 3 } },
      { text: 'Die Ruhe zu bewahren im Sturm', scores: { erdung: 5, weisheit: 4, klarheit: 3 } },
      { text: 'Andere zu sch\u00fctzen und zu f\u00fchren', scores: { sozial: 5, mut: 3, erdung: 3 } },
      { text: 'Sich anzupassen ohne sich selbst zu verlieren', scores: { anpassung: 5, flow: 4, neugier: 3 } },
    ],
  },
  {
    id: 'q6',
    scenario: 'Ein Geheimnis wartet...',
    text: 'Was treibt dich am meisten an?',
    options: [
      { text: 'Der Drang, das Unbekannte zu erforschen', scores: { neugier: 5, freiheit: 4, mut: 3 } },
      { text: 'Das Bed\u00fcrfnis nach tiefem Verst\u00e4ndnis', scores: { weisheit: 5, schatten: 4, klarheit: 3 } },
      { text: 'Die Sehnsucht nach Verbindung', scores: { sozial: 5, freude: 3, erdung: 3 } },
      { text: 'Der Wunsch, etwas Bleibendes zu schaffen', scores: { erdung: 5, mut: 3, klarheit: 4 } },
    ],
  },
  {
    id: 'q7',
    scenario: 'Die Schatten werden l\u00e4nger...',
    text: 'Wie verarbeitest du schwierige Zeiten?',
    options: [
      { text: 'Ich ziehe mich zur\u00fcck und reflektiere', scores: { weisheit: 4, schatten: 5, vorsicht: 4 } },
      { text: 'Ich suche Trost bei meinen Liebsten', scores: { sozial: 5, erdung: 4, freude: 2 } },
      { text: 'Ich handle \u2013 Bewegung heilt', scores: { mut: 4, instinkt: 5, flow: 3 } },
      { text: 'Ich finde Humor und Leichtigkeit', scores: { freude: 5, anpassung: 4, flow: 3 } },
    ],
  },
  {
    id: 'q8',
    scenario: 'Der Wind tr\u00e4gt Geschichten...',
    text: 'Welche Eigenschaft bewunderst du am meisten?',
    options: [
      { text: 'Unersch\u00fctterliche Loyalit\u00e4t', scores: { sozial: 5, erdung: 4, mut: 2 } },
      { text: 'Scharfsinnige Weisheit', scores: { weisheit: 5, klarheit: 4, schatten: 3 } },
      { text: 'Grenzenlose Freiheit', scores: { freiheit: 5, mut: 4, instinkt: 3 } },
      { text: 'Ansteckende Lebensfreude', scores: { freude: 5, flow: 4, sozial: 3 } },
    ],
  },
  {
    id: 'q9',
    scenario: 'Am Scheideweg...',
    text: 'Wie triffst du wichtige Entscheidungen?',
    options: [
      { text: 'Aus dem Bauch heraus \u2013 mein Instinkt t\u00e4uscht selten', scores: { instinkt: 5, mut: 4, flow: 3 } },
      { text: 'Nach gr\u00fcndlicher Analyse aller Optionen', scores: { weisheit: 5, vorsicht: 4, klarheit: 4 } },
      { text: 'Im Gespr\u00e4ch mit Menschen, denen ich vertraue', scores: { sozial: 5, erdung: 3, anpassung: 3 } },
      { text: 'Ich probiere einfach aus und lerne daraus', scores: { neugier: 5, anpassung: 4, freude: 3 } },
    ],
  },
  {
    id: 'q10',
    scenario: 'Das Echo deiner Seele...',
    text: 'Was ist deine gr\u00f6\u00dfte Gabe?',
    options: [
      { text: 'Mut \u2013 ich gehe, wohin andere nicht wagen', scores: { mut: 5, freiheit: 4, instinkt: 3 } },
      { text: 'Empathie \u2013 ich f\u00fchle, was andere verbergen', scores: { sozial: 5, weisheit: 3, schatten: 3 } },
      { text: 'Klarheit \u2013 ich sehe durch den Nebel', scores: { klarheit: 5, weisheit: 4, vorsicht: 3 } },
      { text: 'Anpassung \u2013 ich flie\u00dfe wie Wasser', scores: { anpassung: 5, flow: 4, freude: 3 } },
    ],
  },
  {
    id: 'q11',
    scenario: 'Das Feuer brennt...',
    text: 'Was gibt dir Kraft, wenn alles dunkel scheint?',
    options: [
      { text: 'Der Glaube an mich selbst', scores: { mut: 5, erdung: 4, instinkt: 3 } },
      { text: 'Die Verbindung zu meinem Rudel', scores: { sozial: 5, freude: 3, erdung: 4 } },
      { text: 'Das Wissen, dass alles seinen Sinn hat', scores: { weisheit: 5, schatten: 4, klarheit: 3 } },
      { text: 'Die Hoffnung auf neue Abenteuer', scores: { freiheit: 4, neugier: 5, flow: 4 } },
    ],
  },
  {
    id: 'q12',
    scenario: 'Die Vision wird klar...',
    text: 'Welches Element ruft am lautesten nach dir?',
    options: [
      { text: 'Erde \u2013 stark, best\u00e4ndig, verwurzelt', scores: { erdung: 5, mut: 4, sozial: 3 } },
      { text: 'Luft \u2013 frei, erhaben, klar', scores: { freiheit: 5, klarheit: 4, weisheit: 3 } },
      { text: 'Wasser \u2013 flie\u00dfend, spielerisch, tief', scores: { flow: 5, freude: 4, anpassung: 4 } },
      { text: 'Schatten \u2013 mysteri\u00f6s, weise, verborgen', scores: { schatten: 5, weisheit: 4, neugier: 3 } },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// ANIMAL PROFILES
// ═══════════════════════════════════════════════════════════════

const PROFILES: Record<string, AnimalProfile> = {
  wolf: {
    id: 'wolf',
    name: 'Der Wolf',
    title: 'H\u00fcter des Rudels',
    emoji: '\ud83d\udc3a',
    description:
      'Der Wolf erwacht in dir \u2013 loyal, instinktiv und zutiefst verbunden mit deinem Rudel. Du f\u00fchrst nicht durch Dominanz, sondern durch das tiefe Verst\u00e4ndnis, dass wahre St\u00e4rke in der Gemeinschaft liegt.',
    stats: [
      { label: 'Loyalit\u00e4t', value: '98%' },
      { label: 'Instinkt', value: '94%' },
      { label: 'F\u00fchrung', value: '91%' },
      { label: 'Intuition', value: '87%' },
    ],
    allies: 'Adler \u2022 B\u00e4r',
    nemesis: 'Fuchs',
  },
  owl: {
    id: 'owl',
    name: 'Die Eule',
    title: 'Seherin der Nacht',
    emoji: '\ud83e\udd89',
    description:
      'Die Eule wacht in dir \u2013 weise, geduldig und mit der Gabe, durch den Schleier der Illusion zu blicken. Du siehst, was anderen verborgen bleibt, und findest Weisheit in der Stille der Nacht.',
    stats: [
      { label: 'Weisheit', value: '97%' },
      { label: 'Intuition', value: '95%' },
      { label: 'Geduld', value: '92%' },
      { label: 'Klarheit', value: '89%' },
    ],
    allies: 'Fuchs \u2022 Wolf',
    nemesis: 'Delfin',
  },
  eagle: {
    id: 'eagle',
    name: 'Der Adler',
    title: 'Herrscher der L\u00fcfte',
    emoji: '\ud83e\udd85',
    description:
      'Der Adler erwacht in dir \u2013 frei, weitblickend und mit dem Mut, \u00fcber alle Grenzen hinauszufliegen. Du siehst das gro\u00dfe Ganze und scheust nicht davor, deinen eigenen Weg in den Himmel zu bahnen.',
    stats: [
      { label: 'Freiheit', value: '99%' },
      { label: 'Weitblick', value: '96%' },
      { label: 'Mut', value: '93%' },
      { label: 'Klarheit', value: '90%' },
    ],
    allies: 'Wolf \u2022 B\u00e4r',
    nemesis: 'Eule',
  },
  bear: {
    id: 'bear',
    name: 'Der B\u00e4r',
    title: 'W\u00e4chter der Erde',
    emoji: '\ud83d\udc3b',
    description:
      'Der B\u00e4r erwacht in dir \u2013 stark, geerdet und mit der Kraft der stillen Beharrlichkeit. Du wei\u00dft, wann es Zeit ist zu handeln und wann es Zeit ist zu ruhen \u2013 und du f\u00fcrchtest keine Herausforderung.',
    stats: [
      { label: 'St\u00e4rke', value: '98%' },
      { label: 'Erdung', value: '95%' },
      { label: 'Geduld', value: '92%' },
      { label: 'Schutz', value: '94%' },
    ],
    allies: 'Adler \u2022 Wolf',
    nemesis: 'Fuchs',
  },
  fox: {
    id: 'fox',
    name: 'Der Fuchs',
    title: 'Meister der Anpassung',
    emoji: '\ud83e\udd8a',
    description:
      'Der Fuchs erwacht in dir \u2013 clever, neugierig und mit der Gabe, in jeder Situation den richtigen Weg zu finden. Du tanzt zwischen den Welten und findest L\u00f6sungen, wo andere nur Probleme sehen.',
    stats: [
      { label: 'Cleverness', value: '97%' },
      { label: 'Anpassung', value: '95%' },
      { label: 'Neugier', value: '93%' },
      { label: 'Charme', value: '91%' },
    ],
    allies: 'Eule \u2022 Delfin',
    nemesis: 'Wolf',
  },
  dolphin: {
    id: 'dolphin',
    name: 'Der Delfin',
    title: 'Botschafter der Freude',
    emoji: '\ud83d\udc2c',
    description:
      'Der Delfin lebt in dir \u2013 spielerisch, kommunikativ und mit einer ansteckenden Lebensfreude. Du gleitest durch die Wellen des Lebens mit Anmut und findest selbst in tiefen Gew\u00e4ssern Grund zur Freude.',
    stats: [
      { label: 'Freude', value: '99%' },
      { label: 'Flow', value: '97%' },
      { label: 'Spiel', value: '95%' },
      { label: 'Verbindung', value: '93%' },
    ],
    allies: 'Fuchs \u2022 Adler',
    nemesis: 'Eule',
  },
};

// ═══════════════════════════════════════════════════════════════
// SCORING LOGIC
// ═══════════════════════════════════════════════════════════════

function calculateAnimal(scores: Record<string, number>): string {
  const animalScores: Record<string, number> = {
    wolf:    (scores.sozial ?? 0) * 2 + (scores.instinkt ?? 0) * 1.5 + (scores.mut ?? 0) + (scores.erdung ?? 0) * 0.8,
    owl:     (scores.weisheit ?? 0) * 2 + (scores.schatten ?? 0) * 1.5 + (scores.klarheit ?? 0) + (scores.vorsicht ?? 0) * 0.8,
    eagle:   (scores.freiheit ?? 0) * 2 + (scores.klarheit ?? 0) * 1.5 + (scores.mut ?? 0) + (scores.weisheit ?? 0) * 0.5,
    bear:    (scores.erdung ?? 0) * 2 + (scores.mut ?? 0) * 1.5 + (scores.weisheit ?? 0) + (scores.sozial ?? 0) * 0.5,
    fox:     (scores.neugier ?? 0) * 2 + (scores.anpassung ?? 0) * 1.5 + (scores.weisheit ?? 0) + (scores.flow ?? 0) * 0.8,
    dolphin: (scores.freude ?? 0) * 2 + (scores.flow ?? 0) * 1.5 + (scores.anpassung ?? 0) + (scores.sozial ?? 0) * 0.5,
  };

  let bestAnimal = 'wolf';
  let bestScore = -1;
  for (const [animal, score] of Object.entries(animalScores)) {
    if (score > bestScore) {
      bestScore = score;
      bestAnimal = animal;
    }
  }
  return bestAnimal;
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
      {/* Decorative icon */}
      <div className="w-20 h-20 mb-8 relative">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_20px_rgba(212,175,55,0.4)]">
          <g stroke="#D4AF37" strokeWidth="1.5" fill="none">
            <circle cx="50" cy="50" r="35" opacity="0.3" />
            <circle cx="50" cy="50" r="25" opacity="0.5" />
            <path d="M50 20 L50 30 M50 70 L50 80 M20 50 L30 50 M70 50 L80 50" strokeLinecap="round" />
            <path d="M35 35 Q50 25 65 35 Q75 50 65 65 Q50 75 35 65 Q25 50 35 35" strokeLinecap="round" />
            <circle cx="50" cy="50" r="8" />
            <circle cx="50" cy="50" r="3" fill="#D4AF37" />
          </g>
        </svg>
      </div>

      <h1 className="font-serif text-2xl sm:text-3xl text-white mb-4 leading-tight">
        Welcher uralte{' '}
        <span className="text-[#D4AF37]">W&auml;chter</span>{' '}
        schlummert in deiner Seele?
      </h1>

      <p className="text-white/60 text-sm sm:text-base max-w-md mb-8 leading-relaxed">
        Entdecke das archetypische Krafttier, das seit jeher &uuml;ber dich wacht &ndash;
        und lerne die verborgene Sprache deiner Instinkte verstehen.
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
        Reise beginnen
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

      <p className="text-[#D4AF37]/70 text-xs uppercase tracking-widest mb-3 font-sans">
        {question.scenario}
      </p>
      <h2 className="font-serif text-xl sm:text-2xl text-white mb-8 leading-snug">
        {question.text}
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
      <p className="font-serif text-xl text-white mb-2">Die Geister erwachen...</p>
      <p className="text-sm text-white/50">Dein Krafttier offenbart sich</p>
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
  profile: AnimalProfile;
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
            Dein Krafttier
          </p>
          <div className="text-6xl mb-4">{profile.emoji}</div>
          <h2 className="font-serif text-2xl text-white mb-1">{profile.name}</h2>
          <p className="font-serif text-base text-[#C4A86C] italic">{profile.title}</p>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent my-5" />

        {/* Description */}
        <p className="text-sm text-white/60 leading-relaxed text-center mb-5">
          {profile.description}
        </p>

        {/* Stats Grid */}
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
            <span className="font-medium text-[#8FB8A8]">{profile.allies}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-white/50">Herausforderung</span>
            <span className="font-medium text-[#C45D4A]">{profile.nemesis}</span>
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

export default function KrafttierQuiz({ onComplete, onClose }: KrafttierQuizProps) {
  const [screen, setScreen] = useState<Screen>('intro');
  const [questionIdx, setQuestionIdx] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({ ...INITIAL_SCORES });
  const [resultAnimal, setResultAnimal] = useState<string | null>(null);

  const handleStart = useCallback(() => {
    setScreen('quiz');
    setQuestionIdx(0);
    setScores({ ...INITIAL_SCORES });
    setResultAnimal(null);
  }, []);

  const handleAnswer = useCallback(
    (optionIdx: number) => {
      const question = QUESTIONS[questionIdx];
      const option = question.options[optionIdx];

      setScores((prev) => {
        const next = { ...prev };
        for (const [key, value] of Object.entries(option.scores)) {
          next[key] = (next[key] ?? 0) + value;
        }
        return next;
      });

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
      const animal = calculateAnimal(scores);
      setResultAnimal(animal);
      setScreen('result');
      onComplete(krafttierToEvent(animal));
    }, 2200);
    return () => clearTimeout(timer);
  }, [screen, scores, onComplete]);

  const profile = resultAnimal ? PROFILES[resultAnimal] : null;

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

        {screen === 'result' && profile && (
          <ResultScreen key="result" profile={profile} onRestart={handleStart} onClose={onClose} />
        )}
      </AnimatePresence>
    </div>
  );
}
