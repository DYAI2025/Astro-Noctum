# REQ-F-tour-overlay-state: Tour overlay visibility strictly tied to tourStep state

**Type**: Functional

**Status**: Approved

**Priority**: Must-have

**Source**: [GOAL-reliable-daily-orientation](../goals/GOAL-reliable-daily-orientation.md)

**Source stakeholder**: [STK-user-free](../stakeholders.md)

## Description

The dashboard's tour-overlay rendering decision (`isTourStepVisible` in `src/components/Dashboard.tsx`) must be tied strictly to the meaningful `tourStep` states, not to a wildcard that includes the terminal `'done'` state. The overlay must disappear after the tour completes and stay hidden across subsequent dashboard mounts (assuming tour state is persisted as completed).

## Acceptance Criteria

- Given `tourStep === 'done'`, when the dashboard renders, then no tour overlay element is in the DOM.
- Given `tourStep === 0`, when the dashboard renders, then the tour overlay is visible (initial state).
- Given `tourStep === 1` and the step-1 sentinel has been scrolled into view, when the dashboard renders, then the tour overlay is visible.
- Given `tourStep === 1` and the step-1 sentinel has not been reached, when the dashboard renders, then the tour overlay is not visible.
- The fix passes `tsc --noEmit` without new errors.
