# GOAL-clean-upgrade-funnel: Reliable, unambiguous upgrade-to-premium conversion flow

**Description**: The path from free user to paying premium subscriber is unambiguous and works on first attempt. Free users see exactly one primary upgrade CTA in the dashboard's first viewport; clicking it triggers exactly one `POST /api/checkout` call which redirects to Stripe-hosted Checkout. Errors are categorized with concrete user-facing messages so users understand what went wrong (auth expired, server unavailable, network error, etc.). Premium users see no upgrade CTAs — only `ManageSubscription`. Agent cards may show locked-state indicators but never trigger their own checkout calls. This goal directly drives revenue, so any regression here has immediate business impact.

**Status**: Approved

**Priority**: Must-have

**Source stakeholder**: [STK-ben](../stakeholders.md)

## Success Criteria

- [ ] Free-user dashboard renders **exactly one** primary upgrade CTA in the first viewport; secondary upgrade affordances are converted to lock-hint indicators or removed.
- [ ] Premium-user dashboard renders **zero** upgrade CTAs — only `ManageSubscription` is permitted.
- [ ] Click on the primary CTA fires **exactly one** `POST /api/checkout`; the button is disabled during the in-flight request to prevent double-trigger.
- [ ] Successful response (`{ url }`) sets `window.location.href = url` for Stripe-hosted Checkout redirect.
- [ ] Failure paths show distinct, actionable user messages per error class: not-logged-in, 401 (session expired), 403, 503 / Stripe-env-missing, 200-without-url, network error.
- [ ] Agent cards (`AgentSection.tsx` etc.) do **not** independently call `/api/checkout`; they expose `onRequestUpgrade` callbacks or static lock-hints only.
- [ ] Analytics events fire fire-and-forget (non-blocking) for `upgrade_clicked`, `checkout_started`, `checkout_failed` (with `error_type`), `checkout_redirected`.

## Related Artifacts

- User stories: _none yet_
- Requirements: [REQ-USA-cta-singular](../requirements/REQ-USA-cta-singular.md), [REQ-F-checkout-single-trigger](../requirements/REQ-F-checkout-single-trigger.md), [REQ-F-checkout-stripe-redirect](../requirements/REQ-F-checkout-stripe-redirect.md), [REQ-USA-checkout-error-categories](../requirements/REQ-USA-checkout-error-categories.md), [REQ-F-agent-card-no-checkout](../requirements/REQ-F-agent-card-no-checkout.md), [REQ-F-manage-subscription](../requirements/REQ-F-manage-subscription.md)
- Constraints: [CON-stripe-payment-stack](../constraints/CON-stripe-payment-stack.md)
