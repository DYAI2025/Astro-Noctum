# REQ-F-active-planets-frontend: Planet Cards from Impact Data

**Type**: Functional

**Status**: Draft

**Priority**: Must-have

**Source**: [US-daily-active-planets](../user-stories/US-daily-active-planets.md), [US-daily-planet-transparency](../user-stories/US-daily-planet-transparency.md), [GOAL-daily-chart-coherence-first](../goals/GOAL-daily-chart-coherence-first.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## Description

The dashboard renders planet cards sourced from the `active_planets[]` array returned by the Impact endpoint or the daily experience endpoint (when `include: ["impact"]` is used). Only planets present in the response are displayed — not a static set of 6. Each card shows: planet name, strength (as a visual indicator), BaZi resonance label, Wu-Xing element, aspect type, and orb in degrees.

## Acceptance Criteria

- Given the Impact endpoint returns 3 active planets, when the dashboard renders, then exactly 3 planet cards are displayed (no static placeholders for inactive planets).
- Given a planet card, when rendered, then it displays: planet name, strength visual indicator, BaZi resonance label, and aspect type + orb value.
- Given orb is displayed, when rendered, then it is shown with its unit (e.g., "2.4°") per CON-no-unexplained-numbers.
- Given the Impact endpoint returns an empty `active_planets[]`, when the dashboard renders, then a meaningful empty state is shown (no broken UI).
- Given the hook `useActiveImpacts()` fetches from POST `/impact/active`, when it is called, then it operates independently of `useDailyExperience()` (no shared request dependency).

## Related Constraints

- [CON-no-unexplained-numbers](../constraints/CON-no-unexplained-numbers.md) — orb and strength values must be labelled.
