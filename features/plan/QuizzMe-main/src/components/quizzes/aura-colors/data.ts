
export const quizMeta = {
  id: "quiz.aura_colors.v1",
  title: "Deine Aurafarben",
  subtitle: "Entdecke das unsichtbare Licht deiner Seele",
  description: "12 Fragen enthüllen die Farbe, in der deine Seele spricht.",
  questions_count: 12,
  estimated_duration_seconds: 180,
  disclaimer: "Dieser Test dient der spielerischen Selbstreflexion und stellt keine psychologische Diagnose dar."
};

export const dimensions = [
  {
    id: "energiefluss",
    label: "Energiefluss",
    pole_low: "introjektion",
    pole_low_label: "Nach innen gerichtet",
    pole_high: "projektion",
    pole_high_label: "Nach außen gerichtet",
    description: "Die natürliche Richtung deiner Lebensenergie"
  },
  {
    id: "rhythmus",
    label: "Rhythmus",
    pole_low: "konstanz",
    pole_low_label: "Beständig, verwurzelt",
    pole_high: "dynamik",
    pole_high_label: "Wandelnd, fließend",
    description: "Das Tempo deines inneren Wandels"
  },
  {
    id: "wahrnehmung",
    label: "Wahrnehmungsmodus",
    pole_low: "analyse",
    pole_low_label: "Verstand, Struktur",
    pole_high: "intuition",
    pole_high_label: "Gefühl, Ahnung",
    description: "Wie du die Welt erfasst und verstehst"
  },
  {
    id: "resonanz",
    label: "Soziale Resonanz",
    pole_low: "absorption",
    pole_low_label: "Aufnehmend, empfangend",
    pole_high: "emission",
    pole_high_label: "Ausstrahlend, sendend",
    description: "Dein energetischer Austausch mit anderen"
  }
];

