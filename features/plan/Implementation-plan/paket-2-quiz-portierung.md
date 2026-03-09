# PAKET 2 — Quiz-Portierung + Event Bridge

> **Repo:** `DYAI2025/Astro-Noctum` (Vite + React 19 + TypeScript)
> **Quell-Repo:** `DYAI2025/QuizzMe` (Next.js 16)
> **Voraussetzung:** Paket 1 (Signal Engine) muss abgeschlossen sein. Tests müssen grün sein.

---

## Kontext

Paket 1 hat die mathematische Engine gebaut (`src/lib/fusion-ring/`). Jetzt brauchen wir Quiz-Komponenten, die ContributionEvents produzieren, und eine Persistence-Schicht die Events in Supabase speichert und beim Reload wiederherstellt. Am Ende dieses Pakets kann ein User ein Quiz absolvieren und das Ergebnis fließt in den Fusion Ring Signalvektor.

---

## Bestehende Architektur (Erinnerung)

- **Kein Router.** Alles State-driven in `App.tsx`. Quizzes werden als Modal/Overlay geöffnet, nicht als Route.
- **Pfad-Alias:** `@/*` mappt auf Project Root. Also: `@/src/components/...`
- **Styling:** Tailwind v4, Obsidian/Gold Palette (`--color-obsidian: #00050A`, `--color-gold: #D4AF37`, `--color-ash: #1A1C1E`). Fonts: Sora, Cormorant Garamond. Klassen: `.glass-card`, `.stele-card`
- **Supabase:** Bereits integriert. Client in `src/lib/supabase.ts`. Auth in `src/contexts/AuthContext.tsx`.
- **QuizzMe Quizzes:** 14 Standalone-Komponenten in `src/components/quizzes/`. Jede hat ein JSON-Config + React-Komponente. Sie nutzen `useClusterProgress` (QuizzMe-spezifisch, existiert nicht in Astro-Noctum).

---

## Tasks

### Task 2.1 — Supabase Migration: contribution_events Tabelle

Erstelle `supabase-migration-contribution-events.sql` (und ergänze in `supabase-schema.sql`):

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

create index idx_contribution_events_user_id on public.contribution_events(user_id);
create index idx_contribution_events_module_id on public.contribution_events(module_id);

alter table public.contribution_events enable row level security;

create policy "users_read_own_events"
on public.contribution_events for select
to authenticated
using (user_id = auth.uid());

create policy "users_insert_own_events"
on public.contribution_events for insert
to authenticated
with check (user_id = auth.uid());

-- Anon-Insert für User die noch nicht eingeloggt sind
create policy "anon_insert_events"
on public.contribution_events for insert
to anon
with check (true);
```

### Task 2.2 — Contribution Event Service

Erstelle `src/services/contribution-events.ts`:

```typescript
import { supabase } from '@/src/lib/supabase';
import type { ContributionEvent } from '@/src/lib/lme/types';

/**
 * Speichere ein ContributionEvent in Supabase.
 * Fire-and-forget Pattern (wie bestehende Supabase-Calls in der App).
 */
export async function saveContributionEvent(
  event: ContributionEvent,
  userId?: string,
): Promise<void> {
  try {
    const { error } = await supabase
      .from('contribution_events')
      .insert({
        user_id: userId ?? null,
        event_id: event.eventId,
        module_id: event.source.moduleId,
        occurred_at: event.occurredAt,
        payload: event.payload,
      });

    if (error) {
      console.warn('Failed to save contribution event:', error.message);
    }
  } catch (err) {
    console.warn('Contribution event save failed:', err);
  }
}

/**
 * Lade alle Events eines Users.
 * Gibt sie als ContributionEvent[] zurück, rekonstruiert aus der DB.
 */
