# Neue Cluster-Quizzes: Blumenwesen & Ahnenstein

## Quiz 1: Inneres Blumenwesen

### Meta
```json
{
  "meta": {
    "id": "quiz.blumenwesen.v1",
    "title": "Welches Blumenwesen schlummert in dir?",
    "subtitle": "Entdecke, wie deine Seele erblüht",
    "engine": "custom",
    "skin": "botanical",
    "language": "de",
    "questions_count": 10,
    "estimated_time": "3 Minuten",
    "cluster": "cluster.naturkind.v1",
    "disclaimer": "Dieser Test dient der spielerischen Selbstreflexion und stellt keine botanische oder psychologische Diagnose dar."
  }
}
```

### Konzept

> "Jede Seele trägt die Essenz einer Blume in sich – die Art, wie du wächst, blühst und dich der Welt zeigst. Manche erblühen früh und prächtig, andere brauchen besondere Bedingungen. Manche duften still, andere leuchten weithin. Welches Blumenwesen bist du?"

### Dimensionen

```json
{
  "dimensions": [
    {
      "id": "d1",
      "name": "Nährboden",
      "pole_low": "Chaos-tolerant",
      "pole_high": "Struktur-bedürftig",
      "description": "Brauchst du feste Bedingungen oder gedeiht du überall?"
    },
    {
      "id": "d2", 
      "name": "Blühzeit",
      "pole_low": "Frühblüher",
      "pole_high": "Spätblüher",
      "description": "Zeigst du dich früh oder entfaltest du dich mit der Zeit?"
    },
    {
      "id": "d3",
      "name": "Präsenz",
      "pole_low": "Subtil",
      "pole_high": "Prächtig",
      "description": "Wirkst du durch Stille oder durch Strahlkraft?"
    }
  ]
}
```

### Fragen

