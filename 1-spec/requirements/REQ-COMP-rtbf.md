# REQ-COMP-rtbf: Right-to-be-forgotten flow purges all per-user records within target window

**Type**: Compliance

**Status**: Draft

**Priority**: Must-have

**Source**: [CON-gdpr-applies](../constraints/CON-gdpr-applies.md)

**Source stakeholder**: [STK-user-free](../stakeholders.md)

## Description

When a user exercises GDPR Art. 17 (right to erasure), Astro-Noctum must purge all per-user personal data across all storage layers within a documented target window (initial target: 30 days; tightened to 24 hours where operationally feasible). Storage layers in scope:

- Supabase tables: `user_astro_profiles`, `daily_pulses`, `daily_interpretations`, `aphorism_usage_events`, consent records, any future tables holding `user_id`-keyed data.
- Stripe customer record: triggered via Stripe's customer-deletion API (with the caveat that Stripe retains transaction records for tax/legal purposes — that retention is documented to the user).
- LLM provider state: if the LLM provider stores prompts containing user data, deletion is requested or the data is documented as transient.
- Backups / replicas: documented retention; deletion propagates within the next backup-rotation window.

After erasure, a verification query must return zero subject rows for the deleted user across all primary tables. Aggregate / anonymized analytics that no longer identify the user may be retained.

## Acceptance Criteria

- Given a user requests RTBF (in-app or via email-verified channel), when the request is acknowledged, then a deletion-job record is created with `user_id`, `requested_at`, target completion timestamp.
- Given the deletion job runs, when it completes, then a verification query (`SELECT COUNT(*) WHERE user_id = '...'`) returns 0 across `user_astro_profiles`, `daily_pulses`, `daily_interpretations`, `aphorism_usage_events`, and all consent records (or a redacted-tombstone row replacing the original).
- Given Stripe is involved, when the deletion job runs, then Stripe's customer-deletion API is called and the response is logged.
- Given backups exist, when the next backup rotation runs, then the deleted user's data is no longer present in the most recent backup; older backups are documented as eventually purged within the documented retention window.
- Given the target window is 30 days, when the job completes, then all primary-store deletions occur within that window from `requested_at`; SLO violations trigger alerting.
- The user receives a notification that their RTBF was completed (when, what was deleted, what was retained for legal purposes).

## Related Constraints

- [CON-gdpr-applies](../constraints/CON-gdpr-applies.md)
