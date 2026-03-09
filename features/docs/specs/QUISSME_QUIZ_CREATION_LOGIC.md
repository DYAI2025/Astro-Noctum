# QUISSME_QUIZ_CREATION_LOGIC.md — Unified Single Source of Truth
**Version:** v2.0  
**Stand:** 2026-03-07  
**Status:** Verbindliches Gesamtdokument für jede Quiz-Erzeugung, Scoring-Berechnung und Fusion-Ring-Integration  
**Autorität:** Bazodiac Semantic Marker Mapping v2 hat Vorrang bei allen Konflikten.

---

## TEIL 0 — DOKUMENTZWECK & HIERARCHIE

Dieses Dokument vereint **alle** Regeln, Constraints, Mappings und Algorithmen, die für die Erzeugung von QuissMe-Quizzen gelten, in **einem** verbindlichen Regelwerk. Es ersetzt die Notwendigkeit, zwischen separaten Dokumenten zu navigieren.

### Prioritäts-Kaskade (absteigend)

```
1. Bazodiac Semantic Marker Mapping v2 (§5–§8)
   → 12-Sektor Fusion Ring, AFFINITY_MAP, Resolution-Algorithmus
2. Quiz-Scoring-Constraints (§4)
   → cluster_scores, type_scores, duo_trait_deltas
3. Content & Safety Guardrails (§3)
   → Positive Framing, Never-Use-Words, Barnum-Prinzip
4. Architektur & Templates (§2)
   → JSON-Schema, Output-Modes, Narrator-System
5. Psychologische Prinzipien (§1)
   → 5 Moleküle, Zonen-Modell, Ko-Kreation
```

**Bei Konflikt gilt immer die höhere Ebene.**

---

## TEIL 1 — PRODUKTPHILOSOPHIE & PSYCHOLOGISCHE GRUNDLAGEN

### 1.1 Das QuissMe-Prinzip: Independent Play → Shared Insight

QuissMe funktioniert als Paar-Ritual ohne Terminzwang. Beide Partner machen Quizzes **unabhängig** voneinander. Gemeinsame Erkenntnisse entstehen **nur**, wenn beide denselben Quiz-Cluster (ClusterCycle) abgeschlossen haben. Zeitversetzt ist ausdrücklich erlaubt.

**Warum:** Das schützt vor Druck, Vergleich und asymmetrischem Wissen.

### 1.2 Drei Zonen statt „gut/schlecht" (Flow / Spark / Talk)

Jedes Quiz wird auf eine Meta-Ebene gemappt:

| Zone | Bedeutung | Framing |
|------|-----------|---------|
| **Flow** | Hohe Deckungsgleichheit | Stabilität, Leichtigkeit, „gleiche Sprache" |
| **Spark** | Komplementarität im Optimum | Anziehung durch Kontrast, Sweet Spot |
| **Talk** | Differenz zu groß | Feld für Kommunikation — niemals „Problem" |

**Produktziel:** Paare erleben Unterschiede als **Chance**, nicht als Zweifel.

### 1.3 Die 5 Moleküle (unveränderliche Prinzipien)

**Molekül 1 — Frag nie direkt, was du wissen willst.**  
Szenario-Fragen statt Trait-Aussagen. Die besten Fragen fühlen sich an wie Tagträume, nicht wie Fragebögen. Sobald jemand spürt, dass er „getestet" wird, antwortet er strategisch statt intuitiv.

**Molekül 2 — Jedes Ergebnis muss teilenswert sein.**  
Kein Profil darf ein Verlierer-Ergebnis sein. Differenzierung muss scharf sein, aber jedes Profil braucht seinen eigenen Stolz. „Der Nebel" ist genauso begehrenswert wie „Die Flamme".

**Molekül 3 — Das Ergebnis ist Projektionsfläche, keine Diagnose.**  
Ko-Kreation via Barnum-Effekt: Vage genug für breite Resonanz, spezifisch genug für persönliches Gefühl. Der Nutzer wird Co-Autor seines Ergebnisses.

**Molekül 4 — Die Reise ist das halbe Ergebnis.**  
Fortschrittsbalken, eine Frage pro Seite, Micro-Wins. Zeigarnik-Effekt + Sunk-Cost-Dynamik. Wer Frage 7/10 erreicht hat, bricht nicht ab.