```json
{
  "questions": [
    {
      "id": "q1",
      "text": "Du betrittst einen verwilderten Garten. Was fällt dir zuerst auf?",
      "context": "Ein Ort voller ungezähmtem Leben wartet auf dich.",
      "options": [
        {
          "id": "q1a",
          "text": "Die verborgene Ordnung unter dem Chaos",
          "scores": { "d1": 4, "d2": 3, "d3": 2 }
        },
        {
          "id": "q1b",
          "text": "Die wildeste, bunteste Ecke",
          "scores": { "d1": 1, "d2": 2, "d3": 5 }
        },
        {
          "id": "q1c",
          "text": "Den stillen Fleck im Schatten",
          "scores": { "d1": 2, "d2": 4, "d3": 1 }
        },
        {
          "id": "q1d",
          "text": "Die Möglichkeit, alles neu zu gestalten",
          "scores": { "d1": 3, "d2": 1, "d3": 4 }
        }
      ]
    },
    {
      "id": "q2",
      "text": "Wann fühlst du dich am lebendigsten?",
      "options": [
        {
          "id": "q2a",
          "text": "Wenn ich spontan handle, ohne Plan",
          "scores": { "d1": 1, "d2": 1, "d3": 4 }
        },
        {
          "id": "q2b",
          "text": "Wenn alles seinen Platz hat und funktioniert",
          "scores": { "d1": 5, "d2": 3, "d3": 2 }
        },
        {
          "id": "q2c",
          "text": "In ruhigen Momenten der Reflexion",
          "scores": { "d1": 3, "d2": 5, "d3": 1 }
        },
        {
          "id": "q2d",
          "text": "Wenn ich andere zum Strahlen bringe",
          "scores": { "d1": 2, "d2": 2, "d3": 5 }
        }
      ]
    },
    {
      "id": "q3",
      "text": "Ein Sturm zieht auf. Wie reagierst du?",
      "context": "Dunkle Wolken am Horizont.",
      "options": [
        {
          "id": "q3a",
          "text": "Ich biege mich, aber breche nicht",
          "scores": { "d1": 1, "d2": 3, "d3": 3 }
        },
        {
          "id": "q3b",
          "text": "Ich suche Schutz und warte geduldig",
          "scores": { "d1": 4, "d2": 5, "d3": 1 }
        },
        {
          "id": "q3c",
          "text": "Ich genieße die Dramatik des Moments",
          "scores": { "d1": 2, "d2": 1, "d3": 5 }
        },
        {
          "id": "q3d",
          "text": "Ich ziehe mich in meine Wurzeln zurück",
          "scores": { "d1": 3, "d2": 4, "d3": 2 }
        }
      ]
    },
    {
      "id": "q4",
      "text": "Jemand bemerkt dich zum ersten Mal. Wie wirst du wahrgenommen?",
      "options": [
        {
          "id": "q4a",
          "text": "Auffallend und unvergesslich",
          "scores": { "d1": 2, "d2": 1, "d3": 5 }
        },
        {
          "id": "q4b",
          "text": "Zart, aber mit einem Geheimnis",
          "scores": { "d1": 3, "d2": 4, "d3": 2 }
        },
        {
          "id": "q4c",
          "text": "Beruhigend und vertrauenswürdig",
          "scores": { "d1": 4, "d2": 3, "d3": 1 }
        },
        {
          "id": "q4d",
          "text": "Überraschend – man unterschätzt mich erst",
          "scores": { "d1": 1, "d2": 5, "d3": 3 }
        }
      ]
    },
    {
      "id": "q5",
      "text": "Was ist deine größte Stärke im Wachstum?",
      "options": [
        {
          "id": "q5a",
          "text": "Ich brauche wenig, um viel zu werden",
          "scores": { "d1": 1, "d2": 2, "d3": 3 }
        },
        {
          "id": "q5b",
          "text": "Ich verwandle Schwieriges in Schönes",
          "scores": { "d1": 2, "d2": 4, "d3": 4 }
        },
        {
          "id": "q5c",
          "text": "Ich blühe unter den richtigen Bedingungen auf",
          "scores": { "d1": 5, "d2": 5, "d3": 2 }
        },
        {
          "id": "q5d",
          "text": "Ich ziehe andere in meinen Bann",
          "scores": { "d1": 3, "d2": 1, "d3": 5 }
        }
      ]
    },
    {
      "id": "q6",
      "text": "Welche Jahreszeit fühlt sich am meisten nach dir an?",
      "options": [
        {
          "id": "q6a",
          "text": "Frühling – der erste Aufbruch",
          "scores": { "d1": 2, "d2": 1, "d3": 4 }
        },
        {
          "id": "q6b",
          "text": "Sommer – volle Entfaltung",
          "scores": { "d1": 3, "d2": 2, "d3": 5 }
        },
        {
          "id": "q6c",
          "text": "Herbst – gereifte Weisheit",
          "scores": { "d1": 4, "d2": 5, "d3": 2 }
        },
        {
          "id": "q6d",
          "text": "Winter – stille Vorbereitung",
          "scores": { "d1": 5, "d2": 4, "d3": 1 }
        }
      ]
    },
    {
      "id": "q7",
      "text": "Was hinterlässt du bei Menschen?",
      "options": [
        {
          "id": "q7a",
          "text": "Einen Duft, der noch lange bleibt",
          "scores": { "d1": 3, "d2": 4, "d3": 2 }
        },
        {
          "id": "q7b",
          "text": "Ein Bild, das sie nicht vergessen",
          "scores": { "d1": 2, "d2": 1, "d3": 5 }
        },
        {
          "id": "q7c",
          "text": "Ein Gefühl der Ruhe",
          "scores": { "d1": 4, "d2": 3, "d3": 1 }
        },
        {
          "id": "q7d",
          "text": "Samen, die später aufgehen",
          "scores": { "d1": 1, "d2": 5, "d3": 3 }
        }
      ]
    },
    {
      "id": "q8",
      "text": "Du stehst am Rand eines Abgrunds. Was tust du?",
      "context": "Vor dir liegt Unbekanntes.",
      "options": [
        {
          "id": "q8a",
          "text": "Ich lasse meine Wurzeln tiefer greifen",
          "scores": { "d1": 5, "d2": 4, "d3": 1 }
        },
        {
          "id": "q8b",
          "text": "Ich lasse meine Samen über den Abgrund fliegen",
          "scores": { "d1": 1, "d2": 2, "d3": 4 }
        },
        {
          "id": "q8c",
          "text": "Ich blühe genau hier – am Rand",
          "scores": { "d1": 2, "d2": 3, "d3": 5 }
        },
        {
          "id": "q8d",
          "text": "Ich warte, bis jemand eine Brücke baut",
          "scores": { "d1": 4, "d2": 5, "d3": 2 }
        }
      ]
    },
    {
      "id": "q9",
      "text": "Welcher Aspekt des Blühens spricht dich am meisten an?",
      "options": [
        {
          "id": "q9a",
          "text": "Die Transformation – von der Knospe zur Blüte",
          "scores": { "d1": 2, "d2": 4, "d3": 3 }
        },
        {
          "id": "q9b",
          "text": "Die Kurzlebigkeit – intensiv, aber vergänglich",
          "scores": { "d1": 1, "d2": 1, "d3": 5 }
        },
        {
          "id": "q9c",
          "text": "Die Wiederkehr – jedes Jahr aufs Neue",
          "scores": { "d1": 4, "d2": 3, "d3": 2 }
        },
        {
          "id": "q9d",
          "text": "Die Stille danach – die Saat für später",
          "scores": { "d1": 3, "d2": 5, "d3": 1 }
        }
      ]
    },
    {
      "id": "q10",
      "text": "Ein Kind pflückt dich. Wie fühlst du dich?",
      "context": "Du wirst aus deinem Kontext gerissen.",
      "options": [
        {
          "id": "q10a",
          "text": "Geehrt – ich werde zu einem Geschenk",
          "scores": { "d1": 3, "d2": 2, "d3": 4 }
        },
        {
          "id": "q10b",
          "text": "Friedlich – ich habe meinen Zweck erfüllt",
          "scores": { "d1": 4, "d2": 4, "d3": 2 }
        },
        {
          "id": "q10c",
          "text": "Trotzig – meine Wurzeln bleiben",
          "scores": { "d1": 1, "d2": 5, "d3": 3 }
        },
        {
          "id": "q10d",
          "text": "Leuchtend – ich strahle noch intensiver",
          "scores": { "d1": 2, "d2": 1, "d3": 5 }
        }
      ]
    }
  ]
}
```

