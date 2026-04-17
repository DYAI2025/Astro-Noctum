# REQ-USA-daily-chart-responsive-readability: Daily Chart Readability Across Mobile and Desktop

**Type**: Usability

**Status**: Approved

**Priority**: Must-have

**Source**: [GOAL-daily-chart-coherence-first](../goals/GOAL-daily-chart-coherence-first.md), [CON-mobile-first-readability](../constraints/CON-mobile-first-readability.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## Description

The Daily Chart hero shall remain readable, scannable, and interaction-safe across mobile and desktop breakpoints. The mobile layout is primary.

## Acceptance Criteria

- Given a 375px-wide viewport, when the Daily Chart hero renders, then coherence, the daily impulse headline, and the active-planet compact summary are readable without horizontal scrolling.
- Given a 375px-wide viewport, when detail layers are collapsed, then the first viewport remains visually stable and does not exceed a reasonable above-the-fold height budget for quick scanning.
- Given a user opens an explanation or "Warum?" area on mobile, when the panel expands, then text wraps cleanly and no metric is truncated behind overflow.
- Given Bright and Dark mode are both supported, when the hero is rendered in either mode, then text contrast and affordance visibility remain WCAG-compliant for the card's primary text and controls.
- Given desktop width is available, when the layout reflows, then the logic and data remain unchanged and only density / arrangement may increase.
