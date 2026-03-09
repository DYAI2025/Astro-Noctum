import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { ContributionEvent } from '@/src/lib/lme/types';
import { eqToEvent } from '@/src/lib/fusion-ring/quiz-to-event';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface EQQuizProps {
  onComplete: (event: ContributionEvent) => void;
  onClose: () => void;
}

interface Score {
  [key: string]: number;
  perception: number;
  regulation: number;
  utilization: number;
}

interface QuizOption {
  id: string;
  text: string;
  scores: Score;
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

interface EQProfile {
  id: string;
  title: string;
  tagline: string;
  emoji: string;
  color: string;
  accent: string;
  description: string;
  stats: ProfileStat[];
  allies: string[];
  nemesis: string;
  match: (s: Score) => boolean;
}

type Screen = 'intro' | 'quiz' | 'loading' | 'result';

const INITIAL_SCORES: Score = { perception: 0, regulation: 0, utilization: 0 };

// ═══════════════════════════════════════════════════════════════
// QUIZ DATA
// ═══════════════════════════════════════════════════════════════

const META = {
  title: 'Deine Emotionale Signatur',
  subtitle: 'Entdecke dein einzigartiges Muster emotionaler Intelligenz',
};

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1', context: 'Selbstwahrnehmung',
    text: 'Du wachst mit einem diffusen Unbehagen auf. Kein klarer Grund, nur ein Gef\u00fchl. Was passiert in dir?',
    options: [
      { id: 'q1a', text: 'Ich halte inne und frage mich: Ist das Angst? Traurigkeit? Ersch\u00f6pfung? Ich versuche, das Gef\u00fchl pr\u00e4zise zu benennen.', scores: { perception: 5, regulation: 3, utilization: 2 } },
      { id: 'q1b', text: 'Ich starte meinen Tag und schaue, ob sich das Gef\u00fchl von selbst aufl\u00f6st.', scores: { perception: 1, regulation: 4, utilization: 3 } },
      { id: 'q1c', text: 'Ich nutze das Gef\u00fchl als Signal: Vielleicht sollte ich heute sanfter mit mir sein.', scores: { perception: 3, regulation: 4, utilization: 5 } },
      { id: 'q1d', text: 'Ich spreche sofort mit jemandem dar\u00fcber \u2013 beim Aussprechen wird mir oft klar, was los ist.', scores: { perception: 4, regulation: 2, utilization: 3 } },
    ],
  },
  {
    id: 'q2', context: 'Soziale Wahrnehmung',
    text: 'Du betrittst einen Raum und sp\u00fcrst sofort: Die Stimmung ist anders als erwartet. Was nimmst du wahr?',
    options: [
      { id: 'q2a', text: 'Ich registriere subtile Details: verschr\u00e4nkte Arme, gemiedene Blicke, die zu ruhige Stimme.', scores: { perception: 5, regulation: 2, utilization: 3 } },
      { id: 'q2b', text: 'Ich bemerke, dass etwas nicht stimmt, fokussiere mich aber bewusst auf meine eigene Aufgabe.', scores: { perception: 2, regulation: 5, utilization: 2 } },
      { id: 'q2c', text: 'Ich \u00fcberlege strategisch: Wie wirkt sich diese Spannung auf meine Ziele heute aus?', scores: { perception: 3, regulation: 3, utilization: 5 } },
      { id: 'q2d', text: "Ich frage direkt: 'Hey, ist alles okay? Die Stimmung wirkt heute anders.'", scores: { perception: 3, regulation: 1, utilization: 4 } },
    ],
  },
  {
    id: 'q3', context: 'Impulskontrolle',
    text: 'Jemand macht eine Bemerkung, die dich trifft. Du sp\u00fcrst, wie \u00c4rger in dir hochsteigt. Was passiert dann?',
    options: [
      { id: 'q3a', text: 'Ich sp\u00fcre den \u00c4rger intensiv, fast k\u00f6rperlich. Ich muss erstmal durchatmen.', scores: { perception: 5, regulation: 3, utilization: 2 } },
      { id: 'q3b', text: 'Ich schalte innerlich einen Gang runter. Ich registriere den \u00c4rger, aber erlaube ihm nicht, meine Reaktion zu diktieren.', scores: { perception: 3, regulation: 5, utilization: 3 } },
      { id: 'q3c', text: 'Ich kontere sofort. Wenn jemand unter die G\u00fcrtellinie geht, darf er wissen, wie das ankommt.', scores: { perception: 3, regulation: 1, utilization: 2 } },
      { id: 'q3d', text: 'Ich frage mich: Will ich jetzt gewinnen oder will ich verstehen?', scores: { perception: 4, regulation: 4, utilization: 5 } },
    ],
  },
  {
    id: 'q4', context: 'Emotionale Granularit\u00e4t',
    text: "Ein Freund fragt: 'Wie geht's dir?' \u2013 und du merkst, dass 'gut' oder 'schlecht' die Antwort nicht trifft.",
    options: [
      { id: 'q4a', text: "Ich finde pr\u00e4zise Worte: 'Ich bin melancholisch-nachdenklich, aber nicht traurig.'", scores: { perception: 5, regulation: 2, utilization: 3 } },
      { id: 'q4b', text: "Ich sage 'kompliziert' und lasse es dabei. Nicht jedes Gef\u00fchl braucht ein Label.", scores: { perception: 2, regulation: 4, utilization: 2 } },
      { id: 'q4c', text: "Ich beschreibe es \u00fcber den K\u00f6rper: 'Ich hab so ein Kribbeln im Bauch.'", scores: { perception: 4, regulation: 2, utilization: 2 } },
      { id: 'q4d', text: 'Ich nutze die Frage als Anlass, um mit dem Freund tiefer zu sprechen.', scores: { perception: 3, regulation: 3, utilization: 5 } },
    ],
  },
  {
    id: 'q5', context: 'Emotionsnutzung',
    text: 'Du musst eine wichtige Pr\u00e4sentation halten. Wie gehst du emotional in diese Situation?',
    options: [
      { id: 'q5a', text: 'Ich versuche, komplett ruhig zu sein. Nervosit\u00e4t ist der Feind klarer Gedanken.', scores: { perception: 2, regulation: 5, utilization: 2 } },
      { id: 'q5b', text: 'Ich transformiere die Nervosit\u00e4t in Energie. Das Kribbeln ist wie Strom.', scores: { perception: 4, regulation: 3, utilization: 5 } },
      { id: 'q5c', text: 'Ich f\u00fchle alles intensiv \u2013 die Aufregung, die Unsicherheit. Das macht mich authentisch.', scores: { perception: 5, regulation: 1, utilization: 3 } },
      { id: 'q5d', text: 'Ich visualisiere den besten Ausgang und baue mir damit positive Emotionen auf.', scores: { perception: 3, regulation: 4, utilization: 5 } },
    ],
  },
  {
    id: 'q6', context: 'Empathie',
    text: 'Eine Freundin erz\u00e4hlt von einem Problem. Du merkst: Sie will eigentlich nicht deinen Rat.',
    options: [
      { id: 'q6a', text: 'Ich sp\u00fcre genau, was sie braucht \u2013 Pr\u00e4senz, nicht L\u00f6sungen. Ich h\u00f6re zu und spiegle ihre Gef\u00fchle.', scores: { perception: 5, regulation: 3, utilization: 4 } },
      { id: 'q6b', text: "Ich frage nach: 'Was brauchst du gerade von mir? Zuh\u00f6ren oder Ideen?'", scores: { perception: 3, regulation: 4, utilization: 5 } },
      { id: 'q6c', text: 'Ich muss aufpassen, dass ich ihre Gef\u00fchle nicht zu stark \u00fcbernehme.', scores: { perception: 5, regulation: 1, utilization: 2 } },
      { id: 'q6d', text: 'Ich gebe trotzdem Rat. Manchmal wissen Menschen nicht, was sie brauchen.', scores: { perception: 2, regulation: 3, utilization: 3 } },
    ],
  },
  {
    id: 'q7', context: 'Konfliktnavigation',
    text: 'Zwei Menschen, die dir wichtig sind, streiten sich. Du stehst dazwischen.',
    options: [
      { id: 'q7a', text: 'Ich sp\u00fcre beide Seiten k\u00f6rperlich \u2013 ihre Anspannung, ihre Verletzung.', scores: { perception: 5, regulation: 1, utilization: 2 } },
      { id: 'q7b', text: 'Ich distanziere mich emotional und analysiere: Was ist hier der eigentliche Konflikt?', scores: { perception: 3, regulation: 5, utilization: 4 } },
      { id: 'q7c', text: 'Ich \u00fcberlege, wie ich die Situation de-eskalieren kann.', scores: { perception: 3, regulation: 3, utilization: 5 } },
      { id: 'q7d', text: 'Ich warte ab. Nicht jeder Konflikt braucht meine Intervention.', scores: { perception: 2, regulation: 5, utilization: 3 } },
    ],
  },
  {
    id: 'q8', context: 'Stressreaktion',
    text: 'Deadline-Druck. Zu viel zu tun, zu wenig Zeit. Wie verh\u00e4ltst du dich zu deinem Stresslevel?',
    options: [
      { id: 'q8a', text: 'Ich merke es erst, wenn mein K\u00f6rper Alarm schl\u00e4gt \u2013 Kopfschmerzen, Magenprobleme.', scores: { perception: 1, regulation: 2, utilization: 2 } },
      { id: 'q8b', text: "Ich beobachte meinen Stress wie einen Wetterbericht: 'Okay, Sturmwarnung.'", scores: { perception: 4, regulation: 5, utilization: 4 } },
      { id: 'q8c', text: 'Ich nutze den Adrenalinstoß. Unter Druck bin ich fokussierter, schneller.', scores: { perception: 3, regulation: 3, utilization: 5 } },
      { id: 'q8d', text: 'Ich sp\u00fcre den Stress intensiv und teile ihn mit anderen.', scores: { perception: 4, regulation: 2, utilization: 3 } },
    ],
  },
  {
    id: 'q9', context: 'Emotionales Verstehen',
    text: 'Jemand reagiert auf eine harmlose Situation v\u00f6llig \u00fcberzogen. Dein erster Gedanke ist...',
    options: [
      { id: 'q9a', text: "'Da steckt mehr dahinter.' Ich frage mich, welche Vorgeschichte das erkl\u00e4rt.", scores: { perception: 5, regulation: 4, utilization: 4 } },
      { id: 'q9b', text: "'Interessant, aber nicht mein Problem.' Ich registriere es, aber lasse mich nicht tangieren.", scores: { perception: 2, regulation: 5, utilization: 2 } },
      { id: 'q9c', text: "'Wie kann ich das nutzen?' Vielleicht offenbart diese Reaktion etwas Wichtiges.", scores: { perception: 3, regulation: 3, utilization: 5 } },
      { id: 'q9d', text: 'Ich bin selbst verunsichert. Starke Emotionen anderer bringen mich aus dem Gleichgewicht.', scores: { perception: 4, regulation: 1, utilization: 1 } },
    ],
  },
  {
    id: 'q10', context: 'Freude teilen',
    text: 'Dir passiert etwas richtig Gutes \u2013 ein pers\u00f6nlicher Erfolg. Wie gehst du mit dieser Freude um?',
    options: [
      { id: 'q10a', text: 'Ich koste das Gef\u00fchl aus, verst\u00e4rke es bewusst. Ich erlaube mir, strahlend zu sein.', scores: { perception: 4, regulation: 2, utilization: 5 } },
      { id: 'q10b', text: 'Ich genie\u00dfe es innerlich, bleibe aber nach au\u00dfen gelassen.', scores: { perception: 3, regulation: 5, utilization: 3 } },
      { id: 'q10c', text: 'Ich teile es sofort \u2013 der Wert der Freude verdoppelt sich, wenn sie geteilt wird.', scores: { perception: 4, regulation: 2, utilization: 4 } },
      { id: 'q10d', text: 'Ich analysiere: Was genau hat dieses Gef\u00fchl ausgel\u00f6st? Wie kann ich das replizieren?', scores: { perception: 3, regulation: 4, utilization: 5 } },
    ],
  },
  {
    id: 'q11', context: 'Emotionale Ersch\u00f6pfung',
    text: 'Nach einem intensiven Tag merkst du: Dein emotionaler Tank ist leer. Was regeneriert dich?',
    options: [
      { id: 'q11a', text: 'Absolute Stille und Alleinsein. Ich muss das alles erstmal sortieren.', scores: { perception: 5, regulation: 3, utilization: 2 } },
      { id: 'q11b', text: 'Eine klare, ablenkende Aktivit\u00e4t \u2013 Sport, Putzen. Das erdet mich.', scores: { perception: 2, regulation: 5, utilization: 3 } },
      { id: 'q11c', text: 'Ein Wechsel der emotionalen Tonlage: Comedy, Musik, Tanz.', scores: { perception: 3, regulation: 4, utilization: 5 } },
      { id: 'q11d', text: 'Mehr Verbindung, aber anders: Ich rufe jemanden an, der mich aufl\u00e4dt.', scores: { perception: 4, regulation: 2, utilization: 4 } },
    ],
  },
  {
    id: 'q12', context: 'Integration',
    text: 'Wenn du an dein Verh\u00e4ltnis zu Emotionen denkst \u2013 wie w\u00fcrdest du es beschreiben?',
    options: [
      { id: 'q12a', text: 'Intensiv und immersiv. Ich f\u00fchle alles \u2013 meins, deins, das des Raumes.', scores: { perception: 5, regulation: 1, utilization: 3 } },
      { id: 'q12b', text: 'Kontrolliert und bewusst. Ich beobachte meine Emotionen, aber sie steuern mich nicht.', scores: { perception: 3, regulation: 5, utilization: 4 } },
      { id: 'q12c', text: 'Strategisch und adaptive. Emotionen sind Daten und Werkzeuge.', scores: { perception: 3, regulation: 4, utilization: 5 } },
      { id: 'q12d', text: 'Ehrlich gesagt: kompliziert. Manchmal \u00fcberw\u00e4ltigt, manchmal taub.', scores: { perception: 3, regulation: 2, utilization: 2 } },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// PROFILES
// ═══════════════════════════════════════════════════════════════

const PROFILES: EQProfile[] = [
  {
    id: 'resonator',
    title: 'Der Resonator',
    tagline: 'Du sp\u00fcrst, was andere noch nicht sagen k\u00f6nnen',
    emoji: '\ud83c\udfad',
    color: '#4A0E4E',
    accent: '#E8B4E8',
    description: 'Du bist ein emotionaler Seismograph \u2013 fein kalibriert f\u00fcr die subtilen Schwingungen, die andere gar nicht registrieren. Noch bevor jemand spricht, hast du die Atmosph\u00e4re gelesen.\n\nDein Profil zeigt au\u00dfergew\u00f6hnlich hohe Werte in der emotionalen Granularit\u00e4t \u2013 der F\u00e4higkeit, zwischen \u00e4hnlichen Gef\u00fchlen pr\u00e4zise zu unterscheiden.',
    stats: [
      { label: 'Emotionale Antenne', value: 'Maximal' },
      { label: 'Granularit\u00e4t', value: '97%' },
      { label: 'Empathische Resonanz', value: 'Legend\u00e4r' },
    ],
    allies: ['Der Regulator'],
    nemesis: 'Der Stratege',
    match: (s: Score) => s.perception >= 4 && s.regulation <= 3,
  },
  {
    id: 'regulator',
    title: 'Der Regulator',
    tagline: 'Du bist der ruhige Pol im Sturm',
    emoji: '\u2696\ufe0f',
    color: '#1C3B5C',
    accent: '#7DC5E8',
    description: 'Du bist der emotionale Thermostat \u2013 f\u00e4hig, die Temperatur zu sp\u00fcren und zu justieren, ohne selbst zu \u00fcberhitzen oder einzufrieren.\n\nDein Profil zeigt starke pr\u00e4frontale Regulation \u2013 die F\u00e4higkeit deines Kortex, die emotionalen Impulse der Amygdala zu modulieren.',
    stats: [
      { label: 'Impulskontrolle', value: '95%' },
      { label: 'Emotionale Distanz', value: 'Meister' },
      { label: 'Stresstoleranz', value: 'Hoch' },
    ],
    allies: ['Der Resonator'],
    nemesis: 'Der Navigator',
    match: (s: Score) => s.regulation >= 4 && s.perception <= 3,
  },
  {
    id: 'strategist',
    title: 'Der Stratege',
    tagline: 'Du wandelst Gef\u00fchle in Treibstoff',
    emoji: '\ud83c\udfaf',
    color: '#2D4A3E',
    accent: '#8FD9A8',
    description: 'Du betrachtest Emotionen nicht als Zuf\u00e4lle, sondern als Ressourcen. Nervosit\u00e4t? Transformierst du in fokussierte Energie. \u00c4rger? Kanalisierst du in Durchsetzungskraft.\n\nDein Profil zeigt hohe Werte in der emotionalen Facilitation \u2013 du verstehst intuitiv, dass verschiedene Stimmungen verschiedene Denkstile beg\u00fcnstigen.',
    stats: [
      { label: 'Emotions-Transformation', value: 'Pro' },
      { label: 'Strategischer Einsatz', value: '98%' },
      { label: 'Zielverfolgung', value: 'Stark' },
    ],
    allies: ['Der Navigator'],
    nemesis: 'Der Resonator',
    match: (s: Score) => s.utilization >= 4 && s.perception <= 3.5,
  },
  {
    id: 'navigator',
    title: 'Der Navigator',
    tagline: 'Du liest die sozialen Str\u00f6mungen',
    emoji: '\ud83e\udded',
    color: '#4A3B2D',
    accent: '#D9C08F',
    description: 'Du bist der emotionale Diplomat \u2013 begabt darin, die unsichtbaren Str\u00f6me zwischen Menschen zu lesen und zu navigieren.\n\nDein Profil zeigt ausgepr\u00e4gte soziale Intelligenz \u2013 die F\u00e4higkeit, nicht nur einzelne Emotionen, sondern ganze emotionale Systeme zu lesen.',
    stats: [
      { label: 'Soziale Intelligenz', value: 'Exzellent' },
      { label: 'Systemdenken', value: '94%' },
      { label: 'Diplomatisches Geschick', value: 'A+' },
    ],
    allies: ['Der Stratege'],
    nemesis: 'Der Regulator',
    match: (s: Score) => s.perception >= 3.5 && s.utilization >= 3.5,
  },
  {
    id: 'alchemist',
    title: 'Der Alchemist',
    tagline: 'Du verwandelst Blei in Gold \u2013 emotional',
    emoji: '\u2697\ufe0f',
    color: '#3D2A4A',
    accent: '#D4A8E8',
    description: 'Du vereinst, was andere trennen. In dir treffen sich intensive Wahrnehmung, bewusste Steuerung und strategische Nutzung \u2013 eine seltene Integration.\n\nDein Profil zeigt eine seltene Balance \u00fcber alle drei Zweige der emotionalen Intelligenz hinweg.',
    stats: [
      { label: 'EQ-Balance', value: 'Optimal' },
      { label: 'Psychologische Flexibilit\u00e4t', value: '96%' },
      { label: 'Integration', value: 'Meister' },
    ],
    allies: ['Alle Typen'],
    nemesis: 'Eigene Komplexit\u00e4t',
    match: (s: Score) => {
      const avg = (s.perception + s.regulation + s.utilization) / 3;
      const variance = Math.abs(s.perception - avg) + Math.abs(s.regulation - avg) + Math.abs(s.utilization - avg);
      return avg >= 3.5 && variance <= 2;
    },
  },
  {
    id: 'seeker',
    title: 'Der Suchende',
    tagline: 'Du bist auf dem Weg zu dir selbst',
    emoji: '\ud83d\udd2e',
    color: '#2A2A3D',
    accent: '#9D8FD9',
    description: 'Du bist ehrlich mit dir: Dein Verh\u00e4ltnis zu Emotionen ist noch in Arbeit. Das ist kein Defizit \u2013 es ist Potenzial.\n\nDein Profil zeigt emotionale Variabilit\u00e4t \u2013 unterschiedliche Reaktionsmuster je nach Kontext.',
    stats: [
      { label: 'Selbsterkenntnis', value: 'Wachsend' },
      { label: 'Entwicklungspotenzial', value: 'Hoch' },
      { label: 'Offenheit', value: 'Stark' },
    ],
    allies: ['Der Alchemist'],
    nemesis: 'Eigene Ungeduld',
    match: () => true, // Fallback
  },
];

// ═══════════════════════════════════════════════════════════════
// SCORING LOGIC
// ═══════════════════════════════════════════════════════════════

function normalizeScore(raw: Score, questionCount: number): Score {
  return {
    perception: raw.perception / questionCount,
    regulation: raw.regulation / questionCount,
    utilization: raw.utilization / questionCount,
  };
}

function getProfile(scores: Score): EQProfile {
  const normalized = normalizeScore(scores, QUESTIONS.length);

  // Check profiles in order (alchemist first since it's the special balanced case)
  for (const profile of PROFILES) {
    if (profile.id !== 'seeker' && profile.match(normalized)) {
      return profile;
    }
  }

  // Fallback to seeker
  return PROFILES.find(p => p.id === 'seeker')!;
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
      <div className="text-6xl mb-8">{'\ud83d\udd2e'}</div>

      <h1 className="font-serif text-2xl sm:text-3xl text-white mb-4 leading-tight">
        {META.title}
      </h1>

      <p className="text-white/60 text-sm sm:text-base max-w-md mb-8 leading-relaxed">
        {META.subtitle}
      </p>

      <div className="flex gap-6 text-white/40 text-xs mb-10">
        <div className="flex items-center gap-1.5">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span>3-4 Minuten</span>
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
        Starten
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
        {question.context}
      </p>
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
      <p className="font-serif text-xl text-white mb-2">Deine Signatur entsteht...</p>
      <p className="text-sm text-white/50">Emotionale Muster werden analysiert</p>
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
  profile: EQProfile;
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
      <div
        className="w-full max-w-sm border border-[#D4AF37]/30 rounded-2xl p-6 relative overflow-hidden shadow-2xl"
        style={{ background: `linear-gradient(135deg, ${profile.color}30 0%, #0a0a1a 100%)` }}
      >
        {/* Top gold line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

        {/* Header */}
        <div className="text-center mb-5">
          <p className="text-[#D4AF37] text-xs font-semibold uppercase tracking-[0.12em] mb-3">
            Emotionale Signatur
          </p>
          <div className="text-6xl mb-4">{profile.emoji}</div>
          <h2 className="font-serif text-2xl text-white mb-1">{profile.title}</h2>
          <p className="font-serif text-base text-[#C4A86C] italic">&quot;{profile.tagline}&quot;</p>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent my-5" />

        {/* Description */}
        <p className="text-sm text-white/60 leading-relaxed text-center mb-5 whitespace-pre-line">
          {profile.description}
        </p>

        {/* Stats */}
        <div className="bg-white/5 backdrop-blur border border-gold/10 rounded-xl p-4 mb-5">
          <h3 className="text-white/50 text-xs uppercase tracking-wider mb-3">Deine Stats</h3>
          <div className="space-y-2">
            {profile.stats.map((stat) => (
              <div key={stat.label} className="flex justify-between items-center">
                <span className="text-white/70 text-sm">{stat.label}</span>
                <span className="font-mono text-sm" style={{ color: profile.accent }}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Compatibility */}
        <div className="bg-white/5 backdrop-blur border border-gold/10 rounded-xl p-4">
          <div className="flex justify-between items-center text-sm mb-2 pb-2 border-b border-white/10">
            <span className="text-white/50">Verb&uuml;ndete</span>
            <span className="font-medium text-[#8FB8A8]">{profile.allies.join(', ')}</span>
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

export default function EQQuiz({ onComplete, onClose }: EQQuizProps) {
  const [screen, setScreen] = useState<Screen>('intro');
  const [questionIdx, setQuestionIdx] = useState(0);
  const [scores, setScores] = useState<Score>({ ...INITIAL_SCORES });
  const [resultProfile, setResultProfile] = useState<EQProfile | null>(null);

  const handleStart = useCallback(() => {
    setScreen('quiz');
    setQuestionIdx(0);
    setScores({ ...INITIAL_SCORES });
    setResultProfile(null);
  }, []);

  const handleAnswer = useCallback(
    (optionIdx: number) => {
      const question = QUESTIONS[questionIdx];
      const option = question.options[optionIdx];

      setScores((prev) => ({
        perception: prev.perception + option.scores.perception,
        regulation: prev.regulation + option.scores.regulation,
        utilization: prev.utilization + option.scores.utilization,
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
      const profile = getProfile(scores);
      setResultProfile(profile);
      setScreen('result');
      onComplete(eqToEvent(scores));
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

        {screen === 'result' && resultProfile && (
          <ResultScreen key="result" profile={resultProfile} onRestart={handleStart} onClose={onClose} />
        )}
      </AnimatePresence>
    </div>
  );
}
