# ASM-supabase-fits-personal-data-scale: Supabase is suitable for Astro-Noctum's personal-data load and GDPR obligations

**Category**: Technology

**Status**: Unverified

**Risk if wrong**: High — Supabase is the persistence layer for `user_astro_profiles`, `daily_pulses`, `daily_interpretations`, `aphorism_usage_events`, consent records, and effectively all personal data. If Supabase cannot meet RTBF cascade timing (`REQ-COMP-rtbf`), data-export performance (`REQ-COMP-data-export`), or GDPR sub-processor obligations, the entire `GOAL-gdpr-compliant-data-handling` is jeopardized. Migrating off Supabase mid-product is expensive.

## Statement

Supabase (managed PostgreSQL + edge functions + auth) is appropriate for Astro-Noctum's projected scale (consumer web app, presumably tens of thousands of users at maturity, single-digit thousands at launch) and supports the GDPR obligations Astro-Noctum carries: per-user RTBF cascades within 30-day target, machine-readable Art. 20 export, audit-loggable consent records, sub-processor DPA in place.

## Rationale

Supabase's underlying PostgreSQL is fully capable of the schema and queries required (table-by-user-id deletes, JSON exports, append-only consent records). Supabase publishes a GDPR-compliant data-processing addendum and operates EU-region infrastructure. The dev brief explicitly references Supabase MCP for migrations and edge functions, indicating Supabase is the intended persistence stack.

## Verification Plan

- **Pre-launch (legal)**: confirm Supabase DPA is in place and EU-region data residency is selected for production.
- **Pre-launch (operational)**: smoke-test RTBF deletion flow against a staging instance with realistic data shapes — measure cascade duration end-to-end.
- **Pre-launch (operational)**: smoke-test data export with realistic data shapes — measure response time and JSON size.
- **Trigger to invalidate**: if either smoke test fails to meet its requirement target (`REQ-COMP-rtbf` 30d window, `REQ-COMP-data-export` reasonable response time), the assumption is Invalidated and either Supabase config changes (e.g., partitioning, indexing, queue-based deletion) or a migration plan is needed.
- **Verification window**: before any production deploy with real EU users.

## Related Artifacts

- [GOAL-gdpr-compliant-data-handling](../goals/GOAL-gdpr-compliant-data-handling.md)
- [REQ-COMP-rtbf](../requirements/REQ-COMP-rtbf.md)
- [REQ-COMP-data-export](../requirements/REQ-COMP-data-export.md)
- [REQ-COMP-consent-record](../requirements/REQ-COMP-consent-record.md)