export const questions = [
  // ENERGIEFLUSS (Q1-Q3)
  {
    id: "q1",
    dimension: "energiefluss",
    text: "Es ist früher Morgen. Du wachst auf, noch bevor der Wecker klingelt.",
    context: "In diesen ersten Momenten des Tages zeigt sich, wie deine Energie natürlich fließt.",
    options: [
      { id: "a", text: "Ich bleibe noch liegen, lasse die Gedanken kommen und gehen. Der Tag kann warten.", scores: { energiefluss: 1 }, markers: [{ id: "marker.energy.introversion", weight: 0.1 }] },
      { id: "b", text: "Ich checke kurz das Handy — nicht aus Stress, sondern aus Neugier auf die Welt.", scores: { energiefluss: 4 }, markers: [{ id: "marker.energy.curiosity", weight: 0.08 }] },
      { id: "c", text: "Ich stehe auf und starte meinen Tag. Energie, die still liegt, fühlt sich verschwendet an.", scores: { energiefluss: 5 }, markers: [{ id: "marker.energy.projection", weight: 0.1 }] },
      { id: "d", text: "Ich spüre erst in mich hinein. Wie fühlt sich heute an? Dann entscheide ich, wie ich beginne.", scores: { energiefluss: 2 }, markers: [{ id: "marker.energy.introspection", weight: 0.08 }] }
    ]
  },
  {
    id: "q2",
    dimension: "energiefluss",
    text: "Du verbringst einen Tag allein. Niemand erwartet etwas von dir.",
    context: "Wie du mit unstrukturierter Zeit umgehst, offenbart deine innere Energierichtung.",
    options: [
      { id: "a", text: "Ich genieße die Stille. Zeit zum Lesen, Nachdenken, einfach Sein.", scores: { energiefluss: 1 }, markers: [{ id: "marker.energy.solitude", weight: 0.1 }] },
      { id: "b", text: "Ich plane irgendwann rauszugehen. Ein Café, ein Park — Menschen beobachten.", scores: { energiefluss: 3 }, markers: [{ id: "marker.energy.observation", weight: 0.06 }] },
      { id: "c", text: "Ich rufe jemanden an oder schreibe Nachrichten. Alleinsein ist schön, aber geteilte Energie ist besser.", scores: { energiefluss: 5 }, markers: [{ id: "marker.energy.connection", weight: 0.1 }] },
      { id: "d", text: "Ich mache ein Projekt, das ich vor mir hergeschoben habe. Endlich Raum dafür.", scores: { energiefluss: 2 }, markers: [{ id: "marker.energy.productivity", weight: 0.08 }] }
    ]
  },
  {
    id: "q3",
    dimension: "energiefluss",
    text: "Nach einem langen, intensiven Tag fühlst du dich erschöpft.",
    context: "Wie du Energie zurückgewinnst, zeigt, woher deine Kraft wirklich kommt.",
    options: [
      { id: "a", text: "Ich brauche absolute Ruhe. Kopfhörer rein, Welt aus.", scores: { energiefluss: 1 }, markers: [{ id: "marker.energy.recharge_alone", weight: 0.1 }] },
      { id: "b", text: "Ein ruhiger Spaziergang hilft. Bewegung ohne Ziel.", scores: { energiefluss: 2 }, markers: [{ id: "marker.energy.movement", weight: 0.08 }] },
      { id: "c", text: "Ich brauche einen Menschen, dem ich alles erzählen kann. Das Aussprechen hilft.", scores: { energiefluss: 4 }, markers: [{ id: "marker.energy.verbal_processing", weight: 0.08 }] },
      { id: "d", text: "Ich gehe unter Leute — ein Abend mit Freunden lädt mich auf, selbst wenn ich müde bin.", scores: { energiefluss: 5 }, markers: [{ id: "marker.energy.recharge_social", weight: 0.1 }] }
    ]
  },
  
  // RHYTHMUS (Q4-Q6)
  {
    id: "q4",
    dimension: "rhythmus",
    text: "Ein Projekt, an dem du arbeitest, verläuft anders als geplant.",
    context: "Wie du mit Veränderung umgehst, offenbart deinen inneren Rhythmus.",
    options: [
      { id: "a", text: "Ich passe mich an. Pläne sind Richtungen, keine Gesetze.", scores: { rhythmus: 5 }, markers: [{ id: "marker.rhythm.adaptive", weight: 0.1 }] },
      { id: "b", text: "Ich halte kurz inne und überdenke die Strategie. Dann weiter.", scores: { rhythmus: 3 }, markers: [{ id: "marker.rhythm.strategic", weight: 0.06 }] },
      { id: "c", text: "Ich versuche, zum ursprünglichen Plan zurückzukehren. Struktur gibt mir Sicherheit.", scores: { rhythmus: 1 }, markers: [{ id: "marker.rhythm.structured", weight: 0.1 }] },
      { id: "d", text: "Ich sehe es als Chance — manchmal führen Umwege zu besseren Zielen.", scores: { rhythmus: 4 }, markers: [{ id: "marker.rhythm.opportunistic", weight: 0.08 }] }
    ]
  },
  {
    id: "q5",
    dimension: "rhythmus",
    text: "Du betrittst einen Raum voller Fremder bei einer Veranstaltung.",
    context: "Dein erstes Instinkt in neuen sozialen Situationen spiegelt deinen Lebensrhythmus.",
    options: [
      { id: "a", text: "Ich beobachte erst. Wer ist hier? Wie ist die Dynamik? Dann wähle ich.", scores: { rhythmus: 1 }, markers: [{ id: "marker.rhythm.observer", weight: 0.1 }] },
      { id: "b", text: "Ich suche eine vertraute Ecke oder eine Aufgabe — das Buffet checken, zum Beispiel.", scores: { rhythmus: 2 }, markers: [{ id: "marker.rhythm.comfort_seeker", weight: 0.08 }] },
      { id: "c", text: "Ich gehe auf die erste Person zu, die offen wirkt. Smalltalk ist eine Fähigkeit.", scores: { rhythmus: 4 }, markers: [{ id: "marker.rhythm.initiator", weight: 0.08 }] },
      { id: "d", text: "Ich lasse mich treiben. Gespräche passieren oder nicht. Kein Druck.", scores: { rhythmus: 5 }, markers: [{ id: "marker.rhythm.flow", weight: 0.1 }] }
    ]
  },
  {
    id: "q6",
    dimension: "rhythmus",
    text: "Wie würdest du deinen idealen Lebensweg beschreiben?",
    context: "Diese Metapher zeigt, wie du Stabilität und Wandel in Balance bringst.",
    options: [
      { id: "a", text: "Ein tiefes Tal mit hohen Bergen drumherum. Geschützt, ruhig, mein Reich.", scores: { rhythmus: 1 }, markers: [{ id: "marker.rhythm.sanctuary", weight: 0.1 }] },
      { id: "b", text: "Ein Fluss, der sich durch verschiedene Landschaften windet. Stetig, aber wandelnd.", scores: { rhythmus: 3 }, markers: [{ id: "marker.rhythm.steady_flow", weight: 0.06 }] },
      { id: "c", text: "Ein Vogel, der von Ast zu Ast springt. Freiheit, Neugier, Leichtigkeit.", scores: { rhythmus: 5 }, markers: [{ id: "marker.rhythm.freedom", weight: 0.1 }] },
      { id: "d", text: "Ein Baum mit tiefen Wurzeln und Ästen, die sich dem Wind beugen.", scores: { rhythmus: 2 }, markers: [{ id: "marker.rhythm.rooted_flexible", weight: 0.08 }] }
    ]
  },
  
  // WAHRNEHMUNG (Q7-Q9)
  {
    id: "q7",
    dimension: "wahrnehmung",
    text: "Du musst eine wichtige Entscheidung treffen.",
    context: "Wie du zu Klarheit kommst, zeigt deinen bevorzugten Wahrnehmungsmodus.",
    options: [
      { id: "a", text: "Ich sammle Fakten, mache vielleicht eine Pro-Contra-Liste. Daten beruhigen.", scores: { wahrnehmung: 1 }, markers: [{ id: "marker.perception.analytical", weight: 0.1 }] },
      { id: "b", text: "Ich spüre in meinen Bauch. Die Antwort ist da, ich muss sie nur hören.", scores: { wahrnehmung: 5 }, markers: [{ id: "marker.perception.intuitive", weight: 0.1 }] },
      { id: "c", text: "Ich spreche mit Menschen, die ich respektiere. Ihre Perspektiven helfen.", scores: { wahrnehmung: 3 }, markers: [{ id: "marker.perception.collaborative", weight: 0.06 }] },
      { id: "d", text: "Ich schlafe eine Nacht darüber. Die Antwort kommt, wenn ich loslasse.", scores: { wahrnehmung: 4 }, markers: [{ id: "marker.perception.subconscious", weight: 0.08 }] }
    ]
  },
  {
    id: "q8",
    dimension: "wahrnehmung",
    text: "Du begegnest jemandem zum ersten Mal.",
    context: "Der erste Eindruck offenbart, wie du die Welt wahrnimmst.",
    options: [
      { id: "a", text: "Ich achte auf Körpersprache, Energie — das Ungesagte sagt mehr als Worte.", scores: { wahrnehmung: 5 }, markers: [{ id: "marker.perception.nonverbal", weight: 0.1 }] },
      { id: "b", text: "Ich höre zu, was sie sagen und wie. Die Wortwahl verrät viel.", scores: { wahrnehmung: 2 }, markers: [{ id: "marker.perception.verbal", weight: 0.08 }] },
      { id: "c", text: "Ich beobachte, wie sie mit anderen interagieren. Kontext ist alles.", scores: { wahrnehmung: 1 }, markers: [{ id: "marker.perception.contextual", weight: 0.1 }] },
      { id: "d", text: "Ich folge meinem Gefühl. Manchmal weiß man einfach, ob es passt.", scores: { wahrnehmung: 4 }, markers: [{ id: "marker.perception.gut_feeling", weight: 0.08 }] }
    ]
  },
  {
    id: "q9",
    dimension: "wahrnehmung",
    text: "Wenn du an deine erfolgreichsten Momente denkst:",
    context: "Woher kam die Klarheit in deinen Sternstunden?",
    options: [
      { id: "a", text: "Sie kamen aus sorgfältiger Vorbereitung. Ich hatte einen Plan.", scores: { wahrnehmung: 1 }, markers: [{ id: "marker.perception.preparation", weight: 0.1 }] },
      { id: "b", text: "Ich wusste einfach, was zu tun war. Keine Erklärung, nur Gewissheit.", scores: { wahrnehmung: 5 }, markers: [{ id: "marker.perception.knowing", weight: 0.1 }] },
      { id: "c", text: "Ich habe auf andere gehört und zur richtigen Zeit das Richtige getan.", scores: { wahrnehmung: 3 }, markers: [{ id: "marker.perception.responsive", weight: 0.06 }] },
      { id: "d", text: "Es war eine Mischung — Vorbereitung trifft auf Instinkt im entscheidenden Moment.", scores: { wahrnehmung: 4 }, markers: [{ id: "marker.perception.integrated", weight: 0.08 }] }
    ]
  },
  
  // RESONANZ (Q10-Q12)
  {
    id: "q10",
    dimension: "resonanz",
    text: "Du bist in einem Gespräch mit einem Freund, der gerade etwas Schwieriges durchmacht.",
    context: "Wie du auf emotionale Nähe reagierst, zeigt deine soziale Resonanz.",
    options: [
      { id: "a", text: "Ich höre zu und halte den Raum. Manchmal ist Präsenz wichtiger als Worte.", scores: { resonanz: 1 }, markers: [{ id: "marker.resonance.holding_space", weight: 0.1 }] },
      { id: "b", text: "Ich spüre ihren Schmerz fast körperlich. Empathie ist kein Schalter.", scores: { resonanz: 2 }, markers: [{ id: "marker.resonance.absorbing", weight: 0.08 }] },
      { id: "c", text: "Ich versuche zu helfen — konkrete Vorschläge, Lösungen, Perspektiven.", scores: { resonanz: 4 }, markers: [{ id: "marker.resonance.solution_oriented", weight: 0.08 }] },
      { id: "d", text: "Ich teile eigene Erfahrungen. Manchmal hilft zu wissen, dass man nicht allein ist.", scores: { resonanz: 5 }, markers: [{ id: "marker.resonance.sharing", weight: 0.1 }] }
    ]
  },
  {
    id: "q11",
    dimension: "resonanz",
    text: "Du betrittst einen Raum nach einem emotionalen Gespräch zwischen anderen.",
    context: "Wie du auf Atmosphären reagierst, zeigt deine energetische Sensibilität.",
    options: [
      { id: "a", text: "Ich spüre sofort, dass etwas war. Die Luft fühlt sich anders an.", scores: { resonanz: 1 }, markers: [{ id: "marker.resonance.highly_sensitive", weight: 0.1 }] },
      { id: "b", text: "Ich bemerke es erst, wenn jemand etwas sagt oder sich seltsam verhält.", scores: { resonanz: 4 }, markers: [{ id: "marker.resonance.verbal_cues", weight: 0.08 }] },
      { id: "c", text: "Ich nehme es wahr, aber es beeinflusst mich nicht stark. Ich bin bei mir.", scores: { resonanz: 5 }, markers: [{ id: "marker.resonance.grounded", weight: 0.1 }] },
      { id: "d", text: "Ich nehme die Schwere mit. Es dauert, bis ich sie wieder loswerde.", scores: { resonanz: 2 }, markers: [{ id: "marker.resonance.absorbing_emotions", weight: 0.08 }] }
    ]
  },
  {
    id: "q12",
    dimension: "resonanz",
    text: "Wenn du an deine Rolle in Gruppen denkst:",
    context: "Deine natürliche Position im sozialen Gefüge offenbart deine Resonanzfrequenz.",
    options: [
      { id: "a", text: "Ich bin oft der Ruhepol. Andere kommen zu mir, wenn sie Halt brauchen.", scores: { resonanz: 1 }, markers: [{ id: "marker.resonance.anchor", weight: 0.1 }] },
      { id: "b", text: "Ich passe mich an. Jede Gruppe braucht etwas anderes, und ich fülle die Lücke.", scores: { resonanz: 2 }, markers: [{ id: "marker.resonance.adaptive", weight: 0.08 }] },
      { id: "c", text: "Ich bringe Energie ein. Oft bin ich es, der Ideen oder Pläne vorantreibt.", scores: { resonanz: 5 }, markers: [{ id: "marker.resonance.energizer", weight: 0.1 }] },
      { id: "d", text: "Ich verbinde Menschen. Ich sehe, wer zusammenpasst, und baue Brücken.", scores: { resonanz: 4 }, markers: [{ id: "marker.resonance.connector", weight: 0.08 }] }
    ]
  }
];

