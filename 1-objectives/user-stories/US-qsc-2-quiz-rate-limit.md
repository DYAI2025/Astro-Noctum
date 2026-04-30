# US-qsc-2-quiz-rate-limit: Rhythmus-Gating — Tageskontingent pro Tier

**Status**: Draft

**Source**: [GOAL-quiz-signatur-coupling-v1](../goals/GOAL-quiz-signatur-coupling-v1.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## User Story

Als Bazodiac-Free-Nutzer möchte ich verstehen, warum ich nach dem ersten Quiz des Tages kein weiteres starten kann, und als Premium-Nutzer möchte ich 2 Quizze pro Tag abschließen können, damit das Rhythmus-Prinzip der Plattform (Ruhe statt Flutung) erlebbar wird.

## Acceptance Criteria

- [ ] Free-Tier-User: nach dem 1. abgeschlossenen Quiz heute wird ein Versuch, ein 2. Quiz zu starten, server-seitig mit 429 beantwortet
- [ ] Premium-User: nach dem 2. abgeschlossenen Quiz heute wird ein Versuch, ein 3. Quiz zu starten, server-seitig mit 429 beantwortet
- [ ] UI zeigt verbleibendes Tageskontingent (0 oder 1 für Free, 0/1/2 für Premium) auf der Quiz-Auswahl-Seite
- [ ] Rate-Limit basiert auf UTC-Kalendertag (Mitternacht UTC = Reset)
- [ ] Server-seitige Prüfung — UI-only-Blocking ist unzureichend (Backend erzwingt)

## Related Artifacts

- Axioms: CON-quiz-signatur-axiome Axiom 3
- Requirements: [REQ-F-quiz-rate-limit](../requirements/REQ-F-quiz-rate-limit.md)
- Sprint-Phase: Sprint B Phase 2 — `docs/plans/2026-04-20-quiz-signatur-coupling.md`
