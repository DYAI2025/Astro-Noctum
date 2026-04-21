# Quiz → Signatur Kopplung — Iterativer Sprint-Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
> Zusätzlich: `codemoss-agent-guardrails` (Mikro-Phasen, max. 5 Files/Phase, Re-Read before+after Edit, Verification Gates, HALT-Disziplin).
> Grundsätze: siehe Memory `project_quiz_signatur_grundsaetze.md` — diese 12 Axiome sind Vertragsbasis für jede Phase.

**Goal:** Die Quizze bekommen einen sichtbaren, kumulativen und frequenz-wirksamen Platz in der Signatur — als Verstärker, nicht als neuer Ton. Der User erlebt jedes Quiz als unmittelbare Belohnung, und die Signatur reift über die Zeit in einem ehrlichen Diagnose-Layer.

**Architecture (Zwei-Schichten-Modell):**

- **Schicht 1 — Frequenz-Kalibrierung (fein, strukturell):** jede Quiz-Antwort liefert einen Beitrag zum 12-dimensionalen Sektor-Profil (Tierkreis). Das Profil moduliert die Chladni-Parameter der Signatur. Additiv, immutable.
- **Schicht 2 — Reifungs-Layer (grob, emotional, belohnend):** zwei gekoppelte Effekte aus den Quiz-Antworten — der **Fünf-Elemente-Kranz** (Wu-Xing) als sichtbare Diagnose-Krone um die Signatur, und die **Fibonacci-Maturation** als Materialveredelung (matt → farbig → leuchtend → golden).

**Sprint-Scope-Kontrakt:**

- Dieser Plan detailliert **Sprint 1 vollständig**. Sprints 2–7 sind als Roadmap-Skizze benannt, nicht task-weise ausdetailliert. Das ist bewusst ehrlich: wir finalisieren Details erst, wenn Sprint 1 läuft.
- Jedes "grosse" Thema (Transformations-Animation, echte 3D-Sphäre, Paar-Signatur) bekommt einen eigenen Sprint mit eigenem Plan.

---

## Teil A — Requirements & Architektur

### A.1 Datenmodell

**Antwort-Metadaten (redaktionell, beim Quiz-Authoring):**

Jede Antwort-Option einer Quiz-Frage trägt zwei Vektoren:
```ts
interface QuizAnswerOption {
  id: string;
  text: string;
  elementContrib: Partial<Record<WuXingElement, number>>; // 0..1 pro Element, darf leer sein
  sectorContrib: Partial<Record<ZodiacSector, number>>;   // 0..1 pro Sektor, darf leer sein
}
type WuXingElement = 'holz' | 'feuer' | 'erde' | 'metall' | 'wasser';
type ZodiacSector = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
```

Summe der Werte je Vektor muss nicht 1 sein — Gewichte sind relativ, Normalisierung passiert in der Aggregation.

**User-Profil (persistent, Supabase):**

Neue Tabelle `user_quiz_profile`:
```sql
CREATE TABLE user_quiz_profile (
  user_id           UUID PRIMARY KEY REFERENCES auth.users(id),
  element_profile   JSONB NOT NULL DEFAULT '{"holz":0,"feuer":0,"erde":0,"metall":0,"wasser":0}',
  sector_profile    JSONB NOT NULL DEFAULT '[0,0,0,0,0,0,0,0,0,0,0,0]',
  total_quiz_count  INT NOT NULL DEFAULT 0,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

Neue Tabelle `user_quiz_answers` (Historie — Agenten-Rohstoff):
```sql
CREATE TABLE user_quiz_answers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id),
  quiz_id           TEXT NOT NULL,
  question_id       TEXT NOT NULL,
  answer_option_id  TEXT NOT NULL,
  element_contrib   JSONB NOT NULL,
  sector_contrib    JSONB NOT NULL,
  answered_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_user_quiz_answers_user_time ON user_quiz_answers(user_id, answered_at DESC);
```

Historie ist **append-only** (RLS: INSERT + SELECT für owner; kein UPDATE/DELETE). Das ist die Agenten-Goldmine für spätere Sprints.

### A.2 Fünf-Elemente-Kranz — Design

**Visuelle Anatomie:** ein 5-segmentiger Ring um die Signatur, jedes Segment deckt 72° ab. Reihenfolge folgt dem Wu-Xing-Erzeugungszyklus: Holz → Feuer → Erde → Metall → Wasser (im Uhrzeigersinn, beginnend oben).

**Element-Farbpalette (Startvorschlag — Ben reibt):**
- Holz: Smaragd-Grün `#10B981`
- Feuer: Rubin-Rot `#EF4444`
- Erde: Ocker-Gold `#CA8A04`
- Metall: Platin-Silber `#CBD5E1`
- Wasser: Saphir-Blau `#3B82F6`

**Fibonacci-Reife-Schwellen pro Segment** (Score-Wert aus `element_profile[element]`):

