# REQ-USA-profile-incomplete-cta: Daily-pulse section shows profile-completion CTA when birth data is missing

**Type**: Usability

**Status**: Draft

**Priority**: Must-have

**Source**: [GOAL-reliable-daily-orientation](../goals/GOAL-reliable-daily-orientation.md)

**Source stakeholder**: [STK-user-free](../stakeholders.md)

## Description

When the user's birth profile is incomplete (no birth date / time / place) and no impulse content can be rendered, the daily-pulse section (`DailyChartHero` Section D, eventually `TagespulsCard`) must display an explicit profile-completion CTA — not generic content, not silence. The CTA invokes the profile-completion flow (`onCompleteProfile` callback). This requirement codifies the behavior already implemented in TASK-D1.

## Acceptance Criteria

- Given the user has incomplete birth data and no daily impulse is available (`profileIncomplete && !hasImpuls`), when the dashboard renders, then `DailyChartHero` Section D shows a profile-completion CTA labeled with locale-appropriate copy.
- Given the user clicks the profile-completion CTA, when the click handler runs, then `onCompleteProfile` is invoked, taking the user to the profile-completion flow.
- Given the user has complete birth data, when the dashboard renders, then no profile-completion CTA is shown in Section D (live or fallback impulse content takes precedence).
- The CTA does not appear elsewhere in the dashboard outside the daily-pulse section (no double-prompting).

## Related Constraints

- [CON-degraded-state-transparency](../constraints/CON-degraded-state-transparency.md) — empty / incomplete state must be visibly distinguished from a real impulse.
