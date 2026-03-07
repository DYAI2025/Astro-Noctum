# Entwicklungsauftrag: Semantic Marker Mapping + Quiz-Integration

> **Ziel-Repository:** `DYAI2025/Astro-Noctum` (Vite + React 19 + TypeScript)
> **Quell-Repository:** `DYAI2025/QuizzMe` (Next.js 16 + React 19 + TypeScript)
> **Spec-Dokument:** `Bazodiac_Semantic_Marker_Mapping_v2.docx`
> **Datum:** 2026-03-06

---

## 1. Kontext & Ziel

Astro-Noctum ist eine Fusion-Astrology-App (Western + BaZi + Wu-Xing). Die aktuelle App berechnet über die BAFE API Astro-Daten und generiert via Gemini eine Text-Interpretation. Es fehlt die gesamte Test/Quiz-Schicht: Der User soll Persönlichkeits-Quizzes absolvieren können, deren Ergebnisse als `ContributionEvent` mit semantischen Markern in einen 12-Sektor "Fusion Ring" fließen.

**Masterformel:** `Signal(s) = 0.30·W(s) + 0.30·B(s) + 0.20·X(s) + 0.20·T(s)`

- W(s) = Western Astro Sektorsignal
- B(s) = BaZi Sektorsignal
- X(s) = Wu-Xing Sektorsignal
- T(s) = Test/Quiz Sektorsignal ← **DAS WIRD GEBAUT**

Die 12 Sektoren S0–S11 repräsentieren die 12 Zeichen (Widder→Fische), basierend auf der astrologischen Haus-Logik.

---

## 2. Ist-Zustand beider Repos

### 2.1 Astro-Noctum (Ziel)

**Tech:** Vite, React 19, TypeScript, Tailwind v4, Three.js (3D Orrery), Express (server.mjs), Supabase, Railway-Deploy

**Architektur:** Single-Page App, State-Flow: `Splash → AuthGate → BirthForm → Dashboard`. Kein Router. State in `App.tsx` via `useState`.

**Pfad-Alias:** `@/*` mappt auf **Project Root** (nicht `src/`). Also: `@/src/services/api`.

**Vorhanden:**
- BAFE API Integration (5 Endpoints: bazi, western, fusion, wuxing, tst) → `src/services/api.ts`
- Gemini Text-Interpretation → `src/services/gemini.ts`
- Supabase Auth + Persistence → `src/services/supabase.ts`, `src/contexts/AuthContext.tsx`
- 3D Orrery → `src/components/BirthChartOrrery.tsx`
- BAFE Response Types → `src/types/bafe.ts`
- Astro-Daten (Zodiac Signs, Earthly Branches, Wu-Xing, Constellations) → `src/lib/astro-data/`
- ElevenLabs Voice Agent (Levi Bazi)

**NICHT vorhanden:**
- Kein Quiz-System
- Keine ContributionEvents
- Keine AFFINITY_MAP
- Kein Fusion Ring (12-Sektor Visualisierung)
- Keine Marker/Trait Registry
- Keine Ingestion Pipeline
- Keine `resolveMarkerToSectors`, `eventToSectorSignals`, `fuseAllEvents`
- Keine Masterformel-Berechnung

### 2.2 QuizzMe (Quelle)

**Tech:** Next.js 16, React 19, TypeScript, Tailwind, Supabase

**Vorhanden (portierbar):**
- **ContributionEvent Spec** → `src/lib/lme/types.ts` (vollständig definiert: Marker, TraitScore, Tag, Unlock, Field, AstroPayload, ProfileSnapshot)
- **Marker Registry** → `src/lib/registry/markers.ts` (47 Marker in 9 Kategorien: social, love, cognition, eq, lifestyle, values, skills, aura, astro)
- **Contribution Validators** → `src/lib/contribution/` (Shape + ID + Module Validation)
- **Ingestion Pipeline** → `src/lib/ingestion/` (Event → validate → update psyche → update traits → merge cosmetics → snapshot)
- **Trait System** → `src/lib/traits/` (Two-Layer: baseScore + shiftZ)
- **Registry** → `src/lib/registry/` (markers.ts, traits.ts, tags.ts, unlocks.ts, fields.ts)
- **14 Quiz-Komponenten** → `src/components/quizzes/` (LoveLanguages, Krafttier, EQ, Personality, AuraColors, SocialRole, etc.)
- **Quiz JSON Configs** → z.B. `love-languages-quiz.json`, plus Unterverzeichnisse pro Quiz
- **Profile System** → `src/lib/profile/`, `src/hooks/usePsycheProfile.ts`
- **Cluster Progress** → `src/lib/stores/useClusterProgress.ts`

