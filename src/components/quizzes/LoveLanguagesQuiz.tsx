import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { loveLangToEvent } from '@/src/lib/fusion-ring/quiz-to-event';
import type { ContributionEvent } from '@/src/lib/lme/types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface LoveLanguagesQuizProps {
  onComplete: (event: ContributionEvent) => void;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Quiz Data (German - kept from original)
// ---------------------------------------------------------------------------

type LoveDimension = 'touch' | 'words' | 'time' | 'gifts' | 'service';

interface QuizOption {
  id: string;
  text: string;
  /** How much this option contributes to each love-language dimension */
  scores: Partial<Record<LoveDimension, number>>;
}

interface QuizQuestion {
  id: string;
  context: string;
  text: string;
  options: QuizOption[];
}

interface ProfileStat {
  label: string;
  value: string;
}

interface QuizProfile {
  id: string;
  title: string;
  loveLanguage: string;
  primaryDimension: LoveDimension;
  tagline: string;
  description: string;
  stats: ProfileStat[];
  allies: string[];
  nemesis: string;
}

const DIMENSION_LABELS: Record<LoveDimension, string> = {
  touch: 'Koerperliche Naehe',
  words: 'Worte der Anerkennung',
  time: 'Qualitaetszeit',
  gifts: 'Geschenke',
  service: 'Hilfsbereitschaft',
};

