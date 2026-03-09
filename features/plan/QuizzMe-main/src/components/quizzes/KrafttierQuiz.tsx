'use client'

import React, { useState } from 'react';
import { questions, profiles, quizMeta, calculateProfileScores, type DimensionScores } from './krafttier/data';
import { contributeClient as contribute } from '@/lib/api';
import { useClusterProgress } from '@/lib/stores/useClusterProgress';
import { AlchemyButton, AlchemyLinkButton } from '@/components/ui/AlchemyButton';



export function KrafttierQuiz() {
    // V2: We track scores per dimension (e.g. 'mut': 15, 'sozial': 10)
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [dimensionScores, setDimensionScores] = useState<DimensionScores>({});
    const [showResult, setShowResult] = useState(false);
    const [result, setResult] = useState<typeof profiles[0] | null>(null);
    const [started, setStarted] = useState(false);
    const [microWin, setMicroWin] = useState<string | null>(null);

    const { completeQuiz } = useClusterProgress();

    const calculateResult = (finalDimensionScores: DimensionScores) => {
        // V2: Use matrix multiplication
        const profileScores = calculateProfileScores(finalDimensionScores);
        
        // Find best profile
        let bestProfileId = profiles[0].id;
        let maxScore = -1;

        Object.entries(profileScores).forEach(([id, score]) => {
            if (score > maxScore) {
                maxScore = score;
                bestProfileId = id;
            }
        });

        const foundProfile = profiles.find(p => p.id === bestProfileId) || profiles[0];
        
        // V2 Markers: Just the profile markers (no option markers in this version, or minimal)
        // Since options just map to dimensions, we rely on the Profile's markers for the final persona
        const finalMarkers = foundProfile.markers.map(id => ({ id, weight: 1.0 }));

        const event = {
            specVersion: "sp.contribution.v1" as const,
            eventId: crypto.randomUUID(),
            occurredAt: new Date().toISOString(),
            source: {
                vertical: "quiz" as const,
                moduleId: quizMeta.id,
                domain: window.location.hostname,
                locale: "de-DE"
            },
            payload: {
                markers: finalMarkers,
                fields: [
                    { id: 'field.krafttier.result_title', value: foundProfile.title, kind: 'text' as const },
                    { id: 'field.krafttier.tagline', value: foundProfile.tagline, kind: 'text' as const }
                ],
                tags: [{ id: 'tag.krafttier.result', label: foundProfile.title, kind: 'archetype' as const }],
                summary: {
                    title: `Krafttier: ${foundProfile.title}`,
                    bullets: [foundProfile.tagline, foundProfile.subtitle],
                    resultId: foundProfile.id
                }
            }
        };

        // Fire and forget (optimistic UI)
        void contribute(event);
        return foundProfile;
    };

    const handleAnswer = (option: typeof questions[0]['options'][0]) => {
        // Accumulate dimension scores
        const newDimensionScores = { ...dimensionScores };
        if (option.scores) {
            Object.entries(option.scores).forEach(([dimId, val]) => {
                newDimensionScores[dimId] = (newDimensionScores[dimId] || 0) + (val as number);
            });
        }
        setDimensionScores(newDimensionScores);

        // Micro-win feedback
        const wins = ["Gut gefühlt!", "Interessant...", "Das passt zu dir.", "Notiert.", "Tiefgründig."];
        // eslint-disable-next-line
        setMicroWin(wins[Math.floor(Math.random() * wins.length)]);
        setTimeout(() => setMicroWin(null), 800);

        if (currentQuestion < questions.length - 1) {
            setTimeout(() => {
                setCurrentQuestion(currentQuestion + 1);
            }, 300);
        } else {
            setTimeout(() => {
                const finalResult = calculateResult(newDimensionScores);
                setResult(finalResult);
                setShowResult(true);

                // Mark completion in Cluster Store
                completeQuiz("cluster.naturkind.v1", quizMeta.id, finalResult.id, finalResult.title);
            }, 500);
        }
    };

    const resetQuiz = () => {
        setCurrentQuestion(0);
        setDimensionScores({});
        setShowResult(false);
        setResult(null);
        setStarted(false);
    };

    const progress = ((currentQuestion + 1) / questions.length) * 100;

    if (!started) {
        return (
            <div className="min-h-[600px] bg-gradient-to-b from-emerald-950 via-teal-900 to-emerald-950 text-white p-4 flex items-center justify-center rounded-3xl">
                <div className="max-w-lg w-full text-center">
                    <div className="text-6xl mb-6">🌿</div>
                    <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-emerald-200 via-teal-200 to-emerald-200 bg-clip-text text-transparent">
                        {quizMeta.title}
                    </h1>
                    <p className="text-emerald-100 mb-8 text-lg">
                        {quizMeta.subtitle}
                    </p>
                    <button
                        onClick={() => setStarted(true)}
                        className="w-full py-4 px-8 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-emerald-500/25"
                    >
                        Reise beginnen
                    </button>
                    <p className="text-xs text-emerald-400/50 mt-6">
                        {quizMeta.disclaimer}
                    </p>
                </div>
            </div>
        );
    }

    if (showResult && result) {
        return (
            <div className="min-h-[600px] bg-gradient-to-b from-emerald-950 via-teal-900 to-emerald-950 text-white rounded-3xl overflow-hidden">
                <div className="max-w-lg mx-auto p-4">
                    <div className="bg-gradient-to-b from-emerald-900/50 to-emerald-950/50 rounded-2xl overflow-hidden border border-emerald-500/30 shadow-2xl">
                        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 p-1">
                            <div className="bg-emerald-950 p-6 text-center">
                                <div className="text-sm text-emerald-300 mb-2">Dein Krafttier</div>
                                <div className="text-6xl mb-4 transform hover:scale-110 transition-transform cursor-pointer">
                                    {result.icon}
                                </div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-200 via-teal-200 to-emerald-200 bg-clip-text text-transparent mb-2">
                                    {result.title}
                                </h1>
                                <p className="text-emerald-200 italic text-sm">
                                    &quot;{result.tagline}&quot;
                                </p>
                            </div>
                        </div>

                        <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto no-scrollbar">
                            <div className="text-sm text-emerald-100 leading-relaxed whitespace-pre-line bg-emerald-900/30 p-4 rounded-xl border border-emerald-500/20">
                                {result.description}
                            </div>

                            <div className="bg-emerald-900/30 rounded-xl p-4 border border-emerald-500/20">
                                <h3 className="text-xs font-bold text-emerald-400 mb-3 uppercase tracking-wider">Eigenschaften</h3>
                                <div className="space-y-2">
                                    {result.stats.map((stat, i) => (
                                        <div key={i} className="flex justify-between text-sm">
                                            <span className="text-emerald-300/80">{stat.label}</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 h-1.5 bg-emerald-950 rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500" style={{ width: `${stat.value}%` }}></div>
                                                </div>
                                                <span className="text-emerald-300 font-mono w-6 text-right">{stat.value}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="bg-teal-900/30 rounded-xl p-4 border border-teal-500/20">
                                <h3 className="text-xs font-bold text-teal-400 mb-2 uppercase tracking-wider">Harmonie</h3>
                                <div className="flex flex-wrap gap-2">
                                    {result.compatibility.split(', ').map(name => (
                                        <span key={name} className="px-2 py-1 bg-teal-800/50 rounded text-xs text-teal-200 border border-teal-500/20">
                                            {name}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 flex-col sm:flex-row">
                                <AlchemyButton 
                                    className="flex-1" 
                                    onClick={() => {
                                        if (navigator.share) {
                                            navigator.share({ title: 'Krafttier Quiz', text: result.share_text });
                                        } else {
                                            navigator.clipboard.writeText(result.share_text).then(() => alert('Kopiert!'));
                                        }
                                    }}
                                >
                                    Teilen
                                </AlchemyButton>
                                <AlchemyLinkButton href="/character" variant="secondary" className="flex-1 text-center">
                                    Zum Profil
                                </AlchemyLinkButton>
                            </div>
                            
                            <button
                                onClick={resetQuiz}
                                className="w-full py-3 text-emerald-500 hover:text-emerald-300 text-sm transition-all"
                            >
                                Neue Reise
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[600px] bg-gradient-to-b from-emerald-950 via-teal-900 to-emerald-950 text-white p-4 rounded-3xl">
            <div className="max-w-lg mx-auto">
                <div className="mb-6">
                    <div className="flex justify-between text-xs text-emerald-300 mb-2">
                        <span>Schritt {currentQuestion + 1} von {questions.length}</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 bg-emerald-900 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                <div className="bg-emerald-900/40 rounded-2xl p-6 border border-emerald-500/20 mb-4 backdrop-blur-sm">
                    <p className="text-emerald-200 text-sm italic mb-4 pb-4 border-b border-emerald-500/20">
                        {questions[currentQuestion].scenario}
                    </p>
                    <h2 className="text-xl font-bold mb-6 text-emerald-50">
                        {questions[currentQuestion].text}
                    </h2>

                    <div className="space-y-3">
                        {questions[currentQuestion].options.map((option, i) => (
                            <button
                                key={i}
                                onClick={() => handleAnswer(option)}
                                className="w-full text-left p-4 bg-emerald-800/40 hover:bg-emerald-700/60 border border-emerald-600/30 hover:border-emerald-400/50 rounded-xl transition-all duration-200 text-sm group"
                            >
                                <span className="text-emerald-100 group-hover:text-white transition-colors">
                                    {option.text}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
                
                {microWin && (
                    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50 animate-in fade-in zoom-in duration-300">
                        <div className="text-3xl font-serif font-bold text-emerald-200 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)] bg-emerald-950/80 px-8 py-4 rounded-full border border-emerald-500/30 backdrop-blur-md">
                            {microWin}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