export async function loadUserEvents(userId: string): Promise<ContributionEvent[]> {
  try {
    const { data, error } = await supabase
      .from('contribution_events')
      .select('*')
      .eq('user_id', userId)
      .order('occurred_at', { ascending: true });

    if (error || !data) return [];

    return data.map(row => ({
      specVersion: 'sp.contribution.v1' as const,
      eventId: row.event_id,
      occurredAt: row.occurred_at,
      userRef: row.user_id,
      source: {
        vertical: 'quiz' as const,
        moduleId: row.module_id,
      },
      payload: row.payload,
    }));
  } catch {
    return [];
  }
}
```

### Task 2.3 — Quiz→ContributionEvent Mapper

Erstelle `src/lib/fusion-ring/quiz-to-event.ts`.

Jeder Quiz-Typ braucht einen Mapper der die Quiz-internen Scores in semantische Marker mit `marker.domain.keyword` Format übersetzt.

```typescript
import type { ContributionEvent, Marker, Tag } from '@/src/lib/lme/types';

// ═══════════════════════════════════════════════════════════════
// LOVE LANGUAGES
// ═══════════════════════════════════════════════════════════════

const LOVE_LANG_MARKERS: Record<string, string> = {
  touch:   'marker.love.physical_touch',
  words:   'marker.love.expression',
  time:    'marker.love.togetherness',
  gifts:   'marker.love.sensory_connection',
  service: 'marker.love.protective',
};

export function loveLangToEvent(
  scores: Record<string, number>,
  profileId: string,
): ContributionEvent {
  const maxScore = Math.max(...Object.values(scores), 1);
  const markers: Marker[] = [];

  for (const [dim, markerId] of Object.entries(LOVE_LANG_MARKERS)) {
    if (scores[dim] != null && scores[dim] > 0) {
      markers.push({
        id: markerId,
        weight: Math.min(scores[dim] / maxScore, 1),
        evidence: { confidence: 0.7, itemsAnswered: 12 },
      });
    }
  }

  // Sekundäre Marker: Intensität / Leidenschaft
  if (scores.touch > maxScore * 0.7) {
    markers.push({
      id: 'marker.love.passionate',
      weight: scores.touch / maxScore * 0.8,
      evidence: { confidence: 0.6 },
    });
  }

  return buildEvent('quiz.love_languages.v1', markers, [
    { id: `tag.archetype.${profileId}`, label: profileId, kind: 'archetype', weight: 0.8 },
  ]);
}

// ═══════════════════════════════════════════════════════════════
// KRAFTTIER
// ═══════════════════════════════════════════════════════════════

const KRAFTTIER_MARKERS: Record<string, Marker[]> = {
  wolf: [
    { id: 'marker.social.pack_loyalty',       weight: 0.82, evidence: { confidence: 0.75 } },
    { id: 'marker.instinct.primal_sense',     weight: 0.75, evidence: { confidence: 0.75 } },
    { id: 'marker.leadership.servant_leader', weight: 0.68, evidence: { confidence: 0.75 } },
  ],
  eagle: [
    { id: 'marker.cognition.analytical',      weight: 0.85, evidence: { confidence: 0.75 } },
    { id: 'marker.freedom.independence',      weight: 0.80, evidence: { confidence: 0.75 } },
    { id: 'marker.leadership.charisma',       weight: 0.60, evidence: { confidence: 0.75 } },
  ],
  bear: [
    { id: 'marker.instinct.primal_sense',     weight: 0.80, evidence: { confidence: 0.75 } },
    { id: 'marker.love.protective',           weight: 0.85, evidence: { confidence: 0.75 } },
    { id: 'marker.emotion.body_awareness',    weight: 0.70, evidence: { confidence: 0.75 } },
  ],
  fox: [
    { id: 'marker.cognition.analytical',      weight: 0.80, evidence: { confidence: 0.75 } },
    { id: 'marker.social.diplomacy',          weight: 0.75, evidence: { confidence: 0.75 } },
    { id: 'marker.instinct.gut_feeling',      weight: 0.70, evidence: { confidence: 0.75 } },
  ],
  // Weitere Tiere ergänzen basierend auf Quiz-JSON
};

