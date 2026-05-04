# GOAL-quiz-signatur-coupling-v1: Quiz → Signatur Coupling (Sprint 1 — Datenmodell + Wu-Xing-Kranz + Sofort-Effekt)

**Description**: Die Signatur reagiert strukturell und sichtbar auf abgeschlossene Quizze. Sprint 1 legt das Fundament: append-only-Datenmodell für unveränderliche Quiz-Antworten, eine pure Aggregations-Funktion die pro Antwort-Option zwei unabhängige Dimensionen liefert (`elementContrib[5]` Wu-Xing + `sectorContrib[12]`), einen visuellen Fünf-Elemente-Kranz rund um die Signatur-Sphäre als additive Schicht, und einen Sofort-Effekt-Animations-Frame beim Quiz-Abschluss (<500ms, sichtbar aber nicht disruptiv). Explizit NICHT in Sprint 1: Chladni-Modulation der Sphäre, Transformation-Animation bei Fibonacci-Stufen, Gold-Leucht-Effekt, Audio-Layer, Paar-Signatur, Agenten-API. Diese sind Sprint 2+ (Roadmap in Plan Part C). Sprint-Plan: `docs/plans/2026-04-20-quiz-signatur-coupling.md`. Handoff: `docs/plans/2026-04-20-handoff-quiz-signatur-coupling.md`. **Axiome** als Produkt-Gesetz: siehe verlinkter Constraint `CON-quiz-signatur-axiome`.

**Status**: Approved

**Priority**: Must-have

**Source stakeholder**: [STK-product-owner](../stakeholders.md), [STK-end-user](../stakeholders.md)

## Success Criteria

- [ ] Supabase-Tabellen `user_quiz_profile` und `user_quiz_answers` angelegt via idempotente Migration (`IF NOT EXISTS`), RLS-Policies für `anon` und `authed` getestet, append-only-Constraint auf `user_quiz_answers` DB-seitig erzwungen (Axiom 1).
- [ ] Datenmodell trägt beliebig viele zukünftige Cluster ohne strukturelle Änderung (Axiom 2).
- [ ] Rhythmus-Gating: Free-User 1 Quiz/Tag, Premium 2 Quizze/Tag, UI + Server-Side-Enforcement (Axiom 3).
- [ ] Pure Aggregations-Funktion `aggregateQuizResponses(answers[]) → { element_profile[5], sector_profile[12] }` mit TDD (Phase 3 failing-first test).
- [ ] Element-Zuordnung auf Antwort-Option-Ebene (nicht Quiz-Ebene): jede AnswerOption trägt `elementContrib[5]` UND `sectorContrib[12]` (Axiom 8, 9).
- [ ] Editorial-Backfill-Skelett: JSON-Vorlage pro existierendem Cluster (6 Cluster), strukturell korrekt, ohne Platzhalter-Werte (Axiom: Content ≠ Code-Arbeit). Ben/Editorial-Team befüllt separat.
- [ ] `FuenfElementeKranz`-Komponente isoliert, 5 Segmente (Holz/Feuer/Erde/Metall/Wasser) mit approved Farbpalette, i18n-fähige Labels/Tooltips. Start-State für alle User: alle Segmente = 0 (Axiom 11).
- [ ] Kranz ist **additiv** in der Signatur-Seite platziert, nicht ersetzend — existierende "Aktive Einflüsse"/Planeten-Frequenz-Komponenten bleiben unberührt.
- [ ] Sofort-Effekt beim Quiz-Abschluss: <500ms Ring-Pulse/Segment-Flash beim neu-betroffenen Element, User sieht sichtbaren Unterschied zwischen "keine Quizze" vs "1 Cluster abgeschlossen" (Axiom 4).
- [ ] Maturation-Layer visuell ablesbar (Farbe/Sättigung/Gold-Glanz via Fibonacci-Stages `[0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233]`), nie als Zahl (Axiom 5).
- [ ] Pro Phase wird eine User-Story unter `docs/user-stories/2026-04-20/US-QSC-<n>-<slug>.md` mit Axiom-Bezug + Gherkin-AC + RLS-Tests dokumentiert.
- [ ] Neue SDS-Datei `docs/docu/QUIZ_SIGNATURE_COUPLING.md` in Phase 1 angelegt, enthält Axiome-Referenz, Datenmodell-Diagramm, Fibonacci-Tabelle, Element-Farbpalette, Link zu Plan + Roadmap.
- [ ] Alle 12 Axiome aus `CON-quiz-signatur-axiome` respektiert; Axiom-Konflikte mit Plan-Details werden durch Plan-Patch, nicht Axiom-Aufweichen, gelöst.

## Harte Pflöcke (keine Autonomie-Entscheidung)

Vor Commit der jeweiligen Phase muss Ben explizit Zustimmen:
- **Element-Farbpalette** (vor Phase 6): Vorschläge im Plan (Holz `#10B981`, Feuer `#EF4444`, Erde `#CA8A04`, Metall `#CBD5E1`, Wasser `#3B82F6`) sind nicht final.
- **Fibonacci-Schwellwerte** (vor Phase 6): Plan-Default `[0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233]` kann bei zu grober/feiner Auflösung angepasst werden.
- **Editorial-Backfill-Werte** (Phase 5): Content-Arbeit, nicht Code-Arbeit. Code liefert nur die leere Vorlage.
- **Sofort-Effekt-Animation** (Phase 8): Dauer, Intensität, Pulse-Farbe sind visuelle Entscheidungen — Screenshot/Screencap-HALT vor Commit.

## Related Artifacts

- Sprint-Plan (Source of Truth): `docs/plans/2026-04-20-quiz-signatur-coupling.md`
- Handoff-Dokument: `docs/plans/2026-04-20-handoff-quiz-signatur-coupling.md`
- Master-Prompts: `docs/plans/2026-04-20-MASTER-PROMPTS-for-claude-code.md` (Prompt B)
- **Constraint** (Produkt-Gesetz, nicht verhandelbar): [CON-quiz-signatur-axiome](../constraints/CON-quiz-signatur-axiome.md) — die 12 Axiome
- Dependency: [GOAL-dashboard-signatur-hygiene](GOAL-dashboard-signatur-hygiene.md) — muss zuerst abgeschlossen sein (keine überlagernden Signatur-Edits)
- Bestehende Referenz-Planung: `docs/plans/2026-03-08-quiz-cluster-energy-system.md` (existierendes Quiz-Energie-System, keine Duplikation)
- Product-Law-Reference: `docs/KOHAERENZ_INDEX.md` — Quiz-Gewichtung im Kohärenzindex-Formel (`quiz_effective * 0.20`)
- Future-Sprints (Roadmap, NICHT Sprint 1):
  - Sprint 2: Chladni-Modulation der Sphäre basierend auf `sector_profile[12]`
  - Sprint 3: Transformation-Animation bei Fibonacci-Stufen, Gold-Leucht-Effekt für "alle Elemente voll"
  - Sprint 4: Ton-Mode / Audio-Layer
  - Unnummeriert: Paar-Signatur / Verschränkung zweier User, Agenten-API
- User Stories: aufgebaut während Sprint, Ziel-Ort `docs/user-stories/2026-04-20/US-QSC-*.md`
- Requirements: _none yet_ — organische Ableitung aus Phasen, später per Post-Sprint-Gap-Analysis ins Scaffold zu heben
