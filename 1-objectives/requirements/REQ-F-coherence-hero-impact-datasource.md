# REQ-F-coherence-hero-impact-datasource: Kohärenzindex Sourced from Impact Data

**Type**: Functional

**Status**: Draft

**Priority**: Must-have

**Source**: [US-daily-coherence-visibility](../user-stories/US-daily-coherence-visibility.md), [US-daily-cosmic-weather](../user-stories/US-daily-cosmic-weather.md), [GOAL-daily-chart-coherence-first](../goals/GOAL-daily-chart-coherence-first.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## Description

The Kohärenzindex displayed in the dashboard hero is derived from `impact.harmony_index`, which is computed server-side using the formula: `harmony_index = round(harmony * 0.65 + solar_pressure * 0.35)`. The weights (0.65 / 0.35) are configurable via environment variable. The value is not a static mock, a random number, or a carry-over from a different data source.

## Acceptance Criteria

- Given the dashboard renders the Kohärenzindex, when the value is inspected, then it equals the `harmony_index` field from the most recent Impact API response for the authenticated user.
- Given the harmony_index formula, when `solar_pressure` input changes, then the Kohärenzindex changes accordingly on next fetch (no stale cache beyond TTL).
- Given the environment variable for formula weights is updated, when the server restarts, then the new weights are used — no code change required.
- Given `harmony_index` is derived from `solar_pressure`, when solar pressure data is unavailable, then the system falls back to `harmony * 1.0` (solar_pressure treated as 0) rather than returning an error.

## Related Assumptions

- [ASM-noaa-in-fufre](../assumptions/ASM-noaa-in-fufre.md) — solar_pressure component of harmony_index requires NOAA data to be available inside FuFirE.

## Related Constraints

- [CON-no-unexplained-numbers](../constraints/CON-no-unexplained-numbers.md) — the harmony_index value must be accompanied by a contextualising label in the UI.
