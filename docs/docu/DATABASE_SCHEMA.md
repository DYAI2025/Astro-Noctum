# Database Schema — Astro-Noctum (Bazodiac)

Bazodiac uses **Supabase (PostgreSQL)** for authentication and data persistence. Row Level Security (RLS) is enabled on all tables to ensure data privacy.

## 1. Tables

### `profiles`
The primary user table, linked to `auth.users`.
- `id` (UUID, PK): References `auth.users.id`.
- `tier` (TEXT): 'free' or 'premium'.
- `stripe_customer_id` (TEXT): For processing payments.

### `birth_data`
Stores the raw input provided by the user during onboarding.
- `user_id` (UUID, UNIQUE): Linked to the user.
- `birth_utc` (TEXT): ISO 8601 string.
- `lat`, `lon` (DOUBLE): Coordinates of the birth location.
- `place_label` (TEXT): Formatted address string.

### `astro_profiles`
The main data row used by the UI and the ElevenLabs agent.
- `user_id` (UUID, PK): Exactly one row per user.
- `sun_sign`, `moon_sign`, `asc_sign` (TEXT): Cached Western signs.
- `astro_json` (JSONB): Full results from all BAFE calculations + Gemini interpretation.

### `natal_charts`
Archive of the complete natal chart calculation.
- `payload` (JSONB): The detailed astronomical data.

### `contribution_events`
Stores the results of every quiz completed by the user.
- `module_id` (TEXT): The ID of the quiz (e.g., 'love-languages').
- `payload` (JSONB): Contains detected `markers`, `traits`, and `tags`.
- **Constraint:** Unique index on `(user_id, module_id)` ensures only the latest result per quiz is kept.

### `agent_conversations`
Summaries of interactions with the Levi Bazi voice agent.
- `summary` (TEXT): Concise 2-3 sentence overview.
- `topics` (JSONB): Key concepts discussed.

---

## 2. Security (RLS)

All tables use the `auth.uid() = user_id` (or `auth.uid() = id`) pattern to restrict access.
- Users can only **SELECT** their own data.
- Users can only **INSERT/UPDATE** rows associated with their UUID.
- The `handle_new_user()` trigger ensures a `profiles` row exists immediately after signup.

## 3. Triggers

### `on_auth_user_created`
Executes `public.handle_new_user()` after a user confirms their email or signs up via the server-side API. This ensures the app doesn't crash due to a missing profile row.
