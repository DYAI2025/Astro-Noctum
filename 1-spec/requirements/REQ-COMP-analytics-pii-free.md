# REQ-COMP-analytics-pii-free: Analytics events do not contain raw PII

**Type**: Compliance

**Status**: Approved

**Priority**: Must-have

**Source**: [CON-gdpr-applies](../constraints/CON-gdpr-applies.md)

**Source stakeholder**: [STK-user-free](../stakeholders.md)

## Description

Analytics and observability events (retention metrics like `D1_return_rate`, `D7_return_rate`, `dashboard_first_interaction`, `daily_detail_open_rate`, `signatur_sphere_interaction`, `upgrade_cta_click`, `checkout_started`, `checkout_failed`, `council_figure_selected`, etc.) must not contain raw personally identifiable information. Required treatment:

- User identifier in events is a stable hash or pseudonymous ID, not the raw user_id, email, or any directly-identifying value.
- Birth data (date / time / place), real names, email addresses, IP addresses, and Stripe customer IDs are never included in event payloads.
- Event payloads carry only the metric or behavior signal, plus aggregate categorical context (locale, premium/free, has-profile vs. no-profile).
- This applies to both client-side telemetry and any server-emitted log events forwarded to analytics tools.

This requirement is the codification of dev brief TASK-3.2 acceptance criterion ("Keine personenbezogenen Rohdaten in Events").

## Acceptance Criteria

- Given any analytics event payload schema, when reviewed, then it contains no field for `email`, `birth_date`, `birth_time`, `birth_place`, raw `user_id`, `ip_address`, `stripe_customer_id`, or full names.
- Given the user identifier in an event is needed (for retention cohorting), when included, then it is a hashed / pseudonymous form (e.g., HMAC of `user_id` with a server secret).
- Given a new event is added in a PR, when reviewed, then its payload schema is checked against this requirement; PII inclusion blocks merge.
- Given a privacy audit is run, when sampled events are inspected, then no raw PII appears in any sample.
- Documentation of the analytics event catalog includes per-event PII-allowlist verification.

## Related Constraints

- [CON-gdpr-applies](../constraints/CON-gdpr-applies.md)
