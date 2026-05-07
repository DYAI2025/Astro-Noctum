# REQ-F-checkout-stripe-redirect: Successful checkout response redirects to Stripe-hosted Checkout

**Type**: Functional

**Status**: Approved

**Priority**: Must-have

**Source**: [GOAL-clean-upgrade-funnel](../goals/GOAL-clean-upgrade-funnel.md)

**Source stakeholder**: [STK-ben](../stakeholders.md)

## Description

A successful `POST /api/checkout` response (HTTP 200 with body shape `{ url: string }`) must trigger a full-page navigation to the returned `url` via `window.location.href = url`. The expected `url` always points at Stripe's hosted Checkout (`https://checkout.stripe.com/...`). No fallback navigation, partial render, or in-app modal substitute is permitted — Stripe Checkout is the canonical payment flow per [CON-stripe-payment-stack](../constraints/CON-stripe-payment-stack.md). A 200 response that omits `url` is an error condition (see [REQ-USA-checkout-error-categories](REQ-USA-checkout-error-categories.md)).

## Acceptance Criteria

- Given the response is HTTP 200 with body `{ url: "https://checkout.stripe.com/..." }`, when the success handler runs, then `window.location.href` is set to that URL.
- Given the user lands on the Stripe Checkout page, when they complete payment, then Stripe webhooks update subscription state (out-of-scope for this frontend requirement but referenced for completeness).
- Given the response is HTTP 200 but body is missing `url`, when the success handler runs, then no redirect is attempted and a "200-no-url" error affordance is shown per [REQ-USA-checkout-error-categories](REQ-USA-checkout-error-categories.md).
- Given the response `url` is malformed or doesn't start with `https://checkout.stripe.com/`, when validation runs, then no redirect is attempted (defensive — although the server is the source of truth for this URL).
- The analytics event `checkout_redirected` fires fire-and-forget before the navigation.

## Related Constraints

- [CON-stripe-payment-stack](../constraints/CON-stripe-payment-stack.md)
