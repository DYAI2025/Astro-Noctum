# US-daily-coherence-visibility: Coherence Index Above Fold on Dashboard Load

**Status**: Draft

**Source**: [GOAL-daily-chart-coherence-first](../goals/GOAL-daily-chart-coherence-first.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## User Story

As a user, I want to see my harmony index immediately when I open the dashboard, so that I know how my day looks energetically without scrolling.

## Acceptance Criteria

- [ ] KohaerenzHero is the first section after the page header (above all other content)
- [ ] Harmony index (0–100 integer) is visible in an SVG ring above the fold on a 375px viewport
- [ ] The coherence visualization shows `base_coherence` (stable personal baseline) plus `positive_daily_delta` (today's activation), accompanied by a short explanatory sentence — not a qualitative range label like "Mittlere Übereinstimmung"
- [ ] A compact driver strip inside the Daily Chart hero shows current values for Geomagnetik (Kp), Solardruck, Transit-Resonanz, and Tagesfeld with calm/active/tense colour coding
- [ ] A skeleton loader is shown while data is loading (no layout shift)
- [ ] The component renders correctly in both dark (Planetarium) and light (Morning) mode

## Related Artifacts

- Requirements: [REQ-F-daily-chart-coherence-hero](../requirements/REQ-F-daily-chart-coherence-hero.md), [REQ-F-daily-chart-dashboard-order](../requirements/REQ-F-daily-chart-dashboard-order.md), [REQ-F-coherence-hero-impact-datasource](../requirements/REQ-F-coherence-hero-impact-datasource.md)
