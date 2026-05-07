# REQ-F-checkout-single-trigger: Click on primary upgrade CTA fires exactly one POST /api/checkout

**Type**: Functional

**Status**: Approved

**Priority**: Must-have

**Source**: [GOAL-clean-upgrade-funnel](../goals/GOAL-clean-upgrade-funnel.md)

**Source stakeholder**: [STK-ben](../stakeholders.md)

## Description

A single user click on the primary upgrade CTA (`UpgradeButton`) must trigger exactly one `POST /api/checkout` request. The button must be disabled during the in-flight request to prevent double-trigger by impatient clicks. The disabled state must visually communicate that the request is processing (loading spinner, opacity change, or equivalent affordance). The request is fire-and-await — control flow waits for the response before redirect or error handling.

## Acceptance Criteria

- Given a free user clicks the primary `UpgradeButton`, when the request is in-flight, then the button's `disabled` attribute is `true` and a loading affordance is rendered.
- Given the user clicks the button repeatedly during the in-flight period, when the network is observed, then exactly one `POST /api/checkout` request is fired.
- Given the request resolves (success or failure), when the response is processed, then the button's `disabled` attribute becomes `false` (unless the response was a successful redirect, in which case the page navigates away).
- Given a network error occurs (request rejected before reaching the server), when the catch handler runs, then the button is re-enabled and an error affordance per [REQ-USA-checkout-error-categories](REQ-USA-checkout-error-categories.md) is shown.
- Tests cover the click-storm scenario and prove a single network call.

## Related Constraints

- [CON-stripe-payment-stack](../constraints/CON-stripe-payment-stack.md) — `/api/checkout` is the existing Stripe gateway; this requirement does not change its contract.
