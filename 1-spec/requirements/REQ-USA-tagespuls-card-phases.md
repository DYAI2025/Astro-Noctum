# REQ-USA-tagespuls-card-phases: TagespulsCard renders Phase 1 (aphorism + Council) and Phase 2 (interpretation)

**Type**: Usability

**Status**: Draft

**Priority**: Should-have

**Source**: [GOAL-aphorism-personalized-interpretation](../goals/GOAL-aphorism-personalized-interpretation.md)

**Source stakeholder**: [STK-user-free](../stakeholders.md)

## Description

The `TagespulsCard` component (`src/components/dashboard/TagespulsCard.tsx`) renders in two distinct phases:

- **Phase 1 (initial mount):** mode chip (PULS / SPUR / SPANNUNG), aphorism with attribution (slot 1), bridge text (slot 2), action prompt (slot 3), and the Rat-der-sechs picker — six tap targets representing `sonne`, `mond`, `aszendent`, `day_master`, `jahrestier`, `wuxing_dom`.
- **Phase 2 (after archetype selection):** the chosen figure's icon and name, the per-figure LLM interpretation text, and a "Zurück / andere Figur wählen →" affordance returning the card to Phase 1.

Loading state shows a skeleton, not a blank card. Empty state (no profile) shows the profile-completion CTA. Fallback state shows the visible-fallback indicator (per [REQ-USA-fallback-indicator](REQ-USA-fallback-indicator.md)).

## Acceptance Criteria

- Given the user has a complete profile and `pulse` is loaded, when `TagespulsCard` mounts, then Phase 1 is rendered with all six Council tap targets visible and the aphorism + slot 2 + slot 3 text shown.
- Given the user taps any Council figure, when the tap handler resolves the interpretation (cached or freshly generated), then Phase 2 is rendered with the chosen figure's name, icon, and interpretation text.
- Given the card is in Phase 2, when the user taps "Zurück / andere Figur wählen →", then Phase 1 is rendered again with the Council picker visible.
- Given `loading === true` and no cached pulse exists, when the card renders, then a skeleton placeholder is shown — not a blank card or layout shift.
- Given `pulse === null` and `birthData === null`, when the card renders, then the profile-completion empty-state CTA is shown.
- Given `isFallback === true`, when the card renders, then the visible-fallback indicator is shown beneath the impulse text per [REQ-USA-fallback-indicator](REQ-USA-fallback-indicator.md).
- The component passes `tsc --noEmit` without new errors.