export interface AuraProfile {
  id: string;
  color: string;
  title: string;
  archetype: string;
  tagline: string;
  chakra: string;
  element: string;
  stats: Array<{ label: string; value: string }>;
  allies: string[];
  nemesis: string[];
  share_text: string;
  description: string;
  markers: Array<{ id: string; weight: number }>;
}

export const profiles: Record<string, AuraProfile> = {
  rot: {
    id: "rot",
    color: "#C45D4A",
    title: "Leuchtendes Rot",
    archetype: "Die Lebendige Flamme",
    tagline: "Du bist die Kraft, die Räume verändert, noch bevor du ein Wort sagst — pure Lebensenergie in menschlicher Form.",
    chakra: "Wurzelchakra (Muladhara)",
    element: "feuer",
    stats: [
      { label: "Präsenz", value: "97%" },
      { label: "Leidenschaft", value: "94%" },
      { label: "Ungeduld", value: "78%" },
      { label: "Magnetismus", value: "Unbegrenzt" }
    ],
    allies: ["orange", "gelb"],
    nemesis: ["blau", "violett"],
    share_text: "Meine Aura leuchtet in Rot. Pure Lebensenergie! Welche Farbe strahlt in dir?",
    description: `Rot ist die Farbe des Anfangs — des ersten Atemzugs, des ersten Herzschlags, des ersten Funkens, der alles in Bewegung setzt. Deine Aura vibriert in dieser Urfrequenz: pure, ungefilterte Lebenskraft.

Du bist mit dem Wurzelchakra verbunden — jenem Energiezentrum, das uns im Körper verankert, im Hier und Jetzt, in der physischen Realität. Bei dir ist diese Verbindung außergewöhnlich stark. Du lebst nicht im Konjunktiv. Du bist hier.

Dein Geschenk ist die Fähigkeit zur Präsenz. Wenn du einen Raum betrittst, verändert sich die Atmosphäre. Nicht durch Lautstärke — manchmal gerade durch deine Stille. Es ist eine Kraft, die andere spüren, bevor sie dich sehen.

Der Schatten des Roten ist die Ungeduld. Die brennende Frustration, wenn andere langsamer sind. Die Tendenz, zu handeln, bevor du nachgedacht hast. Manchmal brennt die Flamme zu heiß und verzehrt, was sie eigentlich wärmen sollte.

Deine Aura flüstert: "Du musst niemandem beweisen, dass du lebendig bist. Du bist es. Atme. Und wähle, wohin du deine Flamme trägst."`,
    markers: [
      { id: "marker.aura.rot", weight: 0.8 },
      { id: "marker.element.feuer", weight: 0.4 }
    ]
  },
  
  orange: {
    id: "orange",
    color: "#E07B39",
    title: "Warmes Orange",
    archetype: "Der Kreative Strom",
    tagline: "Du bist die Freude, die ansteckend ist — der Mensch, neben dem sich das Leben ein bisschen mehr nach Abenteuer anfühlt.",
    chakra: "Sakralchakra (Svadhisthana)",
    element: "feuer",
    stats: [
      { label: "Kreativität", value: "96%" },
      { label: "Spontanität", value: "91%" },
      { label: "Beständigkeit", value: "43%" },
      { label: "Lebensfreude", value: "Unbegrenzt" }
    ],
    allies: ["rot", "gelb"],
    nemesis: ["indigo", "blau"],
    share_text: "Meine Aura leuchtet in Orange. Kreative Lebensfreude! Welche Farbe strahlt in dir?",
    description: `Orange ist die Farbe des Spiels, der Freude, der unbeschwerten Kreativität. Deine Aura pulsiert in dieser warmen Frequenz wie ein ewiger Sonnenuntergang — lebendig, einladend, nie ganz greifbar.

Du trägst das Sakralchakra in besonderer Intensität — das Zentrum der Emotionen, der Sinnlichkeit, der schöpferischen Kraft. Bei dir fließt diese Energie frei und ungezwungen. Du erschaffst, weil es sich gut anfühlt. Du verbindest dich, weil Nähe natürlich ist.

Dein Geschenk ist die Fähigkeit, andere zum Leuchten zu bringen. In deiner Nähe erlauben sich Menschen, leichter zu sein. Du erinnerst sie daran, dass das Leben nicht nur Arbeit ist.

Der Schatten des Oranges ist die Unbeständigkeit. Die Schwierigkeit, bei einer Sache zu bleiben, wenn der Reiz des Neuen lockt. Manchmal verwechselst du Tiefe mit Langeweile.

Deine Aura flüstert: "Deine Leichtigkeit ist keine Oberflächlichkeit. Sie ist ein Geschenk. Aber vergiss nicht: Auch der Strom braucht ein Bett, um zu fließen."`,
    markers: [
      { id: "marker.aura.orange", weight: 0.8 },
      { id: "marker.element.feuer", weight: 0.3 }
    ]
  },
  
  gelb: {
    id: "gelb",
    color: "#D4AF37",
    title: "Goldgelb",
    archetype: "Der Leuchtende Intellekt",
    tagline: "Du bist die Sonne im Raum — Klarheit, Wärme und die Kraft, andere zum Wachsen zu bringen.",
    chakra: "Solarplexus-Chakra (Manipura)",
    element: "feuer",
    stats: [
      { label: "Innere Klarheit", value: "94%" },
      { label: "Schöpferkraft", value: "87%" },
      { label: "Ungeduld", value: "103%" },
      { label: "Versteckte Tiefe", value: "Unbegrenzt" }
    ],
    allies: ["indigo", "gruen"],
    nemesis: ["rot", "orange"],
    share_text: "Meine Aura leuchtet in Goldgelb. Klarheit trifft Wärme! Welche Farbe strahlt in dir?",
    description: `Goldgelb ist die Farbe der Sonne, des Verstandes, der klaren Erkenntnis. Deine Aura strahlt in dieser Frequenz wie das erste Licht nach der Morgendämmerung — hell, warm, erhellend.

Du bist mit dem Solarplexus-Chakra verbunden — dem Zentrum der persönlichen Macht, des Selbstwerts, der geistigen Klarheit. Bei dir brennt dieses Feuer mit besonderer Intensität. Du verstehst Dinge, bevor andere sie erklären können. Du siehst Muster, wo andere Chaos sehen.

Dein Geschenk ist die Fähigkeit zur Synthese. Du nimmst komplexe Ideen und machst sie zugänglich. In deiner Nähe verstehen Menschen Dinge, die sie vorher nicht greifen konnten.

Der Schatten des Gelbs ist die Ungeduld mit jenen, die langsamer denken. Die Tendenz, zu viel allein tragen zu wollen. Manchmal vergisst die Sonne, dass auch sie Dunkelheit braucht, um zu leuchten.

Deine Aura flüstert: "Vertraue deinem inneren Kompass. Er hat dich hierher geführt — und er wird dich weiterführen."`,
    markers: [
      { id: "marker.aura.gelb", weight: 0.8 },
      { id: "marker.element.feuer", weight: 0.3 }
    ]
  },
  
  gruen: {
    id: "gruen",
    color: "#4A8F6F",
    title: "Tiefes Grün",
    archetype: "Der Stille Heiler",
    tagline: "Du bist der Baum, an dem sich andere ausruhen — ohne zu wissen, wie tief deine Wurzeln reichen.",
    chakra: "Herzchakra (Anahata)",
    element: "erde",
    stats: [
      { label: "Heilende Präsenz", value: "98%" },
      { label: "Stilles Verständnis", value: "91%" },
      { label: "Heimlicher Neid", value: "23%" },
      { label: "Wurzeltiefe", value: "Unbegrenzt" }
    ],
    allies: ["blau", "gelb"],
    nemesis: ["violett", "rot"],
    share_text: "Meine Aura leuchtet in Tiefem Grün. Stille Heilkraft! Welche Farbe strahlt in dir?",
    description: `Grün ist die Farbe der Mitte — zwischen Himmel und Erde, zwischen Geben und Nehmen. Deine Aura vibriert in diesem Spektrum wie ein Wald nach dem Regen: lebendig, erneuernd, still kraftvoll.

Du trägst das Herzchakra in seiner reinsten Form. Nicht das sentimentale, überflutete Herz — sondern das Herz, das hält. Das aushält. Das Raum schafft, in dem andere atmen können, ohne dass du dabei ersticken musst.

Dein Geschenk ist die Fähigkeit zur echten Präsenz. Wenn du zuhörst, dann hörst du. Wenn du hältst, dann hältst du. Diese Qualität ist seltener, als du denkst.

Der Schatten des Grüns ist die Neigung, dich selbst zu vergessen, während du andere nährst. Die stille Frage, ob du genug gibst. Der Neid, der manchmal aufsteigt, wenn du siehst, wie leicht sich andere nehmen, was sie brauchen.

Deine Aura flüstert: "Du bist nicht hier, um zu retten. Du bist hier, um Raum zu halten — auch für dich selbst."`,
    markers: [
      { id: "marker.aura.gruen", weight: 0.8 },
      { id: "marker.element.erde", weight: 0.4 }
    ]
  },
  
  blau: {
    id: "blau",
    color: "#4A7EB5",
    title: "Klares Blau",
    archetype: "Die Ruhige Wahrheit",
    tagline: "Du bist der stille See, in dem andere ihr Spiegelbild finden — auch wenn sie nicht immer bereit sind, hinzusehen.",
    chakra: "Halschakra (Vishuddha)",
    element: "wasser",
    stats: [
      { label: "Authentizität", value: "95%" },
      { label: "Innere Ruhe", value: "89%" },
      { label: "Ausdrucksschwere", value: "34%" },
      { label: "Tiefe", value: "Unbegrenzt" }
    ],
    allies: ["gruen", "indigo"],
    nemesis: ["orange", "rot"],
    share_text: "Meine Aura leuchtet in Klarem Blau. Ruhige Wahrheit! Welche Farbe strahlt in dir?",
    description: `Blau ist die Farbe der Weite — des Himmels über dir, des Ozeans, der Unendlichkeit. Deine Aura schwingt in dieser Frequenz wie ein klarer Wintertag: ruhig, weiträumig, von einer Schönheit, die keinen Beweis braucht.

Du bist mit dem Halschakra verbunden — dem Zentrum der Wahrheit, der Kommunikation, des authentischen Ausdrucks. Bei dir hat dieses Chakra eine besondere Tiefe. Nicht die Tiefe des Vielredens — sondern die Tiefe der Worte, die wirklich zählen.

Dein Geschenk ist die Fähigkeit zur Wahrhaftigkeit. Du sagst, was du meinst. Du meinst, was du sagst. In einer Welt der Oberflächen bist du die Erinnerung daran, dass Tiefe existiert.

Der Schatten des Blauen ist die Schwierigkeit, in den Fluss zu kommen. Die Tendenz, Gedanken zu lange zu halten, bevor du sie teilst. Manchmal wird die Stille zur Mauer.

Deine Aura flüstert: "Deine Worte haben Gewicht. Aber manchmal braucht die Welt nicht deine perfekte Wahrheit — manchmal braucht sie nur deine ehrliche Stimme."`,
    markers: [
      { id: "marker.aura.blau", weight: 0.8 },
      { id: "marker.element.wasser", weight: 0.4 }
    ]
  },
  
  indigo: {
    id: "indigo",
    color: "#5C4D9A",
    title: "Mystisches Indigo",
    archetype: "Der Wanderer zwischen Welten",
    tagline: "Du siehst, was hinter den Dingen liegt — und trägst das Gewicht des Wissens mit Anmut.",
    chakra: "Stirnchakra (Ajna)",
    element: "aether",
    stats: [
      { label: "Intuitive Treffsicherheit", value: "97%" },
      { label: "Drittes-Auge-Aktivität", value: "89%" },
      { label: "Soziale Tarnung", value: "64%" },
      { label: "Verborgene Welten", value: "1.247" }
    ],
    allies: ["violett", "gelb"],
    nemesis: ["orange", "rot"],
    share_text: "Meine Aura leuchtet in Indigo. Zwischen den Welten! Welche Farbe strahlt in dir?",
    description: `Indigo ist keine alltägliche Farbe. Sie liegt im Spektrum zwischen Blau und Violett — an der Schwelle zur Unsichtbarkeit. Deine Aura vibriert in dieser Frequenz wie der Himmel in der letzten Stunde vor der Nacht: tiefgründig, übergangsreich, voller unausgesprochener Wahrheiten.

Du bist mit dem Stirnchakra verbunden — dem dritten Auge, das nicht mit den physischen Augen sieht. Du nimmst Zwischentöne wahr, die anderen entgehen. Die Pause zwischen den Worten. Die Absicht hinter der Geste.

Dein Geschenk ist die Fähigkeit zur Wahrnehmung jenseits des Offensichtlichen. Du verstehst Dinge, bevor du sie erklären kannst. Und manchmal ist das Verstehen einsam.

Der Schatten des Indigo ist die Isolation. Die Versuchung, dich in deiner eigenen Wahrnehmungswelt zu verlieren. Die Schwierigkeit, andere dort abzuholen, wo sie stehen.

Deine Aura flüstert: "Dein Sehen ist ein Geschenk. Aber vergiss nicht, dass auch das Herz ein Auge hat."`,
    markers: [
      { id: "marker.aura.indigo", weight: 0.8 },
      { id: "marker.element.aether", weight: 0.4 }
    ]
  },
  
  violett: {
    id: "violett",
    color: "#8B5A9F",
    title: "Transzendentes Violett",
    archetype: "Der Kosmische Träumer",
    tagline: "Du lebst mit einem Fuß in einer Welt, die andere nur ahnen können — und bist die Brücke zwischen dem Hier und dem Dahinter.",
    chakra: "Kronenchakra (Sahasrara)",
    element: "aether",
    stats: [
      { label: "Spirituelle Offenheit", value: "99%" },
      { label: "Kreative Vision", value: "93%" },
      { label: "Erdung", value: "41%" },
      { label: "Kosmische Downloads", value: "Unbegrenzt" }
    ],
    allies: ["indigo", "tuerkis"],
    nemesis: ["rot", "gruen"],
    share_text: "Meine Aura leuchtet in Violett. Kosmischer Träumer! Welche Farbe strahlt in dir?",
    description: `Violett ist die Farbe der Transformation — der Punkt, an dem das sichtbare Licht in das Unsichtbare übergeht. Deine Aura schwingt in dieser höchsten Frequenz des Spektrums: ätherisch, transformativ, grenzüberschreitend.

Du trägst das Kronenchakra in besonderer Intensität — jene Verbindung zum Größeren, zum Kosmischen, zum Numinosen. Bei dir ist diese Antenne fein eingestellt. Du empfängst, was andere nicht hören.

Dein Geschenk ist die Fähigkeit zur Vision. Du siehst Möglichkeiten, die noch nicht existieren. Du träumst Welten, bevor sie wahr werden können.

Der Schatten des Violetts ist die Schwierigkeit, geerdet zu bleiben. Die Versuchung, in den höheren Sphären zu verweilen und die Mühen des Alltags zu meiden. Manchmal vergisst der Träumer, dass auch Träume im Körper beginnen.

Deine Aura flüstert: "Du bist hier, um Brücken zu bauen — zwischen dem, was ist, und dem, was sein könnte. Aber vergiss nicht, auf welcher Seite du stehst."`,
    markers: [
      { id: "marker.aura.violett", weight: 0.8 },
      { id: "marker.element.aether", weight: 0.4 }
    ]
  },
  
  tuerkis: {
    id: "tuerkis",
    color: "#3AA19A",
    title: "Schimmerndes Türkis",
    archetype: "Der Harmonische Kommunikator",
    tagline: "Du bist die Brücke zwischen Herz und Verstand — ein Übersetzer zwischen Welten, die nicht wissen, dass sie sich brauchen.",
    chakra: "Herz-Hals-Verbindung",
    element: "wasser",
    stats: [
      { label: "Empathische Intelligenz", value: "96%" },
      { label: "Kommunikationsklarheit", value: "92%" },
      { label: "Entscheidungsstärke", value: "58%" },
      { label: "Heilende Worte", value: "Unbegrenzt" }
    ],
    allies: ["gruen", "blau"],
    nemesis: ["rot", "orange"],
    share_text: "Meine Aura leuchtet in Türkis. Harmonische Kommunikation! Welche Farbe strahlt in dir?",
    description: `Türkis ist die Farbe der Integration — dort, wo das nährende Grün des Herzens auf das klare Blau der Kommunikation trifft. Deine Aura schillert in diesem besonderen Zwischenreich: flüssig, heilend, verbindend.

Du vereinst das Herzchakra mit dem Halschakra auf eine Weise, die selten ist. Du kannst fühlen und das Gefühlte in Worte fassen. Du verstehst und kannst das Verstandene vermitteln.

Dein Geschenk ist die Fähigkeit zur heilenden Kommunikation. Deine Worte erreichen Menschen dort, wo sie es brauchen. Du bist die Person, die sagt, was alle denken, aber niemand auszusprechen wagt.

Der Schatten des Türkis ist das Zwischen-den-Stühlen-Sitzen. Die Schwierigkeit, Stellung zu beziehen, wenn beide Seiten Recht haben. Manchmal paralysiert dich die Fähigkeit, alles zu verstehen.

Deine Aura flüstert: "Du musst nicht wählen zwischen Herz und Verstand. Du bist beides. Und genau das braucht die Welt."`,
    markers: [
      { id: "marker.aura.tuerkis", weight: 0.8 },
      { id: "marker.element.wasser", weight: 0.4 }
    ]
  },
  
  rosa: {
    id: "rosa",
    color: "#D4789A",
    title: "Sanftes Rosa",
    archetype: "Der Bedingungslose Liebende",
    tagline: "Du bist die Erinnerung daran, dass Sanftheit eine Stärke ist — und dass wahre Liebe keine Bedingungen kennt.",
    chakra: "Höheres Herzchakra",
    element: "wasser",
    stats: [
      { label: "Bedingungslose Liebe", value: "97%" },
      { label: "Emotionale Intelligenz", value: "94%" },
      { label: "Selbstschutz", value: "34%" },
      { label: "Herzöffnung", value: "Unbegrenzt" }
    ],
    allies: ["gruen", "violett"],
    nemesis: ["rot", "gelb"],
    share_text: "Meine Aura leuchtet in Rosa. Bedingungslose Liebe! Welche Farbe strahlt in dir?",
    description: `Rosa ist die Farbe der bedingungslosen Liebe — nicht der romantischen, sondern der tiefen, alles umfassenden Güte. Deine Aura schwingt in diesem zarten Spektrum wie der erste Moment eines Sonnenaufgangs: sanft, hoffnungsvoll, erneuernd.

Du trägst eine besondere Ausprägung des Herzchakras — eines, das über persönliche Beziehungen hinausreicht. Du liebst nicht, weil du etwas bekommst. Du liebst, weil du nicht anders kannst.

Dein Geschenk ist die Fähigkeit zur Güte ohne Agenda. In deiner Nähe fühlen sich Menschen angenommen, wie sie sind. Du urteilst nicht — du verstehst.

Der Schatten des Rosas ist die Verletzbarkeit. Die Tendenz, dein Herz so weit zu öffnen, dass du vergisst, es zu schützen. Manchmal verwechselst du Liebe mit Selbstaufgabe.

Deine Aura flüstert: "Deine Sanftheit ist deine Stärke. Aber vergiss nicht: Du verdienst dieselbe Liebe, die du gibst."`,
    markers: [
      { id: "marker.aura.rosa", weight: 0.8 },
      { id: "marker.element.wasser", weight: 0.3 }
    ]
  }
};

