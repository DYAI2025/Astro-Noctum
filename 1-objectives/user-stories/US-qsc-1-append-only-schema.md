# US-qsc-1-append-only-schema: Append-Only Datenbank-Schema für Quiz-Antworten

**Status**: Draft

**Source**: [GOAL-quiz-signatur-coupling-v1](../goals/GOAL-quiz-signatur-coupling-v1.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## User Story

Als Bazodiac-Nutzer möchte ich, dass meine abgegebenen Quiz-Antworten unveränderlich gespeichert werden und keine Manipulation nachträglich möglich ist, damit die Signatur eine ehrliche, kumulierte Diagnose meines tatsächlichen Antwort-Verhaltens bleibt.

## Acceptance Criteria

- [ ] Supabase-Tabelle `user_quiz_answers` angelegt via idempotente Migration (`IF NOT EXISTS`)
- [ ] Supabase-Tabelle `user_quiz_profile` angelegt via idempotente Migration (`IF NOT EXISTS`)
- [ ] RLS auf `user_quiz_answers`: INSERT und SELECT für `authenticated` mit `user_id = auth.uid()` erlaubt; UPDATE und DELETE verboten (kein Grant)
- [ ] Automatisierter RLS-Test: UPDATE und DELETE auf `user_quiz_answers` als `authenticated` Role scheitern mit 403/42501
- [ ] `user_quiz_profile` startet für jeden neuen User mit `element_profile = {holz:0, feuer:0, erde:0, metall:0, wasser:0}` und `sector_profile = [0,0,0,0,0,0,0,0,0,0,0,0]`
- [ ] Datenmodell trägt beliebig viele zukünftige Cluster ohne strukturelle Schema-Änderung

## Related Artifacts

- Axioms: CON-quiz-signatur-axiome Axiom 1, 2, 10, 11
- Requirements: [REQ-F-quiz-append-only](../requirements/REQ-F-quiz-append-only.md)
- Decision: [DEC-quiz-data-model-migration](../../2-design/decisions/DEC-quiz-data-model-migration.md)
- Sprint-Phase: Sprint B Phase 1 — `docs/plans/2026-04-20-quiz-signatur-coupling.md`
