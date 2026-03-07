# Cluster-Quiz Blueprint v1.0

**Version:** 1.0  
**Stand:** Dezember 2025  
**Anwendung:** QuizzMe-Plattform – Erweiterte Engagement-Architektur

---

## Teil I: Das Cluster-Konzept

### 1. Definition

> **Ein Cluster ist eine thematisch verbundene Gruppe von 3–5 Quizzes, die zusammen ein höherwertiges Persönlichkeits-Attribut freischalten.**

**Das Prinzip:**
```
Quiz A ──┐
Quiz B ──┼──► CLUSTER-ATTRIBUT ──► Character Sheet
Quiz C ──┤
Quiz D ──┘
         │
    [Alle abgeschlossen]
```

**Kernmechanik:** Jedes einzelne Quiz bleibt eigenständig spielbar und emittiert ein `ContributionEvent`. Erst wenn ALLE Cluster-Quizzes abgeschlossen sind, wird ein zusätzliches `ClusterCompletionEvent` emittiert, das das akkumulierte Cluster-Attribut enthält.

---

### 2. Psychologische Hebel des Cluster-Modells

| Hebel | Mechanismus | Effekt |
|-------|-------------|--------|
| **Sammel-Instinkt** | "3 von 4 geschafft" | Completion Drive |
| **Delayed Gratification** | Finale Belohnung erst nach allen | Erhöhte Investition |
| **Thematische Kohärenz** | Alle Quizzes erzählen eine Geschichte | Narrative Tiefe |
| **Progressive Revelation** | Jedes Quiz enthüllt einen Aspekt | Neugier-Kaskade |
| **Status-Symbol** | Cluster-Attribut als Prestige | Flex-Faktor |

---

## Teil II: Technische Architektur

### 3. Datenstruktur: ClusterDefinition

```typescript
type ClusterDefinition = {
  id: string;                    // cluster.naturkind.v1
  name: string;                  // "Naturkind"
  description: string;           // Freigeschaltete Beschreibung
  theme: {
    icon: string;                // SVG-Path oder Emoji
    color: string;               // Hex
    aesthetic: string;           // "botanical" | "mystical" | "cosmic"
  };
  quizzes: {
    id: string;                  // quiz.aura.v1
    order: number;               // 1, 2, 3, 4
    unlockCondition?: string;    // null | "previous" | "any_2"
    weight: number;              // Wie stark fließt dieses Quiz ins Cluster ein
  }[];
  completionReward: {
    attributeId: string;         // attribute.naturkind
    attributeName: string;       // "Naturkind"
    attributeDescription: string;
    unlockId: string;            // unlock.badges.naturkind_complete
    unlockLevel: 1 | 2 | 3;      // Rarität
  };
  aggregation: {
    method: "weighted_average" | "dominant" | "synergy";
    outputTraits: string[];      // Welche Traits werden aggregiert
    outputMarkers: string[];     // Welche Marker werden erzeugt
  };
};
```

### 4. Event-Erweiterung: ClusterContributionEvent

Zusätzlich zum Standard-`ContributionEvent` wird bei Cluster-Abschluss ein erweitertes Event emittiert:

```typescript
type ClusterContributionEvent = {
  specVersion: "sp.cluster.v1";
  eventId: string;
  occurredAt: string;
  source: {
    vertical: "cluster";
    moduleId: string;            // cluster.naturkind.v1
    domain: string;
    locale: string;
  };
  clusterMeta: {
    clusterId: string;
    clusterName: string;
    completedQuizzes: {
      quizId: string;
      completedAt: string;
      resultId: string;          // Welches Profil wurde erreicht
      primaryMarkers: string[];  // Die dominanten Marker dieses Quiz
    }[];
    completionDuration: number;  // Minuten seit erstem Quiz
  };
  payload: {
    // Akkumulierte Marker aus allen Quizzes
    markers: Marker[];
    
    // Aggregierte Traits (gewichteter Durchschnitt oder dominant)
    traits: TraitScore[];
    
    // Cluster-spezifische Tags
    tags: Tag[];
    
    // Der Cluster-Unlock
    unlocks: Unlock[];
    
    // Das Cluster-Attribut
    clusterAttribute: {
      id: string;                // attribute.naturkind
      name: string;              // "Naturkind"
      level: number;             // 1-100 (basierend auf Konsistenz der Antworten)
      archetype: string;         // Der dominante Cluster-Archetyp
      components: {
        quizId: string;
        component: string;       // "Violette Aura", "Wolf", "Lotus", "Amethyst"
        weight: number;
      }[];
      narrative: string;         // Ko-Kreations-Text für das Cluster-Ergebnis
    };
    
    summary: {
      title: string;             // "Naturkind der violetten Tiefe"
      tagline: string;
      bullets: string[];
    };
  };
};
```

