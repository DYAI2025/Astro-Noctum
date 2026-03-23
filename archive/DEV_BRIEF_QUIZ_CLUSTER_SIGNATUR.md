# Dev Brief: Quiz-Cluster auf der Signatur-Seite

**Repo:** `DYAI2025/Astro-Noctum`
**Branch:** `feature/onboarding-signatur-daily` oder neuer Branch
**Seite:** `/signatur` (`src/pages/FuRingPage.tsx`)

---

## Vision (Ben's Screenshot)

Links neben der Signatur: **Glasmorphe Cluster-Panels** — halbtransparente, farbig leuchtende Buttons. Jeder Cluster (Kinky, Blumen, Naturkind, Mentalist, Stratege, Mystiker) ist ein Panel mit seinen 4 Quiz-Slots. Fertige Quizzes leuchten, offene sind ausgegraut. Wenn ein kompletter Cluster fertig ist, fließt seine akkumulierte Energie über eine **leuchtende Pipeline** in die Signatur.

---

## Was schon existiert (NICHT neu bauen)

| Datei | Was es tut |
|-------|-----------|
| `src/lib/fusion-ring/clusters.ts` | 6 Cluster-Definitionen mit `quizModuleIds[]`, `color`, `icon`. Funktionen: `isClusterComplete()`, `clusterProgress()`, `findClusterForModule()` |
| `src/components/ClusterCard.tsx` | Cluster-Karte mit Progress, Quiz-Buttons, Lock-Icon. Hat `MODULE_TO_QUIZ_ID` Mapping |
| `src/components/QuizOverlay.tsx` | Modal-Overlay mit Lazy-loaded Quiz-Komponenten. `QUIZ_MAP` für alle 22 Quizzes. Nimmt `quizId`, `onComplete`, `onClose` |
| `src/hooks/useQuizContribution.ts` | Konvertiert `ContributionEvent` → Sektor-Weights → prüft Cluster-Gate → POST `/api/contribute` (fire-and-forget) |
| `src/lib/fusion-ring/quiz-to-event.ts` | Event-Builder für alle Quiz-Typen (Love Languages, Krafttier, Personality, Aura, EQ, Charme, Career, etc.) |
| `src/services/contribute.ts` | HTTP-Client für `/api/contribute` |
| `server.mjs` Zeile 863-912 | `/api/contribute` Endpoint → Upsert in `contribution_events` |
| `src/components/quizzes/*` | 22 fertige Quiz-Komponenten (14 Regular + 4 Kinky + 4 PartnerMatch) |

**Alles davon ist production-ready. Keine dieser Dateien muss geändert werden.**

---

## Task 1: Cluster-Sidebar auf FuRingPage

**Datei:** `src/pages/FuRingPage.tsx`

**Was:** Links neben dem Ring eine vertikale Cluster-Sidebar einbauen.

**Layout:**
```
┌──────────────────────────────────────────────────┐
│  ← Zurück                              SIGNATUR  │
│                                                   │
│  ┌─────────┐                                      │
│  │ Kinky   │    ┌─────────────────────────────┐   │
│  │ Q1 ✓    │    │                             │   │
│  │ Q2      │    │        SIGNATUR RING        │   │
│  │ Q3      │    │        (Three.js)           │   │
│  │ Q4      │    │                             │   │
│  ├─────────┤    └─────────────────────────────┘   │
│  │ Blumen  │                                      │
│  │ Q1 ✓    │                                      │
│  │ Q2 ✓    │                                      │
│  │ Q3 ✓    │                                      │
│  │ Q4 ✓    │ ═══ PIPELINE → → → RING              │
│  ├─────────┤                                      │
│  │ ...     │                                      │
│  └─────────┘                                      │
└──────────────────────────────────────────────────┘
```

