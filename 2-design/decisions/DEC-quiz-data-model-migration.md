# DEC-quiz-data-model-migration: Quiz-Datenmodell — Hybrid-Erweiterung (Option C)

**Status**: Active

**Category**: Data

**Scope**: backend

**Source**: [CON-quiz-signatur-axiome](../../1-objectives/constraints/CON-quiz-signatur-axiome.md), [GOAL-quiz-signatur-coupling-v1](../../1-objectives/goals/GOAL-quiz-signatur-coupling-v1.md)

**Last updated**: 2026-04-23

## Context

Zwei Quiz-Datenmodelle koexistieren seit Sprint A (S-DASH-SIGNATUR-GAPS completed 2026-04-21):

**Modell A (live):** `contribution_events` Tabelle — cluster-gated, upserted per `user_id,module_id`, JSONB sector weights. Wird von `server.mjs` transit-state proxy gelesen und an FuFirE gesendet. Das bestehende `REQ-F-quiz-contribution-system` (Status: Implemented) beschreibt dieses Modell vollständig. Die 22 Bestandsquizze erzeugen `ContributionEvent`s ohne `elementContrib[5]`-Vektoren.

**Modell B (Sprint-B-Ziel):** Neue Tabellen `user_quiz_profile` + `user_quiz_answers` (append-only). Jede AnswerOption trägt `elementContrib[5]` + `sectorContrib[12]`. FuenfElementeKranz-Komponente liest `user_quiz_profile.element_profile`. Agenten-API liest `user_quiz_answers` direkt (Axiom 10).

Ohne explizite Entscheidung entstünde nach Sprint B ein inkonsistenter Zustand: Ring-Transit-Pipeline auf Modell A, Kranz-Komponente auf Modell B, 22 Bestandsquizze ohne elementContrib — Kranz zeigt Null für alle bisherigen Quiz-Completions.

## Decision

**Option C — Hybrid-Erweiterung:** Modell A (`contribution_events`) bleibt als Ring-Transit-Source of Truth erhalten. Modell B wird als komplementäre Schicht addiert.

Konkret:

1. **`user_quiz_answers`** (neue Tabelle): append-only Antwort-Historie — INSERT + SELECT für Owner, kein UPDATE/DELETE (RLS). Befüllt parallel zu `contribution_events` bei jedem Quiz-Abschluss. Dient als Agenten-Goldmine (Axiom 10) und als Quelle für `user_quiz_profile`-Aggregation.

2. **`user_quiz_profile`** (neue Tabelle): aggregiertes Element-Profil + Sektor-Profil, per Trigger oder Application-Layer aus `user_quiz_answers` berechnet. `FuenfElementeKranz` liest ausschließlich hier.

3. **`contribution_events`** bleibt unverändert: cluster-gated, upsertable. Ring-Transit-Pipeline (`/api/transit-state`) bleibt auf dieser Tabelle. Kein Breaking Change an FuFirE-Integration.

4. **Cluster-Gate-Semantik:** bleibt für `contribution_events` (Ring-Layer). Fällt für `user_quiz_answers` (jede beantwortete Frage wird sofort gespeichert — Axiom 1 + 10).

5. **`elementContrib`-Backfill für 22 Bestandsquizze:** Lazy — neue Quizze zwingend mit `elementContrib[5]` + `sectorContrib[12]`. Bestandsquizze werden in separater redaktioneller Phase nachgezogen (kein Sprint-B-Blocker, aber explizit akzeptierter Produkt-Zustand).

6. **Weight-Cap 0.5** aus `REQ-F-quiz-contribution-system` gilt weiter für den contribution_events-Layer. Für den FuenfElementeKranz (element_profile) gibt es keinen Cap — die additiven Werte sind Diagnose, kein Signal-Input für die 3D-Sphäre.

## Akzeptierter Produkt-Zustand (bewusste Trade-offs)

- **Kranz zeigt Null für Altdaten:** Nutzer, die Quizze vor dem elementContrib-Backfill abgeschlossen haben, sehen einen leeren Kranz. Das ist Diagnose — sie haben kein Element-Profil, weil ihre Antworten keine Element-Vektoren tragen. Kein Bug. UI soll das ehrlich kommunizieren (noch kein Wording festgelegt — Ben-Entscheidung vor Phase 7/Sprint-B).
- **Zwei parallele Schreibpfade:** Bei jedem Quiz-Abschluss werden sowohl `contribution_events` (cluster-gated) als auch `user_quiz_answers` (sofort) befüllt. Das erhöht die Schreib-Komplexität leicht, ist aber atomar via Supabase RPC oder serverseitiger Transaktion lösbar.
- **`user_quiz_profile` Konsistenz:** Muss nach jedem `user_quiz_answers`-Insert aktuell gehalten werden. Empfohlen: DB-Trigger oder Server-Layer-Aggregation nach Quiz-Completion.

## Enforcement

### Trigger conditions

- **Design phase**: beim Entwerfen von DB-Schema-Änderungen, API-Endpunkten (`/api/contribute`, `/api/transit-state`) oder Supabase-Migrationen, die Quiz-Daten berühren.
- **Code phase**: bei jeder Änderung an `useQuizContribution.ts`, `server.mjs` `/api/contribute` Handler, `contribution_events` Tabellen-Nutzung, neuen Quiz-Komponenten, Schreiben von `QuizAnswerOption`-Typen.
- **Deploy phase**: bei Supabase-Migrationen die `user_quiz_answers`, `user_quiz_profile` oder `contribution_events` betreffen.