### Profile

```json
{
  "profiles": [
    {
      "id": "lotus",
      "title": "Der Lotus",
      "emoji": "🪷",
      "tagline": "Du wächst aus dem Schlamm zum Licht",
      "description": "Der Lotus entsteht aus trübem Wasser und erhebt sich makellos über die Oberfläche. Du bist jemand, der aus schwierigen Umständen Schönheit erschafft. Nicht obwohl du Schwieriges erlebt hast, sondern weil du es in Weisheit verwandelt hast. Deine Präsenz ist ruhig, aber unübersehbar – eine stille Kraft, die andere inspiriert. Du brauchst keine perfekten Bedingungen, um zu blühen. Du erschaffst sie.",
      "stats": {
        "Transformation": 95,
        "Stille Präsenz": 80,
        "Tiefgang": 90,
        "Resilienz": 85
      },
      "dimension_ranges": {
        "d1": [1, 3],
        "d2": [3, 5],
        "d3": [2, 4]
      },
      "allies": ["lavender", "orchid"],
      "nemesis": ["sunflower"],
      "share_text": "Ich bin der Lotus 🪷 – Ich wachse aus dem Schlamm zum Licht. Und du?"
    },
    {
      "id": "rose",
      "title": "Die Rose",
      "emoji": "🌹",
      "tagline": "Schönheit mit Dornen – dein Schutz ist Teil deiner Eleganz",
      "description": "Die Rose ist klassisch, begehrt und respektiert – aber niemand fasst sie leichtfertig an. Du verbindest Anmut mit Selbstschutz auf eine Weise, die bewundernswert ist. Deine Schönheit ist nicht oberflächlich; sie kommt mit einer Geschichte, mit Tiefe, mit Grenzen. Wer sich dir nähert, tut es mit Respekt. Deine Dornen sind keine Schwäche – sie sind die Garantie dafür, dass du integer bleibst.",
      "stats": {
        "Eleganz": 95,
        "Selbstschutz": 85,
        "Tiefe": 75,
        "Klassik": 90
      },
      "dimension_ranges": {
        "d1": [3, 5],
        "d2": [2, 4],
        "d3": [3, 5]
      },
      "allies": ["orchid", "lotus"],
      "nemesis": ["wildflower"],
      "share_text": "Ich bin die Rose 🌹 – Schönheit mit Dornen. Und du?"
    },
    {
      "id": "wildflower",
      "title": "Die Wildblume",
      "emoji": "🌸",
      "tagline": "Du brauchst keinen Garten – du erschaffst deinen eigenen",
      "description": "Die Wildblume wächst, wo sie will, nicht wo sie soll. Du bist unabhängig, anpassungsfähig und unzähmbar. Wo andere strukturierte Beete brauchen, gedeiht du auf Wiesen, am Straßenrand, in Mauerritzen. Deine Schönheit liegt in deiner Authentizität – du versuchst nicht, etwas zu sein, du bist einfach. Und genau das macht dich unvergesslich.",
      "stats": {
        "Unabhängigkeit": 95,
        "Anpassungsfähigkeit": 90,
        "Authentizität": 85,
        "Überraschung": 80
      },
      "dimension_ranges": {
        "d1": [1, 2],
        "d2": [1, 3],
        "d3": [3, 5]
      },
      "allies": ["sunflower", "lavender"],
      "nemesis": ["orchid"],
      "share_text": "Ich bin die Wildblume 🌸 – Ich brauche keinen Garten. Und du?"
    },
    {
      "id": "sunflower",
      "title": "Die Sonnenblume",
      "emoji": "🌻",
      "tagline": "Immer dem Licht zugewandt, auch wenn es wandert",
      "description": "Die Sonnenblume ist Optimismus in Pflanzenform. Du richtest dich nach dem Positiven aus, du suchst das Licht, du gibst anderen Wärme. Deine Präsenz ist unmöglich zu übersehen – groß, leuchtend, einladend. Du folgst keiner Dunkelheit, sondern transformierst sie. Wo du stehst, fühlt sich der Tag ein bisschen heller an.",
      "stats": {
        "Optimismus": 95,
        "Strahlkraft": 90,
        "Wärme": 85,
        "Beständigkeit": 75
      },
      "dimension_ranges": {
        "d1": [2, 4],
        "d2": [1, 3],
        "d3": [4, 5]
      },
      "allies": ["wildflower"],
      "nemesis": ["lotus"],
      "share_text": "Ich bin die Sonnenblume 🌻 – Immer dem Licht zugewandt. Und du?"
    },
    {
      "id": "orchid",
      "title": "Die Orchidee",
      "emoji": "🪻",
      "tagline": "Selten, sensibel, faszinierend – du blühst unter besonderen Bedingungen",
      "description": "Die Orchidee ist keine Alltagsblume. Sie braucht bestimmte Bedingungen, um zu gedeihen – aber wenn sie blüht, ist sie atemberaubend. Du bist sensibel für deine Umgebung, wählerisch bei deinen Beziehungen und exquisit in deiner Erscheinung. Manche verstehen dich nicht, und das ist in Ordnung. Du blühst nicht für die Masse – du blühst für die, die wissen, wie selten du bist.",
      "stats": {
        "Sensibilität": 90,
        "Exklusivität": 95,
        "Faszination": 85,
        "Tiefe": 80
      },
      "dimension_ranges": {
        "d1": [4, 5],
        "d2": [4, 5],
        "d3": [3, 5]
      },
      "allies": ["rose", "lotus"],
      "nemesis": ["wildflower"],
      "share_text": "Ich bin die Orchidee 🪻 – Selten, sensibel, faszinierend. Und du?"
    },
    {
      "id": "lavender",
      "title": "Der Lavendel",
      "emoji": "💜",
      "tagline": "Deine Ruhe ist ansteckend, dein Duft bleibt",
      "description": "Lavendel heilt durch Präsenz. Du musst nicht laut sein, um gehört zu werden – dein Wesen wirkt subtil, aber nachhaltig. Menschen fühlen sich in deiner Nähe entspannt, geerdet, sicher. Du bist der Duft, der noch im Zimmer hängt, wenn du längst gegangen bist. Deine Kraft liegt nicht im Auffallen, sondern im Nachwirken.",
      "stats": {
        "Heilende Präsenz": 95,
        "Subtilität": 90,
        "Nachwirkung": 85,
        "Erdung": 80
      },
      "dimension_ranges": {
        "d1": [3, 5],
        "d2": [3, 5],
        "d3": [1, 3]
      },
      "allies": ["lotus", "wildflower"],
      "nemesis": ["sunflower"],
      "share_text": "Ich bin der Lavendel 💜 – Meine Ruhe ist ansteckend. Und du?"
    }
  ]
}
```

