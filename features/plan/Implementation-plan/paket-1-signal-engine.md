# PAKET 1 — Signal Engine

> **Repo:** `DYAI2025/Astro-Noctum` (Vite + React 19 + TypeScript)
> **Abhängigkeiten:** Keine. Dieses Paket ist pure Logik ohne UI-Änderungen.
> **Quell-Repo für Portierung:** `DYAI2025/QuizzMe`
> **Spezifikations-Dokumente:** Bazodiac_Semantic_Marker_Mapping_v2, Bazodiac_Fusion_Ring_Signal_Logic

---

## Kontext

Astro-Noctum berechnet aktuell Astro-Daten über die BAFE API (Western + BaZi + Wu-Xing) und generiert via Gemini eine Text-Interpretation. Es gibt keine Daten-Pipeline, die diese Astro-Daten plus zukünftige Quiz-Ergebnisse in ein einheitliches 12-Sektor-Signalmodell überführt.

Dieses Paket baut die mathematische Engine, die aus allen Datenquellen ein `number[12]`-Array produziert — den Fusion Ring Signal-Vektor. Die Engine muss korrekt sein, bevor Quizzes oder Visualisierung gebaut werden.

---

## Bestehende Architektur (nicht verändern)

- **Single-Page React App**, kein Router. State-Flow: `Splash → AuthGate → BirthForm → Dashboard`
- **Pfad-Alias:** `@/*` mappt auf **Project Root** (nicht `src/`). Also: `import { X } from '@/src/lib/...'`
- **BAFE API Response Types:** `src/types/bafe.ts` — definiert `MappedWestern`, `MappedBazi`, `MappedWuxing`
- **BAFE API Client:** `src/services/api.ts` — `calculateAll()` liefert `ApiResults` mit `.western`, `.bazi`, `.wuxing`
- **Astro-Daten:** `src/lib/astro-data/` (zodiacSigns, earthlyBranches, wuxing, constellations)
- **Keine Tests vorhanden.** `npm run lint` (tsc --noEmit) ist der einzige Check. Vitest ist NICHT konfiguriert.

---

## Tasks

### Task 1.1 — Vitest einrichten

Vitest ist im Projekt nicht konfiguriert. Aufsetzen:

```bash
npm install -D vitest
```

`vitest.config.ts` existiert bereits im Repo (prüfen ob funktional). Falls nicht:

```typescript
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: { '@': resolve(__dirname, '.') },
  },
  test: {
    globals: true,
    environment: 'node',
  },
});
```

In `package.json` hinzufügen:
```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest"
}
```

### Task 1.2 — LME Core Types

Erstelle `src/lib/lme/types.ts`. Portiere aus QuizzMe (`src/lib/lme/types.ts`):

```typescript
export type SpecVersion = 'sp.contribution.v1';

export type Marker = {
  id: string;           // marker.domain.keyword
  weight: number;       // 0..1
  evidence?: {
    itemsAnswered?: number;
    confidence?: number;  // 0..1
  };
};

export type TraitScore = {
  id: string;
  score: number;        // 1..100
  band?: 'low' | 'midlow' | 'mid' | 'midhigh' | 'high';
  confidence?: number;
  method?: 'likert' | 'forced_choice' | 'scenario' | 'task' | 'derived';
};

export type Tag = {
  id: string;
  label: string;
  kind: 'archetype' | 'shadow' | 'style' | 'astro' | 'interest' | 'misc';
  weight?: number;
};

export type ContributionEvent = {
  specVersion: SpecVersion;
  eventId: string;
  occurredAt: string;    // ISO
  userRef?: string;
  source: {
    vertical: 'character' | 'quiz' | 'horoscope' | 'future';
    moduleId: string;
    domain?: string;
    locale?: string;
    build?: string;
  };
  payload: {
    markers: Marker[];
    traits?: TraitScore[];
    tags?: Tag[];
    summary?: {
      title?: string;
      bullets?: string[];
      resultId?: string;
    };
  };
};
```

**Nicht portieren:** `Unlock`, `Field`, `AstroPayload`, `ProfileSnapshot` — die werden in Paket 2 bei Bedarf nachgezogen.

