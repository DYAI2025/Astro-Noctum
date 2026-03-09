import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { ContributionEvent } from '@/src/lib/lme/types';
import { destinyToEvent } from '@/src/lib/fusion-ring/quiz-to-event';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface DestinyQuizProps {
  onComplete: (event: ContributionEvent) => void;
  onClose: () => void;
}

type Screen = 'intro' | 'quiz' | 'loading' | 'result';

interface DestinyScores {
  vision: number;
  resilience: number;
  magnetism: number;
  innerCall: number;
}

interface DestinyProfile {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  traits: string[];
  challenge: string;
  color: string;
  affirmation: string;
}

interface QuizQuestion {
  id: number;
  text: string;
  options: { text: string; scores: Partial<DestinyScores> }[];
}

// ═══════════════════════════════════════════════════════════════
// DATA (inline)
// ═══════════════════════════════════════════════════════════════

const INITIAL_SCORES: DestinyScores = { vision: 0, resilience: 0, magnetism: 0, innerCall: 0 };

const QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    text: 'Wenn du nachts wach liegst, woran denkst du?',
    options: [
      { text: 'An Systeme, die ich ver\u00e4ndern will \u2013 Bildung, Wirtschaft, Gesellschaft', scores: { vision: 3, innerCall: 2 } },
      { text: 'An Menschen, die ich erreichen m\u00f6chte \u2013 konkrete Gesichter, konkrete Wirkung', scores: { magnetism: 3, vision: 1 } },
      { text: 'An den n\u00e4chsten konkreten Schritt, der alles ver\u00e4ndern k\u00f6nnte', scores: { resilience: 2, vision: 1 } },
      { text: 'An ein Gef\u00fchl, das ich nicht benennen kann \u2013 aber es zieht', scores: { innerCall: 3, vision: 1 } },
    ],
  },
  {
    id: 2,
    text: 'Du st\u00f6\u00dft auf massiven Widerstand gegen deine Idee. Was passiert in dir?',
    options: [
      { text: 'Brennstoff. Je mehr Widerstand, desto klarer wei\u00df ich, dass es richtig ist.', scores: { resilience: 3, innerCall: 2 } },
      { text: 'Ich analysiere: Ist der Widerstand ein Signal oder nur Rauschen?', scores: { vision: 2, resilience: 1 } },
      { text: 'Ich suche einen anderen Weg zum selben Ziel. Wasser findet immer einen Weg.', scores: { resilience: 2, magnetism: 1 } },
      { text: 'Ich ziehe mich zur\u00fcck, aber das Feuer bleibt. Es wartet.', scores: { innerCall: 2, resilience: 1 } },
    ],
  },
  {
    id: 3,
    text: 'Menschen in deinem Umfeld w\u00fcrden sagen, du bist...',
    options: [
      { text: '...jemand, dem man folgen will, ohne genau zu wissen warum', scores: { magnetism: 3, innerCall: 1 } },
      { text: '...jemand, der Dinge sieht, die anderen erst sp\u00e4ter klar werden', scores: { vision: 3, innerCall: 1 } },
      { text: '...unzerst\u00f6rbar \u2013 du machst einfach weiter, egal was kommt', scores: { resilience: 3 } },
      { text: '...anders \u2013 auf eine Art, die sie nicht ganz greifen k\u00f6nnen', scores: { innerCall: 2, magnetism: 1 } },
    ],
  },
  {
    id: 4,
    text: 'Was ist dein Verh\u00e4ltnis zu "Erfolg", wie ihn die Gesellschaft definiert?',
    options: [
      { text: 'Ein Mittel zum Zweck. Geld und Status sind Hebel, keine Ziele.', scores: { vision: 2, resilience: 2 } },
      { text: 'Irrelevant. Ich jage etwas, das sich nicht in Zahlen messen l\u00e4sst.', scores: { innerCall: 3, vision: 1 } },
      { text: 'Wichtig als Beweis \u2013 nicht f\u00fcr mich, sondern um geh\u00f6rt zu werden.', scores: { magnetism: 2, resilience: 1 } },
      { text: 'Ich habe ihn erreicht und gemerkt: Das war es noch nicht.', scores: { innerCall: 2, vision: 2 } },
    ],
  },
  {
    id: 5,
    text: 'Wann f\u00fchlst du dich am lebendigsten?',
    options: [
      { text: 'Wenn ich etwas erschaffe, das noch nie existiert hat', scores: { vision: 3, innerCall: 1 } },
      { text: 'Wenn ich einen Raum betrete und sp\u00fcre, wie sich die Energie ver\u00e4ndert', scores: { magnetism: 3 } },
      { text: 'Wenn ich durch etwas durchgebrochen bin, das unm\u00f6glich schien', scores: { resilience: 3 } },
      { text: 'In seltenen Momenten absoluter Klarheit, die ich nicht erzwingen kann', scores: { innerCall: 3 } },
    ],
  },
  {
    id: 6,
    text: 'Deine gr\u00f6\u00dfte Angst ist...',
    options: [
      { text: '...dass ich sterbe, ohne mein volles Potenzial ausgesch\u00f6pft zu haben', scores: { innerCall: 3, vision: 1 } },
      { text: '...dass die Welt so bleibt, wie sie ist, weil niemand sie \u00e4ndert', scores: { vision: 3, resilience: 1 } },
      { text: '...Bedeutungslosigkeit. Nicht erinnert zu werden.', scores: { magnetism: 2, innerCall: 1 } },
      { text: '...dass ich aufgebe, kurz bevor der Durchbruch kommt', scores: { resilience: 3 } },
    ],
  },
  {
    id: 7,
    text: 'Wie gehst du mit dem Gef\u00fchl um, "anders" zu sein?',
    options: [
      { text: 'Ich habe aufgeh\u00f6rt, es zu verstecken. Es ist mein Kompass.', scores: { innerCall: 3, magnetism: 1 } },
      { text: 'Ich nutze es strategisch \u2013 zur richtigen Zeit, am richtigen Ort', scores: { vision: 2, magnetism: 2 } },
      { text: 'Es war schmerzhaft. Jetzt ist es meine Superkraft.', scores: { resilience: 2, innerCall: 2 } },
      { text: 'Ich ziehe Menschen an, die auch anders sind. Wir erkennen uns.', scores: { magnetism: 3 } },
    ],
  },
  {
    id: 8,
    text: 'Was w\u00fcrdest du opfern, um deine tiefste Vision zu verwirklichen?',
    options: [
      { text: 'Bequemlichkeit, Status, Verst\u00e4ndnis anderer \u2013 alles au\u00dfer meiner Integrit\u00e4t', scores: { innerCall: 3, resilience: 2 } },
      { text: 'Zeit. Ich investiere Jahre in etwas, dessen Fr\u00fcchte ich vielleicht nie sehe.', scores: { vision: 3, resilience: 1 } },
      { text: 'Beziehungen, die mich zur\u00fcckhalten. Nicht aus K\u00e4lte, aus Notwendigkeit.', scores: { resilience: 2, magnetism: 1 } },
      { text: 'Nichts. Ich glaube, dass wahre Gr\u00f6\u00dfe ohne Opfer m\u00f6glich ist.', scores: { vision: 1, magnetism: 2 } },
    ],
  },
  {
    id: 9,
    text: 'Stell dir vor, du k\u00f6nntest in 100 Jahren sehen, was von dir bleibt. Was hoffst du zu finden?',
    options: [
      { text: 'Ein System, eine Institution, eine Bewegung, die weiterwirkt', scores: { vision: 3, resilience: 1 } },
      { text: "Menschen, die sagen: 'Sie hat mein Leben ver\u00e4ndert'", scores: { magnetism: 3, innerCall: 1 } },
      { text: 'Ideen, die so tief eingesickert sind, dass niemand mehr wei\u00df, woher sie kamen', scores: { vision: 2, innerCall: 2 } },
      { text: 'Beweise, dass ich den Ruf beantwortet habe \u2013 egal wie es aussah', scores: { innerCall: 3 } },
    ],
  },
  {
    id: 10,
    text: "Wenn ein Orakel dir sagen w\u00fcrde: 'Du bist zu H\u00f6herem bestimmt' \u2013 was w\u00e4re deine erste Reaktion?",
    options: [
      { text: 'Ich wei\u00df. Die Frage war nie ob, sondern wann und wie.', scores: { innerCall: 3, vision: 1 } },
      { text: 'Zeig mir den Weg. Ich bin bereit f\u00fcr Anweisungen.', scores: { resilience: 2, magnetism: 1 } },
      { text: 'Das erkl\u00e4rt einiges. Aber was genau ist meine Aufgabe?', scores: { vision: 2, innerCall: 1 } },
      { text: 'Ich w\u00fcrde es erst glauben, wenn ich Ergebnisse sehe.', scores: { resilience: 2, vision: 1 } },
    ],
  },
];

