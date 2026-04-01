# REQ-F-depth-navigation: Z-Axis Depth Navigation

**Type**: Functional

**Status**: Draft

**Priority**: Must-have

**Source**: [GOAL-autopoietic-ux](../goals/GOAL-autopoietic-ux.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

Navigation follows a Z-axis depth metaphor instead of horizontal scrolling. The UI has three depth layers: Surface (Dashboard — daily state overview), Mid (Signatur — living signature visualization), and Core (detail views — element, planetary, and weekly depth content). The user moves "inward" through the app rather than sideways.

## Acceptance Criteria

- Given the user is on the Dashboard (Surface), when they navigate to the Signatur screen, then the transition conveys movement inward (not left/right) — e.g., zoom-in or depth push animation
- Given the user is on the Signatur screen (Mid), when they navigate to a detail view, then the transition again conveys inward movement toward the Core
- Given any depth level, when the user navigates back, then the transition conveys movement outward (zoom-out or depth pop)
- Given the navigation structure, when implemented, then primary nav items are ≤5 (per DEC-spiritual-tech-interactions: ATLAS, SIGNATUR, SKY, WOCHE, LEVI)
- Given a desktop viewport (≥768px), when depth transitions play, then duration is 400ms ease-out (per DEC-spiritual-tech-interactions page transition timing)
- Given a mobile viewport (<768px), when depth transitions play, then a drawer menu pattern is used rather than a side hamburger (per DEC-spiritual-tech-interactions mobile nav)

## Related Constraints

- [CON-dark-luxury-aesthetic](../constraints/CON-dark-luxury-aesthetic.md) — transition animations must use obsidian/gold palette; no bright flashes