### Task 1.3 — Sektor-Konstanten & Topologie

Erstelle `src/lib/fusion-ring/constants.ts`:

```typescript
/** 12 Sektoren, je 30°, astrologische Haus-Logik */
export const SECTOR_COUNT = 12;

export const SECTORS = [
  { idx: 0,  sign: 'aries',       label_de: 'Widder',      element: 'wood',  opp: 6  },
  { idx: 1,  sign: 'taurus',      label_de: 'Stier',       element: 'earth', opp: 7  },
  { idx: 2,  sign: 'gemini',      label_de: 'Zwillinge',   element: 'fire',  opp: 8  },
  { idx: 3,  sign: 'cancer',      label_de: 'Krebs',       element: 'fire',  opp: 9  },
  { idx: 4,  sign: 'leo',         label_de: 'Löwe',        element: 'fire',  opp: 10, element2: 'earth' },
  { idx: 5,  sign: 'virgo',       label_de: 'Jungfrau',    element: 'metal', opp: 11 },
  { idx: 6,  sign: 'libra',       label_de: 'Waage',       element: 'metal', opp: 0  },
  { idx: 7,  sign: 'scorpio',     label_de: 'Skorpion',    element: 'water', opp: 1  },
  { idx: 8,  sign: 'sagittarius', label_de: 'Schütze',     element: 'water', opp: 2  },
  { idx: 9,  sign: 'capricorn',   label_de: 'Steinbock',   element: 'water', opp: 3  },
  { idx: 10, sign: 'aquarius',    label_de: 'Wassermann',  element: 'earth', opp: 4  },
  { idx: 11, sign: 'pisces',      label_de: 'Fische',      element: 'wood',  opp: 5, element2: 'water' },
] as const;

export const SIGN_TO_SECTOR: Record<string, number> = Object.fromEntries(
  SECTORS.map(s => [s.sign, s.idx])
);

/** BaZi Earthly Branch (Tier) → Sektor-Index */
export const ANIMAL_TO_SECTOR: Record<string, number> = {
  tiger: 0,  hase: 0,  rabbit: 0,
  dragon: 1,
  snake: 2,
  horse: 3,
  goat: 4,   sheep: 4, ziege: 4,
  monkey: 5,
  rooster: 6, hahn: 6,
  dog: 7,    hund: 7,
  pig: 8,    schwein: 8,
  rat: 9,    ratte: 9,
  ox: 10,    büffel: 10, buffalo: 10,
  // Tiger taucht auch bei S11 auf (Fische), aber primär S0
};

/** Gauss-Glocke Sigma (Breite in Sektoren) */
export const SIGMA = 1.2;

/** Oppositions-Tension Faktor */
export const OPPOSITION_FACTOR = 0.15;

/** Neighbor-Coupling Stärke */
export const NEIGHBOR_PULL = 0.35;
```

### Task 1.4 — Gauss-Glocke & Zirkuläre Distanz

Erstelle `src/lib/fusion-ring/math.ts`:

```typescript
import { SECTOR_COUNT, SIGMA } from './constants';

/**
 * Zirkuläre Distanz zwischen zwei Sektoren.
 * d(s,p) = min(|s-p|, 12-|s-p|)
 */
export function circularDistance(s: number, p: number): number {
  const diff = Math.abs(s - p);
  return Math.min(diff, SECTOR_COUNT - diff);
}

/**
 * Gauss-Glocke: δ(s, p) = exp(-d(s,p)² / (2σ²))
 * σ = 1.2 → Nachbar-Sektoren bekommen ~0.71, übernächste ~0.25
 */
export function gaussBell(s: number, placement: number, sigma: number = SIGMA): number {
  const d = circularDistance(s, placement);
  return Math.exp(-(d * d) / (2 * sigma * sigma));
}

/**
 * Power-Curve: sign(x) · |x|^1.5
 * Schwache Signale bleiben subtil, starke brechen dramatisch aus.
 */
export function powerCurve(signal: number, exponent: number = 1.5): number {
  return Math.sign(signal) * Math.pow(Math.abs(signal), exponent);
}
```

### Task 1.5 — Western-Komponente W(s)

Erstelle `src/lib/fusion-ring/western.ts`:

