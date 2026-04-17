# REQ-F-active-planets-frontend: Signatur-Aligned Active Planet Cards in Daily Chart

**Type**: Functional

**Status**: Approved

**Priority**: Must-have

**Source**: [US-daily-active-planets](../user-stories/US-daily-active-planets.md), [US-daily-planet-transparency](../user-stories/US-daily-planet-transparency.md), [GOAL-daily-chart-coherence-first](../goals/GOAL-daily-chart-coherence-first.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## Description

The dashboard shall render active planets inside the Daily Chart hero using the same semantic structure and visual language as the Signatur page. Each planet card shall communicate the planet name, the planet's semantic quality, current strength, and an expandable explanation of why the influence is active for this user today.

## Acceptance Criteria

- Given the response contains active planets, when the Daily Chart hero renders, then each active planet is visible at first glance with its name and current strength state.
- Given a planet card is rendered, when the compact state is shown, then it displays: planet name, semantic quality label, and strength indicator.
- Given a planet card is expanded, when the user opens "Warum?", then the UI displays an evidence-backed explanation sentence describing the transit relation to the user's natal chart.
- Given the API provides planet imagery or a stable local mapping exists, when the card is rendered, then the visual motif aligns with the Signatur page's planet representation rather than a generic placeholder style.
- Given multiple active planets are returned, when cards are ordered, then higher strength planets appear first.
- Given no active planets qualify, when the section renders, then a meaningful neutral empty state is shown instead of blank space or fake cards.
- Given the card is rendered on mobile, when details are collapsed, then the compact card remains readable without horizontal overflow.

## Related Constraints

- [CON-no-unexplained-numbers](../constraints/CON-no-unexplained-numbers.md) — orb and strength values must be labelled.
