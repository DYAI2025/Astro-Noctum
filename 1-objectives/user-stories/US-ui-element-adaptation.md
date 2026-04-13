# US-ui-element-adaptation: Wu-Xing Element Drives UI Accent

**Status**: Draft

**Source**: [GOAL-autopoietic-ux](../goals/GOAL-autopoietic-ux.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## User Story

As a user, I want the app's visual accent colours, card textures, and transition timing to reflect my dominant Wu-Xing element, so that the UI feels personally tuned to my elemental signature from the first login.

## Acceptance Criteria

- [ ] Each of the 5 elements (Wood, Fire, Earth, Metal, Water) has a distinct accent colour and UI token set
- [ ] The user's dominant element is derived from their BaZi Day Master and applied as a CSS `data-element` attribute on the body
- [ ] Element-specific styles apply to card glow, transition speed, and accent fills — not to background colour (obsidian remains fixed)
- [ ] A user whose element changes (profile update) sees the new element applied on next load

## Related Artifacts

- Requirements: [REQ-F-quiz-contribution-system](../requirements/REQ-F-quiz-contribution-system.md), [REQ-F-signatur-data-pipeline](../requirements/REQ-F-signatur-data-pipeline.md)
