# US-dsg-coherence-tooltip: Hover-Tooltip erklärt den Kohärenzindex

**Status**: Implemented

**Source**: [GOAL-dashboard-signatur-hygiene](../goals/GOAL-dashboard-signatur-hygiene.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## User Story

Als Bazodiac-Nutzer möchte ich beim Hover über den Kohärenzring eine kurze, ehrliche Erklärung sehen, was der Index misst und was NICHT, damit ich die Zahl nicht mit einer Identitätsaussage verwechsle, sondern verstehe: sie zeigt "wie laut meine Struktur gerade spricht" — nicht "wer ich bin".

## Acceptance Criteria

- [x] Ein Element mit `data-testid="coherence-ring"` existiert und ist der Hover-Trigger
- [x] Bei Hover (Radix Delay 500ms) erscheint Tooltip-Text der `misst, wie stark deine Natal-Signatur` enthält
- [x] Der Tooltip nennt alle vier Layer: `Natal-Kern`, `Transit`, `Quiz-Kalibrierung`, `Membran (Kp, Sonnenwind)`
- [x] Geschlossen: kein Tooltip-Inhalt im DOM
- [x] Trigger hat `tabIndex={0}` und `aria-label` für Keyboard-Accessibility

## Related Artifacts

- Sprint: S-DASH-SIGNATUR-GAPS Phase 3 — `docs/plans/2026-04-20-dashboard-signatur-gaps.md` §Phase 3
- Sprint-Journal US: `docs/user-stories/2026-04-20/US-DSG-3-coherence-tooltip.md`
- Canonical text: `docs/KOHAERENZ_INDEX.md` §3.1–3.2
