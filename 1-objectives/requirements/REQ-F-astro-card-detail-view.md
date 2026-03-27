# REQ-F-astro-card-detail-view: Astro Card Click Opens Full Detail View

**Type**: Functional

**Status**: Draft

**Priority**: Must-have

**Source**: [GOAL-autopoietic-ux](../goals/GOAL-autopoietic-ux.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## Description

When a user clicks the Sunsign, BaZi, or Wuxing summary tile on the Dashboard, the system must display the full content of that section via a modal, drawer, or overlay — not scroll to an anchor section on the same page.

## Acceptance Criteria

- Given the Dashboard is displayed, when the user clicks the Sunsign tile, then the full Sunsign interpretation content is shown in a modal, drawer, or overlay
- Given the Dashboard is displayed, when the user clicks the BaZi tile, then the full BaZi (Four Pillars) content is shown in a modal, drawer, or overlay
- Given the Dashboard is displayed, when the user clicks the Wuxing tile, then the full Wu-Xing element content is shown in a modal, drawer, or overlay
- No click action results in a page scroll to an unrelated section
- The detail view is dismissible (close button or backdrop click)
- Behavior is identical in Dark and Bright mode

## Related Constraints

- [CON-dark-luxury-aesthetic](../constraints/CON-dark-luxury-aesthetic.md) — detail view must use obsidian/gold palette, not generic modal styling
