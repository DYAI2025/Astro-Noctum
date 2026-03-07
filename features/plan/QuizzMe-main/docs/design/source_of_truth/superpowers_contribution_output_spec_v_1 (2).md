# Superpowers Contribution Output Spec v1

## Ziel

Alle Quizzes, Persönlichkeitstests, Horoskope (und zukünftige Module) liefern **denselben technischen Output**, damit sie konsistent in:

- das **Character Sheet** (UI-Rendering)
- und die **LME/Psyche Engine** (Aggregation, Glättung, Archetypen, Avatar)

…einfließen können.

**Prinzip:** Jedes Modul emittiert ein **ContributionEvent** (Ereignis), das (a) UI-fertige Werte (Traits/Tags/Unlocks) enthält und (b) **Marker** für die LME-Update-Pipeline.

---

## 1) Datenfluss / Pipeline (End-to-End)

### 1.1 Start → Ende (klar definiert)

**Start (Input):**

- User beantwortet Fragen (Quiz) **oder** betrachtet/konfiguriert Inhalte (Horoscope/Astro-Cheats) **oder** gibt Stammdaten ein (z.B. Geburtsdaten für Astro).

**Ende (Output im Product):**

- Root `/` rendert das Character Sheet aus einem **ProfileSnapshot** (siehe Abschnitt 1.2), der aus (a) Psyche/LME State, (b) Contribution Events, (c) Unlock-Registry und (d) optionalen Identitätsdaten zusammengesetzt wird.

### 1.2 Der zentrale Aggregationszustand: ProfileSnapshot

Der Character-Sheet-Renderer konsumiert ausschließlich diesen Snapshot:

```ts
type ProfileSnapshot = {
  psyche: {
    state: unknown;                  // LME PsycheState (versioned)
    archetypeMix: Array<{ id: string; score: number }>;
    visualAxes: Record<string, number>;
    avatarParams: Record<string, number | string>;
  };
  identity: {
    displayName?: string;
    birth?: { date?: string; time?: string; place?: string }; // optional
  };
  astro?: AstroPayload;              // WESTLICH / CHINESISCH / Addons
  traits: Record<string, TraitScore>; // trait.* → last/best value
  tags: Array<Tag>;                  // tag.*
  unlocks: Record<string, Unlock>;   // unlock.*
  meta: {
    completion: {
      percent: number;
      filledBlocks: string[];        // ["values", "social", "love", ...]
      unlockCount: number;
    };
    lastUpdatedAt: string;
  };
};
```

> Alles, was ins Character Sheet soll, muss über **ContributionEvent → Ingestion** in diesen Snapshot gelangen.

---

1. **User interagiert** mit einem Modul (Quiz/Horoscope/…)
2. Modul berechnet **Raw Scores** → normiert zu **Trait Scores (1–100)** + optional Confidence
3. Modul mappt Trait/Result → **Markers** (stabile IDs + weights)
4. Modul emittiert **ContributionEvent** (JSON)
5. Runtime:
   - validiert Schema
   - persistiert Event (Audit/History)
   - wendet Marker auf LME an (Marker → Dimension-Deltas → Smoothing → PsycheState)
   - merged Trait/Tag/Unlock/Astro in den ProfileSnapshot (siehe Merge-Regeln)
6. Root `/` rendert **Character Sheet** aus dem aktuellen Profile Snapshot

**Wichtig:** Bei Subdomains brauchst du shared persistence (domain-weite Cookies oder Server/KV), sonst ist localStorage pro Subdomain getrennt.

1. **User interagiert** mit einem Modul (Quiz/Horoscope/…)
2. Modul berechnet **Raw Scores** → normiert zu **Trait Scores (1–100)** + optional Confidence
3. Modul mappt Trait/Result → **Markers** (stabile IDs + weights)
4. Modul emittiert **ContributionEvent** (JSON)
5. Runtime:
   - validiert Schema
   - persistiert Event (Audit/History)
   - wendet Marker auf LME an (Marker → Dimension-Deltas → Smoothing → PsycheState)
   - berechnet Derived (ArchetypeMix, VisualAxes, AvatarParams)
6. Root `/` rendert **Character Sheet** aus dem aktuellen Profile Snapshot

**Wichtig:** Bei Subdomains brauchst du shared persistence (domain-weite Cookies oder Server/KV), sonst ist localStorage pro Subdomain getrennt.

---

## 2) Output: ContributionEvent (einheitlicher Contract)

### 2.1 Minimal Required (jede Quelle)

- `specVersion` (string) – z.B. `"sp.contribution.v1"`
- `eventId` (uuid)
- `occurredAt` (ISO)
- `source` – wer sendet das Event (vertical, moduleId, domain)
- `payload.markers[]` – Liste von Markern (für LME)

### 2.2 Optional (UI/Progress/Flavor)

- `payload.traits[]` – normierte 1–100 Sliders (mit Confidence)
- `payload.tags[]` – Keyword-Tags (Archetyp-Keywords, Shadow-Tendenz, Humor-Stil …)
- `payload.unlocks[]` – freigeschaltete Wappen/Symbole/Sheets
- `payload.astro` – astrologische / symbolische Daten (Flavor + ggf. Marker)
- `payload.summary` – kurze Text-Zusammenfassung (für Result Cards)

---

## 3) Naming / IDs (damit es modular bleibt)

### 3.1 Konvention

- IDs sind **stabil** und **maschinenlesbar**.
- Format: `namespace.category.name`

Beispiele:

- Traits: `trait.social.introversion`, `trait.love.attention_need`, `trait.skills.math`
- Markers: `marker.social.extroversion_high`, `marker.love.words_of_affirmation`
- Unlocks: `unlock.sigils.zodiac_aries`, `unlock.crests.shadow_fox`
- Tags: `tag.archetype.trickster`, `tag.shadow.jealousy`

### 3.2 Registry (empfohlen)

Lege eine zentrale Registry an (später als JSON/TS), damit alle Agenten dieselben IDs verwenden:

- `src/lib/registry/traits.ts`
- `src/lib/registry/markers.ts`
- `src/lib/registry/unlocks.ts`

---

## 4) Core Types

### 4.1 Marker

Marker sind die **einzige zwingende Schnittstelle** zur LME.

```ts
type Marker = {
  id: string;        // marker.*
  weight: number;    // -1..+1 (oder 0..1, aber einheitlich!)
  evidence?: {
    itemsAnswered?: number;
    confidence?: number; // 0..1
  };
};
```

**Regel:**

- Quizze liefern i.d.R. mehrere Marker (3–12).
- Horoskope liefern optional Marker mit **niedriger Weight**, wenn sie Psyche beeinflussen sollen.

### 4.2 TraitScore (UI Sliders 1–100)

```ts
type TraitScore = {
  id: string;            // trait.*
  score: number;         // 1..100 (integer)
  band?: "low" | "midlow" | "mid" | "midhigh" | "high"; // optional convenience
  confidence?: number;   // 0..1
  method?: "likert" | "forced_choice" | "scenario" | "task" | "derived";
};
```

**Band-Regeln (dein 5-Band-System):**