**Molekül 5 — Das Ergebnis startet ein Gespräch.**  
Kompatibilitätsmatrix, Allies, „Tagge deinen Typ". Das Ergebnis ist kein Endpunkt, sondern Gesprächsanfang. Der virale Loop entsteht, weil ein Ergebnis Reaktionen auslöst.

### 1.4 Barnum-Effekt als Design-Werkzeug

Der Barnum-Effekt ist kein Trick, sondern Einladung zur Selbstinterpretation:

- **Vagheit als Projektionsfläche:** Nutzer füllen vage Hüllen mit eigener Biografie
- **Sowohl-als-auch-Technik:** Widersprüchliche Pole abdecken, situationsabhängig
- **Positives Framing:** Selbstwertmanagement — Menschen akzeptieren schmeichelhafte Aussagen
- **Hohe Basisraten:** Eigenschaften ansprechen, die bei fast allen vorkommen

### 1.5 Neuronale Trigger-Architektur

| Mechanismus | Hirnregion | Funktion im Quiz |
|-------------|-----------|------------------|
| Belohnungssystem | VS / VMPFC | Positives Framing aktiviert Dopamin |
| Selbstverarbeitung | MPFC / PCC | „Wer bin ich?"-Fragen triggern Identitätsverarbeitung |
| Emotionsregulation | PFC / Amygdala | Warme Sprache reguliert Distress |
| Gamification | Dopaminerg | Micro-Wins, Fortschrittsbalken, Completion |

---

## TEIL 2 — QUIZ-ARCHITEKTUR & JSON-SCHEMA

### 2.1 Drei-Schichten-Architektur

```
┌─────────────────────────────────────────────────────┐
│  SCHICHT 3: Fusion Ring (12 Sektoren, S0–S11)       │
│  ← Bazodiac Semantic Marker Mapping v2              │
│  ← Endgültige Visualisierung des User-Profils       │
│  ← HAT VORRANG BEI KONFLIKTEN                       │
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

### 2.2 Output-Mode: full_v2 (Primär)

```json
{
  "id": "QUIZ_ID",
  "hidden_cluster": "passion|stability|future",
  "facet_label": { "de-DE": "...", "en-US": "..." },
  "axis_key": "closeness|alignment|tension",
  "tone": "playful|warm_minimal|premium_poetic",
  "narrator_id": "ember|stone|oracle",
  "type_model": {
    "types": ["typeA", "typeB", "typeC"],
    "compute": "max_type_score"
  },
  "questions": [
    {
      "id": "q1",
      "text": { "de-DE": "...", "en-US": "..." },
      "options": [
        {
          "id": "A",
          "text": { "de-DE": "...", "en-US": "..." },
          "type_scores": { "typeA": 0.0, "typeB": 0.0, "typeC": 0.0 },
          "cluster_scores": { "passion": 0.0, "stability": 0.0, "future": 0.0 },
          "duo_trait_deltas": { "play": 0.0, "closeness": 0.0 }
        },
        { "id": "B", "..." : "..." },
        { "id": "C", "..." : "..." },
        { "id": "D", "..." : "..." }
      ]
    }
  ]
}
```

### 2.3 Output-Mode: minimal_v1

```json
[
  {
    "question_de": "…",
    "answers": [
      {"text_de":"…","traits":{"passion":0.0,"stability":0.0,"future":0.0}},
      {"text_de":"…","traits":{"passion":0.0,"stability":0.0,"future":0.0}},
      {"text_de":"…","traits":{"passion":0.0,"stability":0.0,"future":0.0}},
      {"text_de":"…","traits":{"passion":0.0,"stability":0.0,"future":0.0}}
    ]
  }
]
```

### 2.4 Narrator-System

| Cluster | Narrator | Voice |
|---------|----------|-------|
| passion | **ember** | Spielerisch, sinnlich, direkt aber weich |
| stability | **stone** | Warm, ruhig, pragmatisch ohne Kälte |
| future | **oracle** | Visionär, ermutigend, klar ohne Druck |

### 2.5 Axis-Keys (intern normalisiert)

| Interner Key | DE-UI-Key | EN-UI-Key |
|-------------|-----------|-----------|
| `closeness` | Nähe | Closeness |
| `alignment` | Flow | Alignment |
| `tension` | Reibung | Tension |

Wenn User DE/UI-Keys liefert (nähe, flow, reibung), intern auf closeness/alignment/tension normalisieren.

### 2.6 Meta-Cluster & Gating

```json
{
  "shared_gate": {
    "require_both_partners": true,
    "gate_level": "meta_cluster",
    "time_shift_allowed": true
  },
  "masking": {
    "hide_cluster_labels_until_reveal": true,
    "hide_buff_preview": true
  },
  "reveal": {
    "compute_primary_cluster": "sum_selected_option_scores_by_hidden_cluster",
    "show_secondary_cluster": true,
    "unlock_buff": {
      "exactly_one_buff": true,
      "buff_duration_days": 7,
      "one_time_per_couple": true,
      "persist_forbidden_after_use": true
    }
  }
}
```

### 2.7 Zone-Logic pro Quiz

```json
{
  "zone_logic": {
    "method": "rule_order",
    "rule_order": [
      { "if": "pair_types_equal", "zone": "flow" },
      { "if": "pair_key_in_talk_pairs", "zone": "talk" },
      { "else": "spark" }
    ]
  }
}
```

### 2.8 Input-Template für Quiz-Generierung

```xml
<quiz_generation_request>
  <output_mode>full_v2 | minimal_v1</output_mode>
  <cluster>passion | stability | future</cluster>
  <facet_label_de>...</facet_label_de>
  <facet_label_en>...</facet_label_en>
  <quiz_id>z.B. passion_01_initiative</quiz_id>
  <axis_key>closeness | alignment | tension</axis_key>
  <question_count>1-12</question_count>
  <locales>de-DE, en-US</locales>
  <tone>playful | warm_minimal | premium_poetic</tone>
  <narrator_id>ember | stone | oracle</narrator_id>
  <type_model>
    <types>typeA, typeB, typeC</types>
    <compute>max_type_score</compute>
  </type_model>
  <content_constraints>
    <themes>...</themes>
    <do_not_cover>...</do_not_cover>
  </content_constraints>
