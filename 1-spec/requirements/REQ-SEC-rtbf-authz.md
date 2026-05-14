# REQ-SEC-rtbf-authz: RTBF trigger requires subject auth plus out-of-band confirmation

**Type**: Security

**Status**: Approved

**Priority**: Must-have

**Source**: [REQ-COMP-rtbf](REQ-COMP-rtbf.md)

**Source stakeholder**: [STK-user-free](../stakeholders.md)

## Description

The RTBF (right-to-be-forgotten, Art. 17) trigger requires two factors before the deletion job executes: (a) authenticated session with the subject identity, and (b) confirmation via a single-use, time-bounded link sent to the verified-email-on-file. After confirmation, the deletion job enters a documented grace window of 24 hours during which the user can cancel the request via a one-click "Restore" link in the same email or in account settings. After the grace window, the deletion job becomes irreversible and proceeds per [REQ-COMP-rtbf](REQ-COMP-rtbf.md) timing.

## Acceptance Criteria

- Given an authenticated user requests RTBF, when the request is recorded, then a deletion-job row is created in `pending_confirmation` status with `requested_at` timestamp.
- Given the deletion job is in `pending_confirmation`, when the confirmation email is sent, then it contains a single-use confirmation link (expires in 30 minutes) and a separate one-click cancel link (valid for the entire grace window).
- Given the user clicks the confirmation link within 30 minutes, when the server validates, then the job transitions to `pending_grace` with a 24-hour countdown.
- Given the user clicks the cancel link within 24 hours of confirmation, when the server validates, then the job transitions to `cancelled` and no deletion executes.
- Given 24 hours have elapsed in `pending_grace` without cancellation, when the scheduler runs, then the job transitions to `executing` and the purge per [REQ-COMP-rtbf](REQ-COMP-rtbf.md) proceeds.
- Given any RTBF state transition, when persisted, then an append-only audit row records actor, timestamp, and prior state.

## Related Constraints

- [CON-gdpr-applies](../constraints/CON-gdpr-applies.md)
