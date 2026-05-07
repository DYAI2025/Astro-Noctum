# ASM-stripe-uptime-acceptable: Stripe Checkout's availability is acceptable for Astro-Noctum's revenue SLOs

**Category**: Environment

**Status**: Unverified

**Risk if wrong**: Low — Stripe is one of the most operationally reliable payment providers; outages are rare and brief. The risk is asymmetric: if Stripe Checkout is down, free→premium conversion stops, but the free product remains usable. The fallback (try again later) is acceptable in scope; building a redundant payment path is explicitly out of scope per `CON-stripe-payment-stack`.

## Statement

Stripe-hosted Checkout (`https://checkout.stripe.com/...`) and the Stripe API have availability SLAs sufficient to meet Astro-Noctum's revenue and conversion goals — specifically, the assumption is that Stripe outages will not exceed a small fraction of total dashboard hours, and that the existing `REQ-USA-checkout-error-categories` 503 handling is enough during outages.

## Rationale

Stripe publishes uptime statistics in the 99.99% range. Their hosted Checkout is the recommended path explicitly because Stripe operates the surface, reducing PCI scope and inheriting their availability. The dev brief's Non-Goal #3 ("Kein Austausch von Stripe oder der Payment-Architektur") encodes the bet that Stripe is reliable enough for our needs.

## Verification Plan

- **Pre-launch / passive**: subscribe to Stripe's status page (status.stripe.com); document the subscription as part of operations runbook (Phase 4).
- **Post-launch**: instrument analytics for `checkout_failed` events with `error_type = 503`; compute monthly outage-attributable lost-conversion rate.
- **Trigger to invalidate**: if observed Stripe-outage-attributable conversion loss exceeds 0.5% / month sustained, re-evaluate (consider adding a fallback path or alternative provider — note: this conflicts with current `CON-stripe-payment-stack` and would require a decision to lift the constraint).
- **Verification window**: ongoing post-launch monitoring; not a blocker for Spec → Design transition.

## Related Artifacts

- [GOAL-clean-upgrade-funnel](../goals/GOAL-clean-upgrade-funnel.md)
- [REQ-USA-checkout-error-categories](../requirements/REQ-USA-checkout-error-categories.md)
- Constraint: [CON-stripe-payment-stack](../constraints/CON-stripe-payment-stack.md)
