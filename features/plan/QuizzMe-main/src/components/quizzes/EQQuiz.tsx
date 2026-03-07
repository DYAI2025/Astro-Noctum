'use client'

import React, { useState, useEffect } from 'react';
import { useClusterProgress } from '../../lib/stores/useClusterProgress';

const CLUSTER_ID = 'cluster.mentalist.v1';
const QUIZ_ID = 'quiz.eq.v1';

// ═══════════════════════════════════════════════════════════════════════════
// QUIZ DATA
// ═══════════════════════════════════════════════════════════════════════════

const quizData = {
  meta: {
    id: "quiz.eq.v1",
    title: "Deine Emotionale Signatur",
    subtitle: "Entdecke dein einzigartiges Muster emotionaler Intelligenz",
  },
  questions: [
    {
      id: "q1",
      context: "Selbstwahrnehmung",
      text: "Du wachst mit einem diffusen Unbehagen auf. Kein klarer Grund, nur ein Gefühl. Was passiert in dir?",
      options: [
        { id: "q1a", text: "Ich halte inne und frage mich: Ist das Angst? Traurigkeit? Erschöpfung? Ich versuche, das Gefühl präzise zu benennen.", scores: { perception: 5, regulation: 3, utilization: 2 } },
        { id: "q1b", text: "Ich starte meinen Tag und schaue, ob sich das Gefühl von selbst auflöst.", scores: { perception: 1, regulation: 4, utilization: 3 } },
        { id: "q1c", text: "Ich nutze das Gefühl als Signal: Vielleicht sollte ich heute sanfter mit mir sein.", scores: { perception: 3, regulation: 4, utilization: 5 } },
        { id: "q1d", text: "Ich spreche sofort mit jemandem darüber – beim Aussprechen wird mir oft klar, was los ist.", scores: { perception: 4, regulation: 2, utilization: 3 } }
      ]
    },
    {
      id: "q2",
      context: "Soziale Wahrnehmung",
      text: "Du betrittst einen Raum und spürst sofort: Die Stimmung ist anders als erwartet. Was nimmst du wahr?",
      options: [
        { id: "q2a", text: "Ich registriere subtile Details: verschränkte Arme, gemiedene Blicke, die zu ruhige Stimme.", scores: { perception: 5, regulation: 2, utilization: 3 } },
        { id: "q2b", text: "Ich bemerke, dass etwas nicht stimmt, fokussiere mich aber bewusst auf meine eigene Aufgabe.", scores: { perception: 2, regulation: 5, utilization: 2 } },
        { id: "q2c", text: "Ich überlege strategisch: Wie wirkt sich diese Spannung auf meine Ziele heute aus?", scores: { perception: 3, regulation: 3, utilization: 5 } },
        { id: "q2d", text: "Ich frage direkt: 'Hey, ist alles okay? Die Stimmung wirkt heute anders.'", scores: { perception: 3, regulation: 1, utilization: 4 } }
      ]
    },
    {
      id: "q3",
      context: "Impulskontrolle",
      text: "Jemand macht eine Bemerkung, die dich trifft. Du spürst, wie Ärger in dir hochsteigt. Was passiert dann?",
      options: [
        { id: "q3a", text: "Ich spüre den Ärger intensiv, fast körperlich. Ich muss erstmal durchatmen.", scores: { perception: 5, regulation: 3, utilization: 2 } },
        { id: "q3b", text: "Ich schalte innerlich einen Gang runter. Ich registriere den Ärger, aber erlaube ihm nicht, meine Reaktion zu diktieren.", scores: { perception: 3, regulation: 5, utilization: 3 } },
        { id: "q3c", text: "Ich kontere sofort. Wenn jemand unter die Gürtellinie geht, darf er wissen, wie das ankommt.", scores: { perception: 3, regulation: 1, utilization: 2 } },
        { id: "q3d", text: "Ich frage mich: Will ich jetzt gewinnen oder will ich verstehen?", scores: { perception: 4, regulation: 4, utilization: 5 } }
      ]
    },
    {
      id: "q4",
      context: "Emotionale Granularität",
      text: "Ein Freund fragt: 'Wie geht's dir?' – und du merkst, dass 'gut' oder 'schlecht' die Antwort nicht trifft.",
      options: [
        { id: "q4a", text: "Ich finde präzise Worte: 'Ich bin melancholisch-nachdenklich, aber nicht traurig.'", scores: { perception: 5, regulation: 2, utilization: 3 } },
        { id: "q4b", text: "Ich sage 'kompliziert' und lasse es dabei. Nicht jedes Gefühl braucht ein Label.", scores: { perception: 2, regulation: 4, utilization: 2 } },
        { id: "q4c", text: "Ich beschreibe es über den Körper: 'Ich hab so ein Kribbeln im Bauch.'", scores: { perception: 4, regulation: 2, utilization: 2 } },
        { id: "q4d", text: "Ich nutze die Frage als Anlass, um mit dem Freund tiefer zu sprechen.", scores: { perception: 3, regulation: 3, utilization: 5 } }
      ]
    },
    {
      id: "q5",
      context: "Emotionsnutzung",
      text: "Du musst eine wichtige Präsentation halten. Wie gehst du emotional in diese Situation?",
      options: [
        { id: "q5a", text: "Ich versuche, komplett ruhig zu sein. Nervosität ist der Feind klarer Gedanken.", scores: { perception: 2, regulation: 5, utilization: 2 } },
        { id: "q5b", text: "Ich transformiere die Nervosität in Energie. Das Kribbeln ist wie Strom.", scores: { perception: 4, regulation: 3, utilization: 5 } },
        { id: "q5c", text: "Ich fühle alles intensiv – die Aufregung, die Unsicherheit. Das macht mich authentisch.", scores: { perception: 5, regulation: 1, utilization: 3 } },
        { id: "q5d", text: "Ich visualisiere den besten Ausgang und baue mir damit positive Emotionen auf.", scores: { perception: 3, regulation: 4, utilization: 5 } }
      ]
    },
    {
      id: "q6",
      context: "Empathie",
      text: "Eine Freundin erzählt von einem Problem. Du merkst: Sie will eigentlich nicht deinen Rat.",
      options: [
        { id: "q6a", text: "Ich spüre genau, was sie braucht – Präsenz, nicht Lösungen. Ich höre zu und spiegle ihre Gefühle.", scores: { perception: 5, regulation: 3, utilization: 4 } },
        { id: "q6b", text: "Ich frage nach: 'Was brauchst du gerade von mir? Zuhören oder Ideen?'", scores: { perception: 3, regulation: 4, utilization: 5 } },
        { id: "q6c", text: "Ich muss aufpassen, dass ich ihre Gefühle nicht zu stark übernehme.", scores: { perception: 5, regulation: 1, utilization: 2 } },
        { id: "q6d", text: "Ich gebe trotzdem Rat. Manchmal wissen Menschen nicht, was sie brauchen.", scores: { perception: 2, regulation: 3, utilization: 3 } }
      ]
    },
    {
      id: "q7",
      context: "Konfliktnavigation",
      text: "Zwei Menschen, die dir wichtig sind, streiten sich. Du stehst dazwischen.",
      options: [
        { id: "q7a", text: "Ich spüre beide Seiten körperlich – ihre Anspannung, ihre Verletzung.", scores: { perception: 5, regulation: 1, utilization: 2 } },
        { id: "q7b", text: "Ich distanziere mich emotional und analysiere: Was ist hier der eigentliche Konflikt?", scores: { perception: 3, regulation: 5, utilization: 4 } },
        { id: "q7c", text: "Ich überlege, wie ich die Situation de-eskalieren kann.", scores: { perception: 3, regulation: 3, utilization: 5 } },
        { id: "q7d", text: "Ich warte ab. Nicht jeder Konflikt braucht meine Intervention.", scores: { perception: 2, regulation: 5, utilization: 3 } }
      ]
    },
    {
      id: "q8",
      context: "Stressreaktion",
      text: "Deadline-Druck. Zu viel zu tun, zu wenig Zeit. Wie verhältst du dich zu deinem Stresslevel?",
      options: [
        { id: "q8a", text: "Ich merke es erst, wenn mein Körper Alarm schlägt – Kopfschmerzen, Magenprobleme.", scores: { perception: 1, regulation: 2, utilization: 2 } },
        { id: "q8b", text: "Ich beobachte meinen Stress wie einen Wetterbericht: 'Okay, Sturmwarnung.'", scores: { perception: 4, regulation: 5, utilization: 4 } },
        { id: "q8c", text: "Ich nutze den Adrenalinstoß. Unter Druck bin ich fokussierter, schneller.", scores: { perception: 3, regulation: 3, utilization: 5 } },
        { id: "q8d", text: "Ich spüre den Stress intensiv und teile ihn mit anderen.", scores: { perception: 4, regulation: 2, utilization: 3 } }
      ]
    },
    {
      id: "q9",
      context: "Emotionales Verstehen",
      text: "Jemand reagiert auf eine harmlose Situation völlig überzogen. Dein erster Gedanke ist...",
      options: [
        { id: "q9a", text: "'Da steckt mehr dahinter.' Ich frage mich, welche Vorgeschichte das erklärt.", scores: { perception: 5, regulation: 4, utilization: 4 } },
        { id: "q9b", text: "'Interessant, aber nicht mein Problem.' Ich registriere es, aber lasse mich nicht tangieren.", scores: { perception: 2, regulation: 5, utilization: 2 } },
        { id: "q9c", text: "'Wie kann ich das nutzen?' Vielleicht offenbart diese Reaktion etwas Wichtiges.", scores: { perception: 3, regulation: 3, utilization: 5 } },
        { id: "q9d", text: "Ich bin selbst verunsichert. Starke Emotionen anderer bringen mich aus dem Gleichgewicht.", scores: { perception: 4, regulation: 1, utilization: 1 } }
      ]
    },
    {
      id: "q10",
      context: "Freude teilen",
      text: "Dir passiert etwas richtig Gutes – ein persönlicher Erfolg. Wie gehst du mit dieser Freude um?",
      options: [
        { id: "q10a", text: "Ich koste das Gefühl aus, verstärke es bewusst. Ich erlaube mir, strahlend zu sein.", scores: { perception: 4, regulation: 2, utilization: 5 } },
        { id: "q10b", text: "Ich genieße es innerlich, bleibe aber nach außen gelassen.", scores: { perception: 3, regulation: 5, utilization: 3 } },
        { id: "q10c", text: "Ich teile es sofort – der Wert der Freude verdoppelt sich, wenn sie geteilt wird.", scores: { perception: 4, regulation: 2, utilization: 4 } },
        { id: "q10d", text: "Ich analysiere: Was genau hat dieses Gefühl ausgelöst? Wie kann ich das replizieren?", scores: { perception: 3, regulation: 4, utilization: 5 } }
      ]
    },
    {
      id: "q11",
      context: "Emotionale Erschöpfung",
      text: "Nach einem intensiven Tag merkst du: Dein emotionaler Tank ist leer. Was regeneriert dich?",
      options: [
        { id: "q11a", text: "Absolute Stille und Alleinsein. Ich muss das alles erstmal sortieren.", scores: { perception: 5, regulation: 3, utilization: 2 } },
        { id: "q11b", text: "Eine klare, ablenkende Aktivität – Sport, Putzen. Das erdet mich.", scores: { perception: 2, regulation: 5, utilization: 3 } },
        { id: "q11c", text: "Ein Wechsel der emotionalen Tonlage: Comedy, Musik, Tanz.", scores: { perception: 3, regulation: 4, utilization: 5 } },
        { id: "q11d", text: "Mehr Verbindung, aber anders: Ich rufe jemanden an, der mich auflädt.", scores: { perception: 4, regulation: 2, utilization: 4 } }
      ]
    },
    {
      id: "q12",
      context: "Integration",
      text: "Wenn du an dein Verhältnis zu Emotionen denkst – wie würdest du es beschreiben?",
      options: [
        { id: "q12a", text: "Intensiv und immersiv. Ich fühle alles – meins, deins, das des Raumes.", scores: { perception: 5, regulation: 1, utilization: 3 } },
        { id: "q12b", text: "Kontrolliert und bewusst. Ich beobachte meine Emotionen, aber sie steuern mich nicht.", scores: { perception: 3, regulation: 5, utilization: 4 } },
        { id: "q12c", text: "Strategisch und adaptive. Emotionen sind Daten und Werkzeuge.", scores: { perception: 3, regulation: 4, utilization: 5 } },
        { id: "q12d", text: "Ehrlich gesagt: kompliziert. Manchmal überwältigt, manchmal taub.", scores: { perception: 3, regulation: 2, utilization: 2 } }
      ]
    }
  ],
  profiles: [
    {
      id: "resonator",
      title: "Der Resonator",
      tagline: "Du spürst, was andere noch nicht sagen können",
      emoji: "🎭",
      color: "#4A0E4E",
      accent: "#E8B4E8",
      description: "Du bist ein emotionaler Seismograph – fein kalibriert für die subtilen Schwingungen, die andere gar nicht registrieren. Noch bevor jemand spricht, hast du die Atmosphäre gelesen.\n\nDein Profil zeigt außergewöhnlich hohe Werte in der emotionalen Granularität – der Fähigkeit, zwischen ähnlichen Gefühlen präzise zu unterscheiden.",
      stats: [
        { label: "Emotionale Antenne", value: "Maximal" },
        { label: "Granularität", value: "97%" },
        { label: "Empathische Resonanz", value: "Legendär" }
      ],
      allies: ["Der Regulator"],
      nemesis: "Der Stratege",
      match: (s: Score) => s.perception >= 4 && s.regulation <= 3
    },
    {
      id: "regulator",
      title: "Der Regulator",
      tagline: "Du bist der ruhige Pol im Sturm",
      emoji: "⚖️",
      color: "#1C3B5C",
      accent: "#7DC5E8",
      description: "Du bist der emotionale Thermostat – fähig, die Temperatur zu spüren und zu justieren, ohne selbst zu überhitzen oder einzufrieren.\n\nDein Profil zeigt starke präfrontale Regulation – die Fähigkeit deines Kortex, die emotionalen Impulse der Amygdala zu modulieren.",
      stats: [
        { label: "Impulskontrolle", value: "95%" },
        { label: "Emotionale Distanz", value: "Meister" },
        { label: "Stresstoleranz", value: "Hoch" }
      ],
      allies: ["Der Resonator"],
      nemesis: "Der Navigator",
      match: (s: Score) => s.regulation >= 4 && s.perception <= 3
    },
    {
      id: "strategist",
      title: "Der Stratege",
      tagline: "Du wandelst Gefühle in Treibstoff",
      emoji: "🎯",
      color: "#2D4A3E",
      accent: "#8FD9A8",
      description: "Du betrachtest Emotionen nicht als Zufälle, sondern als Ressourcen. Nervosität? Transformierst du in fokussierte Energie. Ärger? Kanalisierst du in Durchsetzungskraft.\n\nDein Profil zeigt hohe Werte in der emotionalen Facilitation – du verstehst intuitiv, dass verschiedene Stimmungen verschiedene Denkstile begünstigen.",
      stats: [
        { label: "Emotions-Transformation", value: "Pro" },
        { label: "Strategischer Einsatz", value: "98%" },
        { label: "Zielverfolgung", value: "Stark" }
      ],
      allies: ["Der Navigator"],
      nemesis: "Der Resonator",
      match: (s: Score) => s.utilization >= 4 && s.perception <= 3.5
    },
    {
      id: "navigator",
      title: "Der Navigator",
      tagline: "Du liest die sozialen Strömungen",
      emoji: "🧭",
      color: "#4A3B2D",
      accent: "#D9C08F",
      description: "Du bist der emotionale Diplomat – begabt darin, die unsichtbaren Ströme zwischen Menschen zu lesen und zu navigieren.\n\nDein Profil zeigt ausgeprägte soziale Intelligenz – die Fähigkeit, nicht nur einzelne Emotionen, sondern ganze emotionale Systeme zu lesen.",
      stats: [
        { label: "Soziale Intelligenz", value: "Exzellent" },
        { label: "Systemdenken", value: "94%" },
        { label: "Diplomatisches Geschick", value: "A+" }
      ],
      allies: ["Der Stratege"],
      nemesis: "Der Regulator",
      match: (s: Score) => s.perception >= 3.5 && s.utilization >= 3.5
    },
    {
      id: "alchemist",
      title: "Der Alchemist",
      tagline: "Du verwandelst Blei in Gold – emotional",
      emoji: "⚗️",
      color: "#3D2A4A",
      accent: "#D4A8E8",
      description: "Du vereinst, was andere trennen. In dir treffen sich intensive Wahrnehmung, bewusste Steuerung und strategische Nutzung – eine seltene Integration.\n\nDein Profil zeigt eine seltene Balance über alle drei Zweige der emotionalen Intelligenz hinweg.",
      stats: [
        { label: "EQ-Balance", value: "Optimal" },
        { label: "Psychologische Flexibilität", value: "96%" },
        { label: "Integration", value: "Meister" }
      ],
      allies: ["Alle Typen"],
      nemesis: "Eigene Komplexität",
      match: (s: Score) => {
        const avg = (s.perception + s.regulation + s.utilization) / 3;
        const variance = Math.abs(s.perception - avg) + Math.abs(s.regulation - avg) + Math.abs(s.utilization - avg);
        return avg >= 3.5 && variance <= 2;
      }
    },
    {
      id: "seeker",
      title: "Der Suchende",
      tagline: "Du bist auf dem Weg zu dir selbst",
      emoji: "🔮",
      color: "#2A2A3D",
      accent: "#9D8FD9",
      description: "Du bist ehrlich mit dir: Dein Verhältnis zu Emotionen ist noch in Arbeit. Das ist kein Defizit – es ist Potenzial.\n\nDein Profil zeigt emotionale Variabilität – unterschiedliche Reaktionsmuster je nach Kontext.",
      stats: [
        { label: "Selbsterkenntnis", value: "Wachsend" },
        { label: "Entwicklungspotenzial", value: "Hoch" },
        { label: "Offenheit", value: "Stark" }
      ],
      allies: ["Der Alchemist"],
      nemesis: "Eigene Ungeduld",
      match: () => true // Fallback
    }
  ]
};

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type Score = {
  perception: number;
  regulation: number;
  utilization: number;
}

