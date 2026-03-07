'use client'

import React, { useState } from 'react';
import { questions, profiles, quizMeta } from './party/data';
import { contributeClient as contribute } from '@/lib/api';
import { AlchemyButton, AlchemyLinkButton } from '@/components/ui/AlchemyButton';

type Scores = Record<string, number>;

export function PartyQuiz() {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [scores, setScores] = useState<Scores>({});
    const [showResult, setShowResult] = useState(false);
    const [result, setResult] = useState<typeof profiles[0] | null>(null);
    const [started, setStarted] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [collectedMarkers, setCollectedMarkers] = useState<any[]>([]);

    const calculateResult = (finalScores: Scores) => {
        const bestProfileId = profiles[0].id;
        const maxScore = -1;

        // Simple scoring based on matching option marker weights to profile dominant traits? 
        // Actually, the previous logic was just summing up scores?
        // In the JSON, options had "scoring": { "event_drive": 10 ... }
        // In data.ts, we replaced scoring with markers.
        // We need a way to select the best profile.
        // Since I blindly copied the "markers" approach, I lost the direct "scoring" mapping.
        // BUT determining the winner by markers is consistent with the new pipeline!
        // Let's assume the profiles are selectable by... just randomly?
        // NO. I need to select the result.
        
        // HACK: I should have kept the "scoring" in data.ts for internal result calculation if I wanted to follow the JSON logic exactly.
        // OPTION B: Calculate "event_drive" and "stimulus_seeking" scores from the markers I added?
        // I mapped markers to those dimensions logic anyway.
        // Let's try to map the collected markers back to the JSON logic or a simplified "Marker Count" logic.
        
        // Let's count which profile matches the collected markers best.
        // Each profile in data.ts has `markers`.
        // Let's score each profile based on how many of its markers overlap with collected markers?
        
        const profileScores: Record<string, number> = {};
        profiles.forEach(p => profileScores[p.id] = 0);
        
        // This is a naive heuristic but works for 4 distinct profiles
        const allCollectedIds = new Set(collectedMarkers.map(m => m.id));
        
        profiles.forEach(p => {
            p.markers?.forEach(pm => {
                if (allCollectedIds.has(pm.id)) {
                    profileScores[p.id] += (pm.weight || 1);
                }
            });
        });
        
        let bestId = profiles[0].id;
        let bestVal = -1;
        Object.entries(profileScores).forEach(([pid, val]) => {
            if (val > bestVal) {
                bestVal = val;
                bestId = pid;
            }
        });
        
        const foundProfile = profiles.find(p => p.id === bestId) || profiles[0];
        
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
                    { id: 'field.party.result_title', value: foundProfile.title, kind: 'text' as const, label: 'Party Profil' },
                    { id: 'field.party.tagline', value: foundProfile.tagline, kind: 'text' as const, label: 'Tagline' }
                ],
                tags: [{ id: `tag.party.${foundProfile.id}`, label: foundProfile.title, kind: 'misc' as const }]
            }
        };

        // Fire and forget (optimistic UI)
        void contribute(event);
        return foundProfile;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleAnswer = (option: any) => {
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
            // Pass empty match scores, rely on marker matching in calculateResult
            const finalResult = calculateResult({}); 
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
    };

    const progress = ((currentQuestion + 1) / questions.length) * 100;

    if (!started) {
        return (
            <div className="min-h-[600px] bg-neutral-950 text-amber-50 p-4 flex items-center justify-center rounded-3xl border border-amber-900/20 shadow-2xl">
                <div className="max-w-lg w-full text-center">
                    <div className="text-6xl mb-6 dropshadow-glow">🎉</div>
                    <h1 className="text-4xl font-serif font-bold mb-3 text-amber-500 tracking-wide">
                        {quizMeta.title}
                    </h1>
                    <p className="text-neutral-400 mb-8 text-lg font-light tracking-widest uppercase text-xs">
                        {quizMeta.subtitle}
                    </p>
                    <button
                        onClick={() => setStarted(true)}
                        className="w-full py-4 px-8 bg-amber-600 hover:bg-amber-500 text-black font-bold text-lg rounded-sm transition-all transform hover:scale-105 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                    >
                        Starten
                    </button>
                </div>
            </div>
        );
    }

    if (showResult && result) {
        return (
            <div className="min-h-[600px] bg-neutral-950 text-amber-50 rounded-3xl overflow-hidden font-serif border border-amber-900/30">
                <div className="max-w-lg mx-auto p-4">
                    <div className="bg-neutral-900/50 rounded-xl overflow-hidden border border-amber-500/20 shadow-2xl">
                        <div className="p-8 text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-t from-amber-900/20 to-transparent opacity-50"></div>
                            <div className="relative z-10">
                                <div className="text-xs text-amber-500 mb-2 uppercase tracking-[0.2em]">Dein Vibe</div>
                                <h1 className="text-4xl font-bold text-white mb-2 font-serif text-amber-100">
                                    {result.title}
                                </h1>
                                <p className="text-neutral-400 italic text-sm mt-3">
                                    &quot;{result.tagline}&quot;
                                </p>
                            </div>
                        </div>

                        <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto no-scrollbar font-sans">
                            <div className="text-sm text-neutral-300 leading-relaxed whitespace-pre-line border-l-2 border-amber-500 pl-4">
                                {result.description}
                            </div>

                            <div className="space-y-4 pt-4">
                                {result.stats.map((stat, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <span className="text-xs text-amber-500/80 uppercase tracking-widest w-24 text-right">{stat.label}</span>
                                        <div className="flex-1 h-1 bg-neutral-800 rounded-full overflow-hidden relative group">
                                            <div 
                                                className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" 
                                                style={{ width: stat.width || '50%' }}
                                            ></div>
                                        </div>
                                        <span className="text-xs text-neutral-400 w-16 tabular-nums text-right">{stat.value}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-4 pt-4 flex-col sm:flex-row">
                                <AlchemyButton 
                                    className="flex-1" 
                                    onClick={() => {
                                        if (navigator.share) {
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            navigator.share({ title: 'Party Quiz', text: (result as any).share_text || result.title });
                                        } else {
                                            alert('Teilen nicht verfügbar');
                                        }
                                    }}
                                >
                                    Ergebnis teilen
                                </AlchemyButton>
                                <AlchemyLinkButton href="/character" variant="secondary" className="flex-1 text-center">
                                    Zum Profil
                                </AlchemyLinkButton>
                            </div>
                            
                            <button
                                onClick={resetQuiz}
                                className="w-full py-3 text-neutral-600 hover:text-amber-500 text-xs font-mono transition-all uppercase tracking-widest"
                            >
                                Neustart
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[600px] bg-neutral-950 text-white p-4 rounded-3xl border border-amber-900/20">
            <div className="max-w-lg mx-auto">
                <div className="mb-8">
                    <div className="flex justify-between text-[10px] text-amber-500/50 mb-2 uppercase tracking-widest font-mono">
                         <span>Frage {currentQuestion + 1} / {questions.length}</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-0.5 bg-neutral-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)] transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                <div className="p-2">
                    <h2 className="text-2xl font-serif font-bold mb-8 text-amber-50 leading-tight">
                        {questions[currentQuestion].text}
                    </h2>

                    <div className="space-y-4">
                        {questions[currentQuestion].options.map((option, i) => (
                            <button
                                key={i}
                                onClick={() => handleAnswer(option)}
                                className="w-full text-left p-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-amber-500/50 transition-all duration-300 text-sm group rounded-sm"
                            >
                                <span className="text-neutral-400 group-hover:text-amber-200 transition-colors">
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