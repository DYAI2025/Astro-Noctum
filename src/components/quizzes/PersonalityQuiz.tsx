import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { ContributionEvent } from '@/src/lib/lme/types';
import { personalityToEvent } from '@/src/lib/fusion-ring/quiz-to-event';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface PersonalityQuizProps {
  onComplete: (event: ContributionEvent) => void;
  onClose: () => void;
}

type Screen = 'intro' | 'quiz' | 'result';

interface QuizScores {
  focus: number;
  resources: number;
  empathy: number;
}

interface QuizOption {
  text: string;
  scores: QuizScores;
}

interface QuizQuestion {
  id: string;
  text: string;
  options: QuizOption[];
}

interface Profile {
  id: string;
  title: string;
  tagline: string;
  icon: string;
  description: string;
  strengths: string[];
  growth: string[];
  compatibility: { ally: string; challenge: string };
  match: (s: QuizScores) => boolean;
  priority: number;
}

// ═══════════════════════════════════════════════════════════════
// DIMENSIONS
// ═══════════════════════════════════════════════════════════════

const DIMENSIONS = [
  { id: 'focus' as const, name: 'Aufmerksamkeitsfokus', poleLow: 'Selbst', poleHigh: 'Andere' },
  { id: 'resources' as const, name: 'Ressourcen-Allokation', poleLow: 'Bewahren', poleHigh: 'Geben' },
  { id: 'empathy' as const, name: 'Empathische Resonanz', poleLow: 'Abgegrenzt', poleHigh: 'Mitfuhlend' },
] as const;

