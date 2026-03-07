'use client'

import React, { useState, useEffect } from 'react';
import { useClusterProgress } from '../../lib/stores/useClusterProgress';
import quizDataRaw from './love-languages-quiz.json';

// Type definitions based on the new JSON structure
type DimensionId = 'words' | 'time' | 'gifts' | 'service' | 'touch';

interface QuizProfile {
    id: string; 
    title: string;
    tagline: string;
    description: string;
    stats: Array<{ label: string, value: string }>;
    compatibility: {
        allies: string[];
        ally_text: string;
        nemesis: string[];
        nemesis_text: string;
    };
    share_text: string;
    color: string;
    icon: string;
}

interface QuizOption {
    id: string;
    text: string;
    scores: Partial<Record<DimensionId, number>>;
}

interface QuizQuestion {
    id: string;
    index: number;
    indicator: string;
    context: string;
    text: string;
    options: QuizOption[];
}

// Cast the imported data to a typed structure
const quizData = quizDataRaw as unknown as {
    meta: {
        title: string;
        subtitle: string;
        id: string;
    };
    questions: QuizQuestion[];
    profiles: QuizProfile[];
};

const CLUSTER_ID = 'cluster.mentalist.v1';
const QUIZ_ID = quizData.meta.id;

type Score = Record<DimensionId, number>;

function getProfile(scores: Score): QuizProfile {
    // defined in JSON: "profile_assignment": "highest_score"
    // "tie_breaker": "first_dimension_in_list" -> dimensions order in JSON
    const dimensions: DimensionId[] = ['words', 'time', 'gifts', 'service', 'touch'];
    
    let bestDim: DimensionId = dimensions[0];
    let maxScore = -1;

    for (const dim of dimensions) {
        const s = scores[dim] || 0;
        if (s > maxScore) {
            maxScore = s;
            bestDim = dim;
        }
    }

    return quizData.profiles.find(p => p.id === bestDim) || quizData.profiles[0];
}