- 1–20 ❄️ low
- 21–40 🌿 midlow
- 41–60 🌤️ mid
- 61–80 🔥 midhigh
- 81–100 ⚡ high

### 4.3 Tag

```ts
type Tag = {
  id: string;            // tag.*
  label: string;         // lokalisierter Text
  kind: "archetype" | "shadow" | "style" | "astro" | "interest" | "misc";
  weight?: number;       // 0..1 optional
};
```

### 4.4 Unlock

```ts
type Unlock = {
  id: string;            // unlock.*
  unlocked: boolean;
  unlockedAt?: string;   // ISO
  level?: 1 | 2 | 3;     // optional rarity
  sourceRef?: string;    // quizId/signId/etc
};
```

### 4.5 AstroPayload (Flavor + optional Inputs)

```ts
type AstroPayload = {
  western?: {
    sunSign?: string;     // aries..pisces
    moonSign?: string;
    ascendant?: string;
    elementsMix?: Record<"fire"|"earth"|"air"|"water", number>;      // 0..1
    modalitiesMix?: Record<"cardinal"|"fixed"|"mutable", number>;    // 0..1
    dominantPlanet?: string;
    houseEmphasis?: string[]; // ["3", "7"]
    archetypeKeywords?: string[]; // 3–5
    shadowTag?: string;         // 1
  };
  chinese?: {
    animal?: string;      // rat..pig
    element?: string;     // wood/fire/earth/metal/water
    yinYang?: "yin" | "yang";
    luckyNumbers?: number[];
    luckyDirections?: string[];
    yearEnergy?: string;  // 1 sentence
  };
  addons?: {
    numerology?: { lifePath?: number; keywords?: string[] };
    enneagram?: { type?: number; wing?: number };
    ayurveda?: { doshaMix?: Record<string, number> };
    humanDesign?: { type?: string; authority?: string; profile?: string };
  };
};
```

---

## 5) ContributionEvent Schema (JSON)

```ts
type ContributionEvent = {
  specVersion: "sp.contribution.v1";
  eventId: string;          // uuid
  occurredAt: string;       // ISO
  userRef?: string;         // optional, falls server-seitig
  source: {
    vertical: "character" | "quiz" | "horoscope" | "future";
    moduleId: string;       // z.B. quiz.personality.v1
    domain?: string;        // quiz.domain.tld
    locale?: string;        // de-DE
    build?: string;         // git sha / version
  };
  payload: {
    markers: Marker[];      // REQUIRED
    traits?: TraitScore[];
    tags?: Tag[];
    unlocks?: Unlock[];
    astro?: AstroPayload;
    fields?: Array<{
      id: string;                 // field.*
      kind: "text" | "bullets" | "enum";
      value: string | string[];
      confidence?: number;
    }>;
    summary?: {
      title?: string;
      bullets?: string[];   // 3–5
      resultId?: string;
    };
    debug?: {
      rawAnswersHash?: string;
      rawScores?: Record<string, number>;
    };
  };
};
  specVersion: "sp.contribution.v1";
  eventId: string;          // uuid
  occurredAt: string;       // ISO
  userRef?: string;         // optional, falls server-seitig
  source: {
    vertical: "character" | "quiz" | "horoscope" | "future";
    moduleId: string;       // z.B. quiz.personality.v1
    domain?: string;        // quiz.domain.tld
    locale?: string;        // de-DE
    build?: string;         // git sha / version
  };
  payload: {
    markers: Marker[];      // REQUIRED
    traits?: TraitScore[];
    tags?: Tag[];
    unlocks?: Unlock[];
    astro?: AstroPayload;
    summary?: {
      title?: string;
      bullets?: string[];   // 3–5
      resultId?: string;
    };
    debug?: {
      rawAnswersHash?: string;
      rawScores?: Record<string, number>;
    };
  };
};
```

---

## 6) Standard-Scoring → TraitScore (1–100)

### 6.1 Likert (1–5)

- Reverse Items vorher invertieren: `rev = 6 - score`
- Mean über Items
- Normierung:

```txt
Score_1_100 = round(((Mean - 1) / 4) * 99 + 1)
```

### 6.2 Confidence (optional, empfohlen)

- `confidence = clamp(1 - (stddev / maxStddev), 0, 1)`
- boost, wenn `itemsAnswered >= targetItems`

---

## 7) Marker Mapping (Trait/Result → LME)

### 7.1 Warum Marker?

- UI kann direkt TraitScores anzeigen.
- LME braucht stabile Inputs: Marker erlauben **einheitliche Aggregation** über verschiedene Module.

### 7.2 Mapping-Regel (einfach)

- Jeder TraitScore kann 0..n Marker erzeugen.
- Beispiel: `trait.social.introversion` (1–100)
  - mappe auf Marker-Gewicht -1..+1:

```txt
w = ((score - 50) / 50)  // ungefähr -1..+1
marker.id = (w >= 0) ? marker.social.extroversion : marker.social.introversion
marker.weight = abs(w)
```

### 7.3 Empfehlung für Agenten

- Implementiere Mapping **immer** in einer Datei pro Modul:
  - `src/modules/quiz/<id>/emitContribution.ts`
- oder config-basiert:
  - `config/mappings/<id>.json`

---

## 8) LME Ingestion API (Runtime)

### 8.1 Public Function

```ts
function ingestContribution(event: ContributionEvent): {
  accepted: boolean;
  profileSnapshot: {
    psycheState: unknown;
    archetypeMix: unknown;
    avatarParams: unknown;
    completion: {
      filledTraits: number;
      unlockCount: number;
      percent: number;
    };
  };
};
```

### 8.2 LME Steps (intern)

1. validate schema
2. persist `ContributionEvent`
3. `markerAggregator(markers) -> dimensionDeltas`
4. `lmeCore.apply(dimensionDeltas) -> newPsycheState`
5. derive: archetypes + avatar
6. compute completion

---

## 9) Character Sheet: Block → Datenquellen (A–K Mapping)

Dieser Abschnitt macht es Agenten leicht: **welcher Output befüllt welchen Block**.

### A) Header-Bereich

- **Avatar/Name/Geburtsdaten:** `identity.displayName`, `identity.birth.*`
- **Sternzeichen/Chinesisch/Element:** `astro.western.sunSign`, `astro.chinese.animal`, `astro.western.elementsMix`
- **Archetyp in einem Satz:** derived aus `psyche.archetypeMix[0]` + `tags` (optional)
- **Icon-Leiste:** presence checks (z.B. sun/moon/asc vorhanden)

### B) Astro & Symbolik-Block (Tabs)

- WESTLICH: `astro.western.*`
- CHINESISCH: `astro.chinese.*`
- Addons: `astro.addons.*`
- Archetypen-Tags / Shadow-Tendenz: `tags(kind=archetype/shadow)`

### C) Kernwerte & Motivation

- Top-5 Werte: `traits["trait.values.*"]` (5 IDs)
- Motivatoren: `traits["trait.motivation.*"]` (5 Sliders)
- Anti-Werte/No-Gos: `tags(kind=misc)` oder `traits` + threshold
- "Ich fühle mich lebendig, wenn …": `traits` (free text) oder `payload.summary`/`payload.debug` → **empfohlen als eigenes Feld** (siehe Merge-Regeln)

