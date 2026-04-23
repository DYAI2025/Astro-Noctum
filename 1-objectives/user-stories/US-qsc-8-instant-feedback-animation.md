# US-qsc-8-instant-feedback-animation: Sofort-Effekt beim Quiz-Abschluss < 500ms

**Status**: Draft

**Source**: [GOAL-quiz-signatur-coupling-v1](../goals/GOAL-quiz-signatur-coupling-v1.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## User Story

Als Bazodiac-Nutzer möchte ich beim Abschluss eines Quizzes sofort einen sichtbaren Effekt in meiner Signatur sehen, der zeigt welches Element durch meine Antworten beeinflusst wurde, damit jedes Quiz sich als unmittelbare Belohnung und nicht als "speichern und warten" anfühlt.

## Acceptance Criteria

- [ ] Innerhalb von 500ms nach Quiz `onComplete` beginnt eine sichtbare Animation auf dem FuenfElementeKranz (Segment-Flash oder Ring-Pulse auf dem betroffenen Element-Segment)
- [ ] Der Effekt basiert auf lokal berechneten Werten (optimistic update) — kein Warten auf `/api/transit-state`-Round-Trip
- [ ] Nutzer sieht sichtbaren Unterschied zwischen "keine Quizze" und "1 Cluster abgeschlossen" im Kranz
- [ ] Animation-Dauer, Intensität und Pulse-Farbe sind von Ben freigegeben (Screenshot/Screencap-HALT vor Commit)
- [ ] Kein disruptives Overlay oder Blocking-Animation — Effekt ist begleitend, nicht unterbrechend

## Related Artifacts

- Axioms: CON-quiz-signatur-axiome Axiom 4
- Requirements: [REQ-USA-quiz-instant-feedback](../requirements/REQ-USA-quiz-instant-feedback.md)
- Sprint-Phase: Sprint B Phase 8 — `docs/plans/2026-04-20-quiz-signatur-coupling.md`
- Harter Pflöck: Animation-Parameter (Dauer/Intensität/Farbe) — Ben-Freigabe vor Commit
