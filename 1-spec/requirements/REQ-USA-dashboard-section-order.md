# REQ-USA-dashboard-section-order: Dashboard sections render in the agreed information hierarchy

**Type**: Usability

**Status**: Draft

**Priority**: Should-have

**Source**: [GOAL-reliable-daily-orientation](../goals/GOAL-reliable-daily-orientation.md)

**Source stakeholder**: [STK-user-free](../stakeholders.md)

## Description

The dashboard sections must render in a fixed information hierarchy that supports the goal of answering "what's today / what does it mean for me / what can I do" within the first viewport. The agreed top-down order is:

1. `DailyChartHero` (or future `TagespulsCard` when feature-flag-gated on) — what's today
2. Signatur anchor (per [REQ-USA-signature-first-viewport](REQ-USA-signature-first-viewport.md)) — wer bin ich
3. Active Influences — why today is different
4. Daily Impulse / Modal — what to do now
5. Agents / Premium — vertiefen
6. Blueprint / Archive — not above the daily-orientation flow

Sections may be conditionally hidden (e.g., when premium-only, when a feature flag is off) but must not appear in a different order.

## Acceptance Criteria

- Given a free user with a complete profile, when the dashboard renders, then the visible top-to-bottom section order matches positions 1–6 above (premium/agents may be locked but appear at position 5).
- Given a premium user, when the dashboard renders, then the section order matches the same positions; agents/premium content is unlocked.
- Given the `tagespuls_neu_v1` feature flag is on, when the dashboard renders, then `TagespulsCard` appears at position 1, with `DailyChartHero` retained as the deeper layer below it.
- Given the `tagespuls_neu_v1` flag is off, when the dashboard renders, then `DailyChartHero` occupies position 1 unchanged from current behavior.
- The fix passes `tsc --noEmit` without new errors.