export interface ElementInfo {
  id: string;
  name: string;
  description: string;
}

export const elements: Record<string, ElementInfo> = {
  feuer: {
    id: "feuer",
    name: "Feuer",
    description: "Das Feuer in dir ist keine Zerstörung — es ist Alchemie. Du transformierst, was du berührst."
  },
  wasser: {
    id: "wasser",
    name: "Wasser",
    description: "Wie Wasser nimmst du die Form deiner Umgebung an, ohne deine Essenz zu verlieren."
  },
  erde: {
    id: "erde",
    name: "Erde",
    description: "Du bist der Anker, auch wenn du es selbst nicht siehst. In einer Welt des Wandels bist du das, was bleibt."
  },
  luft: {
    id: "luft",
    name: "Luft",
    description: "Du denkst in Möglichkeiten, atmest in Freiheit. Der Wind braucht manchmal einen Ort zum Ruhen."
  },
  aether: {
    id: "aether",
    name: "Äther",
    description: "Du gehörst zu keinem Element vollständig — und zu allen gleichzeitig. Das macht dich zum Wanderer zwischen Welten."
  }
};

// Scoring functions
export type DimensionScores = Record<string, number>;

export interface NormalizedScores {
  energiefluss: number;
  rhythmus: number;
  wahrnehmung: number;
  resonanz: number;
}

