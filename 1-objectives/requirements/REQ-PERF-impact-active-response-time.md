# REQ-PERF-impact-active-response-time: POST /impact/active Response Time

**Type**: Performance

**Status**: Approved

**Priority**: Must-have

**Source**: [US-daily-impact-only-call](../user-stories/US-daily-impact-only-call.md), [GOAL-daily-chart-coherence-first](../goals/GOAL-daily-chart-coherence-first.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## Description

The `POST /impact/active` endpoint must respond within 800ms at the 95th percentile (p95) under normal load. Because this endpoint returns only structured data without LLM generation, it is expected to be significantly faster than `/experience/daily`. A 15-minute server-side cache keyed on `(user_id, date)` is acceptable and expected to contribute to meeting this target.

## Acceptance Criteria

- Given 100 sequential requests to `POST /impact/active` under normal conditions, when response times are measured, then at least 95 of them complete within 800ms.
- Given a cache hit (same user, same date, within 15-minute TTL), when the endpoint is called, then the response time is ≤ 200ms p95.
- Given a cache miss (first call of the day or TTL expired), when the endpoint is called, then the response time is ≤ 800ms p95.
