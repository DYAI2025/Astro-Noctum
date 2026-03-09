# QUIZ_MAPPING_MARKERS.md — QuissMe Unified Marker Mapping
**Version:** v1.0  
**Stand:** 2026-03-06  
**Status:** Single Source of Truth für Quiz → Fusion Ring Mapping  
**Abhängigkeiten:** CORE_MECHANICS.md, AI_MAPPING_LEXICON.md, Bazodiac Semantic Marker Mapping

---

## 0. Zweck dieses Dokuments

Dieses Dokument vereint das bestehende QuissMe-Scoring (Trinity + Love Languages) mit dem Bazodiac Semantic Marker Mapping zu **einem verbindlichen Regelwerk**. Jede Quiz-Erzeugung und jeder ContributionEvent nutzt dieses Dokument als Referenz.

**Priorität:** Das Bazodiac-Mapping (12-Sektor Fusion Ring) hat Vorrang bei Konflikten mit älteren Definitionen. Bestehende Systeme (Trinity, Love Languages) werden als kompatible Schichten integriert, nicht ersetzt.

---

## 1. Architektur-Übersicht: Drei Mapping-Schichten

```
┌─────────────────────────────────────────────────────┐
│  SCHICHT 3: Fusion Ring (12 Sektoren, S0–S11)       │
│  ← Bazodiac Semantic Marker Mapping                 │
│  ← Endgültige Visualisierung des User-Profils       │
├─────────────────────────────────────────────────────┤
│  SCHICHT 2: Quiz-Cluster-Scoring                    │
│  ← Trinity: passion / stability / future            │
│  ← Love Languages: words / time / gifts / service   │
│    / touch                                          │
│  ← Zukünftige Cluster: frei erweiterbar             │
├─────────────────────────────────────────────────────┤
│  SCHICHT 1: Einzelne Quiz-Options                   │
│  ← type_scores, cluster_scores, duo_trait_deltas    │
│  ← Fragen mit 4 Optionen (A/B/C/D)                 │
└─────────────────────────────────────────────────────┘
```

**Datenfluss:**  
Quiz-Option gewählt → cluster_scores + type_scores aggregiert → ContributionEvent mit Markers emittiert → Markers per AFFINITY_MAP auf 12 Sektoren geroutet → Fusion Ring aktualisiert.

---

## 2. Marker-Format-Spezifikation

### 2.1 Namenskonvention

```
marker.<domain>.<keyword>
```

**Regeln:**
- Immer lowercase, Punkte als Trenner
- Domain = semantisches Feld (max. 1 Wort)
- Keyword = spezifisches Signal (max. 2 Wörter, snake_case)
- Beispiele: `marker.love.physical_touch`, `marker.instinct.primal_sense`

### 2.2 Registrierte Domains

| Domain       | Beschreibung                            | Primäre Sektoren |
|-------------|----------------------------------------|-----------------|
| `love`       | Zuneigung, Liebessprachen, Romantik    | S3, S6, S7      |
| `emotion`    | Gefühle, Empathie, emotionale Tiefe    | S3, S1, S7      |
| `social`     | Gemeinschaft, Diplomatie, Beziehung    | S6, S10         |
| `instinct`   | Urinstinkt, Bauchgefühl, Impuls       | S0, S7, S8      |
| `cognition`  | Denken, Analyse, Kommunikation        | S2, S5          |
| `leadership` | Führung, Verantwortung, Charisma      | S4, S9          |
| `freedom`    | Freiheit, Abenteuer, Unabhängigkeit   | S8, S0          |
| `spiritual`  | Intuition, Hingabe, Transzendenz      | S11, S7         |
| `sensory`    | Sinnlichkeit, Körper, Genuss          | S1, S7          |
| `creative`   | Kreativität, Ausdruck, Spiel          | S4, S2          |

