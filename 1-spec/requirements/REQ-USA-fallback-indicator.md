# REQ-USA-fallback-indicator: Visible fallback indicator on degraded daily content

**Type**: Usability

**Status**: Draft

**Priority**: Must-have

**Source**: [GOAL-reliable-daily-orientation](../goals/GOAL-reliable-daily-orientation.md)

**Source stakeholder**: [STK-user-free](../stakeholders.md)

## Description

Whenever the daily-pulse / daily-chart UI surfaces content produced by `buildFallbackDaily()` (i.e., when `dailyData.meta.engine_version === 'v1-local-fallback'`), the UI must render a visible, low-prominence indicator informing the user that the content is generic / unavailable rather than personalized live output. The indicator pattern follows TASK-D2: small caption under the impulse text, low-opacity, locale-aware (DE/EN), with `data-testid="fallback-indicator"` for test verification.

## Acceptance Criteria

- Given a real API response (`engine_version` ≠ `'v1-local-fallback'`) is delivered to `DailyChartHero`, when the impulse section renders, then no fallback indicator is shown.
- Given a fallback response (`engine_version === 'v1-local-fallback'`) is delivered, when the impulse section renders, then a fallback indicator is shown directly under the impulse text with locale-appropriate copy ("↻ Heute nicht verfügbar — generischer Inhalt" / "↻ Unavailable today — generic content").
- The fallback indicator carries `data-testid="fallback-indicator"` for automated verification.
- The fallback indicator is visually subtle (low opacity, secondary text color) — informative, not alarmist.
- The fix passes `tsc --noEmit` without new errors.

## Related Constraints

- [CON-degraded-state-transparency](../constraints/CON-degraded-state-transparency.md) — this requirement is the reference implementation of the constraint for the daily-pulse surface.
