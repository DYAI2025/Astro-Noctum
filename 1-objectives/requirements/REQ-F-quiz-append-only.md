# REQ-F-quiz-append-only: Quiz-Antworten sind append-only und unveränderlich

**Type**: Functional

**Status**: Approved

**Priority**: Must-have

**Source**: [CON-quiz-signatur-axiome](../constraints/CON-quiz-signatur-axiome.md) (Axiom 1), [GOAL-quiz-signatur-coupling-v1](../goals/GOAL-quiz-signatur-coupling-v1.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

Die Tabelle `user_quiz_answers` ist append-only. Einmal gespeicherte Quiz-Antworten können weder überschrieben noch gelöscht werden. Dieses Verhalten wird durch Supabase-RLS-Policies auf Datenbankebene erzwungen — nicht nur durch Application-Layer-Konventionen. Ein User kann dasselbe Quiz nicht wiederholen, um seine Antworten zu ändern.

## Acceptance Criteria

- Given `user_quiz_answers` existiert, when any authenticated user executes UPDATE or DELETE on a row they own, then Supabase returns a permission error (RLS blocks the operation).
- Given `user_quiz_answers` existiert, when any authenticated user executes INSERT for their own `user_id`, then the row is accepted.
- Given a user has answered quiz `Q`, when the user attempts to start quiz `Q` again, then the UI blocks the start (quiz appears as completed, not re-startable).
- Given a completed quiz answer row in `user_quiz_answers`, when `server.mjs` executes the `/api/contribute` handler, then no UPDATE or DELETE SQL is issued for `user_quiz_answers` rows — only INSERT.
- Given an automated RLS test, when it attempts UPDATE and DELETE on `user_quiz_answers` as `authenticated` role, then both operations fail with status 403/42501.

## Related Artifacts

- Decision: [DEC-quiz-data-model-migration](../../2-design/decisions/DEC-quiz-data-model-migration.md)
- Constraint: [CON-quiz-signatur-axiome](../constraints/CON-quiz-signatur-axiome.md) Axiom 1, 10