### Output-Mapping

```typescript
// Blumenwesen → ContributionEvent Mapping

const flowerQuizOutput = {
  markers: [
    { id: "marker.flower.{profileId}", weight: 0.85 },
    { id: "marker.nature.growth_pattern", weight: dimensionScore("d1") },
    { id: "marker.nature.bloom_timing", weight: dimensionScore("d2") },
    { id: "marker.nature.presence_style", weight: dimensionScore("d3") }
  ],
  traits: [
    { id: "trait.flower.resilience", score: calculateTraitScore("d1_inverse") },
    { id: "trait.flower.timing", score: calculateTraitScore("d2") },
    { id: "trait.flower.visibility", score: calculateTraitScore("d3") }
  ],
  tags: [
    { id: "tag.flower.{profileId}", label: "{profileTitle}", kind: "archetype" }
  ],
  unlocks: [
    { id: "unlock.flowers.{profileId}", unlocked: true, level: 1 }
  ]
};
```

---

## Quiz 2: Dein Ahnenstein

### Meta

```json
{
  "meta": {
    "id": "quiz.ahnenstein.v1",
    "title": "Welcher Ahnenstein trägt deine Essenz?",
    "subtitle": "Entdecke den Kristall deiner Vorfahren",
    "engine": "custom",
    "skin": "elemental",
    "language": "de",
    "questions_count": 10,
    "estimated_time": "3 Minuten",
    "cluster": "cluster.naturkind.v1",
    "disclaimer": "Dieser Test dient der spielerischen Selbstreflexion und stellt keine mineralogische oder spirituelle Diagnose dar."
  }
}
```

### Konzept

> "In der Tiefe der Erde schlummert ein Stein, der deine Essenz trägt – geformt aus dem Druck deiner Ahnen, poliert durch die Zeit, leuchtend durch deine Einzigartigkeit. Welcher Kristall ist die materielle Manifestation deiner Seele?"

### Dimensionen

