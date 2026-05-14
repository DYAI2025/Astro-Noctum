# REQ-SEC-checkout-rate-limit: POST /api/checkout is rate-limited and CSRF-protected

**Type**: Security

**Status**: Approved

**Priority**: Must-have

**Source**: [CON-stripe-payment-stack](../constraints/CON-stripe-payment-stack.md)

**Source stakeholder**: [STK-ben](../stakeholders.md)

## Description

`POST /api/checkout` is rate-limited and CSRF-protected to mitigate abuse (automated trial-creation, payment-flow scraping, accidental flooding from impatient users). Rate-limit baseline: ≤10 requests per minute per authenticated user, ≤30 requests per minute per source IP. CSRF protection is enforced either via same-origin policy (Origin / Referer check against an allowlist) or via anti-CSRF token issued per session. Limits exceeded → 429 with a `Retry-After` header.

## Acceptance Criteria

- Given an authenticated user issues >10 `POST /api/checkout` requests within 60 seconds, when the 11th request arrives, then the server returns 429 with `Retry-After` header.
- Given a single source IP issues >30 `POST /api/checkout` requests within 60 seconds, when the 31st request arrives, then the server returns 429.
- Given a request whose `Origin` header is not in the allowlist (or whose anti-CSRF token is missing/invalid), when received, then the server returns 403.
- Given the rate-limit counter store, when reviewed, then it survives single-instance restarts (e.g., Redis, Supabase table, or equivalent — not in-process memory only).
- Given the AS-6 client receives 429, when the error handler runs, then a distinct user-facing message ("Zu viele Anfragen. Bitte einen Moment warten.") is shown, consistent with [REQ-USA-checkout-error-categories](REQ-USA-checkout-error-categories.md).

## Related Constraints

- [CON-stripe-payment-stack](../constraints/CON-stripe-payment-stack.md)
- [CON-gdpr-applies](../constraints/CON-gdpr-applies.md) — request logs containing IP addresses must obey retention limits.