**Styling (aus Screenshot abgeleitet):**
- Glasmorphe Panels: `backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl`
- Cluster-Header: Name + Icon, Cluster-Farbe als Gradient-Akzent
- Quiz-Slots: Pill-Buttons, je ca. 40px hoch
  - **Fertig (✓):** Leuchtend, Cluster-Farbe mit Glow-Effekt, Check-Icon
  - **Offen:** Ausgegraut (`opacity-30`), dunkel gefüllt
  - **Gesperrt (Premium):** Lock-Icon, noch dunkler
- Fertiger Cluster: Gesamtes Panel leuchtet intensiver, Rand-Glow in Cluster-Farbe

**Neue Komponente:** `src/components/signatur/ClusterSidebar.tsx`

```tsx
import { useState, useEffect } from 'react';
import { CLUSTER_REGISTRY, clusterProgress, isClusterComplete } from '@/src/lib/fusion-ring/clusters';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/contexts/AuthContext';
import { usePremium } from '@/src/hooks/usePremium';
import { useLanguage } from '@/src/contexts/LanguageContext';

interface ClusterSidebarProps {
  onStartQuiz: (quizId: string) => void;
  onClusterComplete: (clusterId: string, sectorWeights: number[]) => void;
}
```

**Daten laden:**
- `contribution_events` aus Supabase lesen beim Mount → `completedModuleIds: Set<string>` bauen
- Pro Cluster: `clusterProgress()` berechnen
- Fertige Cluster: `isClusterComplete()` → Glow-Styling + Pipeline-Animation triggern

---

## Task 2: Quiz-Trigger (1x pro Tag, 30% Zufall)

**Datei:** `src/hooks/useQuizSuggestion.ts` (NEU)

**Logik:**
```ts
export function useQuizSuggestion(completedModuleIds: Set<string>) {
  const [suggestedQuiz, setSuggestedQuiz] = useState<string | null>(null);

  useEffect(() => {
    // Prüfe ob heute schon ein Quiz vorgeschlagen wurde
    const today = new Date().toISOString().slice(0, 10);
    const lastSuggestion = localStorage.getItem('bazodiac_quiz_last_suggestion');
    if (lastSuggestion === today) return;

    // 30% Chance
    if (Math.random() > 0.3) return;

    // Finde ein offenes Quiz
    const allModules = CLUSTER_REGISTRY.flatMap(c => c.quizModuleIds);
    const openModules = allModules.filter(id => !completedModuleIds.has(id));
    if (openModules.length === 0) return;

    // Zufällig auswählen
    const pick = openModules[Math.floor(Math.random() * openModules.length)];
    setSuggestedQuiz(pick);
    localStorage.setItem('bazodiac_quiz_last_suggestion', today);
  }, [completedModuleIds]);

  return suggestedQuiz;
}
```

**UI:** Wenn `suggestedQuiz` nicht null ist, wird der entsprechende Quiz-Slot in der Sidebar mit einem sanften Pulse-Effekt hervorgehoben (goldener Rand, `animate-pulse`). Kein Popup, kein Modal — nur der Slot leuchtet einladend auf.

---

## Task 3: Pipeline-Animation (Cluster → Ring)

**Was passiert wenn ein Cluster vollständig ist:**

1. Alle 4 Quizzes im Cluster sind ✓
2. `useQuizContribution` hat bereits den POST zu `/api/contribute` gemacht (fire-and-forget)
3. Auf der Signatur-Seite: **Pipeline-Animation** vom Cluster-Panel zum Ring

**Visuelle Pipeline:**
- SVG-Pfad oder Canvas-Line vom Cluster-Panel-Rand zum Ring-Zentrum
- Leuchtende Partikel wandern entlang des Pfades (Cluster-Farbe)
- Am Ring angekommen: Kurzer Burst-Effekt in Cluster-Farbe
- Ring aktualisiert sich (neuer Transit-State Fetch wird getriggert)

**Neue Komponente:** `src/components/signatur/ClusterPipeline.tsx`

```tsx
interface ClusterPipelineProps {
  clusterId: string;
  clusterColor: string;
  isComplete: boolean;         // true → Animation abspielen
  startRef: React.RefObject<HTMLElement>;  // Cluster-Panel Position
  endRef: React.RefObject<HTMLElement>;    // Ring Container Position
}
```

