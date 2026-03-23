# Data Model

## Overview

Bazodiac uses **Supabase (PostgreSQL)** as its persistence layer. All tables live in the `public` schema with **Row Level Security (RLS) enabled on every table**. Authentication is handled by Supabase Auth (`auth.users`); a trigger auto-creates a `profiles` row on signup. The data model supports three functional areas:

1. **User identity and billing** — `profiles`
2. **Astrology computation** — `birth_data`, `astro_profiles`, `natal_charts`
3. **Interactive experience** — `contribution_events`, `user_signature_state`, `daily_horoscope_cache`, `agent_conversations`

---

## Tables

### profiles

Auto-created on signup via `handle_new_user()` trigger. Stores account metadata and billing state.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | FK to `auth.users(id)`, cascade delete |
| `email` | TEXT | Copied from auth on signup |
| `display_name` | TEXT | Optional |
| `tier` | TEXT | `'free'` or `'premium'` (check constraint) |
| `stripe_customer_id` | TEXT | Stripe integration |
| `stripe_payment_id` | TEXT | Stripe integration |
| `daily_modal_seen` | BOOLEAN | Tracks first-run daily modal |
| `tour_completed` | BOOLEAN | First-time experience onboarding |
| `signatur_intro_seen` | BOOLEAN | First-time experience onboarding |
| `language` | TEXT | `'de'` or `'en'` (default `'de'`) |

**RLS**: Users can SELECT and UPDATE their own row only.

### birth_data

Write-once birth parameters (one per user). Used as input for chart computation.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | Auto-generated |
| `user_id` | UUID (UNIQUE) | FK to `auth.users`, cascade delete |
| `birth_utc` | TEXT | ISO datetime string |
| `lat` / `lon` | DOUBLE PRECISION | Birth coordinates |
| `place_label` | TEXT | Human-readable location |

**RLS**: Users can perform all operations on their own rows.

### astro_profiles

Primary profile row consumed by the Dashboard, ElevenLabs voice agent, and Fusion Ring. One row per user (PK on `user_id`), upserted on recalculation.

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | UUID (PK) | FK to `auth.users`, cascade delete |
| `birth_date` | DATE | Extracted date portion |
| `birth_time` | TEXT | HH:MM format |
| `sun_sign` / `moon_sign` / `asc_sign` | TEXT | Western big-three signs |
| `astro_json` | JSONB | Full BAFE payload (BaZi, Western, Fusion, WuXing, interpretation, tiles, houses) |
| `soulprint_sectors` | JSONB | 12-sector soulprint for Fusion Ring V2 |
| `astro_computed_at` | TIMESTAMPTZ | When the profile was last computed |

**RLS**: Users can SELECT and manage their own row. `GRANT ALL` to `authenticated`.

### natal_charts

Immutable snapshot of the birth chart computation. One per user.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | Auto-generated |
| `user_id` | UUID (UNIQUE) | FK to `auth.users`, cascade delete |
| `payload` | JSONB | Complete BAFE API response |
| `engine_version` | TEXT | e.g. `'bafe-1.0'` |
| `zodiac` | TEXT | Default `'tropical'` |
| `house_system` | TEXT | Default `'placidus'` |

**RLS**: Users can perform all operations on their own rows.

### contribution_events

Quiz results that feed into the Fusion Ring signal. Upserted on quiz retake (unique on `user_id + module_id`).

| Column | Type | Notes |
|--------|------|-------|
| `id` | BIGINT (PK) | Auto-generated identity |
| `user_id` | UUID | FK to `auth.users` (nullable for anon) |
| `event_id` | TEXT (UNIQUE) | Client-generated idempotency key |
| `module_id` | TEXT | Quiz identifier |
| `payload` | JSONB | Sector weights from quiz |
| `occurred_at` | TIMESTAMPTZ | When the quiz was completed |

**RLS**: Authenticated users CRUD own rows. Anon users can INSERT only when `user_id IS NULL`.

### user_signature_state

Persisted Fusion Ring signature state across quiz interactions. One row per user.

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | UUID (PK) | FK to `auth.users`, cascade delete |
| `signature_blueprint_json` | JSONB | Computed signature blueprint |
| `soulprint_sectors` | JSONB | 12-sector soulprint data |
| `quiz_sectors` | JSONB | Accumulated quiz sector weights |
| `quiz_version` / `signature_version` | INTEGER | Versioning for cache invalidation |

**RLS**: Users can perform all operations on their own row.

### daily_horoscope_cache

Caches generated daily horoscopes to avoid redundant LLM calls. Composite PK ensures one entry per user/date/engine/signature combination.

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | UUID | FK to `auth.users`, cascade delete |
| `local_date` | DATE | The horoscope date |
| `engine_version` | TEXT | Generation engine version |
| `signature_version` | INTEGER | Signature state version |
| `payload_json` | JSONB | Generated horoscope content |

**PK**: (`user_id`, `local_date`, `engine_version`, `signature_version`)
**RLS**: Users can SELECT their own rows only (server writes via service role).

### agent_conversations

Session summaries from the Levi voice agent (ElevenLabs). Multiple rows per user (one per session).

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID (PK) | Auto-generated |
| `user_id` | UUID | FK to `auth.users`, cascade delete |
| `summary` | TEXT | Conversation summary |
| `topics` | JSONB | Extracted topic tags |

**RLS**: Users can SELECT their own rows only (server writes via service role).

---

## Relationships

All user-facing tables reference `auth.users(id)` with `ON DELETE CASCADE`. The relationship topology is strictly **hub-and-spoke** around the user:

```
auth.users (id)
  ├── profiles (id)              1:1
  ├── birth_data (user_id)       1:1
  ├── astro_profiles (user_id)   1:1
  ├── natal_charts (user_id)     1:1
  ├── user_signature_state       1:1
  ├── contribution_events        1:N  (one per quiz module)
  ├── daily_horoscope_cache      1:N  (one per date/engine/version)
  └── agent_conversations        1:N  (one per session)
```

There are no cross-table foreign keys beyond `auth.users`. Tables are logically coupled (e.g., `astro_profiles.astro_json` is computed from `birth_data` + BAFE API response stored in `natal_charts`) but not enforced via SQL constraints.

---

## Migration Strategy

SQL migrations are maintained as versioned files in `supabase-migrations/`:

| File | Purpose |
|------|---------|
| `supabase-schema.sql` | Baseline schema (profiles, birth_data, astro_profiles, natal_charts, agent_conversations, contribution_events, premium columns) |
| `supabase-migration-contribution-events.sql` | Standalone contribution_events creation (predates consolidation into baseline) |
| `supabase-fix-trigger.sql` | Fixes `handle_new_user()` trigger for schema drift |
| `20260316_experience_tables.sql` | Adds `user_signature_state`, `daily_horoscope_cache`, `soulprint_sectors` column on astro_profiles, `daily_modal_seen` on profiles |
| `20260321_first_time_experience.sql` | Adds `tour_completed`, `signatur_intro_seen`, `language` columns to profiles |

Migrations are applied manually via the Supabase SQL Editor. There is no automated migration runner at this time.

---

## References

- Source schema: [`supabase-schema.sql`](../supabase-schema.sql)
- Supabase service layer: [`src/services/supabase.ts`](../src/services/supabase.ts)
- Migration files: [`supabase-migrations/`](../supabase-migrations/)