### D) Persönlichkeit & Sozialenergie

- Sliders: `traits["trait.social.*"]`
- Humor-Stil: `tags(kind=style)`
- Sozial-Batterie Ring: `traits["trait.social.battery"]` + optional derived

### E) Beziehung & Nähe

- Love Languages: `tags(kind=style)` oder `traits["trait.love.language_top1"]` als enum/tag
- Sliders: `traits["trait.love.*"]`
- Konfliktstil: `tags(kind=style)` oder enum-trait
- Repair-Ritual / Boundaries: **free-text fields** (siehe Merge-Regeln)

### F) Lifestyle & Rhythmus

- Sliders: `traits["trait.lifestyle.*"]`
- Ideal-Tag: free-text bullets

### G) Interessen & Affinitäten

- 0–10 oder 1–100: `traits["trait.interest.*"]` (UI darf 0–10 anzeigen, intern 1–100)
- Top 3 Vibes: `tags(kind=interest)`

### H) Kognition & Skills

- Radar: `traits["trait.skills.*"]` (intellect/language/math/focus/curiosity)
- System vs Story: `traits["trait.cognition.system_vs_story"]`

### I) Emotion & Selbstregulation

- EQ Subslider: `traits["trait.eq.*"]`
- Stressreaktion Grid: `tags(kind=misc)` oder enum-trait `trait.eq.stress_response`
- Vertrauen + Beweisarten: `traits["trait.eq.trust_speed"]` + tags

### J) Charm & Wirkung

- Sliders: `traits["trait.aura.*"]`
- Signature Move: tag oder free-text

### K) Meta-Felder

- Green/Red flags: tags oder free-text
- Überforderung/Hilf mir so/Dealbreaker/Must-haves/Fun facts/Vulnerability: free-text

> Für alle free-text Felder wird empfohlen: `payload.fields[]` (siehe Abschnitt 9.2).

---

## 9.2 Free-Text Felder: standardisiertes Feld-Format (empfohlen)

Damit Agenten nicht "irgendwo" Text ablegen, definieren wir ein Field-Array:

```ts
type Field = {
  id: string;                 // field.*
  kind: "text" | "bullets" | "enum";
  value: string | string[];
  confidence?: number;        // 0..1
};
```

Beispiele:

- `field.values.alive_when`
- `field.love.repair_ritual`
- `field.love.boundaries`
- `field.lifestyle.ideal_day`
- `field.meta.green_flags`, `field.meta.red_flags`

Erweiterung des Events:

```ts
payload: {
  ...
  fields?: Field[];
}
```

---

## 10) Merge-/Prioritätsregeln (wenn mehrere Quellen dasselbe liefern)

### 10.1 Grundregel: Marker treiben LME, Traits treiben UI

- **LME/Psyche** wird nur über `markers` verändert.
- **Traits/Tags/Unlocks/Astro/Fields** befüllen primär UI und Completion.

### 10.2 Trait Merge (trait.\*)

Wenn ein Trait mehrfach geliefert wird:

1. wähle den Eintrag mit höherer `confidence`
2. bei Gleichstand: nimm den **neueren** (`occurredAt`)

### 10.3 Astro Merge

- Astro ist **identitätsnah**; Standard ist: Werte kommen aus einer **Astro-Quelle** (z.B. Geburtseingabe oder „Pick your sign“).
- Konfliktlösung:
  - Wenn `source.moduleId` in `astro.*`-Kategorie ist, gewinnt **höhere confidence**, sonst latest.

### 10.4 Unlock Merge

- Unlocks sind monoton: `unlocked=true` bleibt true.
- Level: nimm max(level).

### 10.5 Fields Merge (field.\*)

- Textfelder: wähle nach confidence/recency.
- Bullets: merge unique bullets (max 5) oder replace (konfigurierbar).

---

## 11) Beispiele

### 9.1 Quiz (Personality) – Beispiel-Event

```json
{
  "specVersion": "sp.contribution.v1",
  "eventId": "2e1f7c6e-0c2c-4eab-9c5e-8e7c0f8a1f42",
  "occurredAt": "2025-12-15T10:12:00.000Z",
  "source": {
    "vertical": "quiz",
    "moduleId": "quiz.personality.v1",
    "domain": "quiz.example.com",
    "locale": "de-DE"
  },
  "payload": {
    "markers": [
      { "id": "marker.social.extroversion", "weight": 0.62, "evidence": { "itemsAnswered": 10, "confidence": 0.78 } },
      { "id": "marker.cognition.system_thinking", "weight": 0.35 },
      { "id": "marker.emotion.sensitivity_high", "weight": 0.21 }
    ],
    "traits": [
      { "id": "trait.social.introversion", "score": 81, "band": "high", "confidence": 0.78, "method": "likert" },
      { "id": "trait.cognition.system_vs_story", "score": 68, "band": "midhigh" }
    ],
    "tags": [
      { "id": "tag.style.deep_talk", "label": "Deep Talk", "kind": "style", "weight": 0.7 },
      { "id": "tag.shadow.overthinking", "label": "Overthinking", "kind": "shadow", "weight": 0.4 }
    ],
    "unlocks": [
      { "id": "unlock.crests.mind_owl", "unlocked": true, "unlockedAt": "2025-12-15T10:12:00.000Z", "level": 1, "sourceRef": "quiz.personality.v1" }
    ],
    "summary": {
      "title": "Der ruhige Stratege",
      "bullets": ["Du lädst eher alleine auf", "Du planst lieber als zu improvisieren", "Du liest Nuancen sehr gut"],
      "resultId": "strategist"
    }
  }
}
```

### 9.2 Horoscope View – Beispiel-Event (Flavor + leichte Marker)

```json
{
  "specVersion": "sp.contribution.v1",
  "eventId": "c6a9d8a1-ef6b-4e7e-9b2f-b55c5c2d2d0c",
  "occurredAt": "2025-12-15T10:30:00.000Z",
  "source": {
    "vertical": "horoscope",
    "moduleId": "horoscope.sign_view.v1",
    "domain": "horoscope.example.com",
    "locale": "de-DE"
  },
  "payload": {
    "markers": [
      { "id": "marker.astro.element.fire", "weight": 0.15 },
      { "id": "marker.astro.modality.cardinal", "weight": 0.10 }
    ],
    "astro": {
      "western": {
        "sunSign": "aries",
        "elementsMix": { "fire": 1, "earth": 0, "air": 0, "water": 0 },
        "modalitiesMix": { "cardinal": 1, "fixed": 0, "mutable": 0 },
        "archetypeKeywords": ["Pionier", "Impuls", "Mut"],
        "shadowTag": "Ungeduld"
      }
    },
    "tags": [
      { "id": "tag.astro.aries", "label": "Widder", "kind": "astro", "weight": 1 },
      { "id": "tag.shadow.impatience", "label": "Ungeduld", "kind": "shadow", "weight": 0.3 }
    ],
    "unlocks": [
      { "id": "unlock.sigils.zodiac_aries", "unlocked": true, "unlockedAt": "2025-12-15T10:30:00.000Z", "level": 1, "sourceRef": "aries" }
    ]
  }
}
```

---

