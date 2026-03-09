
'use client'

import React, { useState } from 'react';
// import { aggregateMarkers } from '../../lib/lme/marker-aggregator';
// import { updatePsycheState } from '../../lib/lme/lme-core';
// import { getPsycheState, savePsycheState } from '../../lib/lme/storage';

const questions = [
    {
        id: "f1", text: "Wenn ich morgens aufwache, denke ich zuerst an das, was ICH heute brauche.",
        options: [
            { text: "Trifft gar nicht zu", scores: { focus: 100 } },
            { text: "Trifft eher nicht zu", scores: { focus: 66 } },
            { text: "Trifft eher zu", scores: { focus: 33 } },
            { text: "Trifft genau zu", scores: { focus: 0 } }
        ]
    },
    {
        id: "f2", text: "Ich bemerke schnell, wenn es jemandem in meiner Umgebung nicht gut geht.",
        options: [
            { text: "Trifft gar nicht zu", scores: { focus: 0 } },
            { text: "Trifft eher nicht zu", scores: { focus: 33 } },
            { text: "Trifft eher zu", scores: { focus: 66 } },
            { text: "Trifft genau zu", scores: { focus: 100 } }
        ]
    },
    {
        id: "f3", text: "In einer Gruppe achte ich vor allem auf...",
        options: [
            { text: "...wie ich wahrgenommen werde", scores: { focus: 0 } },
            { text: "...wie es den anderen geht", scores: { focus: 100 } }
        ]
    },
    {
        id: "r1", text: "Ich investiere regelmäßig Zeit in Dinge, die nur mir selbst nützen (Hobbys, Weiterbildung, Selbstpflege).",
        options: [
            { text: "Trifft gar nicht zu", scores: { resources: 100 } },
            { text: "Trifft eher nicht zu", scores: { resources: 66 } },
            { text: "Trifft eher zu", scores: { resources: 33 } },
            { text: "Trifft genau zu", scores: { resources: 0 } }
        ]
    },
    {
        id: "r2", text: "Wenn Freunde mich um Hilfe bitten, sage ich fast nie Nein – auch wenn es mich viel kostet.",
        options: [
            { text: "Trifft gar nicht zu", scores: { resources: 0 } },
            { text: "Trifft eher nicht zu", scores: { resources: 33 } },
            { text: "Trifft eher zu", scores: { resources: 66 } },
            { text: "Trifft genau zu", scores: { resources: 100 } }
        ]
    },
    {
        id: "r3", text: "Du hast unerwartet 500€ übrig. Was tust du eher?",
        options: [
            { text: "Etwas Schönes für mich kaufen", scores: { resources: 0 } },
            { text: "Anderen eine Freude machen oder spenden", scores: { resources: 100 } }
        ]
    },
    {
        id: "r4", text: "Mein Kalender ist voll mit Terminen für andere (Gefälligkeiten, Ehrenamt, Hilfe).",
        options: [
            { text: "Trifft gar nicht zu", scores: { resources: 0 } },
            { text: "Trifft eher nicht zu", scores: { resources: 33 } },
            { text: "Trifft eher zu", scores: { resources: 66 } },
            { text: "Trifft genau zu", scores: { resources: 100 } }
        ]
    },
    {
        id: "e1", text: "Wenn jemand vor mir weint, spüre ich körperlich einen Druck, zu helfen.",
        options: [
            { text: "Trifft gar nicht zu", scores: { empathy: 0 } },
            { text: "Trifft eher nicht zu", scores: { empathy: 33 } },
            { text: "Trifft eher zu", scores: { empathy: 66 } },
            { text: "Trifft genau zu", scores: { empathy: 100 } }
        ]
    },
    {
        id: "e2", text: "Ich kann gut abschalten, wenn die Probleme anderer mich nichts angehen.",
        options: [
            { text: "Trifft gar nicht zu", scores: { empathy: 100 } },
            { text: "Trifft eher nicht zu", scores: { empathy: 66 } },
            { text: "Trifft eher zu", scores: { empathy: 33 } },
            { text: "Trifft genau zu", scores: { empathy: 0 } }
        ]
    },
    {
        id: "e3", text: "Ein Obdachloser bittet dich um Geld. Dein erster Impuls:",
        options: [
            { text: "Weitergehen – ich kann nicht allen helfen", scores: { empathy: 0 } },
            { text: "Stehen bleiben – zumindest kurz schauen, was ich tun kann", scores: { empathy: 100 } }
        ]
    },
    {
        id: "e4", text: "Nachrichten über Leid in der Welt beschäftigen mich noch tagelang.",
        options: [
            { text: "Trifft gar nicht zu", scores: { empathy: 0 } },
            { text: "Trifft eher nicht zu", scores: { empathy: 33 } },
            { text: "Trifft eher zu", scores: { empathy: 66 } },
            { text: "Trifft genau zu", scores: { empathy: 100 } }
        ]
    },
    {
        id: "x1", text: "Stell dir vor: Du könntest entweder deine Traumkarriere verwirklichen ODER ein Projekt leiten, das vielen Menschen hilft. Was wählst du?",
        weight: 1.5,
        options: [
            { text: "Traumkarriere – ich muss zuerst bei mir sein", scores: { focus: 0, resources: 0 } },
            { text: "Das Projekt – mein Beitrag für andere zählt mehr", scores: { focus: 100, resources: 100 } }
        ]
    }
];

