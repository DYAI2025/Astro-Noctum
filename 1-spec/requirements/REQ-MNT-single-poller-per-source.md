# REQ-MNT-single-poller-per-source: Each external data source has exactly one poller per dashboard mount

**Type**: Maintainability

**Status**: Draft

**Priority**: Should-have

**Source**: [GOAL-sustainable-client-polling](../goals/GOAL-sustainable-client-polling.md)

**Source stakeholder**: [STK-ben](../stakeholders.md)

## Description

Each external data source consumed by the dashboard (e.g., Space Weather, transit signal, daily-pulse, active impacts) must have **exactly one** active polling hook per dashboard mount. Consumer components that need that data receive it via props (or through context if depth-first lifting is awkward), not by independently invoking the hook. The pattern preserved by this requirement: the `Dashboard` component (or a designated parent) is the single source of truth for each polling hook, and child components are presentational with respect to that data.

Concrete fix from dev brief: `MagnetsturmKarte` currently calls `useSpaceWeather()` independently while `Dashboard` already calls it — TASK-5.2 removes the duplicate call, making `MagnetsturmKarte` a presentational component receiving `spaceWeather` as a prop.

## Acceptance Criteria

- Given `Dashboard.tsx` calls `useSpaceWeather()`, when audited, then no descendant component independently calls `useSpaceWeather()` — they receive the value as a prop.
- Given `MagnetsturmKarte` is refactored, when reviewed, then it accepts `spaceWeather` as a prop and contains no internal hook call to `useSpaceWeather`.
- Given a new component is added that needs an existing polled data source, when reviewed, then it receives the data via props from the existing hook caller; adding a second hook call is rejected at review.
- Given the dashboard mounts, when network traffic is observed, then exactly one poller per data source is active (verifiable via instrumented test or DevTools network tab).
- Loading and error states are propagated consistently via the single hook caller (no per-component re-derivation).

## Related Constraints

- [CON-greenops-polling-budget](../constraints/CON-greenops-polling-budget.md) — duplicate pollers were the original budget violation.