**Erweiterungsregel:** Neue Domains werden nur eingeführt, wenn keine bestehende Domain das Konzept abbilden kann. Vor Einführung: AFFINITY_MAP Zeile definieren.

---

## 3. AFFINITY_MAP — Vollständig mit QuissMe-Erweiterungen

Die AFFINITY_MAP ist das zentrale Lookup-Objekt. Jede Zeile summiert sich auf ~1.0.  
Format: `keyword: [S0, S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11]`

### 3.1 Domain-Level (Fallback-Ebene)

```javascript
const AFFINITY_MAP = {
  // === DOMAIN-LEVEL (Ebene 1 — Fallback wenn Keyword unbekannt) ===
  'love':       [0,   .1,  0,   .3,  0,   0,   .3,  .3,  0,   0,   0,   0  ],
  'emotion':    [0,   .2,  0,   .4,  .1,  0,   .1,  .2,  0,   0,   0,   0  ],
  'social':     [0,   0,   .1,  .1,  .1,  0,   .3,  0,   0,   0,   .3,  0  ],
  'instinct':   [.3,  0,   0,   0,   0,   0,   0,   .3,  .2,  .1,  0,   .1 ],
  'cognition':  [0,   0,   .4,  0,   0,   .3,  0,   0,   .2,  .1,  0,   0  ],
  'leadership': [.1,  0,   0,   0,   .3,  0,   0,   0,   0,   .4,  .1,  0  ],
  'freedom':    [.2,  0,   0,   0,   0,   0,   0,   0,   .5,  .1,  .2,  0  ],
  'spiritual':  [0,   0,   0,   0,   0,   0,   0,   .2,  .2,  0,   0,   .6 ],
  'sensory':    [0,   .5,  0,   0,   0,   0,   0,   .3,  0,   0,   0,   .2 ],
  'creative':   [0,   0,   .2,  0,   .4,  0,   .1,  0,   0,   0,   .2,  .1 ],
```

### 3.2 Keyword-Level (Präzisionsebene)

