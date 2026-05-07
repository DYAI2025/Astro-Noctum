# REQ-COMP-data-export: User can request machine-readable JSON export of all personal data (Art. 20 portability)

**Type**: Compliance

**Status**: Draft

**Priority**: Must-have

**Source**: [CON-gdpr-applies](../constraints/CON-gdpr-applies.md)

**Source stakeholder**: [STK-user-free](../stakeholders.md)

## Description

A user must be able to request a machine-readable JSON export of all personal data Astro-Noctum holds about them, satisfying GDPR Art. 20 (right to data portability). Minimum contents: birth profile, daily-pulse history (`daily_pulses` rows), daily-interpretation history (`daily_interpretations` rows), aphorism-usage events, consent records (current + revoked), subscription metadata (insofar as it's stored on the Astro-Noctum side, not Stripe-only). Stripe-side billing data is referenced (with Stripe's customer ID and a pointer to Stripe's own data-export tooling).

The export is delivered via either: (a) authenticated download link emailed to the user's verified email, or (b) in-app download from a privacy-settings page.

## Acceptance Criteria

- Given an authenticated user requests their data export, when the request is processed, then a JSON file containing all categories above is produced and made available to them.
- Given the file is opened, when inspected, then it is valid JSON, includes a top-level `user_id` field, a `generated_at` timestamp, and a `schema_version`.
- Given the export is generated, when the size is observed, then it covers all rows associated with the user across all relevant Supabase tables (no partial export, no truncation without warning).
- Given the user has revoked consent for some purposes, when the export is generated, then revoked-consent records are included as historical context (revocation does not erase the record, only the processing).
- Given the request fails (e.g., backend error), when the user is notified, then they receive an actionable error and the request can be retried.
- The export endpoint itself is rate-limited and authenticated to prevent abuse.

## Related Constraints

- [CON-gdpr-applies](../constraints/CON-gdpr-applies.md)
