# REQ-SEC-tls-everywhere: All HTTP traffic served over TLS 1.2+ with HSTS

**Type**: Security

**Status**: Approved

**Priority**: Must-have

**Source**: [CON-gdpr-applies](../constraints/CON-gdpr-applies.md)

**Source stakeholder**: [STK-user-free](../stakeholders.md)

## Description

All HTTP traffic between the user's browser, Astro-Noctum's frontend, the backend `/api/*` routes, Supabase, Stripe, the LLM provider, and any other dependency is served over TLS 1.2 or higher. The application response includes a `Strict-Transport-Security` header with `includeSubDomains` and an age of at least 6 months. Any plain-HTTP request that reaches the application is redirected with `301 Moved Permanently` to the HTTPS equivalent. Mixed-content (HTTP subresources on HTTPS pages) is forbidden by Content-Security-Policy.

## Acceptance Criteria

- Given the deployed application is probed via a TLS-version scanner (e.g., `sslyze`, `testssl.sh`), when results are read, then no TLS 1.0 / 1.1 / SSLv3 is enabled and TLS 1.2 minimum is enforced.
- Given any HTTP request to the application's public hostname, when the server responds, then it returns 301 to the HTTPS equivalent.
- Given any HTTPS response from the application, when headers are inspected, then `Strict-Transport-Security: max-age=15552000; includeSubDomains; preload` (or equivalent ≥6 months) is present.
- Given the Content-Security-Policy header, when reviewed, then it forbids `http:` subresources on the document.
- Given backend egress to Supabase / Stripe / LLM provider, when audited, then all client libraries use HTTPS endpoints; no `http://` URLs are configured.

## Related Constraints

- [CON-gdpr-applies](../constraints/CON-gdpr-applies.md)