| Stufe | Fib | Visueller Zustand |
|---|---|---|
| 0 | 0 | Leerer Rahmen, 15% Opacity, keine Füllung |
| 1 | 1 | Erste Farb-Andeutung, 30% Opacity |
| 2 | 2 | Füllung bis 25% des Segments |
| 3 | 3 | Füllung bis 50%, Farbe kräftiger |
| 4 | 5 | Volles Segment, Grundfarbe gesättigt |
| 5 | 8 | Leichter Innenglow |
| 6 | 13 | Stärkerer Glow, Animation (sanftes Pulsieren) |
| 7 | 21 | Rand beginnt zu leuchten |
| 8 | 34 | Goldene Schattierung mischt sich ein |
| 9 | 55 | Gold-dominant, warmes Eigenleuchten |
| 10 | 89 | Voll-Gold mit Farb-Akzent |
| 11 | 144 | Animiertes Eigenleuchten mit Partikeln |
| 12 | 233 | Lifetime-Zustand — nicht erreichbar im normalen Spielverlauf, bleibt als "theoretische Vollendung" |

Jedes Segment reift unabhängig. Der Kranz-Score-Score-Summenindex ist **kein eigener Wert** — die Visualisierung ergibt sich aus den fünf Einzelständen.

### A.3 Sektor-Frequenz-Modulation

`sector_profile[12]` wird bei jedem Quiz-Abschluss aktualisiert und fliesst in die Chladni-Parameter der Signatur ein. Konkretes Mapping `sector_profile → chladniParams` ist **Scope von Sprint 2**, nicht Sprint 1 — im ersten Sprint reicht es, dass die Daten fliessen und aggregiert werden, aber die visuelle Frequenz-Wirkung implementieren wir erst danach. Das trennt Datenfluss und Render-Arbeit.

### A.4 Sofort-Effekt (MVP-Variante für Sprint 1)

Nach erfolgreichem Quiz-Abschluss:

1. Routing zurück zur Signatur-Seite mit Flag `?justCompleted=<quizId>`.
2. Das/die betroffenen Kranz-Segmente (die Elemente, zu denen dieses Quiz Beiträge geliefert hat) pulsieren 2 Sekunden sanft auf.
3. Ein kurzes Toast-/Overlay-Element zeigt: "Deine Signatur hat sich bewegt — {Element1}, {Element2}" (ohne Zahlen).
4. Falls ein Segment eine neue Fibonacci-Schwelle erreicht: zusätzliche kurze Aufleuchten-Animation auf genau diesem Segment (3 Sekunden).

**Transformations-Animation (Auflösung → neue Form → Puls)** ist **Scope Sprint 3**, nicht MVP. Sprint 1 liefert nur Pulse auf Kranz-Segmenten. Das ist bewusst inkrementell: erstmal messen, ob der Effekt ankommt, bevor wir in die teurere Partikel-Dispersion gehen.

### A.5 Gate-Mechanik — Entscheidung

Der bestehende Cluster-Gate (`ContributionEvent` feuert erst bei 4-aus-4 im Cluster) **bleibt für die Sektor-Profile-Aggregation**. Das heisst: `sector_profile[12]` wird nur bei Cluster-Abschluss fortgeschrieben.

**Element-Profile hingegen aggregieren sofort pro Einzel-Quiz.** Das entspricht Axiom 4 (Sofort-Effekt) und Bens Entscheidung: Mathematik der Sektor-Frequenz bleibt sauber gegated, Kranz-Reifung belohnt jeden Einzelschritt.

Formal:
- Jedes Quiz → `user_quiz_profile.element_profile` wird sofort addiert.
- Cluster-Abschluss (alle 4 Quizze) → `user_quiz_profile.sector_profile` wird fortgeschrieben.
- Beide Vorgänge sind idempotent (Re-Trigger darf keinen Doppel-Beitrag erzeugen).

---

## Teil B — Sprint 1 (Detaillierter Plan)

**Sprint-1-Ziel:** Der Fünf-Elemente-Kranz lebt. Jedes Quiz wirkt sofort auf das `element_profile`, der Kranz visualisiert den Zustand korrekt, und der Sofort-Effekt feuert beim Quiz-Abschluss. Sektor-Profile und Historie werden korrekt gespeichert, sind aber für die Signatur-Frequenz noch **nicht** wirksam (das ist Sprint 2).

**Sprint-1-NICHT-Scope:** Transformations-Animation, echte 12-Sektor-Chladni-Modulation, Cursor-Ripple, Ton-Modus, Paar-Signatur, Rauszoomen-Fix (Rauszoomen gehört in den Signatur-Varianz-Sprint).

### Phase 0 — Baseline & Research

**Ziel:** Verstehen, wo im Code heute der Quiz-Pfad lebt, wo Signatur gerendert wird, was an DB-Schema schon existiert.

**Step 0.1 — Baseline-Typecheck.**
```bash
cd /Users/benjaminpoersch/Projects/codebase/Bazodiac-WebApp/Astro-Noctum
npx tsc --noEmit
```

**Step 0.2 — Code-Karte erstellen.**
```
Grep -n "ContributionEvent\|scoreQuiz\|quiz_sectors\|AFFINITY_MAP" src/
Grep -n "SignatureSphere3D\|SignaturRenderer\|ChladniPlate" src/
```
Ergebnis als Kommentar im Task-Tracker festhalten (welche Dateien sind "Single Source of Truth" für Quiz-Scoring, Contribution, und Signatur-Render).

**Step 0.3 — Memory-Sync.**
Memory-File `project_quiz_signatur_grundsaetze.md` re-lesen. Sicherstellen, dass alle 12 Axiome im Kopf sind bevor Code-Arbeit beginnt.

