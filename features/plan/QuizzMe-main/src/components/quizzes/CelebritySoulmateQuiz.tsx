
'use client'

import React, { useState } from 'react';
import { celebrities, Celebrity } from './celebrity-soulmate/data';
import { ingestContribution } from '@/lib/lme/ingestion';
import { ContributionEvent, Marker, TraitScore } from '@/lib/lme/types';

const questions = [
    {
        scenario: "Ein spontaner Roadtrip wird geplant...",
        question: "Wie reagierst du?",
        options: [
            { text: "Ich übernehme die Planung – jemand muss ja", emoji: "📋", scores: { E: 0, K: -1, B: 1, A: 1 } },
            { text: "Klingt wild, ich bin dabei – wohin geht's?", emoji: "🚗", scores: { E: 2, K: 1, B: 1, A: 0 } },
            { text: "Könnte ich darüber nachdenken? Spontan ist nicht so meins", emoji: "🤔", scores: { E: -2, K: 0, B: 0, A: 0 } },
            { text: "Nur wenn ich die Playlist kontrolliere", emoji: "🎵", scores: { E: 0, K: 2, B: 0, A: -1 } }
        ]
    },
    {
        scenario: "Dein Projekt wird öffentlich kritisiert...",
        question: "Was ist dein erster Impuls?",
        options: [
            { text: "Die Kritik analysieren – ist da was dran?", emoji: "🔍", scores: { E: -1, K: 0, B: 0, A: 1 } },
            { text: "Verteidigen, was ich gemacht habe", emoji: "⚔️", scores: { E: 1, K: 0, B: -1, A: 1 } },
            { text: "Mit Freunden darüber reden, das tut gut", emoji: "💬", scores: { E: 1, K: 0, B: 2, A: 0 } },
            { text: "Ignorieren und weitermachen – Hater gonna hate", emoji: "😎", scores: { E: 0, K: 1, B: -1, A: 0 } }
        ]
    },
    {
        scenario: "Du gewinnst unerwartet 10.000€...",
        question: "Was passiert damit?",
        options: [
            { text: "Investieren – langfristig denken", emoji: "📈", scores: { E: -1, K: 0, B: 0, A: 2 } },
            { text: "Ein Teil für mich, ein Teil für andere", emoji: "💝", scores: { E: 0, K: 0, B: 2, A: 0 } },
            { text: "Endlich das kreative Projekt starten", emoji: "🎨", scores: { E: 0, K: 2, B: 0, A: 1 } },
            { text: "Erstmal feiern – das Leben ist kurz", emoji: "🎉", scores: { E: 2, K: 1, B: 1, A: -1 } }
        ]
    },
    {
        scenario: "Auf einer Party kennst du niemanden...",
        question: "Wie verhältst du dich?",
        options: [
            { text: "Aktiv auf Leute zugehen und Gespräche starten", emoji: "🙋", scores: { E: 2, K: 0, B: 1, A: 0 } },
            { text: "Erstmal beobachten, dann selektiv ansprechen", emoji: "👀", scores: { E: -1, K: 1, B: 0, A: 0 } },
            { text: "Eine Person finden und tiefes Gespräch führen", emoji: "🫂", scores: { E: 0, K: 0, B: 2, A: 0 } },
            { text: "Ehrlich? Wahrscheinlich früh gehen", emoji: "🚪", scores: { E: -2, K: 0, B: -1, A: 0 } }
        ]
    },
    {
        scenario: "Dir wird eine Führungsposition angeboten...",
        question: "Was denkst du zuerst?",
        options: [
            { text: "Endlich – das habe ich verdient", emoji: "👑", scores: { E: 1, K: 0, B: 0, A: 2 } },
            { text: "Kann ich das Team gut führen?", emoji: "🤝", scores: { E: 0, K: 0, B: 2, A: 1 } },
            { text: "Weniger kreative Freiheit – ist es das wert?", emoji: "🎭", scores: { E: 0, K: 2, B: 0, A: -1 } },
            { text: "Ich brauche Zeit, das zu verarbeiten", emoji: "⏸️", scores: { E: -1, K: 0, B: 0, A: 0 } }
        ]
    },
    {
        scenario: "Ein Freund ist emotional am Limit...",
        question: "Wie hilfst du?",
        options: [
            { text: "Praktische Lösungen vorschlagen", emoji: "🛠️", scores: { E: 0, K: 0, B: 0, A: 2 } },
            { text: "Einfach da sein und zuhören", emoji: "💜", scores: { E: 0, K: 0, B: 2, A: -1 } },
            { text: "Ablenkung organisieren – rausgehen, was unternehmen", emoji: "🎪", scores: { E: 2, K: 1, B: 1, A: 0 } },
            { text: "Tief eintauchen in die Gefühle, gemeinsam durcharbeiten", emoji: "🌊", scores: { E: -1, K: 1, B: 2, A: 0 } }
        ]
    },
    {
        scenario: "Du musst dich zwischen zwei Jobs entscheiden...",
        question: "Was wiegt schwerer?",
        options: [
            { text: "Das Gehalt und die Sicherheit", emoji: "🏦", scores: { E: 0, K: -1, B: 0, A: 2 } },
            { text: "Das Team und die Kultur", emoji: "👥", scores: { E: 1, K: 0, B: 2, A: 0 } },
            { text: "Die kreative Freiheit und Lernchancen", emoji: "🚀", scores: { E: 0, K: 2, B: 0, A: 0 } },
            { text: "Der Impact und die Bedeutung der Arbeit", emoji: "🌍", scores: { E: 0, K: 1, B: 1, A: 1 } }
        ]
    },
    {
        scenario: "Dein Wochenende ist komplett frei...",
        question: "Was klingt am verlockendsten?",
        options: [
            { text: "Socializing – Freunde treffen, Aktivitäten planen", emoji: "🎊", scores: { E: 2, K: 0, B: 2, A: 0 } },
            { text: "Kreatives Projekt – endlich Zeit dafür", emoji: "✏️", scores: { E: -1, K: 2, B: 0, A: 0 } },
            { text: "Produktiv sein – Dinge erledigen", emoji: "✅", scores: { E: 0, K: -1, B: 0, A: 2 } },
            { text: "Absolute Ruhe – allein aufladen", emoji: "🧘", scores: { E: -2, K: 0, B: -1, A: 0 } }
        ]
    },
    {
        scenario: "In einer Diskussion merkst du, dass du falsch liegst...",
        question: "Was passiert?",
        options: [
            { text: "Sofort zugeben – Ehrlichkeit ist wichtiger als Ego", emoji: "🤲", scores: { E: 0, K: 0, B: 2, A: 0 } },
            { text: "Erstmal die andere Position verstehen wollen", emoji: "🧐", scores: { E: -1, K: 1, B: 1, A: 0 } },
            { text: "Zugeben, aber meine ursprüngliche Logik erklären", emoji: "📊", scores: { E: 0, K: 0, B: 0, A: 1 } },
            { text: "Inner cringe, aber smooth wechseln", emoji: "😬", scores: { E: 1, K: 1, B: 0, A: 0 } }
        ]
    },
    {
        scenario: "Du hast eine kontroverse Meinung...",
        question: "Wie gehst du damit um?",
        options: [
            { text: "Laut und stolz vertreten – authentisch bleiben", emoji: "📢", scores: { E: 2, K: 1, B: -1, A: 0 } },
            { text: "Nur mit engen Freunden teilen", emoji: "🤫", scores: { E: -1, K: 0, B: 1, A: 0 } },
            { text: "Diplomatisch verpacken, aber aussprechen", emoji: "🎁", scores: { E: 1, K: 0, B: 1, A: 1 } },
            { text: "Für mich behalten – nicht jeder muss alles wissen", emoji: "🔒", scores: { E: -2, K: 0, B: 0, A: 1 } }
        ]
    },
    {
        scenario: "Ein riesige Chance kommt, aber das Timing ist schlecht...",
        question: "Was tust du?",
        options: [
            { text: "Zugreifen – solche Chancen kommen nicht oft", emoji: "⚡", scores: { E: 1, K: 1, B: -1, A: 2 } },
            { text: "Ablehnen – die bestehenden Commitments zählen", emoji: "🤝", scores: { E: -1, K: 0, B: 2, A: 0 } },
            { text: "Verhandeln – vielleicht geht beides", emoji: "🎭", scores: { E: 1, K: 1, B: 0, A: 1 } },
            { text: "Rat holen bei Menschen, denen ich vertraue", emoji: "💬", scores: { E: 0, K: 0, B: 2, A: 0 } }
        ]
    },
    {
        scenario: "Du könntest eine Sache an dir ändern...",
        question: "Was wäre es?",
        options: [
            { text: "Weniger Overthinking, mehr Aktion", emoji: "🧠", scores: { E: -1, K: 1, B: 0, A: -1 } },
            { text: "Mehr Geduld mit anderen", emoji: "⏳", scores: { E: 0, K: 0, B: 1, A: 1 } },
            { text: "Mehr Selbstbewusstsein", emoji: "💪", scores: { E: -1, K: 0, B: 0, A: 0 } },
            { text: "Mehr Work-Life-Balance", emoji: "⚖️", scores: { E: 1, K: 0, B: 1, A: 2 } }
        ]
    }
];

