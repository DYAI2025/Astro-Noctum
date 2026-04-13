# REQ-F-synastry-aspect-analysis: POST /api/synastry Interaspect Endpoint

**Type**: Functional

**Status**: Implemented

**Priority**: Must-have

**Source**: [US-synastry-aspect-analysis](../user-stories/US-synastry-aspect-analysis.md), [GOAL-synastry-compatibility](../goals/GOAL-synastry-compatibility.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## Description

`POST /api/synastry` accepts the user's natal chart and a partner's birth data, computes the interaspects via FuFirE using Placidus house system and staggered orb tolerances (Conj/Opp ±8°, Trine/Square ±6°, Sextile ±4°), and returns the aspect grid. In V1 only the 5 main aspects are included (Conjunction, Opposition, Trine, Square, Sextile). The endpoint is authenticated and reachable by both free and premium users.

## Acceptance Criteria

- Given a POST to `/api/synastry` with valid user and partner birth data, when processed, then the response includes `aspects[]` with each item containing: `planet1`, `planet2`, `aspect_type`, `orb` (degrees), `applying` (boolean).
- Given an aspect with orb value, when displayed in the UI, then the value includes its unit (e.g., "2.4°").
- Given an orb exceeding the staggered tolerance for its aspect type, when computed, then that aspect is excluded from the response.
- Given any user (free or premium), when the endpoint is called with valid auth, then the aspect grid is returned (no tier gate on the grid itself).

## Related Constraints

- [CON-no-unexplained-numbers](../constraints/CON-no-unexplained-numbers.md) — orb values must be labelled in the UI.