**Step 0.4 — Branch.**
```bash
git checkout -b 2026-04-20-quiz-signatur-sprint-1
git commit --allow-empty -m "chore: start quiz-signatur sprint 1"
```

**Verification:** Typecheck grün, Code-Karte existiert, Memory gelesen.
**HALT:** keine — reine Research, kein User-Review nötig.

---

### Phase 1 — Types & Schemas

**Ziel:** Die Antwort-Metadaten-Struktur + Profil-Aggregat-Typen als TypeScript-Definitionen einführen, ohne Supabase-Migration (Schema-Migration in Phase 2).

**Files (<=3):**
- Create: `src/lib/quiz/types.ts`
- Create: `src/lib/quiz/__tests__/types.test.ts`
- Modify: `src/lib/quiz/index.ts` (Re-Export)

**Step 1.1 — Failing Test.**
```ts
// src/lib/quiz/__tests__/types.test.ts
import { describe, it, expect } from 'vitest';
import type { QuizAnswerOption, WuXingElement, ZodiacSector } from '../types';
import { isValidElementContrib, isValidSectorContrib } from '../types';

describe('Quiz Answer Types', () => {
  it('accepts a well-formed answer option', () => {
    const opt: QuizAnswerOption = {
      id: 'q1_a1',
      text: 'test',
      elementContrib: { feuer: 0.7, erde: 0.3 },
      sectorContrib: { 5: 0.5 },
    };
    expect(isValidElementContrib(opt.elementContrib)).toBe(true);
    expect(isValidSectorContrib(opt.sectorContrib)).toBe(true);
  });
  it('rejects element weight >1 or <0', () => {
    expect(isValidElementContrib({ feuer: 1.5 })).toBe(false);
    expect(isValidElementContrib({ feuer: -0.1 })).toBe(false);
  });
  it('rejects invalid sector keys', () => {
    expect(isValidSectorContrib({ 13: 0.5 } as any)).toBe(false);
  });
});
```

Run: `npx vitest run src/lib/quiz/__tests__/types.test.ts` → FAIL (types.ts existiert nicht).

**Step 1.2 — Implementierung.**
```ts
// src/lib/quiz/types.ts
export type WuXingElement = 'holz' | 'feuer' | 'erde' | 'metall' | 'wasser';
export type ZodiacSector = 1|2|3|4|5|6|7|8|9|10|11|12;

export interface QuizAnswerOption {
  id: string;
  text: string;
  elementContrib: Partial<Record<WuXingElement, number>>;
  sectorContrib: Partial<Record<ZodiacSector, number>>;
}

export interface UserQuizProfile {
  userId: string;
  elementProfile: Record<WuXingElement, number>;
  sectorProfile: Record<ZodiacSector, number>;
  totalQuizCount: number;
  updatedAt: string;
}

const ELEMENTS: WuXingElement[] = ['holz','feuer','erde','metall','wasser'];

export function isValidElementContrib(c: unknown): c is Partial<Record<WuXingElement, number>> {
  if (typeof c !== 'object' || c === null) return false;
  return Object.entries(c).every(([k, v]) =>
    ELEMENTS.includes(k as WuXingElement) && typeof v === 'number' && v >= 0 && v <= 1,
  );
}
export function isValidSectorContrib(c: unknown): c is Partial<Record<ZodiacSector, number>> {
  if (typeof c !== 'object' || c === null) return false;
  return Object.entries(c).every(([k, v]) => {
    const n = Number(k);
    return Number.isInteger(n) && n >= 1 && n <= 12 && typeof v === 'number' && v >= 0 && v <= 1;
  });
}
```

**Step 1.3 — Verify.**
```bash
npx vitest run src/lib/quiz/__tests__/types.test.ts
npx tsc --noEmit
```

**Step 1.4 — Commit.**
```bash
git add -A
git commit -m "feat(quiz): type definitions for answer contribs and user profile"
```

**Verification:** typecheck grün, Tests grün.
**HALT:** keine.

---

### Phase 2 — Supabase-Migration

**Ziel:** Neue Tabellen `user_quiz_profile` + `user_quiz_answers` mit RLS-Policies anlegen.

**Files:**
- Create: `supabase/migrations/20260420_user_quiz_profile.sql`

**Step 2.1 — Migration-Datei schreiben.**
```sql
-- 20260420_user_quiz_profile.sql
CREATE TABLE IF NOT EXISTS user_quiz_profile (
  user_id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  element_profile   JSONB NOT NULL DEFAULT '{"holz":0,"feuer":0,"erde":0,"metall":0,"wasser":0}'::jsonb,
  sector_profile    JSONB NOT NULL DEFAULT '[0,0,0,0,0,0,0,0,0,0,0,0]'::jsonb,
  total_quiz_count  INT NOT NULL DEFAULT 0,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_quiz_answers (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id           TEXT NOT NULL,
  question_id       TEXT NOT NULL,
  answer_option_id  TEXT NOT NULL,
  element_contrib   JSONB NOT NULL,
  sector_contrib    JSONB NOT NULL,
  answered_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_quiz_answers_user_time
  ON user_quiz_answers(user_id, answered_at DESC);

ALTER TABLE user_quiz_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_quiz_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_quiz_profile_own_read ON user_quiz_profile
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY user_quiz_profile_own_write ON user_quiz_profile
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY user_quiz_profile_own_update ON user_quiz_profile
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY user_quiz_answers_own_read ON user_quiz_answers
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY user_quiz_answers_own_insert ON user_quiz_answers
  FOR INSERT WITH CHECK (user_id = auth.uid());
-- kein UPDATE, kein DELETE — answer_history ist append-only (Axiom 1)
```