const profiles = [
    {
        id: "giver",
        title: "Der Weltverbesserer",
        subtitle: "Dein Kompass zeigt auf andere",
        emoji: "🌍",
        color: "from-emerald-500 to-teal-600",
        description: "Du lebst mit einem tiefen Bewusstsein für das Wohlergehen anderer. Empathie ist für dich keine Anstrengung, sondern dein natürlicher Modus.",
        strengths: ["Tiefe Empathie und emotionale Intelligenz", "Fähigkeit, Vertrauen aufzubauen", "Natürliche Führungskraft durch Fürsorge"],
        affirmation: "Ich darf mir selbst geben, was ich anderen so großzügig schenke.",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        match: (s: any) => s.focus >= 60 && s.resources >= 60 && s.empathy >= 55,
        priority: 1
    },
    {
        id: "selfkeeper",
        title: "Der Eigenständige",
        subtitle: "Du bist deine erste Priorität – und das ist gesund",
        emoji: "🏔️",
        color: "from-slate-500 to-zinc-600",
        description: "Du hast verstanden, was viele erst spät lernen: Man kann nur geben, was man hat. Deine Fähigkeit zur Selbstfürsorge ist emotionale Intelligenz.",
        strengths: ["Gesunde Grenzsetzung", "Emotionale Stabilität unter Druck", "Klare Prioritäten und Fokus"],
        affirmation: "Meine Stärke liegt darin, meine Schale zu füllen, um dann überfließen zu können.",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        match: (s: any) => s.focus <= 40 && s.resources <= 40 && s.empathy <= 45,
        priority: 1
    },
    {
        id: "balancer",
        title: "Der Ausgewogene",
        subtitle: "Die seltene Kunst der Balance",
        emoji: "⚖️",
        color: "from-violet-500 to-purple-600",
        description: "Du hast das geschafft, woran viele scheitern: ein echtes Gleichgewicht zwischen Selbstfürsorge und Fürsorge für andere.",
        strengths: ["Nachhaltige Energie durch ausgewogenes Geben und Nehmen", "Gesunde Beziehungen ohne Abhängigkeit", "Flexibilität in beide Richtungen"],
        affirmation: "Ich vertraue meinem inneren Pendel, das immer wieder zur Mitte findet.",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        match: (s: any) => s.focus >= 40 && s.focus <= 60 && s.resources >= 40 && s.resources <= 60,
        priority: 0
    },
    {
        id: "strategist",
        title: "Der Strategische Geber",
        subtitle: "Du gibst klug – nicht blind",
        emoji: "🎯",
        color: "from-amber-500 to-orange-600",
        description: "Du hilfst – aber mit Verstand. Deine Fürsorge für andere ist durchdacht: Du fragst dich, wo dein Beitrag den größten Unterschied macht.",
        strengths: ["Hohe Wirksamkeit bei Hilfeleistungen", "Gute Ressourcen-Allokation", "Verbindet Kopf und Herz"],
        affirmation: "Mein Geben ist ein bewusster Akt der Gestaltung, nicht nur Reaktion.",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        match: (s: any) => s.focus >= 45 && s.resources >= 40 && s.resources <= 65 && s.empathy <= 55,
        priority: 0
    },
    {
        id: "empath",
        title: "Der Empathische Schwamm",
        subtitle: "Du fühlst alles – ob du willst oder nicht",
        emoji: "💧",
        color: "from-cyan-500 to-blue-600",
        description: "Deine empathische Antenne ist auf voller Empfangsstärke. Du nimmst die Emotionen anderer auf wie ein Schwamm.",
        strengths: ["Tiefes, authentisches Verstehen anderer", "Fähigkeit, Trost zu spenden der wirklich ankommt", "Hohe emotionale Intelligenz"],
        affirmation: "Ich schütze meinen inneren Raum, damit mein Mitgefühl nachhaltig bleibt.",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        match: (s: any) => s.empathy >= 70,
        priority: 2
    }
];

