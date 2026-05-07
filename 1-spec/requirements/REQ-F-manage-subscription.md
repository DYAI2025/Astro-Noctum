# REQ-F-manage-subscription: Premium users can view and manage their subscription

**Type**: Functional

**Status**: Approved

**Priority**: Must-have

**Source**: [GOAL-clean-upgrade-funnel](../goals/GOAL-clean-upgrade-funnel.md)

**Source stakeholder**: [STK-user-premium](../stakeholders.md)

## Description

A premium user must be able to view their subscription state (plan, renewal date, payment method) and perform self-service actions (cancel, change payment method, view billing history) from a dedicated `ManageSubscription` surface. The implementation pattern is to delegate to Stripe's hosted Customer Portal: Astro-Noctum's frontend exposes a "Manage subscription" affordance that opens the Stripe Customer Portal in a same-tab redirect or new tab; subscription mutations are handled by Stripe and propagate back to Astro-Noctum via webhooks (out of frontend scope). The surface is the only billing-related UI element visible to premium users (per `REQ-USA-cta-singular`); free users do not see it.

## Acceptance Criteria

- Given a premium user navigates to the `ManageSubscription` surface (linked from account / settings / dashboard footer), when the page renders, then it shows: current plan name, next renewal date, payment-method summary (last 4 digits of card, masked), and a "Manage in Stripe" CTA.
- Given the user clicks "Manage in Stripe", when the click handler runs, then the user is redirected to a Stripe Customer Portal session URL obtained from the backend (or a Stripe Customer Portal short-link if applicable).
- Given the user completes an action in the Stripe Portal (cancellation, payment method update, plan change), when they return to Astro-Noctum, then the subscription state has been updated in Astro-Noctum's representation via Stripe webhook (out of scope for this requirement, but the dependency is noted).
- Given a free user (without an active subscription) somehow lands on the `ManageSubscription` surface, when the page renders, then it shows an empty / not-applicable state and offers the upgrade CTA per `REQ-USA-cta-singular`.
- Given the Stripe Portal session creation fails (5xx, env misconfigured), when the error handler runs, then the user sees an actionable error message consistent with `REQ-USA-checkout-error-categories` patterns (e.g., "Verwaltung derzeit nicht verfügbar. Versuche es später.").
- The fix passes `tsc --noEmit` without new errors.

## Related Constraints

- [CON-stripe-payment-stack](../constraints/CON-stripe-payment-stack.md) — Stripe Customer Portal is Stripe's hosted equivalent of Stripe Checkout; same architectural reasoning applies.
- [CON-gdpr-applies](../constraints/CON-gdpr-applies.md) — billing data lives in Stripe under their DPA; ManageSubscription is the user-facing entry point for billing-related data subject access.
