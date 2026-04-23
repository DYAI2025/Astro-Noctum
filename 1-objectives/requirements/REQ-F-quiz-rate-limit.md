# REQ-F-quiz-rate-limit: Rhythmus-Gating — Free 1 Quiz/Tag, Premium 2 Quizze/Tag

**Type**: Functional

**Status**: Approved

**Priority**: Must-have

**Source**: [CON-quiz-signatur-axiome](../constraints/CON-quiz-signatur-axiome.md) (Axiom 3), [GOAL-quiz-signatur-coupling-v1](../goals/GOAL-quiz-signatur-coupling-v1.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

Free-Tier-Nutzer können maximal 1 Quiz pro Kalendertag (UTC) abschließen. Premium-Nutzer können maximal 2 Quizze pro Kalendertag abschließen. Das Gating wird server-seitig erzwungen (nicht nur UI-seitig). Die UI kommuniziert den verbleibenden Kontingent für den Tag sichtbar.

## Acceptance Criteria

- Given a Free-Tier user has completed 1 quiz today, when they attempt to start a second quiz, then the server returns 429 and the UI zeigt eine Meldung die erklärt, dass das Tageskontingent erschöpft ist.
- Given a Premium user has completed 2 quizzes today, when they attempt to start a third quiz, then the server returns 429 and the UI zeigt eine Meldung.
- Given a Free-Tier user has completed 1 quiz yesterday (UTC), when they start a quiz today, then the server accepts the request.
- Given a Premium user has completed 1 quiz today, when they start a second quiz, then the server accepts the request.
- Given any user, when they view the quiz selection screen, then the UI shows how many quizzes they have remaining for today (0 oder 1 für Free, 0/1/2 für Premium).
- Given the rate-limit check, when it is evaluated, then it runs server-side before any quiz answer is accepted — UI-only blocking is insufficient.

## Related Artifacts

- Decision: [DEC-quiz-data-model-migration](../../2-design/decisions/DEC-quiz-data-model-migration.md)
- Constraint: [CON-quiz-signatur-axiome](../constraints/CON-quiz-signatur-axiome.md) Axiom 3
