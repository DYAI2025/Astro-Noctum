# REQ-F-coherence-hero-impact-datasource: Coherence hero impact datasource

**Type**: Functional

**Status**: Approved

**Priority**: Must-have

**Source**: [GOAL-daily-chart-coherence-first](../goals/GOAL-daily-chart-coherence-first.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

The daily coherence hero must consume a single canonical impact payload:

- Primary source: `GET /impact/active`.
- Fallback source: `GET /experience/daily` only when `impact/active` is unavailable.
- `space_weather` in the UI must be read from the selected impact payload, never fetched independently by a separate hook in the same render path.

`harmony_index` is defined as a normalized float in `[0.0, 1.0]`.

## Acceptance Criteria

- Given `impact/active` responds successfully, when rendering the coherence hero, then all impact and `space_weather` fields are read from that payload.
- Given `impact/active` fails, when rendering the coherence hero, then the UI uses `experience/daily` as fallback and labels telemetry source as fallback.
- Given any downstream mapping, when `harmony_index` is handled, then values outside `[0.0, 1.0]` are rejected or clamped before use.