```javascript
  // === KEYWORD-LEVEL (Ebene 2 — Präzision) ===

  // --- Bazodiac Original Keywords ---
  'physical_touch':       [0,   .2,  0,   0,   0,   0,   0,   .6,  0,   0,   0,   .2 ],
  'harmony':              [0,   0,   0,   .1,  0,   0,   .7,  0,   0,   0,   .2,  0  ],
  'pack_loyalty':         [0,   0,   0,   .2,  0,   0,   .1,  0,   0,   0,   .5,  .2 ],
  'primal_sense':         [.5,  0,   0,   0,   0,   0,   0,   .4,  0,   0,   0,   .1 ],
  'gut_feeling':          [.1,  0,   0,   0,   0,   0,   0,   .2,  0,   0,   0,   .7 ],
  'body_awareness':       [0,   .4,  0,   0,   0,   0,   0,   .3,  0,   0,   0,   .3 ],
  'servant_leader':       [0,   0,   0,   .1,  0,   .2,  0,   0,   0,   .5,  0,   .2 ],
  'charisma':             [0,   0,   0,   0,   .6,  0,   .1,  0,   .2,  .1,  0,   0  ],
  'analytical':           [0,   0,   .3,  0,   0,   .5,  0,   0,   .1,  .1,  0,   0  ],
  'community':            [0,   0,   0,   .1,  0,   0,   .2,  0,   0,   0,   .6,  .1 ],
  'passionate':           [.1,  0,   0,   0,   .2,  0,   0,   .5,  0,   0,   0,   .2 ],
  'togetherness':         [0,   0,   0,   .3,  0,   0,   .4,  0,   0,   0,   .2,  .1 ],
  'expression':           [0,   0,   .2,  0,   .5,  0,   0,   0,   .2,  .1,  0,   0  ],
  'protective':           [.2,  0,   0,   .4,  0,   0,   0,   0,   0,   .3,  0,   .1 ],
  'independence':         [.2,  0,   0,   0,   0,   0,   0,   0,   .5,  .1,  .2,  0  ],
  'sensory_connection':   [0,   .4,  0,   .1,  0,   0,   0,   .3,  0,   0,   0,   .2 ],
  'physical_expression':  [.1,  .1,  0,   0,   .2,  0,   0,   .4,  0,   0,   0,   .2 ],

  // === QUISSME-SPEZIFISCHE ERWEITERUNGEN ===

  // --- Trinity-Cluster Keywords ---
  'initiative':           [.4,  0,   0,   0,   .2,  0,   0,   .2,  .1,  .1,  0,   0  ],
  'anchor':               [0,   .4,  0,   .1,  0,   .1,  0,   0,   0,   .3,  0,   .1 ],
  'vision':               [0,   0,   .1,  0,   .1,  0,   0,   0,   .3,  .1,  .3,  .1 ],
  'intensity':            [.1,  0,   0,   0,   .2,  0,   0,   .5,  0,   0,   0,   .2 ],
  'routine':              [0,   .3,  0,   .1,  0,   .3,  0,   0,   0,   .2,  0,   .1 ],
  'ambition':             [0,   0,   0,   0,   .2,  0,   0,   0,   .2,  .4,  .1,  .1 ],
  'response':             [0,   0,   0,   .3,  0,   0,   .2,  .2,  0,   0,   0,   .3 ],
  'conflict_style':       [.1,  0,   .1,  .2,  0,   0,   .3,  .1,  0,   .1,  0,   .1 ],
  'security':             [0,   .3,  0,   .3,  0,   .1,  0,   0,   0,   .2,  0,   .1 ],
  'growth':               [0,   0,   .1,  0,   .1,  0,   0,   0,   .3,  .1,  .2,  .2 ],
  'reception':            [0,   .1,  0,   .3,  0,   0,   .1,  .2,  0,   0,   0,   .3 ],
  'architect':            [0,   .1,  .1,  0,   0,   .3,  0,   0,   .1,  .3,  .1,  0  ],
  'building':             [0,   .1,  0,   0,   .1,  .1,  0,   0,   .2,  .3,  .2,  0  ],

  // --- Love-Language Keywords ---
  'affirmation':          [0,   0,   .3,  .2,  .3,  0,   .1,  0,   0,   0,   0,   .1 ],
  'quality_time':         [0,   .1,  0,   .3,  0,   0,   .3,  0,   0,   0,   .1,  .2 ],
  'symbolic_gift':        [0,   .2,  0,   .2,  .1,  0,   .1,  0,   0,   0,   0,   .4 ],
  'acts_of_service':      [0,   .1,  0,   .2,  0,   .3,  .1,  0,   0,   .2,  .1,  0  ],
  'verbal_warmth':        [0,   0,   .2,  .3,  .2,  0,   .2,  0,   0,   0,   0,   .1 ],
  'shared_presence':      [0,   .1,  0,   .2,  0,   0,   .3,  0,   0,   0,   .2,  .2 ],
  'surprise_gesture':     [0,   .1,  .1,  .2,  .2,  0,   .1,  0,   0,   0,   0,   .3 ],
  'practical_care':       [0,   .2,  0,   .1,  0,   .3,  .1,  0,   0,   .2,  .1,  0  ],
  'deep_listening':       [0,   0,   .1,  .4,  0,   0,   .2,  0,   0,   0,   0,   .3 ],

  // --- Streitkultur / Conflict Keywords ---
  'repair_attempt':       [0,   0,   .1,  .3,  0,   0,   .3,  0,   0,   0,   .1,  .2 ],
  'de_escalation':        [0,   .2,  0,   .2,  0,   .1,  .3,  0,   0,   .1,  0,   .1 ],
  'assertive':            [.3,  0,   .1,  0,   .2,  0,   0,   .1,  .1,  .2,  0,   0  ],
  'avoidant':             [0,   .2,  0,   0,   0,   0,   0,   0,   .1,  0,   0,   .7 ],
  'collaborative':        [0,   0,   .1,  .2,  0,   0,   .3,  0,   0,   .1,  .2,  .1 ],
  'emotional_flooding':   [.1,  0,   0,   .3,  0,   0,   0,   .3,  0,   0,   0,   .3 ],
};
```

