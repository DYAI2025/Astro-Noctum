# REQ-F-quiz-answer-element-contrib: Element-Zuordnung auf Antwort-Option-Ebene

**Type**: Functional

**Status**: Approved

**Priority**: Must-have

**Source**: [CON-quiz-signatur-axiome](../constraints/CON-quiz-signatur-axiome.md) (Axiom 8, 9), [GOAL-quiz-signatur-coupling-v1](../goals/GOAL-quiz-signatur-coupling-v1.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

Kein Quiz hat ein fixes Element. Jede einzelne Antwort-Option trägt zwei unabhängige Beitragsvektoren: `elementContrib[5]` (Wu-Xing: Holz/Feuer/Erde/Metall/Wasser) und `sectorContrib[12]` (12 Tierkreis-Sektoren). Beide Dimensionen sind additiv und unabhängig voneinander. Die Aggregation erfolgt auf Antwort-Ebene — nie auf Quiz-Ebene. Fehlende `elementContrib`-Werte auf einem neuen Quiz sind ein Sprint-Blocker, keine Defaults.

## Acceptance Criteria

- Given a new quiz is authored, when its `QuizAnswerOption` type is checked, then every option carries `elementContrib: Partial<Record<WuXingElement, number>>` and `sectorContrib: Partial<Record<ZodiacSector, number>>` fields (leere Objekte `{}` sind erlaubt — fehlende Felder sind verboten).
- Given a TypeScript build of a quiz definition that omits `elementContrib` or `sectorContrib` on any answer option, when `npm run lint` or `npx tsc --noEmit` runs, then it fails with a type error.
- Given a quiz where answer option A has `elementContrib: {holz: 0.8}` and answer option B has `elementContrib: {feuer: 0.6}`, when both answers are given by the same user across two questions, then `aggregateQuizResponses()` returns `element_profile: {holz: 0.8, feuer: 0.6, ...}` (additive, no capping at quiz level).
- Given the `aggregateQuizResponses(answers[])` function, when called with a set of answers, then it returns both `element_profile[5]` and `sector_profile[12]` independently — neither dimension influences the other.
- Given a quiz that has received editorial `elementContrib` values on all answer options, when a user completes it, then `user_quiz_answers` rows carry non-empty `element_contrib` JSONB for that quiz's answers.
- Given the 22 legacy quizzes without `elementContrib` values, when a user completes one, then `user_quiz_answers` stores `element_contrib: {}` (empty object) — the Kranz shows no contribution for that answer (Diagnose, kein Bug). No default values are injected.

## Related Artifacts

- Decision: [DEC-quiz-data-model-migration](../../2-design/decisions/DEC-quiz-data-model-migration.md)
- Constraint: [CON-quiz-signatur-axiome](../constraints/CON-quiz-signatur-axiome.md) Axiom 8, 9
- Note: Backfill der 22 Bestands-Quizze mit `elementContrib` ist Editorial-Arbeit, kein Code-Sprint. Scope liegt außerhalb Sprint B — siehe DEC-quiz-data-model-migration §Akzeptierter Produkt-Zustand.