</quiz_generation_request>
```

---

## TEIL 3 — CONTENT & SAFETY GUARDRAILS

### 3.1 Positive-Framing-Regeln

| Erlaubt (immer) | Beispiel |
|-----------------|----------|
| Möglichkeitsform | „kann / manchmal / oft / möglicherweise" |
| Systemisch statt individuell | „zwischen euch / in eurer Dynamik" |
| Einladende Micro-Ideen | „Vielleicht hilft…" / „Eine kleine Idee…" |

### 3.2 Never-Use-Words (HART — keine Ausnahmen)

| Kategorie | Verboten (DE) | Verboten (EN) |
|-----------|--------------|---------------|
| Diagnose/Labels | krank, Störung, Therapie, toxisch | disorder, toxic, diagnosis |
| Imperativdruck | du musst, ihr müsst, ihr solltet, falsch | you must, should, wrong |
| Angst-Trigger | Warnsignal, gefährlich, Trennung | red flag, danger, break up |

### 3.3 Content-Constraints für Fragen

- **4 Optionen exakt**, labeled A–D
- Alle Optionen **gleichwertig attraktiv** (kein offensichtlich „bestes")
- **Szenario-basiert**, konkrete Alltagssituationen (kein „Bewerte dich selbst…")
- **Positive Framing** — liebenswerte Macken statt Probleme
- Kein Coaching-Versprechen, keine Schuldzuweisung

### 3.4 Zonen-Vokabular

**Flow Zone (DE):**
- „Hier seid ihr auf derselben Wellenlänge."
- „Das trägt euch im Alltag."
- „Das funktioniert oft ohne große Erklärung."

**Spark Zone (DE):**
- „Das ist euer Sweet Spot: unterschiedlich genug, um spannend zu bleiben."
- „Hier entsteht Anziehung durch Kontrast."
- „Ein Unterschied, der euch lebendig macht."

**Talk Zone (DE):**
- „Hier lohnt sich eine gemeinsame Sprache."
- „Kein Problem — eher ein Feld, wo Abstimmung viel bewirken kann."
- „Wenn ihr hier kurz übersetzt, wird's schnell leichter."

### 3.5 Micro-Step Library (1 Satz, druckfrei)

- „Vielleicht hilft ein Satz wie: ‚So meinte ich das gerade…'"
- „Eine kleine Idee: Erst Gefühl, dann Bitte."
- „Manchmal reicht: ‚Was würdest du dir an dieser Stelle wünschen?'"
- „Vielleicht: 2 Minuten Check-in — ohne Lösungen, nur Verständnis."

### 3.6 Disclaimer (optional, nur in Long Text)

- **DE:** „Nur als spielerische Perspektive — kein Rat und kein Urteil."
- **EN:** "Just a playful perspective — not advice or a verdict."

---

## TEIL 4 — SCORING-CONSTRAINTS

### 4.1 cluster_scores

- Range: **-1.0 bis +1.0**
- Bevorzugt subtil: **-0.4 bis +0.4**
- Pro Frage: **Min. 1 Option Richtung hidden_cluster**, min. 1 Option weg
- Jede Frage muss Optionen **sinnvoll differenzieren** — keine identischen Scores
- Keine Option darf alle drei Achsen dominieren

### 4.2 type_scores

- Mindestens **1 Typ pro Option mit starkem Signal** (0.6–1.0)
- Andere Typen schwächer (0.0–0.4)
- Keys müssen exakt mit `type_model.types` übereinstimmen
- Default-Compute: `max_type_score`

### 4.3 duo_trait_deltas (optional)

- Range: **-0.2 bis +0.2**
- Subtiles Feintuning für Paar-Traits (play, closeness, etc.)

### 4.4 Differenzierungs-Checks pro Frage

```
[✓] Mindestens 1 Option leaned toward hidden_cluster
[✓] Mindestens 1 Option leaned away (oder toward other cluster)
[✓] Keine Option dominiert alle 3 Achsen gleichzeitig
[✓] Alle 4 Optionen haben unterschiedliche Score-Profile
[✓] Type-Scores haben klare Signale (min 1 Typ ≥ 0.6 pro Option)
```

---

## TEIL 5 — BAZODIAC SEMANTIC MARKER MAPPING v2 (PRIORITÄT)

> **Dieses Kapitel hat Vorrang bei allen Konflikten mit älteren Definitionen.**

### 5.1 Das Prinzip: Semantische Resonanz

Jeder Quiz produziert einen ContributionEvent mit Markers (`marker.domain.keyword`) und Traits. Die Marker-IDs tragen ihre semantische Bedeutung im Namen. Das System ist **quiz-agnostisch** — ein Domain-Mapping, das für ALLE Quizzes funktioniert.

**Kern-Idee:** Die 12 Sektoren des Fusion Rings repräsentieren 12 archetypische Lebensdomänen. Jeder Marker resoniert mit einer oder mehreren Domänen. Die Resonanz-Stärke bestimmt, wie stark der Sektor ausschlägt.

### 5.2 Zwei Mapping-Ebenen

**Ebene 1 — Domain-Routing (Fallback):**  
Der erste Teil der Marker-ID (`marker.DOMAIN.*`) bestimmt die Primär-Sektoren.  
`love` → S3, S6, S7 | `instinct` → S0, S7, S8

**Ebene 2 — Keyword-Präzision:**  
Der zweite Teil (`marker.domain.KEYWORD`) verschiebt innerhalb der Domain-Sektoren.  
`love.physical_touch` → stärker S7 (Skorpion, körperliche Tiefe)  
`love.harmony` → stärker S6 (Waage, Balance)

**Fallback-Garantie:** Wenn Keyword unbekannt → Domain-Fallback. Wenn Domain unbekannt → Marker ignoriert. **So crasht nichts.**

### 5.3 Marker-Format-Spezifikation

```
marker.<domain>.<keyword>
```

**Regeln:**
- Immer lowercase, Punkte als Trenner
- Domain = semantisches Feld (max. 1 Wort)
- Keyword = spezifisches Signal (max. 2 Wörter, snake_case)

### 5.4 Registrierte Domains (10 Stück)

| Domain | Beschreibung | Primäre Sektoren |
|--------|-------------|-----------------|
| `love` | Zuneigung, Liebessprachen, Romantik | S3, S6, S7 |
| `emotion` | Gefühle, Empathie, emotionale Tiefe | S3, S1, S7 |
| `social` | Gemeinschaft, Diplomatie, Beziehung | S6, S10 |
| `instinct` | Urinstinkt, Bauchgefühl, Impuls | S0, S7, S8 |
| `cognition` | Denken, Analyse, Kommunikation | S2, S5 |
| `leadership` | Führung, Verantwortung, Charisma | S4, S9 |
| `freedom` | Freiheit, Abenteuer, Unabhängigkeit | S8, S0 |
| `spiritual` | Intuition, Hingabe, Transzendenz | S11, S7 |
| `sensory` | Sinnlichkeit, Körper, Genuss | S1, S7 |
| `creative` | Kreativität, Ausdruck, Spiel | S4, S2 |

**Erweiterungsregel:** Neue Domains nur wenn keine bestehende passt. Vor Einführung: AFFINITY_MAP Zeile definieren.

---

## TEIL 6 — AFFINITY_MAP (Vollständig)

Die AFFINITY_MAP ist das zentrale Lookup-Objekt. **Jede Zeile summiert sich auf ~1.0.**  
Format: `keyword: [S0, S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11]`

### 6.1 Domain-Level (Fallback-Ebene)

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

### 6.2 Keyword-Level — Bazodiac Original

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
```