### 3.3 Tag-Affinities (Archetypen-Bonus)

```javascript
const TAG_AFFINITY = {
  // Bazodiac Original
  'guardian':    [.2,  0,   0,   .3,  0,   0,   0,   0,   0,   .3,  .1,  .1 ],
  'flame':      [.1,  0,   0,   0,   .3,  0,   0,   .4,  0,   0,   0,   .2 ],
  'healer':     [0,   0,   0,   .2,  0,   .2,  0,   0,   0,   0,   0,   .6 ],
  'trickster':  [0,   0,   .4,  0,   0,   0,   0,   0,   .3,  0,   .2,  .1 ],
  'warrior':    [.5,  0,   0,   0,   .2,  0,   0,   .2,  0,   .1,  0,   0  ],

  // QuissMe Love-Language Typen
  'encourager':      [0,   0,   .2,  .2,  .3,  0,   .1,  0,   0,   0,   .1,  .1 ],
  'mirror':          [0,   0,   .2,  .3,  0,   .2,  .1,  0,   0,   0,   0,   .2 ],
  'poet':            [0,   0,   .2,  .1,  .3,  0,   0,   0,   .1,  0,   0,   .3 ],
  'conversationalist':[0,  0,   .3,  .3,  0,   0,   .2,  0,   0,   0,   .1,  .1 ],
  'adventurer':      [.1,  0,   0,   0,   .2,  0,   0,   .1,  .4,  0,   .1,  .1 ],
  'safe_harbor':     [0,   .3,  0,   .3,  0,   0,   .2,  0,   0,   .1,  0,   .1 ],
  'symbolist':       [0,   .2,  0,   .1,  .1,  0,   0,   0,   0,   0,   0,   .6 ],
  'collector':       [0,   .4,  0,   .2,  0,   .1,  0,   0,   0,   .1,  0,   .2 ],
  'surprise_maker':  [0,   .1,  .1,  .1,  .3,  0,   .1,  0,   .1,  0,   0,   .2 ],
  'doer':            [.2,  .1,  0,   0,   0,   .3,  0,   0,   0,   .3,  .1,  0  ],
  'team_player':     [0,   0,   .1,  .1,  0,   .2,  .2,  0,   0,   .1,  .3,  0  ],
  'reliever':        [0,   .2,  0,   .3,  0,   .2,  .1,  0,   0,   .1,  0,   .1 ],
  'initiator':       [.3,  0,   0,   0,   .2,  0,   0,   .3,  .1,  0,   0,   .1 ],
  'harbor':          [0,   .3,  0,   .3,  0,   0,   .2,  .1,  0,   0,   0,   .1 ],
  'circuit':         [0,   .2,  0,   .1,  0,   0,   .1,  .4,  0,   0,   0,   .2 ],

  // QuissMe Trinity-Profil-Tags
  'passion_primary':  [.1,  0,   0,   0,   .2,  0,   0,   .5,  0,   0,   0,   .2 ],
  'stability_primary':[0,   .3,  0,   .1,  0,   .2,  0,   0,   0,   .3,  0,   .1 ],
  'future_primary':   [0,   0,   .1,  0,   .1,  0,   0,   0,   .3,  .2,  .2,  .1 ],
};
```

---

## 4. Sektor-Referenz: 12 Sektoren des Fusion Ring