**Step 2.2 — Lokal anwenden.**
```bash
npx supabase db reset   # oder: npx supabase migration up
```

**Step 2.3 — TypeScript-Types regenerieren.**
```bash
npx supabase gen types typescript --local > src/lib/supabase/database.types.ts
```

**Step 2.4 — Smoke-Test.**
```bash
psql <local-db> -c "SELECT * FROM user_quiz_profile LIMIT 1;"
psql <local-db> -c "SELECT * FROM user_quiz_answers LIMIT 1;"
```
Erwartung: leere Result-Sets, kein Fehler.

**Step 2.5 — Commit.**
```bash
git add -A
git commit -m "feat(db): user_quiz_profile + user_quiz_answers tables with RLS"
```

**Verification:** Migration grün, Types regeneriert, Queries laufen.
**HALT:** kurzer Check mit Ben: "Migration ist lokal drauf. Soll ich sie auf Staging deployen, oder erst Phasen 3-5 durchziehen und alles zusammen promoten?"

---

### Phase 3 — Aggregations-Logik

**Ziel:** Eine reine Funktion `aggregateQuizContribution(profile, answers, gate) → newProfile`, die deterministisch aus bestehendem Profil + eingegangenen Antworten das neue Profil errechnet. Keine DB-Anbindung in dieser Phase — reine Logik, voll testbar.

**Files:**
- Create: `src/lib/quiz/aggregate.ts`
- Create: `src/lib/quiz/__tests__/aggregate.test.ts`

**Step 3.1 — Failing Tests (vor Impl).**
```ts
// aggregate.test.ts
import { aggregateQuizContribution } from '../aggregate';

const empty = {
  elementProfile: { holz:0, feuer:0, erde:0, metall:0, wasser:0 },
  sectorProfile: { 1:0,2:0,3:0,4:0,5:0,6:0,7:0,8:0,9:0,10:0,11:0,12:0 },
  totalQuizCount: 0,
};

describe('aggregateQuizContribution', () => {
  it('adds element contributions to element_profile', () => {
    const result = aggregateQuizContribution(empty, [{
      elementContrib: { feuer: 0.7 },
      sectorContrib: {},
    }], { clusterComplete: false });
    expect(result.elementProfile.feuer).toBeCloseTo(0.7);
  });
  it('gates sector contributions until clusterComplete=true', () => {
    const notGated = aggregateQuizContribution(empty, [{
      elementContrib: {},
      sectorContrib: { 5: 0.3 },
    }], { clusterComplete: false });
    expect(notGated.sectorProfile[5]).toBe(0);
    const gated = aggregateQuizContribution(empty, [{
      elementContrib: {},
      sectorContrib: { 5: 0.3 },
    }], { clusterComplete: true });
    expect(gated.sectorProfile[5]).toBeCloseTo(0.3);
  });
  it('increments totalQuizCount by 1 per call', () => {
    const r = aggregateQuizContribution(empty, [{ elementContrib: {}, sectorContrib: {} }], { clusterComplete: false });
    expect(r.totalQuizCount).toBe(1);
  });
  it('is pure — input profile is not mutated', () => {
    const snapshot = JSON.parse(JSON.stringify(empty));
    aggregateQuizContribution(empty, [{ elementContrib: { feuer: 0.5 }, sectorContrib: {} }], { clusterComplete: false });
    expect(empty).toEqual(snapshot);
  });
});
```
Run → FAIL.

**Step 3.2 — Implementierung.**
```ts
// src/lib/quiz/aggregate.ts
import type { UserQuizProfile, WuXingElement, ZodiacSector } from './types';

interface IncomingAnswer {
  elementContrib: Partial<Record<WuXingElement, number>>;
  sectorContrib: Partial<Record<ZodiacSector, number>>;
}
interface AggregateOptions {
  clusterComplete: boolean;
}

export function aggregateQuizContribution(
  current: Omit<UserQuizProfile, 'userId' | 'updatedAt'>,
  answers: IncomingAnswer[],
  opts: AggregateOptions,
) {
  const elementProfile = { ...current.elementProfile };
  const sectorProfile = { ...current.sectorProfile };

  for (const a of answers) {
    for (const [k, v] of Object.entries(a.elementContrib)) {
      elementProfile[k as WuXingElement] = (elementProfile[k as WuXingElement] ?? 0) + (v ?? 0);
    }
    if (opts.clusterComplete) {
      for (const [k, v] of Object.entries(a.sectorContrib)) {
        const key = Number(k) as ZodiacSector;
        sectorProfile[key] = (sectorProfile[key] ?? 0) + (v ?? 0);
      }
    }
  }

  return {
    elementProfile,
    sectorProfile,
    totalQuizCount: current.totalQuizCount + 1,
  };
}
```