### 6.3 Keyword-Level — Trinity-Cluster Keywords

```javascript
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
```

### 6.4 Keyword-Level — Love-Language Keywords

```javascript
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
```

### 6.5 Keyword-Level — Streitkultur / Conflict Keywords

```javascript
  // --- Streitkultur / Conflict Keywords ---
  'repair_attempt':       [0,   0,   .1,  .3,  0,   0,   .3,  0,   0,   0,   .1,  .2 ],
  'de_escalation':        [0,   .2,  0,   .2,  0,   .1,  .3,  0,   0,   .1,  0,   .1 ],
  'assertive':            [.3,  0,   .1,  0,   .2,  0,   0,   .1,  .1,  .2,  0,   0  ],
  'avoidant':             [0,   .2,  0,   0,   0,   0,   0,   0,   .1,  0,   0,   .7 ],
  'collaborative':        [0,   0,   .1,  .2,  0,   0,   .3,  0,   0,   .1,  .2,  .1 ],
  'emotional_flooding':   [.1,  0,   0,   .3,  0,   0,   0,   .3,  0,   0,   0,   .3 ],
};
```

### 6.6 Tag-Affinities (Archetypen-Bonus)

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

## TEIL 7 — 12-SEKTOR FUSION RING REFERENZ

| S | Zeichen | Archetypische Domäne | Primär-Domains |
|---|---------|---------------------|----------------|
| S0 | Widder | Impuls, Mut, Initiative, Körper | instinct, freedom |
| S1 | Stier | Sinnlichkeit, Stabilität, Genuss | sensory, emotion |
| S2 | Zwillinge | Kognition, Kommunikation, Neugier | cognition, creative |
| S3 | Krebs | Emotion, Fürsorge, Empathie, Schutz | emotion, love, social |
| S4 | Löwe | Ausdruck, Kreativität, Führung | creative, leadership |
| S5 | Jungfrau | Analyse, Dienst, Präzision, Ordnung | cognition (analysis), leadership |
| S6 | Waage | Beziehung, Harmonie, Balance | social, love |
| S7 | Skorpion | Tiefe, Transformation, Intensität | instinct, love, spiritual |
| S8 | Schütze | Freiheit, Philosophie, Abenteuer | freedom, cognition |
| S9 | Steinbock | Struktur, Ambition, Verantwortung | leadership, instinct |
| S10 | Wassermann | Kollektiv, Innovation, Zukunft | social, creative, freedom |
| S11 | Fische | Intuition, Hingabe, Spiritualität | spiritual, sensory, instinct |

