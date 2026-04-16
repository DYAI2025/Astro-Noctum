# US-quiz-i18n-integrity: No Raw Translation Keys and Reliable Quiz Dismissal

**Status**: Draft

**Source**: [GOAL-i18n-quiz-ux-integrity](../goals/GOAL-i18n-quiz-ux-integrity.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## User Story

As a German-speaking user opening any quiz, I want every visible label to be rendered as proper German text and I want to be able to close the quiz reliably (X button, Escape key, or backdrop click), so that the app never exposes developer-facing translation keys and I am never trapped inside an overlay.

## Acceptance Criteria

- [ ] No UI-visible string is a raw translation key — every `t('...')` call resolves to a string present in `translations.ts` for both DE and EN locales.
- [ ] An automated test enumerates all `t('...')` usages in the codebase and fails the build if any key is missing from the DE or EN translation map.
- [ ] The quiz-overlay close (X) button is reachable (not occluded by z-index, scroll, or layout) and closes the overlay on every one of the 22 quizzes plus the Conversation Analysis quiz.
- [ ] Pressing `Escape` while the quiz overlay is open closes the overlay.
- [ ] Clicking the backdrop outside the quiz content closes the overlay.
- [ ] `contribution_events` are only POSTed to `/api/contribute` after a full cluster is completed — never after a single intra-cluster quiz. Cluster-gate state is observable in devtools for verification.
- [ ] Quiz result screens and cluster-completion hints render as translated strings, not raw keys.

## Related Artifacts

- Requirements: [REQ-F-i18n-completeness](../requirements/REQ-F-i18n-completeness.md), [REQ-F-quiz-contribution-system](../requirements/REQ-F-quiz-contribution-system.md)
- Constraints: [CON-german-ui](../constraints/CON-german-ui.md)
- QA Findings: QA-1, QA-9, QA-10, QA-11, QA-13, QA-14, QA-18
