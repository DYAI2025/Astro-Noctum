# REQ-SEC-export-authz: Data-export endpoint enforces subject-only access

**Type**: Security

**Status**: Approved

**Priority**: Must-have

**Source**: [REQ-COMP-data-export](REQ-COMP-data-export.md)

**Source stakeholder**: [STK-user-free](../stakeholders.md)

## Description

The Art. 20 data-export endpoint returns only rows whose `user_id` matches the authenticated subject. Cross-user, unauthenticated, or service-role-impersonated requests are rejected. The endpoint is rate-limited to discourage scraping (baseline: ≤5 successful exports / day / user). Output files are delivered through a single-use, time-bounded download URL or as a direct authenticated response — never via a permanent public URL.

## Acceptance Criteria

- Given an unauthenticated request to the export endpoint, when received, then the server returns 401.
- Given an authenticated request that targets a `user_id` other than the authenticated subject, when received, then the server returns 403 with no information about whether the target exists.
- Given an authenticated user exceeds 5 successful export requests in 24 hours, when the 6th arrives, then the server returns 429.
- Given the export output is delivered via a URL, when issued, then the URL is single-use, expires within 24 hours, and is invalidated after the first successful download.
- Given the export endpoint is fetched, when audited, then no service-role token from the client (or any other key beyond the user's session JWT) is required.

## Related Constraints

- [CON-gdpr-applies](../constraints/CON-gdpr-applies.md)
