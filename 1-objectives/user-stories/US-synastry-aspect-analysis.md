# US-synastry-aspect-analysis: Synastry Aspect Grid

**Status**: Draft

**Source**: [GOAL-synastry-compatibility](../goals/GOAL-synastry-compatibility.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## User Story

As a user, I want to see the interaspects between my natal chart and a partner's natal chart (aspect type, orb, interpretation direction), so that I can understand the structural dynamics of our relationship.

## Acceptance Criteria

- [ ] Aspects are computed server-side via POST /api/synastry using staggered orb tolerances per DEC-aspect-orb-tolerances
- [ ] The response includes: planet pair, aspect type, orb value (degrees), and applying/separating flag
- [ ] Only the 5 main aspects are shown in V1 (Conjunction, Opposition, Trine, Square, Sextile)
- [ ] Aspect grid is visible to all users (free and premium)
- [ ] Orb values are displayed with unit (e.g., "2.4°") per CON-no-unexplained-numbers

## Related Artifacts

- Requirements: [REQ-F-synastry-aspect-analysis](../requirements/REQ-F-synastry-aspect-analysis.md)