// -- Questions ---------------------------------------------------------------
// Each option's scores are re-mapped from the original 3-axis system (d1/d2/d3)
// to the 5 love-language dimensions so that `loveLangToEvent` receives the
// correct keys: touch, words, time, gifts, service.

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    context: 'Es ist spaet. Dein Mensch hatte einen schweren Tag.',
    text: 'Was tust du instinktiv?',
    options: [
      { id: 'a', text: 'Ich sage die Worte, die niemand sonst findet', scores: { words: 3 } },
      { id: 'b', text: 'Ich halte einfach still \u2013 meine Arme sagen alles', scores: { touch: 3 } },
      { id: 'c', text: 'Ich handle: Tee, Decke, das Handy auf lautlos', scores: { service: 3 } },
      { id: 'd', text: 'Ich bleibe einfach da \u2013 meine Praesenz ist das Geschenk', scores: { time: 3 } },
    ],
  },
  {
    id: 'q2',
    context: 'Du denkst an einen perfekten Moment mit jemandem, den du liebst.',
    text: 'Was siehst du?',
    options: [
      { id: 'a', text: 'Ein Gespraech, das die Zeit vergessen laesst', scores: { words: 2, time: 1 } },
      { id: 'b', text: 'Haende, die sich finden, ohne hinzusehen', scores: { touch: 3 } },
      { id: 'c', text: 'Ein Ort, den wir gemeinsam gebaut haben', scores: { service: 2, gifts: 1 } },
      { id: 'd', text: 'Stille, die sich wie Zuhause anfuehlt', scores: { time: 3 } },
    ],
  },
  {
    id: 'q3',
    context: 'Du erhaeltst ein Geschenk von jemandem, der dich liebt.',
    text: 'Was beruehrt dich am meisten?',
    options: [
      { id: 'a', text: 'Die Karte \u2013 was jemand schreibt, vergesse ich nie', scores: { words: 3 } },
      { id: 'b', text: 'Die Muehe \u2013 dass jemand Zeit investiert hat', scores: { service: 2, time: 1 } },
      { id: 'c', text: 'Das Objekt selbst \u2013 ein greifbarer Beweis der Liebe', scores: { gifts: 3 } },
      { id: 'd', text: 'Der Moment des Gebens \u2013 die Naehe dabei', scores: { touch: 2, time: 1 } },
    ],
  },
  {
    id: 'q4',
    context: 'Du spuerst, dass etwas zwischen euch nicht stimmt.',
    text: 'Wie reagierst du?',
    options: [
      { id: 'a', text: 'Ich brauche das Gespraech \u2013 Ungesagtes brennt', scores: { words: 3 } },
      { id: 'b', text: 'Ich brauche Naehe \u2013 Worte koennen luegen, Koerper nicht', scores: { touch: 3 } },
      { id: 'c', text: 'Ich tue etwas \u2013 Handeln ist meine Sprache der Versoehnung', scores: { service: 3 } },
      { id: 'd', text: 'Ich brauche Raum \u2013 um zu verstehen, was ich fuehle', scores: { time: 2, gifts: 1 } },
    ],
  },
  {
    id: 'q5',
    context: "Jemand fragt: 'Woran erkenne ich, dass du mich liebst?'",
    text: 'Deine ehrlichste Antwort:',
    options: [
      { id: 'a', text: 'An dem, was ich dir sage, wenn niemand zuhoert', scores: { words: 3 } },
      { id: 'b', text: 'Daran, dass ich da bin \u2013 auch wenn es unbequem ist', scores: { time: 2, service: 1 } },
      { id: 'c', text: 'An meinen Haenden auf deiner Haut', scores: { touch: 3 } },
      { id: 'd', text: 'Daran, dass ich dich sehe \u2013 wirklich sehe', scores: { time: 2, words: 1 } },
    ],
  },
  {
    id: 'q6',
    context: 'Du hast drei Stunden ungestoerte Zeit mit deinem Menschen.',
    text: 'Was waehlst du?',
    options: [
      { id: 'a', text: 'Reden, bis wir vergessen haben, wo wir angefangen haben', scores: { words: 2, time: 1 } },
      { id: 'b', text: 'Nebeneinander existieren \u2013 lesen, atmen, sein', scores: { time: 3 } },
      { id: 'c', text: 'Etwas zusammen erschaffen oder erleben', scores: { service: 2, time: 1 } },
      { id: 'd', text: 'Beruehrung ohne Ziel \u2013 einfach nah sein', scores: { touch: 3 } },
    ],
  },
  {
    id: 'q7',
    context: 'Ein alter Freund fragt nach deiner groessten Staerke in Beziehungen.',
    text: 'Welche Wahrheit wuerdest du zugeben?',
    options: [
      { id: 'a', text: 'Ich kann Dinge in Worte fassen, die andere nur fuehlen', scores: { words: 3 } },
      { id: 'b', text: 'Ich zeige Liebe durch das, was ich tue, nicht sage', scores: { service: 3 } },
      { id: 'c', text: 'Ich bin physisch praesent in einer Welt voller Ablenkung', scores: { touch: 2, time: 1 } },
      { id: 'd', text: 'Ich gebe Raum \u2013 echte Liebe erstickt nicht', scores: { time: 2, gifts: 1 } },
    ],
  },
  {
    id: 'q8',
    context: 'Du erinnerst dich an den Moment, als du wusstest: Das ist Liebe.',
    text: 'Was hat es verraten?',
    options: [
      { id: 'a', text: 'Ein Satz, der alles veraendert hat', scores: { words: 3 } },
      { id: 'b', text: 'Eine Geste, so klein, dass nur ich sie bemerkt habe', scores: { gifts: 2, service: 1 } },
      { id: 'c', text: 'Die Art, wie sich mein Koerper in ihrer Naehe entspannt hat', scores: { touch: 3 } },
      { id: 'd', text: 'Die Stille, die ploetzlich nicht mehr leer war', scores: { time: 3 } },
    ],
  },
  {
    id: 'q9',
    context: 'Du musst eine Liebesszene aus einem Film waehlen, die dich am meisten trifft.',
    text: 'Welche?',
    options: [
      { id: 'a', text: 'Das Gestaendnis \u2013 endlich ausgesprochene Wahrheit', scores: { words: 3 } },
      { id: 'b', text: 'Der Kuss im Regen \u2013 Koerper sprechen lauter', scores: { touch: 3 } },
      { id: 'c', text: 'Das Opfer \u2013 jemand tut das Unmoegliche fuer den anderen', scores: { service: 2, gifts: 1 } },
      { id: 'd', text: 'Der letzte Tanz \u2013 Zeit anhalten, nur wir zwei', scores: { time: 3 } },
    ],
  },
  {
    id: 'q10',
    context: 'Dein Herz wurde einmal gebrochen.',
    text: 'Was hat am meisten gefehlt?',
    options: [
      { id: 'a', text: "Die Worte \u2013 'Ich liebe dich' wurde eine Floskel", scores: { words: 3 } },
      { id: 'b', text: 'Die Beruehrung \u2013 wir waren Mitbewohner, nicht Liebende', scores: { touch: 3 } },
      { id: 'c', text: 'Die Taten \u2013 Versprechen ohne Handlung sind Luegen', scores: { service: 3 } },
      { id: 'd', text: 'Die Zeit \u2013 wir hatten keine Stunden mehr fuereinander', scores: { time: 3 } },
    ],
  },
  {
    id: 'q11',
    context: 'Liebe ist fuer dich...',
    text: 'Waehle das Bild, das am staerksten resoniert:',
    options: [
      { id: 'a', text: 'Eine Flamme \u2013 sie muss genaehrt werden, oder sie erlischt', scores: { words: 2, touch: 1 } },
      { id: 'b', text: 'Ein Ozean \u2013 tief, manchmal stuermisch, immer groesser als ich', scores: { touch: 2, time: 1 } },
      { id: 'c', text: 'Ein Baum \u2013 Wurzeln brauchen Zeit, aber dann halten sie', scores: { service: 2, time: 1 } },
      { id: 'd', text: 'Der Wind \u2013 man sieht ihn nicht, aber man spuert, wenn er fehlt', scores: { gifts: 2, time: 1 } },
    ],
  },
  {
    id: 'q12',
    context: 'Letzte Frage. Vervollstaendige den Satz:',
    text: 'Ich weiss, dass ich geliebt werde, wenn...',
    options: [
      { id: 'a', text: '...jemand die Worte findet, die ich selbst nicht aussprechen kann', scores: { words: 3 } },
      { id: 'b', text: '...jemand mich beruehrt, als waere ich kostbar', scores: { touch: 3 } },
      { id: 'c', text: '...jemand handelt, bevor ich fragen muss', scores: { service: 3 } },
      { id: 'd', text: '...jemand seine Zeit waehlt, mich zu waehlen', scores: { time: 3 } },
    ],
  },
];