## 10) Regeln für Agenten (Kurzfassung)

1. **Immer** `ContributionEvent` in diesem Format ausgeben.
2. `payload.markers[]` ist **Pflicht**.
3. Traits sind **1–100**, integer, mit optional `confidence`.
4. IDs sind aus der zentralen Registry zu verwenden (keine freien Strings).
5. Horoskope dürfen:
   - nur Flavor (astro/tags/unlocks) liefern **oder**
   - zusätzlich schwache Marker (0.05–0.20), wenn sie Psyche beeinflussen sollen.
6. Jede Implementierung muss Schema-Validation bestehen.

---

## 11) Registry v1 (konkret, agent-ready)

### 11.1 Datei-Struktur (empfohlen)

- `src/lib/registry/blocks.ts`
- `src/lib/registry/traits.ts`
- `src/lib/registry/tags.ts`
- `src/lib/registry/fields.ts`
- `src/lib/registry/unlocks.ts`
- `src/lib/registry/markers.ts`

> **Regel:** Agenten dürfen in `ContributionEvent.payload.*` **nur IDs aus dieser Registry** verwenden.

---

### 11.2 Blocks (`src/lib/registry/blocks.ts`)

```ts
export type BlockId =
  | "header"
  | "astro"
  | "values"
  | "social"
  | "love"
  | "lifestyle"
  | "interests"
  | "skills"
  | "eq"
  | "aura"
  | "meta"
  | "unlocks"
  | "tiles";

export const BLOCKS: Array<{ id: BlockId; labelDe: string; order: number }> = [
  { id: "header", labelDe: "Header", order: 10 },
  { id: "astro", labelDe: "Astro & Symbolik", order: 20 },
  { id: "values", labelDe: "Kernwerte & Motivation", order: 30 },
  { id: "social", labelDe: "Persönlichkeit & Sozialenergie", order: 40 },
  { id: "love", labelDe: "Beziehung & Nähe", order: 50 },
  { id: "lifestyle", labelDe: "Lifestyle & Rhythmus", order: 60 },
  { id: "interests", labelDe: "Interessen & Affinitäten", order: 70 },
  { id: "skills", labelDe: "Kognition & Skills", order: 80 },
  { id: "eq", labelDe: "Emotion & Selbstregulation", order: 90 },
  { id: "aura", labelDe: "Charm & Wirkung", order: 100 },
  { id: "meta", labelDe: "Meta-Felder", order: 110 },
  { id: "unlocks", labelDe: "Freischaltungen", order: 120 },
  { id: "tiles", labelDe: "Module/Links", order: 130 }
];
```

---

### 11.3 Traits (`src/lib/registry/traits.ts`)

**Alle Traits sind intern ****1..100**, UI darf bei ausgewählten Traits `0..10` darstellen.