| S   | Zeichen      | Archetypische Domäne                   | Primär-Domains                    |
|-----|-------------|----------------------------------------|-----------------------------------|
| S0  | Widder      | Impuls, Mut, Initiative, Körper        | instinct, freedom                 |
| S1  | Stier       | Sinnlichkeit, Stabilität, Genuss       | sensory, emotion                  |
| S2  | Zwillinge   | Kognition, Kommunikation, Neugier      | cognition, creative               |
| S3  | Krebs       | Emotion, Fürsorge, Empathie, Schutz    | emotion, love, social             |
| S4  | Löwe        | Ausdruck, Kreativität, Führung         | creative, leadership, expression  |
| S5  | Jungfrau    | Analyse, Dienst, Präzision, Ordnung    | cognition (analysis), leadership  |
| S6  | Waage       | Beziehung, Harmonie, Balance           | social, love                      |
| S7  | Skorpion    | Tiefe, Transformation, Intensität      | instinct, love, spiritual         |
| S8  | Schütze     | Freiheit, Philosophie, Abenteuer       | freedom, cognition                |
| S9  | Steinbock   | Struktur, Ambition, Verantwortung      | leadership, instinct              |
| S10 | Wassermann  | Kollektiv, Innovation, Zukunft         | social, creative, freedom         |
| S11 | Fische      | Intuition, Hingabe, Spiritualität      | spiritual, sensory, instinct      |

---

## 5. Brücken-Mapping: Bestehende Cluster → Sektoren

### 5.1 Trinity → Sektoren

| Trinity-Cluster | Primär-Sektoren | Resonanz-Logik                                    |
|----------------|----------------|---------------------------------------------------|
| `passion`       | S7, S0, S4     | Intensität + Impuls + Ausdruck                    |
| `stability`     | S1, S9, S5     | Sinnlichkeit + Struktur + Ordnung                 |
| `future`        | S8, S10, S2    | Freiheit + Innovation + Kognition                 |

**Implementierung:** Wenn ein Quiz `hidden_cluster: "passion"` hat und der User dort hoch scort, erzeugt die Engine einen Marker wie `marker.love.passionate` (weight = normalisierter Score). Der Keyword-Lookup routet automatisch zu S7-peak.

### 5.2 Love Languages → Sektoren

| Sprache    | Primär-Sektoren | Resonanz-Logik                                    |
|-----------|----------------|---------------------------------------------------|
| `words`    | S2, S4, S3     | Kommunikation + Ausdruck + Empathie               |
| `time`     | S3, S6, S11    | Fürsorge + Beziehung + Hingabe                    |
| `gifts`    | S1, S11, S3    | Sinnlichkeit + Spiritualität (Symbolik) + Emotion |
| `service`  | S5, S9, S3     | Dienst + Verantwortung + Fürsorge                 |
| `touch`    | S7, S1, S11    | Intensität + Sinnlichkeit + Hingabe               |

### 5.3 Marker-Emission pro Quiz-Typ

Jedes Quiz erzeugt einen ContributionEvent. Die `cluster_scores` werden in Markers umgewandelt:

**Trinity-Quiz:**
```
cluster_scores: { passion: 0.8, stability: 0.3, future: 0.1 }
→ Markers:
  marker.love.passionate        (w = 0.8)
  marker.emotion.anchor         (w = 0.3)  // stability-signal
  marker.cognition.vision       (w = 0.1)  // future-signal
```

**Love-Language-Quiz:**
```
cluster_scores: { words: 0.2, time: 0.1, gifts: 0.05, service: 0.1, touch: 0.9 }
→ Markers:
  marker.love.physical_touch    (w = 0.9)  // höchster Score
  marker.love.affirmation       (w = 0.2)  // words-signal
  marker.love.quality_time      (w = 0.1)
  marker.love.acts_of_service   (w = 0.1)
```

**Regel:** Nur Scores > 0.05 erzeugen Markers. Normalisiert auf max(scores).

---

## 6. Resolution-Algorithmus (Bazodiac-kompatibel)

### 6.1 Marker → Sektoren

