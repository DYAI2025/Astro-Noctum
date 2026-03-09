// ═══════════════════════════════════════════════════════════════
// TYPES (inlined from QuizzMe types.ts)
// ═══════════════════════════════════════════════════════════════

interface Marker {
  id: string;
  weight: number;
}

interface QuestionOption {
  id: string;
  text: string;
  scores?: Record<string, number>;
  markers?: Marker[];
}

interface Question {
  id: string;
  text: string;
  scenario?: string;
  context?: string;
  options: QuestionOption[];
}

interface ProfileStat {
  label: string;
  value: string | number;
  width?: string;
}

interface ValidationProfile {
  id: string;
  title: string;
  tagline: string;
  description: string;
  stats: ProfileStat[];
  markers?: Marker[];
  share_text?: string;
  emoji?: string;
  color?: string;
  matchCondition?: unknown;
  compatibility?: {
    allies?: string[];
    nemesis?: string | string[];
  };
}

// ═══════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════

export const quizMeta = {
    id: "quiz.party_need.v1",
    title: "Dein Party-Bed\u00fcrfnis",
    subtitle: "Wie viel Feier steckt wirklich in dir?",
    description: "6 ehrliche Szenarien zeigen dir, wo du auf dem Spektrum zwischen Couch und Club wirklich stehst.",
    slug: "party-beduerfnis"
};

