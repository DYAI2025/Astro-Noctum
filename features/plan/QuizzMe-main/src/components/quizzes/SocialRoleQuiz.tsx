
'use client'

import React, { useState } from 'react';
import { questions, profiles, quizMeta } from './social-role/data';
import { contributeClient as contribute } from '@/lib/api';
import { AlchemyButton, AlchemyLinkButton } from '@/components/ui/AlchemyButton';

// Weights derived from JSON definition
const ROLE_WEIGHTS: Record<string, Record<string, number>> = {
    leader: { leadership: 2, harmony: 0.5, expression: 1, support: 0.5 },
    connector: { leadership: 0.5, harmony: 2, expression: 1, support: 1.5 },
    entertainer: { leadership: 0.5, harmony: 0.5, expression: 2, support: 0.5 },
    sage: { leadership: 1, harmony: 1, expression: 0.5, support: 1 },
    caretaker: { leadership: 0.5, harmony: 1.5, expression: 0.5, support: 2 },
    rebel: { leadership: 1.5, harmony: 0, expression: 1.5, support: 0 }
};

type Scores = Record<string, number>;

export function SocialRoleQuiz() {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [scores, setScores] = useState<Scores>({ leadership: 0, harmony: 0, expression: 0, support: 0 });
    const [showResult, setShowResult] = useState(false);
    const [result, setResult] = useState<typeof profiles[0] | null>(null);
    const [started, setStarted] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [collectedMarkers, setCollectedMarkers] = useState<any[]>([]);

    const calculateResult = (finalScores: Scores) => {
        let bestProfileId = 'leader';
        let maxScore = -1;

        Object.entries(ROLE_WEIGHTS).forEach(([roleId, weights]) => {
            let roleScore = 0;
            // Dot product: User Scores * Role Weights
            Object.entries(finalScores).forEach(([dim, val]) => {
                roleScore += val * (weights[dim] || 0);
            });

            if (roleScore > maxScore) {
                maxScore = roleScore;
                bestProfileId = roleId;
            }
        });

        const foundProfile = profiles.find(p => p.id === bestProfileId) || profiles[0];
        
        // Final Markers
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const finalMarkers = [...collectedMarkers, ...(foundProfile.markers || [])];

        const event = {
            specVersion: "sp.contribution.v1" as const,
            eventId: crypto.randomUUID(),
            occurredAt: new Date().toISOString(),
            source: {
                vertical: "quiz" as const,
                moduleId: quizMeta.id,
                domain: window.location.hostname
            },
            payload: {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                markers: finalMarkers.map((m: any) => ({
                    id: m.id,
                    weight: m.weight || 0.1
                })),
                fields: [
                    { id: 'field.social_role.result_title', value: foundProfile.title, kind: 'text' as const, label: 'Soziale Rolle' },
                    { id: 'field.social_role.tagline', value: foundProfile.tagline, kind: 'text' as const, label: 'Tagline' }
                ],
                tags: [{ id: 'tag.social_role.result', label: foundProfile.title, kind: 'misc' as const }]
            }
        };

        // Fire and forget (optimistic UI)
        void contribute(event);
        return foundProfile;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleAnswer = (option: any) => {
        // Accumulate scores
        const newScores = { ...scores };
        if (option.scores) {
            Object.entries(option.scores).forEach(([key, value]) => {
                newScores[key] = (newScores[key] || 0) + (value as number);
            });
        }
        setScores(newScores);

        // Collect markers
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newMarkers = [...collectedMarkers];
        if (option.markers) {
            newMarkers.push(...option.markers);
        }
        setCollectedMarkers(newMarkers);

        if (currentQuestion < questions.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        } else {
            const finalResult = calculateResult(newScores);
            setResult(finalResult);
            setShowResult(true);
        }
    };

    const resetQuiz = () => {
        setCurrentQuestion(0);
        setScores({ leadership: 0, harmony: 0, expression: 0, support: 0 });
        setCollectedMarkers([]);
        setShowResult(false);
        setResult(null);
        setStarted(false);
    };

    const progress = ((currentQuestion + 1) / questions.length) * 100;

    if (!started) {
        return (
            <div className="min-h-[600px] bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900 text-white p-4 flex items-center justify-center rounded-3xl">
                <div className="max-w-lg w-full text-center">
                    <div className="text-6xl mb-6">🎭</div>
                    <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200 bg-clip-text text-transparent">
                        {quizMeta.title}
                    </h1>
                    <p className="text-purple-200 mb-8 text-lg">
                        {quizMeta.subtitle}
                    </p>
                    <button
                        onClick={() => setStarted(true)}
                        className="w-full py-4 px-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-purple-500/25"
                    >
                        Starten
                    </button>
                    <p className="text-xs text-slate-500 mt-6">
                        {quizMeta.disclaimer}
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
                                <div className="text-sm text-purple-300 mb-2">Deine Soziale Rolle</div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200 bg-clip-text text-transparent mb-2">
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
                            
                            <div className="flex gap-4 pt-4 flex-col sm:flex-row">
                                <AlchemyButton 
                                    className="flex-1" 
                                    onClick={() => {
                                        if (navigator.share) {
                                            navigator.share({ title: 'Social Role Quiz', text: result.share_text });
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
                                className="w-full py-3 text-slate-500 hover:text-slate-300 text-sm transition-all"
                            >
                                Test wiederholen
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[600px] bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900 text-white p-4 rounded-3xl">
            <div className="max-w-lg mx-auto">
                <div className="mb-6">
                    <div className="flex justify-between text-xs text-purple-300 mb-2">
                        <span>Frage {currentQuestion + 1} von {questions.length}</span>
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
                    <p className="text-purple-200 text-sm italic mb-4 pb-4 border-b border-purple-500/20">
                        {questions[currentQuestion].scenario}
                    </p>
                    <h2 className="text-xl font-bold mb-6">
                        {questions[currentQuestion].text}
                    </h2>

                    <div className="space-y-3">
                        {questions[currentQuestion].options.map((option, i) => (
                            <button
                                key={i}
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