const MAX_PER_DIMENSION = 15; // 3 questions per dimension, max 5 points each

export function normalizeScores(scores: DimensionScores): NormalizedScores {
  return {
    energiefluss: (scores.energiefluss || 0) / MAX_PER_DIMENSION,
    rhythmus: (scores.rhythmus || 0) / MAX_PER_DIMENSION,
    wahrnehmung: (scores.wahrnehmung || 0) / MAX_PER_DIMENSION,
    resonanz: (scores.resonanz || 0) / MAX_PER_DIMENSION
  };
}

export function calculateColorScores(n: NormalizedScores): Record<string, number> {
  return {
    rot: (n.energiefluss * 0.4) + (n.rhythmus * 0.3) + (n.resonanz * 0.3),
    orange: (n.energiefluss * 0.3) + (n.rhythmus * 0.4) + (n.wahrnehmung * 0.3),
    gelb: (n.energiefluss * 0.25) + ((1 - n.rhythmus) * 0.25) + ((1 - n.wahrnehmung) * 0.5),
    gruen: ((1 - n.energiefluss) * 0.4) + ((1 - n.rhythmus) * 0.3) + ((1 - n.resonanz) * 0.3),
    blau: ((1 - n.energiefluss) * 0.3) + ((1 - n.rhythmus) * 0.3) + ((1 - n.wahrnehmung) * 0.4),
    indigo: ((1 - n.energiefluss) * 0.3) + (n.rhythmus * 0.2) + (n.wahrnehmung * 0.5),
    violett: ((1 - n.energiefluss) * 0.2) + (n.rhythmus * 0.3) + (n.wahrnehmung * 0.3) + ((1 - n.resonanz) * 0.2),
    tuerkis: (Math.abs(n.energiefluss - 0.5) < 0.2 ? 0.3 : 0) + ((1 - n.resonanz) * 0.35) + ((1 - n.wahrnehmung) * 0.35),
    rosa: ((1 - n.energiefluss) * 0.3) + ((1 - n.rhythmus) * 0.2) + (n.wahrnehmung * 0.25) + ((1 - n.resonanz) * 0.25)
  };
}