### 7.1 Brücken-Mapping: Trinity → Sektoren

| Trinity-Cluster | Primär-Sektoren | Resonanz-Logik |
|----------------|----------------|----------------|
| `passion` | S7, S0, S4 | Intensität + Impuls + Ausdruck |
| `stability` | S1, S9, S5 | Sinnlichkeit + Struktur + Ordnung |
| `future` | S8, S10, S2 | Freiheit + Innovation + Kognition |

### 7.2 Brücken-Mapping: Love Languages → Sektoren

| Sprache | Primär-Sektoren | Resonanz-Logik |
|---------|----------------|----------------|
| `words` | S2, S4, S3 | Kommunikation + Ausdruck + Empathie |
| `time` | S3, S6, S11 | Fürsorge + Beziehung + Hingabe |
| `gifts` | S1, S11, S3 | Sinnlichkeit + Symbolik + Emotion |
| `service` | S5, S9, S3 | Dienst + Verantwortung + Fürsorge |
| `touch` | S7, S1, S11 | Intensität + Sinnlichkeit + Hingabe |

### 7.3 Marker-Emission pro Quiz-Typ

**Trinity-Quiz:**
```
cluster_scores: { passion: 0.8, stability: 0.3, future: 0.1 }
→ Markers:
  marker.love.passionate        (w = 0.8)
  marker.emotion.anchor         (w = 0.3)
  marker.cognition.vision       (w = 0.1)
```