**Animation-Approach:**
- CSS `@keyframes` für den Partikel-Flow (einfach, performant)
- Oder: Canvas 2D Overlay Layer über der Seite
- Die Animation spielt **einmalig** beim ersten Besuch nach Cluster-Completion
- Danach: Pipeline bleibt als statische leuchtende Linie sichtbar (zeigt „Verbindung aktiv")
- State in `localStorage`: `bazodiac_pipeline_shown_${clusterId}` → einmalig

**Trigger:**
```ts
// In ClusterSidebar oder FuRingPage:
const [justCompleted, setJustCompleted] = useState<string | null>(null);

// Wenn useQuizContribution den POST gemacht hat UND Cluster jetzt complete:
const handleQuizComplete = (event: ContributionEvent) => {
  quizContribution(event);
  const moduleId = event.source?.moduleId;
  if (!moduleId) return;
  const cluster = findClusterForModule(moduleId);
  if (cluster) {
    const updated = new Set(completedModuleIds);
    updated.add(moduleId);
    if (isClusterComplete(cluster, updated)) {
      setJustCompleted(cluster.id);
    }
  }
};
```

---

## Task 4: QuizOverlay einbinden

**Datei:** `src/pages/FuRingPage.tsx`

**Was:** `QuizOverlay` mounten, gesteuert durch Sidebar-Clicks.

```tsx
import { QuizOverlay } from '@/src/components/QuizOverlay';
import { useQuizContribution } from '@/src/hooks/useQuizContribution';

// Im Component:
const [activeQuiz, setActiveQuiz] = useState<string | null>(null);
const [completedModuleIds, setCompletedModuleIds] = useState<Set<string>>(new Set());
const handleQuizComplete = useQuizContribution(completedModuleIds);

// Im JSX:
<QuizOverlay
  quizId={activeQuiz}
  onComplete={(event) => {
    handleQuizComplete(event);
    setActiveQuiz(null);
    // completedModuleIds aktualisieren
    const moduleId = event.source?.moduleId;
    if (moduleId) {
      setCompletedModuleIds(prev => new Set([...prev, moduleId]));
    }
  }}
  onClose={() => setActiveQuiz(null)}
/>
```

**completedModuleIds initial laden:**
```ts
useEffect(() => {
  if (!user) return;
  supabase
    .from('contribution_events')
    .select('module_id')
    .eq('user_id', user.id)
    .then(({ data }) => {
      if (data) setCompletedModuleIds(new Set(data.map(r => r.module_id)));
    });
}, [user]);
```

---

## Task 5: Debug-Panels verstecken

**Datei:** `src/components/fusion-ring-3d/FusionRing3D.tsx`

```diff
- isInteractive = true,
+ isInteractive = false,
```

Oder:
```diff
- isInteractive = true,
+ isInteractive = !!import.meta.env.DEV,
```

Die Effect-Buttons (RESONANZSPRUNG, DOMINANZWECHSEL, etc.) und INGEST/DEMO TRANSIT Panels verschwinden. Im Dev-Modus (`npm run dev`) optional sichtbar.

**V1 Fallback** (`FusionRingWebsiteCanvas.tsx`):
Alle Effect-Buttons (Zeilen 1844-2076) hinter ein `showEffectControls` Prop wrappen, default `false`.

---

## Task 6: Ring nach Cluster-Completion aktualisieren

**Was:** Wenn ein Cluster complete ist und die Pipeline-Animation gelaufen ist, muss der Ring die neuen Daten zeigen.

**Wie:** Nach dem `/api/contribute` POST neu-fetchen:
- `useFusionSignal` pollt bereits `/api/transit-state/:userId` alle 800ms
- Der Transit-State Endpoint (`server.mjs` Zeile ~534) liest `contribution_events` und schickt sie an FuFirE
- FuFirE berechnet `quiz_sectors` → zurück als Teil des Transit-State
- Die Signatur V2 bekommt die Daten über `signatur-bridge.ts` → `quizSectorsToQuizWeights()`

**Also:** Kein zusätzlicher Code nötig. Das Polling übernimmt die Aktualisierung automatisch. Die Pipeline-Animation ist rein visuell — die Daten fließen ohnehin.

**Einziger Fix:** Sicherstellen dass `FusionRing3D` die `quizWeights` auch wirklich an `FusionRingCanvasV2` weiterreicht. Prüfen:
```ts
// FusionRing3D.tsx — muss quizWeights aus signalData extrahieren und an V2 geben
const v2QuizWeights = useMemo(() => {
  if (signalData?.quizSectors) {
    return quizSectorsToQuizWeights(signalData.quizSectors);
  }
  return undefined;
}, [signalData]);

<FusionRingCanvasV2
  natalWeights={v2NatalWeights}
  quizWeights={v2QuizWeights}   // ← das muss drin sein
  showUI={isInteractive}
/>
```

---

## Reihenfolge

```
Task 5 (Debug weg)           → 10 min, sofort sichtbar
Task 4 (QuizOverlay binden)  → 30 min, UI-Grundlage
Task 1 (ClusterSidebar)      → 60-90 min, Haupt-UI
Task 2 (Quiz-Suggestion)     → 20 min, 30%-Trigger
Task 6 (Ring-Update prüfen)  → 15 min, Verdrahtung checken
Task 3 (Pipeline-Animation)  → 60 min, visueller Höhepunkt
```

---

## Neue Dateien

| Datei | Zweck |
|-------|-------|
| `src/components/signatur/ClusterSidebar.tsx` | Glasmorphe Cluster-Panels mit Quiz-Slots |
| `src/components/signatur/ClusterPipeline.tsx` | Leuchtende Pipeline-Animation Cluster→Ring |
| `src/hooks/useQuizSuggestion.ts` | 1x/Tag 30%-Zufalls-Trigger |

## Geänderte Dateien

| Datei | Änderung |
|-------|---------|
| `src/pages/FuRingPage.tsx` | Layout-Umbau: Sidebar + Ring + QuizOverlay + Pipeline |
| `src/components/fusion-ring-3d/FusionRing3D.tsx` | `isInteractive` → `false`, quizWeights weiterreichen |
| `src/components/fusion-ring-website/FusionRingWebsiteCanvas.tsx` | `showEffectControls` Prop |

## Dateien NICHT anfassen

- `clusters.ts` — Definitionen sind komplett
- `ClusterCard.tsx` — kann als Referenz dienen, wird durch ClusterSidebar ersetzt
- `QuizOverlay.tsx` — fertig, nur mounten
- `useQuizContribution.ts` — fertig, nur aufrufen
- `quiz-to-event.ts` — fertig, alle 22 Quizzes gemappt
- `contribute.ts` / `server.mjs /api/contribute` — Backend fertig
- Alle Quiz-Komponenten in `src/components/quizzes/` — fertig

---

## Glasmorph-Styling Referenz (aus Screenshot)

```css
/* Cluster Panel */
.cluster-panel {
  backdrop-filter: blur(12px);
  background: linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px;
  padding: 12px;
  transition: all 0.3s ease;
}

/* Cluster Panel — complete */
.cluster-panel.complete {
  border-color: var(--cluster-color);
  box-shadow: 0 0 24px var(--cluster-color-alpha);
}

/* Quiz Slot — done */
.quiz-slot.done {
  background: linear-gradient(135deg, var(--cluster-color), var(--cluster-color-dark));
  border: 1px solid var(--cluster-color);
  box-shadow: 0 0 12px var(--cluster-color-alpha);
  color: white;
}

/* Quiz Slot — open */
.quiz-slot.open {
  background: rgba(20, 20, 30, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.3);
}

/* Pipeline glow */
.pipeline-active {
  background: linear-gradient(90deg, var(--cluster-color), transparent);
  height: 2px;
  box-shadow: 0 0 8px var(--cluster-color), 0 0 20px var(--cluster-color-alpha);
  animation: pipeline-flow 1.5s ease-in-out;
}
```
