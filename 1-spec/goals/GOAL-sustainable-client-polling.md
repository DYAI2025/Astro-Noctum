# GOAL-sustainable-client-polling: Client-side polling stays within an explicit budget

**Description**: All polling hooks in the Astro-Noctum web app respect an explicit frequency budget that protects user-device resources (CPU, mobile battery), backend infrastructure cost, and overall responsiveness. Each external data source (transit signal, Space Weather, daily-pulse) is consumed by exactly one poller per dashboard mount. Tab-hidden state extends polling intervals or pauses entirely. Immediate refreshes are event-triggered (visibility-restore after hidden, profile update, quiz completion), never idle-loop driven. This goal addresses the GreenOps theme of the dev brief and the operational reality that a single user can already exceed reasonable request volumes today.

**Status**: Approved

**Priority**: Should-have

**Source stakeholder**: [STK-ben](../stakeholders.md)

## Success Criteria

- [ ] Aggregate client request volume stays under ~1000 requests / 15 minutes / dashboard mount under typical interaction (representative simulated session).
- [ ] All polling hooks declare and respect `document.visibilityState`: hidden state uses an extended interval (≥60s) or pauses; visible-state restore may include one immediate refresh.
- [ ] Each external data source has **exactly one** poller per dashboard mount; consumer components receive data via props (not via independent hook calls).
- [ ] No fire-and-forget refresh triggered by mouse moves, idle timers, scroll events, or non-data user interactions.
- [ ] New polling hooks added to the codebase declare their interval, hidden-state behavior, and event-trigger semantics in their PR description (review-time enforcement).
- [ ] WebSocket / SSE / long-poll variants follow the dev brief's pattern of 30 s heartbeat + 5 min connection-cap rather than indefinite open connections.

## Related Artifacts

- User stories: _none yet_
- Requirements: [REQ-PERF-polling-budget](../requirements/REQ-PERF-polling-budget.md), [REQ-PERF-polling-visibility](../requirements/REQ-PERF-polling-visibility.md), [REQ-MNT-single-poller-per-source](../requirements/REQ-MNT-single-poller-per-source.md)
- Constraints: [CON-greenops-polling-budget](../constraints/CON-greenops-polling-budget.md)
