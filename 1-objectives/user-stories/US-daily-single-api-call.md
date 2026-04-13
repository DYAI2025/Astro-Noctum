# US-daily-single-api-call: All Daily Chart Data in One API Call

**Status**: Draft

**Source**: [GOAL-daily-chart-coherence-first](../goals/GOAL-daily-chart-coherence-first.md)

**Source stakeholder**: [STK-product-owner](../stakeholders.md)

## User Story

As the frontend, I want to retrieve all data for the Daily Chart with a single POST /experience/daily?include=impact call, so that the number of network requests on dashboard load is minimised.

## Acceptance Criteria

- [ ] A single POST to `/experience/daily` with `include: ["impact"]` returns both narrative data and the full impact block in one response
- [ ] The frontend hook `useDailyExperience()` replaces the multi-hook assembly pattern (no separate calls for harmony index, space weather, and narrative)
- [ ] The response schema is backwards-compatible: without `include`, the response is identical to the previous v1 response

## Related Artifacts

- Requirements: [REQ-F-experience-daily-v2](../requirements/REQ-F-experience-daily-v2.md), [REQ-PERF-daily-experience-response-time](../requirements/REQ-PERF-daily-experience-response-time.md)
