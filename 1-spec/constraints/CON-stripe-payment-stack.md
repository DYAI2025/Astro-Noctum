# CON-stripe-payment-stack: Stripe is the payment processor

**Category**: Technical

**Status**: Active

**Source stakeholder**: [STK-ben](../stakeholders.md)

## Description

Stripe Checkout is the sole payment processor for Astro-Noctum's upgrade and subscription flows. The current payment architecture — `POST /api/checkout` returning `{ url }`, redirect to `https://checkout.stripe.com/...`, Stripe webhooks as the source of truth for subscription state — must not be replaced or rebuilt within the current scope.

## Rationale

Stripe is operational, integrated, and live. Replacing it would consume sprint capacity without delivering user-visible value. Stripe's hosted Checkout flow already handles PCI-DSS scope reduction, fraud detection, EU SCA compliance, and multi-currency / tax handling — capabilities that would have to be re-implemented or re-procured if swapped. The dev brief explicitly lists "Kein Austausch von Stripe oder der Payment-Architektur" as Non-Goal #3.

## Impact

- All checkout-related work (e.g., TASK-1.4) operates against the existing Stripe contract; UI/UX changes are in scope, contract changes are not.
- Subscription state (`free`, `premium`, cancellation) reads from Stripe webhooks, not from frontend signals. Frontend may not invent its own subscription source of truth.
- Adding alternative payment providers, custom checkout UIs, or self-hosted billing is out of scope until this constraint is lifted via a new decision.
- Stripe environment variables, API keys, and webhook secrets are managed at the deploy layer, not embedded in client code.
