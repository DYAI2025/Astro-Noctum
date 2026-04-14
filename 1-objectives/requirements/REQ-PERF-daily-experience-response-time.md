# REQ-PERF-daily-experience-response-time: POST /experience/daily Response Time

**Type**: Performance

**Status**: Implemented

**Priority**: Must-have

**Source**: [US-daily-single-api-call](../user-stories/US-daily-single-api-call.md), [GOAL-daily-chart-coherence-first](../goals/GOAL-daily-chart-coherence-first.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

The `POST /experience/daily` endpoint (including the v2 variant with `include: ["impact"]`) must respond within 2 seconds at the 95th percentile (p95) under normal load. This budget covers LLM generation for `fusion.synthesis` (and `fusion.action` for premium), plus the Impact block when requested.

## Acceptance Criteria

- Given 100 sequential requests to `POST /experience/daily` (with or without `include: ["impact"]`) under normal conditions, when response times are measured, then at least 95 of them complete within 2000ms.
- Given a cached daily response (same user, same date, within TTL), when the endpoint is called, then the response time is ≤ 400ms p95.
- Given an LLM timeout or error, when the endpoint is called, then the response falls back to a German fallback text within the 2s budget — no 504 timeout is returned to the client.
