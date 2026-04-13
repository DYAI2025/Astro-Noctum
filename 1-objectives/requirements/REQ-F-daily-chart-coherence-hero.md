# REQ-F-daily-chart-coherence-hero: Kohärenzindex + Day Mode Above the Fold

**Type**: Functional

**Status**: Implemented

**Priority**: Must-have

**Source**: [US-daily-coherence-visibility](../user-stories/US-daily-coherence-visibility.md), [GOAL-daily-chart-coherence-first](../goals/GOAL-daily-chart-coherence-first.md)

**Source stakeholder**: [STK-end-user](../stakeholders.md)

## Description

The Kohärenzindex value (0–100) and the Day Mode label (e.g., "Mars-Tag") must be visible in the user's viewport on first dashboard load, without requiring any scroll action. These elements are the primary value signal on the page.

## Acceptance Criteria

- Given a user loads the dashboard on any common viewport (375px width and above), when the page finishes rendering, then the Kohärenzindex numerical value and its label are visible without scrolling.
- Given a user loads the dashboard, when the page finishes rendering, then the Day Mode label is visible without scrolling.
- Given the Kohärenzindex is 0–100, when it is rendered, then the value is accompanied by a label or visual indicator that contextualises the number (per CON-no-unexplained-numbers).

## Related Constraints

- [CON-no-unexplained-numbers](../constraints/CON-no-unexplained-numbers.md) — numerical value must be visually contextualised, not shown as a bare integer.