**Love-Language-Quiz:**
```
cluster_scores: { words: 0.2, time: 0.1, gifts: 0.05, service: 0.1, touch: 0.9 }
→ Markers:
  marker.love.physical_touch    (w = 0.9)
  marker.love.affirmation       (w = 0.2)
  marker.love.quality_time      (w = 0.1)
  marker.love.acts_of_service   (w = 0.1)
```

**Regel:** Nur Scores > 0.05 erzeugen Markers. Normalisiert auf max(scores).

---

## TEIL 8 — RESOLUTION-ALGORITHMUS & MASTERFORMEL

### 8.1 Marker → Sektoren (2-Ebenen-Resolution)

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

### 8.2 Event-Aggregation

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

### 8.3 Multi-Event Fusion

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

**Confidence-Gewichtung:** Events mit höherer Confidence (mehr Fragen, höhere Messsicherheit) wiegen stärker. Quick-Quiz (5 Fragen) verschiebt weniger als Deep-Quiz (20 Fragen).

### 8.4 Masterformel

```
Signal(s) = 0.30·W(s) + 0.30·B(s) + 0.20·X(s) + 0.20·T(s)
```

| Komponente | Quelle | Gewicht |
|-----------|--------|---------|
| W(s) | Natal-Astro | 0.30 |
| B(s) | Bazodiac-Basis | 0.30 |
| X(s) | Cross-Referenz | 0.20 |
| **T(s)** | **Quiz-Events** | **0.20** |

**T(s) = fuseAllEvents(completedEvents)[s]**

Die Spannung zwischen Astro-Daten und Test-Ergebnis IST die interessanteste Information. Wenn ein Sternzeichen Jungfrau sagt aber Tests zeigen hohe Instinkt-Werte, dann IST das das Profil: analytisch auf der Oberfläche, urinstinktiv im Kern.

---

## TEIL 9 — MARKER-CONSTRAINTS & VALIDIERUNG

### 9.1 Marker-Format-Constraints

```
[✓] Format: marker.<domain>.<keyword>
[✓] Immer lowercase, snake_case, max. 2 Wörter
[✓] weight: Range 0.0 bis 1.0
[✓] Pro ContributionEvent: Min. 2 Markers, max. 10 Markers
[✓] Höchster Marker-Weight ≥ 0.6 (klares Signal)
[✓] evidence.confidence ≥ 0.5
```

### 9.2 Sektor-Balance-Check

Nach Marker-Resolution: Maximal **3 Sektoren** sollten > 0.5 (nach Normalisierung) haben. Wenn mehr als 3 Sektoren hoch scoren → Profil zu diffus → Quiz-Differenzierung überprüfen.

### 9.3 Checkliste für neue Keywords

```
[ ] Keyword ist lowercase, snake_case, max. 2 Wörter
[ ] Domain existiert in registrierten Domains (§5.4)
[ ] AFFINITY_MAP Zeile summiert sich auf ~1.0
[ ] Mindestens 1 Sektor hat Gewicht >= 0.3 (Primary Peak)
[ ] Maximal 4 Sektoren haben Gewicht > 0.1
[ ] Keyword semantisch disjunkt von bestehenden Keywords
```

### 9.4 Quiz-Erzeugung Gesamt-Validierung

