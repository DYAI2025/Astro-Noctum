# REQ-F-coherence-hero-impact-datasource: Coherence Baseline, Daily Activation, and Driver Evidence

**Type**: Functional

**Status**: Approved

**Priority**: Must-have

**Source**: [US-daily-coherence-visibility](../user-stories/US-daily-coherence-visibility.md), [US-daily-cosmic-weather](../user-stories/US-daily-cosmic-weather.md), [GOAL-daily-chart-coherence-first](../goals/GOAL-daily-chart-coherence-first.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## Description

The coherence display shown in the Daily Chart hero shall be sourced from structured impact data that separates a stable personal baseline from today's positive activation overlay. The displayed coherence value is not a generic label and not an opaque single-score calculation.

## Acceptance Criteria

- Given the Daily Chart hero renders coherence, when the value is inspected, then the payload exposes `base_coherence`, `positive_daily_delta`, and `displayed_coherence`.
- Given `base_coherence` is present, when the user views the coherence explanation, then it is described as the user's stable cross-system baseline that today's state cannot undercut within the UI model.
- Given `positive_daily_delta` is present, when the ring renders, then the additional positive activation is visually distinguished from the baseline segment.
- Given the driver strip is rendered, when values are shown, then the UI displays the real current values for at least: geomagnetic Kp, solar pressure, transit activity, and day-field state.
- Given a driver value is displayed, when the user opens the explanation layer, then the UI states what the driver means and how it contributes to today's coherence context.
- Given any driver is unavailable, when the hero renders, then the UI marks it as unavailable or delayed rather than fabricating a placeholder value.

## Related Assumptions

- [ASM-noaa-in-fufre](../assumptions/ASM-noaa-in-fufre.md) — **Invalidated.** FuFirE does not have NOAA data. Resolved: solar_pressure is provided via server-side spaceWeatherCache pass-through (`server.mjs /api/space-weather/extended`).

## Related Constraints

- [CON-no-unexplained-numbers](../constraints/CON-no-unexplained-numbers.md) — the harmony_index value must be accompanied by a contextualising label in the UI.