**Step 3.3 — Verify.**
```bash
npx vitest run src/lib/quiz/__tests__/aggregate.test.ts
npx tsc --noEmit
```

**Step 3.4 — Edge-Case-Tests ergänzen.**
- Mehrere Antworten in einem Call (Aggregat)
- Leerer elementContrib / sectorContrib
- Idempotenz-Testfall (expliziter Test: Re-Run mit gleichem answerSet darf NICHT doppelt addieren — dieser Test wird FAILEN, weil Idempotenz erst in Phase 4 via DB-Constraint sichergestellt wird; Test markieren als `.skip` mit Kommentar "idempotency enforced at DB layer — see Phase 4").

**Step 3.5 — Commit.**
```bash
git commit -am "feat(quiz): pure aggregation logic with gate handling"
```

**Verification:** alle Tests grün, Funktion ist pure (getestet).
**HALT:** keine.

---

### Phase 4 — Persistenz-Layer

**Ziel:** Beim Quiz-Abschluss schreibt der Server (a) die Antworten in `user_quiz_answers`, (b) das neue Profil in `user_quiz_profile` (Upsert). Idempotent gegenüber Mehrfach-Submission.

**Files (<=4):**
- Create: `src/server/quiz/persistQuizResult.ts`
- Create: `src/server/quiz/__tests__/persistQuizResult.test.ts` (Integration-Test gegen lokale Supabase)
- Modify: existierender Quiz-Submit-Handler (exakten Pfad in Phase 0 Code-Karte finden — erwartbar `src/pages/api/quiz/submit.ts` o.ä.)

**Step 4.1 — Idempotenz-Strategie festlegen.**
Per-Session-Hash: `session_id = hash(user_id + quiz_id + timestamp_bucket_15min)`. Duplikate im `user_quiz_answers` via `UNIQUE(user_id, quiz_id, question_id, answer_option_id)` constraint abfangen — beim Re-Submit wird der Insert still ignoriert (`ON CONFLICT DO NOTHING`), und der Profil-Upsert wird nicht angefasst.

Dazu Phase-2-Migration ergänzen (kleines Nach-Migration-File, da die erste schon committed ist):
```sql
-- 20260420_user_quiz_answers_unique.sql
ALTER TABLE user_quiz_answers
  ADD CONSTRAINT user_quiz_answers_unique_submission
  UNIQUE (user_id, quiz_id, question_id, answer_option_id);
```

**Step 4.2 — Failing Integration-Test.**
```ts
it('persists answers and updates element_profile', async () => {
  await persistQuizResult({
    userId: TEST_USER,
    quizId: 'cluster_1_quiz_1',
    answers: [{ questionId: 'q1', answerOptionId: 'q1_a1', elementContrib: { feuer: 0.5 }, sectorContrib: {} }],
    clusterComplete: false,
  });
  const profile = await getUserQuizProfile(TEST_USER);
  expect(profile.elementProfile.feuer).toBeCloseTo(0.5);
});
it('is idempotent on re-submission', async () => {
  // submit same set twice
  const profileAfter = await getUserQuizProfile(TEST_USER);
  expect(profileAfter.elementProfile.feuer).toBeCloseTo(0.5);  // not 1.0
});
```

**Step 4.3 — Implementierung.**
Persist-Funktion:
```ts
export async function persistQuizResult(input: PersistInput) {
  return supabase.rpc('persist_quiz_result', {
    p_user_id: input.userId,
    p_quiz_id: input.quizId,
    p_answers: input.answers,
    p_cluster_complete: input.clusterComplete,
  });
}
```
Supabase-RPC-Funktion in SQL-Migration ergänzen — eine transaktionale Funktion, die Inserts in `user_quiz_answers` und das Upsert in `user_quiz_profile` atomar in einer Transaction macht (Aggregation serverseitig in PL/pgSQL oder TypeScript-Seite mit row-level-lock).

**Step 4.4 — Integration-Tests grün kriegen.**
```bash
npx vitest run src/server/quiz/__tests__/persistQuizResult.test.ts
```

**Step 4.5 — Bestehenden Quiz-Submit-Handler anschliessen.**
Existierender Handler (aus Phase 0 gefunden) → Aufruf von `persistQuizResult` ergänzen, nicht ersetzen. Bestehende Cluster-Gate-Logik bleibt, wir fügen nur den neuen Pfad hinzu.

**Step 4.6 — Commit.**
```bash
git commit -am "feat(quiz): persist answers and profile aggregate with idempotency"
```

**Verification:** Tests grün, lokales End-to-End Quiz-Submit schreibt die Tabellen korrekt.
**HALT:** Ben testet einmal manuell ein Quiz einreichen und in Supabase Studio die Zeilen prüfen.

---

### Phase 5 — Redaktioneller Backfill (bestehende 6 Cluster)

**Ziel:** Jede existierende Quiz-Antwort-Option der 6 Cluster bekommt retroaktiv `elementContrib` und `sectorContrib`.

**Files:**
- Modify: die Quiz-Content-Dateien (Pfad in Phase 0 aus `Grep "AFFINITY_MAP"` — erwartbar `src/lib/quiz/content/*.ts`)
- Create: `docs/content/quiz-element-sector-mapping.md` (Redaktions-Brief)