```typescript
import { SECTOR_COUNT, SIGN_TO_SECTOR } from './constants';
import { gaussBell } from './math';

/**
 * W(s) = 0.50 · δ(s, sun) + 0.30 · δ(s, moon) + 0.20 · δ(s, asc)
 *
 * Gauss-Glocke statt harter Peaks → organische Formen.
 * Sonne in Löwe (S4) beeinflusst Krebs (S3) und Jungfrau (S5) leicht.
 */
export function westernToSectors(
  sunSign?: string,
  moonSign?: string,
  ascSign?: string,
): number[] {
  const W = new Array(SECTOR_COUNT).fill(0);

  const sunIdx = sunSign ? SIGN_TO_SECTOR[sunSign.toLowerCase()] : undefined;
  const moonIdx = moonSign ? SIGN_TO_SECTOR[moonSign.toLowerCase()] : undefined;
  const ascIdx = ascSign ? SIGN_TO_SECTOR[ascSign.toLowerCase()] : undefined;

  for (let s = 0; s < SECTOR_COUNT; s++) {
    let val = 0;
    if (sunIdx !== undefined)  val += 0.50 * gaussBell(s, sunIdx);
    if (moonIdx !== undefined) val += 0.30 * gaussBell(s, moonIdx);
    if (ascIdx !== undefined)  val += 0.20 * gaussBell(s, ascIdx);
    W[s] = val;
  }

  return W;
}
```

### Task 1.6 — BaZi-Komponente B(s)

Erstelle `src/lib/fusion-ring/bazi.ts`:

```typescript
import { SECTOR_COUNT, ANIMAL_TO_SECTOR } from './constants';
import { gaussBell } from './math';

/**
 * B(s) = 0.40 · δ(s, day) + 0.25 · δ(s, year) + 0.20 · δ(s, month) + 0.15 · δ(s, hour)
 *
 * Earthly Branches mappen auf Sektoren über ANIMAL_TO_SECTOR.
 * Heavenly Stems verstärken die Wuxing-Komponente, nicht B(s) direkt.
 */
export function baziToSectors(pillars: {
  day?: string;     // Tier/Animal der Tages-Säule
  year?: string;
  month?: string;
  hour?: string;
}): number[] {
  const B = new Array(SECTOR_COUNT).fill(0);

  const weights = [
    { animal: pillars.day,   w: 0.40 },
    { animal: pillars.year,  w: 0.25 },
    { animal: pillars.month, w: 0.20 },
    { animal: pillars.hour,  w: 0.15 },
  ];

  for (let s = 0; s < SECTOR_COUNT; s++) {
    let val = 0;
    for (const { animal, w } of weights) {
      if (!animal) continue;
      const sectorIdx = ANIMAL_TO_SECTOR[animal.toLowerCase()];
      if (sectorIdx !== undefined) {
        val += w * gaussBell(s, sectorIdx);
      }
    }
    B[s] = val;
  }

  return B;
}
```

### Task 1.7 — Wuxing-Komponente X(s)

Erstelle `src/lib/fusion-ring/wuxing.ts`:

```typescript
import { SECTOR_COUNT, SECTORS } from './constants';

/**
 * X(s) = wuxing_vector[element(s)] / max(wuxing_vector)
 *
 * Normalisiert auf [0, 1]. Feuer-dominante Profile boosten alle Feuer-Sektoren.
 * S4 (Löwe) und S11 (Fische) haben Doppel-Elemente → Durchschnitt.
 */
export function wuxingToSectors(
  wuxingVector: Record<string, number>,  // z.B. { wood: 2, fire: 5, earth: 3, metal: 1, water: 4 }
): number[] {
  const X = new Array(SECTOR_COUNT).fill(0);

  // Normalisierung: durch Maximum teilen
  const maxVal = Math.max(...Object.values(wuxingVector), 0.01);

  for (let s = 0; s < SECTOR_COUNT; s++) {
    const sector = SECTORS[s];
    const primary = wuxingVector[sector.element] ?? 0;

    if ('element2' in sector && sector.element2) {
      // Doppel-Element Sektoren: Durchschnitt
      const secondary = wuxingVector[sector.element2] ?? 0;
      X[s] = ((primary + secondary) / 2) / maxVal;
    } else {
      X[s] = primary / maxVal;
    }
  }

  return X;
}
```