export const questions: Question[] = [
    {
        id: "q1",
        text: "Freitagabend, 19:30 Uhr. Dein Handy vibriert: \u201eHey, wir sind spontan am Fluss \u2013 kommst du?\u201c Du hattest eigentlich Netflix eingeplant.",
        options: [
            {
                id: "q1_a",
                text: "\u201eBin schon im Pyjama \u2013 n\u00e4chstes Mal!\u201c \ud83d\udecb\ufe0f",
                markers: [{ id: "marker.lifestyle.comfort", weight: 0.8 }, { id: "marker.social.introversion", weight: 0.5 }]
            },
            {
                id: "q1_b",
                text: "\u201eWer kommt noch? Und wie laut wird\u2019s?\u201c \ud83e\udd14",
                markers: [{ id: "marker.lifestyle.planning", weight: 0.5 }, { id: "marker.social.introversion", weight: 0.2 }]
            },
            {
                id: "q1_c",
                text: "\u201eGib mir 10 Minuten!\u201c \ud83c\udfc3",
                markers: [{ id: "marker.lifestyle.spontaneity", weight: 0.6 }, { id: "marker.social.extroversion", weight: 0.4 }]
            },
            {
                id: "q1_d",
                text: "\u201eIch bring die Boxen mit!\u201c \ud83d\udd0a",
                markers: [{ id: "marker.lifestyle.adventure", weight: 0.8 }, { id: "marker.social.extroversion", weight: 0.8 }]
            }
        ]
    },
    {
        id: "q2",
        text: "Dein perfekter Samstag sieht so aus: Keine Verpflichtungen. 24 Stunden f\u00fcr dich.",
        options: [
            {
                id: "q2_a",
                text: "Buch, Tee, vielleicht ein langer Spaziergang allein \ud83c\udf3f",
                markers: [{ id: "marker.social.introversion", weight: 0.7 }, { id: "marker.lifestyle.comfort", weight: 0.6 }]
            },
            {
                id: "q2_b",
                text: "Brunch mit 2-3 engen Freunden, dann chillen \ud83e\udd50",
                markers: [{ id: "marker.social.introversion", weight: 0.3 }, { id: "marker.values.connection", weight: 0.5 }]
            },
            {
                id: "q2_c",
                text: "Tags\u00fcber Flohmarkt, abends Hausparty \ud83c\udf88",
                markers: [{ id: "marker.social.extroversion", weight: 0.5 }, { id: "marker.lifestyle.spontaneity", weight: 0.5 }]
            },
            {
                id: "q2_d",
                text: "Dayparty \u2192 Dinner \u2192 Club bis Sunrise \ud83d\udcab",
                markers: [{ id: "marker.social.extroversion", weight: 0.9 }, { id: "marker.lifestyle.adventure", weight: 0.9 }]
            }
        ]
    },
    {
        id: "q3",
        text: "Die Einladung landet in deinem Postfach: \u201eGro\u00dfe Geburtstagsparty \u2013 80 Leute, DJ, Open Bar.\u201c",
        options: [
            {
                id: "q3_a",
                text: "Innerliches \u201eUff\u201c \u2013 klingt anstrengend \ud83d\ude05",
                markers: [{ id: "marker.social.introversion", weight: 0.8 }, { id: "marker.eq.stress_sensitivity", weight: 0.6 }]
            },
            {
                id: "q3_b",
                text: "\u201eKomm ich kurz vorbei, sage Happy Birthday\u201c \u23f1\ufe0f",
                markers: [{ id: "marker.lifestyle.planning", weight: 0.5 }, { id: "marker.values.connection", weight: 0.3 }]
            },
            {
                id: "q3_c",
                text: "\u201eIch freu mich \u2013 aber Fluchtplan hab ich\u201c \ud83d\udeaa",
                markers: [{ id: "marker.social.extroversion", weight: 0.3 }, { id: "marker.lifestyle.planning", weight: 0.7 }]
            },
            {
                id: "q3_d",
                text: "\u201eJA! Wann? Wo? Was zieh ich an?!\u201c \ud83c\udf89",
                markers: [{ id: "marker.social.extroversion", weight: 0.8 }, { id: "marker.lifestyle.spontaneity", weight: 0.7 }]
            }
        ]
    },
    {
        id: "q4",
        text: "Du kommst von einer 3-Stunden-Party nach Hause: Es ist 23 Uhr. Wie f\u00fchlst du dich?",
        options: [
            {
                id: "q4_a",
                text: "Leer. Brauch mindestens 2 Tage Social-Detox \ud83d\ude2e\u200d\ud83d\udca8",
                markers: [{ id: "marker.social.introversion", weight: 0.9 }]
            },
            {
                id: "q4_b",
                text: "Zufrieden, aber genug f\u00fcr heute \u2713",
                markers: [{ id: "marker.social.introversion", weight: 0.4 }]
            },
            {
                id: "q4_c",
                text: "Energetisiert \u2013 war cool, aber jetzt Ruhe \ud83d\ude0c",
                markers: [{ id: "marker.social.extroversion", weight: 0.4 }]
            },
            {
                id: "q4_d",
                text: "Hyped! Warte, wo geht\u2019s weiter hin? \ud83d\udd25",
                markers: [{ id: "marker.social.extroversion", weight: 1.0 }, { id: "marker.lifestyle.adventure", weight: 0.8 }]
            }
        ]
    },
    {
        id: "q5",
        text: "Die Lautst\u00e4rke-Frage: Deine ideale Abend-Atmosph\u00e4re klingt wie...",
        options: [
            {
                id: "q5_a",
                text: "Stille oder sanfter Regen auf dem Fensterbrett \ud83c\udf27\ufe0f",
                markers: [{ id: "marker.lifestyle.comfort", weight: 0.8 }, { id: "marker.eq.stress_sensitivity", weight: 0.4 }]
            },
            {
                id: "q5_b",
                text: "Gespr\u00e4che \u00fcber ged\u00e4mpfter Hintergrundmusik \ud83c\udfb5",
                markers: [{ id: "marker.values.connection", weight: 0.6 }, { id: "marker.lifestyle.comfort", weight: 0.3 }]
            },
            {
                id: "q5_c",
                text: "Lebhafter Mix \u2013 Gel\u00e4chter, Musik, Gl\u00e4serklirren \ud83e\udd42",
                markers: [{ id: "marker.social.extroversion", weight: 0.5 }]
            },
            {
                id: "q5_d",
                text: "Bass, der den Brustkorb vibrieren l\u00e4sst \ud83c\udfa7",
                markers: [{ id: "marker.lifestyle.adventure", weight: 0.8 }, { id: "marker.social.extroversion", weight: 0.7 }]
            }
        ]
    },
    {
        id: "q6",
        text: "Die Wahrheits-Check-Frage: Wenn du ehrlich bist \u2013 spontane Einladungen machen dich...",
        options: [
            {
                id: "q6_a",
                text: "...eher gestresst als begeistert \ud83d\ude2c",
                markers: [{ id: "marker.lifestyle.planning", weight: 0.7 }, { id: "marker.lifestyle.spontaneity", weight: 0.1 }]
            },
            {
                id: "q6_b",
                text: "...kommt drauf an wer fragt und was geplant ist \ud83e\uddd0",
                markers: [{ id: "marker.lifestyle.planning", weight: 0.4 }, { id: "marker.values.security", weight: 0.4 }]
            },
            {
                id: "q6_c",
                text: "...oft gl\u00fccklicher als genervt \ud83d\ude0a",
                markers: [{ id: "marker.lifestyle.spontaneity", weight: 0.5 }]
            },
            {
                id: "q6_d",
                text: "...immer ein kleiner Dopamin-Kick! \ud83d\ude80",
                markers: [{ id: "marker.lifestyle.spontaneity", weight: 0.9 }, { id: "marker.lifestyle.adventure", weight: 0.6 }]
            }
        ]
    }
];