**Step 5.1 — Redaktions-Brief schreiben.**
Dokument beschreibt *wie* man eine Antwort-Option mit Element/Sektor annotiert:
- Element: 1-2 dominante Wu-Xing-Energien pro Option, Gewicht-Summe darf >1 sein (Normalisierung in Aggregation), aber typisch 0.3–1.0 pro Element
- Sektor: 1-2 Tierkreis-Häuser, je nach Lebensbereich der Frage
- Beispiele pro Cluster:
  - Naturkind → tendiert zu Holz, Erde, Wasser
  - Mentalist → tendiert zu Metall, Luft-nahe Antworten ggf. zu Holz
  - Stratege → Metall
  - Mystiker → Feuer, Wasser
  - Kinky → Erde, Feuer
  - Partner Match → Wasser, je nach Frage auch Erde
- Richtwert: pro Quiz ~4 Fragen × ~4 Optionen = ~16 Annotations. Bei 6 Clustern × 4 Quizzes = 24 Quizze = ~400 Annotations. Zeitaufwand realistisch: 1-2 Tage redaktionelle Arbeit, nicht von mir sondern von Ben / Content-Team.

**Step 5.2 — Ein Pilot-Cluster durch (zB. Naturkind).**
Alle 4 Quizze, alle Fragen, alle Optionen annotieren. Type-Safety sichert Vollständigkeit.

**Step 5.3 — Test: jede Option hat mindestens ein nicht-leeres Element-Gewicht.**
```ts
// src/lib/quiz/__tests__/content.coverage.test.ts
import { allQuizzes } from '../content';
describe('quiz content coverage', () => {
  for (const q of allQuizzes) {
    for (const question of q.questions) {
      for (const opt of question.options) {
        it(`${q.id} ${question.id} ${opt.id} has non-empty elementContrib`, () => {
          const sum = Object.values(opt.elementContrib).reduce((a, b) => a + (b ?? 0), 0);
          expect(sum).toBeGreaterThan(0);
        });
      }
    }
  }
});
```
Der Test fängt vergessene Annotationen.

**Step 5.4 — HALT für Redaktion.**
Ben oder Content-Team füllt die restlichen 5 Cluster. Kein Code-Fortschritt in dieser Phase über den Pilot hinaus.

**Step 5.5 — Commit (nur nach vollständigem Backfill).**
```bash
git commit -am "content: backfill element and sector mappings for all 6 clusters"
```

**Verification:** content-coverage-test grün für alle 6 Cluster.
**HALT:** Redaktion ist der Bottleneck — offen kommunizieren.

---

### Phase 6 — Kranz-Komponente (isoliert)

**Ziel:** Eine eigenständige React-Komponente `<FuenfElementeKranz>`, die aus einem `elementProfile` das visuelle 5-Segment-Modell rendert. Ohne Einbettung in die Signatur. Testbar in Storybook-Stil.

**Files (<=4):**
- Create: `src/components/signatur/FuenfElementeKranz.tsx`
- Create: `src/components/signatur/__tests__/fuenf-elemente-kranz.test.tsx`
- Create: `src/components/signatur/FuenfElementeKranz.fibonacci.ts` (Schwellen-Map)

**Step 6.1 — Fibonacci-Map.**
```ts
export const FIB_STAGES: { threshold: number; stage: number }[] = [
  { threshold: 0, stage: 0 }, { threshold: 1, stage: 1 },
  { threshold: 2, stage: 2 }, { threshold: 3, stage: 3 },
  { threshold: 5, stage: 4 }, { threshold: 8, stage: 5 },
  { threshold: 13, stage: 6 }, { threshold: 21, stage: 7 },
  { threshold: 34, stage: 8 }, { threshold: 55, stage: 9 },
  { threshold: 89, stage: 10 }, { threshold: 144, stage: 11 },
  { threshold: 233, stage: 12 },
];
export function stageFor(score: number): number {
  let s = 0;
  for (const row of FIB_STAGES) if (score >= row.threshold) s = row.stage;
  return s;
}
```

**Step 6.2 — Failing Tests.**
```tsx
it('renders five segments — one per element', () => {
  render(<FuenfElementeKranz profile={{ holz:0, feuer:0, erde:0, metall:0, wasser:0 }} />);
  expect(screen.getAllByTestId(/kranz-segment-/)).toHaveLength(5);
});
it('applies stage class based on score', () => {
  const { container } = render(<FuenfElementeKranz profile={{ holz:0, feuer:8, erde:0, metall:0, wasser:0 }} />);
  const feuer = container.querySelector('[data-testid="kranz-segment-feuer"]');
  expect(feuer).toHaveAttribute('data-stage', '5');
});
```

**Step 6.3 — SVG-Implementierung.**
Kreis mit 5 Bogensegmenten á 72°, jedes mit Farbe pro Element (aus A.2), Opacity + Glow-Filter je nach Stage. Framer-Motion für Übergangsanimationen zwischen Stages.

**Step 6.4 — Verify.**
```bash
npx vitest run src/components/signatur/__tests__/fuenf-elemente-kranz.test.tsx
```

**Step 6.5 — Dev-Preview-Route.**
Kurze Preview-Seite `src/pages/dev/kranz-preview.tsx`, die drei Profile nebeneinander rendert (leer, teilweise, voll). Ben schaut einmal drauf.

