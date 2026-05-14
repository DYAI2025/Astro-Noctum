# DEC-supabase-as-personal-data-store: Supabase Postgres is the primary store for all per-user personal data

**Status**: Active

**Category**: Architecture

**Scope**: system-wide

**Source**: [CON-gdpr-applies](../1-spec/constraints/CON-gdpr-applies.md), [REQ-COMP-rtbf](../1-spec/requirements/REQ-COMP-rtbf.md), [REQ-COMP-data-export](../1-spec/requirements/REQ-COMP-data-export.md), [ASM-supabase-fits-personal-data-scale](../1-spec/assumptions/ASM-supabase-fits-personal-data-scale.md)

**Last updated**: 2026-05-13

## Context

All personal data — birth profiles, daily pulses, daily interpretations, aphorism usage events, consent records, RTBF deletion-job records, subscription-state mirror — needs a primary store. The architecture's CC-1 GDPR layer (consent records, data-export, RTBF cascade) builds on this choice. Supabase is the existing backend (per dev brief and existing implementation in `Astro-Noctum-prod/`). Choosing a different store would invalidate substantial existing implementation and trigger a parallel re-architecture.

## Decision

Supabase Postgres is the primary store for all per-user personal data and compliance state: `user_astro_profiles`, `daily_pulses`, `daily_interpretations`, `aphorism_usage_events`, `consent_records`, `rtbf_deletion_jobs`, `rtbf_audit_log`, `subscription_state`. Supabase Auth handles authentication. Supabase Edge Functions handle per-user API endpoints (`/v1/users/:userId/*`). Auth + Postgres + Edge Functions are treated as a single integrated unit; replacing the database without also replacing auth and Edge Functions is out of scope.

## Enforcement

### Trigger conditions

- **Specification phase**: when defining a new compliance or retention requirement that affects personal-data storage.
- **Design phase**: when adding a new entity that holds per-user personal data — it goes in Supabase. When adding a new API endpoint that returns or mutates per-user data — it goes through Supabase Edge Functions or `/api/*` server routes that read Supabase.
- **Code phase**: when implementing data access — use Supabase client libraries with RLS; never a separate database connection. Service-role keys server-side only (per [REQ-SEC-no-secrets-in-client](../1-spec/requirements/REQ-SEC-no-secrets-in-client.md)).
- **Deploy phase**: Supabase region must be EU per ASM-supabase-fits-personal-data-scale verification; DPA must be signed and on file.

### Required patterns

- All per-user tables include `user_id UUID REFERENCES auth.users(id)`.
- RLS policies enforce `auth.uid() = user_id` on SELECT / INSERT / UPDATE for per-user tables.
- Migrations live in `supabase/migrations/`.

### Required checks

1. Any new entity holding per-user data has a `user_id` FK and an RLS policy.
2. Service-role token never appears in client bundles (verified by [REQ-SEC-no-secrets-in-client](../1-spec/requirements/REQ-SEC-no-secrets-in-client.md) build-time scan).
3. Supabase region is EU and the DPA is current.

### Prohibited patterns

- Standing up a separate Postgres / MySQL / SQLite instance to hold per-user data alongside Supabase.
- Bypassing RLS by using the service-role key from a client-bound path.
- Persisting per-user data in third-party services without a documented DPA and an entry in the privacy notice's sub-processors list (per [REQ-COMP-privacy-notice](../1-spec/requirements/REQ-COMP-privacy-notice.md)).