```javascript
function resolveMarkerToSectors(marker) {
  const parts = marker.id.split('.');
  const domain  = parts[1];   // z.B. 'love'
  const keyword = parts[2];   // z.B. 'physical_touch'

  // Ebene 2: Keyword-Präzision
  if (AFFINITY_MAP[keyword]) {
    return AFFINITY_MAP[keyword].map(a => a * marker.weight);
  }
  // Ebene 1: Domain-Fallback
  if (AFFINITY_MAP[domain]) {
    return AFFINITY_MAP[domain].map(a => a * marker.weight);
  }
  // Ebene 0: Unbekannt → ignorieren (kein Crash)
  return new Array(12).fill(0);
}
```

### 6.2 Event-Aggregation

```javascript
function eventToSectorSignals(event) {
  const signals = new Array(12).fill(0);
  for (const marker of event.payload.markers) {
    const contribution = resolveMarkerToSectors(marker);
    for (let s = 0; s < 12; s++) {
      signals[s] += contribution[s];
    }
  }
  const maxAbs = Math.max(...signals.map(Math.abs), 0.01);
  return signals.map(s => s / maxAbs);
}
```

### 6.3 Multi-Event Fusion

```javascript
function fuseAllEvents(events) {
  const fused = new Array(12).fill(0);
  for (const event of events) {
    const eventSignals = eventToSectorSignals(event);
    const confidence = avgConfidence(event);
    for (let s = 0; s < 12; s++) {
      fused[s] += eventSignals[s] * confidence;
    }
  }
  const maxAbs = Math.max(...fused.map(Math.abs), 0.01);
  return fused.map(s => Math.max(-1, Math.min(1, s / maxAbs)));
}
```

### 6.4 Masterformel

```
Signal(s) = 0.30·W(s) + 0.30·B(s) + 0.20·X(s) + 0.20·T(s)
```

| Komponente | Quelle           | Gewicht |
|-----------|------------------|---------|
| W(s)       | Natal-Astro      | 0.30    |
| B(s)       | Bazodiac-Basis   | 0.30    |
| X(s)       | Cross-Referenz   | 0.20    |
| **T(s)**   | **Quiz-Events**  | **0.20**|

**T(s) = fuseAllEvents(completedEvents)[s]**

---

## 7. Erweiterungsprotokoll: Neuen Quiz hinzufügen

### Schritt 1: Quiz definieren
Quiz mit `hidden_cluster`, `type_model`, `cluster_scores` per Option gemäß bestehender Spezifikation (siehe cluster-template.json).

### Schritt 2: Marker-Keywords prüfen
Werden neue semantische Konzepte eingeführt, die nicht durch bestehende Keywords abgedeckt sind?

- **Nein** → Domain-Fallback greift. Keine Änderung nötig.
- **Ja** → Neues Keyword in AFFINITY_MAP eintragen (eine Zeile). Summe ~1.0.

### Schritt 3: Marker-Emission konfigurieren
ContributionEvent muss Markers im Format `marker.<domain>.<keyword>` emittieren.

**Checkliste für neue Keywords:**
```
[ ] Keyword ist lowercase, snake_case, max. 2 Wörter
[ ] Domain existiert in registrierten Domains (§2.2)
[ ] AFFINITY_MAP Zeile summiert sich auf ~1.0
[ ] Mindestens 1 Sektor hat Gewicht >= 0.3 (Primary Peak)
[ ] Maximal 4 Sektoren haben Gewicht > 0.1
[ ] Keyword semantisch disjunkt von bestehenden Keywords
```

### Schritt 4: Tag-Affinities (optional)
Wenn der Quiz Archetypen-Tags erzeugt (`tag.archetype.*`), Eintrag in TAG_AFFINITY.

---

## 8. Validierungsregeln für Quiz-Erzeugung

