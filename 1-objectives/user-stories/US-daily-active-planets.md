# US-daily-active-planets: Personally Relevant Planets from Natal Chart

**Status**: Draft

**Source**: [GOAL-daily-chart-coherence-first](../goals/GOAL-daily-chart-coherence-first.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## User Story

As a user, I want to see which planets are specifically affecting me today (filtered against my natal chart), so that I understand which energies are acting on me personally — not a generic 6-planet list.

## Acceptance Criteria

- [ ] Only planets with a transit orb ≤ 8° to a natal planet or angle are shown (0 to 6 cards, not always 6)
- [ ] Each card shows: planet name (German), aspect type, orb value, strength indicator (hoch/mittel/gering)
- [ ] A retrograde indicator (℞) is shown when `is_retrograde: true`
- [ ] Empty state text when no planets qualify: "Heute keine starken Planeteneinflüsse auf dein Chart"
- [ ] Cards are ordered by strength (high first), then by orb ascending

## Related Artifacts

- Requirements: [REQ-F-active-planets-frontend](../requirements/REQ-F-active-planets-frontend.md), [REQ-F-impact-active-endpoint](../requirements/REQ-F-impact-active-endpoint.md)
