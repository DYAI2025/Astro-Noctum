# REQ-F-i18n-completeness: Zero Raw Keys in UI + Quiz Overlay Reliability

**Type**: Functional

**Status**: Approved

**Priority**: Must-have

**Source**: [GOAL-i18n-quiz-ux-integrity](../goals/GOAL-i18n-quiz-ux-integrity.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## Description

Every `t()` call in the codebase shall resolve to a translated string. No raw translation key shall ever be visible to the user. Quiz overlays shall be reliably dismissable.

## Acceptance Criteria

- Given the app renders any page or component, when the UI is inspected, then no text matching a dot-separated key pattern (e.g., "quiz.startAnalysis", "dashboard.astroAgents") is visible.
- Given a Vitest test suite runs, when a dedicated i18n completeness test executes, then it extracts all `t('...')` calls from source files and verifies each key exists in both `translationsEn` and `translationsDe` objects.
- Given a quiz overlay is open, when the user clicks the X button, then the overlay closes regardless of scroll position, quiz state, or z-index layering.
- Given a quiz overlay is open, when the user presses Escape, then the overlay closes.
- Given a quiz overlay is open, when the user clicks the backdrop (outside the dialog), then the overlay closes.
- Given the quiz result screen renders, when the cluster note is displayed, then it shows translated text (e.g., "Hinweis: Deine Ergebnisse fliessen..."), not raw keys like "quiz.clusterNoteLabel".
- Given the `conversationAnalysis` quiz renders, when all UI elements are visible, then title, paste label, placeholder, button text, and hint are all translated — no raw keys.

## Related Constraints

- [CON-german-ui](../constraints/CON-german-ui.md) — all user-facing text must be in German (primary) with English available