export function PersonalityQuiz() {
    const [stage, setStage] = useState('intro');
    const [currentQ, setCurrentQ] = useState(0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [answers, setAnswers] = useState<Record<string, { scores: any, weight: number }>>({});
    const [result, setResult] = useState<typeof profiles[0] | null>(null);
    const [scores, setScores] = useState({ focus: 0, resources: 0, empathy: 0 });

    const startQuiz = () => setStage('quiz');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleAnswer = (option: any, question: any) => {
        const newAnswers = { ...answers, [question.id]: { scores: option.scores, weight: question.weight || 1 } };
        setAnswers(newAnswers);

        if (currentQ < questions.length - 1) {
            setCurrentQ(currentQ + 1);
        } else {
            calculateResult(newAnswers);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const calculateResult = (finalAnswers: any) => {
        const dimCounts = { focus: 0, resources: 0, empathy: 0 };
        const dimSums = { focus: 0, resources: 0, empathy: 0 };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Object.values(finalAnswers).forEach((a: any) => {
            Object.entries(a.scores).forEach(([dim, score]) => {
                // @ts-expect-error key access
                dimSums[dim] += score * a.weight;
                // @ts-expect-error key access
                dimCounts[dim] += a.weight;
            });
        });

        const finalScores = {
            focus: Math.round(dimSums.focus / Math.max(dimCounts.focus, 1)),
            resources: Math.round(dimSums.resources / Math.max(dimCounts.resources, 1)),
            empathy: Math.round(dimSums.empathy / Math.max(dimCounts.empathy, 1))
        };

        setScores(finalScores);

        const sorted = [...profiles].sort((a, b) => b.priority - a.priority);
        const match = sorted.find(p => p.match(finalScores)) || profiles.find(p => p.id === 'balancer');

        const finalResult = match || profiles[2];
        setResult(finalResult);

        // LME Ingestion
        import('../../lib/lme/ingestion').then(({ ingestContribution }) => {
            const dimMapping = {
                giver: { connection: 0.8, communion: 0.8 },
                selfkeeper: { agency: 0.8, structure: 0.7 },
                balancer: { flexibility: 0.9 },
                strategist: { structure: 0.8, agency: 0.7 },
                empath: { connection: 0.9, depth: 0.8 }
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const mappedMarkers = (dimMapping as any)[finalResult.id] || {};

            const event = {
                specVersion: "sp.contribution.v1" as const,
                eventId: crypto.randomUUID(),
                occurredAt: new Date().toISOString(),
                source: {
                    vertical: "quiz" as const,
                    moduleId: "quiz.personality.v1",
                    domain: window.location.hostname
                },
                payload: {
                    markers: Object.entries(mappedMarkers).map(([k, v]) => ({ id: `marker.psyche.${k}`, weight: v as number })),
                    traits: [
                        { id: `trait.personality.${finalResult.id}`, score: 100, confidence: 0.9 }
                    ],
                    tags: [{ id: 'tag.personality.result', label: finalResult.title, kind: 'misc' as const }],
                    summary: {
                        title: `Persönlichkeit: ${finalResult.title}`,
                        bullets: [finalResult.subtitle],
                        resultId: finalResult.id
                    }
                }
            };

            try {
                ingestContribution(event);
            } catch (e) {
                console.error("Ingestion failed", e);
            }
        });

        setStage('result');
    };

    const progress = ((currentQ + 1) / questions.length) * 100;
    const q = questions[currentQ];

    if (stage === 'intro') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] text-center p-8 bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl">
                <div className="text-6xl mb-6">🪞</div>
                <h1 className="text-3xl font-bold mb-4">Selbstfürsorge oder Weltverbesserer?</h1>
                <p className="text-indigo-200 text-lg mb-8 max-w-md">
                    Entdecke dein persönliches Gleichgewicht zwischen Geben und Nehmen.
                </p>
                <button
                    onClick={startQuiz}
                    className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-bold text-lg 
                   shadow-lg shadow-purple-500/30 hover:scale-105 transition-transform"
                >
                    Test starten
                </button>
                <p className="text-indigo-400 text-xs mt-6">
                    Zur Selbstreflexion. Keine Diagnose.
                </p>
            </div>
        );
    }

    if (stage === 'quiz') {
        return (
            <div className="bg-slate-900 text-white p-6 rounded-3xl min-h-[500px] flex flex-col">
                <div className="mb-8">
                    <div className="flex justify-between text-xs text-slate-400 mb-2">
                        <span>Frage {currentQ + 1} von {questions.length}</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                <div className="flex-grow flex flex-col justify-center max-w-xl mx-auto w-full">
                    <h2 className="text-2xl font-bold mb-8 leading-snug">
                        {q.text}
                    </h2>

                    <div className="space-y-3">
                        {q.options.map((opt, i) => (
                            <button
                                key={i}
                                onClick={() => handleAnswer(opt, q)}
                                className="w-full text-left p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-400/50 
                         rounded-xl transition-all duration-200"
                            >
                                {opt.text}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (stage === 'result' && result) {
        return (
            <div className={`bg-gradient-to-br ${result.color} text-white p-1 rounded-3xl shadow-xl overflow-hidden`}>
                <div className="bg-slate-900/90 backdrop-blur-sm p-8 h-full rounded-[20px]">
                    <div className="text-center mb-8">
                        <div className="text-6xl mb-4">{result.emoji}</div>
                        <h1 className={`text-3xl font-bold bg-gradient-to-r ${result.color} bg-clip-text text-transparent mb-2`}>
                            {result.title}
                        </h1>
                        <p className="text-slate-300 italic">{result.subtitle}</p>
                    </div>

                    <p className="text-slate-200 leading-relaxed mb-8 text-lg">
                        {result.description}
                    </p>

                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white/5 rounded-xl p-5">
                            <h3 className="text-emerald-400 font-semibold mb-3 flex items-center gap-2">
                                <span>✨</span> Deine Stärken
                            </h3>
                            <ul className="space-y-2 text-sm text-slate-300">
                                {result.strengths.map((s, i) => (
                                    <li key={i} className="flex gap-2">
                                        <span className="text-emerald-500">•</span> {s}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-white/5 rounded-xl p-5">
                            <h3 className="text-amber-400 font-semibold mb-3 flex items-center gap-2">
                                <span>🌟</span> Affirmation
                            </h3>
                            <p className="text-amber-200 italic font-medium leading-relaxed mt-2">
                                &quot;{result.affirmation}&quot;
                            </p>
                        </div>
                    </div>

                    <div className="bg-slate-950/50 rounded-xl p-4 mb-8">
                        <h4 className="text-slate-500 text-xs uppercase tracking-wide mb-4">Deine Balance</h4>
                        <div className="space-y-4">
                            {[
                                { label: 'Fokus (Selbst vs. Andere)', val: scores.focus },
                                { label: 'Ressourcen (Behalten vs. Geben)', val: scores.resources },
                                { label: 'Empathie (Abgrenzung vs. Resonanz)', val: scores.empathy }
                            ].map((d, i) => (
                                <div key={i}>
                                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                                        <span>{d.label}</span>
                                        <span>{d.val}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full bg-gradient-to-r ${result?.color}`}
                                            style={{ width: `${d.val}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => {
                                const text = `${result.emoji} Mein Ergebnis: ${result.title} – ${result.subtitle}`;
                                if (navigator.share) {
                                    navigator.share({ title: 'Selbstfürsorge Test', text });
                                } else {
                                    navigator.clipboard.writeText(text).then(() => alert('Kopiert!'));
                                }
                            }}
                            className={`flex-1 py-3 px-6 rounded-xl font-bold bg-gradient-to-r ${result.color} shadow-lg hover:opacity-90 transition-opacity`}
                        >
                            Teilen
                        </button>
                        <button
                            onClick={() => {
                                setStage('intro');
                                setCurrentQ(0);
                                setAnswers({});
                                setScores({ focus: 0, resources: 0, empathy: 0 });
                            }}
                            className="px-6 py-3 rounded-xl font-semibold border border-slate-700 hover:bg-slate-800 transition-colors text-slate-400"
                        >
                            Nochmal
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
