# REQ-F-agent-card-no-checkout: Agent cards do not independently call /api/checkout

**Type**: Functional

**Status**: Approved

**Priority**: Must-have

**Source**: [GOAL-clean-upgrade-funnel](../goals/GOAL-clean-upgrade-funnel.md)

**Source stakeholder**: [STK-ben](../stakeholders.md)

## Description

Components rendered inside `AgentSection.tsx` (and any other locked-feature display surfaces) must not trigger their own `POST /api/checkout` requests. Locked-state agent cards are presentational only — they may show a lock indicator, premium badge, or "available with premium" hint, but any action that would result in a checkout call must be either:

- (a) routed through the central `UpgradeButton` via an `onRequestUpgrade` callback prop, or
- (b) a no-op (lock-hint-only) with the user understanding they need to upgrade elsewhere.

This keeps the conversion funnel singular (per [REQ-USA-cta-singular](REQ-USA-cta-singular.md)) and ensures `checkout_clicked` analytics events all originate from the same instrumentation point.

## Acceptance Criteria

- Given any agent card in `AgentSection.tsx` is inspected, when its source is read, then no direct `fetch('/api/checkout', ...)` or equivalent call exists.
- Given an agent card has an upgrade-related click handler (e.g., the user taps a locked card), when the handler runs, then it invokes a parent-supplied callback (`onRequestUpgrade`) or shows a static lock-hint — it does not trigger checkout itself.
- Given the existing `handleUpgrade()` in `AgentSection.tsx` (per dev brief) is refactored, when reviewed, then it is replaced by either the callback pattern or the lock-hint pattern.
- Tests verify that clicking a locked agent card does not produce a `/api/checkout` network call.
- The fix passes `tsc --noEmit` without new errors.

## Related Constraints

- [CON-stripe-payment-stack](../constraints/CON-stripe-payment-stack.md)
