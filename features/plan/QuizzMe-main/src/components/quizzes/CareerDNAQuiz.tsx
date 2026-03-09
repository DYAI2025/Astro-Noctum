
'use client'

import React, { useState } from 'react';
import { questions, profiles, quizMeta } from './careerdna/data';
import { contributeClient as contribute } from '@/lib/api';
import { AlchemyButton, AlchemyLinkButton } from '@/components/ui/AlchemyButton';
import { trackQuizEvent } from '@/lib/analytics/supabase';

type Scores = Record<string, number>;

export function CareerDNAQuiz() {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [scores, setScores] = useState<Scores>({});
    const [showResult, setShowResult] = useState(false);
    const [result, setResult] = useState<typeof profiles[0] | null>(null);
    const [started, setStarted] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [collectedMarkers, setCollectedMarkers] = useState<any[]>([]);

    const calculateResult = (finalScores: Scores) => {
        let bestProfileId = profiles[0].id;
        let maxScore = -1;

        Object.entries(finalScores).forEach(([id, score]) => {
            if (score > maxScore) {
                maxScore = score;
                bestProfileId = id;
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
                    { id: 'field.career_dna.result_title', value: foundProfile.title, kind: 'text' as const, label: 'Karriere DNA' },
                    { id: 'field.career_dna.tagline', value: foundProfile.tagline, kind: 'text' as const, label: 'Tagline' }
                ],
                tags: [{ id: 'tag.career_dna.result', label: foundProfile.title, kind: 'misc' as const }]
            }
        };

        // Fire and forget (optimistic UI)
        void contribute(event);
        void trackQuizEvent({
            event: "quiz_completed",
            quizId: quizMeta.id,
            metadata: { resultId: foundProfile.id, title: foundProfile.title },
        });
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
        setScores({});
        setCollectedMarkers([]);
        setShowResult(false);
        setResult(null);
        setStarted(false);
        void trackQuizEvent({ event: "quiz_restart", quizId: quizMeta.id });
    };

    const progress = ((currentQuestion + 1) / questions.length) * 100;

    if (!started) {
        return (
            <div className="min-h-[600px] bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 text-white p-4 flex items-center justify-center rounded-3xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
                <div className="max-w-lg w-full text-center relative z-10">
                    <div className="text-6xl mb-6">🧬</div>
                    <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-200 via-cyan-200 to-blue-200 bg-clip-text text-transparent">
                        {quizMeta.title}
                    </h1>
                    <p className="text-blue-200 mb-8 text-lg">
                        {quizMeta.subtitle}
                    </p>
                    <button
                        onClick={() => {
                            setStarted(true);
                            void trackQuizEvent({ event: "quiz_started", quizId: quizMeta.id });
                        }}
                        className="w-full py-4 px-8 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg shadow-blue-500/25 border border-blue-400/20"
                    >
                        Analyse starten
                    </button>
                    <p className="text-xs text-slate-500 mt-6 font-mono">
                        {quizMeta.disclaimer}
                    </p>
                </div>
            </div>
        );
    }

    if (showResult && result) {
        return (
            <div className="min-h-[600px] bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl overflow-hidden font-sans">
                <div className="max-w-lg mx-auto p-4">
                    <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl overflow-hidden border border-blue-500/30 shadow-2xl">
                        <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 p-0.5">
                            <div className="bg-slate-900 p-6 text-center">
                                <div className="text-xs font-mono text-cyan-400 mb-2 uppercase tracking-widest">Result: Processed</div>
                                <h1 className="text-3xl font-bold text-white mb-2">
                                    {result.title}
                                </h1>
                                <p className="text-blue-200 italic text-sm">
                                    &quot;{result.tagline}&quot;
                                </p>
                            </div>
                        </div>

                        <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto no-scrollbar">
                            <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                                {result.description}
                            </div>

                            <div className="bg-slate-800/50 rounded-xl p-4 border border-blue-500/20">
                                <h3 className="text-xs font-bold text-cyan-400 mb-3 uppercase tracking-wider font-mono">Metric Analysis</h3>
                                <div className="space-y-3">
                                    {result.stats.map((stat, i) => (
                                        <div key={i} className="">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-slate-400">{stat.label}</span>
                                                <span className="text-cyan-300 font-mono">{stat.value}%</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                                 <div className="h-full bg-cyan-500" style={{ width: `${stat.value}%` }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="bg-blue-900/20 rounded-xl p-4 border border-blue-500/30">
                                    <h3 className="text-xs font-bold text-blue-400 mb-2 uppercase tracking-wider font-mono">Ideal Environment</h3>
                                    <div className="text-sm text-blue-200">
                                        ✅ Perfect: <span className="text-white">{result.matching.perfect}</span>
                                    </div>
                                    <div className="text-sm text-slate-400 mt-1">
                                        ❌ Avoid: <span className="text-slate-300">{result.matching.avoid}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4 flex-col sm:flex-row">
                                <AlchemyButton 
                                    className="flex-1" 
                                    onClick={() => {
                                        if (navigator.share) {
                                            navigator.share({ title: 'Career DNA', text: result.share_text });
                                        } else {
                                            navigator.clipboard.writeText(result.share_text).then(() => alert('Kopiert!'));
                                        }
                                    }}
                                >
                                    Share Result
                                </AlchemyButton>
                                <AlchemyLinkButton href="/character" variant="secondary" className="flex-1 text-center">
                                    Zum Profil
                                </AlchemyLinkButton>
                            </div>
                            
                            <button
                                onClick={resetQuiz}
                                className="w-full py-3 text-slate-500 hover:text-slate-300 text-xs font-mono transition-all uppercase"
                            >
                                Restart Analysis
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[600px] bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 text-white p-4 rounded-3xl">
            <div className="max-w-lg mx-auto">
                <div className="mb-6">
                    <div className="flex justify-between text-xs text-blue-300 mb-2 font-mono">
                        <span>DATA_POINT {currentQuestion + 1}/{questions.length}</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-cyan-500 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                <div className="bg-slate-800/80 rounded-sm p-6 border-l-2 border-cyan-500 mb-4 shadow-lg shadow-blue-900/20">
                    <h2 className="text-lg font-bold mb-6 font-sans leading-relaxed">
                        {questions[currentQuestion].text}
                    </h2>
                    <p className="text-slate-400 text-xs font-mono mb-4 uppercase tracking-widest">
                         {questions[currentQuestion].scenario}
                    </p>

                    <div className="space-y-3">
                        {questions[currentQuestion].options.map((option, i) => (
                            <button
                                key={i}
                                onClick={() => handleAnswer(option)}
                                className="w-full text-left p-4 bg-slate-700/30 hover:bg-blue-600/20 border border-slate-600 hover:border-cyan-400 transition-all duration-200 text-sm group flex items-center"
                            >
                                <div className="w-2 h-2 bg-slate-500 group-hover:bg-cyan-400 rounded-full mr-3 transition-colors"></div>
                                <span className="text-slate-200 group-hover:text-white">
                                    {option.text}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
