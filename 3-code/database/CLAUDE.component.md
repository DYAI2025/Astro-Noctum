# Database

**Responsibility**: Supabase Postgres schema for the 11 entities defined in [`data-model.md`](../../2-design/data-model.md). Includes migrations, RLS policies, indexes, and seed scripts. Authoritative source for table definitions, constraints, and the invariants I-DM-1 through I-DM-8.

**Technology**: SQL (PostgreSQL 15+), Supabase CLI for migration management. Seed scripts in Python or TypeScript (chosen during Code phase).

## Interfaces

- Schema (DDL): applied via `supabase db push` or CI-driven migration runner.
- Runtime: read / written by `web-server` (Stripe webhook UPSERTs into `subscription_state`, reads `user_astro_profiles`) and `edge-functions` (all per-user reads / writes, RTBF cascade, consent records).
- Seed input: consumes `aphorisms.json` from `tagespuls-package` to populate the `aphorisms` reference table.

## Entities Owned

Per [`data-model.md`](../../2-design/data-model.md):

- Operational (per-user): `user_astro_profiles`, `daily_pulses`, `daily_interpretations`, `cosmic_weather_snapshots`, `aphorism_usage_events`.
- Reference (system): `aphorisms`.
- Compliance / state: `consent_records`, `rtbf_deletion_jobs`, `rtbf_audit_log`, `subscription_state`.
- `auth.users` is owned by Supabase Auth — referenced but not owned.

## RLS Policy Strategy

- Per-user tables enforce `auth.uid() = user_id` for SELECT / INSERT / UPDATE.
- Reference tables (`aphorisms`, `cosmic_weather_snapshots`) are SELECT-permitted to authenticated users; INSERT / UPDATE restricted to the service role.
- Append-only tables (`consent_records`, `rtbf_audit_log`) reject UPDATE / DELETE for non-service-role callers.
- `rtbf_deletion_jobs` writes are service-role-only (Edge Functions act as service role).

## Invariants Enforced

| Invariant | Enforcement |
|-----------|-------------|
| I-DM-1 (same-user constraint) | FK + CHECK or trigger |
| I-DM-2 / I-DM-3 (approved aphorism) | Application-layer check at write time (FK alone insufficient because `aphorisms.status` is mutable) |
| I-DM-4 (engine_version ↔ is_fallback) | CHECK constraint |
| I-DM-5 (LLM-consent before interpretation) | Application-layer check at write time |
| I-DM-6 (completed → user_id NULL) | CHECK constraint |
| I-DM-7 (audit-log entry for each job) | Trigger or application-layer guarantee |
| I-DM-8 (premium ↔ active subscription) | Daily reconciliation job + application-layer check |

## Requirements Addressed

| File | Type | Priority | Status |
|------|------|----------|--------|
| [REQ-COMP-consent-record](../../1-spec/requirements/REQ-COMP-consent-record.md) | Compliance | Must | Approved (schema + RLS) |
| [REQ-COMP-data-export](../../1-spec/requirements/REQ-COMP-data-export.md) | Compliance | Must | Approved (queryable per-user data) |
| [REQ-COMP-rtbf](../../1-spec/requirements/REQ-COMP-rtbf.md) | Compliance | Must | Approved (RTBF cascade schema + audit log) |
| [REQ-SEC-edge-function-auth](../../1-spec/requirements/REQ-SEC-edge-function-auth.md) | Security | Must | Approved (RLS policies enforce `auth.uid()` binding) |
| [REQ-SEC-export-authz](../../1-spec/requirements/REQ-SEC-export-authz.md) | Security | Must | Approved (RLS policies enforce subject-only access) |

## Relevant Decisions

| File | Title | Trigger |
|------|-------|---------|
| [DEC-supabase-as-personal-data-store](../../decisions/DEC-supabase-as-personal-data-store.md) | Supabase as primary personal-data store | All schema work in this component lands in Supabase migrations |
| [DEC-rtbf-grace-window-24h](../../decisions/DEC-rtbf-grace-window-24h.md) | RTBF cancellation grace window is 24 hours | `rtbf_deletion_jobs.grace_window_ends_at` column derives from this; the 24h value is reflected in CHECK constraints or scheduler queries |