export function LoveLanguagesQuiz() {
    const [stage, setStage] = useState('intro');
    const [currentQ, setCurrentQ] = useState(0);
    const [scores, setScores] = useState<Score>({
        words: 0,
        time: 0,
        gifts: 0,
        service: 0,
        touch: 0
    });
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [result, setResult] = useState<QuizProfile | undefined>(undefined);
    const [isAnimating, setIsAnimating] = useState(false);

    // Cluster integration
    const { initCluster, completeQuiz, isLoaded } = useClusterProgress();

    // Initialize cluster on mount
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

    const handleAnswer = (option: QuizOption) => {
        setSelectedOption(option.id);
        
        const newScores = { ...scores };
        // Accumulate scores
        if (option.scores) {
            Object.entries(option.scores).forEach(([dim, value]) => {
                if (typeof value === 'number') {
                    newScores[dim as DimensionId] = (newScores[dim as DimensionId] || 0) + value;
                }
            });
        }
        
        setScores(newScores);

        // Animation and transition
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

                    // LME Update logic with dynamic markers
                    import('../../lib/lme/ingestion').then(({ ingestContribution }) => {
                        const event = {
                            specVersion: "sp.contribution.v1" as const,
                            eventId: crypto.randomUUID(),
                            occurredAt: new Date().toISOString(),
                            source: {
                                vertical: "quiz" as const,
                                moduleId: QUIZ_ID,
                                domain: window.location.hostname
                            },
                            payload: {
                                markers: Object.entries(newScores).map(([k, v]) => ({ 
                                    id: `marker.love.${k}`, 
                                    weight: v / (quizData.questions.length * 3)
                                })),
                                traits: [
                                    { id: `trait.love.${finalProfile.id}`, score: 100, confidence: 0.9 }
                                ],
                                tags: [{ id: 'tag.lovelang.result', label: finalProfile.title, kind: 'misc' as const }],
                                summary: {
                                    title: `Liebessprache: ${finalProfile.title}`,
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
            setScores({ words: 0, time: 0, gifts: 0, service: 0, touch: 0 });
            setSelectedOption(null);
            setResult(undefined);
            setIsAnimating(false);
        }, 300);
    };

    const progress = ((currentQ + 1) / quizData.questions.length) * 100;

    // Render logic adapted to fit inside container
    const containerClass = `min-h-[600px] rounded-xl overflow-hidden shadow-2xl relative transition-all duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'} bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900`;

    if (stage === 'intro') {
        return (
            <div className={containerClass + " flex items-center justify-center p-4"}>
                <div className="max-w-md w-full text-center">
                    <div className="text-6xl mb-6">💜</div>
                    <h1 className="text-3xl font-light text-white mb-3 tracking-wide">
                        {quizData.meta.title}
                    </h1>
                    <p className="text-purple-200/70 mb-8 text-lg">
                        {quizData.meta.subtitle}
                    </p>
                    <div className="space-y-4 text-purple-200/50 text-sm mb-10">
                        <p>{quizData.questions.length} Fragen · ~3 Minuten</p>
                        <p className="text-xs leading-relaxed max-w-xs mx-auto">
                            Entdecke, welche Sprache dein Herz spricht – und warum manche Menschen dich sofort verstehen, während andere nie ankommen.
                        </p>
                    </div>
                    <button
                        onClick={handleStart}
                        className="px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-lg font-medium hover:from-purple-500 hover:to-pink-500 transition-all duration-300 hover:scale-105 shadow-lg shadow-purple-500/30"
                    >
                        Starten
                    </button>
                </div>
            </div>
        );
    }

    if (stage === 'quiz') {
        const question = quizData.questions[currentQ];
        return (
            <div className={containerClass + " flex flex-col"}>
                <div className="w-full h-1 bg-slate-800 absolute top-0 left-0">
                    <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 ease-out"
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
                                        ? 'border-slate-700/50 bg-slate-800/30 text-slate-500'
                                        : 'border-slate-700 bg-slate-800/50 text-purple-100 hover:border-purple-500/50 hover:bg-slate-800 active:scale-98'
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

    if (stage === 'result' && result) {
        return (
            <div
                className={containerClass + " flex flex-col"}
                style={{ background: `linear-gradient(135deg, ${result.color} 0%, #0f0e17 100%)` }}
            >
                <div className="flex-1 p-6 max-w-lg mx-auto w-full overflow-y-auto no-scrollbar">
                    <div className="text-center mb-6 pt-4">
                        <div className="text-5xl mb-4">
                            {result.id === 'words' ? '🪶' : 
                             result.id === 'time' ? '⏳' :
                             result.id === 'gifts' ? '🎁' :
                             result.id === 'service' ? '🛠️' :
                             result.id === 'touch' ? '🤲' : '❤️'}
                        </div>
                        <h1 className="text-3xl font-light text-white mb-2">{result.title}</h1>
                        <p className="text-sm px-4 py-2 rounded-full inline-block mb-4 bg-white/10 text-white">
                             {result.title}
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
                                    <span className="font-mono text-sm text-white">{stat.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-5 mb-6">
                        <h3 className="text-white/50 text-xs uppercase tracking-wider mb-4">Kompatibilität</h3>
                        <div className="mb-4">
                            <span className="text-green-400/70 text-xs">Allies:</span>
                            <p className="text-white/80 text-sm">{result.compatibility.ally_text}</p>
                        </div>
                        <div>
                            <span className="text-red-400/70 text-xs">Nemesis:</span>
                            <p className="text-white/80 text-sm">{result.compatibility.nemesis_text}</p>
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
                            style={{ backgroundColor: result.color }}
                        >
                            Teilen
                        </button>
                    </div>

                    <p className="text-white/30 text-xs text-center leading-relaxed pb-4">
                        Dieser Test dient der spielerischen Selbstreflexion und stellt keine psychologische Bewertung dar.
                    </p>
                </div>
            </div>
        );
    }

    return null;
}
