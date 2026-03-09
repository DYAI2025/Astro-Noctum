
import { QuizMeta, Question, ValidationProfile } from '@/components/quizzes/types';

export const quizMeta: QuizMeta = {
    id: "quiz.party_need.v1",
    title: "Dein Party-Bedürfnis 🎉",
    subtitle: "Wie viel Feier steckt wirklich in dir?",
    description: "6 ehrliche Szenarien zeigen dir, wo du auf dem Spektrum zwischen Couch und Club wirklich stehst.",
    slug: "party-beduerfnis"
};

export const questions: Question[] = [
    {
        id: "q1",
        text: "Freitagabend, 19:30 Uhr. Dein Handy vibriert: „Hey, wir sind spontan am Fluss – kommst du?\" Du hattest eigentlich Netflix eingeplant.",
        options: [
            {
                id: "q1_a",
                text: "„Bin schon im Pyjama – nächstes Mal!\" 🛋️",
                markers: [{ id: "marker.lifestyle.comfort", weight: 0.8 }, { id: "marker.social.introversion", weight: 0.5 }]
            },
            {
                id: "q1_b",
                text: "„Wer kommt noch? Und wie laut wird's?\" 🤔",
                markers: [{ id: "marker.lifestyle.planning", weight: 0.5 }, { id: "marker.social.introversion", weight: 0.2 }]
            },
            {
                id: "q1_c",
                text: "„Gib mir 10 Minuten!\" 🏃",
                markers: [{ id: "marker.lifestyle.spontaneity", weight: 0.6 }, { id: "marker.social.extroversion", weight: 0.4 }]
            },
            {
                id: "q1_d",
                text: "„Ich bring die Boxen mit!\" 🔊",
                markers: [{ id: "marker.lifestyle.adventure", weight: 0.8 }, { id: "marker.social.extroversion", weight: 0.8 }]
            }
        ]
    },
    {
        id: "q2",
        text: "Dein perfekter Samstag sieht so aus: Keine Verpflichtungen. 24 Stunden für dich.",
        options: [
            {
                id: "q2_a",
                text: "Buch, Tee, vielleicht ein langer Spaziergang allein 🌿",
                markers: [{ id: "marker.social.introversion", weight: 0.7 }, { id: "marker.lifestyle.comfort", weight: 0.6 }]
            },
            {
                id: "q2_b",
                text: "Brunch mit 2-3 engen Freunden, dann chillen 🥐",
                markers: [{ id: "marker.social.introversion", weight: 0.3 }, { id: "marker.values.connection", weight: 0.5 }]
            },
            {
                id: "q2_c",
                text: "Tagsüber Flohmarkt, abends Hausparty 🎈",
                markers: [{ id: "marker.social.extroversion", weight: 0.5 }, { id: "marker.lifestyle.spontaneity", weight: 0.5 }]
            },
            {
                id: "q2_d",
                text: "Dayparty → Dinner → Club bis Sunrise 💫",
                markers: [{ id: "marker.social.extroversion", weight: 0.9 }, { id: "marker.lifestyle.adventure", weight: 0.9 }]
            }
        ]
    },
    {
        id: "q3",
        text: "Die Einladung landet in deinem Postfach: „Große Geburtstagsparty – 80 Leute, DJ, Open Bar.\"",
        options: [
            {
                id: "q3_a",
                text: "Innerliches „Uff\" – klingt anstrengend 😅",
                markers: [{ id: "marker.social.introversion", weight: 0.8 }, { id: "marker.eq.stress_sensitivity", weight: 0.6 }]
            },
            {
                id: "q3_b",
                text: "„Komm ich kurz vorbei, sage Happy Birthday\" ⏱️",
                markers: [{ id: "marker.lifestyle.planning", weight: 0.5 }, { id: "marker.values.connection", weight: 0.3 }]
            },
            {
                id: "q3_c",
                text: "„Ich freu mich – aber Fluchtplan hab ich\" 🚪",
                markers: [{ id: "marker.social.extroversion", weight: 0.3 }, { id: "marker.lifestyle.planning", weight: 0.7 }]
            },
            {
                id: "q3_d",
                text: "„JA! Wann? Wo? Was zieh ich an?!\" 🎉",
                markers: [{ id: "marker.social.extroversion", weight: 0.8 }, { id: "marker.lifestyle.spontaneity", weight: 0.7 }]
            }
        ]
    },
    {
        id: "q4",
        text: "Du kommst von einer 3-Stunden-Party nach Hause: Es ist 23 Uhr. Wie fühlst du dich?",
        options: [
            {
                id: "q4_a",
                text: "Leer. Brauch mindestens 2 Tage Social-Detox 😮‍💨",
                markers: [{ id: "marker.social.introversion", weight: 0.9 }]
            },
            {
                id: "q4_b",
                text: "Zufrieden, aber genug für heute ✓",
                markers: [{ id: "marker.social.introversion", weight: 0.4 }]
            },
            {
                id: "q4_c",
                text: "Energetisiert – war cool, aber jetzt Ruhe 😌",
                markers: [{ id: "marker.social.extroversion", weight: 0.4 }]
            },
            {
                id: "q4_d",
                text: "Hyped! Warte, wo geht's weiter hin? 🔥",
                markers: [{ id: "marker.social.extroversion", weight: 1.0 }, { id: "marker.lifestyle.adventure", weight: 0.8 }]
            }
        ]
    },
    {
        id: "q5",
        text: "Die Lautstärke-Frage: Deine ideale Abend-Atmosphäre klingt wie...",
        options: [
            {
                id: "q5_a",
                text: "Stille oder sanfter Regen auf dem Fensterbrett 🌧️",
                markers: [{ id: "marker.lifestyle.comfort", weight: 0.8 }, { id: "marker.eq.stress_sensitivity", weight: 0.4 }]
            },
            {
                id: "q5_b",
                text: "Gespräche über gedämpfter Hintergrundmusik 🎵",
                markers: [{ id: "marker.values.connection", weight: 0.6 }, { id: "marker.lifestyle.comfort", weight: 0.3 }]
            },
            {
                id: "q5_c",
                text: "Lebhafter Mix – Gelächter, Musik, Gläserklirren 🥂",
                markers: [{ id: "marker.social.extroversion", weight: 0.5 }]
            },
            {
                id: "q5_d",
                text: "Bass, der den Brustkorb vibrieren lässt 🎧",
                markers: [{ id: "marker.lifestyle.adventure", weight: 0.8 }, { id: "marker.social.extroversion", weight: 0.7 }]
            }
        ]
    },
    {
        id: "q6",
        text: "Die Wahrheits-Check-Frage: Wenn du ehrlich bist – spontane Einladungen machen dich...",
        options: [
            {
                id: "q6_a",
                text: "...eher gestresst als begeistert 😬",
                markers: [{ id: "marker.lifestyle.planning", weight: 0.7 }, { id: "marker.lifestyle.spontaneity", "weight": 0.1 }] // Low spontaneity via marker weight? Or use bipolar opposite? Re-using high planning.
            },
            {
                id: "q6_b",
                text: "...kommt drauf an wer fragt und was geplant ist 🧐",
                markers: [{ id: "marker.lifestyle.planning", weight: 0.4 }, { id: "marker.values.security", weight: 0.4 }]
            },
            {
                id: "q6_c",
                text: "...oft glücklicher als genervt 😊",
                markers: [{ id: "marker.lifestyle.spontaneity", weight: 0.5 }]
            },
            {
                id: "q6_d",
                text: "...immer ein kleiner Dopamin-Kick! 🚀",
                markers: [{ id: "marker.lifestyle.spontaneity", weight: 0.9 }, { id: "marker.lifestyle.adventure", weight: 0.6 }]
            }
        ]
    }
];