type Profile = typeof quizData.profiles[0];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function normalizeScore(raw: Score, questionCount: number): Score {
  return {
    perception: raw.perception / questionCount,
    regulation: raw.regulation / questionCount,
    utilization: raw.utilization / questionCount
  };
}

function getProfile(scores: Score): Profile {
  const normalized = normalizeScore(scores, quizData.questions.length);
  
  // Check profiles in order (alchemist first since it's the special balanced case)
  for (const profile of quizData.profiles) {
    if (profile.id !== 'seeker' && profile.match(normalized)) {
      return profile;
    }
  }
  
  // Fallback to seeker
  return quizData.profiles.find(p => p.id === 'seeker')!;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function EQQuiz() {
  const [stage, setStage] = useState<'intro' | 'quiz' | 'result'>('intro');
  const [currentQ, setCurrentQ] = useState(0);
  const [scores, setScores] = useState<Score>({ perception: 0, regulation: 0, utilization: 0 });
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
      perception: scores.perception + option.scores.perception,
      regulation: scores.regulation + option.scores.regulation,
      utilization: scores.utilization + option.scores.utilization
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
                moduleId: "quiz.eq.v1",
                domain: window.location.hostname
              },
              payload: {
                markers: [
                  { id: 'marker.eq.perception', weight: normalized.perception / 5 },
                  { id: 'marker.eq.regulation', weight: normalized.regulation / 5 },
                  { id: 'marker.eq.utilization', weight: normalized.utilization / 5 }
                ],
                traits: [
                  { id: `trait.eq.${finalProfile.id}`, score: 100, confidence: 0.9 }
                ],
                tags: [{ id: 'tag.eq.result', label: finalProfile.title, kind: 'misc' as const }],
                summary: {
                  title: `EQ-Signatur: ${finalProfile.title}`,
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
      setScores({ perception: 0, regulation: 0, utilization: 0 });
      setSelectedOption(null);
      setResult(undefined);
      setIsAnimating(false);
    }, 300);
  };

  const progress = ((currentQ + 1) / quizData.questions.length) * 100;

  const containerClass = `min-h-[600px] rounded-xl overflow-hidden shadow-2xl relative transition-all duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'} bg-gradient-to-br from-purple-950 via-indigo-950 to-purple-950`;

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: Intro
  // ═══════════════════════════════════════════════════════════════════════════

  if (stage === 'intro') {
    return (
      <div className={containerClass + " flex items-center justify-center p-4"}>
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-6">🔮</div>
          <h1 className="text-3xl font-light text-white mb-3 tracking-wide">
            {quizData.meta.title}
          </h1>
          <p className="text-purple-200/70 mb-8 text-lg">
            {quizData.meta.subtitle}
          </p>
          <div className="space-y-4 text-purple-200/50 text-sm mb-10">
            <p>12 Fragen · 3-4 Minuten</p>
            <p className="text-xs leading-relaxed max-w-xs mx-auto">
              Entdecke, wie du Gefühle wahrnimmst, steuerst und in Kraft verwandelst – und welche emotionale Superkraft in dir schlummert.
            </p>
          </div>
          <button
            onClick={handleStart}
            className="px-10 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full text-lg font-medium hover:from-purple-500 hover:to-indigo-500 transition-all duration-300 hover:scale-105 shadow-lg shadow-purple-500/30"
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
        <div className="w-full h-1 bg-indigo-900 absolute top-0 left-0">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="p-4 text-purple-300/50 text-sm flex justify-between pt-6">
          <span>{currentQ + 1} / {quizData.questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>

        <div className={`flex-1 flex flex-col justify-center p-6 max-w-lg mx-auto w-full transition-all duration-300`}>
          {question.context && (
            <p className="text-purple-300/60 text-sm mb-3 italic">
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
                  ? 'border-purple-400 bg-purple-500/20 text-white scale-98'
                  : selectedOption !== null
                    ? 'border-indigo-700/50 bg-indigo-900/30 text-indigo-500'
                    : 'border-indigo-700 bg-indigo-900/50 text-purple-100 hover:border-purple-500/50 hover:bg-indigo-900 active:scale-98'
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
        style={{ background: `linear-gradient(135deg, ${result.color} 0%, #0f0e17 100%)` }}
      >
        <div className="flex-1 p-6 max-w-lg mx-auto w-full overflow-y-auto no-scrollbar">
          <div className="text-center mb-6 pt-4">
            <div className="text-5xl mb-4">{result.emoji}</div>
            <h1 className="text-3xl font-light text-white mb-2">{result.title}</h1>
            <p className="text-sm px-4 py-2 rounded-full inline-block mb-4" style={{ backgroundColor: `${result.accent}30`, color: result.accent }}>
              Emotionale Signatur
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
            <br /><span className="text-purple-400/50">Dein dynamisches Profil wurde aktualisiert.</span>
          </p>
        </div>
      </div>
    );
  }

  return null;
}
