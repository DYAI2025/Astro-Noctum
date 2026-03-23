# DEC-supabase-backend: Supabase as sole backend data layer

**Status**: Active

**Category**: Architecture

**Scope**: system-wide

**Source**: n/a (foundational decision predating scaffold)

**Last updated**: 2026-03-23

## Context

Bazodiac stores per-user astrological profiles, birth data, natal charts, quiz contributions, conversation histories, and premium tier state. These require strong data isolation (users must never see each other's data), real-time auth, and low-latency reads. A traditional REST API with endpoint-level authorization increases attack surface and requires manual enforcement at every route.

## Decision

Use **Supabase** (hosted PostgreSQL + Auth + PostgREST) as the sole backend data layer. All data access goes through the Supabase client or service role key. Row Level Security (RLS) enforces data isolation at the database level.

## Enforcement

### Trigger conditions

- **Design phase**: when designing data storage, auth flows, or new tables
- **Code phase**: when writing any data access code (reads, writes, upserts)
- **Deploy phase**: when provisioning database infrastructure or configuring env vars

### Required patterns

- All tables must have RLS enabled with `auth.uid() = user_id` policies
- Browser-side: use `supabase` client from `src/lib/supabase.ts` (initialized from `VITE_SUPABASE_*` env vars)
- Server-side: use service role key only in `server.mjs` for admin operations (signup auto-confirm, profile lookups for ElevenLabs)
- New tables must include a `user_id UUID REFERENCES auth.users(id)` column
- Schema changes must be captured as SQL migration files in `supabase-migrations/`

### Required checks

1. Every new table has RLS policies before merging
2. No raw SQL queries bypass the Supabase client
3. Service role key is never exposed to browser (no `VITE_` prefix)

### Prohibited patterns

- Direct PostgreSQL connections from application code
- Storing user data in tables without RLS
- Using the service role key in browser-side code
- Hardcoding Supabase URLs or keys (use env vars)
