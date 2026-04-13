# US-daily-impact-only-call: Optional Impact-Only Endpoint Without Narratives

**Status**: Draft

**Source**: [GOAL-daily-chart-coherence-first](../goals/GOAL-daily-chart-coherence-first.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## User Story

As the frontend, I want to optionally call POST /impact/active directly when I only need structured data (planet cards, harmony index) without LLM-generated narratives, so that planet cards can be refreshed quickly without triggering a full Gemini generation cycle.

## Acceptance Criteria

- [ ] POST `/impact/active` returns a complete `ACTIVE_IMPACTS_v1` response with no LLM fields
- [ ] The response time for `/impact/active` is ≤800ms p95 (compared to ≤2s for full `/experience/daily`)
- [ ] The hook `useActiveImpacts()` can call this endpoint independently from `useDailyExperience()`

## Related Artifacts

- Requirements: [REQ-F-impact-active-endpoint](../requirements/REQ-F-impact-active-endpoint.md), [REQ-PERF-impact-active-response-time](../requirements/REQ-PERF-impact-active-response-time.md)