```
[ ] JSON parses
[ ] Required keys exist (id, hidden_cluster, questions, etc.)
[ ] 4 Optionen pro Frage, IDs A/B/C/D
[ ] cluster_scores in [-1, +1], bevorzugt [-0.4, +0.4]
[ ] type_scores: min 1 Typ ≥ 0.6 pro Option
[ ] duo_trait_deltas in [-0.2, +0.2]
[ ] Positive Framing — keine Never-Use-Words
[ ] Szenario-basierte Fragen, keine Selbstbewertungen
[ ] Alle Optionen gleichwertig attraktiv
[ ] Marker-Emission valid (§9.1)
[ ] Sektor-Balance okay (§9.2)
```

---

## TEIL 10 — ERWEITERUNGSPROTOKOLL

### 10.1 Neuen Quiz hinzufügen (3 Schritte)

**Schritt 1:** Quiz definieren mit hidden_cluster, type_model, cluster_scores per Option.

**Schritt 2:** Marker-Keywords prüfen. Neue Konzepte eingeführt?
- **Nein** → Domain-Fallback greift. Keine Änderung nötig.
- **Ja** → Neues Keyword in AFFINITY_MAP eintragen (eine Zeile, Summe ~1.0).

**Schritt 3:** ContributionEvent muss Markers im Format `marker.<domain>.<keyword>` emittieren.

### 10.2 Neue Domain hinzufügen (selten)

Nur wenn keine bestehende Domain das Konzept abbilden kann:
1. Domain-Name definieren (1 Wort, lowercase)
2. Domain-Level Zeile in AFFINITY_MAP (Summe ~1.0)
3. Primäre Sektoren dokumentieren
4. Dieses Dokument aktualisieren

### 10.3 Tag-Affinities (optional)

Wenn Quiz Archetypen-Tags erzeugt (`tag.archetype.*`), Eintrag in TAG_AFFINITY. Tags haben niedrigeres Gewicht als Marker (tag.weight typisch 0.4–0.95).

---

## TEIL 11 — QUALITY ASSURANCE (QuizzExpert-Protokoll)

### 11.1 Skeleton-First Architecture

Trennung von Logik und Content:
1. Scoring-Matrix (JSON) erstellen, noch ohne Fragetexte
2. Erst wenn Matrix steht, darf der Copywriter arbeiten
3. **Kein Text ohne Mathe.**

### 11.2 Agentische Simulation

Virtueller Crashtest für jedes Quiz:
1. 3 synthetische Personas erstellen (Extremer Typ, Misch-Typ, Randgruppen-Typ)
2. Deren Antworten simulieren
3. Diskrepanzen reporten: Landet der richtige Typ im richtigen Profil?

### 11.3 Sycophancy & Bias Defense

- **Sycophancy Check:** Redet der Bot dem User nach dem Mund?
- **Self-Bias Check:** Scan auf Geschlechter-, Kultur-Stereotypen in Profilen
- **Anti-Blandness:** „Wenn es nett klingt, ist es falsch." → Schärfer machen.

---

## TEIL 12 — AI-OUTPUT TEMPLATES

### 12.1 Short Drop (2–4 Sätze)

```
DE: Euer Lernmoment: {insight_strength}.
    Was wirkt: {zone_sentence}.
    Wachstum: {insight_growth}.
    Mini-Idee: {micro_step} (optional)

EN: Your moment: {insight_strength}.
    What's working: {zone_sentence}.
    Growth: {insight_growth}.
    Small idea: {micro_step} (optional)
```

### 12.2 Long Journey (1–2 Absätze)

**Absatz 1:** Warmes Spiegelbild (Zone + Facet, ohne Bewertung).  
**Absatz 2:** Einladender Ausblick + optional 1 Micro-Step + optional Disclaimer.

### 12.3 Zulässige Input-Tokens (keine Rohantworten)

| Token | Werte |
|-------|-------|
| `zone` | flow, spark, talk |
| `facet_label` | Humor, Ritual, Direktheit, Abenteuer, Nähe, Struktur… |
| `axis` | nähe, flow, reibung (DE) / closeness, alignment, tension (EN) |
| `insight_strength` | 6–10 Wörter, positiv |
| `insight_growth` | 6–10 Wörter, positiv gerahmt |
| `micro_step` | 1 Satz, druckfrei |
| `buff_name` | optional |
| `tone` | warm_minimal, playful, premium_poetic |
| `locale` | de-DE, en-US |