### Required patterns

**Neue Quiz-AnswerOptions müssen beide Vektoren tragen:**
```ts
interface QuizAnswerOption {
  id: string;
  text: string;
  elementContrib: Partial<Record<WuXingElement, number>>; // 0..1, darf leer sein
  sectorContrib: Partial<Record<ZodiacSector, number>>;   // 0..1, darf leer sein
}
```
Fehlende Werte = Sprint-Blocker, keine Defaults (Axiom 8).

**Quiz-Completion schreibt immer in beide Tabellen:**
```
Quiz onComplete
  → POST /api/contribute
    → INSERT user_quiz_answers (sofort, jede Antwort)
    → UPDATE user_quiz_profile (aggregiert)
    → UPSERT contribution_events (nur wenn Cluster vollständig)
```

**RLS auf `user_quiz_answers`:**
- INSERT: authed, nur eigene `user_id`
- SELECT: authed, nur eigene `user_id`
- UPDATE: verboten (kein Grant)
- DELETE: verboten (kein Grant)

**`FuenfElementeKranz` liest ausschließlich `user_quiz_profile.element_profile`** — nie `contribution_events`.

**Ring-Transit-Pipeline (`/api/transit-state`) liest ausschließlich `contribution_events`** — nie `user_quiz_answers` direkt.

### Required checks

1. Jede neue `QuizAnswerOption` hat `elementContrib` und `sectorContrib` Felder (auch wenn leer `{}`).
2. `/api/contribute` Handler schreibt in beide Tabellen (verify via Integration-Test nach Phase 1-Sprint-B).
3. RLS-Policy auf `user_quiz_answers`: kein UPDATE/DELETE Grant für `authenticated` Role.
4. `user_quiz_profile` ist nach Quiz-Abschluss konsistent mit `user_quiz_answers`-Summen.
5. `contribution_events` Logik unverändert — bestehende Ring-Pipeline-Tests müssen grün bleiben.

### Prohibited patterns

- ❌ Cluster-Gate für `user_quiz_answers`-Inserts — jede Antwort wird sofort gespeichert.
- ❌ `elementContrib`-Zuordnung auf Quiz-Ebene (Axiom 8) — nur auf AnswerOption-Ebene.
- ❌ `FuenfElementeKranz` liest `contribution_events` — falsche Tabelle, anderes Modell.
- ❌ Natal-Vorfüllen von `user_quiz_profile.element_profile` — Startstate = alle 0 (Axiom 11).
- ❌ `user_quiz_answers` UPDATE/DELETE — append-only ist Produkt-Gesetz (Axiom 1).
- ❌ Backfill-Mechanismus der leere Kranz-Segmente auffüllt — Null-Diagnose ist gewollt (Axiom 11).

## Related Artifacts

- **Constraint**: [CON-quiz-signatur-axiome](../../1-objectives/constraints/CON-quiz-signatur-axiome.md) — die 12 Axiome, die diese Entscheidung kodifiziert
- **Goal**: [GOAL-quiz-signatur-coupling-v1](../../1-objectives/goals/GOAL-quiz-signatur-coupling-v1.md)
- **Prior art**: [REQ-F-quiz-contribution-system](../../1-objectives/requirements/REQ-F-quiz-contribution-system.md) — Modell A, bleibt aktiv
- **Derived requirements (Sprint B blockers, erstellt zusammen mit dieser Entscheidung)**:
  - [REQ-F-quiz-append-only](../../1-objectives/requirements/REQ-F-quiz-append-only.md) — Axiom 1 + 10, DB-seitige Enforcement
  - [REQ-F-quiz-rate-limit](../../1-objectives/requirements/REQ-F-quiz-rate-limit.md) — Axiom 3, free 1/day + premium 2/day
  - [REQ-F-quiz-answer-element-contrib](../../1-objectives/requirements/REQ-F-quiz-answer-element-contrib.md) — Axiom 8 + 9, elementContrib + sectorContrib auf AnswerOption
  - [REQ-USA-quiz-instant-feedback](../../1-objectives/requirements/REQ-USA-quiz-instant-feedback.md) — Axiom 4, <500ms Ring-Pulse
- **Sprint plan**: `docs/plans/2026-04-20-quiz-signatur-coupling.md`

## Rollback plan

Option C ist reversibel — `user_quiz_answers` und `user_quiz_profile` sind additive Tabellen, die die Ring-Pipeline nicht berühren. Wenn in Produktion Drift zwischen `contribution_events` und `user_quiz_profile` auftritt:

1. Feature-Flag setzt `user_quiz_answers`-Schreibpfad auf no-op (Kranz rendert Leer-Zustand gemäß Axiom 11).
2. Tabellen bleiben erhalten (append-only, Daten gehen nicht verloren).
3. Diese Entscheidung wird auf `Status: Superseded by DEC-xxx` gesetzt, Inhalt nach `.history.md` gespiegelt.

Kein destruktiver Rollback nötig — Modell A (`contribution_events` + Ring-Pipeline) wird durch Option C nicht angefasst.