const PROFILES: Record<string, DestinyProfile> = {
  auserwaehlte: {
    id: 'auserwaehlte',
    name: 'Der Auserw\u00e4hlte',
    subtitle: 'Du bist nicht hier, um das Spiel zu spielen. Du bist hier, um die Regeln zu schreiben.',
    description: 'In dir brennt etwas, das sich nicht erkl\u00e4ren l\u00e4sst \u2013 ein unbeirrbares Wissen, dass dein Leben f\u00fcr etwas Gr\u00f6\u00dferes bestimmt ist. Du siehst weiter als andere, h\u00e4ltst l\u00e4nger durch als andere, und Menschen sp\u00fcren in deiner Gegenwart, dass du anders bist. Nicht besser. Anders. Als w\u00e4rst du f\u00fcr eine Aufgabe geboren, die noch niemand definiert hat.',
    traits: ['Vision\u00e4re Klarheit', 'Unbrechbare Resilienz', 'Magnetische Pr\u00e4senz', 'Innere Gewissheit'],
    challenge: 'Deine gr\u00f6\u00dfte Herausforderung: Geduld. Du siehst das Ende, bevor andere den Anfang verstehen. Lerne, Menschen mitzunehmen, statt ihnen davonzurennen.',
    color: 'from-amber-500 to-orange-600',
    affirmation: 'Ich bin bereit, den Weg zu gehen, der sich erst beim Gehen zeigt.',
  },
  architekt: {
    id: 'architekt',
    name: 'Der stille Architekt',
    subtitle: 'Du baust Kathedralen, deren Vollendung du nie sehen wirst \u2013 und das ist okay.',
    description: 'Deine Gr\u00f6\u00dfe liegt nicht in Applaus, sondern in Wirkung. Du denkst in Jahrzehnten, w\u00e4hrend andere in Quartalen planen. Du legst Fundamente, pflanzt Samen, konstruierst Systeme \u2013 nicht f\u00fcr Ruhm, sondern weil du verstehst, dass wahre Ver\u00e4nderung Zeit braucht. Dein Name wird vielleicht nie in Neonlichtern stehen. Aber dein Werk wird Generationen \u00fcberdauern.',
    traits: ['Strategische Weitsicht', 'Tiefe statt Breite', 'Systemisches Denken', 'Stilles Durchhalteverm\u00f6gen'],
    challenge: 'Deine Versuchung ist Isolation. Die Einsamkeit des langen Weges. Such dir Verb\u00fcndete, die deine Zeitskala verstehen.',
    color: 'from-slate-600 to-zinc-800',
    affirmation: 'Ich baue f\u00fcr die Ewigkeit, nicht f\u00fcr das Ego.',
  },
  katalysator: {
    id: 'katalysator',
    name: 'Der Katalysator',
    subtitle: 'Du ver\u00e4nderst nicht durch Tun, sondern durch Sein.',
    description: 'Deine Superkraft ist nicht Vision oder Ausdauer \u2013 es ist Transformation durch Pr\u00e4senz. Menschen ver\u00e4ndern sich in deiner N\u00e4he. Gespr\u00e4che mit dir werden zu Wendepunkten. Du musst keine Bewegung gr\u00fcnden; du BIST eine Bewegung. Jeder Raum, den du betrittst, ist danach nicht mehr derselbe. Das ist keine Technik. Es ist, wer du bist.',
    traits: ['Transformative Pr\u00e4senz', 'Emotionale Intelligenz', 'Nat\u00fcrliche Autorit\u00e4t', 'Ansteckende Energie'],
    challenge: 'Du kannst andere entz\u00fcnden, aber wer entz\u00fcndet dich? Finde Quellen, die dein eigenes Feuer n\u00e4hren, sonst verbrennst du.',
    color: 'from-rose-500 to-pink-600',
    affirmation: 'Mein Licht wird nicht weniger, wenn ich es teile \u2013 es wird mehr.',
  },
  seher: {
    id: 'seher',
    name: 'Der Seher',
    subtitle: 'Du erkennst Wahrheiten, f\u00fcr die die Welt noch nicht bereit ist.',
    description: 'Du lebst zeitversetzt. Was du heute siehst, verstehen andere in f\u00fcnf Jahren. Das macht dich manchmal einsam, oft missverstanden, aber immer wertvoll. Dein Blick durchdringt Oberfl\u00e4chen, erkennt Muster, die sich erst formen. Du bist kein Prophet im mystischen Sinne \u2013 du bist einfach jemand, der die Verbindungen sieht, bevor sie sichtbar werden.',
    traits: ['Mustererkennung', 'Intuitive Klarheit', 'Zeitlose Perspektive', 'Unbeirrbare Wahrnehmung'],
    challenge: 'Die Gefahr ist Passivit\u00e4t. Sehen ist nicht genug. Deine Vision muss durch deine H\u00e4nde in die Welt kommen \u2013 sonst bleibt sie ein Traum.',
    color: 'from-violet-600 to-purple-800',
    affirmation: 'Ich vertraue dem Bild, das ich sehe, auch wenn andere noch schlafen.',
  },
  diamant: {
    id: 'diamant',
    name: 'Der ungeschliffene Diamant',
    subtitle: 'Das Rohmaterial f\u00fcr Gr\u00f6\u00dfe ist da. Der Prozess hat begonnen.',
    description: 'Du sp\u00fcrst es, oder? Dieses Ziehen. Dieses Wissen, dass da mehr ist. Du bist nicht am Anfang \u2013 du bist im Werden. Der Diamant ist bereits da, unter der Oberfl\u00e4che. Was noch fehlt, ist nicht Potenzial, sondern Druck, Zeit und die richtigen Umst\u00e4nde. Dein Moment kommt nicht irgendwann. Er formt sich gerade. Mit jeder Entscheidung, die du triffst.',
    traits: ['Latentes Potenzial', 'Wachsende Klarheit', 'Unruhe mit Richtung', 'Offenheit f\u00fcr Transformation'],
    challenge: 'Dein Risiko ist Ungeduld. Du willst den Durchbruch jetzt. Aber Diamanten entstehen unter Druck und Zeit \u2013 nicht durch Wunschdenken. Bleib im Prozess.',
    color: 'from-cyan-500 to-blue-600',
    affirmation: 'Ich nehme den Druck an, denn er formt mich.',
  },
};