### 5. Datenfluss / Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLUSTER-PIPELINE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User spielt Quiz A (Aura)                                       │
│       │                                                          │
│       ▼                                                          │
│  ContributionEvent → LME → Character Sheet                       │
│  + ClusterProgress.update(clusterId, quizA.completed)            │
│       │                                                          │
│       ▼                                                          │
│  [Fortschrittsanzeige: "1/4 für Naturkind"]                      │
│       │                                                          │
│  User spielt Quiz B, C, D...                                     │
│       │                                                          │
│       ▼                                                          │
│  [Alle 4 Quizzes completed?]                                     │
│       │                                                          │
│       ├── NEIN → Zeige verbleibende Quizzes                      │
│       │                                                          │
│       └── JA → ClusterAggregator.compute()                       │
│                    │                                             │
│                    ▼                                             │
│  ClusterContributionEvent emittieren                             │
│       │                                                          │
│       ▼                                                          │
│  LME ingestet Cluster-Marker                                     │
│       │                                                          │
│       ▼                                                          │
│  Character Sheet zeigt Cluster-Attribut                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6. Aggregations-Logik

```typescript
function aggregateCluster(
  clusterDef: ClusterDefinition,
  completedQuizzes: CompletedQuiz[]
): ClusterPayload {
  
  // 1. Sammle alle Marker aus allen Quizzes
  const allMarkers = completedQuizzes.flatMap(q => q.markers);
  
  // 2. Gruppiere nach Marker-ID und berechne gewichteten Durchschnitt
  const aggregatedMarkers = groupAndWeight(allMarkers, clusterDef.aggregation);
  
  // 3. Berechne Cluster-Level basierend auf Konsistenz
  // Hohe Konsistenz = User hat überall ähnliche Tendenz = höherer Level
  const consistency = calculateConsistency(completedQuizzes);
  const clusterLevel = Math.round(consistency * 100);
  
  // 4. Bestimme dominanten Archetyp
  const dominantArchetype = findDominantArchetype(aggregatedMarkers);
  
  // 5. Generiere Cluster-Attribut
  return {
    markers: aggregatedMarkers,
    clusterAttribute: {
      id: clusterDef.completionReward.attributeId,
      name: clusterDef.completionReward.attributeName,
      level: clusterLevel,
      archetype: dominantArchetype,
      components: completedQuizzes.map(q => ({
        quizId: q.id,
        component: q.resultTitle,  // "Violette Aura", "Wolf" etc.
        weight: clusterDef.quizzes.find(cq => cq.id === q.id)?.weight || 1
      })),
      narrative: generateClusterNarrative(dominantArchetype, completedQuizzes)
    }
  };
}
```

---

## Teil III: Das "Naturkind"-Cluster (Beispiel)

### 7. Cluster-Definition

