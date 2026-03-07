'use client'

import React, { useState, useEffect } from 'react';
import { useClusterProgress } from '../../lib/stores/useClusterProgress';

const CLUSTER_ID = 'cluster.mentalist.v1';
const QUIZ_ID = 'quiz.charme.v1';

// ═══════════════════════════════════════════════════════════════════════════
// QUIZ DATA
// ═══════════════════════════════════════════════════════════════════════════

const quizData = {
  meta: {
    id: "quiz.charme.v1",
    title: "Die Kunst des Charmes",
    subtitle: "Entdecke deine einzigartige Signatur der Anziehung",
  },
  questions: [
    {
      id: "q1",
      context: "Der erste Eindruck",
      text: "Du betrittst einen Raum voller Fremder. Wie orientierst du dich?",
      options: [
        { id: "q1a", text: "Ich scanne nach bekannten Gesichtern – und wenn ich keins finde, warte ich, bis jemand mich anspricht.", scores: { warmth: 2, resonance: 4, authenticity: 4, presence: 4 } },
        { id: "q1b", text: "Ich suche die Person, die am unsichersten wirkt, und gehe direkt auf sie zu.", scores: { warmth: 5, resonance: 4, authenticity: 5, presence: 5 } },
        { id: "q1c", text: "Ich positioniere mich strategisch gut sichtbar und beginne ein angeregtes Gespräch mit dem Nächstbesten.", scores: { warmth: 3, resonance: 2, authenticity: 2, presence: 1 } },
        { id: "q1d", text: "Ich beobachte die Dynamik des Raums – wer gehört zusammen, wo ist Energie, wo Spannung?", scores: { warmth: 3, resonance: 5, authenticity: 4, presence: 3 } }
      ]
    },
    {
      id: "q2",
      context: "Das Geheimnis des Lächelns",
      text: "Jemand erzählt dir einen Witz, der nicht besonders lustig ist. Was passiert in deinem Gesicht?",
      options: [
        { id: "q2a", text: "Ich lache höflich mit – niemand sollte sich unwohl fühlen.", scores: { warmth: 4, resonance: 3, authenticity: 2, presence: 4 } },
        { id: "q2b", text: "Meine Mundwinkel heben sich, aber meine Augen verraten mich – ich kann nicht lügen.", scores: { warmth: 3, resonance: 4, authenticity: 5, presence: 3 } },
        { id: "q2c", text: "Ich schmunzle warm und sage: 'Das war charmant versucht.'", scores: { warmth: 5, resonance: 3, authenticity: 4, presence: 4 } },
        { id: "q2d", text: "Ich strahle Wärme aus und lenke geschickt auf etwas um, bei dem wir beide wirklich lachen können.", scores: { warmth: 5, resonance: 2, authenticity: 3, presence: 2 } }
      ]
    },
    {
      id: "q3",
      context: "Die Kunst des Zuhörens",
      text: "Jemand erzählt dir von einem Problem, das dich persönlich nicht betrifft. Wie hörst du zu?",
      options: [
        { id: "q3a", text: "Ich stelle gezielte Fragen, um die Situation zu analysieren und Lösungen anzubieten.", scores: { warmth: 3, resonance: 1, authenticity: 3, presence: 2 } },
        { id: "q3b", text: "Ich lehne mich vor, halte Blickkontakt und lasse die Stille wirken, wenn sie nötig ist.", scores: { warmth: 5, resonance: 5, authenticity: 5, presence: 5 } },
        { id: "q3c", text: "Ich teile ähnliche eigene Erfahrungen, damit die Person sich weniger allein fühlt.", scores: { warmth: 4, resonance: 2, authenticity: 4, presence: 2 } },
        { id: "q3d", text: "Ich nicke, fasse zusammen und zeige durch meine Körpersprache, dass ich präsent bin.", scores: { warmth: 4, resonance: 4, authenticity: 3, presence: 4 } }
      ]
    },
    {
      id: "q4",
      context: "Spannung im Raum",
      text: "Ein Streit entwickelt sich zwischen zwei Menschen in deiner Gegenwart. Was tust du?",
      options: [
        { id: "q4a", text: "Ich bringe Humor ein – ein gut getimter Kommentar kann Wunder wirken.", scores: { warmth: 4, resonance: 2, authenticity: 3, presence: 1 } },
        { id: "q4b", text: "Ich wende mich an die ruhigere Person und gebe ihr Raum, ihre Perspektive zu teilen.", scores: { warmth: 5, resonance: 4, authenticity: 4, presence: 5 } },
        { id: "q4c", text: "Ich bleibe gelassen und strahle eine Ruhe aus, die ansteckend wirkt.", scores: { warmth: 4, resonance: 5, authenticity: 4, presence: 5 } },
        { id: "q4d", text: "Ich strukturiere das Gespräch und schlage einen diplomatischen Kompromiss vor.", scores: { warmth: 3, resonance: 1, authenticity: 3, presence: 3 } }
      ]
    },
    {
      id: "q5",
      context: "Der verletzliche Moment",
      text: "Du hast einen Fehler gemacht, der anderen aufgefallen ist. Wie gehst du damit um?",
      options: [
        { id: "q5a", text: "Ich gebe es offen zu und lache über mich selbst – Perfektion langweilt sowieso.", scores: { warmth: 4, resonance: 3, authenticity: 5, presence: 2 } },
        { id: "q5b", text: "Ich entschuldige mich aufrichtig und frage, wie ich es wieder gutmachen kann.", scores: { warmth: 5, resonance: 3, authenticity: 5, presence: 4 } },
        { id: "q5c", text: "Ich erkläre den Kontext meines Fehlers, damit andere ihn einordnen können.", scores: { warmth: 2, resonance: 1, authenticity: 3, presence: 2 } },
        { id: "q5d", text: "Ich zeige kurz Betroffenheit, aber wechsle schnell zu einer Lösung.", scores: { warmth: 3, resonance: 2, authenticity: 2, presence: 2 } }
      ]
    },
    {
      id: "q6",
      context: "Das Kompliment",
      text: "Du willst jemandem ehrlich sagen, was du an ihm schätzt. Wie machst du das?",
      options: [
        { id: "q6a", text: "Ich sage es direkt und spezifisch: 'Was du gerade gemacht hast, war brillant, weil...'", scores: { warmth: 4, resonance: 1, authenticity: 4, presence: 2 } },
        { id: "q6b", text: "Ich lege meine Hand auf ihre Schulter und sage es mit warmem Blick in wenigen Worten.", scores: { warmth: 5, resonance: 5, authenticity: 4, presence: 4 } },
        { id: "q6c", text: "Ich erwähne es später nebenbei, fast beiläufig – große Gesten machen mich verlegen.", scores: { warmth: 3, resonance: 4, authenticity: 5, presence: 4 } },
        { id: "q6d", text: "Ich finde einen spielerischen Weg, es in einen Insider-Witz zwischen uns zu verwandeln.", scores: { warmth: 4, resonance: 2, authenticity: 3, presence: 1 } }
      ]
    },
    {
      id: "q7",
      context: "Der Fremde neben dir",
      text: "Du sitzt neben jemandem, den du nicht kennst, aber die Situation erlaubt Gespräch. Was passiert?",
      options: [
        { id: "q7a", text: "Ich warte auf einen natürlichen Moment – vielleicht ein geteiltes Schmunzeln über etwas.", scores: { warmth: 4, resonance: 5, authenticity: 5, presence: 4 } },
        { id: "q7b", text: "Ich starte mit einer offenen Frage, die echte Neugier zeigt.", scores: { warmth: 5, resonance: 2, authenticity: 4, presence: 2 } },
        { id: "q7c", text: "Ich bleibe still, aber sende offene Körpersprache – wer reden will, wird es tun.", scores: { warmth: 3, resonance: 5, authenticity: 4, presence: 5 } },
        { id: "q7d", text: "Ich kommentiere etwas Konkretes um uns herum, um das Eis zu brechen.", scores: { warmth: 4, resonance: 2, authenticity: 3, presence: 2 } }
      ]
    },
    {
      id: "q8",
      context: "Der schwere Tag",
      text: "Ein Freund hat einen schlechten Tag. Du merkst es an seiner Energie. Was ist deine erste Reaktion?",
      options: [
        { id: "q8a", text: "Ich frage direkt: 'Was ist los?' – Ehrlichkeit über allem.", scores: { warmth: 4, resonance: 2, authenticity: 4, presence: 2 } },
        { id: "q8b", text: "Ich sitze einfach neben ihm und bin da – Worte kommen, wenn sie kommen.", scores: { warmth: 5, resonance: 5, authenticity: 5, presence: 5 } },
        { id: "q8c", text: "Ich bringe ihm seinen Lieblingskaffee und sage: 'Du musst nichts erzählen.'", scores: { warmth: 5, resonance: 4, authenticity: 4, presence: 5 } },
        { id: "q8d", text: "Ich versuche, ihn abzulenken – manchmal braucht man einfach Pause vom Grübeln.", scores: { warmth: 4, resonance: 2, authenticity: 3, presence: 1 } }
      ]
    },
    {
      id: "q9",
      context: "Im Rampenlicht",
      text: "Du stehst im Mittelpunkt – alle Augen auf dir. Was ist dein Instinkt?",
      options: [
        { id: "q9a", text: "Ich genieße es kurz, aber lenke dann schnell den Fokus auf andere.", scores: { warmth: 5, resonance: 3, authenticity: 4, presence: 3 } },
        { id: "q9b", text: "Ich nutze den Moment, um etwas Bedeutungsvolles zu sagen.", scores: { warmth: 3, resonance: 1, authenticity: 4, presence: 2 } },
        { id: "q9c", text: "Ich mache etwas Überraschendes, das Spannung bricht und alle einbezieht.", scores: { warmth: 4, resonance: 2, authenticity: 3, presence: 1 } },
        { id: "q9d", text: "Ich halte den Moment still, lächle und lasse meine Ruhe sprechen.", scores: { warmth: 3, resonance: 5, authenticity: 4, presence: 5 } }
      ]
    },
    {
      id: "q10",
      context: "Die unsichtbare Verbindung",
      text: "Du merkst, dass jemand in der Gruppe sich unwohl fühlt. Was tust du?",
      options: [
        { id: "q10a", text: "Ich gehe diskret zu ihm und frage leise, ob alles okay ist.", scores: { warmth: 5, resonance: 4, authenticity: 5, presence: 5 } },
        { id: "q10b", text: "Ich beziehe ihn geschickt ins Gespräch ein, ohne es auffällig zu machen.", scores: { warmth: 5, resonance: 3, authenticity: 3, presence: 3 } },
        { id: "q10c", text: "Ich bleibe in seiner Nähe und gebe ihm durch meine Präsenz Sicherheit.", scores: { warmth: 4, resonance: 5, authenticity: 4, presence: 5 } },
        { id: "q10d", text: "Ich spreche ihn später unter vier Augen an – öffentlich könnte es ihm unangenehm sein.", scores: { warmth: 4, resonance: 3, authenticity: 4, presence: 4 } }
      ]
    },
    {
      id: "q11",
      context: "Worte und Stille",
      text: "Eine Unterhaltung nimmt eine tiefe Wendung. Wie reagierst du auf emotionale Offenheit?",
      options: [
        { id: "q11a", text: "Ich teile eine eigene verletzliche Geschichte, um Gleichheit zu schaffen.", scores: { warmth: 4, resonance: 3, authenticity: 5, presence: 2 } },
        { id: "q11b", text: "Ich halte den Raum in Stille – manchmal ist Präsenz mehr als Worte.", scores: { warmth: 4, resonance: 5, authenticity: 4, presence: 5 } },
        { id: "q11c", text: "Ich drücke in Worten aus, was ich fühle: 'Das berührt mich sehr.'", scores: { warmth: 5, resonance: 2, authenticity: 5, presence: 3 } },
        { id: "q11d", text: "Ich frage behutsam weiter, um der Tiefe Raum zu geben.", scores: { warmth: 5, resonance: 3, authenticity: 4, presence: 4 } }
      ]
    },
    {
      id: "q12",
      context: "Der Abschied",
      text: "Du verlässt einen Raum. Was sollen die Menschen über dich denken?",
      options: [
        { id: "q12a", text: "'Mit ihr war es nie langweilig – sie hat Energie gebracht.'", scores: { warmth: 3, resonance: 2, authenticity: 3, presence: 1 } },
        { id: "q12b", text: "'In ihrer Nähe habe ich mich wohler gefühlt.'", scores: { warmth: 5, resonance: 5, authenticity: 4, presence: 5 } },
        { id: "q12c", text: "'Sie hat mich wirklich gesehen und verstanden.'", scores: { warmth: 5, resonance: 4, authenticity: 5, presence: 4 } },
        { id: "q12d", text: "'Sie ist klug und charmant – ich würde gern mehr Zeit mit ihr verbringen.'", scores: { warmth: 4, resonance: 2, authenticity: 3, presence: 2 } }
      ]
    }
  ],
  profiles: [
    {
      id: "herzoffner",
      title: "Der Herzöffner",
      tagline: "In deiner Gegenwart tauen selbst Eisberge auf.",
      emoji: "💖",
      color: "#D2A95A",
      accent: "#6CA192",
      description: "Du bist das menschliche Äquivalent eines offenen Kaminfeuers. Menschen entspannen sich in deiner Gegenwart, oft ohne zu wissen warum. Dein Geheimnis? Du machst nichts – du bist einfach. Deine Augen lachen mit, wenn dein Mund lächelt. Du hörst nicht nur zu, du hörst hinein.\n\nWas andere als 'Charisma' missverstehen, ist bei dir etwas Einfacheres und Seltenes: authentische Menschenfreundlichkeit ohne Agenda.",
      stats: [
        { label: "Wärme-Radius", value: "∞" },
        { label: "Duchenne-Lächeln", value: "94%" },
        { label: "Präsenz-Tiefe", value: "9/10" }
      ],
      allies: ["Präsenz-Anker", "Stiller Verzauberer"],
      nemesis: "Esprit-Funke",
      match: (s: Score) => avgDim(s) >= 4.2
    },
    {
      id: "magnetische",
      title: "Die Magnetische",
      tagline: "Du erhellst Räume, ohne das Licht zu suchen.",
      emoji: "⚡",
      color: "#E8C87A",
      accent: "#053B3F",
      description: "Du bist der seltene Fall, in dem Charisma und Charme sich die Waage halten. Menschen bemerken dich, wenn du einen Raum betrittst – aber nicht, weil du Aufmerksamkeit suchst, sondern weil deine Energie ansteckend ist.\n\nDein Charme ist aktiv: Du startest Gespräche, du bringst Menschen zusammen, du findest den Witz in der Spannung.",
      stats: [
        { label: "Raum-Energie", value: "↑↑↑" },
        { label: "Wortgewandtheit", value: "Brillant" },
        { label: "Einprägsamkeit", value: "98%" }
      ],
      allies: ["Esprit-Funke", "Herzöffner"],
      nemesis: "Stiller Verzauberer",
      match: (s: Score) => s.warmth >= 3.5 && s.resonance <= 2.5 && s.presence <= 2.5
    },
    {
      id: "stiller-verzauberer",
      title: "Der Stille Verzauberer",
      tagline: "Dein Schweigen spricht lauter als die Worte anderer.",
      emoji: "🌙",
      color: "#8FB8A8",
      accent: "#041726",
      description: "Du brauchst keine Worte, um zu verzaubern. Ein Blick von dir sagt mehr als die Monologe anderer. Dein Charme entfaltet sich nicht durch das, was du tust, sondern durch das, was du nicht tust.\n\nMenschen beschreiben Begegnungen mit dir oft als 'eigenartig intensiv', ohne genau sagen zu können warum.",
      stats: [
        { label: "Blickkontakt-Tiefe", value: "Legendär" },
        { label: "Worte/Wirkung", value: "3:97" },
        { label: "Subtilität", value: "Meister" }
      ],
      allies: ["Herzöffner", "Präsenz-Anker"],
      nemesis: "Magnetische",
      match: (s: Score) => s.resonance >= 4 && s.authenticity >= 4 && s.presence >= 3.5
    },
    {
      id: "diplomat",
      title: "Der Diplomat",
      tagline: "Du bist der Klebstoff, der Gruppen zusammenhält.",
      emoji: "🌉",
      color: "#5B8A9A",
      accent: "#A77D38",
      description: "Dein Charme ist ein Werkzeug der Verbindung. Du siehst, wo Brücken fehlen, und baust sie – elegant, diskret, ohne dass jemand merkt, dass du der Architekt warst.\n\nDu hast die seltene Gabe, Kritik so zu verpacken, dass sie nicht verletzt.",
      stats: [
        { label: "Konflikt-Auflösung", value: "87%" },
        { label: "Brücken gebaut", value: "∞" },
        { label: "Gruppenharmonie", value: "A+" }
      ],
      allies: ["Herzöffner", "Magnetische"],
      nemesis: "Esprit-Funke",
      match: (s: Score) => s.warmth >= 3 && s.warmth <= 4.2 && s.presence >= 3.5
    },
    {
      id: "esprit-funke",
      title: "Der Esprit-Funke",
      tagline: "Dein Witz öffnet Türen, die anderen verschlossen bleiben.",
      emoji: "✨",
      color: "#E8C87A",
      accent: "#C45D4A",
      description: "Dein Charme ist eine Waffe – aber eine, die nie verletzt. Du findest den perfekten Moment für den perfekten Satz.\n\nIntellekt und Wärme sind bei dir untrennbar. Du lachst über dich selbst, bevor du über andere lachst.",
      stats: [
        { label: "Schlagfertigkeit", value: "Ninja" },
        { label: "Lacher/Minute", value: "3.7" },
        { label: "Eisbrecher-Erfolg", value: "98%" }
      ],
      allies: ["Magnetische", "Diplomat"],
      nemesis: "Stiller Verzauberer",
      match: (s: Score) => s.resonance <= 2.5 && s.presence <= 2.5
    },
    {
      id: "praesenz-anker",
      title: "Der Präsenz-Anker",
      tagline: "In deiner Nähe findet der Sturm sein Auge.",
      emoji: "⚓",
      color: "#1C5B5C",
      accent: "#D2A95A",
      description: "Du bist der seltene Mensch, bei dem andere automatisch langsamer atmen. Dein Charme wirkt nicht durch Worte oder Taten, sondern durch pure Präsenz.\n\nDu bist der sichere Hafen in jedem Sturm, der Fels, an dem die Wellen sich brechen.",
      stats: [
        { label: "Polyvagale Wirkung", value: "Maximal" },
        { label: "Cortisol-Senkung", value: "↓↓↓" },
        { label: "Ruhe-Ausstrahlung", value: "Legendär" }
      ],
      allies: ["Stiller Verzauberer", "Herzöffner"],
      nemesis: "Magnetische",
      match: (s: Score) => s.presence >= 4.5 && s.warmth >= 4
    }
  ]
};

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type Score = {
  warmth: number;
  resonance: number;
  authenticity: number;
  presence: number;
}

