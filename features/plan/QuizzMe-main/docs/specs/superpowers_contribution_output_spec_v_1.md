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

### 10.2 Trait Merge (trait.*)
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

### 10.5 Fields Merge (field.*)
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

## 11) Nächster Schritt (wenn du willst)
Ich kann dir als nächstes eine **Trait/Marker Registry v1** vorschlagen, die exakt deine 10 Blöcke abdeckt (Social, Love, Lifestyle, Skills, EQ, Charm, Astro…) und eine **Mapping-Matrix** (Trait → Marker → LME Dimension) so, dass Agenten nicht raten müssen.

