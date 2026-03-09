
'use client'

import React, { useState } from 'react';
import { quizData, profileNames } from './rpg-identity/data';

type Scores = {
    d1: number;
    d2: number;
    d3: number;
};

export function RpgIdentityQuiz() {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [scores, setScores] = useState<Scores>({ d1: 0, d2: 0, d3: 0 });
    const [showResult, setShowResult] = useState(false);
    const [result, setResult] = useState<typeof quizData.profiles[0] | null>(null);
    const [started, setStarted] = useState(false);

    const calculateResult = (finalScores: Scores) => {
        const d1 = finalScores.d1;
        const d2 = finalScores.d2;
        const d3 = finalScores.d3;

        // Normalize based on max possible score (approximate)
        const maxD1 = 60, maxD2 = 60, maxD3 = 60;
        const d1Pct = d1 / maxD1;
        const d2Pct = d2 / maxD2;
        const d3Pct = d3 / maxD3;

        let foundProfile = quizData.profiles.find(p => p.id === 'paladin'); // default

        // Logic from original file
        if (d1Pct > 0.6 && d3Pct > 0.6 && d2Pct > 0.5) foundProfile = quizData.profiles.find(p => p.id === 'paladin');
        else if (d1Pct < 0.4 && d2Pct < 0.4 && d3Pct < 0.4) foundProfile = quizData.profiles.find(p => p.id === 'nekromant');
        else if (d1Pct < 0.5 && d2Pct > 0.6) foundProfile = quizData.profiles.find(p => p.id === 'heiler');
        else if (d1Pct > 0.65 && d2Pct < 0.4) foundProfile = quizData.profiles.find(p => p.id === 'berserker');
        else if (d3Pct > 0.65 && d1Pct < 0.5) foundProfile = quizData.profiles.find(p => p.id === 'stratege');
        else if (d3Pct < 0.45 && d1Pct < 0.5) foundProfile = quizData.profiles.find(p => p.id === 'seher');
        else {
            if (d1Pct >= 0.5) {
                foundProfile = d2Pct >= 0.5 ? quizData.profiles.find(p => p.id === 'paladin') : quizData.profiles.find(p => p.id === 'berserker');
            } else {
                foundProfile = d2Pct >= 0.5 ? quizData.profiles.find(p => p.id === 'heiler') : quizData.profiles.find(p => p.id === 'seher');
            }
        }

        const finalResult = foundProfile || quizData.profiles[0];

        // LME Ingestion
        import('../../lib/lme/ingestion').then(({ ingestContribution }) => {
            // Map RPG class to psyche dimensions
            const mapToDim: Record<string, string> = {
                paladin: 'structure',
                nekromant: 'shadow',
                heiler: 'connection',
                berserker: 'emergence', // chaotic energy
                stratege: 'structure',
                seher: 'depth'
            };
            const dim = mapToDim[finalResult.id] || 'structure';

            const event = {
                specVersion: "sp.contribution.v1" as const,
                eventId: crypto.randomUUID(),
                occurredAt: new Date().toISOString(),
                source: {
                    vertical: "quiz" as const,
                    moduleId: "quiz.rpg_identity.v1",
                    domain: window.location.hostname
                },
                payload: {
                    markers: [
                        { id: `marker.rpg.${finalResult.id}`, weight: 0.8 },
                        { id: `marker.psyche.${dim}`, weight: 0.6 }
                    ],
                    traits: [
                        { id: `trait.rpg.class.${finalResult.id}`, score: 100, confidence: 0.8 }
                    ],
                    tags: [{ id: 'tag.rpg.result', label: finalResult.title, kind: 'misc' as const }],
                    summary: {
                        title: `RPG Klasse: ${finalResult.title}`,
                        bullets: [finalResult.tagline],
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

        return finalResult;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleAnswer = (option: any) => {
        const newScores = {
            d1: scores.d1 + (option.scores.d1 || 0),
            d2: scores.d2 + (option.scores.d2 || 0),
            d3: scores.d3 + (option.scores.d3 || 0)
        };
        setScores(newScores);

        if (currentQuestion < quizData.questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            const finalResult = calculateResult(newScores);
            setResult(finalResult);
            setShowResult(true);
        }
    };

    const resetQuiz = () => {
        setCurrentQuestion(0);
        setScores({ d1: 0, d2: 0, d3: 0 });
        setShowResult(false);
        setResult(null);
        setStarted(false);
    };

    const progress = ((currentQuestion) / quizData.questions.length) * 100;

    if (!started) {
        return (
            <div className="min-h-[600px] bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900 text-white p-4 flex items-center justify-center rounded-3xl">
                <div className="max-w-lg w-full text-center">
                    <div className="text-6xl mb-6">⚔️</div>
                    <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200 bg-clip-text text-transparent">
                        {quizData.meta.title}
                    </h1>
                    <p className="text-purple-200 mb-8 text-lg">
                        {quizData.meta.subtitle}
                    </p>
                    <div className="bg-slate-800/50 rounded-xl p-6 mb-8 border border-purple-500/30">
                        <div className="flex justify-around text-sm text-purple-300">
                            <div className="text-center">
                                <div className="text-2xl mb-1">12</div>
                                <div>Fragen</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl mb-1">~3</div>
                                <div>Minuten</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl mb-1">6</div>
                                <div>Klassen</div>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => setStarted(true)}
                        className="w-full py-4 px-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-purple-500/25"
                    >
                        Beginne deine Reise
                    </button>
                    <p className="text-xs text-slate-500 mt-6">
                        {quizData.meta.disclaimer}
                    </p>
                </div>
            </div>
        );
    }

    if (showResult && result) {
        return (
            <div className="min-h-[600px] bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900 text-white rounded-3xl overflow-hidden">
                <div className="max-w-lg mx-auto p-4">
                    <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl overflow-hidden border border-purple-500/30 shadow-2xl">
                        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 p-1">
                            <div className="bg-slate-900 p-6 text-center">
                                <div className="text-sm text-purple-300 mb-2">Deine Rollenspiel-Seele ist...</div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200 bg-clip-text text-transparent mb-2">
                                    {result.title}
                                </h1>
                                <p className="text-purple-200 italic text-sm">
                                    &quot;{result.tagline}&quot;
                                </p>
                            </div>
                        </div>

                        <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto no-scrollbar">
                            <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                                {result.description}
                            </div>

                            <div className="bg-slate-800/50 rounded-xl p-4 border border-purple-500/20">
                                <h3 className="text-xs font-bold text-purple-400 mb-3 uppercase tracking-wider">Deine Stats</h3>
                                <div className="space-y-2">
                                    {result.stats.map((stat, i) => (
                                        <div key={i} className="flex justify-between text-sm">
                                            <span className="text-slate-400">{stat.label}</span>
                                            <span className="text-amber-300 font-mono">{stat.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-green-900/30 rounded-xl p-4 border border-green-500/30">
                                    <h3 className="text-xs font-bold text-green-400 mb-2 uppercase tracking-wider">⚔️ Allies</h3>
                                    <div className="space-y-1">
                                        {result.compatibility.allies.map(id => (
                                            <div key={id} className="text-sm text-green-200">
                                                {/* @ts-expect-error type def incomplete */}
                                                {profileNames[id]}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-red-900/30 rounded-xl p-4 border border-red-500/30">
                                    <h3 className="text-xs font-bold text-red-400 mb-2 uppercase tracking-wider">💀 Nemesis</h3>
                                    <div className="space-y-1">
                                        {result.compatibility.nemesis.map(id => (
                                            <div key={id} className="text-sm text-red-200">
                                                {/* @ts-expect-error type def incomplete */}
                                                {profileNames[id]}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    const text = result.share_text;
                                    if (navigator.share) {
                                        navigator.share({ title: 'RPG Identity', text });
                                    } else {
                                        navigator.clipboard.writeText(text).then(() => alert('Kopiert!'));
                                    }
                                }}
                                className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-xl text-sm font-bold shadow-lg shadow-purple-500/20 transition-all"
                            >
                                Ergebnis teilen
                            </button>

                            <button
                                onClick={resetQuiz}
                                className="w-full py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm transition-all"
                            >
                                Erneut spielen
                            </button>
                        </div>
                    </div>
                    <p className="text-xs text-slate-600 text-center mt-4 mb-8">
                        {quizData.meta.disclaimer}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[600px] bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900 text-white p-4 rounded-3xl">
            <div className="max-w-lg mx-auto">
                <div className="mb-6">
                    <div className="flex justify-between text-xs text-purple-300 mb-2">
                        <span>Frage {currentQuestion + 1} von {quizData.questions.length}</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                <div className="bg-slate-800/50 rounded-2xl p-6 border border-purple-500/20 mb-4">
                    {quizData.questions[currentQuestion].narrative && (
                        <p className="text-purple-200 text-sm italic mb-4 pb-4 border-b border-purple-500/20">
                            {quizData.questions[currentQuestion].narrative}
                        </p>
                    )}
                    <h2 className="text-xl font-bold mb-6">
                        {quizData.questions[currentQuestion].text}
                    </h2>

                    <div className="space-y-3">
                        {quizData.questions[currentQuestion].options.map((option) => (
                            <button
                                key={option.id}
                                onClick={() => handleAnswer(option)}
                                className="w-full text-left p-4 bg-slate-700/50 hover:bg-purple-600/30 border border-slate-600 hover:border-purple-500 rounded-xl transition-all duration-200 text-sm"
                            >
                                {option.text}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
