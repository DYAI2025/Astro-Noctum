
'use client'

import React, { useState } from 'react';
// import { aggregateMarkers } from '../../lib/lme/marker-aggregator';
// import { updatePsycheState } from '../../lib/lme/lme-core';
// import { getPsycheState, savePsycheState } from '../../lib/lme/storage';

const DestinyQuiz = () => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [scores, setScores] = useState({
        vision: 0,
        resilience: 0,
        magnetism: 0,
        innerCall: 0
    });
    const [showResult, setShowResult] = useState(false);
    const [fadeIn, setFadeIn] = useState(true);
    const [started, setStarted] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [collectedMarkers, setCollectedMarkers] = useState<any[]>([]);

    const questions = [
        {
            id: 1,
            text: "Wenn du nachts wach liegst, woran denkst du?",
            options: [
                { text: "An Systeme, die ich verändern will – Bildung, Wirtschaft, Gesellschaft", scores: { vision: 3, innerCall: 2 }, psyche_markers: { structure: 0.8, emergence: 0.8 } },
                { text: "An Menschen, die ich erreichen möchte – konkrete Gesichter, konkrete Wirkung", scores: { magnetism: 3, vision: 1 }, psyche_markers: { connection: 0.9, shadow: 0.6 } },
                { text: "An den nächsten konkreten Schritt, der alles verändern könnte", scores: { resilience: 2, vision: 1 }, psyche_markers: { structure: 0.9, emergence: 0.5 } },
                { text: "An ein Gefühl, das ich nicht benennen kann – aber es zieht", scores: { innerCall: 3, vision: 1 }, psyche_markers: { depth: 1.0, shadow: 0.7 } },
            ]
        },
        // ... (truncated questions for brevity in memory but actual file should have all. 
        // Note: I am rewriting carefully. I will include ALL questions from previous view to safeguard.)
        {
            id: 2,
            text: "Du stößt auf massiven Widerstand gegen deine Idee. Was passiert in dir?",
            options: [
                { text: "Brennstoff. Je mehr Widerstand, desto klarer weiß ich, dass es richtig ist.", scores: { resilience: 3, innerCall: 2 } },
                { text: "Ich analysiere: Ist der Widerstand ein Signal oder nur Rauschen?", scores: { vision: 2, resilience: 1 } },
                { text: "Ich suche einen anderen Weg zum selben Ziel. Wasser findet immer einen Weg.", scores: { resilience: 2, magnetism: 1 } },
                { text: "Ich ziehe mich zurück, aber das Feuer bleibt. Es wartet.", scores: { innerCall: 2, resilience: 1 } }
            ]
        },
        {
            id: 3,
            text: "Menschen in deinem Umfeld würden sagen, du bist...",
            options: [
                { text: "...jemand, dem man folgen will, ohne genau zu wissen warum", scores: { magnetism: 3, innerCall: 1 } },
                { text: "...jemand, der Dinge sieht, die anderen erst später klar werden", scores: { vision: 3, innerCall: 1 } },
                { text: "...unzerstörbar – du machst einfach weiter, egal was kommt", scores: { resilience: 3 } },
                { text: "...anders – auf eine Art, die sie nicht ganz greifen können", scores: { innerCall: 2, magnetism: 1 } }
            ]
        },
        {
            id: 4,
            text: "Was ist dein Verhältnis zu \"Erfolg\", wie ihn die Gesellschaft definiert?",
            options: [
                { text: "Ein Mittel zum Zweck. Geld und Status sind Hebel, keine Ziele.", scores: { vision: 2, resilience: 2 } },
                { text: "Irrelevant. Ich jage etwas, das sich nicht in Zahlen messen lässt.", scores: { innerCall: 3, vision: 1 } },
                { text: "Wichtig als Beweis – nicht für mich, sondern um gehört zu werden.", scores: { magnetism: 2, resilience: 1 } },
                { text: "Ich habe ihn erreicht und gemerkt: Das war es noch nicht.", scores: { innerCall: 2, vision: 2 } }
            ]
        },
        {
            id: 5,
            text: "Wann fühlst du dich am lebendigsten?",
            options: [
                { text: "Wenn ich etwas erschaffe, das noch nie existiert hat", scores: { vision: 3, innerCall: 1 } },
                { text: "Wenn ich einen Raum betrete und spüre, wie sich die Energie verändert", scores: { magnetism: 3 } },
                { text: "Wenn ich durch etwas durchgebrochen bin, das unmöglich schien", scores: { resilience: 3 } },
                { text: "In seltenen Momenten absoluter Klarheit, die ich nicht erzwingen kann", scores: { innerCall: 3 } }
            ]
        },
        {
            id: 6,
            text: "Deine größte Angst ist...",
            options: [
                { text: "...dass ich sterbe, ohne mein volles Potenzial ausgeschöpft zu haben", scores: { innerCall: 3, vision: 1 } },
                { text: "...dass die Welt so bleibt, wie sie ist, weil niemand sie ändert", scores: { vision: 3, resilience: 1 } },
                { text: "...Bedeutungslosigkeit. Nicht erinnert zu werden.", scores: { magnetism: 2, innerCall: 1 } },
                { text: "...dass ich aufgebe, kurz bevor der Durchbruch kommt", scores: { resilience: 3 } }
            ]
        },
        {
            id: 7,
            text: "Wie gehst du mit dem Gefühl um, \"anders\" zu sein?",
            options: [
                { text: "Ich habe aufgehört, es zu verstecken. Es ist mein Kompass.", scores: { innerCall: 3, magnetism: 1 } },
                { text: "Ich nutze es strategisch – zur richtigen Zeit, am richtigen Ort", scores: { vision: 2, magnetism: 2 } },
                { text: "Es war schmerzhaft. Jetzt ist es meine Superkraft.", scores: { resilience: 2, innerCall: 2 } },
                { text: "Ich ziehe Menschen an, die auch anders sind. Wir erkennen uns.", scores: { magnetism: 3 } }
            ]
        },
        {
            id: 8,
            text: "Was würdest du opfern, um deine tiefste Vision zu verwirklichen?",
            options: [
                { text: "Bequemlichkeit, Status, Verständnis anderer – alles außer meiner Integrität", scores: { innerCall: 3, resilience: 2 } },
                { text: "Zeit. Ich investiere Jahre in etwas, dessen Früchte ich vielleicht nie sehe.", scores: { vision: 3, resilience: 1 } },
                { text: "Beziehungen, die mich zurückhalten. Nicht aus Kälte, aus Notwendigkeit.", scores: { resilience: 2, magnetism: 1 } },
                { text: "Nichts. Ich glaube, dass wahre Größe ohne Opfer möglich ist.", scores: { vision: 1, magnetism: 2 } }
            ]
        },
        {
            id: 9,
            text: "Stell dir vor, du könntest in 100 Jahren sehen, was von dir bleibt. Was hoffst du zu finden?",
            options: [
                { text: "Ein System, eine Institution, eine Bewegung, die weiterwirkt", scores: { vision: 3, resilience: 1 } },
                { text: "Menschen, die sagen: 'Sie hat mein Leben verändert'", scores: { magnetism: 3, innerCall: 1 } },
                { text: "Ideen, die so tief eingesickert sind, dass niemand mehr weiß, woher sie kamen", scores: { vision: 2, innerCall: 2 } },
                { text: "Beweise, dass ich den Ruf beantwortet habe – egal wie es aussah", scores: { innerCall: 3 } }
            ]
        },
        {
            id: 10,
            text: "Wenn ein Orakel dir sagen würde: 'Du bist zu Höherem bestimmt' – was wäre deine erste Reaktion?",
            options: [
                { text: "Ich weiß. Die Frage war nie ob, sondern wann und wie.", scores: { innerCall: 3, vision: 1 } },
                { text: "Zeig mir den Weg. Ich bin bereit für Anweisungen.", scores: { resilience: 2, magnetism: 1 } },
                { text: "Das erklärt einiges. Aber was genau ist meine Aufgabe?", scores: { vision: 2, innerCall: 1 } },
                { text: "Ich würde es erst glauben, wenn ich Ergebnisse sehe.", scores: { resilience: 2, vision: 1 } }
            ]
        }
    ];

    const profiles = {
        auserwaehlte: {
            id: "auserwaehlte",
            name: "Der Auserwählte",
            subtitle: "Du bist nicht hier, um das Spiel zu spielen. Du bist hier, um die Regeln zu schreiben.",
            description: "In dir brennt etwas, das sich nicht erklären lässt – ein unbeirrbares Wissen, dass dein Leben für etwas Größeres bestimmt ist. Du siehst weiter als andere, hältst länger durch als andere, und Menschen spüren in deiner Gegenwart, dass du anders bist. Nicht besser. Anders. Als wärst du für eine Aufgabe geboren, die noch niemand definiert hat.",
            traits: ["Visionäre Klarheit", "Unbrechbare Resilienz", "Magnetische Präsenz", "Innere Gewissheit"],
            challenge: "Deine größte Herausforderung: Geduld. Du siehst das Ende, bevor andere den Anfang verstehen. Lerne, Menschen mitzunehmen, statt ihnen davonzurennen.",
            color: "from-amber-500 to-orange-600",
            affirmation: "Ich bin bereit, den Weg zu gehen, der sich erst beim Gehen zeigt."
        },
        architekt: {
            id: "architekt",
            name: "Der stille Architekt",
            subtitle: "Du baust Kathedralen, deren Vollendung du nie sehen wirst – und das ist okay.",
            description: "Deine Größe liegt nicht in Applaus, sondern in Wirkung. Du denkst in Jahrzehnten, während andere in Quartalen planen. Du legst Fundamente, pflanzt Samen, konstruierst Systeme – nicht für Ruhm, sondern weil du verstehst, dass wahre Veränderung Zeit braucht. Dein Name wird vielleicht nie in Neonlichtern stehen. Aber dein Werk wird Generationen überdauern.",
            traits: ["Strategische Weitsicht", "Tiefe statt Breite", "Systemisches Denken", "Stilles Durchhaltevermögen"],
            challenge: "Deine Versuchung ist Isolation. Die Einsamkeit des langen Weges. Such dir Verbündete, die deine Zeitskala verstehen.",
            color: "from-slate-600 to-zinc-800",
            affirmation: "Ich baue für die Ewigkeit, nicht für das Ego."
        },
        katalysator: {
            id: "katalysator",
            name: "Der Katalysator",
            subtitle: "Du veränderst nicht durch Tun, sondern durch Sein.",
            description: "Deine Superkraft ist nicht Vision oder Ausdauer – es ist Transformation durch Präsenz. Menschen verändern sich in deiner Nähe. Gespräche mit dir werden zu Wendepunkten. Du musst keine Bewegung gründen; du BIST eine Bewegung. Jeder Raum, den du betrittst, ist danach nicht mehr derselbe. Das ist keine Technik. Es ist, wer du bist.",
            traits: ["Transformative Präsenz", "Emotionale Intelligenz", "Natürliche Autorität", "Ansteckende Energie"],
            challenge: "Du kannst andere entzünden, aber wer entzündet dich? Finde Quellen, die dein eigenes Feuer nähren, sonst verbrennst du.",
            color: "from-rose-500 to-pink-600",
            affirmation: "Mein Licht wird nicht weniger, wenn ich es teile – es wird mehr."
        },
        seher: {
            id: "seher",
            name: "Der Seher",
            subtitle: "Du erkennst Wahrheiten, für die die Welt noch nicht bereit ist.",
            description: "Du lebst zeitversetzt. Was du heute siehst, verstehen andere in fünf Jahren. Das macht dich manchmal einsam, oft missverstanden, aber immer wertvoll. Dein Blick durchdringt Oberflächen, erkennt Muster, die sich erst formen. Du bist kein Prophet im mystischen Sinne – du bist einfach jemandem, der die Verbindungen sieht, bevor sie sichtbar werden.",
            traits: ["Mustererkennung", "Intuitive Klarheit", "Zeitlose Perspektive", "Unbeirrbare Wahrnehmung"],
            challenge: "Die Gefahr ist Passivität. Sehen ist nicht genug. Deine Vision muss durch deine Hände in die Welt kommen – sonst bleibt sie ein Traum.",
            color: "from-violet-600 to-purple-800",
            affirmation: "Ich vertraue dem Bild, das ich sehe, auch wenn andere noch schlafen."
        },
        diamant: {
            id: "diamant",
            name: "Der ungeschliffene Diamant",
            subtitle: "Das Rohmaterial für Größe ist da. Der Prozess hat begonnen.",
            description: "Du spürst es, oder? Dieses Ziehen. Dieses Wissen, dass da mehr ist. Du bist nicht am Anfang – du bist im Werden. Der Diamant ist bereits da, unter der Oberfläche. Was noch fehlt, ist nicht Potenzial, sondern Druck, Zeit und die richtigen Umstände. Dein Moment kommt nicht irgendwann. Er formt sich gerade. Mit jeder Entscheidung, die du triffst.",
            traits: ["Latentes Potenzial", "Wachsende Klarheit", "Unruhe mit Richtung", "Offenheit für Transformation"],
            challenge: "Dein Risiko ist Ungeduld. Du willst den Durchbruch jetzt. Aber Diamanten entstehen unter Druck und Zeit – nicht durch Wunschdenken. Bleib im Prozess.",
            color: "from-cyan-500 to-blue-600",
            affirmation: "Ich nehme den Druck an, denn er formt mich."
        },
    };

    const getProfile = () => {
        const { vision, resilience, magnetism, innerCall } = scores;
        if (innerCall >= 18 && vision >= 15 && resilience >= 12) return profiles.auserwaehlte;
        if (vision >= 18 && resilience >= 12 && magnetism < 12) return profiles.architekt;
        if (magnetism >= 16 && (innerCall >= 10 || resilience >= 10)) return profiles.katalysator;
        if (vision >= 16 && innerCall >= 14 && magnetism < 14) return profiles.seher;
        return profiles.diamant;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleAnswer = (option: any) => {
        setFadeIn(false);

        setTimeout(() => {
            const newScores = { ...scores };
            Object.entries(option.scores).forEach(([key, value]) => {
                // @ts-expect-error simple key access
                newScores[key] += value;
            });
            setScores(newScores);

            const newMarkers = [...collectedMarkers];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((option as any).psyche_markers) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                newMarkers.push((option as any).psyche_markers);
                setCollectedMarkers(newMarkers);
            }

            if (currentQuestion < questions.length - 1) {
                setCurrentQuestion(currentQuestion + 1);
            } else {
                const finalProfile = getProfile();

                import('../../lib/lme/ingestion').then(({ ingestContribution }) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const explicitMarkers: any[] = newMarkers || [];

                    const event = {
                        specVersion: "sp.contribution.v1" as const,
                        eventId: crypto.randomUUID(),
                        occurredAt: new Date().toISOString(),
                        source: {
                            vertical: "quiz" as const,
                            moduleId: "quiz.destiny.v1",
                            domain: window.location.hostname
                        },
                        payload: {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            markers: explicitMarkers.flatMap((m: any) =>
                                Object.entries(m).map(([k, v]) => ({ id: `marker.psyche.${k}`, weight: v as number }))
                            ),
                            traits: [
                                { id: `trait.destiny.${finalProfile.id}`, score: 100, confidence: 0.9 }
                            ],
                            tags: [{ id: 'tag.destiny.result', label: finalProfile.name, kind: 'misc' as const }],
                            summary: {
                                title: `Bestimmung: ${finalProfile.name}`,
                                bullets: [finalProfile.subtitle],
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

                setShowResult(true);
            }
            setFadeIn(true);
        }, 300);
    };

    const progress = ((currentQuestion + 1) / questions.length) * 100;
    const containerClass = "min-h-[600px] w-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center p-4 rounded-xl shadow-2xl overflow-hidden relative";

    if (!started) {
        return (
            <div className={containerClass}>
                <div className="max-w-2xl w-full text-center">
                    <div className="mb-8">
                        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-2xl shadow-amber-500/20">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                            Bist du zu Höherem bestimmt?
                        </h1>
                        <p className="text-zinc-400 text-lg md:text-xl leading-relaxed max-w-xl mx-auto">
                            10 Fragen. Keine richtigen Antworten. Nur die, die wahr sind.
                        </p>
                    </div>
                    <div className="bg-zinc-800/50 backdrop-blur border border-zinc-700/50 rounded-2xl p-6 mb-8 text-left">
                        <p className="text-zinc-300 text-sm leading-relaxed">
                            Dieser Test misst keine Intelligenz, keinen Erfolg, keine Fähigkeit.
                            Er misst etwas anderes: Die Art, wie du denkst, fühlst und durch die Welt gehst.
                            Manche Menschen sind für bestimmte Wege gemacht. Die Frage ist nicht, ob du &quot;gut genug&quot; bist.
                            Die Frage ist: <span className="text-amber-400 font-medium">Hörst du den Ruf?</span>
                        </p>
                    </div>
                    <button
                        onClick={() => setStarted(true)}
                        className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-xl 
                     hover:from-amber-400 hover:to-orange-500 transition-all duration-300 
                     shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30
                     transform hover:-translate-y-0.5"
                    >
                        Test starten
                    </button>
                    <p className="text-zinc-500 text-xs mt-6">
                        Zur Selbstreflexion. Keine Diagnose. Kein Urteil.
                    </p>
                </div>
            </div>
        );
    }

    if (showResult) {
        const profile = getProfile();

        return (
            <div className={containerClass}>
                <div className={`max-w-2xl w-full transition-all duration-500 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <div className="h-full overflow-y-auto max-h-[80vh] no-scrollbar">
                        <div className="text-center mb-8">
                            <p className="text-amber-400 text-sm font-medium tracking-widest uppercase mb-2">Dein Profil</p>
                            <h1 className={`text-4xl md:text-5xl font-bold bg-gradient-to-r ${profile.color} bg-clip-text text-transparent mb-3`}>
                                {profile.name}
                            </h1>
                            <p className="text-zinc-400 text-lg italic">
                                {profile.subtitle}
                            </p>
                        </div>
                        <div className="bg-zinc-800/50 backdrop-blur border border-zinc-700/50 rounded-2xl p-6 md:p-8 mb-6">
                            <p className="text-zinc-200 text-lg leading-relaxed mb-6">
                                {profile.description}
                            </p>
                            <div className="mb-6">
                                <h3 className="text-white font-semibold mb-3 text-sm tracking-wide uppercase">Deine Kernmerkmale</h3>
                                <div className="flex flex-wrap gap-2">
                                    {profile.traits.map((trait, i) => (
                                        <span
                                            key={i}
                                            className={`px-3 py-1.5 rounded-full text-sm bg-gradient-to-r ${profile.color} text-white font-medium`}
                                        >
                                            {trait}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="border-t border-zinc-700/50 pt-6">
                                <h3 className="text-amber-400 font-semibold mb-2 text-sm tracking-wide uppercase">Deine Herausforderung</h3>
                                <p className="text-zinc-300 leading-relaxed">
                                    {profile.challenge}
                                </p>
                                <p className="text-amber-200 italic font-medium leading-relaxed mt-2">
                                    &quot;{profile.affirmation}&quot;
                                </p>
                            </div>
                        </div>
                        <div className="bg-zinc-800/30 rounded-xl p-4 mb-6">
                            <h4 className="text-zinc-500 text-xs uppercase tracking-wide mb-3">Deine Dimensionen</h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-zinc-400">Vision</span>
                                    <span className="text-white font-mono">{scores.vision}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-400">Resilienz</span>
                                    <span className="text-white font-mono">{scores.resilience}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-400">Magnetismus</span>
                                    <span className="text-white font-mono">{scores.magnetism}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-400">Innerer Ruf</span>
                                    <span className="text-white font-mono">{scores.innerCall}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={() => {
                                    const text = `${profile.name} - ${profile.subtitle}`;
                                    if (navigator.share) {
                                        navigator.share({ title: 'Destiny Quiz', text });
                                    } else {
                                        navigator.clipboard.writeText(text).then(() => alert('Kopiert!'));
                                    }
                                }}
                                className={`flex-1 py-3 px-6 rounded-xl font-bold bg-gradient-to-r ${profile.color} shadow-lg hover:opacity-90 transition-opacity`}
                            >
                                Teilen
                            </button>
                            <button
                                onClick={() => {
                                    setStarted(false);
                                    setCurrentQuestion(0);
                                    setScores({ vision: 0, resilience: 0, magnetism: 0, innerCall: 0 });
                                    setCollectedMarkers([]);
                                    setShowResult(false);
                                }}
                                className="flex-1 py-3 px-6 rounded-xl font-bold bg-zinc-700 text-white shadow-lg hover:bg-zinc-600 transition-colors"
                            >
                                Test wiederholen
                            </button>
                        </div>
                        <p className="text-zinc-600 text-xs text-center mt-8">
                            Dieser Test dient der Selbstreflexion und Unterhaltung. Er ist keine psychologische Diagnose.
                            <br /><span className="text-amber-500/50">Dein dynamisches Profil wurde aktualisiert.</span>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const question = questions[currentQuestion];

    return (
        <div className={containerClass}>
            <div className="max-w-2xl w-full">
                <div className="mb-8">
                    <div className="flex justify-between text-xs text-zinc-500 mb-2">
                        <span>Frage {currentQuestion + 1} von {questions.length}</span>
                        <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-1 bg-zinc-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-amber-500 to-orange-600 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
                <div className={`transition-all duration-300 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                    <h2 className="text-2xl md:text-3xl font-semibold text-white mb-8 leading-relaxed">
                        {question.text}
                    </h2>
                    <div className="space-y-3">
                        {question.options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => handleAnswer(option)}
                                className="w-full text-left p-4 md:p-5 bg-zinc-800/50 hover:bg-zinc-700/50 
                         border border-zinc-700/50 hover:border-zinc-600 
                         rounded-xl transition-all duration-200
                         group"
                            >
                                <span className="text-zinc-300 group-hover:text-white transition-colors">
                                    {option.text}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DestinyQuiz;