// ═══════════════════════════════════════════════════════════════
// SCORING LOGIC
// ═══════════════════════════════════════════════════════════════

function calculateProfile(scores: DestinyScores): string {
  const { vision, resilience, magnetism, innerCall } = scores;
  if (innerCall >= 18 && vision >= 15 && resilience >= 12) return 'auserwaehlte';
  if (vision >= 18 && resilience >= 12 && magnetism < 12) return 'architekt';
  if (magnetism >= 16 && (innerCall >= 10 || resilience >= 10)) return 'katalysator';
  if (vision >= 16 && innerCall >= 14 && magnetism < 14) return 'seher';
  return 'diamant';
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
            <path d="M35 35 L50 15 L65 35 L80 50 L65 65 L50 85 L35 65 L20 50 Z" strokeLinecap="round" />
            <circle cx="50" cy="50" r="8" />
            <circle cx="50" cy="50" r="3" fill="#D4AF37" />
          </g>
        </svg>
      </div>

      <h1 className="font-serif text-2xl sm:text-3xl text-white mb-4 leading-tight">
        Bist du zu{' '}
        <span className="text-[#D4AF37]">H&ouml;herem</span>{' '}
        bestimmt?
      </h1>

      <p className="text-white/60 text-sm sm:text-base max-w-md mb-4 leading-relaxed">
        10 Fragen. Keine richtigen Antworten. Nur die, die wahr sind.
      </p>

      <p className="text-white/40 text-xs max-w-md mb-8 leading-relaxed">
        Dieser Test misst keine Intelligenz, keinen Erfolg, keine F&auml;higkeit.
        Er misst die Art, wie du denkst, f&uuml;hlst und durch die Welt gehst.
      </p>

      <div className="flex gap-6 text-white/40 text-xs mb-10">
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span>4 Minuten</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          </svg>
          <span>10 Fragen</span>
        </div>
      </div>

      <button
        onClick={onStart}
        className="bg-[#D4AF37] text-[#00050A] font-semibold px-8 py-3.5 rounded-xl text-base hover:bg-[#E8C878] transition-colors shadow-lg shadow-[#D4AF37]/20"
      >
        Test starten
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
      <p className="font-serif text-xl text-white mb-2">Dein Schicksal offenbart sich...</p>
      <p className="text-sm text-white/50">Die Sterne ordnen sich</p>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SCREEN: RESULT
// ═══════════════════════════════════════════════════════════════

function ResultScreen({
  profile,
  scores,
  onRestart,
  onClose,
}: {
  profile: DestinyProfile;
  scores: DestinyScores;
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
      <div className="w-full max-w-sm bg-gradient-to-br from-[#0A2540] to-[#053B3F] border border-[#D4AF37]/30 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

        {/* Header */}
        <div className="text-center mb-5">
          <p className="text-[#D4AF37] text-xs font-semibold uppercase tracking-[0.12em] mb-3">
            Dein Profil
          </p>
          <h2 className="font-serif text-2xl text-white mb-2">{profile.name}</h2>
          <p className="font-serif text-sm text-[#C4A86C] italic">&quot;{profile.subtitle}&quot;</p>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent my-5" />

        {/* Description */}
        <p className="text-sm text-white/60 leading-relaxed mb-5">
          {profile.description}
        </p>

        {/* Traits */}
        <div className="mb-5">
          <p className="text-[10px] text-white/40 uppercase tracking-wider mb-3">Kernmerkmale</p>
          <div className="flex flex-wrap gap-2">
            {profile.traits.map((trait) => (
              <span
                key={trait}
                className="px-3 py-1 rounded-full text-xs bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/20"
              >
                {trait}
              </span>
            ))}
          </div>
        </div>

        {/* Challenge */}
        <div className="bg-[#041726]/40 rounded-xl p-4 mb-5">
          <p className="text-[10px] text-[#D4AF37]/60 uppercase tracking-wider mb-2">Herausforderung</p>
          <p className="text-sm text-white/50 leading-relaxed">{profile.challenge}</p>
          <p className="text-sm text-[#C4A86C] italic mt-2">&quot;{profile.affirmation}&quot;</p>
        </div>

        {/* Dimension scores */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Vision', value: scores.vision },
            { label: 'Resilienz', value: scores.resilience },
            { label: 'Magnetismus', value: scores.magnetism },
            { label: 'Innerer Ruf', value: scores.innerCall },
          ].map((dim) => (
            <div key={dim.label} className="bg-[#041726]/50 rounded-lg p-3 text-center">
              <p className="text-[10px] text-white/50 uppercase tracking-wider mb-1">{dim.label}</p>
              <p className="font-serif text-lg font-semibold text-[#D4AF37]">{dim.value}</p>
            </div>
          ))}
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
        Dieser Test dient der Selbstreflexion und stellt{' '}
        <strong>keine</strong> psychologische Diagnose dar.
      </p>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function DestinyQuiz({ onComplete, onClose }: DestinyQuizProps) {
  const [screen, setScreen] = useState<Screen>('intro');
  const [questionIdx, setQuestionIdx] = useState(0);
  const [scores, setScores] = useState<DestinyScores>({ ...INITIAL_SCORES });
  const [resultProfileId, setResultProfileId] = useState<string | null>(null);

  const handleStart = useCallback(() => {
    setScreen('quiz');
    setQuestionIdx(0);
    setScores({ ...INITIAL_SCORES });
    setResultProfileId(null);
  }, []);

  const handleAnswer = useCallback(
    (optionIdx: number) => {
      const question = QUESTIONS[questionIdx];
      const option = question.options[optionIdx];

      setScores((prev) => {
        const next = { ...prev };
        for (const [key, value] of Object.entries(option.scores)) {
          next[key as keyof DestinyScores] = (next[key as keyof DestinyScores] ?? 0) + value;
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

  useEffect(() => {
    if (screen !== 'loading') return;
    const timer = setTimeout(() => {
      const profileId = calculateProfile(scores);
      setResultProfileId(profileId);
      setScreen('result');
      onComplete(destinyToEvent(profileId));
    }, 2200);
    return () => clearTimeout(timer);
  }, [screen, scores, onComplete]);

  const profile = resultProfileId ? PROFILES[resultProfileId] : null;

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
          <ResultScreen key="result" profile={profile} scores={scores} onRestart={handleStart} onClose={onClose} />
        )}
      </AnimatePresence>
    </div>
  );
}
