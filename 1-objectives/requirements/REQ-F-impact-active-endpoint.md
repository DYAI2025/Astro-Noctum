# REQ-F-impact-active-endpoint: Active impact endpoint contract

**Type**: Functional

**Status**: Approved

**Priority**: Must-have

**Source**: [GOAL-daily-chart-coherence-first](../goals/GOAL-daily-chart-coherence-first.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

`GET /impact/active` must be the preferred API contract for daily coherence consumption.

Contract clarifications:

- `harmony_index`: float in `[0.0, 1.0]`.
- `space_weather`: object embedded in endpoint response and treated as canonical when endpoint is available.
- Any percentage representation must be named `harmony_percent` and derived as `round(harmony_index * 100)`.

## Acceptance Criteria

- Given API documentation for impact endpoints, when reviewed, then `harmony_index` is consistently described as `[0.0, 1.0]`.
- Given client implementations need percentage display, when transforming data, then they derive `harmony_percent` from `harmony_index` rather than overloading field meaning.
