# REQ-F-daily-chart-coherence-hero: Unified Daily Chart Hero

**Type**: Functional

**Status**: Draft

**Priority**: Must-have

**Source**: [US-daily-coherence-visibility](../user-stories/US-daily-coherence-visibility.md), [GOAL-daily-chart-coherence-first](../goals/GOAL-daily-chart-coherence-first.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## Description

The dashboard shall render one unified Daily Chart hero as the first section after the page header. This hero replaces the current split top-card layout and contains: (1) the coherence visualization, (2) today's daily impulse, (3) active planetary influences, and (4) the compact driver/evidence strip.

## Acceptance Criteria

- Given a user opens the dashboard, when the first viewport renders, then a single elevated Daily Chart card is shown instead of separate top cards for coherence, active influences, and day impulse.
- Given the Daily Chart hero is rendered, when the user scans it without opening details, then the following are visible above the fold on a 375px viewport: coherence visualization, daily impulse headline, and active planets summary.
- Given the coherence visualization is rendered, when a numerical value is shown, then it is accompanied by an inline meaning label and a short explanatory sentence.
- Given the old qualitative range labels are available, when the new hero renders, then labels such as "Mittlere Übereinstimmung" are not used as the primary explanation of the coherence state.
- Given the Daily Chart hero is rendered in Bright mode, when visually inspected, then card background, text, borders, and active accents use bright-mode tokens with readable contrast.
- Given the Daily Chart hero is rendered in Dark mode, when visually inspected, then card background, text, borders, and active accents use dark-mode tokens with readable contrast and no white-on-white failure.
- Given data is still loading, when the hero mounts, then a skeleton state preserves layout without shifting the first viewport.

## Related Constraints

- [CON-no-unexplained-numbers](../constraints/CON-no-unexplained-numbers.md) — numerical value must be visually contextualised, not shown as a bare integer.
