# REQ-SEC-edge-function-auth: Edge Functions require authenticated requests with userId binding

**Type**: Security

**Status**: Approved

**Priority**: Must-have

**Source**: [CON-gdpr-applies](../constraints/CON-gdpr-applies.md)

**Source stakeholder**: [STK-ben](../stakeholders.md)

## Description

The Supabase Edge Functions `daily-pulse` (GET) and `daily-interpretation` (POST), and any future Edge Function that handles per-user personal data, must reject unauthenticated requests. The `userId` path parameter must match the authenticated user's subject claim from the Supabase Auth JWT; mismatches return 403 without leaking whether the target `userId` exists. No anonymous or service-role-token requests originate from the client.

## Acceptance Criteria

- Given a request to `GET /v1/users/:userId/daily-pulse` without a valid Bearer token, when the Edge Function runs, then it returns 401.
- Given a request with a valid Bearer token whose subject claim does not equal the path `:userId`, when the Edge Function runs, then it returns 403 with a generic body (no information leakage about whether `:userId` exists).
- Given a request with a valid Bearer token whose subject matches the path `:userId`, when the Edge Function runs, then it proceeds with the user-scoped query.
- Given the same authorization checks applied to `POST /v1/users/:userId/daily-interpretation` and any future per-user Edge Function, when reviewed, then identical authentication and `userId`-binding semantics are enforced.
- Given the Supabase service-role token, when reviewed, then no client-side code path exposes or transmits it.

## Related Constraints

- [CON-gdpr-applies](../constraints/CON-gdpr-applies.md) — per-user data must only be retrievable by the authenticated subject.
