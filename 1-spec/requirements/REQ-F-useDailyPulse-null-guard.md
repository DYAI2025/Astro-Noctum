# REQ-F-useDailyPulse-null-guard: useDailyPulse hook handles null birthData explicitly

**Type**: Functional

**Status**: Draft

**Priority**: Should-have

**Source**: [GOAL-aphorism-personalized-interpretation](../goals/GOAL-aphorism-personalized-interpretation.md)

**Source stakeholder**: [STK-user-free](../stakeholders.md)

## Description

The new `useDailyPulse(userId, birthData, locale)` hook (`src/hooks/useDailyPulse.ts`) must explicitly handle the case where `birthData === null` — i.e., when the user's profile is incomplete and no birth-data-derived API call is possible. The hook returns a defined zero-value shape (`{ pulse: null, isFallback: false, loading: false, council: [], interpretation: null, ... }`) rather than throwing, retrying indefinitely, or returning `undefined`. Consumer components (`TagespulsCard`) receive this state and render the empty / profile-completion path. Silent hook exits (returning early without a defined shape) are not permitted.

## Acceptance Criteria

- Given `birthData === null`, when `useDailyPulse` is called, then it returns immediately with `pulse: null, isFallback: false, loading: false, council: [], interpretation: null`.
- Given `birthData === null`, when the hook returns, then it has not made any network request to `/v1/users/:userId/daily-pulse`.
- Given `birthData` becomes non-null after a profile-completion flow, when the hook re-runs, then it fetches the daily-pulse endpoint normally.
- Given an API error occurs (network failure, 5xx), when the hook handles it, then `pulse` is set to a fallback pulse value and `isFallback === true`; the consumer renders the visible-fallback indicator (per [REQ-USA-fallback-indicator](REQ-USA-fallback-indicator.md)).
- Given the hook is consumed in `TagespulsCard`, when `pulse: null` and `birthData === null`, then the card renders the profile-completion empty state.
- Tests cover the null path, the fetch path, and the error path.
