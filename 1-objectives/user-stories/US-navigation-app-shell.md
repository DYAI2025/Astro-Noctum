# US-navigation-app-shell: Consistent App-Shell Navigation Across All Pages

**Status**: Draft

**Source**: [GOAL-navigation-app-shell-consistency](../goals/GOAL-navigation-app-shell-consistency.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md), [STK-product-owner](../stakeholders.md)

## User Story

As a user navigating between Dashboard, Signatur, Sky, Wu-Xing, and Wissen, I want the top navigation to behave identically on every page, so that I always know where I am, how to get back to the Dashboard, and what each control does — without confusing the Planetarium/Solar-System mode toggle for a navigation link.

## Acceptance Criteria

- [ ] Every authenticated page renders the same navigation shell (same items, same order, same hit targets) — no page-specific overrides.
- [ ] The currently active route is visually highlighted (accent colour or underline) and is not clickable (no self-navigation).
- [ ] A "Dashboard" / "Tageschart" link is present in the shell on every page and reliably navigates to `/`.
- [ ] The Planetarium/Solar-System toggle is visually distinct from navigation links (icon-only or clearly labelled as a theme/mode control) and cannot be confused with a route link.
- [ ] The Mode toggle inside the Settings menu uses icons only (Moon/Sun) without redundant text labels.
- [ ] The Astro-Agents navigation entry exposes both agents (Levi + Eve) — not just one.
- [ ] Navigation is fully usable on a 375px viewport without horizontal scroll or clipped items.

## Related Artifacts

- Requirements: [REQ-F-navigation-redesign](../requirements/REQ-F-navigation-redesign.md), [REQ-F-navigation-shell](../requirements/REQ-F-navigation-shell.md)
- Constraints: [CON-mobile-first-readability](../constraints/CON-mobile-first-readability.md)
- QA Findings: QA-6, QA-16, QA-19, QA-20, QA-21, QA-22
