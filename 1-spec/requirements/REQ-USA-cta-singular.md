# REQ-USA-cta-singular: Exactly one primary upgrade CTA for free users; zero for premium

**Type**: Usability

**Status**: Draft

**Priority**: Must-have

**Source**: [GOAL-clean-upgrade-funnel](../goals/GOAL-clean-upgrade-funnel.md)

**Source stakeholder**: [STK-ben](../stakeholders.md)

## Description

The dashboard's upgrade-CTA layout depends on subscription state:

- **Free user:** exactly one primary upgrade CTA visible in the dashboard's first viewport. Secondary upgrade affordances (in agent cards, in navigation, in modals) are converted to lock-hint indicators (no checkout trigger) or removed entirely. Modals showing upgrade content are allowed but do not count toward the first-viewport limit unless they're auto-opened on dashboard mount.
- **Premium user:** zero upgrade CTAs anywhere in the dashboard surface. Only `ManageSubscription` (for billing administration) is permitted.

Conversion-funnel hygiene depends on this — multiple competing CTAs erode trust and split user attention.

## Acceptance Criteria

- Given a free user lands on the dashboard, when the page renders, then exactly one element in the first viewport is classified `keep_primary` per the CTA inventory (TASK-1.2); all others are `convert_to_lock_hint`, `remove`, or `modal_only`.
- Given a premium user lands on the dashboard, when the page renders, then zero elements are classified `keep_primary`, `convert_to_lock_hint`, or any state that triggers `/api/checkout`. Only `ManageSubscription` (classification `premium_only_manage`) is permitted.
- Given the CTA inventory, when reviewed, then every upgrade-related button in `Dashboard.tsx`, `UpgradeButton.tsx`, `AgentSection.tsx`, `ManageSubscription.tsx`, navigation components, and `PremiumUpgradeModal.tsx` is classified.
- The CTA inventory lives either as a code comment block in `Dashboard.tsx` or as a separate `docs/cta-inventory.md`.
- The fix passes `tsc --noEmit` without new errors.

## Related Constraints

- [CON-stripe-payment-stack](../constraints/CON-stripe-payment-stack.md) — single CTA flows through the existing Stripe contract.
