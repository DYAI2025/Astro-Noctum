
export const quizMeta = {
  id: "quiz.career_dna.v2",
  title: "Karriere DNA",
  subtitle: "Entschlüssele deinen beruflichen Erfolgs-Code.",
  description: "Finde heraus, in welchem Arbeitsumfeld du wirklich aufblühst und welche Rolle dir auf den Leib geschneidert ist.",
  questions_count: 12,
  disclaimer: "Berufliche Orientierungshilfe. Kein psychologisches Gutachten."
};

export const questions = [
  {
    id: "cd1",
    scenario: "Montagmorgen, 09:00 Uhr. Dein idealer Start?",
    text: "Wie legst du los?",
    options: [
      { text: "Team-Call um alle zu motivieren", scores: { katalysator: 5, mentor: 3 } },
      { text: "Deep Work an einem komplexen Problem", scores: { architekt: 5, navigator: 3 } },
      { text: "Brainstorming für neue Ideen", scores: { visionaer: 5, katalysator: 3 } },
      { text: "Emails checken und Woche strukturieren", scores: { waechter: 5, navigator: 2 } }
    ]
  },
  {
    id: "cd2",
    scenario: "Ein Projekt droht zu scheitern...",
    text: "Deine Rettungsmaßnahme?",
    options: [
      { text: "Ich analysiere die Fehlerursache", scores: { navigator: 5, architekt: 3 } },
      { text: "Ich improvisiere eine völlig neue Lösung", scores: { visionaer: 5, katalysator: 2 } },
      { text: "Ich baue das Team wieder auf", scores: { mentor: 5, katalysator: 3 } },
      { text: "Ich sichere, was noch zu retten ist", scores: { waechter: 5, navigator: 3 } }
    ]
  },
  {
    id: "cd3",
    scenario: "Was motiviert dich am meisten?",
    text: "Dein Antrieb?",
    options: [
      { text: "Anderen beim Wachsen helfen", scores: { mentor: 5, waechter: 2 } },
      { text: "Etwas Einzigartiges erschaffen", scores: { visionaer: 5, architekt: 3 } },
      { text: "Perfekte Systeme bauen", scores: { architekt: 5, navigator: 4 } },
      { text: "Chaos in Ordnung verwandeln", scores: { waechter: 5, navigator: 3 } }
    ]
  },
  {
    id: "cd4",
    scenario: "Dein Albtraum-Job wäre...",
    text: "Was kannst du gar nicht?",
    options: [
      { text: "Einsam in einer Datenzelle sitzen", scores: { katalysator: 5, mentor: 4 } },
      { text: "Jeden Tag exakt das Gleiche tun", scores: { visionaer: 5, architekt: 2 } },
      { text: "Ohne Plan ins Risiko springen", scores: { waechter: 5, navigator: 4 } },
      { text: "Oberflächlicher Smalltalk den ganzen Tag", scores: { architekt: 5, navigator: 3 } }
    ]
  },
  {
    id: "cd5",
    scenario: "Feedback-Gespräch. Was willst du hören?",
    text: "Dein liebstes Lob?",
    options: [
      { text: 'Du hast eine geniale Vision!', scores: { visionaer: 5, katalysator: 2 } },
      { text: 'Auf dich ist immer Verlass.', scores: { waechter: 5, mentor: 2 } },
      { text: 'Das ist technisch brillant gelöst.', scores: { architekt: 5, navigator: 3 } },
      { text: 'Du hast das Team zusammengehalten.', scores: { mentor: 5, katalysator: 3 } }
    ]
  },
  {
    id: "cd6",
    scenario: "Du musst präsentieren...",
    text: "Wie machst du das?",
    options: [
      { text: "Mit Leidenschaft und großen Bildern", scores: { visionaer: 5, katalysator: 4 } },
      { text: "Mit Fakten, Daten und Logik", scores: { navigator: 5, architekt: 4 } },
      { text: "Interaktiv im Dialog mit dem Raum", scores: { katalysator: 5, mentor: 3 } },
      { text: "Gut vorbereitet mit Handout für alle", scores: { waechter: 5, navigator: 2 } }
    ]
  },
  {
    id: "cd7",
    scenario: "Ein Kollege bittet um Hilfe...",
    text: "Deine Reaktion?",
    options: [
      { text: "Ich zeige ihm, wie er es selbst löst", scores: { mentor: 5, architekt: 2 } },
      { text: "Ich übernehme es kurz, geht schneller", scores: { visionaer: 3, katalysator: 2 } },
      { text: "Ich prüfe erst meine eigene Deadline", scores: { waechter: 5, navigator: 3 } },
      { text: "Ich vernetze ihn mit einem Experten", scores: { katalysator: 5, navigator: 2 } }
    ]
  },
  {
    id: "cd8",
    scenario: "Innovation vs. Tradition?",
    text: "Wo stehst du?",
    options: [
      { text: "Alles neu macht der Mai!", scores: { visionaer: 5, architekt: 3 } },
      { text: "Bewährtes schützen und optimieren", scores: { waechter: 5, navigator: 4 } },
      { text: "Brücke zwischen Alt und Neu bauen", scores: { katalysator: 5, mentor: 3 } },
      { text: "Wahrheit liegt in der Analyse", scores: { navigator: 5, architekt: 4 } }
    ]
  },
  {
    id: "cd9",
    scenario: "Dein Schreibtisch (oder Desktop)...",
    text: "Wie sieht es aus?",
    options: [
      { text: "Kreatives Chaos", scores: { visionaer: 5, katalysator: 3 } },
      { text: "Minimalistisch und clean", scores: { architekt: 5, navigator: 4 } },
      { text: "Alles hat seinen festen Platz", scores: { waechter: 5, navigator: 3 } },
      { text: "Fotos von Freunden und Inspirationen", scores: { mentor: 5, katalysator: 2 } }
    ]
  },
  {
    id: "cd10",
    scenario: "Wenn du Chef wärst...",
    text: "Dein Führungsstil?",
    options: [
      { text: "Inspirierend und vorausgehend", scores: { visionaer: 5, katalysator: 4 } },
      { text: "Strategisch und kontrolliert", scores: { navigator: 5, waechter: 3 } },
      { text: "Fördernd und empatisch", scores: { mentor: 5, katalysator: 3 } },
      { text: "Kompetenz-basiert und sachlich", scores: { architekt: 5, navigator: 2 } }
    ]
  },
  {
    id: "cd11",
    scenario: "Risiko-Check",
    text: "Wie viel wagst du?",
    options: [
      { text: "Alles auf eine Karte!", scores: { visionaer: 5, katalysator: 2 } },
      { text: "Kalkuliertes Risiko nach Analyse", scores: { navigator: 5, architekt: 4 } },
      { text: "Sicherheit geht vor", scores: { waechter: 5, mentor: 2 } },
      { text: "Nur wenn das Team mitzieht", scores: { mentor: 5, katalysator: 3 } }
    ]
  },
  {
    id: "cd12",
    scenario: "Wofür willst du erinnert werden?",
    text: "Dein Vermächtnis?",
    options: [
      { text: "Ich habe die Branche revolutioniert", scores: { visionaer: 5, architekt: 3 } },
      { text: "Ich habe Menschen geprägt", scores: { mentor: 5, katalysator: 3 } },
      { text: "Ich habe ein stabiles Fundament gebaut", scores: { waechter: 5, navigator: 3 } },
      { text: "Ich habe komplexe Probleme gelöst", scores: { architekt: 5, navigator: 4 } }
    ]
  }
];