### Task 1.8 — AFFINITY_MAP & Semantic Marker Resolution

Erstelle `src/lib/fusion-ring/affinity-map.ts`:

```typescript
/**
 * Semantic Marker → Sektor-Gewichte.
 * Jede Zeile: [S0, S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11]
 * Summe pro Zeile ≈ 1.0
 *
 * Lookup-Hierarchie:
 * 1. Keyword-Match (marker.domain.KEYWORD) → Präzision
 * 2. Domain-Fallback (marker.DOMAIN.*) → Grob
 * 3. Unbekannt → ignorieren (12x 0)
 */
export const AFFINITY_MAP: Record<string, number[]> = {
  // === DOMAIN-LEVEL (Fallback) ===
  'love':       [0,  .1, 0,  .3, 0,  0,  .3, .3, 0,  0,  0,  0  ],
  'emotion':    [0,  .2, 0,  .4, .1, 0,  .1, .2, 0,  0,  0,  0  ],
  'social':     [0,  0,  .1, .1, .1, 0,  .3, 0,  0,  0,  .3, 0  ],
  'instinct':   [.3, 0,  0,  0,  0,  0,  0,  .3, .2, .1, 0,  .1 ],
  'cognition':  [0,  0,  .4, 0,  0,  .3, 0,  0,  .2, .1, 0,  0  ],
  'leadership': [.1, 0,  0,  0,  .3, 0,  0,  0,  0,  .4, .1, 0  ],
  'freedom':    [.2, 0,  0,  0,  0,  0,  0,  0,  .5, .1, .2, 0  ],
  'spiritual':  [0,  0,  0,  0,  0,  0,  0,  .2, .2, 0,  0,  .6 ],
  'sensory':    [0,  .5, 0,  0,  0,  0,  0,  .3, 0,  0,  0,  .2 ],
  'creative':   [0,  0,  .2, 0,  .4, 0,  .1, 0,  0,  0,  .2, .1 ],

  // QuizzMe-Registry Kategorien als zusätzliche Domain-Fallbacks
  'eq':         [0,  0,  0,  .3, .1, 0,  .2, .2, 0,  0,  .1, .1 ],
  'values':     [0,  0,  0,  .1, 0,  .2, .1, .2, .2, .1, 0,  .1 ],
  'lifestyle':  [.1, .2, .1, 0,  .1, 0,  0,  0,  .3, 0,  .1, .1 ],
  'skills':     [0,  0,  .3, 0,  .2, .3, 0,  0,  .1, .1, 0,  0  ],
  'aura':       [0,  0,  0,  0,  .2, 0,  .1, .3, 0,  0,  .1, .3 ],

  // === KEYWORD-LEVEL (Präzision) ===
  'physical_touch':      [0,  .2, 0,  0,  0,  0,  0,  .6, 0,  0,  0,  .2 ],
  'harmony':             [0,  0,  0,  .1, 0,  0,  .7, 0,  0,  0,  .2, 0  ],
  'pack_loyalty':        [0,  0,  0,  .2, 0,  0,  .1, 0,  0,  0,  .5, .2 ],
  'primal_sense':        [.5, 0,  0,  0,  0,  0,  0,  .4, 0,  0,  0,  .1 ],
  'gut_feeling':         [.1, 0,  0,  0,  0,  0,  0,  .2, 0,  0,  0,  .7 ],
  'body_awareness':      [0,  .4, 0,  0,  0,  0,  0,  .3, 0,  0,  0,  .3 ],
  'servant_leader':      [0,  0,  0,  .1, 0,  .2, 0,  0,  0,  .5, 0,  .2 ],
  'charisma':            [0,  0,  0,  0,  .6, 0,  .1, 0,  .2, .1, 0,  0  ],
  'analytical':          [0,  0,  .3, 0,  0,  .5, 0,  0,  .1, .1, 0,  0  ],
  'community':           [0,  0,  0,  .1, 0,  0,  .2, 0,  0,  0,  .6, .1 ],
  'passionate':          [.1, 0,  0,  0,  .2, 0,  0,  .5, 0,  0,  0,  .2 ],
  'togetherness':        [0,  0,  0,  .3, 0,  0,  .4, 0,  0,  0,  .2, .1 ],
  'expression':          [0,  0,  .2, 0,  .5, 0,  0,  0,  .2, .1, 0,  0  ],
  'protective':          [.2, 0,  0,  .4, 0,  0,  0,  0,  0,  .3, 0,  .1 ],
  'independence':        [.2, 0,  0,  0,  0,  0,  0,  0,  .5, .1, .2, 0  ],
  'sensory_connection':  [0,  .4, 0,  .1, 0,  0,  0,  .3, 0,  0,  0,  .2 ],
  'physical_expression': [.1, .1, 0,  0,  .2, 0,  0,  .4, 0,  0,  0,  .2 ],

  // QuizzMe Marker-Keywords
  'extroversion':        [.1, 0,  .2, 0,  .3, 0,  .2, 0,  .1, 0,  .1, 0  ],
  'introversion':        [0,  .1, 0,  .2, 0,  .2, 0,  .2, 0,  .1, 0,  .2 ],
  'self_awareness':      [0,  0,  0,  0,  0,  .3, 0,  .3, 0,  0,  0,  .4 ],
  'empathy':             [0,  0,  0,  .4, 0,  0,  .2, .1, 0,  0,  .1, .2 ],
  'system_thinking':     [0,  0,  .3, 0,  0,  .4, 0,  0,  .1, .2, 0,  0  ],
  'spontaneity':         [.2, 0,  .2, 0,  .1, 0,  0,  0,  .3, 0,  .1, .1 ],
  'adventure':           [.2, 0,  .1, 0,  0,  0,  0,  0,  .5, 0,  .1, .1 ],
  'creativity':          [0,  0,  .2, 0,  .4, 0,  .1, 0,  0,  0,  .2, .1 ],
  'warmth':              [0,  .2, 0,  .3, .1, 0,  .1, 0,  0,  0,  .1, .2 ],
  'mystery':             [0,  0,  0,  0,  0,  0,  0,  .4, .1, 0,  0,  .5 ],
  'authority':           [.1, 0,  0,  0,  .3, 0,  0,  0,  0,  .5, .1, 0  ],
  'attachment_secure':   [0,  .2, 0,  .3, 0,  0,  .2, 0,  0,  0,  .1, .2 ],
  'attachment_anxious':  [0,  0,  0,  .4, 0,  0,  .1, .3, 0,  0,  0,  .2 ],
};

export const TAG_AFFINITY: Record<string, number[]> = {
  'guardian':   [.2, 0, 0, .3, 0, 0, 0, 0, 0, .3, .1, .1],
  'flame':     [.1, 0, 0, 0, .3, 0, 0, .4, 0, 0, 0, .2],
  'healer':    [0, 0, 0, .2, 0, .2, 0, 0, 0, 0, 0, .6],
  'trickster': [0, 0, .4, 0, 0, 0, 0, 0, .3, 0, .2, .1],
  'warrior':   [.5, 0, 0, 0, .2, 0, 0, .2, 0, .1, 0, 0],
};
```

