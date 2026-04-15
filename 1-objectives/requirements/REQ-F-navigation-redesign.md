# REQ-F-navigation-redesign: App-Shell Navigation Redesign

**Type**: Functional

**Status**: Draft

**Priority**: Must-have

**Source**: [GOAL-navigation-app-shell-consistency](../goals/GOAL-navigation-app-shell-consistency.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## Description

The header navigation shall provide clear, consistent routing across all pages with an always-visible Dashboard link, active-route highlighting, a non-confusing mode toggle, and an Agents panel showing all available agents.

## Acceptance Criteria

- Given the user is on any page, when they look at the header, then a "Dashboard" or "Tageschart" link is visible that navigates to `/`.
- Given the user is on `/signatur`, when they look at the header, then the "Signatur" tab is visually highlighted (active state) and not clickable.
- Given the user clicks "Planetarium" in the header, when the click is processed, then the dark/bright mode toggles without navigation — and the button visually indicates it is a theme toggle, not a page link.
- Given the Settings menu is open, when the mode toggle is visible, then only Moon/Sun icons are shown without "Planetarium"/"Solar System" text labels.
- Given the user clicks "Astro-Agents" in the header, when the panel opens, then both Levi and Eve agents are visible and callable.
- Given the header renders on mobile (375px), when inspected, then no horizontal overflow occurs and all nav items remain accessible.

## Related Constraints

- [CON-mobile-first-readability](../constraints/CON-mobile-first-readability.md)