**WICHTIG:** Die Quizzes sind Standalone-Komponenten. Jedes Quiz hat:
1. Ein JSON-Config mit Fragen, Optionen, Scores, Profilen
2. Eine React-Komponente die Scores akkumuliert und ein Profil zuordnet
3. Die Quizzes emittieren NOCH KEINE ContributionEvents direkt — die Marker-Emission muss als Brücke gebaut werden

---

## 3. Implementierungsauftrag

### Phase 1: Core Types & AFFINITY_MAP

**Task 1.1 — LME Types portieren**

Erstelle `src/lib/lme/types.ts` in Astro-Noctum. Portiere aus QuizzMe (`src/lib/lme/types.ts`):
- `ContributionEvent`
- `Marker`
- `TraitScore`
- `Tag`
- `Unlock`
- `Field`
- `AstroPayload`
- `SpecVersion`

Entferne Next.js-spezifische Imports. Passe Pfad-Alias an (`@/src/...` statt `@/lib/...`).

**Task 1.2 — Marker Registry portieren**

Erstelle `src/lib/registry/markers.ts`. Portiere die `MARKERS` Definitionen und Lookup-Helpers (`MARKER_BY_ID`, `MARKER_IDS`, `MARKERS_BY_CATEGORY`).

**Task 1.3 — AFFINITY_MAP implementieren**

Erstelle `src/lib/fusion-ring/affinity-map.ts`. Implementiere die AFFINITY_MAP exakt wie im Spec-Dokument v2:

```typescript
export const AFFINITY_MAP: Record<string, number[]> = {
  // keyword: [S0, S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11]

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
};
```

Zusätzlich die `TAG_AFFINITY` Map:

```typescript
export const TAG_AFFINITY: Record<string, number[]> = {
  'guardian':   [.2, 0, 0, .3, 0, 0, 0, 0, 0, .3, .1, .1],
  'flame':     [.1, 0, 0, 0, .3, 0, 0, .4, 0, 0, 0, .2],
  'healer':    [0, 0, 0, .2, 0, .2, 0, 0, 0, 0, 0, .6],
  'trickster': [0, 0, .4, 0, 0, 0, 0, 0, .3, 0, .2, .1],
  'warrior':   [.5, 0, 0, 0, .2, 0, 0, .2, 0, .1, 0, 0],
};
```

Exportiere die Sektor-Metadaten als Konstante:

```typescript
export const SECTORS = [
  { id: 'S0',  sign: 'Aries',       label_de: 'Widder',      domain: 'Impuls, Mut, Initiative' },
  { id: 'S1',  sign: 'Taurus',      label_de: 'Stier',       domain: 'Sinnlichkeit, Stabilität' },
  { id: 'S2',  sign: 'Gemini',      label_de: 'Zwillinge',   domain: 'Kognition, Kommunikation' },
  { id: 'S3',  sign: 'Cancer',      label_de: 'Krebs',       domain: 'Emotion, Fürsorge' },
  { id: 'S4',  sign: 'Leo',         label_de: 'Löwe',        domain: 'Ausdruck, Kreativität' },
  { id: 'S5',  sign: 'Virgo',       label_de: 'Jungfrau',    domain: 'Analyse, Präzision' },
  { id: 'S6',  sign: 'Libra',       label_de: 'Waage',       domain: 'Beziehung, Harmonie' },
  { id: 'S7',  sign: 'Scorpio',     label_de: 'Skorpion',    domain: 'Tiefe, Transformation' },
  { id: 'S8',  sign: 'Sagittarius', label_de: 'Schütze',     domain: 'Freiheit, Philosophie' },
  { id: 'S9',  sign: 'Capricorn',   label_de: 'Steinbock',   domain: 'Struktur, Ambition' },
  { id: 'S10', sign: 'Aquarius',    label_de: 'Wassermann',  domain: 'Kollektiv, Innovation' },
  { id: 'S11', sign: 'Pisces',      label_de: 'Fische',      domain: 'Intuition, Spiritualität' },
] as const;
```

### Phase 2: Resolution-Algorithmus

**Task 2.1 — resolveMarkerToSectors**

Erstelle `src/lib/fusion-ring/resolve.ts`:

```typescript
import { AFFINITY_MAP } from './affinity-map';
import type { Marker } from '@/src/lib/lme/types';

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
  return new Array(12).fill(0);
}
```