export function CelebritySoulmateQuiz() {
    const [stage, setStage] = useState('intro');
    const [currentQ, setCurrentQ] = useState(0);
    const [scores, setScores] = useState({ E: 5, K: 5, B: 5, A: 5 });
    const [isAnimating, setIsAnimating] = useState(false);
    const [result, setResult] = useState<{ match: Celebrity & { matchPercent: number }, runnerUps: (Celebrity & { matchPercent: number })[], ally: Celebrity, rival: Celebrity } | null>(null);

    const startQuiz = () => {
        setStage('quiz');
    };

    const handleAnswer = (optionScores: { E: number, K: number, B: number, A: number }) => {
        setIsAnimating(true);
        setTimeout(() => {
            const newScores = { ...scores };
            newScores.E = Math.max(1, Math.min(10, newScores.E + optionScores.E));
            newScores.K = Math.max(1, Math.min(10, newScores.K + optionScores.K));
            newScores.B = Math.max(1, Math.min(10, newScores.B + optionScores.B));
            newScores.A = Math.max(1, Math.min(10, newScores.A + optionScores.A));
            setScores(newScores);

            if (currentQ < questions.length - 1) {
                setCurrentQ(currentQ + 1);
                setIsAnimating(false);
            } else {
                calculateResult(newScores);
            }
        }, 300);
    };

    const calculateResult = (finalScores: typeof scores) => {
        setStage('loading');

        // 1. Calculate Celebrity Match (Frontend logic)
        const matches = celebrities.map(celeb => {
            const distance = Math.sqrt(
                Math.pow(finalScores.E - celeb.E, 2) +
                Math.pow(finalScores.K - celeb.K, 2) +
                Math.pow(finalScores.B - celeb.B, 2) +
                Math.pow(finalScores.A - celeb.A, 2)
            );
            const matchPercent = Math.round(Math.max(0, 100 - (distance * 5.5)));
            return { ...celeb, distance, matchPercent };
        });

        matches.sort((a, b) => a.distance - b.distance);

        const topMatch = matches[0];
        const runnerUps = matches.slice(1, 6);
        const ally = matches.find(c => c.name !== topMatch.name && Math.abs(c.E - topMatch.E) <= 2 && c.category !== topMatch.category) || matches[2];
        const rival = matches.filter(c => c.name !== topMatch.name && (Math.abs(c.E - topMatch.E) >= 3 || Math.abs(c.A - topMatch.A) >= 3))[0] || matches[matches.length - 5];

        // 2. Prepare LME Contribution Event
        // Normalize 1-10 scores to -1..1 (Marker) and 1..100 (Trait)
        // E (1..10) -> Extroversion
        // K (1..10) -> Creativity
        // B (1..10) -> Connection
        // A (1..10) -> Ambition (Structure?)

        const norm = (v: number) => (v - 1) / 9; // 0..1
        const weight = (v: number) => norm(v) * 2 - 1; // -1..1
        const percent = (v: number) => Math.round(norm(v) * 99 + 1); // 1..100

        const markers: Marker[] = [
            { id: 'marker.social.extroversion', weight: weight(finalScores.E) },
            { id: 'marker.creativity', weight: weight(finalScores.K) },
            { id: 'marker.love.connection', weight: weight(finalScores.B) },
            { id: 'marker.cognition.system', weight: weight(finalScores.A) * 0.5 }, // Ambition -> System? Weak link.
        ];

        const traits: TraitScore[] = [
            { id: 'trait.social.extroversion', score: percent(finalScores.E) },
            { id: 'trait.openness.creativity', score: percent(finalScores.K) },
            { id: 'trait.connection.bonding', score: percent(finalScores.B) },
            { id: 'trait.lifestyle.ambition', score: percent(finalScores.A) },
        ];

        const event: ContributionEvent = {
            specVersion: "sp.contribution.v1",
            eventId: crypto.randomUUID(),
            occurredAt: new Date().toISOString(),
            source: {
                vertical: "quiz",
                moduleId: "quiz.celebrity.v1",
                domain: window.location.hostname
            },
            payload: {
                markers,
                traits,
                summary: {
                    title: `Seelenverwandt mit ${topMatch.name}`,
                    bullets: [topMatch.tagline, ...topMatch.traits.slice(0, 2)],
                    resultId: topMatch.name
                },
                tags: [
                    { id: 'tag.celebrity.match', label: topMatch.name, kind: 'misc' } // Simple tag
                ]
            }
        };

        // 3. Ingest
        try {
            ingestContribution(event);
        } catch (e) {
            console.error("Ingestion failed", e);
        }

        setTimeout(() => {
            setResult({
                match: topMatch,
                runnerUps,
                ally,
                rival
            });
            setStage('result');
            setIsAnimating(false);
        }, 2000);
    };

    const generateDescription = (match: Celebrity) => {
        const parts = [];
        parts.push(match.E >= 7 ? "Du teilst ihre Fähigkeit, Räume zu füllen und Energie zu verbreiten" : match.E <= 4 ? "Wie du weiß auch " + match.name + ", dass wahre Stärke in der Stille liegt" : "Ihr teilt die Gabe, Energie dosiert und strategisch einzusetzen");
        parts.push(match.K >= 7 ? "Eure Köpfe arbeiten ähnlich – unkonventionell, überraschend, manchmal genial" : match.K <= 4 ? "Ihr beide schätzt das Bewährte und baut darauf auf" : "Kreativität ist für euch beide ein Werkzeug, kein Selbstzweck");
        parts.push(match.B >= 7 ? "Menschen sind für euch beide keine Ressourcen, sondern der eigentliche Punkt" : match.B <= 4 ? "Ihr braucht beide viel Freiraum und wählt eure Menschen sehr bewusst" : "Eure sozialen Batterien funktionieren ähnlich – selektiv, aber loyal");
        parts.push(match.A >= 7 ? "Ihr teilt den unbedingten Willen, Ergebnisse zu sehen" : match.A <= 4 ? "Für euch beide zählt der Weg mindestens so sehr wie das Ziel" : "Ambition ja, aber nicht um jeden Preis – das verbindet euch");
        return parts.join(". ") + ".";
    };

    if (stage === 'intro') {
        return (
            <div className="text-center p-8 text-white min-h-[600px] flex flex-col justify-center items-center bg-gradient-to-br from-[#0f0f23] via-[#1a1a2e] to-[#16213e]">
                <div className="text-6xl mb-4 animate-pulse">✨🌟✨</div>
                <h1 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400">
                    Welcher Star ist dein Seelenverwandter?
                </h1>
                <p className="text-gray-400 text-lg mb-8 max-w-md">
                    Entdecke, welcher von 100 Celebrities deine Energie teilt – basierend auf deiner Persönlichkeit, nicht deinem Geschmack.
                </p>
                <button
                    onClick={startQuiz}
                    className="px-8 py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 rounded-2xl text-lg font-bold shadow-lg shadow-pink-500/30 hover:scale-105 transition-transform"
                >
                    Seelenverwandten finden
                </button>
            </div>
        );
    }

    if (stage === 'loading') {
        return (
            <div className="text-center p-8 text-white min-h-[600px] flex flex-col justify-center items-center bg-[#1a1a2e]">
                <div className="text-6xl mb-6 animate-spin">🔮</div>
                <p className="text-xl text-gray-300">Scanne 100 Celebrity-Profile...</p>
                <p className="text-gray-500">Berechne deine Seelenverwandtschaft</p>
            </div>
        );
    }

    if (stage === 'quiz') {
        const q = questions[currentQ];
        const progress = ((currentQ + 1) / questions.length) * 100;

        return (
            <div className={`min-h-[600px] bg-[#1a1a2e] text-white p-6 transition-opacity duration-300 ${isAnimating ? 'opacity-50' : 'opacity-100'}`}>
                <div className="mb-8">
                    <div className="flex justify-between text-xs text-gray-500 mb-2">
                        <span>Frage {currentQ + 1} von {questions.length}</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-pink-500 to-blue-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                </div>

                <div className="max-w-md mx-auto">
                    <p className="text-purple-400 italic mb-4 text-sm">{q.scenario}</p>
                    <h2 className="text-2xl font-bold mb-8">{q.question}</h2>

                    <div className="space-y-3">
                        {q.options.map((opt, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleAnswer(opt.scores)}
                                className="w-full text-left p-4 bg-gray-800/50 hover:bg-purple-500/20 border border-gray-700 hover:border-purple-500 rounded-xl transition-all flex items-center gap-4 group"
                            >
                                <span className="text-2xl opacity-80 group-hover:scale-110 transition-transform">{opt.emoji}</span>
                                <span className="text-gray-200 group-hover:text-white">{opt.text}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (stage === 'result' && result) {
        return (
            <div className="bg-[#1a1a2e] text-white min-h-[600px] p-6 overflow-y-auto no-scrollbar">
                <div className="max-w-lg mx-auto bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 border border-purple-500/30 shadow-2xl relative overflow-hidden">
                    {/* Badge */}
                    <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl shadow-lg">
                        PROFILE UPDATED
                    </div>

                    <p className="text-purple-400 text-xs uppercase tracking-widest text-center mb-2">Dein Celebrity-Seelenverwandter</p>
                    <h1 className="text-4xl font-bold text-center mb-1 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
                        {result.match.name}
                    </h1>
                    <p className="text-gray-400 text-center italic mb-6">„{result.match.tagline}”</p>

                    <div className="flex justify-center mb-6">
                        <span className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-full font-bold border border-purple-500/30">
                            🔗 {result.match.matchPercent}% Seelenverwandtschaft
                        </span>
                    </div>

                    <p className="text-gray-300 text-sm leading-relaxed mb-6">
                        {generateDescription(result.match)}
                    </p>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {result.match.traits.map((t, i) => (
                            <div key={i} className="bg-gray-800/50 p-3 rounded-xl text-center">
                                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Trait</div>
                                <div className="text-sm font-semibold">{t}</div>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-gray-700/50 pt-6 mb-6">
                        <p className="text-xs text-center text-gray-500 uppercase tracking-widest mb-4">Eure Celebrity-Dynamik</p>
                        <div className="flex justify-between text-center">
                            <div className="flex-1">
                                <p className="text-xs text-gray-500 mb-1">Beste Combo mit</p>
                                <p className="text-green-400 font-medium">{result.ally.name}</p>
                            </div>
                            <div className="flex-1 border-l border-gray-700/50">
                                <p className="text-xs text-gray-500 mb-1">Spannung mit</p>
                                <p className="text-red-400 font-medium">{result.rival.name}</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            if (navigator.share) {
                                navigator.share({
                                    title: 'Mein Celebrity-Seelenverwandter',
                                    text: `Mein Celebrity-Seelenverwandter ist ${result.match.name} (${result.match.matchPercent}% Match)!`,
                                    url: window.location.href
                                })
                            }
                        }}
                        className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl font-bold shadow-lg shadow-purple-500/20 mb-3"
                    >
                        ✨ Ergebnis teilen
                    </button>
                    <button
                        onClick={() => window.location.href = '/'}
                        className="w-full py-3 bg-white/10 border border-white/10 hover:bg-white/20 rounded-xl text-white font-bold transition-colors mb-2"
                    >
                        Zum neuen Profile →
                    </button>
                    <button
                        onClick={() => setStage('intro')}
                        className="w-full py-2 text-gray-500 text-sm hover:text-gray-300 transition-colors"
                    >
                        Nochmal versuchen
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
