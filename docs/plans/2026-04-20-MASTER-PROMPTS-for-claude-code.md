# Master-Prompts für Claude Code — 2026-04-20

> Drei Kurz-Prompts, die du (Ben) wortwörtlich in Claude Code eingeben kannst.
> Jeder Prompt startet einen der drei Aufträge. Reihenfolge: erst Sprint A, dann B. C ist optional.
> Die langen Arbeitsaufträge liegen in den referenzierten `-handoff-...md`-Dateien — Claude Code liest sie im ersten Schritt selbst.

---

## Prompt A — Sprint: Dashboard & Signatur Gaps (erst dieser)

```
Du bist Claude Code und arbeitest am Bazodiac-Projekt (Astro-Noctum).

Lies zuerst VOLLSTÄNDIG und in dieser Reihenfolge:
1. docs/plans/2026-04-20-handoff-dashboard-signatur-gaps.md  (dein Arbeitsauftrag)
2. docs/plans/2026-04-20-dashboard-signatur-gaps.md         (der Plan, Source of Truth)
3. docs/KOHAERENZ_INDEX.md                                  (Produkt-Gesetz für den Kohärenzindex)
4. docs/docu/STRUCTURE.md                                   (SDS-Komponenten-Inventar)

Danach:
- Starte mit Phase 0 (Baseline) des Plans.
- Halte die codemoss-Guardrails ein (Mikro-Phasen, max 5 Dateien/Phase, re-lesen vor und nach jedem Edit, typecheck/lint vor "done").
- Nach Phase 0: HALT mit 3-Zeilen-Status-Report. Warte auf Bens "go" bevor Phase 1.
- Pro Phase: SDS-Doku synchron pflegen + User-Story unter docs/user-stories/2026-04-20/US-DSG-<n>-<slug>.md anlegen.
- Verbotene Sprache ohne Verifikationsbeleg: "done", "fixed", "all good".

Keine Autonomie über Phasen-Grenzen. Reibung erlaubt — frag, wenn der Plan unklar ist.

Go: lies Phase 0 vor und liefere den Baseline-Report.
```

---

## Prompt B — Sprint: Quiz → Signatur Coupling (erst NACH Sprint A grün)

```
Du bist Claude Code und arbeitest am Bazodiac-Projekt (Astro-Noctum).

Voraussetzung: Sprint Dashboard-Gaps ist abgeschlossen und grün. Falls nicht: STOP und frag Ben.

Lies zuerst VOLLSTÄNDIG und in dieser Reihenfolge:
1. docs/plans/2026-04-20-handoff-quiz-signatur-coupling.md   (dein Arbeitsauftrag, enthält die 12 Produkt-Axiome)
2. docs/plans/2026-04-20-quiz-signatur-coupling.md           (der Plan: Part A Architektur, Part B Sprint 1 in 9 Phasen, Part C Roadmap)
3. docs/KOHAERENZ_INDEX.md                                   (Formel + Gewichtung von Quiz im Index)
4. docs/docu/DATABASE_SCHEMA.md                              (existierendes Schema, damit Migration nicht kollidiert)
5. docs/plans/2026-03-08-quiz-cluster-energy-system.md       (bestehende Quiz-Energie-Logik, damit du nichts duplizierst)

Danach:
- Starte mit Phase 0 (Baseline & Research) des Plans. Kein Code-Change in Phase 0, nur Report.
- Codemoss-Guardrails gelten. Bei Supabase-Migration in Phase 2: niemals destruktiv, immer idempotent (IF NOT EXISTS), RLS-Policies mit anon UND authed testen.
- Pro Phase: SDS-Doku synchron + User-Story unter docs/user-stories/2026-04-20/US-QSC-<n>-<slug>.md.
- HARTE PFLÖCKE (stopp + Ben fragen): Element-Farbpalette, Fibonacci-Schwellwerte, Editorial-Backfill-Werte, Sofort-Effekt-Animation.
- Erstelle in Phase 1 das neue SDS-Dokument docs/docu/QUIZ_SIGNATURE_COUPLING.md.
- Axiome aus dem Handoff sind Produkt-Gesetz: bei Konflikt zwischen Plan und Axiomen gewinnen die Axiome.

Dieser Sprint baut NICHT: Chladni-Modulation, Transformation-Animation, Paar-Signatur, Agenten-API — alles eigene spätere Sprints.

Go: lies Phase 0 vor und liefere den Baseline-Report + Risiko-Map.
```

---

## Prompt C — optional: Konsolidierungs-Lauf nach beiden Sprints

```
Beide Sprints (Dashboard-Gaps + Quiz-Signatur-Coupling Sprint 1) sind grün.

Tu Folgendes:
1. Lies alle User-Stories unter docs/user-stories/2026-04-20/
2. Erstelle docs/user-stories/2026-04-20/CHANGELOG.md mit einer kompakten Liste (US-ID, Titel, Referenz-Plan, Status).
3. Prüfe, ob docs/docu/STRUCTURE.md, docs/docu/FRONTEND_INTERNALS.md, docs/docu/DATABASE_SCHEMA.md, docs/docu/QUIZ_SIGNATURE_COUPLING.md konsistent zum Code-Stand sind — list Abweichungen, fix sie in kleinen Einzel-Edits.
4. Erstelle docs/plans/2026-04-20-sprint-completion-report.md mit: was wurde gebaut, was wurde bewusst verschoben (Roadmap), welche Reibungspunkte sind in Memory gelandet.
5. Keine neuen Features. Nur Doku-Alignment + Report.

Alles unter codemoss-Guardrails. Verifikation vor jedem "done".
```

---

## Wie Ben das nutzt

1. Kopiere **Prompt A** in Claude Code → lass ihn Phase-für-Phase durchlaufen, reibe dazwischen.
2. Wenn A grün: Kopiere **Prompt B** → Sprint 1 des Quiz-Coupling.
3. Wenn B grün: optional **Prompt C** für Konsolidierung.

Zwischen den Sprints kommst du (Ben) zu mir zurück, wenn:
- Axiome überarbeitet werden sollen
- die Roadmap für Sprint 2ff (Chladni, Transformation, Paar-Signatur) geschrieben werden soll
- Reibung aus Claude Codes Reports aufkommt, die strategische Entscheidung braucht
