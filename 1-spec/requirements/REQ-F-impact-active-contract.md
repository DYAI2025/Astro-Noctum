# REQ-F-impact-active-contract: /api/impact/active contract is documented and consumers don't dual-source coherence values

**Type**: Functional

**Status**: Approved

**Priority**: Must-have

**Source**: [GOAL-reliable-daily-orientation](../goals/GOAL-reliable-daily-orientation.md)

**Source stakeholder**: [STK-ben](../stakeholders.md)

## Description

The `POST /api/impact/active` endpoint contract must be unambiguously documented in code: whether the request body is required (request-driven) or whether the server resolves the user profile from session/userId (server-profile-driven). The current `useActiveImpacts()` hook sends `body: '{}'`, which is only correct under the server-profile-driven contract. Once documented, all consumers of `baseCoherence`, `positiveDailyDelta`, and `displayedCoherence` must source these values exclusively from `useActiveImpacts()` — no parallel computation or duplication in `DailyChartHero` or any other consumer. Degraded states (data unavailable) must be surfaced as `isUnavailable` boolean or rendered as `—`, never as `0` masquerading as a real reading.

## Acceptance Criteria

- Given the `useActiveImpacts()` hook source file, when read, then a top-of-file or call-site comment documents whether the contract is server-profile-driven (empty body) or request-driven (body contains birth data); the comment cites the server endpoint as the source of truth.
- Given any component rendering coherence values, when audited, then it sources `baseCoherence`, `positiveDailyDelta`, and `displayedCoherence` from a single call to `useActiveImpacts()` (either directly or via props) — no parallel hook or local computation produces these values.
- Given the API returns no coherence data (or returns an explicit unavailable marker), when the consuming component renders, then it shows `—` or an `isUnavailable` UI affordance, not the literal `0`.
- Given `useSpaceWeather` returns no Kp index, when the driver strip renders, then it shows `—`, not `0`.
- The fix passes `tsc --noEmit` without new errors.

## Related Constraints

- [CON-degraded-state-transparency](../constraints/CON-degraded-state-transparency.md) — degraded values must be visibly distinguished from real readings.
