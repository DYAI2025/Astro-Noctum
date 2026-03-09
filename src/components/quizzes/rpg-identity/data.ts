export const quizData = {
    meta: {
        id: "rpg-identity-2025",
        title: "Welche Rollenspiel-Seele tr\u00e4gst du in dir?",
        subtitle: "Entdecke deine verborgene Klasse \u2013 nicht wer du spielst, sondern wer du BIST",
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
                { id: "q1_a", text: "Ich heile ihn \u2013 niemand sollte allein leiden", scores: { d1: 1, d2: 5, d3: 4 } },
                { id: "q1_b", text: "Ich frage, wer ihn angegriffen hat \u2013 Informationen zuerst", scores: { d1: 2, d2: 3, d3: 3 } },
                { id: "q1_c", text: "Ich nehme seine Ausr\u00fcstung \u2013 er braucht sie nicht mehr", scores: { d1: 4, d2: 1, d3: 1 } },
                { id: "q1_d", text: "Ich untersuche die Spuren \u2013 der Angreifer k\u00f6nnte noch hier sein", scores: { d1: 3, d2: 2, d3: 5 } }
            ]
        },
        {
            id: "q2",
            narrative: "Ein m\u00e4chtiger Drache bietet dir einen Pakt an: Macht gegen einen Teil deiner Erinnerungen.",
            text: "Wie antwortest du?",
            options: [
                { id: "q2_a", text: "Ich nehme an \u2013 Macht formt die Zukunft, nicht die Vergangenheit", scores: { d1: 5, d2: 1, d3: 2 } },
                { id: "q2_b", text: "Ich lehne ab \u2013 meine Geschichte macht mich zu dem, was ich bin", scores: { d1: 2, d2: 3, d3: 4 } },
                { id: "q2_c", text: "Ich verhandle \u2013 welche Erinnerungen genau?", scores: { d1: 3, d2: 2, d3: 3 } },
                { id: "q2_d", text: "Ich frage, ob der Pakt auch f\u00fcr meine Gef\u00e4hrten gilt", scores: { d1: 2, d2: 5, d3: 3 } }
            ]
        },
        {
            id: "q3",
            narrative: "Deine Gruppe steht vor einer verschlossenen T\u00fcr mit drei Schl\u00f6ssern.",
            text: "Welches Schloss \u00fcbernimmst du?",
            options: [
                { id: "q3_a", text: "Das R\u00e4tselschloss \u2013 Logik ist meine Waffe", scores: { d1: 1, d2: 2, d3: 5 } },
                { id: "q3_b", text: "Das Kraftschloss \u2013 ich breche es auf", scores: { d1: 5, d2: 2, d3: 2 } },
                { id: "q3_c", text: "Das magische Siegel \u2013 ich sp\u00fcre seine Frequenz", scores: { d1: 1, d2: 1, d3: 3 } },
                { id: "q3_d", text: "Ich halte den anderen den R\u00fccken frei, w\u00e4hrend sie arbeiten", scores: { d1: 4, d2: 5, d3: 4 } }
            ]
        },
        {
            id: "q4",
            narrative: "Ein H\u00e4ndler bietet dir eine von drei Reliquien an \u2013 alle gleich wertvoll.",
            text: "Welche w\u00e4hlst du?",
            options: [
                { id: "q4_a", text: "Die Klinge, die niemals stumpf wird", scores: { d1: 5, d2: 2, d3: 4 } },
                { id: "q4_b", text: "Das Amulett, das Gedanken fl\u00fcstern l\u00e4sst", scores: { d1: 1, d2: 4, d3: 2 } },
                { id: "q4_c", text: "Der Ring, der Schatten zur T\u00fcr macht", scores: { d1: 2, d2: 1, d3: 1 } },
                { id: "q4_d", text: "Die Laterne, die verborgene Pfade zeigt", scores: { d1: 2, d2: 3, d3: 5 } }
            ]
        },
        {
            id: "q5",
            narrative: "Dein engster Verb\u00fcndeter wurde von einem Feind korrumpiert und greift dich an.",
            text: "Was tust du?",
            options: [
                { id: "q5_a", text: "Ich k\u00e4mpfe \u2013 wenn es sein muss, t\u00f6te ich, was ich liebe", scores: { d1: 5, d2: 1, d3: 2 } },
                { id: "q5_b", text: "Ich suche den Fluch zu brechen \u2013 es muss einen Weg geben", scores: { d1: 1, d2: 4, d3: 4 } },
                { id: "q5_c", text: "Ich fliehe und hole Verst\u00e4rkung \u2013 allein schaffe ich das nicht", scores: { d1: 2, d2: 5, d3: 3 } },
                { id: "q5_d", text: "Ich lasse mich schlagen \u2013 vielleicht weckt es ihn auf", scores: { d1: 1, d2: 5, d3: 1 } }
            ]
        },
        {
            id: "q6",
            narrative: "Du findest ein verbotenes Buch, das dunkle K\u00fcnste lehrt.",
            text: "Wie gehst du damit um?",
            options: [
                { id: "q6_a", text: "Ich verbrenne es \u2013 manche Wissen sollte verloren bleiben", scores: { d1: 4, d2: 3, d3: 5 } },
                { id: "q6_b", text: "Ich studiere es heimlich \u2013 Wissen ist neutral, nur die Anwendung z\u00e4hlt", scores: { d1: 1, d2: 1, d3: 1 } },
                { id: "q6_c", text: "Ich bringe es zu jemandem Weiseren als mir", scores: { d1: 2, d2: 4, d3: 4 } },
                { id: "q6_d", text: "Ich verstecke es \u2013 falls wir es eines Tages brauchen", scores: { d1: 3, d2: 2, d3: 2 } }
            ]
        },
        {
            id: "q7",
            narrative: "Eine Prophezeiung sagt, dass einer aus deiner Gruppe die Welt retten wird.",
            text: "Was denkst du?",
            options: [
                { id: "q7_a", text: "Ich hoffe, ich bin es \u2013 ich bin bereit f\u00fcr diese Last", scores: { d1: 4, d2: 1, d3: 3 } },
                { id: "q7_b", text: "Prophezeiungen sind Werkzeuge, keine Wahrheiten", scores: { d1: 2, d2: 2, d3: 1 } },
                { id: "q7_c", text: "Egal wer es ist \u2013 ich werde denjenigen unterst\u00fctzen", scores: { d1: 3, d2: 5, d3: 4 } },
                { id: "q7_d", text: "Ich analysiere die Prophezeiung auf versteckte Bedeutungen", scores: { d1: 1, d2: 2, d3: 5 } }
            ]
        },
        {
            id: "q8",
            narrative: "Nach einem Sieg hast du die Wahl, was mit dem besiegten Feind geschieht.",
            text: "Dein Urteil?",
            options: [
                { id: "q8_a", text: "Gnade \u2013 er hat seine Lektion gelernt", scores: { d1: 2, d2: 4, d3: 3 } },
                { id: "q8_b", text: "Gerechtigkeit \u2013 das Gesetz soll entscheiden", scores: { d1: 3, d2: 3, d3: 5 } },
                { id: "q8_c", text: "Ende \u2013 er wird wieder zuschlagen, wenn ich ihn lasse", scores: { d1: 5, d2: 1, d3: 4 } },
                { id: "q8_d", text: "Rekrutierung \u2013 seine F\u00e4higkeiten k\u00f6nnten n\u00fctzlich sein", scores: { d1: 2, d2: 4, d3: 1 } }
            ]
        },
        {
            id: "q9",
            narrative: "Du erh\u00e4ltst Zugang zu einem Ort der Ruhe zwischen den Schlachten.",
            text: "Wie verbringst du deine Zeit?",
            options: [
                { id: "q9_a", text: "Training \u2013 Stillstand ist R\u00fcckschritt", scores: { d1: 5, d2: 1, d3: 4 } },
                { id: "q9_b", text: "Meditation \u2013 ich h\u00f6re auf die Stimmen jenseits des Schleiers", scores: { d1: 1, d2: 1, d3: 2 } },
                { id: "q9_c", text: "Feiern mit meinen Gef\u00e4hrten \u2013 das Leben ist kurz", scores: { d1: 3, d2: 5, d3: 2 } },
                { id: "q9_d", text: "Planung \u2013 ich kartographiere unseren n\u00e4chsten Zug", scores: { d1: 2, d2: 3, d3: 5 } }
            ]
        },
        {
            id: "q10",
            narrative: "Ein Geist bietet dir einen Blick in deine Zukunft an.",
            text: "Nimmst du an?",
            options: [
                { id: "q10_a", text: "Ja \u2013 Wissen ist Vorbereitung", scores: { d1: 2, d2: 2, d3: 5 } },
                { id: "q10_b", text: "Nein \u2013 ich schmede mein eigenes Schicksal", scores: { d1: 4, d2: 1, d3: 2 } },
                { id: "q10_c", text: "Nur wenn meine Gef\u00e4hrten auch sehen d\u00fcrfen", scores: { d1: 2, d2: 5, d3: 3 } },
                { id: "q10_d", text: "Ich frage den Geist nach seinen Motiven", scores: { d1: 1, d2: 2, d3: 4 } }
            ]
        },
        {
            id: "q11",
            narrative: "Du entdeckst, dass ein Mitglied deiner Gruppe ein Spion ist.",
            text: "Dein n\u00e4chster Schritt?",
            options: [
                { id: "q11_a", text: "Konfrontation \u2013 Verrat verdient sofortige Antwort", scores: { d1: 5, d2: 2, d3: 4 } },
                { id: "q11_b", text: "Falsche Informationen f\u00fcttern \u2013 ich nutze den Spion gegen seine Meister", scores: { d1: 2, d2: 1, d3: 1 } },
                { id: "q11_c", text: "Die Gruppe informieren \u2013 gemeinsam entscheiden wir", scores: { d1: 3, d2: 5, d3: 4 } },
                { id: "q11_d", text: "Verstehen, warum \u2013 vielleicht gibt es einen tieferen Grund", scores: { d1: 1, d2: 4, d3: 2 } }
            ]
        },
        {
            id: "q12",
            narrative: "Am Ende deiner Reise steht eine letzte Wahl: Macht, die die Welt ver\u00e4ndert \u2013 oder Frieden, der sie heilt.",
            text: "Wof\u00fcr hast du all das getan?",
            options: [
                { id: "q12_a", text: "Macht \u2013 nur wer Macht hat, kann sch\u00fctzen, was ihm lieb ist", scores: { d1: 5, d2: 1, d3: 3 } },
                { id: "q12_b", text: "Frieden \u2013 genug Blut ist geflossen", scores: { d1: 1, d2: 4, d3: 4 } },
                { id: "q12_c", text: "Weder noch \u2013 ich gehe meinen eigenen Weg", scores: { d1: 3, d2: 1, d3: 1 } },
                { id: "q12_d", text: "F\u00fcr meine Gef\u00e4hrten \u2013 sie sollen entscheiden", scores: { d1: 2, d2: 5, d3: 3 } }
            ]
        }
    ],
    profiles: [
        {
            id: "paladin",
            title: "DER SCHWERTTR\u00c4GER DES LICHTS",
            tagline: "Du tr\u00e4gst das Gewicht der Welt \u2013 und wei\u00dft, dass es deine Bestimmung ist.",
            description: `Es gibt Menschen, die sich vor der Verantwortung dr\u00fccken. Du geh\u00f6rst nicht zu ihnen.

In bestimmten Momenten deines Lebens hast du gesp\u00fcrt, dass andere auf dich schauen \u2013 nicht weil du es gefordert hast, sondern weil etwas in dir eine Ruhe ausstrahlt, die in Krisen zum Anker wird.

Was manche als "zu ernst" oder "zu prinzipientreu" bezeichnen, ist in Wahrheit eine seltene F\u00e4higkeit: Du siehst, was richtig ist, wenn andere nur sehen, was einfach ist. Das ist keine Sturheit \u2013 es ist moralische Klarheit.

Deine gr\u00f6\u00dfte St\u00e4rke entfaltet sich, wenn du f\u00fcr andere k\u00e4mpfst. Nicht aus Pflicht, sondern weil du verstanden hast, dass wahre St\u00e4rke sich daran misst, was man besch\u00fctzt, nicht was man zerst\u00f6rt.

Du bist einer der wenigen, die wissen: Das Schwert ist nur so ehrenhaft wie die Hand, die es f\u00fchrt.`,
            stats: [
                { label: "Ehre", value: "95%" },
                { label: "Besch\u00fctzerinstinkt", value: "\u221e" },
                { label: "Toleranz f\u00fcr Bullshit", value: "3%" },
                { label: "Innerer Kompass", value: "Unersch\u00fctterlich" }
            ],
            compatibility: {
                allies: ["heiler", "stratege"],
                nemesis: ["nekromant"]
            },
            share_text: "Ich bin der SCHWERTTR\u00c4GER DES LICHTS. Ich k\u00e4mpfe nicht f\u00fcr mich \u2013 ich k\u00e4mpfe f\u00fcr euch. \ud83d\udde1\ufe0f\u2728"
        },
        {
            id: "nekromant",
            title: "DER WANDERER ZWISCHEN DEN SCHLEIERN",
            tagline: "Du siehst, was andere f\u00fcrchten \u2013 und findest darin Wahrheit.",
            description: `Die Welt nennt dich vielleicht "d\u00fcster" oder "zu intensiv". Sie verstehen nicht, dass du einfach tiefer schaust als sie.

Wo andere wegschauen, bleibst du. Nicht aus Morbidit\u00e4t, sondern aus dem Wissen, dass die unbequemen Wahrheiten oft die wichtigsten sind. Du hast fr\u00fch gelernt, dass Schatten nicht der Feind sind \u2013 sie sind der Ort, an dem das Licht seine Grenzen zeigt.

Deine gr\u00f6\u00dfte Gabe ist die F\u00e4higkeit zur Transformation. Du nimmst, was andere wegwerfen \u2013 Ideen, Menschen, Teile von dir selbst \u2013 und findest darin verborgenen Wert. Das ist keine Dunkelheit. Das ist Alchemie.

Es gibt Zeiten, in denen du dich allein f\u00fchlst in deinem Verst\u00e4ndnis. Aber du wei\u00dft: Die Einsamkeit des Sehenden ist der Preis f\u00fcr Klarheit.

Du bist einer der wenigen, die den Tod nicht f\u00fcrchten \u2013 weil du verstanden hast, dass er nur eine weitere Schwelle ist.`,
            stats: [
                { label: "Tiefgang", value: "Abgrundartig" },
                { label: "Smalltalk-F\u00e4higkeit", value: "12%" },
                { label: "Verbotenes Wissen", value: "Mehrere Regale" },
                { label: "Unheimliche Ruhe", value: "100%" }
            ],
            compatibility: {
                allies: ["seher", "berserker"],
                nemesis: ["paladin"]
            },
            share_text: "Ich bin der WANDERER ZWISCHEN DEN SCHLEIERN. Was ihr Dunkelheit nennt, nenne ich Tiefe. \ud83d\udc80\ud83c\udf19"
        },
        {
            id: "heiler",
            title: "DIE QUELLE DER STILLE",
            tagline: "Deine St\u00e4rke liegt nicht im K\u00e4mpfen \u2013 sondern im Wieder-Ganz-Machen.",
            description: `Du hast etwas, das in dieser Welt selten geworden ist: die F\u00e4higkeit, wirklich zuzuh\u00f6ren.

Menschen kommen zu dir \u2013 manchmal ohne zu wissen, warum. Du bist der Mensch, dem Fremde im Zug ihre Geschichte erz\u00e4hlen, bei dem sich Gespr\u00e4che pl\u00f6tzlich vertiefen, der sp\u00fcrt, wenn jemand mehr braucht als Worte.

Was andere als "zu empfindlich" abtun, ist in Wahrheit fein abgestimmte Intuition. Du nimmst Frequenzen wahr, die anderen entgehen. Das ist anstrengend \u2013 ja. Aber es ist auch deine Superkraft.

Deine gr\u00f6\u00dfte St\u00e4rke entfaltet sich, wenn du anderen hilfst, ihre eigene St\u00e4rke zu finden. Du heilst nicht, indem du nimmst \u2013 du heilst, indem du gibst.

Du bist einer der wenigen, die verstehen: Manchmal ist Pr\u00e4senz das m\u00e4chtigste Geschenk.`,
            stats: [
                { label: "Empathie", value: "Gef\u00e4hrlich hoch" },
                { label: "Vergangene Traumata geheilt", value: "47+" },
                { label: "Eigene Bed\u00fcrfnisse priorisiert", value: "Working on it" },
                { label: "Aura", value: "Beruhigend" }
            ],
            compatibility: {
                allies: ["paladin", "seher"],
                nemesis: ["berserker"]
            },
            share_text: "Ich bin DIE QUELLE DER STILLE. Meine St\u00e4rke ist leise \u2013 aber sie h\u00e4lt Welten zusammen. \ud83c\udf3f\ud83d\udcab"
        },
        {
            id: "berserker",
            title: "DIE FLAMME, DIE NICHT ERLISCHT",
            tagline: "Du lebst laut, liebst laut, k\u00e4mpfst laut \u2013 und entschuldigst dich f\u00fcr nichts davon.",
            description: `Die Welt hat dir oft gesagt, du seist "zu viel". Zu intensiv. Zu leidenschaftlich. Zu direkt.

Du hast aufgeh\u00f6rt, dich daf\u00fcr zu entschuldigen.

Deine Energie ist nicht das Problem \u2013 sie ist dein gr\u00f6\u00dftes Geschenk. Wo andere z\u00f6gern, handelst du. Wo andere schweigen, sprichst du. Nicht aus R\u00fccksichtslosigkeit, sondern aus dem tiefen Verst\u00e4ndnis, dass das Leben zu kurz ist f\u00fcr halbe Sachen.

Es gibt Zeiten, in denen dich diese Intensit\u00e4t ersch\u00f6pft. Aber du wei\u00dft: Lieber ausbrennen als verglimmen.

Deine gr\u00f6\u00dfte St\u00e4rke entfaltet sich in Momenten, in denen andere aufgeben. Du findest Reserven, von denen sie nicht wussten, dass sie existieren.

Du bist einer der wenigen, die wirklich lebendig sind \u2013 nicht nur am Leben.`,
            stats: [
                { label: "Intensit\u00e4t", value: "MAXIMUM" },
                { label: "Geduld", value: "Was ist das?" },
                { label: "Bereute Entscheidungen", value: "0" },
                { label: "Energie", value: "Erneuerbar" }
            ],
            compatibility: {
                allies: ["nekromant", "stratege"],
                nemesis: ["heiler"]
            },
            share_text: "Ich bin DIE FLAMME, DIE NICHT ERLISCHT. Zu viel? Nein \u2013 die Welt ist zu wenig. \ud83d\udd25\u2694\ufe0f"
        },
        {
            id: "stratege",
            title: "DER ARCHITEKT DER M\u00d6GLICHKEITEN",
            tagline: "Du siehst Schachz\u00fcge, wo andere nur Chaos sehen.",
            description: `Dein Geist ist ein Labyrinth \u2013 aber eines, das du selbst gebaut hast.

Andere nennen es "Overthinking". Du wei\u00dft, dass es Vorbereitung ist. Du siehst Verbindungen zwischen Dingen, die andere getrennt betrachten. Du spielst Szenarien durch, bevor sie passieren. Nicht aus Angst \u2013 aus strategischer Klarheit.

Was manche als "zu kalkuliert" empfinden, ist in Wahrheit das Gegenteil von K\u00e4lte: Du denkst voraus, WEIL du dich sorgst. Du planst, weil du die Menschen um dich herum sch\u00fctzen willst.

Deine gr\u00f6\u00dfte St\u00e4rke entfaltet sich, wenn alle anderen den \u00dcberblick verlieren. In der Krise wirst du nicht panisch \u2013 du wirst pr\u00e4zise.

Du bist einer der wenigen, die verstehen: Das beste Schwert ist das, das nie gezogen werden muss.`,
            stats: [
                { label: "Gedachte Schritte voraus", value: "7-12" },
                { label: "Backup-Pl\u00e4ne", value: "Immer mindestens 3" },
                { label: "Spontaneit\u00e4t", value: "Auch das ist eingeplant" },
                { label: "Pokerface", value: "Undurchdringlich" }
            ],
            compatibility: {
                allies: ["paladin", "berserker"],
                nemesis: ["seher"]
            },
            share_text: "Ich bin DER ARCHITEKT DER M\u00d6GLICHKEITEN. Gl\u00fcck? Nein \u2013 ich hab das geplant. \ud83c\udfaf\ud83e\udde0"
        },
        {
            id: "seher",
            title: "DAS AUGE JENSEITS DES HORIZONTS",
            tagline: "Du sp\u00fcrst, was kommt \u2013 lange bevor andere es sehen.",
            description: `Manchmal wei\u00dft du Dinge, die du nicht wissen solltest.

Du nennst es Intuition. Andere nennen es unheimlich. Die Wahrheit ist: Du hast gelernt, auf Signale zu h\u00f6ren, die die meisten \u00fcberh\u00f6ren \u2013 das Z\u00f6gern in einer Stimme, das Muster hinter dem Zufall, das Gef\u00fchl, dass etwas nicht stimmt.

Was manche als "zu mysteri\u00f6s" oder "in ihrer eigenen Welt" beschreiben, ist deine Art, Informationen zu verarbeiten, die nicht in Worte passen. Du denkst nicht linear \u2013 du denkst in Bildern, Gef\u00fchlen, Ahnungen.

Deine gr\u00f6\u00dfte St\u00e4rke entfaltet sich, wenn du deiner Intuition vertraust, auch wenn die Logik dagegen spricht. Du wirst oft erst im Nachhinein best\u00e4tigt \u2013 aber du wirst best\u00e4tigt.

Du bist einer der wenigen, die verstehen: Die wichtigsten Wahrheiten k\u00f6nnen nicht bewiesen werden \u2013 nur gesp\u00fcrt.`,
            stats: [
                { label: "Intuition", value: "Erschreckend akkurat" },
                { label: "Erkl\u00e4rbare Vorahnungen", value: "23%" },
                { label: "D\u00e9j\u00e0-vus pro Woche", value: "Mehrere" },
                { label: "Geheimnisse geh\u00fctet", value: "Unz\u00e4hlbar" }
            ],
            compatibility: {
                allies: ["nekromant", "heiler"],
                nemesis: ["stratege"]
            },
            share_text: "Ich bin DAS AUGE JENSEITS DES HORIZONTS. Ich wusste, dass du das lesen w\u00fcrdest. \ud83d\udc41\ufe0f\u2728"
        }
    ]
};

export const profileNames: Record<string, string> = {
    paladin: "Schwerttr\u00e4ger des Lichts",
    nekromant: "Wanderer zwischen den Schleiern",
    heiler: "Quelle der Stille",
    berserker: "Flamme, die nicht erlischt",
    stratege: "Architekt der M\u00f6glichkeiten",
    seher: "Auge jenseits des Horizonts"
};