```json
{
  "id": "cluster.naturkind.v1",
  "name": "Naturkind",
  "description": "Die Essenz deiner Verbindung zur natürlichen Welt – verdichtet in vier Dimensionen.",
  "theme": {
    "icon": "🌿",
    "color": "#2D5A4C",
    "aesthetic": "botanical"
  },
  "quizzes": [
    {
      "id": "quiz.aura.v1",
      "order": 1,
      "unlockCondition": null,
      "weight": 1.2,
      "displayName": "Deine Aura-Farbe",
      "dimension": "Energetische Signatur"
    },
    {
      "id": "quiz.krafttier.v1",
      "order": 2,
      "unlockCondition": null,
      "weight": 1.0,
      "displayName": "Dein Krafttier",
      "dimension": "Instinktive Natur"
    },
    {
      "id": "quiz.blumenwesen.v1",
      "order": 3,
      "unlockCondition": null,
      "weight": 0.9,
      "displayName": "Dein inneres Blumenwesen",
      "dimension": "Wachstums-Essenz"
    },
    {
      "id": "quiz.ahnenstein.v1",
      "order": 4,
      "unlockCondition": null,
      "weight": 1.1,
      "displayName": "Dein Ahnenstein",
      "dimension": "Materielle Resonanz"
    }
  ],
  "completionReward": {
    "attributeId": "attribute.naturkind",
    "attributeName": "Naturkind",
    "attributeDescription": "Du hast alle vier Naturverbindungen erkundet und deine elementare Identität freigeschaltet.",
    "unlockId": "unlock.badges.naturkind_complete",
    "unlockLevel": 3
  },
  "aggregation": {
    "method": "weighted_average",
    "outputTraits": [
      "trait.nature.earth_affinity",
      "trait.nature.water_affinity",
      "trait.nature.fire_affinity",
      "trait.nature.air_affinity",
      "trait.nature.spirit_affinity"
    ],
    "outputMarkers": [
      "marker.nature.elemental_harmony",
      "marker.nature.wild_soul",
      "marker.nature.rooted_presence"
    ]
  }
}
```

### 8. Die vier Quizzes im Detail

#### 8.1 Quiz 1: Aura-Farbe (bereits vorhanden)

**Dimension:** Energetische Signatur  
**Was es misst:** Die feinstoffliche Ausstrahlung des Users  
**Markers:** `marker.aura.violet`, `marker.aura.gold`, etc.

#### 8.2 Quiz 2: Krafttier (bereits vorhanden)

**Dimension:** Instinktive Natur  
**Was es misst:** Der archaische Begleiter im Unbewussten  
**Markers:** `marker.spirit_animal.wolf`, `marker.spirit_animal.owl`, etc.

#### 8.3 Quiz 3: Inneres Blumenwesen (NEU)

**Konzept:**
> "Jede Seele trägt die Essenz einer Blume – die Art, wie du wächst, blühst und dich der Welt zeigst."

**Fragen-Design:**
- Szenario-basiert um Wachstum, Resilienz, Ästhetik
- Indirekte Abfrage von: Introversion/Extraversion, Resilienz, Timing (Frühblüher vs. Spätblüher)

**Profile (6-8 Blumen):**

| Profil | Blume | Tagline | Kernmarker |
|--------|-------|---------|------------|
| Lotus | 🪷 Lotus | "Du wächst aus dem Schlamm zum Licht" | `marker.flower.lotus` |
| Rose | 🌹 Rose | "Schönheit mit Dornen – dein Schutz ist Teil deiner Eleganz" | `marker.flower.rose` |
| Wildblume | 🌸 Wildblume | "Du brauchst keinen Garten – du erschaffst deinen eigenen" | `marker.flower.wildflower` |
| Sonnenblume | 🌻 Sonnenblume | "Immer dem Licht zugewandt, auch wenn es wandert" | `marker.flower.sunflower` |
| Orchidee | 🪻 Orchidee | "Selten, sensibel, faszinierend – du blühst unter besonderen Bedingungen" | `marker.flower.orchid` |
| Lavendel | 💜 Lavendel | "Deine Ruhe ist ansteckend, dein Duft bleibt" | `marker.flower.lavender` |

**Dimensionen:**
- D1: Nährboden (Chaos-tolerant ↔ Struktur-bedürftig)
- D2: Blühzeit (Früh ↔ Spät)
- D3: Sichtbarkeit (Prächtig ↔ Subtil)

#### 8.4 Quiz 4: Ahnenstein (NEU)

**Konzept:**
> "In der Tiefe der Erde schlummert ein Stein, der deine Essenz trägt – geformt aus deinen Vorfahren, deiner Sensibilität und deiner verborgenen Kraft."

**Fragen-Design:**
- Sensorische Fragen: Wie fühlt sich [Material] für dich an?
- Vergangenheits-Fragen: Was hat dich früh geprägt?
- Ästhetik-Fragen: Welche Oberfläche zieht dich an?