---

## TEIL 13 — PROOF: BEISPIEL-BERECHNUNGEN

### 13.1 Love Languages Event → Ring ("Die Flamme")

```
Marker 1: marker.love.physical_touch (w=0.95)
  → [0, .19, 0, 0, 0, 0, 0, .57, 0, 0, 0, .19]

Marker 2: marker.love.sensory_connection (w=0.80)
  → [0, .32, 0, .08, 0, 0, 0, .24, 0, 0, 0, .16]

Marker 3: marker.emotion.body_awareness (w=0.75)
  → [0, .30, 0, 0, 0, 0, 0, .225, 0, 0, 0, .225]

Marker 4: marker.love.physical_expression (w=0.72)
  → [.072, .072, 0, 0, .144, 0, 0, .288, 0, 0, 0, .144]

Marker 5: marker.love.togetherness (w=0.56)
  → [0, 0, 0, .168, 0, 0, .224, 0, 0, 0, .112, .056]

Marker 6: marker.love.passionate (w=0.68)
  → [.068, 0, 0, 0, .136, 0, 0, .34, 0, 0, 0, .136]

Summe (roh):
  S0=0.14  S1=0.78  S2=0  S3=0.25  S4=0.28  S5=0  S6=0.22
  S7=1.65  S8=0  S9=0  S10=0.11  S11=0.75

Normalisiert (÷1.65):
  S0=0.08  S1=0.47  S2=0  S3=0.15  S4=0.17  S5=0  S6=0.14
  S7=1.00  S8=0  S9=0  S10=0.07  S11=0.46
```

**Ergebnis:** Peak S7 (Skorpion — Intensität) + Sekundär S1 (Stier — Sinnlichkeit) + S11 (Fische — Hingabe). DAS ist „Die Flamme" visuell.

### 13.2 Krafttier Event → Ring ("Der Wolf")

```
marker.social.pack_loyalty (w=0.82)  → S10 peak
marker.instinct.primal_sense (w=0.75) → S0 peak
marker.leadership.servant_leader (w=0.68) → S9 peak

Normalisiert:
  S0=0.63  S1=0  S2=0  S3=0.27  S4=0  S5=0.23
  S6=0.13  S7=0.51  S8=0  S9=0.57  S10=1.00  S11=0.28
```

**Ergebnis:** Peak S10 (Kollektiv/Rudel) + S0 (Instinkt) + S9 (Verantwortung). DAS ist der Wolf.

---

## TEIL 14 — INTERNER REASONING-PROZESS (nur für AI)

Bei jeder Quiz-Generierung intern durchlaufen (nie im Output zeigen):

### PS+ Methode

**1. Plan:** question_count, Szenarien, Mapping A–D, Narrator-Voice festlegen.  
**2. Generate:** Texte + Scores schreiben.  
**3. Validate:** Schema, Counts, Never-Use-Words, Score-Ranges, Balance.

### SC bei Unsicherheit

2–3 Varianten erzeugen und die constraint-konformste wählen.

### Selbst-Kritik vor Output

```
[✓] JSON parses, required keys exist, 4 options A–D per question
[✓] Positive framing + never_use_words compliance
[✓] Score ranges and differentiation per question
[✓] Marker-Emission compliant (§9.1)
[✓] Sektor-Balance okay (§9.2)
```

---

## TEIL 15 — VERSIONIERUNG

| Version | Datum | Änderung |
|---------|-------|----------|
| v1.0 | 2026-03-06 | Initial: Separate Dokumente |
| **v2.0** | **2026-03-07** | **Unified: Bazodiac v2 als Priorität, alle Logik in einem Dokument** |

**Update-Regel:** Dieses Dokument wird aktualisiert, wenn:
- Ein neuer Quiz-Cluster Keywords einführt, die noch nicht in der AFFINITY_MAP stehen
- Neue Domains nötig werden
- Sektor-Gewichte auf Basis von Live-Daten rekalibriert werden
- Die Masterformel-Gewichte angepasst werden
- Neue Narrator oder Tone-Varianten eingeführt werden

---

*Ende des Unified Quiz Creation Logic Dokuments.*