```ts
import type { BlockId } from "./blocks";

export type TraitUI =
  | { kind: "slider"; icon?: string }
  | { kind: "ring"; icon?: string }
  | { kind: "radar"; group: string; icon?: string }
  | { kind: "balance"; leftLabelDe: string; rightLabelDe: string; icon?: string };

export type TraitDef = {
  id: string;          // trait.*
  block: BlockId;
  labelDe: string;
  icon?: string;       // emoji shorthand; UI kann daraus Icons ableiten
  ui: TraitUI;
  score: { min: 1; max: 100; default: 50 };
  display?: { scale?: "1-100" | "0-10" };
};

export const TRAITS: TraitDef[] = [
  // C) Kernwerte & Motivation
  { id: "trait.values.freedom", block: "values", labelDe: "Freiheit", icon: "🕊️", ui: { kind: "slider", icon: "🕊️" }, score: { min: 1, max: 100, default: 50 } },
  { id: "trait.values.loyalty", block: "values", labelDe: "Loyalität", icon: "🤝", ui: { kind: "slider", icon: "🤝" }, score: { min: 1, max: 100, default: 50 } },
  { id: "trait.values.growth", block: "values", labelDe: "Wachstum", icon: "🌱", ui: { kind: "slider", icon: "🌱" }, score: { min: 1, max: 100, default: 50 } },
  { id: "trait.values.calm", block: "values", labelDe: "Ruhe", icon: "🧘", ui: { kind: "slider", icon: "🧘" }, score: { min: 1, max: 100, default: 50 } },
  { id: "trait.values.adventure", block: "values", labelDe: "Abenteuer", icon: "🧭", ui: { kind: "slider", icon: "🧭" }, score: { min: 1, max: 100, default: 50 } },

  { id: "trait.motivation.recognition", block: "values", labelDe: "Anerkennung", icon: "🏆", ui: { kind: "slider", icon: "🏆" }, score: { min: 1, max: 100, default: 50 } },
  { id: "trait.motivation.mastery", block: "values", labelDe: "Meisterschaft", icon: "🛠️", ui: { kind: "slider", icon: "🛠️" }, score: { min: 1, max: 100, default: 50 } },
  { id: "trait.motivation.belonging", block: "values", labelDe: "Zugehörigkeit", icon: "🫂", ui: { kind: "slider", icon: "🫂" }, score: { min: 1, max: 100, default: 50 } },
  { id: "trait.motivation.rest", block: "values", labelDe: "Ruhe/Entlastung", icon: "☕", ui: { kind: "slider", icon: "☕" }, score: { min: 1, max: 100, default: 50 } },
  { id: "trait.motivation.exploration", block: "values", labelDe: "Entdeckung", icon: "🧭", ui: { kind: "slider", icon: "🧭" }, score: { min: 1, max: 100, default: 50 } },

  // D) Persönlichkeit & Sozialenergie
  { id: "trait.social.introversion", block: "social", labelDe: "Introvertiert ↔ Extrovertiert", icon: "🫧", ui: { kind: "slider", icon: "🫧" }, score: { min: 1, max: 100, default: 50 } },
  { id: "trait.social.planning", block: "social", labelDe: "Spontan ↔ Geplant", icon: "🗓️", ui: { kind: "slider", icon: "🗓️" }, score: { min: 1, max: 100, default: 50 } },
  { id: "trait.social.deep_talk", block: "social", labelDe: "Smalltalk ↔ Deep Talk", icon: "🗣️", ui: { kind: "slider", icon: "🗣️" }, score: { min: 1, max: 100, default: 50 } },
  { id: "trait.social.dominance", block: "social", labelDe: "Dominant ↔ Harmonisierend", icon: "⚖️", ui: { kind: "slider", icon: "⚖️" }, score: { min: 1, max: 100, default: 50 } },
  { id: "trait.social.battery", block: "social", labelDe: "Sozial-Batterie", icon: "🔋", ui: { kind: "ring", icon: "🔋" }, score: { min: 1, max: 100, default: 50 } },
  { id: "trait.social.recharge_hours", block: "social", labelDe: "Ladezeit nach Events (0–48h)", icon: "⏳", ui: { kind: "slider", icon: "⏳" }, score: { min: 1, max: 100, default: 50 } },

  // E) Beziehung & Nähe
  { id: "trait.love.attention_need", block: "love", labelDe: "Bedürfnis nach Aufmerksamkeit", icon: "👀", ui: { kind: "slider", icon: "👀" }, score: { min: 1, max: 100, default: 50 } },
  { id: "trait.love.intimacy_need", block: "love", labelDe: "Bedürfnis nach Intimität", icon: "💞", ui: { kind: "slider", icon: "💞" }, score: { min: 1, max: 100, default: 50 } },
  { id: "trait.love.autonomy_need", block: "love", labelDe: "Autonomie ↔ Verschmelzung", icon: "🧩", ui: { kind: "slider", icon: "🧩" }, score: { min: 1, max: 100, default: 50 } },
  { id: "trait.love.jealousy_sensitivity", block: "love", labelDe: "Eifersucht-Empfindlichkeit", icon: "🧿", ui: { kind: "slider", icon: "🧿" }, score: { min: 1, max: 100, default: 50 } },
  { id: "trait.love.intimacy_pace", block: "love", labelDe: "Intimitäts-Tempo", icon: "🐢", ui: { kind: "slider", icon: "🐢" }, score: { min: 1, max: 100, default: 50 } },

  // F) Lifestyle & Rhythmus
  { id: "trait.lifestyle.sleep_need", block: "lifestyle", labelDe: "Schlafbedürfnis", icon: "🛌", ui: { kind: "slider", icon: "🛌" }, score: { min: 1, max: 100, default: 50 } },
  { id: "trait.lifestyle.party_need", block: "lifestyle", labelDe: "Party-Bedürfnis", icon: "🎉", ui: { kind: "slider", icon: "🎉" }, score: { min: 1, max: 100, default: 50 } },
  { id: "trait.lifestyle.stimulation_need", block: "lifestyle", labelDe: "Reizbedarf (ruhig ↔ stimulierend)", icon: "🔊", ui: { kind: "slider", icon: "🔊" }, score: { min: 1, max: 100, default: 50 } },
  { id: "trait.lifestyle.routine_need", block: "lifestyle", labelDe: "Routine-Bedarf ↔ Abwechslung", icon: "♻️", ui: { kind: "slider", icon: "♻️" }, score: { min: 1, max: 100, default: 50 } },
  { id: "trait.lifestyle.order_need", block: "lifestyle", labelDe: "Ordnung ↔ Chaos-Toleranz", icon: "🧺", ui: { kind: "slider", icon: "🧺" }, score: { min: 1, max: 100, default: 50 } },

  // G) Interessen & Affinitäten (UI darf 0–10 darstellen)
  { id: "trait.interest.gaming", block: "interests", labelDe: "Gaming-Affinität", icon: "🎮", ui: { kind: "slider", icon: "🎮" }, score: { min: 1, max: 100, default: 50 }, display: { scale: "0-10" } },
  { id: "trait.interest.nature", block: "interests", labelDe: "Naturaffinität", icon: "🌲", ui: { kind: "slider", icon: "🌲" }, score: { min: 1, max: 100, default: 50 }, display: { scale: "0-10" } },
  { id: "trait.interest.music", block: "interests", labelDe: "Musik/Audio", icon: "🎵", ui: { kind: "slider", icon: "🎵" }, score: { min: 1, max: 100, default: 50 }, display: { scale: "0-10" } },
  { id: "trait.interest.travel", block: "interests", labelDe: "Reise-Drive", icon: "✈️", ui: { kind: "slider", icon: "✈️" }, score: { min: 1, max: 100, default: 50 }, display: { scale: "0-10" } },
  { id: "trait.interest.art", block: "interests", labelDe: "Kunst/Kreativität", icon: "🎨", ui: { kind: "slider", icon: "🎨" }, score: { min: 1, max: 100, default: 50 }, display: { scale: "0-10" } },

  // H) Kognition & Skills (Radar)
  { id: "trait.skills.intellect", block: "skills", labelDe: "Intellekt", icon: "🧠", ui: { kind: "radar", group: "skills", icon: "🧠" }, score: { min: 1, max: 100, default: 50 }, display: { scale: "0-10" } },
  { id: "trait.skills.language", block: "skills", labelDe: "Sprache", icon: "🗣️", ui: { kind: "radar", group: "skills", icon: "🗣️" }, score: { min: 1, max: 100, default: 50 }, display: { scale: "0-10" } },
  { id: "trait.skills.math", block: "skills", labelDe: "Mathe", icon: "➗", ui: { kind: "radar", group: "skills", icon: "➗" }, score: { min: 1, max: 100, default: 50 }, display: { scale: "0-10" } },
  { id: "trait.skills.focus", block: "skills", labelDe: "Fokus", icon: "🎯", ui: { kind: "radar", group: "skills", icon: "🎯" }, score: { min: 1, max: 100, default: 50 }, display: { scale: "0-10" } },
  { id: "trait.skills.curiosity", block: "skills", labelDe: "Neugier", icon: "❓", ui: { kind: "radar", group: "skills", icon: "❓" }, score: { min: 1, max: 100, default: 50 }, display: { scale: "0-10" } },

  { id: "trait.cognition.system_vs_story", block: "skills", labelDe: "Systemdenken ↔ Storydenken", icon: "⚖️", ui: { kind: "balance", leftLabelDe: "System", rightLabelDe: "Story", icon: "⚖️" }, score: { min: 1, max: 100, default: 50 } },

  // I) Emotion & Selbstregulation (EQ)
  { id: "trait.eq.empathy", block: "eq", labelDe: "Empathie", icon: "❤️", ui: { kind: "slider", icon: "❤️" }, score: { min: 1, max: 100, default: 50 }, display: { scale: "0-10" } },
  { id: "trait.eq.self_awareness", block: "eq", labelDe: "Selbstwahrnehmung", icon: "🪞", ui: { kind: "slider", icon: "🪞" }, score: { min: 1, max: 100, default: 50 }, display: { scale: "0-10" } },
  { id: "trait.eq.self_regulation", block: "eq", labelDe: "Selbstregulation", icon: "🧯", ui: { kind: "slider", icon: "🧯" }, score: { min: 1, max: 100, default: 50 }, display: { scale: "0-10" } },
  { id: "trait.eq.trust_speed", block: "eq", labelDe: "Vertrauen aufbauen (langsam ↔ schnell)", icon: "🕰️", ui: { kind: "slider", icon: "🕰️" }, score: { min: 1, max: 100, default: 50 } },
  { id: "trait.eq.sensitivity", block: "eq", labelDe: "Sensibilität", icon: "🫧", ui: { kind: "slider", icon: "🫧" }, score: { min: 1, max: 100, default: 50 }, display: { scale: "0-10" } },

  // J) Charm & Wirkung
  { id: "trait.aura.charisma", block: "aura", labelDe: "Charisma", icon: "✨", ui: { kind: "slider", icon: "✨" }, score: { min: 1, max: 100, default: 50 }, display: { scale: "0-10" } },
  { id: "trait.aura.flirt_energy", block: "aura", labelDe: "Flirt-Energie", icon: "💫", ui: { kind: "slider", icon: "💫" }, score: { min: 1, max: 100, default: 50 }, display: { scale: "0-10" } },
  { id: "trait.aura.leadership", block: "aura", labelDe: "Leadership", icon: "🧭", ui: { kind: "slider", icon: "🧭" }, score: { min: 1, max: 100, default: 50 }, display: { scale: "0-10" } },
];
```