export function krafttierToEvent(animalId: string): ContributionEvent {
  const key = animalId.toLowerCase();
  const markers = KRAFTTIER_MARKERS[key] ?? [];
  const tag: Tag = { id: `tag.archetype.${key}`, label: animalId, kind: 'archetype', weight: 0.9 };
  return buildEvent('quiz.krafttier.v1', markers, [tag]);
}

// ═══════════════════════════════════════════════════════════════
// PERSONALITY (Big Five basiert)
// ═══════════════════════════════════════════════════════════════

const PERSONALITY_MARKERS: Record<string, string> = {
  openness:          'marker.social.openness',
  conscientiousness: 'marker.values.achievement',
  extraversion:      'marker.social.extroversion',
  agreeableness:     'marker.eq.empathy',
  neuroticism:       'marker.eq.stress_sensitivity',
};

export function personalityToEvent(
  scores: Record<string, number>,  // 0-100 per dimension
): ContributionEvent {
  const markers: Marker[] = [];

  for (const [dim, markerId] of Object.entries(PERSONALITY_MARKERS)) {
    const score = scores[dim];
    if (score != null) {
      markers.push({
        id: markerId,
        weight: Math.min(score / 100, 1),
        evidence: { confidence: 0.8, itemsAnswered: 20 },
      });
    }
  }

  return buildEvent('quiz.personality.v1', markers, []);
}

// ═══════════════════════════════════════════════════════════════
// EQ (Emotionale Intelligenz)
// ═══════════════════════════════════════════════════════════════

const EQ_MARKERS: Record<string, string> = {
  self_awareness:  'marker.eq.self_awareness',
  self_regulation: 'marker.eq.self_regulation',
  motivation:      'marker.eq.motivation',
  empathy:         'marker.eq.empathy',
  social_skill:    'marker.eq.social_skill',
};

export function eqToEvent(scores: Record<string, number>): ContributionEvent {
  const maxScore = Math.max(...Object.values(scores), 1);
  const markers: Marker[] = [];

  for (const [dim, markerId] of Object.entries(EQ_MARKERS)) {
    if (scores[dim] != null) {
      markers.push({
        id: markerId,
        weight: Math.min(scores[dim] / maxScore, 1),
        evidence: { confidence: 0.75, itemsAnswered: 15 },
      });
    }
  }

  return buildEvent('quiz.eq.v1', markers, []);
}

// ═══════════════════════════════════════════════════════════════
// AURA COLORS
// ═══════════════════════════════════════════════════════════════

export function auraToEvent(
  primaryAura: string,
  scores: Record<string, number>,
): ContributionEvent {
  const AURA_MARKERS: Record<string, string> = {
    warmth:    'marker.aura.warmth',
    mystery:   'marker.aura.mystery',
    authority: 'marker.aura.authority',
  };
  const maxScore = Math.max(...Object.values(scores), 1);
  const markers: Marker[] = Object.entries(AURA_MARKERS)
    .filter(([dim]) => scores[dim] != null)
    .map(([dim, id]) => ({
      id,
      weight: Math.min((scores[dim] ?? 0) / maxScore, 1),
      evidence: { confidence: 0.6, itemsAnswered: 10 },
    }));

  return buildEvent('quiz.aura.v1', markers, [
    { id: `tag.style.${primaryAura}`, label: primaryAura, kind: 'style', weight: 0.7 },
  ]);
}

// ═══════════════════════════════════════════════════════════════
// SOCIAL ROLE
// ═══════════════════════════════════════════════════════════════

export function socialRoleToEvent(
  roleId: string,
  scores: Record<string, number>,
): ContributionEvent {
  const SOCIAL_MARKERS: Record<string, string> = {
    dominance:   'marker.social.dominance',
    openness:    'marker.social.openness',
    extroversion:'marker.social.extroversion',
  };
  const maxScore = Math.max(...Object.values(scores), 1);
  const markers: Marker[] = Object.entries(SOCIAL_MARKERS)
    .filter(([dim]) => scores[dim] != null)
    .map(([dim, id]) => ({
      id,
      weight: Math.min((scores[dim] ?? 0) / maxScore, 1),
      evidence: { confidence: 0.7, itemsAnswered: 12 },
    }));

  return buildEvent('quiz.social_role.v1', markers, [
    { id: `tag.archetype.${roleId}`, label: roleId, kind: 'archetype', weight: 0.75 },
  ]);
}

