# REQ-F-experience-daily-v2: POST /experience/daily with Unified Daily Chart Contract

**Type**: Functional

**Status**: Draft

**Priority**: Must-have

**Source**: [US-daily-single-api-call](../user-stories/US-daily-single-api-call.md), [US-daily-impulse-text](../user-stories/US-daily-impulse-text.md), [US-daily-action-recommendation](../user-stories/US-daily-action-recommendation.md), [GOAL-daily-chart-coherence-first](../goals/GOAL-daily-chart-coherence-first.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md), [STK-end-user](../stakeholders.md)

## Description

`POST /experience/daily` shall provide a frontend-ready contract for the unified Daily Chart hero when `include: ["impact"]` is requested. The response shall support one-pass rendering of coherence, daily impulse, active planets, and compact driver evidence.

## Acceptance Criteria

- Given a POST to `/experience/daily` with `include: ["impact"]`, when processed, then the response contains both narrative fields and a structured `impact` block sufficient to render the unified Daily Chart hero without additional mandatory calls.
- Given the `impact` block is returned, when inspected, then it includes coherence fields for baseline, positive daily delta, displayed value, and driver evidence.
- Given active planets are returned, when inspected, then each planet entry includes a compact display contract and an explanation contract for the expanded "why" state.
- Given the daily impulse text is returned, when inspected, then it explicitly references current chart/transit/cosmic-weather tendencies rather than decorative horoscope language.
- Given `fusion.synthesis` or related impulse text contains a tendency statement, when inspected, then at least one referenced tendency can be traced back to a structured impact or evidence field.
- Given the Vibes feature exists, when the daily response is rendered, then on-demand 2–3h Vibes remain a separate action flow and are not renamed or collapsed into the daily impulse contract.

## Related Constraints

- [CON-resource-oriented-framing](../constraints/CON-resource-oriented-framing.md) — all LLM-generated text must be possibility-oriented.
- [CON-german-ui](../constraints/CON-german-ui.md) — text fields in response must be in German.
- [CON-no-unexplained-numbers](../constraints/CON-no-unexplained-numbers.md) — any numerical value in synthesis text must reference a corresponding impact field.