---

### 11.4 Fields (`src/lib/registry/fields.ts`)

```ts
import type { BlockId } from "./blocks";

export type FieldKind = "text" | "bullets" | "enum";
export type FieldDef = {
  id: string;         // field.*
  block: BlockId;
  labelDe: string;
  kind: FieldKind;
  maxItems?: number;  // für bullets
};

export const FIELDS: FieldDef[] = [
  // C) Werte
  { id: "field.values.alive_when", block: "values", labelDe: "Ich fühle mich lebendig, wenn …", kind: "text" },
  { id: "field.values.no_gos", block: "values", labelDe: "Anti-Werte / No-Gos", kind: "bullets", maxItems: 5 },

  // E) Love
  { id: "field.love.repair_ritual", block: "love", labelDe: "Repair-Ritual", kind: "text" },
  { id: "field.love.boundaries", block: "love", labelDe: "Boundaries (3)“, kind: "bullets", maxItems: 3 },

  // F) Lifestyle
  { id: "field.lifestyle.ideal_day", block: "lifestyle", labelDe: "Ideal-Tag (3 bullets)", kind: "bullets", maxItems: 3 },

  // K) Meta
  { id: "field.meta.green_flags", block: "meta", labelDe: "Green Flags (3)", kind: "bullets", maxItems: 3 },
  { id: "field.meta.red_flags", block: "meta", labelDe: "Red Flags (3)", kind: "bullets", maxItems: 3 },
  { id: "field.meta.overwhelmed", block: "meta", labelDe: "Wenn ich überfordert bin, dann …", kind: "text" },
  { id: "field.meta.help_me", block: "meta", labelDe: "Hilf mir so: …", kind: "text" },
  { id: "field.meta.dealbreakers", block: "meta", labelDe: "Dealbreaker", kind: "bullets", maxItems: 5 },
  { id: "field.meta.must_haves", block: "meta", labelDe: "Must-haves", kind: "bullets", maxItems: 5 },
  { id: "field.meta.fun_facts", block: "meta", labelDe: "Fun Facts (3)", kind: "bullets", maxItems: 3 },
  { id: "field.meta.vulnerability", block: "meta", labelDe: "Vulnerabilität (1 Satz)", kind: "text" },
];
```

---

### 11.5 Tags (`src/lib/registry/tags.ts`)

```ts
import type { BlockId } from "./blocks";

export type TagKind = "archetype" | "shadow" | "style" | "astro" | "interest" | "misc";

export type TagDef = {
  id: string;          // tag.*
  block: BlockId;
  kind: TagKind;
  labelDe: string;
  icon?: string;
};

export const TAGS: TagDef[] = [
  // Archetypen / Shadow
  { id: "tag.archetype.trickster", block: "astro", kind: "archetype", labelDe: "Trickster", icon: "🃏" },
  { id: "tag.archetype.sage", block: "astro", kind: "archetype", labelDe: "Weiser", icon: "📜" },
  { id: "tag.archetype.warrior", block: "astro", kind: "archetype", labelDe: "Krieger", icon: "🗡️" },
  { id: "tag.archetype.lover", block: "love", kind: "archetype", labelDe: "Liebende:r", icon: "💞" },
  { id: "tag.shadow.overthinking", block: "eq", kind: "shadow", labelDe: "Overthinking", icon: "🌫️" },
  { id: "tag.shadow.impatience", block: "astro", kind: "shadow", labelDe: "Ungeduld", icon: "⏱️" },
  { id: "tag.shadow.jealousy", block: "love", kind: "shadow", labelDe: "Eifersucht", icon: "🧿" },

  // Love Languages
  { id: "tag.love.language.words", block: "love", kind: "style", labelDe: "Worte", icon: "💬" },
  { id: "tag.love.language.time", block: "love", kind: "style", labelDe: "Zeit", icon: "🕰️" },
  { id: "tag.love.language.gifts", block: "love", kind: "style", labelDe: "Geschenke", icon: "🎁" },
  { id: "tag.love.language.touch", block: "love", kind: "style", labelDe: "Berührung", icon: "🤗" },
  { id: "tag.love.language.acts", block: "love", kind: "style", labelDe: "Taten", icon: "🛠️" },

  // Konfliktstil
  { id: "tag.love.conflict.avoid", block: "love", kind: "style", labelDe: "Vermeiden", icon: "🕊️" },
  { id: "tag.love.conflict.discuss", block: "love", kind: "style", labelDe: "Diskutieren", icon: "🗣️" },
  { id: "tag.love.conflict.humor", block: "love", kind: "style", labelDe: "Humor", icon: "😄" },
  { id: "tag.love.conflict.withdraw", block: "love", kind: "style", labelDe: "Rückzug", icon: "🚪" },
  { id: "tag.love.conflict.fix_now", block: "love", kind: "style", labelDe: "Sofort lösen", icon: "🛠️" },

  // Humor-Stil
  { id: "tag.style.humor.dry", block: "social", kind: "style", labelDe: "Trocken", icon: "🪨" },
  { id: "tag.style.humor.silly", block: "social", kind: "style", labelDe: "Albern", icon: "🤡" },
  { id: "tag.style.humor.dark", block: "social", kind: "style", labelDe: "Schwarz", icon: "🕳️" },
  { id: "tag.style.humor.playful", block: "social", kind: "style", labelDe: "Verspielt", icon: "🎈" },

  // Chronotyp
  { id: "tag.lifestyle.chronotype.owl", block: "lifestyle", kind: "style", labelDe: "Eule", icon: "🦉" },
  { id: "tag.lifestyle.chronotype.lark", block: "lifestyle", kind: "style", labelDe: "Lerche", icon: "🐦" },

  // Partyart
  { id: "tag.lifestyle.party.club", block: "lifestyle", kind: "style", labelDe: "Club", icon: "🪩" },
  { id: "tag.lifestyle.party.bar", block: "lifestyle", kind: "style", labelDe: "Bar", icon: "🍸" },
  { id: "tag.lifestyle.party.house", block: "lifestyle", kind: "style", labelDe: "Hausparty", icon: "🏠" },
  { id: "tag.lifestyle.party.festival", block: "lifestyle", kind: "style", labelDe: "Festival", icon: "🎪" },

  // Stressreaktion
  { id: "tag.eq.stress.fight", block: "eq", kind: "misc", labelDe: "Fight", icon: "🥊" },
  { id: "tag.eq.stress.flight", block: "eq", kind: "misc", labelDe: "Flight", icon: "🏃" },
  { id: "tag.eq.stress.freeze", block: "eq", kind: "misc", labelDe: "Freeze", icon: "🧊" },
  { id: "tag.eq.stress.fawn", block: "eq", kind: "misc", labelDe: "Fawn", icon: "🫶" },

  // Trust Proofs
  { id: "tag.eq.trust_proof.time", block: "eq", kind: "misc", labelDe: "Zeit", icon: "⏳" },
  { id: "tag.eq.trust_proof.consistency", block: "eq", kind: "misc", labelDe: "Konsistenz", icon: "📈" },
  { id: "tag.eq.trust_proof.actions", block: "eq", kind: "misc", labelDe: "Taten", icon: "🛠️" },

  // Vibes
  { id: "tag.vibe.cozy", block: "interests", kind: "interest", labelDe: "Cozy", icon: "🧸" },
  { id: "tag.vibe.curious", block: "interests", kind: "interest", labelDe: "Curious", icon: "🔎" },
  { id: "tag.vibe.bold", block: "interests", kind: "interest", labelDe: "Bold", icon: "⚡" },

  // Astro: Zodiac (westlich)
  { id: "tag.astro.aries", block: "astro", kind: "astro", labelDe: "Widder", icon: "♈" },
  { id: "tag.astro.taurus", block: "astro", kind: "astro", labelDe: "Stier", icon: "♉" },
  { id: "tag.astro.gemini", block: "astro", kind: "astro", labelDe: "Zwillinge", icon: "♊" },
  { id: "tag.astro.cancer", block: "astro", kind: "astro", labelDe: "Krebs", icon: "♋" },
  { id: "tag.astro.leo", block: "astro", kind: "astro", labelDe: "Löwe", icon: "♌" },
  { id: "tag.astro.virgo", block: "astro", kind: "astro", labelDe: "Jungfrau", icon: "♍" },
  { id: "tag.astro.libra", block: "astro", kind: "astro", labelDe: "Waage", icon: "♎" },
  { id: "tag.astro.scorpio", block: "astro", kind: "astro", labelDe: "Skorpion", icon: "♏" },
  { id: "tag.astro.sagittarius", block: "astro", kind: "astro", labelDe: "Schütze", icon: "♐" },
  { id: "tag.astro.capricorn", block: "astro", kind: "astro", labelDe: "Steinbock", icon: "♑" },
  { id: "tag.astro.aquarius", block: "astro", kind: "astro", labelDe: "Wassermann", icon: "♒" },
  { id: "tag.astro.pisces", block: "astro", kind: "astro", labelDe: "Fische", icon: "♓" },
];
```