**Task 2.2 — eventToSectorSignals**

```typescript
import type { ContributionEvent } from '@/src/lib/lme/types';

export function eventToSectorSignals(event: ContributionEvent): number[] {
  const signals = new Array(12).fill(0);
  const { markers } = event.payload;

  for (const marker of markers) {
    const contribution = resolveMarkerToSectors(marker);
    for (let s = 0; s < 12; s++) {
      signals[s] += contribution[s];
    }
  }

  const maxAbs = Math.max(...signals.map(Math.abs), 0.01);
  return signals.map(s => s / maxAbs);
}
```

**Task 2.3 — fuseAllEvents**

```typescript
export function fuseAllEvents(events: ContributionEvent[]): number[] {
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

function avgConfidence(event: ContributionEvent): number {
  const markers = event.payload.markers;
  if (markers.length === 0) return 0;

  const confidences = markers
    .map(m => m.evidence?.confidence ?? 0.5)
    .filter(c => c > 0);

  if (confidences.length === 0) return 0.5;
  return confidences.reduce((a, b) => a + b, 0) / confidences.length;
}
```

**Task 2.4 — Masterformel-Integration**

Erstelle `src/lib/fusion-ring/signal.ts`:

```typescript
import type { MappedWestern, MappedBazi, MappedWuxing } from '@/src/types/bafe';

export type FusionRingSignal = {
  sectors: number[];         // 12 values [-1, 1]
  components: {
    W: number[];             // Western Astro contribution
    B: number[];             // BaZi contribution
    X: number[];             // Wu-Xing contribution
    T: number[];             // Test/Quiz contribution
  };
  peakSectors: number[];     // Indices of top 3 sectors
  timestamp: string;
};

/**
 * Berechnet das finale Fusionssignal.
 *
 * Signal(s) = 0.30·W(s) + 0.30·B(s) + 0.20·X(s) + 0.20·T(s)
 */
export function computeFusionSignal(
  W: number[],   // Western → Sektor-Mapping (aus Zodiac Sign)
  B: number[],   // BaZi → Sektor-Mapping (aus Day Master / Pillars)
  X: number[],   // Wu-Xing → Sektor-Mapping (aus Element Balance)
  T: number[],   // Test → fuseAllEvents Output
): FusionRingSignal {
  const sectors = new Array(12).fill(0);

  for (let s = 0; s < 12; s++) {
    sectors[s] = 0.30 * (W[s] ?? 0)
               + 0.30 * (B[s] ?? 0)
               + 0.20 * (X[s] ?? 0)
               + 0.20 * (T[s] ?? 0);
  }

  // Peak-Sektoren finden (Top 3)
  const indexed = sectors.map((val, idx) => ({ val, idx }));
  indexed.sort((a, b) => b.val - a.val);
  const peakSectors = indexed.slice(0, 3).map(e => e.idx);

  return {
    sectors,
    components: { W, B, X, T },
    peakSectors,
    timestamp: new Date().toISOString(),
  };
}
```

**Task 2.5 — Astro-zu-Sektor Mapper**

Erstelle `src/lib/fusion-ring/astro-to-sectors.ts`. Mappt die vorhandenen BAFE-Daten (Western Sign, BaZi Pillars, Wu-Xing Vektor) auf 12-Sektor-Arrays:

```typescript
/**
 * Western Zodiac Sign → Sektor-Array
 * Sun Sign bekommt Peak 1.0, benachbarte Zeichen 0.3
 */
export function westernToSectors(sunSign: string, moonSign?: string, ascSign?: string): number[] {
  const sectors = new Array(12).fill(0);
  const signIndex = SIGN_TO_INDEX[sunSign.toLowerCase()];
  if (signIndex !== undefined) {
    sectors[signIndex] = 1.0;
    sectors[(signIndex + 1) % 12] = 0.15;
    sectors[(signIndex + 11) % 12] = 0.15;
  }
  // Moon Sign als sekundäres Signal
  if (moonSign) {
    const moonIdx = SIGN_TO_INDEX[moonSign.toLowerCase()];
    if (moonIdx !== undefined) sectors[moonIdx] = Math.max(sectors[moonIdx], 0.6);
  }
  // Aszendent
  if (ascSign) {
    const ascIdx = SIGN_TO_INDEX[ascSign.toLowerCase()];
    if (ascIdx !== undefined) sectors[ascIdx] = Math.max(sectors[ascIdx], 0.5);
  }
  return sectors;
}

const SIGN_TO_INDEX: Record<string, number> = {
  aries: 0, taurus: 1, gemini: 2, cancer: 3, leo: 4, virgo: 5,
  libra: 6, scorpio: 7, sagittarius: 8, capricorn: 9, aquarius: 10, pisces: 11,
};

/**
 * BaZi Day Master / Animal → Sektor-Array
 * Mappt chinesisches Tierkreiszeichen auf korrespondierende Sektoren
 */
export function baziToSectors(dayMaster: string, animal: string): number[] {
  // Implementierung: Mapping Chinese Animal → Western Sector Affinities
  // z.B. Dragon → S4 (Leo/Führung), Snake → S7 (Scorpio/Tiefe), etc.
}

/**
 * Wu-Xing Vektor → Sektor-Array
 * Mappt die 5 Elemente auf ihre zugehörigen Sektoren
 */
export function wuxingToSectors(elements: Record<string, number>): number[] {
  const sectors = new Array(12).fill(0);
  // Feuer → S0 (Widder), S4 (Löwe), S8 (Schütze)
  // Erde → S1 (Stier), S5 (Jungfrau), S9 (Steinbock)
  // Luft/Metall → S2 (Zwillinge), S6 (Waage), S10 (Wassermann)
  // Wasser → S3 (Krebs), S7 (Skorpion), S11 (Fische)
  const ELEMENT_SECTORS: Record<string, number[]> = {
    fire:  [0, 4, 8],
    earth: [1, 5, 9],
    metal: [2, 6, 10],
    wood:  [2, 6, 10],  // Wood ≈ Air/Growth → Gemini, Libra, Aquarius
    water: [3, 7, 11],
  };
  for (const [element, value] of Object.entries(elements)) {
    const sectorIndices = ELEMENT_SECTORS[element.toLowerCase()];
    if (sectorIndices && typeof value === 'number') {
      for (const idx of sectorIndices) {
        sectors[idx] += value / sectorIndices.length;
      }
    }
  }
  return sectors;
}
```

### Phase 3: Quiz-Integration

**Task 3.1 — Quiz-Komponenten portieren**

Portiere aus QuizzMe nach Astro-Noctum (`src/components/quizzes/`):

Priorität 1 (MVP — diese 3 zuerst):
1. `LoveLanguagesQuiz.tsx` + `love-languages-quiz.json`
2. `KrafttierQuiz.tsx` + `krafttier/` Unterverzeichnis
3. `PersonalityQuiz.tsx`

Priorität 2:
4. `EQQuiz.tsx` + `feq/`
5. `AuraColorsQuiz.tsx` + `aura-colors/`
6. `SocialRoleQuiz.tsx` + `social-role/`

**Portierungsregeln:**
- Entferne alle `'use client'` Direktiven (Vite braucht kein Server/Client split)
- Entferne Next.js-spezifische Imports (`next/link`, `next/navigation`)
- Passe Import-Pfade an (`@/src/...`)
- Entferne `useClusterProgress` Referenzen (existiert nicht in Astro-Noctum)
- Behalte die bestehende Quiz-Logik (Score-Akkumulation, Profil-Zuordnung)
- Styling: Passe an Astro-Noctum Palette an (obsidian `#00050A`, gold `#D4AF37`, ash `#1A1C1E`). Nutze bestehende CSS-Klassen: `.glass-card`, `.stele-card`

**Task 3.2 — Quiz → ContributionEvent Bridge**

Erstelle `src/lib/fusion-ring/quiz-to-event.ts`. Jedes Quiz muss nach Abschluss ein ContributionEvent emittieren.

**Pro Quiz** wird ein Mapper benötigt, der die Quiz-Scores in Marker übersetzt. Beispiel für Love Languages:

```typescript
export function loveLangToContribution(
  scores: Record<string, number>,
  profileId: string
): ContributionEvent {
  const maxScore = Math.max(...Object.values(scores), 1);
  const markers: Marker[] = [];

  // Love Language Dimensions → Marker IDs
  const DIMENSION_MAP: Record<string, string> = {
    touch:   'marker.love.physical_touch',
    words:   'marker.love.expression',
    time:    'marker.love.togetherness',
    gifts:   'marker.love.sensory_connection',
    service: 'marker.love.protective',
  };

  for (const [dim, markerId] of Object.entries(DIMENSION_MAP)) {
    if (scores[dim] !== undefined) {
      markers.push({
        id: markerId,
        weight: scores[dim] / maxScore, // Normalize 0–1
        evidence: {
          confidence: 0.7,
          itemsAnswered: Object.keys(scores).length,
        },
      });
    }
  }

  return {
    specVersion: 'sp.contribution.v1',
    eventId: crypto.randomUUID(),
    occurredAt: new Date().toISOString(),
    source: {
      vertical: 'quiz',
      moduleId: 'quiz.love_languages.v1',
      locale: 'de-DE',
    },
    payload: {
      markers,
      tags: [{
        id: 'tag.archetype.flame',
        label: profileId,
        kind: 'archetype',
        weight: 0.8,
      }],
    },
  };
}
```