// ═══════════════════════════════════════════════════════════════
// QUESTIONS (German content preserved from source)
// ═══════════════════════════════════════════════════════════════

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    text: 'Ein Freund ruft dich spatabends an \u2013 er braucht jemanden zum Reden. Du bist erschopft. Was machst du?',
    options: [
      { text: 'Ich hore zu, so lange er braucht. Meine Mudigkeit kann warten.', scores: { focus: 85, resources: 80, empathy: 90 } },
      { text: 'Ich hore kurz zu und schlage vor, morgen ausfuhrlicher zu sprechen.', scores: { focus: 50, resources: 50, empathy: 60 } },
      { text: 'Ich erklare ehrlich, dass ich heute nicht mehr kann, und biete morgen an.', scores: { focus: 25, resources: 25, empathy: 40 } },
      { text: 'Ich gehe nicht ran \u2013 mein Schlaf ist wichtiger fur meine Funktionsfahigkeit.', scores: { focus: 10, resources: 10, empathy: 20 } },
    ],
  },
  {
    id: 'q2',
    text: 'Du hast unerwartet 500\u20AC bekommen. Was ist dein erster Impuls?',
    options: [
      { text: 'Endlich kann ich [mir selbst] etwas gonnen, das ich lange aufgeschoben habe.', scores: { focus: 15, resources: 10, empathy: 30 } },
      { text: 'Ich lege es zur Seite \u2013 Sicherheit geht vor.', scores: { focus: 25, resources: 20, empathy: 35 } },
      { text: 'Ich teile es \u2013 ein Teil fur mich, ein Teil fur andere.', scores: { focus: 50, resources: 55, empathy: 55 } },
      { text: 'Ich uberlege sofort, wem ich damit helfen konnte.', scores: { focus: 80, resources: 85, empathy: 75 } },
    ],
  },
  {
    id: 'q3',
    text: 'Im Team ubernimmt niemand die ungeliebte Aufgabe. Deine Reaktion?',
    options: [
      { text: 'Ich melde mich \u2013 irgendjemand muss es ja machen.', scores: { focus: 90, resources: 85, empathy: 70 } },
      { text: 'Ich warte ab. Wenn niemand anderes will, uberlege ich es mir.', scores: { focus: 45, resources: 40, empathy: 50 } },
      { text: 'Ich schlage eine faire Rotation vor.', scores: { focus: 55, resources: 50, empathy: 60 } },
      { text: 'Ich konzentriere mich auf meine Kernaufgaben \u2013 Spezialisierung ist effizienter.', scores: { focus: 20, resources: 25, empathy: 35 } },
    ],
  },
  {
    id: 'q4',
    text: 'Du siehst jemanden weinen. Was ist deine instinktive Reaktion?',
    options: [
      { text: 'Ich spure den Schmerz fast korperlich mit.', scores: { focus: 70, empathy: 95, resources: 65 } },
      { text: 'Ich mochte helfen, aber halte emotionale Distanz.', scores: { focus: 55, empathy: 55, resources: 50 } },
      { text: 'Ich frage mich kurz, was passiert ist, aber es beruhrt mich nicht lange.', scores: { focus: 30, empathy: 30, resources: 35 } },
      { text: 'Ich respektiere den privaten Moment und schaue weg.', scores: { focus: 20, empathy: 25, resources: 25 } },
    ],
  },
  {
    id: 'q5',
    text: 'Ein Bekannter bittet dich um einen grossen Gefallen, der deinen Sonntag kostet. Was denkst du?',
    options: [
      { text: '\u201ENaturlich helfe ich \u2013 dafur sind Freunde da.\u201C', scores: { focus: 85, resources: 90, empathy: 75 } },
      { text: '\u201EIch wurde gern, aber ich brauche auch meine Erholungszeit.\u201C', scores: { focus: 35, resources: 30, empathy: 50 } },
      { text: '\u201EKommt drauf an \u2013 wie wichtig ist es wirklich?\u201C', scores: { focus: 50, resources: 45, empathy: 55 } },
      { text: '\u201EMein Sonntag ist mir heilig. Ich sage hoflich ab.\u201C', scores: { focus: 15, resources: 15, empathy: 35 } },
    ],
  },
  {
    id: 'q6',
    text: 'Nach einem langen Tag hast du noch etwas Energie ubrig. Was machst du damit?',
    options: [
      { text: 'Ich rufe jemanden an, der vielleicht Gesellschaft braucht.', scores: { focus: 80, resources: 75, empathy: 80 } },
      { text: 'Ich erledige noch etwas fur morgen, um anderen Arbeit abzunehmen.', scores: { focus: 70, resources: 65, empathy: 60 } },
      { text: 'Ich gonne mir bewusst Entspannung \u2013 nur fur mich.', scores: { focus: 20, resources: 20, empathy: 40 } },
      { text: 'Ich investiere in ein personliches Projekt oder Hobby.', scores: { focus: 30, resources: 30, empathy: 45 } },
    ],
  },
  {
    id: 'q7',
    text: 'Jemand kritisiert dich unfair vor anderen. Wie gehst du damit um?',
    options: [
      { text: 'Ich versuche zu verstehen, warum die Person das tut \u2013 vielleicht hat sie selbst Probleme.', scores: { focus: 65, empathy: 85, resources: 55 } },
      { text: 'Ich verteidige mich sachlich und setze Grenzen.', scores: { focus: 35, empathy: 45, resources: 40 } },
      { text: 'Ich reagiere kaum \u2013 die Meinung anderer definiert mich nicht.', scores: { focus: 25, empathy: 35, resources: 30 } },
      { text: 'Es trifft mich, aber ich zeige es nicht.', scores: { focus: 45, empathy: 55, resources: 45 } },
    ],
  },
  {
    id: 'q8',
    text: 'Du hast nur Zeit fur eines: Selbstpflege oder einem Freund helfen. Was wahlst du?',
    options: [
      { text: 'Dem Freund helfen \u2013 ich kann mich spater um mich kummern.', scores: { focus: 90, resources: 95, empathy: 80 } },
      { text: 'Es kommt auf die Dringlichkeit an \u2013 echte Notfalle gehen vor.', scores: { focus: 55, resources: 50, empathy: 60 } },
      { text: 'Selbstpflege \u2013 ich kann nur helfen, wenn ich selbst stabil bin.', scores: { focus: 15, resources: 15, empathy: 40 } },
      { text: 'Ich versuche beides irgendwie zu kombinieren.', scores: { focus: 60, resources: 55, empathy: 65 } },
    ],
  },
  {
    id: 'q9',
    text: 'Was gibt dir langfristig mehr Energie?',
    options: [
      { text: 'Zu wissen, dass ich anderen geholfen habe.', scores: { focus: 85, resources: 80, empathy: 85 } },
      { text: 'Eine Balance aus Geben und Selbstfursorge.', scores: { focus: 50, resources: 50, empathy: 55 } },
      { text: 'Zeit fur mich selbst \u2013 Aufladen ist essentiell.', scores: { focus: 20, resources: 20, empathy: 40 } },
      { text: 'Personliche Erfolge und Wachstum.', scores: { focus: 30, resources: 30, empathy: 45 } },
    ],
  },
  {
    id: 'q10',
    text: 'Zum Abschluss: Was treibt dich im Kern an?',
    options: [
      { text: 'Die Welt ein kleines Stuck besser zu machen \u2013 fur andere.', scores: { focus: 95, resources: 90, empathy: 85 } },
      { text: 'Mein eigenes Potenzial voll zu entfalten.', scores: { focus: 20, resources: 25, empathy: 40 } },
      { text: 'Echte Verbindungen zu Menschen aufzubauen.', scores: { focus: 65, resources: 60, empathy: 90 } },
      { text: 'Ein gutes, ausgeglichenes Leben zu fuhren.', scores: { focus: 45, resources: 45, empathy: 55 } },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// PROFILES (Archetypes)
// ═══════════════════════════════════════════════════════════════

const PROFILES: Profile[] = [
  {
    id: 'weltverbesserer',
    title: 'Der Weltverbesserer',
    tagline: 'Dein Kompass zeigt auf andere \u2013 und das ist deine Superkraft.',
    icon: '\uD83C\uDF0D',
    description:
      'Du lebst mit einem tiefen Bewusstsein fur das Wohlergehen anderer. Empathie ist fur dich keine Anstrengung, sondern dein naturlicher Modus. Deine Fahigkeit, Bedurfnisse zu erkennen und zu handeln, macht dich zu einem naturlichen Katalysator fur positive Veranderung.',
    strengths: [
      'Tiefe Empathie und emotionale Intelligenz',
      'Fahigkeit, Vertrauen aufzubauen',
      'Naturliche Fuhrungskraft durch Fursorge',
    ],
    growth: [
      'Lerne, deine eigenen Bedurfnisse gleichwertig zu behandeln',
      'Ube, auch mal Nein zu sagen ohne Schuldgefuhle',
    ],
    compatibility: { ally: 'Der Ausgewogene', challenge: 'Der Eigenstandige' },
    match: (s) => s.focus >= 60 && s.resources >= 60 && s.empathy >= 55,
    priority: 1,
  },
  {
    id: 'eigenstaendiger',
    title: 'Der Eigenstandige',
    tagline: 'Du bist deine erste Prioritat \u2013 und das ist emotionale Intelligenz.',
    icon: '\uD83C\uDFD4\uFE0F',
    description:
      'Du hast verstanden, was viele erst spat lernen: Man kann nur geben, was man hat. Deine Fahigkeit zur Selbstfursorge ist keine Selbstsucht, sondern Weisheit. Du baust ein stabiles Fundament, von dem aus du nachhaltig wirken kannst.',
    strengths: [
      'Gesunde Grenzsetzung',
      'Emotionale Stabilitat unter Druck',
      'Klare Prioritaten und Fokus',
    ],
    growth: [
      'Experimentiere damit, auch ungefragt Hilfe anzubieten',
      'Erkenne Momente, wo Geben dich bereichern wurde',
    ],
    compatibility: { ally: 'Der Strategische Geber', challenge: 'Der Empathische Schwamm' },
    match: (s) => s.focus <= 40 && s.resources <= 40 && s.empathy <= 45,
    priority: 1,
  },
  {
    id: 'ausgewogener',
    title: 'Der Ausgewogene',
    tagline: 'Die seltene Kunst der Balance \u2013 du hast sie gemeistert.',
    icon: '\u2696\uFE0F',
    description:
      'Du hast das geschafft, woran viele scheitern: ein echtes Gleichgewicht zwischen Selbstfursorge und Fursorge fur andere. Diese Balance ist nicht statisch, sondern ein dynamischer Tanz, den du intuitiv beherrschst.',
    strengths: [
      'Nachhaltige Energie durch ausgewogenes Geben und Nehmen',
      'Gesunde Beziehungen ohne Abhangigkeit',
      'Flexibilitat in beide Richtungen',
    ],
    growth: [
      'Vertraue deiner Intuition, wenn die Balance mal kippt',
      'Teile dein Wissen uber Balance mit anderen',
    ],
    compatibility: { ally: 'Der Weltverbesserer', challenge: 'Der Eigenstandige' },
    match: (s) => s.focus >= 40 && s.focus <= 60 && s.resources >= 40 && s.resources <= 60,
    priority: 0,
  },
  {
    id: 'strategischer_geber',
    title: 'Der Strategische Geber',
    tagline: 'Du gibst klug \u2013 nicht blind. Kopf und Herz in Harmonie.',
    icon: '\uD83C\uDFAF',
    description:
      'Du hilfst \u2013 aber mit Verstand. Deine Fursorge fur andere ist durchdacht: Du fragst dich, wo dein Beitrag den grossten Unterschied macht. Diese Kombination aus Empathie und Pragmatismus macht deine Hilfe besonders wertvoll.',
    strengths: [
      'Hohe Wirksamkeit bei Hilfeleistungen',
      'Gute Ressourcen-Allokation',
      'Verbindet Kopf und Herz',
    ],
    growth: [
      'Erlaube dir manchmal spontane Grosszugigkeit ohne Analyse',
      'Nicht jede Hilfe muss "sinnvoll" sein',
    ],
    compatibility: { ally: 'Der Eigenstandige', challenge: 'Der Empathische Schwamm' },
    match: (s) => s.focus >= 45 && s.resources >= 40 && s.resources <= 65 && s.empathy <= 55,
    priority: 0,
  },
  {
    id: 'empathischer_schwamm',
    title: 'Der Empathische Schwamm',
    tagline: 'Du fuhlst alles \u2013 ob du willst oder nicht. Das ist eine Gabe.',
    icon: '\uD83D\uDCA7',
    description:
      'Deine empathische Antenne ist auf voller Empfangsstarke. Du nimmst die Emotionen anderer auf wie ein Schwamm \u2013 das macht dich zu einem Menschen, bei dem andere sich wirklich verstanden fuhlen.',
    strengths: [
      'Tiefes, authentisches Verstehen anderer',
      'Fahigkeit, Trost zu spenden der wirklich ankommt',
      'Hohe emotionale Intelligenz',
    ],
    growth: [
      'Lerne Techniken zur emotionalen Abgrenzung',
      'Gonne dir regelmassige "Empathie-Pausen"',
    ],
    compatibility: { ally: 'Der Ausgewogene', challenge: 'Der Eigenstandige' },
    match: (s) => s.empathy >= 70,
    priority: 2,
  },
];

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function scoreToBand(score: number): { band: string; label: string } {
  if (score <= 20) return { band: 'low', label: 'Niedrig' };
  if (score <= 40) return { band: 'midlow', label: 'Eher niedrig' };
  if (score <= 60) return { band: 'mid', label: 'Mittel' };
  if (score <= 80) return { band: 'midhigh', label: 'Eher hoch' };
  return { band: 'high', label: 'Hoch' };
}

/**
 * Maps the quiz's 3 internal dimensions (focus, resources, empathy)
 * to Big Five personality scores (0-100) for the ContributionEvent pipeline.
 *
 * Mapping rationale:
 * - Agreeableness  <- average of all three (core construct of this quiz)
 * - Extraversion   <- focus (other-directed attention maps to social energy)
 * - Openness       <- empathy (emotional openness to others' experiences)
 * - Conscientiousness <- resources (deliberate allocation of personal resources)
 * - Neuroticism    <- inverse of empathy balance (high empathy without boundaries = stress)
 */
function mapToBigFive(scores: QuizScores): Record<string, number> {
  const avg = Math.round((scores.focus + scores.resources + scores.empathy) / 3);
  return {
    openness: Math.min(100, Math.max(0, Math.round(scores.empathy * 0.7 + scores.focus * 0.3))),
    conscientiousness: Math.min(100, Math.max(0, Math.round(scores.resources * 0.6 + (100 - scores.focus) * 0.4))),
    extraversion: Math.min(100, Math.max(0, Math.round(scores.focus * 0.8 + scores.empathy * 0.2))),
    agreeableness: Math.min(100, Math.max(0, avg)),
    neuroticism: Math.min(100, Math.max(0, Math.round(Math.max(0, scores.empathy - 50) * 1.2 + Math.max(0, scores.focus - 60) * 0.6))),
  };
}

function matchProfile(scores: QuizScores): Profile {
  const sorted = [...PROFILES].sort((a, b) => b.priority - a.priority);
  return sorted.find((p) => p.match(scores)) ?? PROFILES.find((p) => p.id === 'ausgewogener')!;
}

// ═══════════════════════════════════════════════════════════════
// DIMENSION BAR COLORS
// ═══════════════════════════════════════════════════════════════

const DIM_COLORS: Record<string, { from: string; to: string }> = {
  focus: { from: '#6CA192', to: '#8FB8A8' },
  resources: { from: '#D4AF37', to: '#E8C878' },
  empathy: { from: '#5B8A9A', to: '#7BA8B8' },
};

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function PersonalityQuiz({ onComplete, onClose }: PersonalityQuizProps) {
  const [screen, setScreen] = useState<Screen>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, QuizScores>>({});
  const [finalScores, setFinalScores] = useState<QuizScores | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

  const totalQuestions = QUESTIONS.length;

  // ── Calculate results ──────────────────────────────────────
  const calculateResult = useCallback(
    (allAnswers: Record<string, QuizScores>) => {
      const dimSums: QuizScores = { focus: 0, resources: 0, empathy: 0 };
      const dimCounts: QuizScores = { focus: 0, resources: 0, empathy: 0 };

      Object.values(allAnswers).forEach((scores) => {
        (Object.keys(scores) as Array<keyof QuizScores>).forEach((dim) => {
          dimSums[dim] += scores[dim];
          dimCounts[dim] += 1;
        });
      });

      const computed: QuizScores = {
        focus: Math.round(dimSums.focus / Math.max(dimCounts.focus, 1)),
        resources: Math.round(dimSums.resources / Math.max(dimCounts.resources, 1)),
        empathy: Math.round(dimSums.empathy / Math.max(dimCounts.empathy, 1)),
      };

      const matched = matchProfile(computed);
      const bigFive = mapToBigFive(computed);

      setFinalScores(computed);
      setProfile(matched);
      setScreen('result');

      // Fire the ContributionEvent
      onComplete(personalityToEvent(bigFive));
    },
    [onComplete],
  );

  // ── Select answer ──────────────────────────────────────────
  const selectAnswer = useCallback(
    (questionId: string, scores: QuizScores) => {
      const updated = { ...answers, [questionId]: scores };
      setAnswers(updated);
      setDirection(1);

      if (currentQ < totalQuestions - 1) {
        setCurrentQ((prev) => prev + 1);
      } else {
        calculateResult(updated);
      }
    },
    [answers, currentQ, totalQuestions, calculateResult],
  );

  // ── Go back ────────────────────────────────────────────────
  const goBack = useCallback(() => {
    if (currentQ > 0) {
      setDirection(-1);
      setCurrentQ((prev) => prev - 1);
    }
  }, [currentQ]);

  // ── Restart ────────────────────────────────────────────────
  const restart = useCallback(() => {
    setScreen('intro');
    setCurrentQ(0);
    setAnswers({});
    setFinalScores(null);
    setProfile(null);
    setDirection(1);
  }, []);

  // ── Progress ───────────────────────────────────────────────
  const progressPct = Math.round((currentQ / totalQuestions) * 100);

  // ═══════════════════════════════════════════════════════════
  // RENDER: INTRO
  // ═══════════════════════════════════════════════════════════
  if (screen === 'intro') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-auto max-w-lg px-4 py-8"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full
                     text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Schliessen"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl
                          bg-[#D4AF37]/10 text-4xl">
            <svg className="h-10 w-10 text-[#D4AF37]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>

          <h1 className="mb-3 font-serif text-2xl font-bold text-white md:text-3xl">
            Selbstfursorge oder Weltverbesserer?
          </h1>
          <p className="mb-6 text-white/60">
            Entdecke, wie du deine Energie verteilst
          </p>

          {/* Meta */}
          <div className="mb-8 flex items-center gap-6 text-sm text-white/40">
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
              </svg>
              3 Min
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
              </svg>
              10 Fragen
            </span>
          </div>

          <button
            onClick={() => setScreen('quiz')}
            className="mb-6 w-full rounded-xl bg-[#D4AF37] px-6 py-3.5 font-serif text-base
                       font-semibold text-[#00050A] transition-all hover:bg-[#E8C878]
                       hover:shadow-[0_0_30px_rgba(212,175,55,0.3)]"
          >
            Starte deine Reise
          </button>

          <p className="text-xs leading-relaxed text-white/30">
            Dieser Test dient der spielerischen Selbstreflexion und stellt{' '}
            <strong className="text-white/50">keine</strong> psychologische Diagnose dar.
          </p>
        </div>
      </motion.div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER: QUIZ
  // ═══════════════════════════════════════════════════════════
  if (screen === 'quiz') {
    const q = QUESTIONS[currentQ];
    const selectedAnswer = answers[q.id];

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="relative mx-auto max-w-lg px-4 py-8"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full
                     text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Schliessen"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Progress */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between text-sm text-white/50">
            <span>
              Frage {currentQ + 1}/{totalQuestions}
            </span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#D4AF37] to-[#E8C878]"
              initial={false}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Question */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={q.id}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -40 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="mb-6 font-serif text-lg font-medium leading-relaxed text-white md:text-xl">
              {q.text}
            </p>

            <div className="flex flex-col gap-3">
              {q.options.map((opt, i) => {
                const isSelected =
                  selectedAnswer &&
                  selectedAnswer.focus === opt.scores.focus &&
                  selectedAnswer.resources === opt.scores.resources &&
                  selectedAnswer.empathy === opt.scores.empathy;

                return (
                  <button
                    key={i}
                    onClick={() => selectAnswer(q.id, opt.scores)}
                    className={`rounded-xl border px-4 py-3.5 text-left text-sm leading-relaxed
                               transition-all duration-200
                               ${
                                 isSelected
                                   ? 'border-[#D4AF37]/60 bg-[#D4AF37]/10 text-white'
                                   : 'border-white/10 bg-white/5 text-white/70 hover:border-[#D4AF37]/50 hover:bg-white/10 hover:text-white'
                               }
                               backdrop-blur`}
                  >
                    {opt.text}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Back button */}
        {currentQ > 0 && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={goBack}
            className="mt-6 flex items-center gap-2 text-sm text-white/40 transition-colors
                       hover:text-white/70"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
            Zuruck
          </motion.button>
        )}
      </motion.div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER: RESULT
  // ═══════════════════════════════════════════════════════════
  if (screen === 'result' && profile && finalScores) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-auto max-w-lg px-4 py-8"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full
                     text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Schliessen"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Result card */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
          {/* Header */}
          <div className="border-b border-[#D4AF37]/20 bg-gradient-to-r from-[#D4AF37]/10 to-transparent px-6 py-5">
            <p className="mb-1 text-xs uppercase tracking-widest text-[#D4AF37]/70">
              Dein Archetyp
            </p>
            <h2 className="font-serif text-2xl font-bold text-[#D4AF37]">
              {profile.title}
            </h2>
          </div>

          {/* Portrait area */}
          <div className="flex items-start gap-5 px-6 py-6">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl
                         border border-[#D4AF37]/20 bg-[#D4AF37]/5 text-5xl"
            >
              {profile.icon}
            </motion.div>
            <div>
              <p className="mb-2 font-serif text-sm italic text-[#D4AF37]/80">
                {profile.tagline}
              </p>
              <p className="text-sm leading-relaxed text-white/60">
                {profile.description}
              </p>
            </div>
          </div>

          {/* Stats / Psyche-Profil */}
          <div className="px-6 pb-4">
            <h3 className="mb-4 flex items-center gap-2 font-serif text-xs uppercase tracking-widest text-white/50">
              <span className="text-[#D4AF37]">&#10022;</span>
              Psyche-Profil
            </h3>

            <div className="space-y-3">
              {DIMENSIONS.map((dim) => {
                const score = finalScores[dim.id];
                const { label } = scoreToBand(score);
                const colors = DIM_COLORS[dim.id];

                return (
                  <div key={dim.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/50">{dim.name}</span>
                      <span className="text-[#D4AF37]">{score}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full border border-[#D4AF37]/10 bg-[#041726]">
                        <motion.div
                          className="h-full rounded-full"
                          style={{
                            background: `linear-gradient(90deg, ${colors.from}, ${colors.to})`,
                          }}
                          initial={{ width: 0 }}
                          animate={{ width: `${score}%` }}
                          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </div>
                      <span className="rounded bg-[#D4AF37]/10 px-1.5 py-0.5 text-[10px] text-[#E8C878]">
                        {label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Traits grid */}
          <div className="grid grid-cols-1 gap-4 px-6 pb-6 sm:grid-cols-2">
            {/* Strengths */}
            <div className="rounded-xl border border-white/10 bg-[#041726]/60 p-4">
              <h4 className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-[#6CA192]">
                <span>&#9670;</span> Starken
              </h4>
              <ul className="space-y-2 text-sm text-white/80">
                {profile.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 text-[6px] text-[#6CA192]">&#9670;</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Growth */}
            <div className="rounded-xl border border-white/10 bg-[#041726]/60 p-4">
              <h4 className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-[#D4AF37]">
                <span>&#9670;</span> Wachstum
              </h4>
              <ul className="space-y-2 text-sm text-white/80">
                {profile.growth.map((g, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 text-[6px] text-[#D4AF37]">&#9670;</span>
                    {g}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Compatibility */}
          <div className="px-6 pb-6">
            <h3 className="mb-3 flex items-center gap-2 font-serif text-xs uppercase tracking-widest text-white/50">
              <span className="text-[#D4AF37]">&#10022;</span>
              Kompatibilitat
            </h3>
            <div className="flex gap-4">
              <div className="flex-1 rounded-xl bg-[#041726]/40 p-3 text-center">
                <p className="mb-1 text-[10px] uppercase tracking-widest text-white/40">
                  Verbundeter
                </p>
                <p className="font-serif text-sm text-[#E8C878]">
                  {profile.compatibility.ally}
                </p>
              </div>
              <div className="flex-1 rounded-xl bg-[#041726]/40 p-3 text-center">
                <p className="mb-1 text-[10px] uppercase tracking-widest text-white/40">
                  Herausforderung
                </p>
                <p className="font-serif text-sm text-[#E8C878]">
                  {profile.compatibility.challenge}
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="border-t border-white/10 bg-[#041726]/60 px-6 py-5">
            <div className="flex gap-3">
              <button
                onClick={restart}
                className="rounded-xl border border-[#D4AF37]/30 px-5 py-3 text-sm font-medium
                           text-white/50 transition-all hover:border-[#D4AF37] hover:text-[#D4AF37]"
              >
                &#8634; Neu
              </button>
              <button
                onClick={onClose}
                className="flex-1 rounded-xl bg-[#D4AF37] px-5 py-3 font-serif text-sm
                           font-semibold text-[#00050A] transition-all hover:bg-[#E8C878]
                           hover:shadow-[0_0_30px_rgba(212,175,55,0.3)]"
              >
                Weiter
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Fallback (should not happen)
  return null;
}