### Task 1.9 — Test-Komponente T(s): Semantic Marker Resolution

Erstelle `src/lib/fusion-ring/test-signal.ts`:

```typescript
import { SECTOR_COUNT } from './constants';
import { AFFINITY_MAP, TAG_AFFINITY } from './affinity-map';
import type { ContributionEvent, Marker } from '@/src/lib/lme/types';

/**
 * Resolve einen einzelnen Marker auf 12 Sektor-Gewichte.
 *
 * Lookup-Hierarchie:
 * 1. keyword (marker.domain.KEYWORD) → AFFINITY_MAP[keyword]
 * 2. domain  (marker.DOMAIN.*)       → AFFINITY_MAP[domain]
 * 3. unknown                         → 12x 0
 */
export function resolveMarkerToSectors(marker: Marker): number[] {
  const parts = marker.id.split('.');
  const domain = parts[1];   // z.B. 'love'
  const keyword = parts[2];  // z.B. 'physical_touch'

  // Ebene 2: Keyword-Präzision
  if (keyword && AFFINITY_MAP[keyword]) {
    return AFFINITY_MAP[keyword].map(a => a * marker.weight);
  }

  // Ebene 1: Domain-Fallback
  if (domain && AFFINITY_MAP[domain]) {
    return AFFINITY_MAP[domain].map(a => a * marker.weight);
  }

  // Ebene 0: Unbekannt → ignorieren
  return new Array(SECTOR_COUNT).fill(0);
}

/**
 * Aggregiere alle Marker eines Events zu einem Sektor-Signal.
 * Normalisiert auf [-1, 1].
 */
export function eventToSectorSignals(event: ContributionEvent): number[] {
  const signals = new Array(SECTOR_COUNT).fill(0);

  for (const marker of event.payload.markers) {
    const contribution = resolveMarkerToSectors(marker);
    for (let s = 0; s < SECTOR_COUNT; s++) {
      signals[s] += contribution[s];
    }
  }

  // Tag-Bonus (Archetypen)
  if (event.payload.tags) {
    for (const tag of event.payload.tags) {
      const archetype = tag.id.split('.').pop();
      if (archetype && TAG_AFFINITY[archetype]) {
        const weight = tag.weight ?? 0.5;
        for (let s = 0; s < SECTOR_COUNT; s++) {
          signals[s] += TAG_AFFINITY[archetype][s] * weight;
        }
      }
    }
  }

  // Normalisieren auf [-1, 1]
  const maxAbs = Math.max(...signals.map(Math.abs), 0.01);
  return signals.map(s => s / maxAbs);
}

/**
 * Durchschnittliche Confidence eines Events (für Multi-Event Gewichtung).
 */
function avgConfidence(event: ContributionEvent): number {
  const markers = event.payload.markers;
  if (markers.length === 0) return 0.5;

  const confidences = markers
    .map(m => m.evidence?.confidence ?? 0.5)
    .filter(c => c > 0);

  if (confidences.length === 0) return 0.5;
  return confidences.reduce((a, b) => a + b, 0) / confidences.length;
}

/**
 * Fusioniere alle abgeschlossenen Quiz-Events zu T(s).
 *
 * Events mit höherer Confidence wiegen stärker:
 * Ein Quick-Quiz mit 5 Fragen verschiebt weniger als ein Deep-Quiz mit 20.
 */
export function fuseAllEvents(events: ContributionEvent[]): number[] {
  if (events.length === 0) return new Array(SECTOR_COUNT).fill(0);

  const fused = new Array(SECTOR_COUNT).fill(0);

  for (const event of events) {
    const eventSignals = eventToSectorSignals(event);
    const confidence = avgConfidence(event);

    for (let s = 0; s < SECTOR_COUNT; s++) {
      fused[s] += eventSignals[s] * confidence;
    }
  }

  const maxAbs = Math.max(...fused.map(Math.abs), 0.01);
  return fused.map(s => Math.max(-1, Math.min(1, s / maxAbs)));
}
```