### 8.1 Scoring-Constraints (bestehend, unverändert)
- `cluster_scores`: Range -1.0 bis +1.0, bevorzugt subtil: -0.4 bis +0.4
- `type_scores`: Mindestens 1 Typ pro Option mit starkem Signal (0.6–1.0)
- `duo_trait_deltas`: Optional, Range -0.2 bis +0.2
- Pro Frage: Min. 1 Option Richtung hidden_cluster, min. 1 Option weg

### 8.2 Marker-Constraints (neu)
- Jeder emittierte Marker muss `marker.<domain>.<keyword>` Format einhalten
- `weight`: Range 0.0 bis 1.0
- Pro ContributionEvent: Min. 2 Markers, max. 10 Markers
- Höchster Marker-Weight ≥ 0.6 (klares Signal)
- `evidence.confidence` ≥ 0.5

### 8.3 Sektor-Balance-Check
Nach Marker-Resolution: Maximal 3 Sektoren sollten > 0.5 (nach Normalisierung) haben. Wenn mehr als 3 Sektoren hoch scoren, ist das Profil zu diffus → Quiz-Differenzierung überprüfen.

---

## 9. Integrationsanalyse: Ergebnisse der Evaluierung

### 9.1 Kompatibilität: BESTÄTIGT ✓

| Aspekt | Status | Detail |
|--------|--------|--------|
| Marker-Format | ✓ Kompatibel | Bestehende ContributionEvents nutzen bereits `marker.domain.keyword` |
| Domain-Coverage | ✓ Ausreichend | 10 Domains decken alle QuissMe-Quiz-Themen ab |
| 2-Ebenen-Resolution | ✓ Robust | Keyword → Domain → Ignore Fallback verhindert Crashes |
| Normalisierung | ✓ Konsistent | [-1, 1] Range passt zu bestehenden cluster_scores |
| Erweiterbarkeit | ✓ Skaliert | Neue Quizzes = neue AFFINITY_MAP Zeile, kein Code-Change |

### 9.2 Ergänzungen gegenüber Bazodiac-Original

| Ergänzung | Grund |
|-----------|-------|
| 13 Trinity-Keywords hinzugefügt | Bestehende passion/stability/future Quizzes brauchen granulare Sektor-Zuordnung |
| 9 Love-Language-Keywords hinzugefügt | 5-Sprachen-System braucht eigene Keyword-Präzision |
| 6 Conflict-Keywords hinzugefügt | Streitkultur-Cluster braucht Sektor-Mapping |
| 15+ Tag-Affinities hinzugefügt | Love-Language Typen + Trinity-Profile als Archetypen-Tags |

### 9.3 Offene Punkte

| # | Thema | Priorität | Nächster Schritt |
|---|-------|-----------|------------------|
| 1 | Astro-Komponenten (W, B, X) noch nicht spezifiziert | Mittel | Bazodiac-Astro-Engine definiert diese separat |
| 2 | Confidence-Berechnung `avgConfidence()` | Hoch | Formel: `answeredQuestions / totalQuestions * qualityFactor` |
| 3 | Dating-Matching (§6.3 im Bazodiac) | Niedrig | Schublade — spätere Phase |
| 4 | Cross-Quiz Marker-Interferenz | Mittel | Monitoring nach Live-Daten: Werden Profile zu einheitlich? |

---

## 10. Versionierung

| Version | Datum | Änderung |
|---------|-------|----------|
| v1.0 | 2026-03-06 | Initial: Bazodiac-Integration + QuissMe-Erweiterungen |
| — | — | Nächstes Update bei neuem Quiz-Cluster oder neuer Domain |

**Update-Regel:** Dieses Dokument wird aktualisiert, wenn:
- Ein neuer Quiz-Cluster Keywords einführt, die noch nicht in der AFFINITY_MAP stehen
- Neue Domains nötig werden
- Sektor-Gewichte auf Basis von Live-Daten rekalibriert werden
- Die Masterformel-Gewichte angepasst werden