---

### 11.6 Unlocks (`src/lib/registry/unlocks.ts`)

```ts
import type { BlockId } from "./blocks";

export type UnlockDef = {
  id: string;        // unlock.*
  block: BlockId;
  labelDe: string;
  icon?: string;
  levelDefault?: 1 | 2 | 3;
};

export const UNLOCKS: UnlockDef[] = [
  // Zodiac Sigils
  { id: "unlock.sigils.zodiac_aries", block: "unlocks", labelDe: "Siegel: Widder", icon: "♈", levelDefault: 1 },
  { id: "unlock.sigils.zodiac_taurus", block: "unlocks", labelDe: "Siegel: Stier", icon: "♉", levelDefault: 1 },
  { id: "unlock.sigils.zodiac_gemini", block: "unlocks", labelDe: "Siegel: Zwillinge", icon: "♊", levelDefault: 1 },
  { id: "unlock.sigils.zodiac_cancer", block: "unlocks", labelDe: "Siegel: Krebs", icon: "♋", levelDefault: 1 },
  { id: "unlock.sigils.zodiac_leo", block: "unlocks", labelDe: "Siegel: Löwe", icon: "♌", levelDefault: 1 },
  { id: "unlock.sigils.zodiac_virgo", block: "unlocks", labelDe: "Siegel: Jungfrau", icon: "♍", levelDefault: 1 },
  { id: "unlock.sigils.zodiac_libra", block: "unlocks", labelDe: "Siegel: Waage", icon: "♎", levelDefault: 1 },
  { id: "unlock.sigils.zodiac_scorpio", block: "unlocks", labelDe: "Siegel: Skorpion", icon: "♏", levelDefault: 1 },
  { id: "unlock.sigils.zodiac_sagittarius", block: "unlocks", labelDe: "Siegel: Schütze", icon: "♐", levelDefault: 1 },
  { id: "unlock.sigils.zodiac_capricorn", block: "unlocks", labelDe: "Siegel: Steinbock", icon: "♑", levelDefault: 1 },
  { id: "unlock.sigils.zodiac_aquarius", block: "unlocks", labelDe: "Siegel: Wassermann", icon: "♒", levelDefault: 1 },
  { id: "unlock.sigils.zodiac_pisces", block: "unlocks", labelDe: "Siegel: Fische", icon: "♓", levelDefault: 1 },

  // Chinese Zodiac Badges (Tierkreis)
  { id: "unlock.badges.chinese_rat", block: "unlocks", labelDe: "Badge: Ratte", icon: "🐀", levelDefault: 1 },
  { id: "unlock.badges.chinese_ox", block: "unlocks", labelDe: "Badge: Büffel", icon: "🐂", levelDefault: 1 },
  { id: "unlock.badges.chinese_tiger", block: "unlocks", labelDe: "Badge: Tiger", icon: "🐅", levelDefault: 1 },
  { id: "unlock.badges.chinese_rabbit", block: "unlocks", labelDe: "Badge: Hase", icon: "🐇", levelDefault: 1 },
  { id: "unlock.badges.chinese_dragon", block: "unlocks", labelDe: "Badge: Drache", icon: "🐉", levelDefault: 2 },
  { id: "unlock.badges.chinese_snake", block: "unlocks", labelDe: "Badge: Schlange", icon: "🐍", levelDefault: 1 },
  { id: "unlock.badges.chinese_horse", block: "unlocks", labelDe: "Badge: Pferd", icon: "🐎", levelDefault: 1 },
  { id: "unlock.badges.chinese_goat", block: "unlocks", labelDe: "Badge: Ziege", icon: "🐐", levelDefault: 1 },
  { id: "unlock.badges.chinese_monkey", block: "unlocks", labelDe: "Badge: Affe", icon: "🐒", levelDefault: 1 },
  { id: "unlock.badges.chinese_rooster", block: "unlocks", labelDe: "Badge: Hahn", icon: "🐓", levelDefault: 1 },
  { id: "unlock.badges.chinese_dog", block: "unlocks", labelDe: "Badge: Hund", icon: "🐕", levelDefault: 1 },
  { id: "unlock.badges.chinese_pig", block: "unlocks", labelDe: "Badge: Schwein", icon: "🐖", levelDefault: 1 },
];
```

---

### 11.7 Markers (`src/lib/registry/markers.ts`)

Marker sind der **einzige Pflichtinput** zur LME. Diese Registry hält die stabilen IDs (Mapping auf LME-Dimensionen passiert in `marker-aggregator`).

