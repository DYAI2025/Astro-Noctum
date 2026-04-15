# GOAL-i18n-quiz-ux-integrity: i18n Vollständigkeit & Quiz-UX-Integrität

**Description**: Alle UI-sichtbaren Texte müssen über das i18n-System aufgelöst werden — keine raw Translation-Keys dürfen im UI erscheinen. Quiz-Overlays müssen zuverlässig schließbar sein (X-Button, Escape, Backdrop-Click). Der Cluster-Gate muss korrekt enforced werden: nur abgeschlossene Cluster fließen in die Signatur ein.

**Status**: Draft

**Priority**: Must-have

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## Success Criteria

- [ ] Kein `t()` Call in der gesamten Codebase gibt einen raw Key-String an den User zurück — alle Keys sind in translations.ts (DE + EN) definiert.
- [ ] Systematischer i18n-Audit: automatisierter Test der alle `t('...')` Calls gegen translations.ts prüft.
- [ ] Quiz-Overlay X-Button schließt das Quiz zuverlässig auf allen Quizzes (nicht durch z-index oder Scroll verdeckt).
- [ ] Escape-Taste und Backdrop-Click schließen das Quiz-Overlay.
- [ ] Quiz Cluster-Gate: `contribution_events` werden nur nach Cluster-Completion an den Server gesendet, nicht nach jedem einzelnen Quiz.
- [ ] Alle Quiz-Ergebnis-Screens zeigen den Cluster-Hinweis als übersetzen Text, nicht als raw Key.

## Related Artifacts

- Constraints: [CON-german-ui](../constraints/CON-german-ui.md)
- QA Findings: QA-1, QA-9, QA-10, QA-11, QA-13, QA-14, QA-18
