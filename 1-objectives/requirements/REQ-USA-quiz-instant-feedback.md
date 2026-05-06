# REQ-USA-quiz-instant-feedback: Sichtbarer Ring-Effekt < 500ms nach Quiz-Abschluss

**Type**: Usability

**Status**: Approved

**Priority**: Must-have

**Source**: [CON-quiz-signatur-axiome](../constraints/CON-quiz-signatur-axiome.md) (Axiom 4), [GOAL-quiz-signatur-coupling-v1](../goals/GOAL-quiz-signatur-coupling-v1.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## Description

Wenn ein User ein Quiz abschließt, muss die Signatur-Visualisierung einen sichtbaren Effekt zeigen, der innerhalb von 500ms nach dem Quiz-Abschluss beginnt. Der Effekt muss ohne Seiten-Reload oder manuelles Refresh sichtbar sein. Kein Batch-Update am nächsten API-Poll-Cycle — der Effekt ist sofort, nicht latent.

## Acceptance Criteria

- Given a user completes a quiz on the Signatur page, when the quiz overlay closes, then within 500ms a visible animation starts on the FuenfElementeKranz (Segment-Flash or Ring-Pulse on the affected element segment).
- Given the instant-feedback animation, when measured from quiz `onComplete` callback to first visible frame change, then elapsed time is < 500ms in standard conditions (no cold-start, average connection).
- Given a user completes a quiz that affects element Holz, when the feedback animation plays, then the Holz-Segment of the Kranz is visually highlighted (color shift, glow, or pulse) relative to its pre-quiz state.
- Given a user who has never completed a quiz ("Kranz starts at 0"), when they complete their first quiz, then the difference between "no quizzes" and "1 quiz completed" is visibly perceptible in the Kranz.
- Given the instant-feedback, when it triggers, then it does NOT require a full `/api/transit-state` round-trip to render — it uses locally computed values from the quiz answers (optimistic update).

## Related Artifacts

- Decision: [DEC-quiz-data-model-migration](../../2-design/decisions/DEC-quiz-data-model-migration.md)
- Constraint: [CON-quiz-signatur-axiome](../constraints/CON-quiz-signatur-axiome.md) Axiom 4