```ts
import type { BlockId } from "./blocks";

export type MarkerDef = {
  id: string;          // marker.*
  block: BlockId;
  labelDe: string;
  polarity?: "positive" | "negative" | "neutral";
  suggestedWeightRange?: { min: number; max: number }; // typischerweise 0.05–0.90
};

export const MARKERS: MarkerDef[] = [
  // Social
  { id: "marker.social.extroversion", block: "social", labelDe: "Extroversion", polarity: "positive", suggestedWeightRange: { min: 0.1, max: 0.9 } },
  { id: "marker.social.introversion", block: "social", labelDe: "Introversion", polarity: "positive", suggestedWeightRange: { min: 0.1, max: 0.9 } },
  { id: "marker.social.planning", block: "social", labelDe: "Planung/Struktur", polarity: "positive", suggestedWeightRange: { min: 0.1, max: 0.9 } },
  { id: "marker.social.spontaneity", block: "social", labelDe: "Spontaneität", polarity: "positive", suggestedWeightRange: { min: 0.1, max: 0.9 } },
  { id: "marker.social.deep_talk", block: "social", labelDe: "Deep Talk", polarity: "positive", suggestedWeightRange: { min: 0.1, max: 0.9 } },
  { id: "marker.social.smalltalk", block: "social", labelDe: "Smalltalk", polarity: "positive", suggestedWeightRange: { min: 0.1, max: 0.9 } },
  { id: "marker.social.dominance", block: "social", labelDe: "Dominanz", polarity: "positive", suggestedWeightRange: { min: 0.1, max: 0.9 } },
  { id: "marker.social.harmony", block: "social", labelDe: "Harmonie/Deeskalation", polarity: "positive", suggestedWeightRange: { min: 0.1, max: 0.9 } },

  // Love
  { id: "marker.love.attention_need", block: "love", labelDe: "Aufmerksamkeit", polarity: "neutral", suggestedWeightRange: { min: 0.1, max: 0.9 } },
  { id: "marker.love.intimacy_need", block: "love", labelDe: "Intimität", polarity: "neutral", suggestedWeightRange: { min: 0.1, max: 0.9 } },
  { id: "marker.love.autonomy_need", block: "love", labelDe: "Autonomie", polarity: "neutral", suggestedWeightRange: { min: 0.1, max: 0.9 } },
  { id: "marker.love.fusion_need", block: "love", labelDe: "Verschmelzung", polarity: "neutral", suggestedWeightRange: { min: 0.1, max: 0.9 } },
  { id: "marker.love.jealousy", block: "love", labelDe: "Eifersucht", polarity: "neutral", suggestedWeightRange: { min: 0.1, max: 0.9 } },

  // Lifestyle
  { id: "marker.lifestyle.night_owl", block: "lifestyle", labelDe: "Eule", polarity: "neutral", suggestedWeightRange: { min: 0.05, max: 0.4 } },
  { id: "marker.lifestyle.early_bird", block: "lifestyle", labelDe: "Lerche", polarity: "neutral", suggestedWeightRange: { min: 0.05, max: 0.4 } },
  { id: "marker.lifestyle.party", block: "lifestyle", labelDe: "Party/Outgoing", polarity: "neutral", suggestedWeightRange: { min: 0.1, max: 0.8 } },
  { id: "marker.lifestyle.calm", block: "lifestyle", labelDe: "Ruhig/Low stimulation", polarity: "neutral", suggestedWeightRange: { min: 0.1, max: 0.8 } },

  // Interests
  { id: "marker.interest.gaming", block: "interests", labelDe: "Gaming", polarity: "neutral", suggestedWeightRange: { min: 0.1, max: 0.8 } },
  { id: "marker.interest.nature", block: "interests", labelDe: "Natur", polarity: "neutral", suggestedWeightRange: { min: 0.1, max: 0.8 } },
  { id: "marker.interest.travel", block: "interests", labelDe: "Reisen", polarity: "neutral", suggestedWeightRange: { min: 0.1, max: 0.8 } },

  // Skills / Cognition
  { id: "marker.skills.math", block: "skills", labelDe: "Mathe-Skill", polarity: "neutral", suggestedWeightRange: { min: 0.1, max: 0.9 } },
  { id: "marker.skills.language", block: "skills", labelDe: "Sprach-Skill", polarity: "neutral", suggestedWeightRange: { min: 0.1, max: 0.9 } },
  { id: "marker.skills.focus", block: "skills", labelDe: "Fokus", polarity: "neutral", suggestedWeightRange: { min: 0.1, max: 0.9 } },
  { id: "marker.cognition.system_thinking", block: "skills", labelDe: "Systemdenken", polarity: "positive", suggestedWeightRange: { min: 0.1, max: 0.9 } },
  { id: "marker.cognition.story_thinking", block: "skills", labelDe: "Storydenken", polarity: "positive", suggestedWeightRange: { min: 0.1, max: 0.9 } },

  // EQ
  { id: "marker.eq.empathy", block: "eq", labelDe: "Empathie", polarity: "positive", suggestedWeightRange: { min: 0.1, max: 0.9 } },
  { id: "marker.eq.self_regulation", block: "eq", labelDe: "Selbstregulation", polarity: "positive", suggestedWeightRange: { min: 0.1, max: 0.9 } },
  { id: "marker.eq.sensitivity_high", block: "eq", labelDe: "Sensibilität (hoch)", polarity: "neutral", suggestedWeightRange: { min: 0.1, max: 0.6 } },

  // Aura
  { id: "marker.aura.charisma", block: "aura", labelDe: "Charisma", polarity: "positive", suggestedWeightRange: { min: 0.1, max: 0.8 } },
  { id: "marker.aura.leadership", block: "aura", labelDe: "Leadership", polarity: "positive", suggestedWeightRange: { min: 0.1, max: 0.8 } },

  // Astro (Flavor markers: typisch niedrig)
  { id: "marker.astro.element.fire", block: "astro", labelDe: "Element: Feuer", polarity: "neutral", suggestedWeightRange: { min: 0.05, max: 0.2 } },
  { id: "marker.astro.element.earth", block: "astro", labelDe: "Element: Erde", polarity: "neutral", suggestedWeightRange: { min: 0.05, max: 0.2 } },
  { id: "marker.astro.element.air", block: "astro", labelDe: "Element: Luft", polarity: "neutral", suggestedWeightRange: { min: 0.05, max: 0.2 } },
  { id: "marker.astro.element.water", block: "astro", labelDe: "Element: Wasser", polarity: "neutral", suggestedWeightRange: { min: 0.05, max: 0.2 } },
  { id: "marker.astro.modality.cardinal", block: "astro", labelDe: "Modalität: Kardinal", polarity: "neutral", suggestedWeightRange: { min: 0.05, max: 0.2 } },
  { id: "marker.astro.modality.fixed", block: "astro", labelDe: "Modalität: Fix", polarity: "neutral", suggestedWeightRange: { min: 0.05, max: 0.2 } },
  { id: "marker.astro.modality.mutable", block: "astro", labelDe: "Modalität: Veränderlich", polarity: "neutral", suggestedWeightRange: { min: 0.05, max: 0.2 } },
];
```

---

### 11.8 Registry-Nutzungsregeln (für Agenten)

1. **Trait Scores**: nur `trait.*` aus `TRAITS`, Werte `1..100`.
2. **Enums/Styles**: als `tag.*` aus `TAGS` liefern (z.B. Love Language, Konfliktstil, Chronotyp).
3. **Text/Bullets**: nur `field.*` aus `FIELDS` liefern.
4. **Unlocks**: nur `unlock.*` aus `UNLOCKS` liefern (monoton: einmal true, bleibt true).
5. **LME Updates**: nur `marker.*` aus `MARKERS` liefern.

> Damit können verschiedene Agenten unabhängig Quizzes/Horoskope implementieren und trotzdem 100% kompatibel ins Character Sheet/LME schreiben.

