# US-qsc-6-wuxing-kranz-component: Fünf-Elemente-Kranz als additive Signatur-Schicht

**Status**: Draft

**Source**: [GOAL-quiz-signatur-coupling-v1](../goals/GOAL-quiz-signatur-coupling-v1.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## User Story

Als Bazodiac-Nutzer möchte ich um meine Signatur einen Fünf-Elemente-Kranz sehen, dessen 5 Segmente (Holz/Feuer/Erde/Metall/Wasser) durch meine Quiz-Antworten wachsen, damit ich eine ehrliche Diagnose meines Element-Profils ablesen kann — ohne dass die bestehende Signatur-Sphäre dadurch verändert wird.

## Acceptance Criteria

- [ ] `FuenfElementeKranz`-Komponente existiert: 5 Segmente à 72°, Wu-Xing-Erzeugungszyklus-Reihenfolge (Holz → Feuer → Erde → Metall → Wasser, Uhrzeigersinn, oben startend)
- [ ] Start-State für alle User: alle 5 Segmente = 0 (keine Natal-Vorfüllung, kein Auffüll-Mechanismus)
- [ ] Komponente ist i18n-fähig (DE/EN Labels + Tooltips)
- [ ] Kranz ist additiv platziert — bestehende Aktive-Einflüsse/Planeten-Frequenz-Komponenten bleiben unberührt
- [ ] Farbpalette ist von Ben freigegeben vor Phase-6-Commit (Pflöck — keine Autonomie-Entscheidung)
- [ ] Komponente liest ausschließlich `user_quiz_profile.element_profile` (nicht `contribution_events`)

## Related Artifacts

- Axioms: CON-quiz-signatur-axiome Axiom 5, 6, 11
- Decision: [DEC-quiz-data-model-migration](../../2-design/decisions/DEC-quiz-data-model-migration.md)
- Sprint-Phase: Sprint B Phase 6 — `docs/plans/2026-04-20-quiz-signatur-coupling.md`
- Harter Pflöck: Element-Farbpalette (Ben-Freigabe vor Commit)
