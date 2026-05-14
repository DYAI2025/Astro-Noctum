# REQ-SEC-portal-session-tokens: Stripe Customer Portal URLs are single-use, time-bounded

**Type**: Security

**Status**: Approved

**Priority**: Must-have

**Source**: [REQ-F-manage-subscription](REQ-F-manage-subscription.md)

**Source stakeholder**: [STK-ben](../stakeholders.md)

## Description

Stripe Customer Portal session URLs returned to the ManageSubscription surface are server-issued (never client-constructed), single-use, and time-bounded with TTL ≤5 minutes. The URL is consumed by an immediate navigation; if the user does not navigate within the TTL or the URL is intercepted and reused after first navigation, Stripe rejects it. The client must not persist the URL in localStorage, sessionStorage, the browser URL bar (beyond the navigation itself), or analytics logs.

## Acceptance Criteria

- Given a premium user clicks "Manage in Stripe", when the ManageSubscription surface fetches the session URL, then the server returns a Stripe-issued URL with the maximum 5-minute TTL.
- Given the URL is returned to the client, when reviewed, then the response carries cache headers (`Cache-Control: no-store`) and the client does not persist it.
- Given the URL is logged anywhere (server logs, analytics, browser console), when audited, then either the URL is not present or it is redacted (`<portal-session-url>`).
- Given the user navigates within the TTL, when Stripe validates the URL, then the portal opens normally.
- Given the user attempts to navigate after the TTL elapses or to reuse a previously consumed URL, when Stripe validates, then it rejects the URL and the ManageSubscription surface must re-issue a fresh one.

## Related Constraints

- [CON-stripe-payment-stack](../constraints/CON-stripe-payment-stack.md)