```json
{
  "dimensions": [
    {
      "id": "d1",
      "name": "Textur",
      "pole_low": "Glatt",
      "pole_high": "Rau",
      "description": "Bevorzugst du Politur oder Natürlichkeit?"
    },
    {
      "id": "d2",
      "name": "Entstehung",
      "pole_low": "Vulkanisch (schnell)",
      "pole_high": "Sedimentär (langsam)",
      "description": "Entstehst du durch Druck und Hitze oder durch geduldige Ablagerung?"
    },
    {
      "id": "d3",
      "name": "Transparenz",
      "pole_low": "Klar",
      "pole_high": "Opak",
      "description": "Bist du durchschaubar oder geheimnisvoll?"
    }
  ]
}
```

### Fragen

```json
{
  "questions": [
    {
      "id": "q1",
      "text": "Du hältst einen alten Gegenstand deiner Großeltern in der Hand. Was fühlst du?",
      "context": "Ein Erbstück mit Geschichte.",
      "options": [
        {
          "id": "q1a",
          "text": "Die Geschichten, die es erlebt hat",
          "scores": { "d1": 4, "d2": 5, "d3": 4 }
        },
        {
          "id": "q1b",
          "text": "Die Energie, die noch darin vibriert",
          "scores": { "d1": 2, "d2": 1, "d3": 2 }
        },
        {
          "id": "q1c",
          "text": "Die Schönheit des Alters",
          "scores": { "d1": 3, "d2": 4, "d3": 3 }
        },
        {
          "id": "q1d",
          "text": "Die Verbindung zu Menschen, die ich nie kannte",
          "scores": { "d1": 1, "d2": 3, "d3": 5 }
        }
      ]
    },
    {
      "id": "q2",
      "text": "Welche Oberfläche zieht dich instinktiv an?",
      "options": [
        {
          "id": "q2a",
          "text": "Spiegelnd glatt, fast flüssig",
          "scores": { "d1": 1, "d2": 1, "d3": 1 }
        },
        {
          "id": "q2b",
          "text": "Kristallin, mit sichtbaren Strukturen",
          "scores": { "d1": 3, "d2": 2, "d3": 2 }
        },
        {
          "id": "q2c",
          "text": "Matt und warm, wie alter Honig",
          "scores": { "d1": 2, "d2": 4, "d3": 3 }
        },
        {
          "id": "q2d",
          "text": "Rau und ungeschliffen, mit Charakter",
          "scores": { "d1": 5, "d2": 3, "d3": 5 }
        }
      ]
    },
    {
      "id": "q3",
      "text": "Wie gehst du mit Druck um?",
      "options": [
        {
          "id": "q3a",
          "text": "Ich werde klarer und fokussierter",
          "scores": { "d1": 1, "d2": 1, "d3": 1 }
        },
        {
          "id": "q3b",
          "text": "Ich transformiere mich völlig",
          "scores": { "d1": 2, "d2": 2, "d3": 3 }
        },
        {
          "id": "q3c",
          "text": "Ich absorbiere ihn langsam",
          "scores": { "d1": 4, "d2": 5, "d3": 4 }
        },
        {
          "id": "q3d",
          "text": "Ich zeige meine wahren Schichten",
          "scores": { "d1": 3, "d2": 4, "d3": 5 }
        }
      ]
    },
    {
      "id": "q4",
      "text": "Was ist deine Beziehung zur Vergangenheit?",
      "options": [
        {
          "id": "q4a",
          "text": "Sie ist eingeschlossen in mir, konserviert",
          "scores": { "d1": 2, "d2": 5, "d3": 3 }
        },
        {
          "id": "q4b",
          "text": "Sie hat mich geschmiedet, aber ich bin neu",
          "scores": { "d1": 1, "d2": 1, "d3": 2 }
        },
        {
          "id": "q4c",
          "text": "Ich trage sie in Schichten, sichtbar",
          "scores": { "d1": 4, "d2": 3, "d3": 4 }
        },
        {
          "id": "q4d",
          "text": "Sie fließt durch mich, wie Licht durch Glas",
          "scores": { "d1": 1, "d2": 2, "d3": 1 }
        }
      ]
    },
    {
      "id": "q5",
      "text": "Du findest einen Stein am Strand. Was macht ihn besonders?",
      "options": [
        {
          "id": "q5a",
          "text": "Seine perfekte Glätte durch die Wellen",
          "scores": { "d1": 1, "d2": 4, "d3": 2 }
        },
        {
          "id": "q5b",
          "text": "Das Funkeln in seinem Inneren",
          "scores": { "d1": 2, "d2": 2, "d3": 1 }
        },
        {
          "id": "q5c",
          "text": "Seine einzigartige, asymmetrische Form",
          "scores": { "d1": 5, "d2": 3, "d3": 5 }
        },
        {
          "id": "q5d",
          "text": "Das Gewicht, die Substanz",
          "scores": { "d1": 3, "d2": 5, "d3": 4 }
        }
      ]
    },
    {
      "id": "q6",
      "text": "Welche Farbe fühlt sich am meisten wie 'Zuhause' an?",
      "options": [
        {
          "id": "q6a",
          "text": "Tiefes Violett, fast schwarz",
          "scores": { "d1": 2, "d2": 1, "d3": 2 }
        },
        {
          "id": "q6b",
          "text": "Warmes Bernstein-Orange",
          "scores": { "d1": 3, "d2": 5, "d3": 3 }
        },
        {
          "id": "q6c",
          "text": "Sanftes Rosa mit Schimmer",
          "scores": { "d1": 1, "d2": 3, "d3": 2 }
        },
        {
          "id": "q6d",
          "text": "Tiefes, schichtiges Grün",
          "scores": { "d1": 4, "d2": 4, "d3": 4 }
        }
      ]
    },
    {
      "id": "q7",
      "text": "Was würden deine Ahnen dir sagen?",
      "options": [
        {
          "id": "q7a",
          "text": "'Du trägst unsere Klarheit weiter.'",
          "scores": { "d1": 1, "d2": 1, "d3": 1 }
        },
        {
          "id": "q7b",
          "text": "'Du bist die Summe von allem, was wir durchlebten.'",
          "scores": { "d1": 4, "d2": 5, "d3": 5 }
        },
        {
          "id": "q7c",
          "text": "'Du heilst, was wir nicht heilen konnten.'",
          "scores": { "d1": 2, "d2": 3, "d3": 2 }
        },
        {
          "id": "q7d",
          "text": "'Du transformierst unsere Dunkelheit in Licht.'",
          "scores": { "d1": 3, "d2": 2, "d3": 3 }
        }
      ]
    },
    {
      "id": "q8",
      "text": "Wie nimmst du die Zeit wahr?",
      "options": [
        {
          "id": "q8a",
          "text": "In Blitzen – Momente der Intensität",
          "scores": { "d1": 2, "d2": 1, "d3": 2 }
        },
        {
          "id": "q8b",
          "text": "In Schichten – jede Phase baut auf",
          "scores": { "d1": 4, "d2": 5, "d3": 4 }
        },
        {
          "id": "q8c",
          "text": "Fließend – wie Wasser über Stein",
          "scores": { "d1": 1, "d2": 3, "d3": 2 }
        },
        {
          "id": "q8d",
          "text": "Zyklisch – ewige Wiederkehr",
          "scores": { "d1": 3, "d2": 4, "d3": 3 }
        }
      ]
    },
    {
      "id": "q9",
      "text": "Was verbirgst du vor der Welt?",
      "options": [
        {
          "id": "q9a",
          "text": "Tiefe, die zu intensiv wäre",
          "scores": { "d1": 2, "d2": 1, "d3": 1 }
        },
        {
          "id": "q9b",
          "text": "Schichten von Erfahrungen",
          "scores": { "d1": 4, "d2": 4, "d3": 5 }
        },
        {
          "id": "q9c",
          "text": "Sanftheit unter harter Schale",
          "scores": { "d1": 5, "d2": 2, "d3": 4 }
        },
        {
          "id": "q9d",
          "text": "Licht, das zur falschen Zeit blenden würde",
          "scores": { "d1": 1, "d2": 2, "d3": 2 }
        }
      ]
    },
    {
      "id": "q10",
      "text": "Jemand will dich 'schleifen', um dich zu 'verbessern'. Wie reagierst du?",
      "options": [
        {
          "id": "q10a",
          "text": "Ich lasse es zu – mein Kern bleibt",
          "scores": { "d1": 1, "d2": 3, "d3": 2 }
        },
        {
          "id": "q10b",
          "text": "Ich zeige, dass meine Ecken Teil meiner Schönheit sind",
          "scores": { "d1": 5, "d2": 4, "d3": 5 }
        },
        {
          "id": "q10c",
          "text": "Ich absorbiere den Prozess und werde stärker",
          "scores": { "d1": 3, "d2": 5, "d3": 3 }
        },
        {
          "id": "q10d",
          "text": "Ich transformiere mich von innen heraus",
          "scores": { "d1": 2, "d2": 1, "d3": 1 }
        }
      ]
    }
  ]
}
```

