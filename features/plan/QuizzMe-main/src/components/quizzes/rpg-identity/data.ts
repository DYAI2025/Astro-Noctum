export const quizData = {
    meta: {
        id: "rpg-identity-2025",
        title: "Welche Rollenspiel-Seele trägst du in dir?",
        subtitle: "Entdecke deine verborgene Klasse – nicht wer du spielst, sondern wer du BIST",
        disclaimer: "Dieser Test dient der spielerischen Selbstreflexion und stellt KEINE psychologische Diagnose dar."
    },
    dimensions: [
        { id: "d1", name: "Kampfstil", pole_low: "Magie", pole_high: "Kraft" },
        { id: "d2", name: "Sozial", pole_low: "Solo", pole_high: "Gruppe" },
        { id: "d3", name: "Kompass", pole_low: "Chaos", pole_high: "Ordnung" }
    ],
    questions: [
        {
            id: "q1",
            narrative: "Du betrittst einen Dungeon. Am Eingang liegt ein verwundeter Fremder.",
            text: "Was ist dein erster Instinkt?",
            options: [
                { id: "q1_a", text: "Ich heile ihn – niemand sollte allein leiden", scores: { d1: 1, d2: 5, d3: 4 } },
                { id: "q1_b", text: "Ich frage, wer ihn angegriffen hat – Informationen zuerst", scores: { d1: 2, d2: 3, d3: 3 } },
                { id: "q1_c", text: "Ich nehme seine Ausrüstung – er braucht sie nicht mehr", scores: { d1: 4, d2: 1, d3: 1 } },
                { id: "q1_d", text: "Ich untersuche die Spuren – der Angreifer könnte noch hier sein", scores: { d1: 3, d2: 2, d3: 5 } }
            ]
        },
        {
            id: "q2",
            narrative: "Ein mächtiger Drache bietet dir einen Pakt an: Macht gegen einen Teil deiner Erinnerungen.",
            text: "Wie antwortest du?",
            options: [
                { id: "q2_a", text: "Ich nehme an – Macht formt die Zukunft, nicht die Vergangenheit", scores: { d1: 5, d2: 1, d3: 2 } },
                { id: "q2_b", text: "Ich lehne ab – meine Geschichte macht mich zu dem, was ich bin", scores: { d1: 2, d2: 3, d3: 4 } },
                { id: "q2_c", text: "Ich verhandle – welche Erinnerungen genau?", scores: { d1: 3, d2: 2, d3: 3 } },
                { id: "q2_d", text: "Ich frage, ob der Pakt auch für meine Gefährten gilt", scores: { d1: 2, d2: 5, d3: 3 } }
            ]
        },
        {
            id: "q3",
            narrative: "Deine Gruppe steht vor einer verschlossenen Tür mit drei Schlössern.",
            text: "Welches Schloss übernimmst du?",
            options: [
                { id: "q3_a", text: "Das Rätselschloss – Logik ist meine Waffe", scores: { d1: 1, d2: 2, d3: 5 } },
                { id: "q3_b", text: "Das Kraftschloss – ich breche es auf", scores: { d1: 5, d2: 2, d3: 2 } },
                { id: "q3_c", text: "Das magische Siegel – ich spüre seine Frequenz", scores: { d1: 1, d2: 1, d3: 3 } },
                { id: "q3_d", text: "Ich halte den anderen den Rücken frei, während sie arbeiten", scores: { d1: 4, d2: 5, d3: 4 } }
            ]
        },
        {
            id: "q4",
            narrative: "Ein Händler bietet dir eine von drei Reliquien an – alle gleich wertvoll.",
            text: "Welche wählst du?",
            options: [
                { id: "q4_a", text: "Die Klinge, die niemals stumpf wird", scores: { d1: 5, d2: 2, d3: 4 } },
                { id: "q4_b", text: "Das Amulett, das Gedanken flüstern lässt", scores: { d1: 1, d2: 4, d3: 2 } },
                { id: "q4_c", text: "Der Ring, der Schatten zur Tür macht", scores: { d1: 2, d2: 1, d3: 1 } },
                { id: "q4_d", text: "Die Laterne, die verborgene Pfade zeigt", scores: { d1: 2, d2: 3, d3: 5 } }
            ]
        },
        {
            id: "q5",
            narrative: "Dein engster Verbündeter wurde von einem Feind korrumpiert und greift dich an.",
            text: "Was tust du?",
            options: [
                { id: "q5_a", text: "Ich kämpfe – wenn es sein muss, töte ich, was ich liebe", scores: { d1: 5, d2: 1, d3: 2 } },
                { id: "q5_b", text: "Ich suche den Fluch zu brechen – es muss einen Weg geben", scores: { d1: 1, d2: 4, d3: 4 } },
                { id: "q5_c", text: "Ich fliehe und hole Verstärkung – allein schaffe ich das nicht", scores: { d1: 2, d2: 5, d3: 3 } },
                { id: "q5_d", text: "Ich lasse mich schlagen – vielleicht weckt es ihn auf", scores: { d1: 1, d2: 5, d3: 1 } }
            ]
        },
        {
            id: "q6",
            narrative: "Du findest ein verbotenes Buch, das dunkle Künste lehrt.",
            text: "Wie gehst du damit um?",
            options: [
                { id: "q6_a", text: "Ich verbrenne es – manche Wissen sollte verloren bleiben", scores: { d1: 4, d2: 3, d3: 5 } },
                { id: "q6_b", text: "Ich studiere es heimlich – Wissen ist neutral, nur die Anwendung zählt", scores: { d1: 1, d2: 1, d3: 1 } },
                { id: "q6_c", text: "Ich bringe es zu jemandem Weiseren als mir", scores: { d1: 2, d2: 4, d3: 4 } },
                { id: "q6_d", text: "Ich verstecke es – falls wir es eines Tages brauchen", scores: { d1: 3, d2: 2, d3: 2 } }
            ]
        },
        {
            id: "q7",
            narrative: "Eine Prophezeiung sagt, dass einer aus deiner Gruppe die Welt retten wird.",
            text: "Was denkst du?",
            options: [
                { id: "q7_a", text: "Ich hoffe, ich bin es – ich bin bereit für diese Last", scores: { d1: 4, d2: 1, d3: 3 } },
                { id: "q7_b", text: "Prophezeiungen sind Werkzeuge, keine Wahrheiten", scores: { d1: 2, d2: 2, d3: 1 } },
                { id: "q7_c", text: "Egal wer es ist – ich werde derjenige unterstützen", scores: { d1: 3, d2: 5, d3: 4 } },
                { id: "q7_d", text: "Ich analysiere die Prophezeiung auf versteckte Bedeutungen", scores: { d1: 1, d2: 2, d3: 5 } }
            ]
        },
        {
            id: "q8",
            narrative: "Nach einem Sieg hast du die Wahl, was mit dem besiegten Feind geschieht.",
            text: "Dein Urteil?",
            options: [
                { id: "q8_a", text: "Gnade – er hat seine Lektion gelernt", scores: { d1: 2, d2: 4, d3: 3 } },
                { id: "q8_b", text: "Gerechtigkeit – das Gesetz soll entscheiden", scores: { d1: 3, d2: 3, d3: 5 } },
                { id: "q8_c", text: "Ende – er wird wieder zuschlagen, wenn ich ihn lasse", scores: { d1: 5, d2: 1, d3: 4 } },
                { id: "q8_d", text: "Rekrutierung – seine Fähigkeiten könnten nützlich sein", scores: { d1: 2, d2: 4, d3: 1 } }
            ]
        },
        {
            id: "q9",
            narrative: "Du erhältst Zugang zu einem Ort der Ruhe zwischen den Schlachten.",
            text: "Wie verbringst du deine Zeit?",
            options: [
                { id: "q9_a", text: "Training – Stillstand ist Rückschritt", scores: { d1: 5, d2: 1, d3: 4 } },
                { id: "q9_b", text: "Meditation – ich höre auf die Stimmen jenseits des Schleiers", scores: { d1: 1, d2: 1, d3: 2 } },
                { id: "q9_c", text: "Feiern mit meinen Gefährten – das Leben ist kurz", scores: { d1: 3, d2: 5, d3: 2 } },
                { id: "q9_d", text: "Planung – ich kartographiere unseren nächsten Zug", scores: { d1: 2, d2: 3, d3: 5 } }
            ]
        },
        {
            id: "q10",
            narrative: "Ein Geist bietet dir einen Blick in deine Zukunft an.",
            text: "Nimmst du an?",
            options: [
                { id: "q10_a", text: "Ja – Wissen ist Vorbereitung", scores: { d1: 2, d2: 2, d3: 5 } },
                { id: "q10_b", text: "Nein – ich schmede mein eigenes Schicksal", scores: { d1: 4, d2: 1, d3: 2 } },
                { id: "q10_c", text: "Nur wenn meine Gefährten auch sehen dürfen", scores: { d1: 2, d2: 5, d3: 3 } },
                { id: "q10_d", text: "Ich frage den Geist nach seinen Motiven", scores: { d1: 1, d2: 2, d3: 4 } }
            ]
        },
        {
            id: "q11",
            narrative: "Du entdeckst, dass ein Mitglied deiner Gruppe ein Spion ist.",
            text: "Dein nächster Schritt?",
            options: [
                { id: "q11_a", text: "Konfrontation – Verrat verdient sofortige Antwort", scores: { d1: 5, d2: 2, d3: 4 } },
                { id: "q11_b", text: "Falsche Informationen füttern – ich nutze den Spion gegen seine Meister", scores: { d1: 2, d2: 1, d3: 1 } },
                { id: "q11_c", text: "Die Gruppe informieren – gemeinsam entscheiden wir", scores: { d1: 3, d2: 5, d3: 4 } },
                { id: "q11_d", text: "Verstehen, warum – vielleicht gibt es einen tieferen Grund", scores: { d1: 1, d2: 4, d3: 2 } }
            ]
        },
        {
            id: "q12",
            narrative: "Am Ende deiner Reise steht eine letzte Wahl: Macht, die die Welt verändert – oder Frieden, der sie heilt.",
            text: "Wofür hast du all das getan?",
            options: [
                { id: "q12_a", text: "Macht – nur wer Macht hat, kann schützen, was ihm lieb ist", scores: { d1: 5, d2: 1, d3: 3 } },
                { id: "q12_b", text: "Frieden – genug Blut ist geflossen", scores: { d1: 1, d2: 4, d3: 4 } },
                { id: "q12_c", text: "Weder noch – ich gehe meinen eigenen Weg", scores: { d1: 3, d2: 1, d3: 1 } },
                { id: "q12_d", text: "Für meine Gefährten – sie sollen entscheiden", scores: { d1: 2, d2: 5, d3: 3 } }
            ]
        }
    ],
    profiles: [
        {
            id: "paladin",
            title: "DER SCHWERTTRÄGER DES LICHTS",
            tagline: "Du trägst das Gewicht der Welt – und weißt, dass es deine Bestimmung ist.",
            description: `Es gibt Menschen, die sich vor der Verantwortung drücken. Du gehörst nicht zu ihnen. 

In bestimmten Momenten deines Lebens hast du gespürt, dass andere auf dich schauen – nicht weil du es gefordert hast, sondern weil etwas in dir eine Ruhe ausstrahlt, die in Krisen zum Anker wird.

Was manche als "zu ernst" oder "zu prinzipientreu" bezeichnen, ist in Wahrheit eine seltene Fähigkeit: Du siehst, was richtig ist, wenn andere nur sehen, was einfach ist. Das ist keine Sturheit – es ist moralische Klarheit.

Deine größte Stärke entfaltet sich, wenn du für andere kämpfst. Nicht aus Pflicht, sondern weil du verstanden hast, dass wahre Stärke sich daran misst, was man beschützt, nicht was man zerstört.

Du bist einer der wenigen, die wissen: Das Schwert ist nur so ehrenhaft wie die Hand, die es führt.`,
            stats: [
                { label: "Ehre", value: "95%" },
                { label: "Beschützerinstinkt", value: "∞" },
                { label: "Toleranz für Bullshit", value: "3%" },
                { label: "Innerer Kompass", value: "Unerschütterlich" }
            ],
            compatibility: {
                allies: ["heiler", "stratege"],
                nemesis: ["nekromant"]
            },
            share_text: "Ich bin der SCHWERTTRÄGER DES LICHTS. Ich kämpfe nicht für mich – ich kämpfe für euch. 🗡️✨"
        },
        {
            id: "nekromant",
            title: "DER WANDERER ZWISCHEN DEN SCHLEIERN",
            tagline: "Du siehst, was andere fürchten – und findest darin Wahrheit.",
            description: `Die Welt nennt dich vielleicht "düster" oder "zu intensiv". Sie verstehen nicht, dass du einfach tiefer schaust als sie.

Wo andere wegschauen, bleibst du. Nicht aus Morbidität, sondern aus dem Wissen, dass die unbequemen Wahrheiten oft die wichtigsten sind. Du hast früh gelernt, dass Schatten nicht der Feind sind – sie sind der Ort, an dem das Licht seine Grenzen zeigt.

Deine größte Gabe ist die Fähigkeit zur Transformation. Du nimmst, was andere wegwerfen – Ideen, Menschen, Teile von dir selbst – und findest darin verborgenen Wert. Das ist keine Dunkelheit. Das ist Alchemie.

Es gibt Zeiten, in denen du dich allein fühlst in deinem Verständnis. Aber du weißt: Die Einsamkeit des Sehenden ist der Preis für Klarheit.

Du bist einer der wenigen, die den Tod nicht fürchten – weil du verstanden hast, dass er nur eine weitere Schwelle ist.`,
            stats: [
                { label: "Tiefgang", value: "Abgrundartig" },
                { label: "Smalltalk-Fähigkeit", value: "12%" },
                { label: "Verbotenes Wissen", value: "Mehrere Regale" },
                { label: "Unheimliche Ruhe", value: "100%" }
            ],
            compatibility: {
                allies: ["seher", "berserker"],
                nemesis: ["paladin"]
            },
            share_text: "Ich bin der WANDERER ZWISCHEN DEN SCHLEIERN. Was ihr Dunkelheit nennt, nenne ich Tiefe. 💀🌙"
        },
        {
            id: "heiler",
            title: "DIE QUELLE DER STILLE",
            tagline: "Deine Stärke liegt nicht im Kämpfen – sondern im Wieder-Ganz-Machen.",
            description: `Du hast etwas, das in dieser Welt selten geworden ist: die Fähigkeit, wirklich zuzuhören.

Menschen kommen zu dir – manchmal ohne zu wissen, warum. Du bist der Mensch, dem Fremde im Zug ihre Geschichte erzählen, bei dem sich Gespräche plötzlich vertiefen, der spürt, wenn jemand mehr braucht als Worte.

Was andere als "zu empfindlich" abtun, ist in Wahrheit fein abgestimmte Intuition. Du nimmst Frequenzen wahr, die anderen entgehen. Das ist anstrengend – ja. Aber es ist auch deine Superkraft.

Deine größte Stärke entfaltet sich, wenn du anderen hilfst, ihre eigene Stärke zu finden. Du heilst nicht, indem du nimmst – du heilst, indem du gibst.

Du bist einer der wenigen, die verstehen: Manchmal ist Präsenz das mächtigste Geschenk.`,
            stats: [
                { label: "Empathie", value: "Gefährlich hoch" },
                { label: "Vergangene Traumata geheilt", value: "47+" },
                { label: "Eigene Bedürfnisse priorisiert", value: "Working on it" },
                { label: "Aura", value: "Beruhigend" }
            ],
            compatibility: {
                allies: ["paladin", "seher"],
                nemesis: ["berserker"]
            },
            share_text: "Ich bin DIE QUELLE DER STILLE. Meine Stärke ist leise – aber sie hält Welten zusammen. 🌿💫"
        },
        {
            id: "berserker",
            title: "DIE FLAMME, DIE NICHT ERLISCHT",
            tagline: "Du lebst laut, liebst laut, kämpfst laut – und entschuldigst dich für nichts davon.",
            description: `Die Welt hat dir oft gesagt, du seist "zu viel". Zu intensiv. Zu leidenschaftlich. Zu direkt.

Du hast aufgehört, dich dafür zu entschuldigen.

Deine Energie ist nicht das Problem – sie ist dein größtes Geschenk. Wo andere zögern, handelst du. Wo andere schweigen, sprichst du. Nicht aus Rücksichtslosigkeit, sondern aus dem tiefen Verständnis, dass das Leben zu kurz ist für halbe Sachen.

Es gibt Zeiten, in denen dich diese Intensität erschöpft. Aber du weißt: Lieber ausbrennen als verglimmen.

Deine größte Stärke entfaltet sich in Momenten, in denen andere aufgeben. Du findest Reserven, von denen sie nicht wussten, dass sie existieren.

Du bist einer der wenigen, die wirklich lebendig sind – nicht nur am Leben.`,
            stats: [
                { label: "Intensität", value: "MAXIMUM" },
                { label: "Geduld", value: "Was ist das?" },
                { label: "Bereute Entscheidungen", value: "0" },
                { label: "Energie", value: "Erneuerbar" }
            ],
            compatibility: {
                allies: ["nekromant", "stratege"],
                nemesis: ["heiler"]
            },
            share_text: "Ich bin DIE FLAMME, DIE NICHT ERLISCHT. Zu viel? Nein – die Welt ist zu wenig. 🔥⚔️"
        },
        {
            id: "stratege",
            title: "DER ARCHITEKT DER MÖGLICHKEITEN",
            tagline: "Du siehst Schachzüge, wo andere nur Chaos sehen.",
            description: `Dein Geist ist ein Labyrinth – aber eines, das du selbst gebaut hast.

Andere nennen es "Overthinking". Du weißt, dass es Vorbereitung ist. Du siehst Verbindungen zwischen Dingen, die andere getrennt betrachten. Du spielst Szenarien durch, bevor sie passieren. Nicht aus Angst – aus strategischer Klarheit.

Was manche als "zu kalkuliert" empfinden, ist in Wahrheit das Gegenteil von Kälte: Du denkst voraus, WEIL du dich sorgst. Du planst, weil du die Menschen um dich herum schützen willst.

Deine größte Stärke entfaltet sich, wenn alle anderen den Überblick verlieren. In der Krise wirst du nicht panisch – du wirst präzise.

Du bist einer der wenigen, die verstehen: Das beste Schwert ist das, das nie gezogen werden muss.`,
            stats: [
                { label: "Gedachte Schritte voraus", value: "7-12" },
                { label: "Backup-Pläne", value: "Immer mindestens 3" },
                { label: "Spontanität", value: "Auch das ist eingeplant" },
                { label: "Pokerface", value: "Undurchdringlich" }
            ],
            compatibility: {
                allies: ["paladin", "berserker"],
                nemesis: ["seher"]
            },
            share_text: "Ich bin DER ARCHITEKT DER MÖGLICHKEITEN. Glück? Nein – ich hab das geplant. 🎯🧠"
        },
        {
            id: "seher",
            title: "DAS AUGE JENSEITS DES HORIZONTS",
            tagline: "Du spürst, was kommt – lange bevor andere es sehen.",
            description: `Manchmal weißt du Dinge, die du nicht wissen solltest.

Du nennst es Intuition. Andere nennen es unheimlich. Die Wahrheit ist: Du hast gelernt, auf Signale zu hören, die die meisten überhören – das Zögern in einer Stimme, das Muster hinter dem Zufall, das Gefühl, dass etwas nicht stimmt.

Was manche als "zu mysteriös" oder "in ihrer eigenen Welt" beschreiben, ist deine Art, Informationen zu verarbeiten, die nicht in Worte passen. Du denkst nicht linear – du denkst in Bildern, Gefühlen, Ahnungen.

Deine größte Stärke entfaltet sich, wenn du deiner Intuition vertraust, auch wenn die Logik dagegen spricht. Du wirst oft erst im Nachhinein bestätigt – aber du wirst bestätigt.

Du bist einer der wenigen, die verstehen: Die wichtigsten Wahrheiten können nicht bewiesen werden – nur gespürt.`,
            stats: [
                { label: "Intuition", value: "Erschreckend akkurat" },
                { label: "Erklärbare Vorahnungen", value: "23%" },
                { label: "Déjà-vus pro Woche", value: "Mehrere" },
                { label: "Geheimnisse gehütet", value: "Unzählbar" }
            ],
            compatibility: {
                allies: ["nekromant", "heiler"],
                nemesis: ["stratege"]
            },
            share_text: "Ich bin DAS AUGE JENSEITS DES HORIZONTS. Ich wusste, dass du das lesen würdest. 👁️✨"
        }
    ]
};

export const profileNames = {
    paladin: "Schwertträger des Lichts",
    nekromant: "Wanderer zwischen den Schleiern",
    heiler: "Quelle der Stille",
    berserker: "Flamme, die nicht erlischt",
    stratege: "Architekt der Möglichkeiten",
    seher: "Auge jenseits des Horizonts"
};