**Profile (6-8 Steine):**

| Profil | Stein | Tagline | Kernmarker |
|--------|-------|---------|------------|
| Amethyst | 💎 Amethyst | "Klarheit im Chaos – dein Geist ist ein Kristallpalast" | `marker.stone.amethyst` |
| Obsidian | 🪨 Obsidian | "Geboren aus Feuer, hart wie Wahrheit" | `marker.stone.obsidian` |
| Rosenquarz | 🩷 Rosenquarz | "Sanfte Stärke – du heilst, ohne es zu merken" | `marker.stone.rose_quartz` |
| Bernstein | 🟠 Bernstein | "Alte Weisheit, in Wärme konserviert" | `marker.stone.amber` |
| Malachit | 💚 Malachit | "Wandlung ist dein Element – Schicht für Schicht" | `marker.stone.malachite` |
| Mondstein | 🌙 Mondstein | "Du folgst einem Rhythmus, den andere nicht hören" | `marker.stone.moonstone` |

**Dimensionen:**
- D1: Textur (Glatt ↔ Rau)
- D2: Entstehung (Vulkanisch/Schnell ↔ Sedimentär/Langsam)
- D3: Transparenz (Klar ↔ Opak)

---

### 9. Das Cluster-Ergebnis: "Naturkind"

Wenn alle vier Quizzes abgeschlossen sind:

**Trading Card (9:16):**

```
┌─────────────────────────────────────────┐
│                                         │
│           🌿 NATURKIND 🌿               │
│                                         │
│    ══════════════════════════════       │
│      DER VIOLETTE MONDWOLF              │
│       mit Lotus-Essenz und              │
│         Amethyst-Kern                   │
│    ══════════════════════════════       │
│                                         │
│    ╭─────────────────────────────╮      │
│    │  🟣 Aura: Violett           │      │
│    │  🐺 Tier: Wolf              │      │
│    │  🪷 Blume: Lotus            │      │
│    │  💎 Stein: Amethyst         │      │
│    ╰─────────────────────────────╯      │
│                                         │
│    "Du wanderst zwischen den Welten    │
│     – verwurzelt in Tiefe,              │
│     leuchtend in Stille."               │
│                                         │
│    ─────────────────────────────        │
│                                         │
│    ▓▓▓▓▓▓▓▓░░  78% Natur-Resonanz       │
│    ▓▓▓▓▓▓▓▓▓▓ 100% Elementar-Harmonie   │
│    ▓▓▓▓▓▓░░░░  60% Wildseelen-Anteil    │
│                                         │
│    ─────────────────────────────        │
│                                         │
│    ✦ CLUSTER-BADGE: Naturkind Lv.78    │
│                                         │
│    [ 🔗 TEILEN ]  [ ⟳ ERKUNDEN ]        │
│                                         │
└─────────────────────────────────────────┘
```

**Cluster-Narrativ (Ko-Kreation):**

> "Deine Natur-Signatur ist selten: Die violette Aura verrät deine Verbindung zum Unsichtbaren, während der Wolf in dir die Treue zum Rudel bewahrt. Der Lotus zeigt, dass du aus Schwierigkeiten erblühst – nicht obwohl, sondern weil sie da waren. Und der Amethyst in deinem Kern? Er ist die kristallisierte Weisheit deiner Ahnen, die in dir weiterlebt. Du bist kein Gast in der Natur. Du bist ihr Kind – wild, verwurzelt, leuchtend."

---

## Teil IV: Motivations-Architektur

### 10. Der Fortschritts-Funnel

**Phase 1: Einstieg (Quiz 1)**
```
"Beginne deine Naturkind-Reise"
     │
     ▼
[Aura-Quiz spielen]
     │
     ▼
[Ergebnis] + "1/4 für dein Naturkind-Profil"
     │
     ▼
[Teaser für nächstes Quiz anzeigen]
```