### Profile

```json
{
  "profiles": [
    {
      "id": "amethyst",
      "title": "Amethyst",
      "emoji": "💎",
      "tagline": "Klarheit im Chaos – dein Geist ist ein Kristallpalast",
      "description": "Der Amethyst ist der Stein der spirituellen Klarheit. Du hast die Fähigkeit, in turbulenten Zeiten klar zu sehen, was andere nicht sehen können. Deine violette Tiefe ist nicht Dunkelheit, sondern konzentriertes Licht. Historisch trugen Könige den Amethyst, um nüchtern zu bleiben – nicht nur vom Wein, sondern von Illusionen. Du bist der Mensch, der die Wahrheit sieht, auch wenn sie unbequem ist.",
      "stats": {
        "Klarheit": 95,
        "Spirituelle Tiefe": 90,
        "Ruhe im Sturm": 85,
        "Wahrheitsblick": 80
      },
      "dimension_ranges": {
        "d1": [1, 3],
        "d2": [1, 3],
        "d3": [1, 3]
      },
      "allies": ["moonstone", "rose_quartz"],
      "nemesis": ["obsidian"],
      "share_text": "Mein Ahnenstein ist der Amethyst 💎 – Klarheit im Chaos. Welcher ist deiner?"
    },
    {
      "id": "obsidian",
      "title": "Obsidian",
      "emoji": "🪨",
      "tagline": "Geboren aus Feuer, hart wie Wahrheit",
      "description": "Obsidian entsteht in Sekunden, wenn Lava auf Wasser trifft – eine explosive Transformation. Du bist aus intensiven Momenten geformt, nicht aus langsamer Entwicklung. Deine glatte, schwarze Oberfläche zeigt keine Schichten, weil du nicht in Schichten denkst. Du bist direkt, schneidend, absolut. Dein Schutz ist deine Undurchdringlichkeit – und dein verborgener Schatz ist das Licht, das du reflektierst, wenn du willst.",
      "stats": {
        "Intensität": 95,
        "Transformation": 90,
        "Direktheit": 85,
        "Schutz": 80
      },
      "dimension_ranges": {
        "d1": [1, 3],
        "d2": [1, 2],
        "d3": [3, 5]
      },
      "allies": ["malachite"],
      "nemesis": ["amber", "rose_quartz"],
      "share_text": "Mein Ahnenstein ist der Obsidian 🪨 – Geboren aus Feuer. Welcher ist deiner?"
    },
    {
      "id": "rose_quartz",
      "title": "Rosenquarz",
      "emoji": "🩷",
      "tagline": "Sanfte Stärke – du heilst, ohne es zu merken",
      "description": "Der Rosenquarz ist der Stein des Herzens. Deine rosa Tönung kommt nicht von Schwäche, sondern von der seltenen Fähigkeit, weich zu bleiben in einer harten Welt. Du heilst andere durch deine bloße Präsenz – nicht durch Worte, nicht durch Taten, sondern durch dein Sein. Deine Transparenz ist ein Geschenk: Menschen vertrauen dir, weil sie durch dich hindurchsehen können.",
      "stats": {
        "Herzöffnung": 95,
        "Sanfte Präsenz": 90,
        "Heilende Wirkung": 85,
        "Vertrauenswürdigkeit": 80
      },
      "dimension_ranges": {
        "d1": [1, 3],
        "d2": [2, 4],
        "d3": [1, 3]
      },
      "allies": ["amethyst", "moonstone"],
      "nemesis": ["obsidian"],
      "share_text": "Mein Ahnenstein ist der Rosenquarz 🩷 – Sanfte Stärke. Welcher ist deiner?"
    },
    {
      "id": "amber",
      "title": "Bernstein",
      "emoji": "🟠",
      "tagline": "Alte Weisheit, in Wärme konserviert",
      "description": "Bernstein ist kein Stein, sondern versteinertes Harz – Lebensessenz, die Zeit überdauert hat. Du trägst alte Weisheit in dir, manchmal mit sichtbaren Einschlüssen: Erinnerungen, Geschichten, Fragmente der Vergangenheit. Deine Wärme ist nicht laut, sondern sanft leuchtend wie Honig im Sonnenlicht. Du konservierst, was wichtig ist – nicht aus Angst vor der Zukunft, sondern aus Respekt vor dem, was war.",
      "stats": {
        "Ahnenweisheit": 95,
        "Bewahrung": 90,
        "Wärme": 85,
        "Zeitlosigkeit": 80
      },
      "dimension_ranges": {
        "d1": [2, 4],
        "d2": [4, 5],
        "d3": [2, 4]
      },
      "allies": ["malachite"],
      "nemesis": ["obsidian"],
      "share_text": "Mein Ahnenstein ist der Bernstein 🟠 – Alte Weisheit, warm konserviert. Welcher ist deiner?"
    },
    {
      "id": "malachite",
      "title": "Malachit",
      "emoji": "💚",
      "tagline": "Wandlung ist dein Element – Schicht für Schicht",
      "description": "Malachit zeigt seine Geschichte in Ringen, wie ein Baum. Jede Schicht ist eine Phase deines Lebens, sichtbar und stolz getragen. Du versteckst deine Transformationen nicht – du feierst sie. Dein tiefes Grün ist die Farbe des Wachstums, und die Wirbel in deinem Inneren erzählen von Bewegung, nicht von Stillstand. Du bist jemand, der sich ständig entwickelt und dabei transparent bleibt über seinen Weg.",
      "stats": {
        "Transformation": 95,
        "Sichtbare Geschichte": 90,
        "Wachstum": 85,
        "Ehrlichkeit": 80
      },
      "dimension_ranges": {
        "d1": [3, 5],
        "d2": [3, 5],
        "d3": [3, 5]
      },
      "allies": ["amber", "obsidian"],
      "nemesis": ["moonstone"],
      "share_text": "Mein Ahnenstein ist der Malachit 💚 – Wandlung Schicht für Schicht. Welcher ist deiner?"
    },
    {
      "id": "moonstone",
      "title": "Mondstein",
      "emoji": "🌙",
      "tagline": "Du folgst einem Rhythmus, den andere nicht hören",
      "description": "Der Mondstein schimmert je nach Lichteinfall anders – und du bist genauso. Deine Stimmungen, deine Einsichten, deine Kreativität folgen Zyklen, die anderen mysteriös erscheinen, dir aber vollkommen logisch sind. Du bist verbunden mit Kräften, die älter sind als Worte – dem Mond, dem Wasser, der Intuition. Dein Schimmer ist subtil, aber wer ihn einmal gesehen hat, vergisst ihn nie.",
      "stats": {
        "Intuition": 95,
        "Zyklische Weisheit": 90,
        "Mysteriöser Charme": 85,
        "Tiefe Verbindung": 80
      },
      "dimension_ranges": {
        "d1": [1, 3],
        "d2": [2, 4],
        "d3": [2, 4]
      },
      "allies": ["amethyst", "rose_quartz"],
      "nemesis": ["malachite"],
      "share_text": "Mein Ahnenstein ist der Mondstein 🌙 – Ich folge meinem eigenen Rhythmus. Welcher ist deiner?"
    }
  ]
}
```

