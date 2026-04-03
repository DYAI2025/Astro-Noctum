# REQ-F-dashboard-identity-cards: Dashboard Identity Cards

**Type**: Functional

**Status**: Draft

**Priority**: Should-have

**Source**: [GOAL-autopoietic-ux](../goals/GOAL-autopoietic-ux.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## Description

The Dashboard must present the user's core identity markers as a coherent identity card set. The set includes Sun Sign, Moon Sign, Ascendant, Year Animal, and Wu-Xing Element. Each card may have its own visual motif tied to its content, but all cards must use the same dashboard design language so the set reads as one family rather than isolated tiles.

## Acceptance Criteria

- Given the Dashboard loads and identity data is available, when the identity summary is rendered, then exactly five cards are shown: Sun Sign, Moon Sign, Ascendant, Year Animal, and Wu-Xing Element
- Given the identity card set is rendered on desktop, when visually inspected, then card height, heading baseline, spacing, border radius, and content alignment are consistent across all five cards
- Given the identity card set is rendered on mobile, when the viewport is narrow, then the cards collapse into a responsive grid or stack without truncating the primary label or the primary value
- Given a card is rendered in Dark mode or Bright mode, when theme tokens are applied, then typography, contrast, and component styling remain part of the same dashboard card system
- Given data for one identity marker is temporarily unavailable, when the corresponding card is rendered, then the card shows a truthful fallback state and never an indefinite "still calculating" placeholder
- Given a user opens the Dashboard for the first time, when the identity cards are rendered, then no card appears visually isolated, undersized, or stylistically detached from the surrounding dashboard sections

## Related Constraints

- [CON-dark-luxury-aesthetic](../constraints/CON-dark-luxury-aesthetic.md)
- [CON-mobile-first-readability](../constraints/CON-mobile-first-readability.md)

## Related Artifacts

- [REQ-F-astro-card-detail-view](REQ-F-astro-card-detail-view.md)
