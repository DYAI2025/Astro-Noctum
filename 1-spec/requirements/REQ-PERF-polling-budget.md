# REQ-PERF-polling-budget: Aggregate client polling stays under ~1000 requests / 15 minutes / dashboard mount

**Type**: Performance

**Status**: Draft

**Priority**: Should-have

**Source**: [GOAL-sustainable-client-polling](../goals/GOAL-sustainable-client-polling.md)

**Source stakeholder**: [STK-ben](../stakeholders.md)

## Description

Across all polling hooks active on a single dashboard mount, the aggregate request volume to backend APIs must remain under ~1000 requests per 15-minute window per user under typical interaction patterns. This is the operational ceiling — individual hooks should target much lower frequencies. The metric is observed via either (a) instrumented network tracing on a representative simulated session, or (b) backend request logs filtered by client session ID.

This requirement supersedes the current implementation pattern where `useSignaturSignal` polls every 800 ms (which alone would exceed budget by an order of magnitude in a single 15-min window).

## Acceptance Criteria

- Given a representative simulated session (typical browsing pattern: dashboard load, scroll, idle, occasional interaction), when run for 15 minutes, then the aggregate count of client → backend API requests is < 1000.
- Given the new `useSignaturSignal` baseline interval is 15 s (per dev brief TASK-5.1), when measured, then it produces ≤60 requests per 15 minutes (single hook in isolation).
- Given other polling hooks are inventoried, when their intervals are summed against the budget, then the total fits within 1000 / 15 min.
- Given the budget is exceeded by a new hook, when added in a PR, then the PR is rejected at review unless the addition is offset by reducing another hook's frequency.
- Telemetry is in place to alert when production users actually exceed the budget (server-side observation).

## Related Constraints

- [CON-greenops-polling-budget](../constraints/CON-greenops-polling-budget.md)