### Output-Mapping

```typescript
// Ahnenstein → ContributionEvent Mapping

const stoneQuizOutput = {
  markers: [
    { id: "marker.stone.{profileId}", weight: 0.85 },
    { id: "marker.earth.texture_preference", weight: dimensionScore("d1") },
    { id: "marker.earth.formation_style", weight: dimensionScore("d2") },
    { id: "marker.earth.transparency_level", weight: dimensionScore("d3") }
  ],
  traits: [
    { id: "trait.stone.polish", score: calculateTraitScore("d1_inverse") },
    { id: "trait.stone.formation_speed", score: calculateTraitScore("d2") },
    { id: "trait.stone.opacity", score: calculateTraitScore("d3") }
  ],
  tags: [
    { id: "tag.stone.{profileId}", label: "{profileTitle}", kind: "archetype" }
  ],
  unlocks: [
    { id: "unlock.stones.{profileId}", unlocked: true, level: 1 }
  ]
};
```

---

## Kompatibilitäts-Matrix (Alle Naturkind-Quizzes)

### Synergie-Tabelle

| Aura | Krafttier | Blume | Stein | Cluster-Titel |
|------|-----------|-------|-------|---------------|
| Violett | Wolf | Lotus | Amethyst | Der violette Mondwolf |
| Gold | Löwe | Sonnenblume | Bernstein | Die goldene Sonnenkraft |
| Grün | Hirsch | Wildblume | Malachit | Der wandelnde Waldhüter |
| Blau | Delphin | Orchidee | Mondstein | Der fließende Tiefenseher |
| Rosa | Hase | Rose | Rosenquarz | Die sanfte Herzkraft |
| Schwarz | Rabe | Lavendel | Obsidian | Der stille Schattenheiler |

### Cluster-Narrativ-Templates

```javascript
const clusterNarratives = {
  "violet-wolf-lotus-amethyst": 
    "Deine Natur-Signatur ist legendär: Die violette Aura verrät deine Verbindung zum Unsichtbaren, während der Wolf in dir die Treue zum Rudel bewahrt. Der Lotus zeigt, dass du aus Schwierigkeiten erblühst – nicht obwohl, sondern weil sie da waren. Und der Amethyst in deinem Kern? Er ist die kristallisierte Weisheit deiner Ahnen, die in dir weiterlebt. Du bist kein Gast in der Natur. Du bist ihr Kind – wild, verwurzelt, leuchtend.",
  
  "gold-lion-sunflower-amber":
    "Du trägst die Signatur der Sonne: Deine goldene Aura strahlt Wärme aus, der Löwe gibt dir Präsenz und Führungskraft, die Sonnenblume richtet dich immer zum Licht aus, und der Bernstein konserviert die Weisheit deiner Linie. Du bist eine Quelle der Kraft für andere – nicht weil du nie fällst, sondern weil du immer wieder aufstehst, leuchtender als zuvor.",
  
  // ... weitere Kombinationen
};
```