### Task 1.10 — Masterformel & Signal-Composition

Erstelle `src/lib/fusion-ring/signal.ts`:

```typescript
import { SECTOR_COUNT, SECTORS, OPPOSITION_FACTOR, NEIGHBOR_PULL } from './constants';
import { powerCurve } from './math';

export type FusionRingSignal = {
  /** Finale 12 Sektor-Werte nach Opposition + Neighbor-Coupling */
  sectors: number[];
  /** Rohe Komponenten vor Mischung */
  components: {
    W: number[];
    B: number[];
    X: number[];
    T: number[];
  };
  /** Gewichte die verwendet wurden (hängt davon ab ob Tests vorhanden) */
  weights: { w1: number; w2: number; w3: number; w4: number };
  /** Top 3 Sektor-Indizes */
  peakSectors: number[];
  /** Profil-Auflösung: 0-100% */
  resolution: number;
};

/**
 * Masterformel:
 *   Signal(s) = w1·W(s) + w2·B(s) + w3·X(s) + w4·T(s)
 *
 * Ohne Tests (neuer User):
 *   w1 = w2 = 0.375, w3 = 0.25, w4 = 0.0
 *
 * Mit Tests:
 *   w1 = 0.30, w2 = 0.30, w3 = 0.20, w4 = 0.20
 *
 * Nachbearbeitung:
 * 1. Opposition-Tension: -Signal(opposite) · 0.15
 * 2. Neighbor-Coupling: Glättung mit Faktor 0.35
 */
export function computeFusionSignal(
  W: number[],
  B: number[],
  X: number[],
  T: number[],
  completedTests: number,
  totalTests: number,
): FusionRingSignal {
  // Gewichte bestimmen
  const hasTests = completedTests > 0 && T.some(v => v !== 0);
  const weights = hasTests
    ? { w1: 0.30, w2: 0.30, w3: 0.20, w4: 0.20 }
    : { w1: 0.375, w2: 0.375, w3: 0.25, w4: 0.0 };

  // Masterformel
  const raw = new Array(SECTOR_COUNT).fill(0);
  for (let s = 0; s < SECTOR_COUNT; s++) {
    raw[s] = weights.w1 * (W[s] ?? 0)
           + weights.w2 * (B[s] ?? 0)
           + weights.w3 * (X[s] ?? 0)
           + weights.w4 * (T[s] ?? 0);
  }

  // Opposition-Tension
  const withTension = [...raw];
  for (let s = 0; s < SECTOR_COUNT; s++) {
    const opp = SECTORS[s].opp;
    withTension[s] += -raw[opp] * OPPOSITION_FACTOR;
  }

  // Neighbor-Coupling (Glättung)
  const smoothed = [...withTension];
  for (let s = 0; s < SECTOR_COUNT; s++) {
    const prev = (s - 1 + SECTOR_COUNT) % SECTOR_COUNT;
    const next = (s + 1) % SECTOR_COUNT;
    const avg = (withTension[prev] + withTension[next]) / 2;
    smoothed[s] += (avg - withTension[s]) * NEIGHBOR_PULL;
  }

  // Peak-Sektoren (Top 3)
  const indexed = smoothed.map((val, idx) => ({ val, idx }));
  indexed.sort((a, b) => b.val - a.val);
  const peakSectors = indexed.slice(0, 3).map(e => e.idx);

  return {
    sectors: smoothed,
    components: { W, B, X, T },
    weights,
    peakSectors,
    resolution: totalTests > 0 ? Math.round((completedTests / totalTests) * 100) : 0,
  };
}
```