// ═══════════════════════════════════════════════════════════════
// GENERIC BUILDER
// ═══════════════════════════════════════════════════════════════

function buildEvent(
  moduleId: string,
  markers: Marker[],
  tags: Tag[],
): ContributionEvent {
  return {
    specVersion: 'sp.contribution.v1',
    eventId: crypto.randomUUID(),
    occurredAt: new Date().toISOString(),
    source: {
      vertical: 'quiz',
      moduleId,
      locale: 'de-DE',
    },
    payload: {
      markers,
      tags: tags.length > 0 ? tags : undefined,
    },
  };
}
```

### Task 2.4 — Quiz-Komponenten portieren (MVP: 3 Quizzes)

Portiere aus `DYAI2025/QuizzMe/src/components/quizzes/`:

**2.4a — LoveLanguagesQuiz**
- Quelle: `LoveLanguagesQuiz.tsx` + `love-languages-quiz.json`
- Ziel: `src/components/quizzes/LoveLanguagesQuiz.tsx`

**2.4b — KrafttierQuiz**
- Quelle: `KrafttierQuiz.tsx` + `krafttier/` Unterverzeichnis
- Ziel: `src/components/quizzes/KrafttierQuiz.tsx`

**2.4c — PersonalityQuiz**
- Quelle: `PersonalityQuiz.tsx`
- Ziel: `src/components/quizzes/PersonalityQuiz.tsx`

**Portierungsregeln (für ALLE Quizzes):**

1. **Entferne** `'use client'` Direktiven
2. **Entferne** alle Next.js Imports (`next/link`, `next/navigation`, `next/image`)
3. **Entferne** `useClusterProgress` Referenzen und alles was `CLUSTER_ID` nutzt
4. **Passe Pfade an:** `@/src/...` statt `@/lib/...` oder `../../lib/...`
5. **Füge onComplete Callback hinzu:** Jedes Quiz bekommt ein Prop `onComplete: (event: ContributionEvent) => void`
6. **Rufe den passenden Mapper auf** (aus Task 2.3) wenn der User das Quiz abschließt
7. **Styling:** Ersetze QuizzMe CSS-Klassen durch Astro-Noctum Palette:
   - Hintergrund: `bg-[#00050A]` oder `bg-obsidian`
   - Akzente: `text-[#D4AF37]` oder `text-gold`
   - Cards: `glass-card` Klasse nutzen
   - Buttons: Gold auf Obsidian
8. **Kopiere JSON-Configs** unverändert (Fragen/Optionen/Profiles bleiben gleich)

**Beispiel-Änderung am Quiz-Ende:**

```typescript
// QuizzMe (ALT):
const handleFinish = () => {
  const profile = getProfile(scores);
  setResult(profile);
  setStage('result');
  completeQuiz(QUIZ_ID);  // ← entfernen
};

// Astro-Noctum (NEU):
interface LoveLanguagesQuizProps {
  onComplete: (event: ContributionEvent) => void;
  onClose: () => void;
}

const handleFinish = () => {
  const profile = getProfile(scores);
  setResult(profile);
  setStage('result');
  // Emit ContributionEvent
  const event = loveLangToEvent(scores, profile.id);
  onComplete(event);
};
```

### Task 2.5 — useFusionRing Hook

Erstelle `src/hooks/useFusionRing.ts`:

```typescript
import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ContributionEvent } from '@/src/lib/lme/types';
import type { ApiResults } from '@/src/services/api';
import type { FusionRingSignal } from '@/src/lib/fusion-ring';
import {
  westernToSectors,
  baziToSectors,
  wuxingToSectors,
  fuseAllEvents,
  computeFusionSignal,
} from '@/src/lib/fusion-ring';
import { saveContributionEvent, loadUserEvents } from '@/src/services/contribution-events';

const TOTAL_QUIZZES = 6;  // MVP: Love, Krafttier, Personality, EQ, Aura, Social

export function useFusionRing(apiResults: ApiResults | null, userId?: string) {
  const [events, setEvents] = useState<ContributionEvent[]>([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);

  // Events aus Supabase laden (einmalig bei Mount)
  useEffect(() => {
    if (!userId || eventsLoaded) return;
    loadUserEvents(userId).then(loaded => {
      setEvents(loaded);
      setEventsLoaded(true);
    });
  }, [userId, eventsLoaded]);

  // W(s) aus BAFE Western-Daten
  const W = useMemo(() => {
    if (!apiResults?.western) return new Array(12).fill(0);
    return westernToSectors(
      apiResults.western.zodiac_sign,
      apiResults.western.moon_sign,
      apiResults.western.ascendant_sign,
    );
  }, [apiResults?.western]);

  // B(s) aus BAFE BaZi-Daten
  const B = useMemo(() => {
    if (!apiResults?.bazi?.pillars) return new Array(12).fill(0);
    const p = apiResults.bazi.pillars;
    return baziToSectors({
      day: p.day?.animal,
      year: p.year?.animal,
      month: p.month?.animal,
      hour: p.hour?.animal,
    });
  }, [apiResults?.bazi]);

  // X(s) aus BAFE Wu-Xing-Daten
  const X = useMemo(() => {
    if (!apiResults?.wuxing?.elements) return new Array(12).fill(0);
    return wuxingToSectors(apiResults.wuxing.elements);
  }, [apiResults?.wuxing]);

  // T(s) aus Quiz-Events
  const T = useMemo(() => fuseAllEvents(events), [events]);

  // Finale Signal-Komposition
  const signal: FusionRingSignal | null = useMemo(() => {
    // Brauchen mindestens W oder B
    if (!apiResults) return null;
    const completedQuizzes = new Set(events.map(e => e.source.moduleId)).size;
    return computeFusionSignal(W, B, X, T, completedQuizzes, TOTAL_QUIZZES);
  }, [W, B, X, T, apiResults, events]);

  // Quiz-Completion Handler
  const addQuizResult = useCallback((event: ContributionEvent) => {
    // Duplikat-Check: selbes moduleId nicht doppelt
    setEvents(prev => {
      const existing = prev.find(e => e.source.moduleId === event.source.moduleId);
      if (existing) {
        // Überschreibe vorheriges Ergebnis
        return prev.map(e => e.source.moduleId === event.source.moduleId ? event : e);
      }
      return [...prev, event];
    });
    saveContributionEvent(event, userId);
  }, [userId]);

  // Abgeschlossene Quiz-Module
  const completedModules = useMemo(
    () => new Set(events.map(e => e.source.moduleId)),
    [events],
  );

  return {
    signal,
    events,
    addQuizResult,
    completedModules,
    eventsLoaded,
  };
}
```

### Task 2.6 — Quiz-Overlay Infrastruktur

Erstelle `src/components/QuizOverlay.tsx`:

Ein Modal/Overlay-Container der ein Quiz rendert und sich über das Dashboard legt.

```typescript
interface QuizOverlayProps {
  quizId: string | null;  // null = geschlossen
  onComplete: (event: ContributionEvent) => void;
  onClose: () => void;
}
```

- Rendert das passende Quiz basierend auf `quizId`
- Overlay mit dunklem Backdrop, `z-50`
- Escape-Key und Backdrop-Click schließen
- Animierter Einstieg/Ausstieg (opacity transition)

### Task 2.7 — Dashboard-Integration: Quiz-Bereich

Erweitere `src/components/Dashboard.tsx`:

**Neuer Bereich** unterhalb der Interpretation, oberhalb des ElevenLabs Widgets:

- Überschrift: "Deine Persönlichkeits-Tests" (Cormorant Garamond)
- Grid mit Quiz-Cards (2 Spalten mobile, 3 Desktop)
- Jede Card zeigt: Icon, Titel, Status-Badge (offen / abgeschlossen ✓)
- Klick auf offene Card → setzt `activeQuiz` State → QuizOverlay öffnet

```typescript
// Neuer State in Dashboard (oder in App.tsx, je nach bestehender Architektur):
const [activeQuiz, setActiveQuiz] = useState<string | null>(null);

// Quiz-Cards:
const QUIZ_CATALOG = [
  { id: 'love_languages', title: 'Liebessprache', moduleId: 'quiz.love_languages.v1', icon: '🔥' },
  { id: 'krafttier',      title: 'Krafttier',     moduleId: 'quiz.krafttier.v1',      icon: '🐺' },
  { id: 'personality',    title: 'Persönlichkeit', moduleId: 'quiz.personality.v1',     icon: '🎭' },
];
```

### Task 2.8 — Integration in App.tsx

Minimale Änderungen an `src/App.tsx`:

1. Importiere und instanziiere `useFusionRing`:
```typescript
const { signal, addQuizResult, completedModules } = useFusionRing(apiResults, user?.id);
```

2. Übergib `signal`, `addQuizResult`, `completedModules` als Props an Dashboard.

3. Dashboard reicht `addQuizResult` an QuizOverlay weiter.

**WICHTIG:** Die bestehende Datenfluss-Logik (calculateAll → Gemini → Dashboard) darf NICHT verändert werden. Der Fusion Ring Hook läuft parallel dazu.

---

## Dateistruktur (Ergebnis dieses Pakets)

```
src/
├── lib/
│   └── fusion-ring/
│       └── quiz-to-event.ts            ← Quiz→ContributionEvent Mapper
├── services/
│   └── contribution-events.ts          ← Supabase CRUD für Events
├── hooks/
│   └── useFusionRing.ts                ← Orchestration Hook
├── components/
│   ├── QuizOverlay.tsx                 ← Modal-Container
│   ├── quizzes/
│   │   ├── LoveLanguagesQuiz.tsx       ← Portiert
│   │   ├── KrafttierQuiz.tsx           ← Portiert
│   │   ├── PersonalityQuiz.tsx         ← Portiert
│   │   ├── love-languages-quiz.json    ← Kopiert
│   │   └── krafttier/                  ← Kopiert
supabase-migration-contribution-events.sql
```

---

## Akzeptanzkriterien

1. `npm run lint` fehlerfrei
2. Love Languages Quiz: Alle Fragen durchklickbar → Ergebnis-Screen → ContributionEvent wird in Supabase gespeichert
3. Krafttier Quiz: Ergebnis → Wolf-Event erzeugt Marker `marker.social.pack_loyalty` etc.
4. `useFusionRing` Hook: Liefert korrektes `FusionRingSignal` wenn sowohl BAFE-Daten als auch Quiz-Events vorhanden
5. Events werden beim Page-Reload aus Supabase wiederhergestellt
6. Quiz-Duplikat: Selbes Quiz zweimal absolvieren → erstes Event wird überschrieben, nicht dupliziert
7. **Ohne Quizzes:** Hook liefert Signal nur aus W+B+X (Gewichte 0.375/0.375/0.25/0.0)
8. **Bestehende App-Funktionalität** (BAFE, Gemini, 3D Orrery, Auth, ElevenLabs) bleibt vollständig intakt

---

## Nicht im Scope

- Keine Fusion Ring Visualisierung (das ist Paket 3)
- Keine weiteren Quizzes über die 3 MVP hinaus (können später identisch portiert werden)
- Keine Echtzeit-Synchronisation
- Kein Quiz-Design-Overhaul (bestehende Layouts werden portiert, nur Farben angepasst)
