# REQ-PERF-polling-visibility: Polling hooks respect document visibility state

**Type**: Performance

**Status**: Draft

**Priority**: Should-have

**Source**: [GOAL-sustainable-client-polling](../goals/GOAL-sustainable-client-polling.md)

**Source stakeholder**: [STK-ben](../stakeholders.md)

## Description

Every client-side polling hook must observe `document.visibilityState` and adjust its behavior when the tab is hidden. Two acceptable patterns:

- **Pause:** stop polling entirely while `visibilityState === 'hidden'`; resume on visibility restore.
- **Extend interval:** increase the polling interval to ≥60 s (or some hook-specific floor longer than the visible-state baseline) while hidden; restore the visible interval on visibility restore.

A `visibilitychange` event listener triggers an immediate refresh on visibility restore (one-shot, not a loop), so the user sees current data within seconds of returning to the tab. Hooks that ignore visibility state or poll at the same aggressive rate while hidden are violations.

## Acceptance Criteria

- Given a polling hook is active in a hidden tab, when polling is observed, then the request rate is ≥60 s between requests, or zero (paused).
- Given the tab transitions from hidden to visible, when the `visibilitychange` event fires, then the hook performs at most one immediate refresh and resumes its visible-state interval.
- Given the hook is in `pause` mode and the tab becomes hidden, when polling is observed, then no requests are made until visibility is restored.
- Given any new polling hook lands in the codebase, when its source is read, then it includes either visibility-aware logic inline or composes a shared helper that provides it.
- Tests cover the hidden-state behavior and the visibility-restore one-shot.

## Related Constraints

- [CON-greenops-polling-budget](../constraints/CON-greenops-polling-budget.md)
