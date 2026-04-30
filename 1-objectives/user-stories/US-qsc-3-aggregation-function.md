# US-qsc-3-aggregation-function: Reine Aggregationsfunktion für Quiz-Responses

**Status**: Draft

**Source**: [GOAL-quiz-signatur-coupling-v1](../goals/GOAL-quiz-signatur-coupling-v1.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## User Story

Als Entwickler möchte ich eine reine, testbare Aggregationsfunktion `aggregateQuizResponses(answers[])`, die aus einer Liste von Antworten zwei unabhängige Profil-Dimensionen berechnet, damit die Aggregationslogik isoliert von UI und DB testbar ist und Axiom 8+9 verletzt werden ohne Konsequenz für andere Layer.

## Acceptance Criteria

- [ ] Funktion `aggregateQuizResponses(answers[]) → { element_profile: Record<WuXingElement, number>, sector_profile: number[12] }` existiert
- [ ] Beide Dimensionen sind additiv und unabhängig — `element_profile` beeinflusst `sector_profile` nicht und umgekehrt
- [ ] Werte werden normalisiert (Summe relativ, kein hartes Cap pro Dimension)
- [ ] TDD: Failing-first-Test existiert vor Implementierung
- [ ] Pure function: kein Side-Effect, kein DB-Call, kein API-Call

## Related Artifacts

- Axioms: CON-quiz-signatur-axiome Axiom 8, 9
- Requirements: [REQ-F-quiz-answer-element-contrib](../requirements/REQ-F-quiz-answer-element-contrib.md)
- Sprint-Phase: Sprint B Phase 3 — `docs/plans/2026-04-20-quiz-signatur-coupling.md`
