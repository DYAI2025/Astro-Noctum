# US-qsc-4-answer-element-attribution: Element-Zuordnung auf Antwort-Option-Ebene

**Status**: Draft

**Source**: [GOAL-quiz-signatur-coupling-v1](../goals/GOAL-quiz-signatur-coupling-v1.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## User Story

Als Bazodiac-Nutzer möchte ich, dass jede einzelne Antwort, die ich in einem Quiz gebe, direkt zu zwei Dimensionen meiner Signatur beiträgt (Wu-Xing-Kranz + 12-Sektor-Frequenz), damit meine Signatur wirklich mein Antwort-Verhalten widerspiegelt und nicht ein pauschales "Quiz X gehört zu Element Y".

## Acceptance Criteria

- [ ] Jede `QuizAnswerOption` trägt `elementContrib: Partial<Record<WuXingElement, number>>` und `sectorContrib: Partial<Record<ZodiacSector, number>>` (leere Objekte erlaubt — fehlende Felder sind TypeScript-Fehler)
- [ ] TypeScript-Build schlägt fehl wenn `elementContrib` oder `sectorContrib` bei einer neuen AnswerOption fehlt
- [ ] `/api/contribute` speichert `element_contrib` und `sector_contrib` als JSONB in `user_quiz_answers`-Rows
- [ ] Legacy-Quizze ohne `elementContrib`: `user_quiz_answers` speichert `element_contrib: {}` — kein Default-Injection, kein Error
- [ ] Editorial-Backfill-Skelett: JSON-Vorlage pro Cluster (6 Dateien) mit korrekter Struktur, ohne Platzhalter-Werte

## Related Artifacts

- Axioms: CON-quiz-signatur-axiome Axiom 8, 9
- Requirements: [REQ-F-quiz-answer-element-contrib](../requirements/REQ-F-quiz-answer-element-contrib.md)
- Decision: [DEC-quiz-data-model-migration](../../2-design/decisions/DEC-quiz-data-model-migration.md)
- Sprint-Phase: Sprint B Phase 4 + 5 — `docs/plans/2026-04-20-quiz-signatur-coupling.md`
