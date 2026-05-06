# US-qsc-7-additive-placement: Kranz ist additiv platziert, keine bestehende Komponente bricht

**Status**: Draft

**Source**: [GOAL-quiz-signatur-coupling-v1](../goals/GOAL-quiz-signatur-coupling-v1.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## User Story

Als Bazodiac-Nutzer möchte ich den Fünf-Elemente-Kranz als neue Schicht auf der Signatur-Seite sehen, ohne dass die bestehende Signatur-Sphäre, die Aktiven Einflüsse oder andere Planeten-Frequenz-Visualisierungen verändert oder überlagert werden, damit der Kranz das Vorhandene verstärkt und nicht ersetzt.

## Acceptance Criteria

- [ ] `FuenfElementeKranz` ist auf der Signatur-Seite (`/signatur`) eingebaut ohne bestehende Komponenten zu entfernen oder zu verändern
- [ ] Alle bestehenden Signatur-Regression-Tests bleiben nach Placement-Commit grün
- [ ] Kranz ist visuell distinkt von der 3D-Sphäre (kein Overlap der interaktiven Areas)
- [ ] Ben gibt den visuellen Placement-Stand frei (Screenshot-HALT vor Merge)

## Related Artifacts

- Axioms: CON-quiz-signatur-axiome Axiom 6
- Sprint-Phase: Sprint B Phase 7 — `docs/plans/2026-04-20-quiz-signatur-coupling.md`
- Harter Pflöck: Visuelles Placement — Ben-Review (Screenshot/Screencap) vor Commit