### Task 1.11 — Barrel Export

Erstelle `src/lib/fusion-ring/index.ts`:

```typescript
export { SECTORS, SECTOR_COUNT, SIGN_TO_SECTOR, ANIMAL_TO_SECTOR, SIGMA } from './constants';
export { circularDistance, gaussBell, powerCurve } from './math';
export { westernToSectors } from './western';
export { baziToSectors } from './bazi';
export { wuxingToSectors } from './wuxing';
export { AFFINITY_MAP, TAG_AFFINITY } from './affinity-map';
export { resolveMarkerToSectors, eventToSectorSignals, fuseAllEvents } from './test-signal';
export { computeFusionSignal, type FusionRingSignal } from './signal';
```

### Task 1.12 — Tests (KRITISCH)

Erstelle `src/__tests__/fusion-ring.test.ts`:

**Test-Gruppen:**

1. **Gauss-Glocke Mathematik**
   - `gaussBell(4, 4)` === 1.0 (Identität)
   - `gaussBell(3, 4)` ≈ 0.707 (σ=1.2, d=1)
   - `gaussBell(2, 4)` ≈ 0.249 (d=2)
   - `gaussBell(0, 6)` === `gaussBell(0, 6)` (zirkuläre Symmetrie: d=6 = d=6)
   - `circularDistance(0, 11)` === 1 (Wrap-Around)

2. **Western-Komponente**
   - Sonne Löwe, Mond Fische, Asz Skorpion → W(4)≈0.50, W(11)≈0.30, W(7)≈0.20
   - W(3) ≈ 0.35 (Gauss-Nachbar von Sonne)
   - Summe aller W(s) muss plausibel sein (kein NaN, keine Negativwerte)

