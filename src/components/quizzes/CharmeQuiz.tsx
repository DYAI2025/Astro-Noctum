import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { ContributionEvent } from '@/src/lib/lme/types';
import { charmeToEvent } from '@/src/lib/fusion-ring/quiz-to-event';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface CharmeQuizProps {
  onComplete: (event: ContributionEvent) => void;
  onClose: () => void;
}

interface Score {
  [key: string]: number;
  warmth: number;
  resonance: number;
  authenticity: number;
  presence: number;
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

interface CharmeProfile {
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

const INITIAL_SCORES: Score = { warmth: 0, resonance: 0, authenticity: 0, presence: 0 };

// ═══════════════════════════════════════════════════════════════
// QUIZ DATA
// ═══════════════════════════════════════════════════════════════

const META = {
  title: 'Die Kunst des Charmes',
  subtitle: 'Entdecke deine einzigartige Signatur der Anziehung',
};

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1', context: 'Der erste Eindruck',
    text: 'Du betrittst einen Raum voller Fremder. Wie orientierst du dich?',
    options: [
      { id: 'q1a', text: 'Ich scanne nach bekannten Gesichtern \u2013 und wenn ich keins finde, warte ich, bis jemand mich anspricht.', scores: { warmth: 2, resonance: 4, authenticity: 4, presence: 4 } },
      { id: 'q1b', text: 'Ich suche die Person, die am unsichersten wirkt, und gehe direkt auf sie zu.', scores: { warmth: 5, resonance: 4, authenticity: 5, presence: 5 } },
      { id: 'q1c', text: 'Ich positioniere mich strategisch gut sichtbar und beginne ein angeregtes Gespr\u00e4ch mit dem N\u00e4chstbesten.', scores: { warmth: 3, resonance: 2, authenticity: 2, presence: 1 } },
      { id: 'q1d', text: 'Ich beobachte die Dynamik des Raums \u2013 wer geh\u00f6rt zusammen, wo ist Energie, wo Spannung?', scores: { warmth: 3, resonance: 5, authenticity: 4, presence: 3 } },
    ],
  },
  {
    id: 'q2', context: 'Das Geheimnis des L\u00e4chelns',
    text: 'Jemand erz\u00e4hlt dir einen Witz, der nicht besonders lustig ist. Was passiert in deinem Gesicht?',
    options: [
      { id: 'q2a', text: 'Ich lache h\u00f6flich mit \u2013 niemand sollte sich unwohl f\u00fchlen.', scores: { warmth: 4, resonance: 3, authenticity: 2, presence: 4 } },
      { id: 'q2b', text: 'Meine Mundwinkel heben sich, aber meine Augen verraten mich \u2013 ich kann nicht l\u00fcgen.', scores: { warmth: 3, resonance: 4, authenticity: 5, presence: 3 } },
      { id: 'q2c', text: "Ich schmunzle warm und sage: 'Das war charmant versucht.'", scores: { warmth: 5, resonance: 3, authenticity: 4, presence: 4 } },
      { id: 'q2d', text: 'Ich strahle W\u00e4rme aus und lenke geschickt auf etwas um, bei dem wir beide wirklich lachen k\u00f6nnen.', scores: { warmth: 5, resonance: 2, authenticity: 3, presence: 2 } },
    ],
  },
  {
    id: 'q3', context: 'Die Kunst des Zuh\u00f6rens',
    text: 'Jemand erz\u00e4hlt dir von einem Problem, das dich pers\u00f6nlich nicht betrifft. Wie h\u00f6rst du zu?',
    options: [
      { id: 'q3a', text: 'Ich stelle gezielte Fragen, um die Situation zu analysieren und L\u00f6sungen anzubieten.', scores: { warmth: 3, resonance: 1, authenticity: 3, presence: 2 } },
      { id: 'q3b', text: 'Ich lehne mich vor, halte Blickkontakt und lasse die Stille wirken, wenn sie n\u00f6tig ist.', scores: { warmth: 5, resonance: 5, authenticity: 5, presence: 5 } },
      { id: 'q3c', text: 'Ich teile \u00e4hnliche eigene Erfahrungen, damit die Person sich weniger allein f\u00fchlt.', scores: { warmth: 4, resonance: 2, authenticity: 4, presence: 2 } },
      { id: 'q3d', text: 'Ich nicke, fasse zusammen und zeige durch meine K\u00f6rpersprache, dass ich pr\u00e4sent bin.', scores: { warmth: 4, resonance: 4, authenticity: 3, presence: 4 } },
    ],
  },
  {
    id: 'q4', context: 'Spannung im Raum',
    text: 'Ein Streit entwickelt sich zwischen zwei Menschen in deiner Gegenwart. Was tust du?',
    options: [
      { id: 'q4a', text: 'Ich bringe Humor ein \u2013 ein gut getimter Kommentar kann Wunder wirken.', scores: { warmth: 4, resonance: 2, authenticity: 3, presence: 1 } },
      { id: 'q4b', text: 'Ich wende mich an die ruhigere Person und gebe ihr Raum, ihre Perspektive zu teilen.', scores: { warmth: 5, resonance: 4, authenticity: 4, presence: 5 } },
      { id: 'q4c', text: 'Ich bleibe gelassen und strahle eine Ruhe aus, die ansteckend wirkt.', scores: { warmth: 4, resonance: 5, authenticity: 4, presence: 5 } },
      { id: 'q4d', text: 'Ich strukturiere das Gespr\u00e4ch und schlage einen diplomatischen Kompromiss vor.', scores: { warmth: 3, resonance: 1, authenticity: 3, presence: 3 } },
    ],
  },
  {
    id: 'q5', context: 'Der verletzliche Moment',
    text: 'Du hast einen Fehler gemacht, der anderen aufgefallen ist. Wie gehst du damit um?',
    options: [
      { id: 'q5a', text: 'Ich gebe es offen zu und lache \u00fcber mich selbst \u2013 Perfektion langweilt sowieso.', scores: { warmth: 4, resonance: 3, authenticity: 5, presence: 2 } },
      { id: 'q5b', text: 'Ich entschuldige mich aufrichtig und frage, wie ich es wieder gutmachen kann.', scores: { warmth: 5, resonance: 3, authenticity: 5, presence: 4 } },
      { id: 'q5c', text: 'Ich erkl\u00e4re den Kontext meines Fehlers, damit andere ihn einordnen k\u00f6nnen.', scores: { warmth: 2, resonance: 1, authenticity: 3, presence: 2 } },
      { id: 'q5d', text: 'Ich zeige kurz Betroffenheit, aber wechsle schnell zu einer L\u00f6sung.', scores: { warmth: 3, resonance: 2, authenticity: 2, presence: 2 } },
    ],
  },
  {
    id: 'q6', context: 'Das Kompliment',
    text: 'Du willst jemandem ehrlich sagen, was du an ihm sch\u00e4tzt. Wie machst du das?',
    options: [
      { id: 'q6a', text: "Ich sage es direkt und spezifisch: 'Was du gerade gemacht hast, war brillant, weil...'", scores: { warmth: 4, resonance: 1, authenticity: 4, presence: 2 } },
      { id: 'q6b', text: 'Ich lege meine Hand auf ihre Schulter und sage es mit warmem Blick in wenigen Worten.', scores: { warmth: 5, resonance: 5, authenticity: 4, presence: 4 } },
      { id: 'q6c', text: 'Ich erw\u00e4hne es sp\u00e4ter nebenbei, fast beil\u00e4ufig \u2013 gro\u00dfe Gesten machen mich verlegen.', scores: { warmth: 3, resonance: 4, authenticity: 5, presence: 4 } },
      { id: 'q6d', text: 'Ich finde einen spielerischen Weg, es in einen Insider-Witz zwischen uns zu verwandeln.', scores: { warmth: 4, resonance: 2, authenticity: 3, presence: 1 } },
    ],
  },
  {
    id: 'q7', context: 'Der Fremde neben dir',
    text: 'Du sitzt neben jemandem, den du nicht kennst, aber die Situation erlaubt Gespr\u00e4ch. Was passiert?',
    options: [
      { id: 'q7a', text: 'Ich warte auf einen nat\u00fcrlichen Moment \u2013 vielleicht ein geteiltes Schmunzeln \u00fcber etwas.', scores: { warmth: 4, resonance: 5, authenticity: 5, presence: 4 } },
      { id: 'q7b', text: 'Ich starte mit einer offenen Frage, die echte Neugier zeigt.', scores: { warmth: 5, resonance: 2, authenticity: 4, presence: 2 } },
      { id: 'q7c', text: 'Ich bleibe still, aber sende offene K\u00f6rpersprache \u2013 wer reden will, wird es tun.', scores: { warmth: 3, resonance: 5, authenticity: 4, presence: 5 } },
      { id: 'q7d', text: 'Ich kommentiere etwas Konkretes um uns herum, um das Eis zu brechen.', scores: { warmth: 4, resonance: 2, authenticity: 3, presence: 2 } },
    ],
  },
  {
    id: 'q8', context: 'Der schwere Tag',
    text: 'Ein Freund hat einen schlechten Tag. Du merkst es an seiner Energie. Was ist deine erste Reaktion?',
    options: [
      { id: 'q8a', text: "Ich frage direkt: 'Was ist los?' \u2013 Ehrlichkeit \u00fcber allem.", scores: { warmth: 4, resonance: 2, authenticity: 4, presence: 2 } },
      { id: 'q8b', text: 'Ich sitze einfach neben ihm und bin da \u2013 Worte kommen, wenn sie kommen.', scores: { warmth: 5, resonance: 5, authenticity: 5, presence: 5 } },
      { id: 'q8c', text: "Ich bringe ihm seinen Lieblingskaffee und sage: 'Du musst nichts erz\u00e4hlen.'", scores: { warmth: 5, resonance: 4, authenticity: 4, presence: 5 } },
      { id: 'q8d', text: 'Ich versuche, ihn abzulenken \u2013 manchmal braucht man einfach Pause vom Gr\u00fcbeln.', scores: { warmth: 4, resonance: 2, authenticity: 3, presence: 1 } },
    ],
  },
  {
    id: 'q9', context: 'Im Rampenlicht',
    text: 'Du stehst im Mittelpunkt \u2013 alle Augen auf dir. Was ist dein Instinkt?',
    options: [
      { id: 'q9a', text: 'Ich genie\u00dfe es kurz, aber lenke dann schnell den Fokus auf andere.', scores: { warmth: 5, resonance: 3, authenticity: 4, presence: 3 } },
      { id: 'q9b', text: 'Ich nutze den Moment, um etwas Bedeutungsvolles zu sagen.', scores: { warmth: 3, resonance: 1, authenticity: 4, presence: 2 } },
      { id: 'q9c', text: 'Ich mache etwas \u00dcberraschendes, das Spannung bricht und alle einbezieht.', scores: { warmth: 4, resonance: 2, authenticity: 3, presence: 1 } },
      { id: 'q9d', text: 'Ich halte den Moment still, l\u00e4chle und lasse meine Ruhe sprechen.', scores: { warmth: 3, resonance: 5, authenticity: 4, presence: 5 } },
    ],
  },
  {
    id: 'q10', context: 'Die unsichtbare Verbindung',
    text: 'Du merkst, dass jemand in der Gruppe sich unwohl f\u00fchlt. Was tust du?',
    options: [
      { id: 'q10a', text: 'Ich gehe diskret zu ihm und frage leise, ob alles okay ist.', scores: { warmth: 5, resonance: 4, authenticity: 5, presence: 5 } },
      { id: 'q10b', text: 'Ich beziehe ihn geschickt ins Gespr\u00e4ch ein, ohne es auff\u00e4llig zu machen.', scores: { warmth: 5, resonance: 3, authenticity: 3, presence: 3 } },
      { id: 'q10c', text: 'Ich bleibe in seiner N\u00e4he und gebe ihm durch meine Pr\u00e4senz Sicherheit.', scores: { warmth: 4, resonance: 5, authenticity: 4, presence: 5 } },
      { id: 'q10d', text: 'Ich spreche ihn sp\u00e4ter unter vier Augen an \u2013 \u00f6ffentlich k\u00f6nnte es ihm unangenehm sein.', scores: { warmth: 4, resonance: 3, authenticity: 4, presence: 4 } },
    ],
  },
  {
    id: 'q11', context: 'Worte und Stille',
    text: 'Eine Unterhaltung nimmt eine tiefe Wendung. Wie reagierst du auf emotionale Offenheit?',
    options: [
      { id: 'q11a', text: 'Ich teile eine eigene verletzliche Geschichte, um Gleichheit zu schaffen.', scores: { warmth: 4, resonance: 3, authenticity: 5, presence: 2 } },
      { id: 'q11b', text: 'Ich halte den Raum in Stille \u2013 manchmal ist Pr\u00e4senz mehr als Worte.', scores: { warmth: 4, resonance: 5, authenticity: 4, presence: 5 } },
      { id: 'q11c', text: "Ich dr\u00fccke in Worten aus, was ich f\u00fchle: 'Das ber\u00fchrt mich sehr.'", scores: { warmth: 5, resonance: 2, authenticity: 5, presence: 3 } },
      { id: 'q11d', text: 'Ich frage behutsam weiter, um der Tiefe Raum zu geben.', scores: { warmth: 5, resonance: 3, authenticity: 4, presence: 4 } },
    ],
  },
  {
    id: 'q12', context: 'Der Abschied',
    text: 'Du verl\u00e4sst einen Raum. Was sollen die Menschen \u00fcber dich denken?',
    options: [
      { id: 'q12a', text: "'Mit ihr war es nie langweilig \u2013 sie hat Energie gebracht.'", scores: { warmth: 3, resonance: 2, authenticity: 3, presence: 1 } },
      { id: 'q12b', text: "'In ihrer N\u00e4he habe ich mich wohler gef\u00fchlt.'", scores: { warmth: 5, resonance: 5, authenticity: 4, presence: 5 } },
      { id: 'q12c', text: "'Sie hat mich wirklich gesehen und verstanden.'", scores: { warmth: 5, resonance: 4, authenticity: 5, presence: 4 } },
      { id: 'q12d', text: "'Sie ist klug und charmant \u2013 ich w\u00fcrde gern mehr Zeit mit ihr verbringen.'", scores: { warmth: 4, resonance: 2, authenticity: 3, presence: 2 } },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// PROFILES
// ═══════════════════════════════════════════════════════════════

function avgDim(s: Score): number {
  return (s.warmth + s.resonance + s.authenticity + s.presence) / 4;
}

const PROFILES: CharmeProfile[] = [
  {
    id: 'herzoffner',
    title: 'Der Herz\u00f6ffner',
    tagline: 'In deiner Gegenwart tauen selbst Eisberge auf.',
    emoji: '\ud83d\udc96',
    color: '#D2A95A',
    accent: '#6CA192',
    description: 'Du bist das menschliche \u00c4quivalent eines offenen Kaminfeuers. Menschen entspannen sich in deiner Gegenwart, oft ohne zu wissen warum. Dein Geheimnis? Du machst nichts \u2013 du bist einfach. Deine Augen lachen mit, wenn dein Mund l\u00e4chelt. Du h\u00f6rst nicht nur zu, du h\u00f6rst hinein.\n\nWas andere als \u201eCharisma\u201c missverstehen, ist bei dir etwas Einfacheres und Seltenes: authentische Menschenfreundlichkeit ohne Agenda.',
    stats: [
      { label: 'W\u00e4rme-Radius', value: '\u221e' },
      { label: 'Duchenne-L\u00e4cheln', value: '94%' },
      { label: 'Pr\u00e4senz-Tiefe', value: '9/10' },
    ],
    allies: ['Pr\u00e4senz-Anker', 'Stiller Verzauberer'],
    nemesis: 'Esprit-Funke',
    match: (s: Score) => avgDim(s) >= 4.2,
  },
  {
    id: 'magnetische',
    title: 'Die Magnetische',
    tagline: 'Du erhellst R\u00e4ume, ohne das Licht zu suchen.',
    emoji: '\u26a1',
    color: '#E8C87A',
    accent: '#053B3F',
    description: 'Du bist der seltene Fall, in dem Charisma und Charme sich die Waage halten. Menschen bemerken dich, wenn du einen Raum betrittst \u2013 aber nicht, weil du Aufmerksamkeit suchst, sondern weil deine Energie ansteckend ist.\n\nDein Charme ist aktiv: Du startest Gespr\u00e4che, du bringst Menschen zusammen, du findest den Witz in der Spannung.',
    stats: [
      { label: 'Raum-Energie', value: '\u2191\u2191\u2191' },
      { label: 'Wortgewandtheit', value: 'Brillant' },
      { label: 'Einpr\u00e4gsamkeit', value: '98%' },
    ],
    allies: ['Esprit-Funke', 'Herz\u00f6ffner'],
    nemesis: 'Stiller Verzauberer',
    match: (s: Score) => s.warmth >= 3.5 && s.resonance <= 2.5 && s.presence <= 2.5,
  },
  {
    id: 'stiller-verzauberer',
    title: 'Der Stille Verzauberer',
    tagline: 'Dein Schweigen spricht lauter als die Worte anderer.',
    emoji: '\ud83c\udf19',
    color: '#8FB8A8',
    accent: '#041726',
    description: 'Du brauchst keine Worte, um zu verzaubern. Ein Blick von dir sagt mehr als die Monologe anderer. Dein Charme entfaltet sich nicht durch das, was du tust, sondern durch das, was du nicht tust.\n\nMenschen beschreiben Begegnungen mit dir oft als \u201eeigenartig intensiv\u201c, ohne genau sagen zu k\u00f6nnen warum.',
    stats: [
      { label: 'Blickkontakt-Tiefe', value: 'Legend\u00e4r' },
      { label: 'Worte/Wirkung', value: '3:97' },
      { label: 'Subtilit\u00e4t', value: 'Meister' },
    ],
    allies: ['Herz\u00f6ffner', 'Pr\u00e4senz-Anker'],
    nemesis: 'Magnetische',
    match: (s: Score) => s.resonance >= 4 && s.authenticity >= 4 && s.presence >= 3.5,
  },
  {
    id: 'diplomat',
    title: 'Der Diplomat',
    tagline: 'Du bist der Klebstoff, der Gruppen zusammenh\u00e4lt.',
    emoji: '\ud83c\udf09',
    color: '#5B8A9A',
    accent: '#A77D38',
    description: 'Dein Charme ist ein Werkzeug der Verbindung. Du siehst, wo Br\u00fccken fehlen, und baust sie \u2013 elegant, diskret, ohne dass jemand merkt, dass du der Architekt warst.\n\nDu hast die seltene Gabe, Kritik so zu verpacken, dass sie nicht verletzt.',
    stats: [
      { label: 'Konflikt-Aufl\u00f6sung', value: '87%' },
      { label: 'Br\u00fccken gebaut', value: '\u221e' },
      { label: 'Gruppenharmonie', value: 'A+' },
    ],
    allies: ['Herz\u00f6ffner', 'Magnetische'],
    nemesis: 'Esprit-Funke',
    match: (s: Score) => s.warmth >= 3 && s.warmth <= 4.2 && s.presence >= 3.5,
  },
  {
    id: 'esprit-funke',
    title: 'Der Esprit-Funke',
    tagline: 'Dein Witz \u00f6ffnet T\u00fcren, die anderen verschlossen bleiben.',
    emoji: '\u2728',
    color: '#E8C87A',
    accent: '#C45D4A',
    description: 'Dein Charme ist eine Waffe \u2013 aber eine, die nie verletzt. Du findest den perfekten Moment f\u00fcr den perfekten Satz.\n\nIntellekt und W\u00e4rme sind bei dir untrennbar. Du lachst \u00fcber dich selbst, bevor du \u00fcber andere lachst.',
    stats: [
      { label: 'Schlagfertigkeit', value: 'Ninja' },
      { label: 'Lacher/Minute', value: '3.7' },
      { label: 'Eisbrecher-Erfolg', value: '98%' },
    ],
    allies: ['Magnetische', 'Diplomat'],
    nemesis: 'Stiller Verzauberer',
    match: (s: Score) => s.resonance <= 2.5 && s.presence <= 2.5,
  },
  {
    id: 'praesenz-anker',
    title: 'Der Pr\u00e4senz-Anker',
    tagline: 'In deiner N\u00e4he findet der Sturm sein Auge.',
    emoji: '\u2693',
    color: '#1C5B5C',
    accent: '#D2A95A',
    description: 'Du bist der seltene Mensch, bei dem andere automatisch langsamer atmen. Dein Charme wirkt nicht durch Worte oder Taten, sondern durch pure Pr\u00e4senz.\n\nDu bist der sichere Hafen in jedem Sturm, der Fels, an dem die Wellen sich brechen.',
    stats: [
      { label: 'Polyvagale Wirkung', value: 'Maximal' },
      { label: 'Cortisol-Senkung', value: '\u2193\u2193\u2193' },
      { label: 'Ruhe-Ausstrahlung', value: 'Legend\u00e4r' },
    ],
    allies: ['Stiller Verzauberer', 'Herz\u00f6ffner'],
    nemesis: 'Magnetische',
    match: (s: Score) => s.presence >= 4.5 && s.warmth >= 4,
  },
];

// ═══════════════════════════════════════════════════════════════
// SCORING LOGIC
// ═══════════════════════════════════════════════════════════════

function normalizeScore(raw: Score, questionCount: number): Score {
  return {
    warmth: raw.warmth / questionCount,
    resonance: raw.resonance / questionCount,
    authenticity: raw.authenticity / questionCount,
    presence: raw.presence / questionCount,
  };
}

function getProfile(scores: Score): CharmeProfile {
  const normalized = normalizeScore(scores, QUESTIONS.length);

  for (const profile of PROFILES) {
    if (profile.match(normalized)) {
      return profile;
    }
  }

  // Fallback based on highest dimension
  const dims = [
    { key: 'warmth', val: normalized.warmth },
    { key: 'resonance', val: normalized.resonance },
    { key: 'authenticity', val: normalized.authenticity },
    { key: 'presence', val: normalized.presence },
  ];
  dims.sort((a, b) => b.val - a.val);

  const highest = dims[0].key;
  if (highest === 'presence') return PROFILES.find(p => p.id === 'praesenz-anker')!;
  if (highest === 'resonance') return PROFILES.find(p => p.id === 'stiller-verzauberer')!;
  if (highest === 'authenticity') return PROFILES.find(p => p.id === 'herzoffner')!;
  return PROFILES.find(p => p.id === 'magnetische')!;
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
      <div className="text-6xl mb-8">{'\u2728'}</div>

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
      <p className="text-sm text-white/50">Charme-Analyse wird ausgewertet</p>
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
  profile: CharmeProfile;
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
            Charme-Signatur
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
                <span className="font-mono text-sm text-[#D4AF37]">{stat.value}</span>
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

export default function CharmeQuiz({ onComplete, onClose }: CharmeQuizProps) {
  const [screen, setScreen] = useState<Screen>('intro');
  const [questionIdx, setQuestionIdx] = useState(0);
  const [scores, setScores] = useState<Score>({ ...INITIAL_SCORES });
  const [resultProfile, setResultProfile] = useState<CharmeProfile | null>(null);

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
        warmth: prev.warmth + option.scores.warmth,
        resonance: prev.resonance + option.scores.resonance,
        authenticity: prev.authenticity + option.scores.authenticity,
        presence: prev.presence + option.scores.presence,
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
      onComplete(charmeToEvent(scores, profile.id));
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