export const profiles: ValidationProfile[] = [
    {
        id: "cozy_guardian",
        title: "Der Cozy-Hüter",
        tagline: "Dein Zuhause ist dein Königreich – und das ist ein Statement.",
        description: "Du hast verstanden, was viele erst mit 40 kapieren: Das beste Party-Outfit ist ein guter Pyjama. Während andere FOMO spüren, kennst du die Magie eines Abends ohne Zeitdruck, ohne Smalltalk, ohne das Gefühl, irgendwo sein zu *müssen*. Deine Energie ist ein seltenes Gut – und du investierst sie klug.",
        stats: [
            { label: "Social Battery", value: "Eco-Modus", width: "25%" },
            { label: "FOMO-Resistenz", value: "90%", width: "90%" },
            { label: "Netflix-Loyalität", value: "Platinum", width: "95%" },
            { label: "Pyjama-Zeit", value: "18:47 Uhr", width: "80%" }
        ],
        markers: [
            { id: "marker.lifestyle.comfort", weight: 0.8 },
            { id: "marker.social.introversion", weight: 0.7 },
            { id: "marker.values.security", weight: 0.6 }
        ]
    },
    {
        id: "salon_connaisseur",
        title: "Der Salon-Connaisseur",
        tagline: "Du feierst schon – nur anders als die meisten.",
        description: "Du suchst Intensität, aber in der richtigen Dosierung. Eine Flasche Wein, drei Freunde und ein Gespräch bis 3 Uhr nachts – DAS ist dein Konzert. Großveranstaltungen fühlen sich für dich wie verdünnter Espresso an: Zu viel Volumen, zu wenig Substanz. Du bauchst Tiefe, nicht Breite.",
        stats: [
            { label: "Gesprächstiefe", value: "Deep", width: "95%" },
            { label: "Crowd-Toleranz", value: "<10", width: "30%" },
            { label: "Gastgeber-Skill", value: "Legendär", width: "90%" },
            { label: "Wein-Ratio", value: "Perfekt", width: "85%" }
        ],
        markers: [
            { id: "marker.values.connection", weight: 0.8 },
            { id: "marker.eq.empathy", weight: 0.6 },
            { id: "marker.skills.intellect", weight: 0.5 }
        ]
    },
    {
        id: "planner",
        title: "Der Planer",
        tagline: "Du liebst Events – wenn du sie kommen siehst.",
        description: "Du bist kein Partymuffel – du bist ein Event-Stratege. Du liebst soziale Erlebnisse, aber zu deinen Bedingungen: geplant, kalkulierbar, mit klarem Anfang und Ende. Spontaneinladungen lösen bei dir keinen Dopamin-Kick aus, sondern einen Kalendercheck-Reflex.",
        stats: [
            { label: "Zuverlässigkeit", value: "99.7%", width: "99%" },
            { label: "Spontantoleranz", value: "Niedrig", width: "35%" },
            { label: "Exit-Strategie", value: "Parat", width: "90%" },
            { label: "Kalender-Check", value: "0.3s", width: "95%" }
        ],
        markers: [
            { id: "marker.lifestyle.planning", weight: 0.8 },
            { id: "marker.values.security", weight: 0.6 },
            { id: "marker.social.openness", weight: 0.5 }
        ]
    },
    {
        id: "night_surfer",
        title: "Der Nacht-Surfer",
        tagline: "Die Nacht ist dein Spielfeld – und du spielst bis der Referee pfeift.",
        description: "Während andere Batterien aufladen, lädst du dich an Menschen auf. Jede Einladung ist eine Chance, jede Party ein potenzielles Abenteuer. Du verstehst nicht, wie Leute JOMO haben können – für dich ist ein Abend zuhause verpasstes Leben. Du sammelst Erlebnisse wie andere Bücher.",
        stats: [
            { label: "Social Battery", value: "Solar", width: "100%" },
            { label: "FOMO-Level", value: "Chronisch", width: "95%" },
            { label: "Ja-Sager", value: "100%", width: "100%" },
            { label: "After-Hour", value: "PhD", width: "90%" }
        ],
        markers: [
            { id: "marker.social.extroversion", weight: 0.9 },
            { id: "marker.lifestyle.adventure", weight: 0.8 },
            { id: "marker.lifestyle.spontaneity", weight: 0.8 }
        ]
    }
];
