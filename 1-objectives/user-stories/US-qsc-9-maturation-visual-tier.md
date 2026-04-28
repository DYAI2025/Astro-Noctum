# US-qsc-9-maturation-visual-tier: Maturation-Layer als Fibonacci-Stufenfarbe, nie als Zahl

**Status**: Draft

**Source**: [GOAL-quiz-signatur-coupling-v1](../goals/GOAL-quiz-signatur-coupling-v1.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## User Story

Als Bazodiac-Nutzer möchte ich, dass mein kumulierter Quiz-Fortschritt als visuelle Materialveredelung (matt → farbig → leuchtend → golden) ablesbar ist und nie als Zahl erscheint, damit die Diagnose emotional resoniert und nicht wie ein Gamification-Score wirkt.

## Acceptance Criteria

- [ ] Fibonacci-Schwellwerte `[0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233]` sind im Code definiert und entsprechen visuellen Tier-Stufen
- [ ] `total_quiz_count` aus `user_quiz_profile` bestimmt die aktuelle Tier-Stufe — kein direktes Anzeigen der Zahl in der UI
- [ ] Maturation-Tier ist visuell als Farb- / Sättigungs- / Glow-Änderung am Kranz-Material ablesbar (nicht als Text, nicht als Fortschrittsbalken, nicht als Badge-Zahl)
- [ ] Fibonacci-Schwellwerte sind von Ben freigegeben vor Phase-6-Commit (können bei zu grober/feiner Auflösung angepasst werden — Pflöck)
- [ ] Tier-Zuordnung ist deterministisch und test-bar: `getMaturationTier(quizCount: number) → TierLevel`

## Related Artifacts

- Axioms: CON-quiz-signatur-axiome Axiom 5
- Sprint-Phase: Sprint B Phase 6 (gekoppelt an FuenfElementeKranz) — `docs/plans/2026-04-20-quiz-signatur-coupling.md`
- Harter Pflöck: Fibonacci-Schwellwerte — Ben-Freigabe vor Commit