**Step 6.6 — Commit + HALT.**
```bash
git commit -am "feat(signatur): FuenfElementeKranz component with fibonacci staging"
```
**HALT:** Ben reviewt das visuelle Design auf der Preview-Route.

---

### Phase 7 — Kranz in Signatur einbetten

**Ziel:** Der Kranz erscheint um die Signatur auf der Signatur-Seite, liest live aus dem `user_quiz_profile` via Hook `useUserQuizProfile`.

**Files:**
- Create: `src/hooks/useUserQuizProfile.ts`
- Modify: `src/pages/SignaturPage.tsx`
- Modify: `src/components/signatur/SignaturRenderer.tsx` (Layout: Kranz als Overlay/Ring)
- Test: `src/hooks/__tests__/useUserQuizProfile.test.ts`

**Step 7.1 — Hook mit Supabase-Subscription.**
```ts
export function useUserQuizProfile(userId: string | null) {
  const [profile, setProfile] = useState<UserQuizProfile | null>(null);
  useEffect(() => {
    if (!userId) return;
    supabase.from('user_quiz_profile').select('*').eq('user_id', userId).single()
      .then(({ data }) => data && setProfile(data));
    const channel = supabase.channel(`profile:${userId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'user_quiz_profile', filter: `user_id=eq.${userId}` },
        (payload) => setProfile(payload.new as UserQuizProfile))
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [userId]);
  return profile;
}
```

**Step 7.2 — Signatur-Layout.**
In `SignaturRenderer` wird der Kranz als absolute-positionierter Ring um den Signatur-Canvas gelegt. Pointer-Events durchlässig, damit 3D-Interaktion nicht blockiert wird.

**Step 7.3 — Verify.**
Manueller Test mit Test-User: Profil mit feuer=3 führt zu Kranz mit Feuer-Segment auf Stage 3. Dann per SQL `UPDATE ... feuer=8` → UI aktualisiert sich via Realtime innerhalb 1s.

**Step 7.4 — Commit + HALT.**
```bash
git commit -am "feat(signatur): FuenfElementeKranz wired to live user profile"
```
**HALT:** Ben testet Integration im Browser mit einem Live-User.

---

### Phase 8 — Sofort-Effekt beim Quiz-Abschluss

**Ziel:** Nach Quiz-Abschluss → Redirect zur Signatur mit `?justCompleted=<quizId>`-Flag → betroffene Segmente pulsieren 2s → Toast "Deine Signatur hat sich bewegt: {Elemente}" → bei neuer Fibonacci-Schwelle zusätzliche Aufleucht-Animation.

**Files:**
- Modify: `src/pages/quiz/[quizId].tsx` (Abschluss-Redirect mit Flag)
- Modify: `src/pages/SignaturPage.tsx` (Flag lesen, Effekt triggern)
- Modify: `src/components/signatur/FuenfElementeKranz.tsx` (Pulse-Animation exportierbar machen)
- Create: `src/components/signatur/KranzCompletionToast.tsx`

**Step 8.1 — Flag + Effect-Trigger.**
```ts
// SignaturPage.tsx
const params = useSearchParams();
const justCompletedQuiz = params.get('justCompleted');
const [recentContribution, setRecentContribution] = useState<{elements: WuXingElement[], newStage?: WuXingElement} | null>(null);
useEffect(() => {
  if (!justCompletedQuiz || !userId) return;
  (async () => {
    const delta = await fetchLastQuizDelta(userId, justCompletedQuiz);
    setRecentContribution(delta);
    setTimeout(() => setRecentContribution(null), 4000);
  })();
}, [justCompletedQuiz, userId]);
```

**Step 8.2 — Pulse-Animation-Prop am Kranz.**
```tsx
<FuenfElementeKranz
  profile={profile}
  pulsingElements={recentContribution?.elements}
  newStageFor={recentContribution?.newStage}
