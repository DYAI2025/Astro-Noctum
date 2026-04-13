# US-daily-coherence-visibility: Coherence Index Above Fold on Dashboard Load

**Status**: Draft

**Source**: [GOAL-daily-chart-coherence-first](../goals/GOAL-daily-chart-coherence-first.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## User Story

As a user, I want to see my harmony index immediately when I open the dashboard, so that I know how my day looks energetically without scrolling.

## Acceptance Criteria

- [ ] KohaerenzHero is the first section after the page header (above all other content)
- [ ] Harmony index (0–100 integer) is visible in an SVG ring above the fold on a 375px viewport
- [ ] A neutral label describes the range: "Hohe Übereinstimmung" (70–100), "Mittlere Übereinstimmung" (40–69), "Niedrige Übereinstimmung" (0–39)
- [ ] A driver strip shows 4 pills (Geomagnetik, Solardruck, Transit-Resonanz, Tagesfeld) with calm/active/tense colour coding
- [ ] A skeleton loader is shown while data is loading (no layout shift)
- [ ] The component renders correctly in both dark (Planetarium) and light (Morning) mode

## Related Artifacts

- Requirements: [REQ-F-daily-chart-coherence-hero](../requirements/REQ-F-daily-chart-coherence-hero.md), [REQ-F-daily-chart-dashboard-order](../requirements/REQ-F-daily-chart-dashboard-order.md), [REQ-F-coherence-hero-impact-datasource](../requirements/REQ-F-coherence-hero-impact-datasource.md)
