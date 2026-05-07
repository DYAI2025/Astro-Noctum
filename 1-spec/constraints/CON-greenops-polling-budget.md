# CON-greenops-polling-budget: Client polling respects a frequency budget

**Category**: Operational

**Status**: Active

**Source stakeholder**: [STK-ben](../stakeholders.md)

## Description

Client-side polling hooks must respect a frequency budget per user, per dashboard mount. Concrete targets:

- **Aggregate ceiling**: across all polling hooks active on a single dashboard mount, request volume must stay under ~1000 requests / 15 minutes / user.
- **Visibility-aware**: when the document is hidden (`document.visibilityState === 'hidden'`), polling intervals extend to ≥60 seconds or pause entirely; resumption may include one immediate refresh on visibility restore.
- **No duplicate pollers**: any given external data source (e.g., Space Weather, transit signal) is polled by exactly one hook per dashboard mount; consumer components receive data via props, not via independent hook calls.
- **Event-triggered immediate refresh only**: outside the periodic interval, immediate refresh is triggered only by relevant user events (profile update, quiz completion, deliberate refresh action) — never on idle ticks, mouse moves, or unrelated re-renders.

## Rationale

Existing polling implementations are aggressive (per the dev brief: `useSignaturSignal` polls every 800 ms; `MagnetsturmKarte` calls `useSpaceWeather()` independently of `Dashboard`). This produces unnecessary backend load, drains mobile-device battery, inflates infrastructure cost, and degrades responsiveness. The brief explicitly identifies these as GreenOps concerns (TASK-5.1, TASK-5.2). Treating polling as a quota-bound resource is the cheapest way to enforce discipline.

## Impact

- TASK-5.1 (transit polling) and TASK-5.2 (Space Weather deduplication) are the immediate concrete deliverables that bring existing hooks within budget.
- New polling hooks must declare their interval, hidden-state behavior, and event-trigger semantics in their PR description before being wired into the dashboard.
- WebSocket / SSE subscriptions are not exempt — they count against the same conceptual budget; long-poll variants must respect the dev brief's 30 s heartbeat / 5 min connection-cap pattern.
- Reviewing PRs that add a `useSomething()` hook to a component that's already a child of another consumer of the same data is a violation; refactor to lift the source hook upward and pass props.