**Phase 2: Aufbau (Quiz 2-3)**
```
"Du hast deine Aura entdeckt. Jetzt fehlt dein Krafttier."
     │
     ▼
[Krafttier-Quiz spielen]
     │
     ▼
[Ergebnis] + "2/4 – Dein Naturkind nimmt Form an"
     │
     ▼
[Preview: "Aura + Tier ergeben..." (vage)]
```

**Phase 3: Höhepunkt (Quiz 4)**
```
"Nur noch ein Schritt. Der Ahnenstein vollendet dein Naturkind."
     │
     ▼
[Ahnenstein-Quiz spielen]
     │
     ▼
[CLUSTER COMPLETE!]
     │
     ▼
[Feierliche Enthüllung des Cluster-Attributs]
     │
     ▼
[Shareable Trading Card mit allen 4 Komponenten]
```

### 11. UI-Elemente für Cluster-Motivation

**Cluster-Hub (Übersichtsseite):**

```
┌─────────────────────────────────────────┐
│                                         │
│       🌿 NATURKIND-CLUSTER 🌿           │
│                                         │
│   ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐    │
│   │ ✓  │  │ ✓  │  │ 🔒 │  │ 🔒 │    │
│   │Aura │  │Tier │  │Blume│  │Stein│    │
│   └─────┘  └─────┘  └─────┘  └─────┘    │
│                                         │
│         ▓▓▓▓▓▓▓▓░░░░░░░░ 50%            │
│                                         │
│   "Dein Naturkind wartet darauf,        │
│    vollständig zu erwachen."            │
│                                         │
│        [ NÄCHSTES QUIZ SPIELEN ]        │
│                                         │
└─────────────────────────────────────────┘
```

**Teaser nach einzelnem Quiz:**

```
┌─────────────────────────────────────────┐
│                                         │
│  Du bist: DER VIOLETTE MYSTIKER         │
│                                         │
│  ─────────────────────────────          │
│                                         │
│  🔓 TEIL EINES GRÖSSEREN GANZEN         │
│                                         │
│  Deine Aura ist ein Puzzlestück.        │
│  Entdecke dein Krafttier, um zu         │
│  sehen, welches Naturkind du bist.      │
│                                         │
│  ┌────────────────────────────┐         │
│  │ 🐺 Welches Krafttier bist │         │
│  │    DU wirklich?            │         │
│  │                            │         │
│  │    [ JETZT ENTDECKEN ]     │         │
│  └────────────────────────────┘         │
│                                         │
└─────────────────────────────────────────┘
```

---

## Teil V: Event-Flow Beispiel

### 12. Vollständiger Event-Flow für Naturkind-Cluster

**Event 1: Aura-Quiz abgeschlossen**
```json
{
  "specVersion": "sp.contribution.v1",
  "eventId": "aura-001",
  "source": { "vertical": "quiz", "moduleId": "quiz.aura.v1" },
  "payload": {
    "markers": [
      { "id": "marker.aura.violet", "weight": 0.85 },
      { "id": "marker.aura.intuition", "weight": 0.72 }
    ],
    "traits": [
      { "id": "trait.aura.spiritual_depth", "score": 82, "band": "high" }
    ],
    "summary": { "title": "Violette Aura", "resultId": "violet" }
  },
  "clusterProgress": {
    "clusterId": "cluster.naturkind.v1",
    "completedQuizzes": ["quiz.aura.v1"],
    "totalQuizzes": 4,
    "percentComplete": 25
  }
}
```

**Event 2-4: Weitere Quizzes...**