// -- Profiles / Results ------------------------------------------------------

const PROFILES: QuizProfile[] = [
  {
    id: 'the_poet',
    title: 'Der Dichter',
    loveLanguage: 'Worte der Anerkennung',
    primaryDimension: 'words',
    tagline: 'Du liebst in Saetzen, die andere nie vergessen werden.',
    description:
      'Es gibt Menschen, die Liebe aussprechen wie ein Gestaendnis \u2013 und dann gibt es dich. Du hast verstanden, dass Worte keine leeren Huelsen sind. Sie sind Bruecken. Schluessel. Manchmal sogar Waffen.\n\nIn bestimmten Momenten findest du Formulierungen, die andere ihr Leben lang suchen. Das ist keine Faehigkeit, die man lernt \u2013 es ist die Art, wie dein Herz verdrahtet ist.\n\nDu bist einer der wenigen, die das Unsagbare sagbar machen. In einer Welt voller Small Talk bist du das tiefe Gespraech um 3 Uhr nachts.',
    stats: [
      { label: 'Ungesendete Nachrichten', value: '94%' },
      { label: 'Emotionale Praezision', value: '97%' },
      { label: 'Komplimente annehmen', value: '12%' },
    ],
    allies: ['Das Refugium', 'Der Hueter'],
    nemesis: 'Der Architekt',
  },
  {
    id: 'the_flame',
    title: 'Die Flamme',
    loveLanguage: 'Koerperliche Naehe',
    primaryDimension: 'touch',
    tagline: 'Du liebst mit dem ganzen Koerper \u2013 Haut spricht lauter als Worte.',
    description:
      'Fuer dich ist Beruehrung keine Option \u2013 sie ist Notwendigkeit. Nicht aus Beduerftig\u00adkeit, sondern weil dein Nervensystem so programmiert ist: Liebe, die nicht gefuehlt werden kann, ist fuer dich schwer zu glauben.\n\nDu spuerst Verbindung physisch. Eine Hand auf deinem Ruecken sagt mehr als tausend Textnachrichten. Ein Abend ohne Beruehrung fuehlt sich an wie ein Gespraech, bei dem niemand zuhoert.\n\nIn einer Welt, die Distanz normalisiert hat, bist du ein Reminder: Koerper luegen nicht. Und Naehe ist kein Luxus \u2013 sie ist Grundnahrung.',
    stats: [
      { label: 'Umarmungen pro Tag', value: '\u221E' },
      { label: 'Fernbeziehungs-Toleranz', value: '8%' },
      { label: 'Koerperliche Intuition', value: '96%' },
    ],
    allies: ['Der Dichter', 'Das Refugium'],
    nemesis: 'Der Wanderer',
  },
  {
    id: 'the_architect',
    title: 'Der Architekt',
    loveLanguage: 'Hilfsbereitschaft',
    primaryDimension: 'service',
    tagline: 'Du baust Liebe mit deinen Haenden, nicht mit Worten.',
    description:
      'Waehrend andere Liebe erklaeren, erschaffst du sie. Fuer dich ist ein reparierter Wasserhahn eine Liebeserklaerung. Ein vorbereitetes Abendessen ist Poesie. Ein geloestes Problem ist Intimitaet.\n\nDu verstehst: Worte kosten nichts. Taten kosten Zeit, Energie, Aufmerksamkeit. Und das ist die einzige Waehrung, die zaehlt.\n\nDein Schatten: Du koenntest vergessen, dass manche Menschen Worte hoeren muessen, auch wenn deine Handlungen schreien. Balance ist dein Entwicklungsfeld.',
    stats: [
      { label: 'Probleme geloest', value: '\u221E' },
      { label: 'Verbal-Romantik', value: '23%' },
      { label: 'Zuverlaessigkeit', value: '99%' },
    ],
    allies: ['Der Hueter'],
    nemesis: 'Der Dichter',
  },
  {
    id: 'the_refuge',
    title: 'Das Refugium',
    loveLanguage: 'Qualitaetszeit',
    primaryDimension: 'time',
    tagline: 'Deine Praesenz ist das wertvollste Geschenk.',
    description:
      'Du hast verstanden, was die meisten uebersehen: In einer Welt endloser Ablenkungen ist ungeteilte Aufmerksamkeit die radikalste Form der Liebe.\n\nWenn du jemandem deine Zeit schenkst, schenkst du ihm einen Teil deines Lebens, den du nie zurueckbekommst. Diese Transaktion nimmst du ernst.\n\nDu bist der sichere Hafen, nach dem andere suchen. Der Raum, in dem man einfach sein kann, ohne performen zu muessen. Das ist eine seltene Gabe.',
    stats: [
      { label: 'Praesenz-Qualitaet', value: '98%' },
      { label: 'Multitasking-Score', value: '4%' },
      { label: 'Tiefe Gespraeche', value: '\u221E' },
    ],
    allies: ['Der Dichter', 'Die Flamme'],
    nemesis: 'Der Architekt',
  },
  {
    id: 'the_guardian',
    title: 'Der Hueter',
    loveLanguage: 'Geschenke',
    primaryDimension: 'gifts',
    tagline: 'Du machst das Unsichtbare greifbar.',
    description:
      'Fuer dich sind Geschenke nicht materialistisch \u2013 sie sind Beweise. Tangible Erinnerungen daran, dass jemand an einen anderen gedacht hat, als er nicht da war.\n\nDu verstehst die symbolische Kraft von Objekten. Ein richtig gewaehltes Geschenk zeigt: Ich kenne dich. Ich sehe dich. Ich erinnere mich.\n\nDeine Superkraft: Du merkst dir Details, die andere ueberhoeren. Der erwaehnte Autor. Die Lieblingsblume. Der unerfuellte Wunsch. Und dann handelst du.',
    stats: [
      { label: 'Geschenk-Trefferquote', value: '94%' },
      { label: 'Detail-Erinnerung', value: '97%' },
      { label: 'Spontane Ueberraschungen', value: '88%' },
    ],
    allies: ['Der Architekt', 'Der Dichter'],
    nemesis: 'Der Wanderer',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ALL_DIMS: LoveDimension[] = ['touch', 'words', 'time', 'gifts', 'service'];

function determineProfile(scores: Record<LoveDimension, number>): QuizProfile {
  // Find the dimension with the highest score
  let maxDim: LoveDimension = 'words';
  let maxVal = -1;
  for (const dim of ALL_DIMS) {
    if (scores[dim] > maxVal) {
      maxVal = scores[dim];
      maxDim = dim;
    }
  }
  // Match profile by primaryDimension
  return PROFILES.find((p) => p.primaryDimension === maxDim) ?? PROFILES[0];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type Screen = 'intro' | 'quiz' | 'loading' | 'result';

function LoveLanguagesQuiz({ onComplete, onClose }: LoveLanguagesQuizProps) {
  const [screen, setScreen] = useState<Screen>('intro');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [scores, setScores] = useState<Record<LoveDimension, number>>({
    touch: 0,
    words: 0,
    time: 0,
    gifts: 0,
    service: 0,
  });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [resultProfile, setResultProfile] = useState<QuizProfile | null>(null);
  const completedRef = useRef(false);

  const totalQuestions = QUESTIONS.length;
  const progress = ((questionIndex + 1) / totalQuestions) * 100;

  // Fire onComplete exactly once when result is determined
  useEffect(() => {
    if (screen === 'result' && resultProfile && !completedRef.current) {
      completedRef.current = true;
      const event = loveLangToEvent(scores, resultProfile.id);
      onComplete(event);
    }
  }, [screen, resultProfile, scores, onComplete]);

  const handleStart = useCallback(() => {
    setScreen('quiz');
  }, []);

  const handleSelectOption = useCallback(
    (option: QuizOption) => {
      if (isTransitioning) return;
      setIsTransitioning(true);

      // Accumulate scores
      const next = { ...scores };
      for (const dim of ALL_DIMS) {
        next[dim] += option.scores[dim] ?? 0;
      }
      setScores(next);

      // Advance after short delay for selection feedback
      setTimeout(() => {
        const nextIdx = questionIndex + 1;
        if (nextIdx < totalQuestions) {
          setQuestionIndex(nextIdx);
          setIsTransitioning(false);
        } else {
          // Show loading then result
          setScreen('loading');
          setTimeout(() => {
            const profile = determineProfile(next);
            setResultProfile(profile);
            setScreen('result');
            setIsTransitioning(false);
          }, 2200);
        }
      }, 400);
    },
    [isTransitioning, scores, questionIndex, totalQuestions],
  );

  const handleRestart = useCallback(() => {
    setQuestionIndex(0);
    setScores({ touch: 0, words: 0, time: 0, gifts: 0, service: 0 });
    setResultProfile(null);
    completedRef.current = false;
    setScreen('intro');
  }, []);

  // -----------------------------------------------------------------------
  // Renders
  // -----------------------------------------------------------------------

  const renderCloseButton = () => (
    <button
      onClick={onClose}
      className="absolute top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-white/60 backdrop-blur transition hover:bg-white/10 hover:text-white"
      aria-label="Schliessen"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  );

  // -- Intro ---------------------------------------------------------------

  const renderIntro = () => (
    <motion.div
      key="intro"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.45 }}
      className="flex flex-col items-center px-6 py-12 text-center"
    >
      {/* Heart icon */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#D4AF37]/10 text-[#D4AF37]">
        <svg viewBox="0 0 24 24" className="h-10 w-10" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </div>

      <p className="mb-2 text-sm tracking-widest uppercase text-[#D4AF37] font-serif">
        Entdecke deinen Archetyp
      </p>
      <h1 className="mb-4 text-3xl font-bold text-white font-serif md:text-4xl">
        Welche Sprache spricht dein Herz?
      </h1>
      <p className="mb-8 max-w-md text-white/60 leading-relaxed">
        Jeder Mensch gibt und empfaengt Liebe auf eine eigene Art. Entdecke in 12 Fragen, welcher
        Liebenden-Archetyp dein Wesen praegt.
      </p>

      <button
        onClick={handleStart}
        className="rounded-xl bg-[#D4AF37] px-8 py-3.5 text-sm font-semibold text-[#00050A] transition hover:bg-[#E8C878] active:scale-[0.97]"
      >
        Mein Herz befragen &rarr;
      </button>
    </motion.div>
  );

  // -- Question ------------------------------------------------------------

  const renderQuestion = () => {
    const q = QUESTIONS[questionIndex];
    return (
      <motion.div
        key={`q-${questionIndex}`}
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -40 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col px-6 py-8"
      >
        {/* Progress bar */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between text-xs text-white/50">
            <span>Frage {questionIndex + 1} von {totalQuestions}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#E8C878]"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {/* Context */}
        <p className="mb-2 text-sm italic text-[#D4AF37]/70">{q.context}</p>

        {/* Question text */}
        <h2 className="mb-6 text-xl font-semibold text-white font-serif md:text-2xl">
          {q.text}
        </h2>

        {/* Options */}
        <div className="flex flex-col gap-3">
          {q.options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => handleSelectOption(opt)}
              disabled={isTransitioning}
              className="rounded-xl border border-white/10 bg-white/5 px-5 py-4 text-left text-sm text-white/80 backdrop-blur transition-all hover:border-[#D4AF37]/50 hover:bg-white/10 hover:text-white active:scale-[0.98] disabled:pointer-events-none"
            >
              {opt.text}
            </button>
          ))}
        </div>
      </motion.div>
    );
  };

  // -- Loading -------------------------------------------------------------

  const renderLoading = () => (
    <motion.div
      key="loading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center px-6 py-20 text-center"
    >
      {/* Pulsing orb */}
      <div className="relative mb-8">
        <div className="h-16 w-16 animate-ping rounded-full bg-[#D4AF37]/20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full bg-[#D4AF37]/60" />
        </div>
      </div>
      <h2 className="mb-4 text-xl text-white font-serif">Dein Herz enthuellt sich...</h2>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="inline-block h-2 w-2 animate-bounce rounded-full bg-[#D4AF37]/60"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </motion.div>
  );

  // -- Result --------------------------------------------------------------

  const renderResult = () => {
    if (!resultProfile) return null;
    const maxScore = Math.max(...ALL_DIMS.map((d) => scores[d]), 1);

    return (
      <motion.div
        key="result"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col px-6 py-8"
      >
        {/* Header */}
        <div className="mb-6 text-center">
          <span className="mb-3 inline-block rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-1 text-[10px] font-medium tracking-[2px] uppercase text-[#D4AF37]">
            Dein Archetyp
          </span>
          <h1 className="mb-1 text-3xl font-bold text-white font-serif">{resultProfile.title}</h1>
          <p className="text-sm font-medium text-[#D4AF37]">{resultProfile.loveLanguage}</p>
        </div>

        {/* Tagline */}
        <div className="mb-6 rounded-xl border-l-[3px] border-[#D4AF37] bg-white/5 px-5 py-4">
          <p className="text-sm italic text-white/70 font-serif">
            &ldquo;{resultProfile.tagline}&rdquo;
          </p>
        </div>

        {/* Description */}
        <p className="mb-6 whitespace-pre-line text-sm leading-relaxed text-white/60">
          {resultProfile.description}
        </p>

        {/* Trait bars */}
        <div className="mb-5 rounded-xl bg-white/5 p-5 backdrop-blur">
          <h3 className="mb-4 text-[11px] tracking-[2px] uppercase text-white/40">
            Deine Liebes-Dimensionen
          </h3>
          <div className="flex flex-col gap-4">
            {ALL_DIMS.map((dim) => {
              const pct = Math.round((scores[dim] / maxScore) * 100);
              return (
                <div key={dim}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-white/70">{DIMENSION_LABELS[dim]}</span>
                    <span className="font-semibold text-[#D4AF37] font-serif">{pct}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#E8C878]"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="mb-5 rounded-xl bg-white/5 p-5 backdrop-blur">
          <h3 className="mb-3 text-[11px] tracking-[2px] uppercase text-white/40">Deine Stats</h3>
          {resultProfile.stats.map((stat, i) => (
            <div
              key={i}
              className="flex items-center justify-between border-b border-white/5 py-3 last:border-0"
            >
              <span className="text-xs text-white/60">{stat.label}</span>
              <span className="text-sm font-semibold text-[#D4AF37] font-serif">{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Compatibility */}
        <div className="mb-6 rounded-xl bg-white/5 p-5 backdrop-blur">
          <h3 className="mb-3 text-[11px] tracking-[2px] uppercase text-white/40">
            Kompatibilitaet
          </h3>
          <div className="mb-2">
            <span className="text-[10px] tracking-widest uppercase text-emerald-400/70">
              Allies
            </span>
            <p className="text-sm text-white/70">{resultProfile.allies.join(', ')}</p>
          </div>
          <div>
            <span className="text-[10px] tracking-widest uppercase text-[#D4AF37]">Nemesis</span>
            <p className="text-sm text-white/70">{resultProfile.nemesis}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="mb-4 flex gap-3">
          <button
            onClick={handleRestart}
            className="flex-1 rounded-xl border-2 border-white/10 py-3.5 text-sm font-medium text-white/70 transition hover:border-[#D4AF37]/30 hover:text-white"
          >
            Nochmal
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-[#D4AF37] py-3.5 text-sm font-semibold text-[#00050A] shadow-[0_4px_20px_rgba(212,175,55,0.25)] transition hover:bg-[#E8C878]"
          >
            Fertig
          </button>
        </div>

        <p className="text-center text-[11px] leading-relaxed text-white/30">
          Dieser Test dient der spielerischen Selbstreflexion und stellt{' '}
          <strong>keine</strong> psychologische Diagnose dar.
        </p>
      </motion.div>
    );
  };

  // -----------------------------------------------------------------------
  // Main render
  // -----------------------------------------------------------------------

  return (
    <div className="relative mx-auto w-full max-w-lg">
      {renderCloseButton()}

      <AnimatePresence mode="wait">
        {screen === 'intro' && renderIntro()}
        {screen === 'quiz' && renderQuestion()}
        {screen === 'loading' && renderLoading()}
        {screen === 'result' && renderResult()}
      </AnimatePresence>
    </div>
  );
}

export default LoveLanguagesQuiz;