type Profile = typeof quizData.profiles[0];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function avgDim(s: Score): number {
  return (s.warmth + s.resonance + s.authenticity + s.presence) / 4;
}

function normalizeScore(raw: Score, questionCount: number): Score {
  return {
    warmth: raw.warmth / questionCount,
    resonance: raw.resonance / questionCount,
    authenticity: raw.authenticity / questionCount,
    presence: raw.presence / questionCount
  };
}

function getProfile(scores: Score): Profile {
  const normalized = normalizeScore(scores, quizData.questions.length);
  
  for (const profile of quizData.profiles) {
    if (profile.match(normalized)) {
      return profile;
    }
  }
  
  // Fallback based on highest dimension
  const dims = [
    { key: 'warmth', val: normalized.warmth },
    { key: 'resonance', val: normalized.resonance },
    { key: 'authenticity', val: normalized.authenticity },
    { key: 'presence', val: normalized.presence }
  ];
  dims.sort((a, b) => b.val - a.val);
  
  const highest = dims[0].key;
  if (highest === 'presence') return quizData.profiles.find(p => p.id === 'praesenz-anker')!;
  if (highest === 'resonance') return quizData.profiles.find(p => p.id === 'stiller-verzauberer')!;
  if (highest === 'authenticity') return quizData.profiles.find(p => p.id === 'herzoffner')!;
  return quizData.profiles.find(p => p.id === 'magnetische')!;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function CharmeQuiz() {
  const [stage, setStage] = useState<'intro' | 'quiz' | 'result'>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [scores, setScores] = useState<Score>({ warmth: 0, resonance: 0, authenticity: 0, presence: 0 });
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [result, setResult] = useState<Profile | undefined>(undefined);
  const [isAnimating, setIsAnimating] = useState(false);

  // Cluster integration
  const { initCluster, completeQuiz, isLoaded } = useClusterProgress();

  useEffect(() => {
    if (isLoaded) {
      initCluster(CLUSTER_ID);
    }
  }, [isLoaded, initCluster]);

  const handleStart = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setStage('quiz');
      setIsAnimating(false);
    }, 300);
  };

  const handleAnswer = (option: typeof quizData.questions[0]['options'][0]) => {
    setSelectedOption(option.id);
    const newScores: Score = {
      warmth: scores.warmth + option.scores.warmth,
      resonance: scores.resonance + option.scores.resonance,
      authenticity: scores.authenticity + option.scores.authenticity,
      presence: scores.presence + option.scores.presence
    };
    setScores(newScores);

    setTimeout(() => {
      if (currentQ < quizData.questions.length - 1) {
        setIsAnimating(true);
        setTimeout(() => {
          setCurrentQ(currentQ + 1);
          setSelectedOption(null);
          setIsAnimating(false);
        }, 300);
      } else {
        setIsAnimating(true);
        setTimeout(() => {
          const finalProfile = getProfile(newScores);
          setResult(finalProfile);

          // Emit contribution event
          import('../../lib/lme/ingestion').then(({ ingestContribution }) => {
            const normalized = normalizeScore(newScores, quizData.questions.length);
            const event = {
              specVersion: "sp.contribution.v1" as const,
              eventId: crypto.randomUUID(),
              occurredAt: new Date().toISOString(),
              source: {
                vertical: "quiz" as const,
                moduleId: "quiz.charme.v1",
                domain: window.location.hostname
              },
              payload: {
                markers: [
                  { id: 'marker.charme.warmth', weight: normalized.warmth / 5 },
                  { id: 'marker.charme.resonance', weight: normalized.resonance / 5 },
                  { id: 'marker.charme.authenticity', weight: normalized.authenticity / 5 },
                  { id: 'marker.charme.presence', weight: normalized.presence / 5 }
                ],
                traits: [
                  { id: `trait.charme.${finalProfile.id}`, score: 100, confidence: 0.9 }
                ],
                tags: [{ id: 'tag.charme.result', label: finalProfile.title, kind: 'misc' as const }],
                summary: {
                  title: `Charme-Signatur: ${finalProfile.title}`,
                  bullets: [finalProfile.tagline],
                  resultId: finalProfile.id
                }
              }
            };

            try {
              ingestContribution(event);
            } catch (e) {
              console.error("Ingestion failed", e);
            }
          });

          // Track cluster progress
          completeQuiz(CLUSTER_ID, QUIZ_ID, finalProfile.id, finalProfile.title);

          setStage('result');
          setIsAnimating(false);
        }, 500);
      }
    }, 400);
  };

  const handleRestart = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setStage('intro');
      setCurrentQ(0);
      setScores({ warmth: 0, resonance: 0, authenticity: 0, presence: 0 });
      setSelectedOption(null);
      setResult(undefined);
      setIsAnimating(false);
    }, 300);
  };

  const progress = ((currentQ + 1) / quizData.questions.length) * 100;

  const containerClass = `min-h-[600px] rounded-xl overflow-hidden shadow-2xl relative transition-all duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'} bg-gradient-to-br from-amber-950 via-stone-900 to-amber-950`;

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: Intro
  // ═══════════════════════════════════════════════════════════════════════════

  if (stage === 'intro') {
    return (
      <div className={containerClass + " flex items-center justify-center p-4"}>
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-6">✨</div>
          <h1 className="text-3xl font-light text-white mb-3 tracking-wide">
            {quizData.meta.title}
          </h1>
          <p className="text-amber-200/70 mb-8 text-lg">
            {quizData.meta.subtitle}
          </p>
          <div className="space-y-4 text-amber-200/50 text-sm mb-10">
            <p>12 Fragen · 3 Minuten</p>
            <p className="text-xs leading-relaxed max-w-xs mx-auto">
              Entdecke, welche Art von Anziehungskraft du auf andere Menschen ausübst – und wie dein einzigartiger Charme die Welt verzaubert.
            </p>
          </div>
          <button
            onClick={handleStart}
            className="px-10 py-4 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-full text-lg font-medium hover:from-amber-500 hover:to-orange-500 transition-all duration-300 hover:scale-105 shadow-lg shadow-amber-500/30"
          >
            Starten
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: Quiz
  // ═══════════════════════════════════════════════════════════════════════════

  if (stage === 'quiz') {
    const question = quizData.questions[currentQ];
    return (
      <div className={containerClass + " flex flex-col"}>
        <div className="w-full h-1 bg-stone-800 absolute top-0 left-0">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="p-4 text-amber-300/50 text-sm flex justify-between pt-6">
          <span>{currentQ + 1} / {quizData.questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>

        <div className={`flex-1 flex flex-col justify-center p-6 max-w-lg mx-auto w-full transition-all duration-300`}>
          {question.context && (
            <p className="text-amber-300/60 text-sm mb-3 italic">
              {question.context}
            </p>
          )}
          <h2 className="text-xl text-white mb-8 font-light leading-relaxed">
            {question.text}
          </h2>

          <div className="space-y-3">
            {question.options.map((option) => (
              <button
                key={option.id}
                onClick={() => handleAnswer(option)}
                disabled={selectedOption !== null}
                className={`w-full p-4 text-left rounded-xl border transition-all duration-300 ${selectedOption === option.id
                  ? 'border-amber-400 bg-amber-500/20 text-white scale-98'
                  : selectedOption !== null
                    ? 'border-stone-700/50 bg-stone-800/30 text-stone-500'
                    : 'border-stone-700 bg-stone-800/50 text-amber-100 hover:border-amber-500/50 hover:bg-stone-800 active:scale-98'
                  }`}
              >
                <span className="text-sm leading-relaxed">{option.text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: Result
  // ═══════════════════════════════════════════════════════════════════════════

  if (stage === 'result' && result) {
    return (
      <div
        className={containerClass + " flex flex-col"}
        style={{ background: `linear-gradient(135deg, ${result.color} 0%, #1a1a1a 100%)` }}
      >
        <div className="flex-1 p-6 max-w-lg mx-auto w-full overflow-y-auto no-scrollbar">
          <div className="text-center mb-6 pt-4">
            <div className="text-5xl mb-4">{result.emoji}</div>
            <h1 className="text-3xl font-light text-white mb-2">{result.title}</h1>
            <p className="text-sm px-4 py-2 rounded-full inline-block mb-4" style={{ backgroundColor: `${result.accent}30`, color: result.accent }}>
              Charme-Signatur
            </p>
            <p className="text-white/70 italic text-sm">
              &quot;{result.tagline}&quot;
            </p>
          </div>

          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-5 mb-5">
            <p className="text-white/80 text-sm leading-relaxed whitespace-pre-line">
              {result.description}
            </p>
          </div>

          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-5 mb-5">
            <h3 className="text-white/50 text-xs uppercase tracking-wider mb-4">Deine Stats</h3>
            <div className="space-y-3">
              {result.stats.map((stat, i) => (
                <div key={i} className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">{stat.label}</span>
                  <span className="font-mono text-sm" style={{ color: result.accent }}>{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-5 mb-6">
            <h3 className="text-white/50 text-xs uppercase tracking-wider mb-4">Kompatibilität</h3>
            <div className="mb-4">
              <span className="text-green-400/70 text-xs">Allies:</span>
              <p className="text-white/80 text-sm">{result.allies.join(", ")}</p>
            </div>
            <div>
              <span className="text-red-400/70 text-xs">Nemesis:</span>
              <p className="text-white/80 text-sm">{result.nemesis}</p>
            </div>
          </div>

          <div className="flex gap-3 mb-6">
            <button
              onClick={handleRestart}
              className="flex-1 py-3 rounded-xl bg-white/10 text-white/70 hover:bg-white/20 transition-all text-sm"
            >
              Nochmal
            </button>
            <button
              onClick={() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const nav = navigator as any;
                if (nav.share) {
                  nav.share({
                    title: `Ich bin ${result.title}`,
                    text: result.tagline,
                    url: typeof window !== 'undefined' ? window.location.href : ''
                  });
                }
              }}
              className="flex-1 py-3 rounded-xl text-white font-medium transition-all text-sm"
              style={{ backgroundColor: result.accent }}
            >
              Teilen
            </button>
          </div>

          <p className="text-white/30 text-xs text-center leading-relaxed pb-4">
            Dieser Test dient der spielerischen Selbstreflexion und stellt keine psychologische Bewertung dar.
            <br /><span className="text-amber-400/50">Dein dynamisches Profil wurde aktualisiert.</span>
          </p>
        </div>
      </div>
    );
  }

  return null;
}
