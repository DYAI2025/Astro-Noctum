# REQ-F-impact-active-endpoint: POST /impact/active Endpoint

**Type**: Functional

**Status**: Implemented

**Priority**: Must-have

**Source**: [US-daily-active-planets](../user-stories/US-daily-active-planets.md), [US-daily-impact-only-call](../user-stories/US-daily-impact-only-call.md), [GOAL-daily-chart-coherence-first](../goals/GOAL-daily-chart-coherence-first.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

FuFirE exposes a new endpoint `POST /impact/active` that returns structured impact data without any LLM-generated narrative fields. The response schema is `ACTIVE_IMPACTS_v1` and includes: `harmony_index` (0–100), `active_planets[]` (filtered to orb ≤ 8°), `resonance_badges[]`, and per-planet fields: `planet`, `strength` (0–1), `bazi_resonance`, `wu_xing_element`, `aspect_type`, `orb` (degrees).

## Acceptance Criteria

- Given a valid POST to `/impact/active` with `{ soulprint_sectors, natal_chart }` payload, when the request is processed, then the response matches `ACTIVE_IMPACTS_v1` schema.
- Given the endpoint response, when `active_planets` is inspected, then all returned planets have `orb ≤ 8.0` degrees.
- Given the endpoint response, when the response is inspected, then no LLM-generated text fields are present (no `fusion.synthesis`, no `fusion.action`, no `narrative`).
- Given `harmony_index` in the response, when rendered, then the value is a number in the range 0–100.
- Given `resonance_badges[]` in the response, when inspected, then each badge has `resonance_type` and `intensity` fields.

## Related Assumptions

- [ASM-noaa-in-fufre](../assumptions/ASM-noaa-in-fufre.md) — harmony_index formula requires solar_pressure from NOAA; assumes FuFirE has this data available.