3. **Semantic Marker Resolution**
   - `marker.love.physical_touch` (w=0.95) → keyword-match, S7 peak
   - `marker.love.unknown_keyword` → domain-fallback auf 'love'
   - `marker.xyzzy.foobar` → 12x 0 (unbekannt)

4. **Proof-Berechnung: Love Languages Event ("Die Flamme")**

   Input Markers:
   ```
   marker.love.physical_touch     w=0.95
   marker.love.sensory_connection w=0.80
   marker.emotion.body_awareness  w=0.75
   marker.love.physical_expression w=0.72
   marker.love.togetherness       w=0.56
   marker.love.passionate         w=0.68
   ```
   Erwartetes normalisiertes Ergebnis (aus Spec v2):
   ```
   S0≈0.08  S1≈0.53  S2=0  S3≈0.15  S4≈0.17  S5=0  S6≈0.13
   S7=1.00  S8=0     S9=0  S10≈0.07 S11≈0.55
   ```
   **S7 muss der absolute Peak sein.** Toleranz: ±0.05 pro Sektor.

5. **Proof-Berechnung: Wolf Event**

   Input Markers:
   ```
   marker.social.pack_loyalty       w=0.82
   marker.instinct.primal_sense     w=0.75
   marker.leadership.servant_leader w=0.68
   ```
   Erwartetes normalisiertes Ergebnis:
   ```
   S10=1.00 (Peak), S0≈0.91, S11≈0.91, S9≈0.83
   ```

6. **Masterformel ohne Tests**
   - T = 12x 0 → weights müssen 0.375/0.375/0.25/0.0 sein
   - Signal darf nur W+B+X enthalten

7. **Opposition-Tension**
   - Wenn S0 starkes Signal hat → S6 bekommt negativen Offset (-0.15 * S0)

8. **AFFINITY_MAP Integrität**
   - Jede Zeile summiert ≈ 1.0 (Toleranz ±0.05)
   - Keine negativen Werte
   - Alle 12 Einträge pro Zeile

---

## Dateistruktur (Ergebnis dieses Pakets)

```
src/
├── lib/
│   ├── lme/
│   │   └── types.ts                    ← ContributionEvent, Marker, Tag
│   └── fusion-ring/
│       ├── constants.ts                ← SECTORS, ANIMAL_TO_SECTOR, SIGMA, etc.
│       ├── math.ts                     ← gaussBell, circularDistance, powerCurve
│       ├── western.ts                  ← westernToSectors
│       ├── bazi.ts                     ← baziToSectors
│       ├── wuxing.ts                   ← wuxingToSectors
│       ├── affinity-map.ts             ← AFFINITY_MAP, TAG_AFFINITY
│       ├── test-signal.ts              ← resolveMarkerToSectors, eventToSectorSignals, fuseAllEvents
│       ├── signal.ts                   ← computeFusionSignal, FusionRingSignal
│       └── index.ts                    ← Re-exports
├── __tests__/
│   └── fusion-ring.test.ts             ← Proof-Tests
├── vitest.config.ts                    ← Vitest Setup (falls nicht vorhanden)
```

---

## Akzeptanzkriterien

1. `npm run lint` (tsc --noEmit) fehlerfrei
2. `npm run test` — alle Tests grün
3. Proof "Die Flamme": S7 = 1.00 (Peak), S1 ≈ 0.53, S11 ≈ 0.55 (±0.05)
4. Proof "Wolf": S10 = 1.00 (Peak), S0 ≈ 0.91 (±0.05)
5. Gauss-Glocke korrekt: σ=1.2, Nachbar ≈ 0.71
6. Ohne Tests: Gewichte automatisch auf 0.375/0.375/0.25/0.0
7. Opposition-Tension funktioniert: Gegenüber starker Peaks sind Einbuchtungen messbar
8. **Keine UI-Änderungen.** Dashboard, BirthForm, App.tsx bleiben unberührt.

---

## Nicht im Scope dieses Pakets

- Keine Quiz-Komponenten
- Keine Quiz→Event Mapper
- Keine Supabase-Persistence für Events
- Kein useFusionRing Hook
- Keine Visualisierung (Fusion Ring UI)
- Keine Änderung an bestehenden Dateien außer package.json (Vitest Dependency)