export const profiles = [
  {
    id: "visionaer",
    title: "Der Visionär",
    icon: "🚀",
    tagline: "Du siehst die Zukunft, bevor sie da ist.",
    description: "Du bist der Motor für Veränderung. 'Das haben wir immer so gemacht' ist für dich eine Kriegserklärung. Du brauchst Freiraum, große Ziele und die Erlaubnis, Regeln zu brechen. Deine Stärke ist der Anfang, nicht unbedingt das Detail.",
    stats: [
      { label: "Risikobereitschaft", value: 95 },
      { label: "Innovationskraft", value: 98 },
      { label: "Überzeugungskraft", value: 90 },
      { label: "Detailtreue", value: 20 }
    ],
    matching: { perfect: "Startups, R&D", avoid: "Behörden" },
    share_text: "🚀 Meine Karriere-DNA: Der Visionär – Ich sehe die Zukunft.",
  },
  {
    id: "architekt",
    title: "Der Architekt",
    icon: "🏗️",
    tagline: "Du baust Systeme für die Ewigkeit.",
    description: "Du liebst komplexe Probleme. Wo andere Chaos sehen, siehst du Strukturen. Du arbeitest gerne tief konzentriert (Deep Work) und lieferst Ergebnisse von höchster Qualität. Smalltalk und Politik interessieren dich nicht – Kompetenz ist deine Währung.",
    stats: [
      { label: "Logik", value: 98 },
      { label: "Fokus", value: 95 },
      { label: "Struktur", value: 92 },
      { label: "Diplomatie", value: 30 }
    ],
    matching: { perfect: "Engineering, Architektur", avoid: "Sales" },
    share_text: "🏗️ Meine Karriere-DNA: Der Architekt – Ich baue Systeme.",
  },
  {
    id: "katalysator",
    title: "Der Katalysator",
    icon: "⚡",
    tagline: "Du bringst Dinge (und Menschen) in Bewegung.",
    description: "Du bist der Funke. Allein deine Anwesenheit verändert die Dynamik im Raum. Du bist exzellent im Netzwerken, Verkaufen und Überzeugen. Du brauchst Abwechslung, Bühnen und Menschen. Routine tötet deine Kreativität.",
    stats: [
      { label: "Energie", value: 96 },
      { label: "Netzwerk", value: 98 },
      { label: "Einfluss", value: 94 },
      { label: "Geduld", value: 25 }
    ],
    matching: { perfect: "Sales, PR, Event", avoid: "Buchhaltung" },
    share_text: "⚡ Meine Karriere-DNA: Der Katalysator – Ich bringe Bewegung.",
  },
  {
    id: "navigator",
    title: "Der Navigator",
    icon: "🧭",
    tagline: "Du hältst den Kurs, wenn es stürmt.",
    description: "Du bist der Stratege im Hintergrund. Du triffst keine impulsiven Entscheidungen, sondern basierst alles auf Daten und Fakten. Teams vertrauen dir, weil du Ruhe ausstrahlst und den Weg kennst. Du bist das Gehirn der Operation.",
    stats: [
      { label: "Strategie", value: 95 },
      { label: "Analytik", value: 97 },
      { label: "Objektivität", value: 92 },
      { label: "Spontanität", value: 35 }
    ],
    matching: { perfect: "Management, Consulting", avoid: "Werbetexten" },
    share_text: "🧭 Meine Karriere-DNA: Der Navigator – Ich halte Kurs.",
  },
  {
    id: "mentor",
    title: "Der Mentor",
    icon: "🌱",
    tagline: "Du lässt andere über sich hinauswachsen.",
    description: "Dein Erfolg misst sich am Erfolg der anderen. Du bist ein natürlicher Coach und Leader, der nicht durch Macht, sondern durch Vertrauen führt. Du schaffst eine Atmosphäre, in der sich Menschen sicher fühlen und entfalten können.",
    stats: [
      { label: "Empathie", value: 99 },
      { label: "Coaching", value: 95 },
      { label: "Geduld", value: 90 },
      { label: "Härte", value: 20 }
    ],
    matching: { perfect: "HR, Coaching, Lehre", avoid: "Investmentbanking" },
    share_text: "🌱 Meine Karriere-DNA: Der Mentor – Ich lasse wachsen.",
  },
  {
    id: "waechter",
    title: "Der Wächter",
    icon: "🏰",
    tagline: "Du sicherst das Fundament.",
    description: "Ohne dich würde alles zusammenbrechen. Du bist derjenige, der die Details prüft, die Risiken sieht und für Stabilität sorgt. Du bist loyal, gewissenhaft und der Feind von Flüchtigkeitsfehlern. Du bist das Rückgrat jeder Organisation.",
    stats: [
      { label: "Zuverlässigkeit", value: 100 },
      { label: "Ordnung", value: 98 },
      { label: "Sicherheit", value: 95 },
      { label: "Flexibilität", value: 30 }
    ],
    matching: { perfect: "Qualitätssicherung, Recht, Finanzen", avoid: "Startup-Chaos" },
    share_text: "🏰 Meine Karriere-DNA: Der Wächter – Ich sichere ab.",
  }
];

export const profileNames = Object.fromEntries(profiles.map(p => [p.id, p.title]));