export function determinePrimaryColor(scores: Record<string, number>): string {
  let maxScore = -1;
  let result = 'gruen';
  
  for (const [color, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      result = color;
    }
  }
  
  return result;
}

export function determineSecondaryColor(scores: Record<string, number>, primaryId: string): string {
  const filteredScores = { ...scores };
  delete filteredScores[primaryId];
  
  let maxScore = -1;
  let result = 'tuerkis';
  
  for (const [color, score] of Object.entries(filteredScores)) {
    if (score > maxScore) {
      maxScore = score;
      result = color;
    }
  }
  
  return result;
}

export function determineElement(n: NormalizedScores): string {
  const elementScores: Record<string, number> = {
    feuer: (n.rhythmus * 0.5) + (n.energiefluss * 0.5),
    wasser: ((1 - n.resonanz) * 0.5) + (n.wahrnehmung * 0.5),
    erde: ((1 - n.rhythmus) * 0.5) + ((1 - n.energiefluss) * 0.5),
    luft: (n.energiefluss * 0.5) + ((1 - n.wahrnehmung) * 0.5),
    aether: (Math.abs(n.energiefluss - 0.5) < 0.15 ? 0.4 : 0) + (n.wahrnehmung * 0.6)
  };
  
  let maxScore = -1;
  let result = 'erde';
  
  for (const [element, score] of Object.entries(elementScores)) {
    if (score > maxScore) {
      maxScore = score;
      result = element;
    }
  }
  
  return result;
}

export const profileNames = Object.fromEntries(
  Object.values(profiles).map(p => [p.id, p.title])
);