Analoge Mapper für Krafttier (`quiz.krafttier.v1`), Personality (`quiz.personality.v1`), etc.

**Task 3.3 — Event-Persistenz**

Events müssen in Supabase gespeichert werden.

Neue Tabelle (Supabase Migration):

```sql
create table if not exists public.contribution_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id),
  event_id text unique not null,
  module_id text not null,
  occurred_at timestamptz not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.contribution_events enable row level security;

create policy "users_own_events"
on public.contribution_events
for all
to authenticated
using (user_id = auth.uid());

create policy "insert_events_anon"
on public.contribution_events
for insert
to anon
with check (true);
```

Erstelle `src/services/contribution-events.ts`:

```typescript
export async function saveContributionEvent(event: ContributionEvent): Promise<void>
export async function loadUserEvents(userId: string): Promise<ContributionEvent[]>
```

### Phase 4: Fusion Ring State & Hook

**Task 4.1 — useFusionRing Hook**

Erstelle `src/hooks/useFusionRing.ts`. Dieser Hook orchestriert alles:

```typescript
export function useFusionRing(apiResults: ApiResults | null) {
  const [events, setEvents] = useState<ContributionEvent[]>([]);
  const [signal, setSignal] = useState<FusionRingSignal | null>(null);

  // Bei Mount: Events aus Supabase laden
  // Bei neuen ApiResults: W, B, X berechnen
  // Bei Quiz-Completion: Event hinzufügen, T neu berechnen
  // Signal = computeFusionSignal(W, B, X, T)

  const addQuizResult = useCallback((event: ContributionEvent) => {
    saveContributionEvent(event);
    setEvents(prev => [...prev, event]);
    // T neu berechnen, Signal updaten
  }, []);

  return { signal, events, addQuizResult };
}
```

**Task 4.2 — Integration in App.tsx**

Der Hook wird im bestehenden Dashboard-Flow eingebunden:
- Nach `calculateAll()` (BAFE-Daten vorhanden) → W, B, X berechnen
- Dashboard bekommt `signal` als Prop
- Quiz-Completion ruft `addQuizResult()` auf

### Phase 5: Fusion Ring Visualisierung

**Task 5.1 — FusionRing Komponente**

Erstelle `src/components/FusionRing.tsx`. Ein 12-Sektor Radialdiagramm (Radar/Polar Chart):

**Design-Vorgaben:**
- SVG-basiert (kein Chart-Library-Dependency)
- 12 Achsen, beschriftet mit Zeichen-Symbolen (♈♉♊♋♌♍♎♏♐♑♒♓)
- Gefüllte Fläche zeigt Signal-Intensität
- Farb-Coding: Astro-Anteil (gold `#D4AF37`), Test-Anteil (cyan `#00C8FF`), Overlap (blend)
- Peak-Sektoren werden visuell hervorgehoben (Glow-Effekt)
- Dark Background, passt zum obsidian/gold Aesthetic
- Responsive (min 280px, max 480px)
- Optional: Animierter Übergang wenn neue Events einfließen

**Props:**
```typescript
interface FusionRingProps {
  signal: FusionRingSignal;
  showComponents?: boolean;  // Zeige W/B/X/T als separate Layer
  size?: number;
  className?: string;
}
```

**Task 5.2 — Quiz-Zugang im Dashboard**

Erweitere `src/components/Dashboard.tsx`:
- Neuer Bereich "Deine Quizzes" unterhalb der Interpretation
- Quiz-Cards (je Quiz eine Card mit Icon, Titel, Status: offen/abgeschlossen)
- Klick öffnet Quiz als Modal/Overlay (kein Routing, App hat keinen Router)
- Nach Quiz-Abschluss: ContributionEvent wird emittiert, Fusion Ring updatet sich

### Phase 6: Tests

**Task 6.1 — Unit Tests für Resolution-Algorithmus**

Erstelle `src/__tests__/fusion-ring.test.ts` mit Vitest:

1. `resolveMarkerToSectors` — Keyword-Match, Domain-Fallback, Unknown-Marker
2. `eventToSectorSignals` — Love Languages Event (Proof aus Spec v2: S7 Peak bei 1.0)
3. `fuseAllEvents` — Multi-Event Aggregation
4. `computeFusionSignal` — Masterformel korrekt
5. Validation: Alle AFFINITY_MAP Zeilen summieren ~1.0

**Wichtig:** Die Proof-Berechnung aus dem Spec (Section 4) dient als Testcase:
- Love Languages Event ("Die Flamme") → S7=1.00, S11=0.55, S1=0.53
- Wolf Event → S10=1.00, S0=0.91, S11=0.91, S9=0.83

---

## 4. Dateistruktur (Zielzustand)

```
src/
├── lib/
│   ├── lme/
│   │   └── types.ts                    ← ContributionEvent, Marker, etc.
│   ├── registry/
│   │   └── markers.ts                  ← Marker-Definitionen
│   ├── fusion-ring/
│   │   ├── affinity-map.ts             ← AFFINITY_MAP + TAG_AFFINITY + SECTORS
│   │   ├── resolve.ts                  ← resolveMarkerToSectors, eventToSectorSignals, fuseAllEvents
│   │   ├── signal.ts                   ← computeFusionSignal, FusionRingSignal type
│   │   ├── astro-to-sectors.ts         ← westernToSectors, baziToSectors, wuxingToSectors
│   │   ├── quiz-to-event.ts            ← loveLangToContribution, krafttierToContribution, etc.
│   │   └── index.ts                    ← Re-exports
├── hooks/
│   └── useFusionRing.ts                ← Orchestration Hook
├── services/
│   └── contribution-events.ts          ← Supabase CRUD für Events
├── components/
│   ├── FusionRing.tsx                  ← SVG Visualisierung
│   └── quizzes/
│       ├── LoveLanguagesQuiz.tsx       ← Portiert + angepasst
│       ├── KrafttierQuiz.tsx           ← Portiert + angepasst
│       ├── PersonalityQuiz.tsx         ← Portiert + angepasst
│       ├── love-languages-quiz.json
│       └── ...
├── __tests__/
│   └── fusion-ring.test.ts             ← Proof-Tests
```

---

## 5. Reihenfolge & Abhängigkeiten

```
Task 1.1 (Types)
  ↓
Task 1.2 (Registry) + Task 1.3 (AFFINITY_MAP)
  ↓
Task 2.1–2.3 (Resolution-Algorithmus)
  ↓
Task 6.1 (Tests — hier stoppen und validieren!)
  ↓
Task 2.4–2.5 (Masterformel + Astro Mapper)
  ↓
Task 3.1 (Quiz-Portierung)
  ↓
Task 3.2 (Quiz→Event Bridge)
  ↓
Task 3.3 (Supabase Persistence)
  ↓
Task 4.1–4.2 (Hook + App Integration)
  ↓
Task 5.1–5.2 (Visualisierung + Dashboard)
```

**Checkpoint nach Task 6.1:** Alle Proof-Berechnungen aus dem Spec müssen exakt stimmen, bevor weitergebaut wird. Die Zahlen aus Section 4 des Spec-Dokuments sind die Acceptance Criteria.

---

## 6. Nicht im Scope

- Kein neues Quiz-Design/Layout (bestehende Quizzes werden 1:1 portiert, nur Styling angepasst)
- Keine Echtzeit-Synchronisation (Supabase Realtime)
- Kein Dating-Matching (Section 6.3 im Spec — "Schublade")
- Keine neue Auth-Logik (bestehende AuthGate/Supabase Auth bleibt)
- Keine Änderung am 3D Orrery
- Kein Routing (alles bleibt State-driven in App.tsx)

---

## 7. Akzeptanzkriterien

1. `npm run lint` (tsc --noEmit) läuft fehlerfrei durch
2. Tests für Resolution-Algorithmus bestehen (Proof-Zahlen aus Spec v2)
3. Love Languages Quiz funktioniert End-to-End: Fragen beantworten → ContributionEvent wird emittiert → Fusion Ring updatet sich
4. Fusion Ring zeigt korrekte Peaks (visuell verifizierbar gegen Spec Section 4)
5. Events werden in Supabase persistiert und beim Reload wiederhergestellt
6. Bestehendes Verhalten (BAFE Integration, Gemini Interpretation, 3D Orrery, Auth) bleibt unverändert