/>
```
Innen: für die genannten Elemente wird eine framer-motion-Animation gestartet.

**Step 8.3 — Toast.**
```tsx
{recentContribution && (
  <KranzCompletionToast elements={recentContribution.elements} />
)}
```
Toast ist dezent, zentriert oben, 3s sichtbar, fade out.

**Step 8.4 — E2E-Test.**
Playwright/Cypress-Test: Quiz einreichen → Redirect → Toast erscheint → Segment pulsiert → Profil ist aktualisiert.

**Step 8.5 — Commit + HALT.**
```bash
git commit -am "feat(signatur): post-quiz immediate effect with segment pulse and toast"
```
**HALT:** Ben testet den vollen End-to-End-Flow manuell.

---

### Phase 9 — Verifikation & Regression

**Ziel:** Alle bestehenden Tests laufen, neue Tests sind grün, manueller Regression-Check auf Dashboard + Signatur + Quiz-Flow.

**Files:** keine Änderungen, nur Verifikation.

**Step 9.1 — Volltest.**
```bash
npx tsc --noEmit
npx vitest run
npx playwright test   # falls E2E vorhanden
```

**Step 9.2 — Regression-Matrix manuell.**
- Dashboard öffnen → keine Veränderung (Sprint 1 fasst Dashboard nicht an)
- Signatur öffnen mit leerem Profil → Kranz leer sichtbar
- Quiz machen → Redirect → Kranz-Update sichtbar, Toast erscheint
- Seite neu laden → Kranz-Status persistent
- Zweites Quiz aus anderem Cluster → weiteres Segment reagiert

**Step 9.3 — Postmortem-Doc.**
`docs/sprints/2026-04-20-quiz-signatur-sprint-1.retro.md` — was lief, was haperte, was nehmen wir in Sprint 2 mit.

**Step 9.4 — Merge-PR.**
```bash
git push origin 2026-04-20-quiz-signatur-sprint-1
# Pull Request öffnen, Ben reviewt, merge
```

**Verification:** grün grün grün, manuelle Regression ok.
**HALT:** Final-Review durch Ben, dann Merge.

---

## Teil C — Nachfolge-Sprints (Roadmap-Skizze)

Jeder Nachfolge-Sprint bekommt einen eigenen detaillierten Plan, sobald Sprint 1 abgeschlossen und retroed ist.

### Sprint 2 — Sektor-Frequenz → Chladni-Modulation
- `sector_profile[12]` → `chladniParams` Mapping definieren und implementieren
- Visuelle Frequenz-Wirkung auf der Signatur (bisher nur Daten, jetzt Render)
- Unit-Tests für das Mapping, visuelle Regression-Tests
- Voraussetzung: Sprint 1 merged, mindestens 1 Cluster-Abschluss im Test-User

### Sprint 3 — Transformations-Animation
- Dispersion → Re-Aggregation → Puls (ersetzt die einfache Segment-Pulse aus Sprint 1)
- Partikel-System in three.js / r3f
- Performance-Budget: 60fps auf Mid-Range-Devices
- Voraussetzung: Sprint 2, weil die "neue Form" aus der Sektor-Frequenz resultiert

### Sprint 4 — Signatur-Varianz (Rauszoomen + Cursor-Ripple progressiv)
- Rauszoomen mit Debug-Slider 1x/2x/4x/6x/8x, Freeze auf gewähltem Wert
- Cursor-Ripple sanft ab 1. Element-Kranz-Segment, stärker ab 3. Segment, voll ab Kranz komplett
- Unabhängig von den Quiz-Sprints, kann parallel laufen
- Voraussetzung: keine

### Sprint 5 — Ton-Cursor-Modus
- Tone.js-Integration
- Element-spezifische Klangfarben (5 Timbres)
- Freischaltung bei Fibonacci-Schwelle auf mindestens einem Segment (tbd)
- Voraussetzung: Sprint 4 (Cursor-Interaktion muss aktiv sein)

### Sprint 6 — Paar-Signatur
- Konzept-Workshop zuerst (Form: Spirale? doppelter Kranz? verschränkte Chladni?)
- Datenmodell: `couple_signature` mit zwei User-Refs, aggregiertes Profil
- UX: Einladung, Consent, Widerruf
- Voraussetzung: Sprint 1–3 stabil; eigenes Brainstorming-Dokument vorab

### Sprint 7 — Agenten-Integration
- Read-Endpoints für `user_quiz_profile` + `user_quiz_answers` (Historie)
- Agenten-Prompts erweitern um Element-/Sektor-Profile
- Privacy-Check: welche Daten darf Agent sehen?
- Voraussetzung: mindestens ein User mit mehr als 10 Quizzes Historie, damit Agenten etwas zum Arbeiten haben

### Signatur-Varianz-Sprint (Rauszoomen als Hotfix)
- Falls Ben die 4x-8x-Rauszoom-Änderung als dringlich empfindet (er hat sie als "ansonsten ja" markiert), kann das als Mini-Sprint parallel zu Sprint 1 laufen, eigenständig.
- 1–2 Phasen: Debug-Slider → Freeze

---

## Output-Contract pro Phase

Jede Phase schliesst mit diesem Block ab:

### phase
[Was diese Phase geändert hat]

### verification
- typecheck: [passed/failed/not available]
- lint: [passed/failed/not available]
- tests/build: [passed/failed/not run]

### remaining risks
- [Spezifisches Risiko oder `none identified`]

### confidence
- high / medium / low

---

## Referenzen

- Memory `project_quiz_signatur_grundsaetze.md` — die 12 Axiome
- `docs/KOHAERENZ_INDEX.md` — bestehendes Schichten-Modell
- `docs/plans/2026-04-20-dashboard-signatur-gaps.md` — laufender Dashboard-Sprint (nicht blockierend)

---

## Ausführungs-Handoff

Plan vollständig und gespeichert unter `docs/plans/2026-04-20-quiz-signatur-coupling.md`.

**Zwei Optionen für die Umsetzung:**

1. **Subagent-Driven (in dieser Session)** — ich dispatche pro Task einen frischen Subagenten, reviewe zwischen Tasks, schnelle Iteration mit HALT-Punkten nach Phasen 2, 4, 5, 6, 7, 8.

2. **Parallele Session (separat)** — du öffnest eine neue Session in einem Worktree und nutzt `superpowers:executing-plans`, Batch-Ausführung mit Checkpoints.

Für diesen Sprint wäre **Option 1 schlauer**, weil viele Phasen HALT-Punkte mit visuellen Reviews haben, die du direkt beurteilen musst.