**Event 5: Cluster-Completion (nach Quiz 4)**
```json
{
  "specVersion": "sp.cluster.v1",
  "eventId": "cluster-naturkind-001",
  "source": { "vertical": "cluster", "moduleId": "cluster.naturkind.v1" },
  "clusterMeta": {
    "clusterId": "cluster.naturkind.v1",
    "clusterName": "Naturkind",
    "completedQuizzes": [
      { "quizId": "quiz.aura.v1", "resultId": "violet" },
      { "quizId": "quiz.krafttier.v1", "resultId": "wolf" },
      { "quizId": "quiz.blumenwesen.v1", "resultId": "lotus" },
      { "quizId": "quiz.ahnenstein.v1", "resultId": "amethyst" }
    ]
  },
  "payload": {
    "markers": [
      { "id": "marker.nature.elemental_harmony", "weight": 0.78 },
      { "id": "marker.nature.wild_soul", "weight": 0.65 },
      { "id": "marker.nature.rooted_presence", "weight": 0.71 }
    ],
    "clusterAttribute": {
      "id": "attribute.naturkind",
      "name": "Naturkind",
      "level": 78,
      "archetype": "Der violette Mondwolf",
      "components": [
        { "quizId": "quiz.aura.v1", "component": "Violette Aura", "weight": 1.2 },
        { "quizId": "quiz.krafttier.v1", "component": "Wolf", "weight": 1.0 },
        { "quizId": "quiz.blumenwesen.v1", "component": "Lotus", "weight": 0.9 },
        { "quizId": "quiz.ahnenstein.v1", "component": "Amethyst", "weight": 1.1 }
      ],
      "narrative": "Du wanderst zwischen den Welten..."
    },
    "unlocks": [
      { "id": "unlock.badges.naturkind_complete", "unlocked": true, "level": 3 }
    ],
    "summary": {
      "title": "Der violette Mondwolf",
      "tagline": "Naturkind mit Lotus-Essenz und Amethyst-Kern",
      "bullets": [
        "Deine Aura leuchtet in intuitivem Violett",
        "Der Wolf führt deinen Instinkt",
        "Du erblühst wie der Lotus aus der Tiefe",
        "Amethyst-Klarheit prägt dein Wesen"
      ]
    }
  }
}
```

---

## Teil VI: Weitere Cluster-Ideen

### 13. Potenzielle Cluster-Themen

| Cluster-Name | Quizzes | Freigeschaltetes Attribut |
|--------------|---------|---------------------------|
| **Naturkind** | Aura, Krafttier, Blumenwesen, Ahnenstein | Elementare Identität |
| **Schattenwanderer** | Innerer Dämon, Schutzengel, Todsünde, Tugend | Dualitäts-Profil |
| **Zeitreisender** | Vergangenes Leben, Zukunfts-Ich, Kindheits-Archetyp, Ahnen-Archetyp | Temporale Identität |
| **Beziehungsnetz** | Love Language, Attachment Style, Konflikt-Muster, Intimacy Profile | Bindungs-DNA |
| **Karriere-Architekt** | Karriere-DNA, Superkraft, Führungsstil, Arbeitsrhythmus | Berufungs-Signatur |

### 14. Unlock-Bedingungen (optional)

Für komplexere Cluster können Unlock-Bedingungen verwendet werden:

```json
{
  "quizzes": [
    { "id": "quiz.core.v1", "unlockCondition": null },
    { "id": "quiz.shadow.v1", "unlockCondition": "quiz.core.v1" },
    { "id": "quiz.light.v1", "unlockCondition": "quiz.core.v1" },
    { "id": "quiz.synthesis.v1", "unlockCondition": "any_2" }
  ]
}
```

---

## Teil VII: Implementierungs-Checkliste

### 15. Für jedes neue Cluster

- [ ] ClusterDefinition JSON erstellen
- [ ] Alle enthaltenen Quizzes existieren oder werden erstellt
- [ ] Aggregations-Logik definieren (welche Traits/Marker werden kombiniert)
- [ ] Cluster-Ergebnis-Template (Trading Card Design)
- [ ] Cluster-Narrativ-Template (Ko-Kreations-Text)
- [ ] Fortschritts-UI im Cluster-Hub
- [ ] Teaser-Texte zwischen Quizzes
- [ ] Unlock-Badge für Character Sheet

### 16. Für Naturkind-Cluster spezifisch

- [ ] Aura-Quiz: Vorhanden ✓
- [ ] Krafttier-Quiz: Vorhanden ✓
- [ ] Blumenwesen-Quiz: NEU ERSTELLEN
- [ ] Ahnenstein-Quiz: NEU ERSTELLEN
- [ ] Cluster-Aggregator implementieren
- [ ] "Naturkind"-Badge designen
- [ ] Cluster-Hub UI

---

**Ende des Cluster-Quiz Blueprints**

*Erstellt für QuizzMe – Wo Einzelteile zu Identitäten werden.*