export const profiles: ValidationProfile[] = [
    {
        id: "cozy_guardian",
        title: "Der Cozy-H\u00fcter",
        tagline: "Dein Zuhause ist dein K\u00f6nigreich \u2013 und das ist ein Statement.",
        description: "Du hast verstanden, was viele erst mit 40 kapieren: Das beste Party-Outfit ist ein guter Pyjama. W\u00e4hrend andere FOMO sp\u00fcren, kennst du die Magie eines Abends ohne Zeitdruck, ohne Smalltalk, ohne das Gef\u00fchl, irgendwo sein zu *m\u00fcssen*. Deine Energie ist ein seltenes Gut \u2013 und du investierst sie klug.",
        stats: [
            { label: "Social Battery", value: "Eco-Modus", width: "25%" },
            { label: "FOMO-Resistenz", value: "90%", width: "90%" },
            { label: "Netflix-Loyalit\u00e4t", value: "Platinum", width: "95%" },
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
        tagline: "Du feierst schon \u2013 nur anders als die meisten.",
        description: "Du suchst Intensit\u00e4t, aber in der richtigen Dosierung. Eine Flasche Wein, drei Freunde und ein Gespr\u00e4ch bis 3 Uhr nachts \u2013 DAS ist dein Konzert. Gro\u00dfveranstaltungen f\u00fchlen sich f\u00fcr dich wie verd\u00fcnnter Espresso an: Zu viel Volumen, zu wenig Substanz. Du bauchst Tiefe, nicht Breite.",
        stats: [
            { label: "Gespr\u00e4chstiefe", value: "Deep", width: "95%" },
            { label: "Crowd-Toleranz", value: "<10", width: "30%" },
            { label: "Gastgeber-Skill", value: "Legend\u00e4r", width: "90%" },
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
        tagline: "Du liebst Events \u2013 wenn du sie kommen siehst.",
        description: "Du bist kein Partymuffel \u2013 du bist ein Event-Stratege. Du liebst soziale Erlebnisse, aber zu deinen Bedingungen: geplant, kalkulierbar, mit klarem Anfang und Ende. Spontaneinladungen l\u00f6sen bei dir keinen Dopamin-Kick aus, sondern einen Kalendercheck-Reflex.",
        stats: [
            { label: "Zuverl\u00e4ssigkeit", value: "99.7%", width: "99%" },
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
        tagline: "Die Nacht ist dein Spielfeld \u2013 und du spielst bis der Referee pfeift.",
        description: "W\u00e4hrend andere Batterien aufladen, l\u00e4dst du dich an Menschen auf. Jede Einladung ist eine Chance, jede Party ein potenzielles Abenteuer. Du verstehst nicht, wie Leute JOMO haben k\u00f6nnen \u2013 f\u00fcr dich ist ein Abend zuhause verpasstes Leben. Du sammelst Erlebnisse wie andere B\u00fccher.",
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
