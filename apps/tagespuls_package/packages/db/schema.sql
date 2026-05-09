-- ⚠️ DESIGN REFERENCE ONLY — production schema lives in
-- supabase-migrations/20260509_tagespuls_tables.sql
-- That file documents three intentional divergences from this reference:
--   1. user_astro_profiles is OMITTED (uses existing astro_profiles table,
--      one source of truth for chart data, no separate populate pipeline).
--   2. daily_pulses.slot_2 / slot_3 are NULLABLE (when LLM exhausted,
--      row stores aphorism + computed mode but null slots — no fake text).
--   3. user_id FKs reference auth.users(id), not user_astro_profiles
--      (matches existing astro_profiles, birth_data, natal_charts patterns).
-- Update this file when the reference shape changes; do NOT use it to
-- generate prod DDL.

create table if not exists aphorisms (
  id text primary key,
  status text not null check (status in ('approved','retired')),
  text_de text not null,
  text_en text not null,
  text_original text,
  author text not null,
  work text,
  year integer,
  original_language text not null,
  translator_de text,
  translator_en text,
  copyright text not null,
  attribution_status text not null,
  attribution_note text,
  mode_tags text[] not null,
  tone_tags text[] not null default '{}',
  element_affinity text[] not null default '{}',
  figure_affinity text[] not null default '{}',
  season_affinity text[] not null default '{}',
  word_count_de integer not null,
  word_count_en integer not null,
  quality_rating integer not null check (quality_rating between 1 and 5),
  cooldown_days integer not null default 30,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cosmic_weather_snapshots (
  date date primary key,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists user_astro_profiles (
  user_id uuid primary key,
  locale text not null default 'de',
  western_wuxing_vector jsonb not null,
  bazi_wuxing_vector jsonb not null,
  council jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists daily_pulses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references user_astro_profiles(user_id),
  date date not null,
  locale text not null default 'de',
  mode text not null check (mode in ('pulse','trace','spannung')),
  intensity numeric not null check (intensity >= 0 and intensity <= 1),
  harmony_index numeric,
  aphorism_id text references aphorisms(id),
  slot_1 text not null,
  slot_2 text not null,
  slot_3 text not null,
  weather_stale boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, date, locale)
);

create table if not exists daily_interpretations (
  id uuid primary key default gen_random_uuid(),
  daily_pulse_id uuid not null references daily_pulses(id),
  selected_archetype_key text not null check (selected_archetype_key in ('sonne','mond','aszendent','day_master','jahrestier','wuxing_dom')),
  locale text not null default 'de',
  text text not null,
  created_at timestamptz not null default now(),
  unique (daily_pulse_id, selected_archetype_key, locale)
);

create table if not exists aphorism_usage_events (
  id uuid primary key default gen_random_uuid(),
  aphorism_id text not null references aphorisms(id),
  user_id uuid not null,
  date date not null,
  daily_pulse_id uuid references daily_pulses(id),
  created_at timestamptz not null default now(),
  unique (aphorism_id, user_id, date)
);

create index if not exists idx_aphorisms_mode_tags on aphorisms using gin(mode_tags);
create index if not exists idx_aphorisms_element_affinity on aphorisms using gin(element_affinity);
create index if not exists idx_daily_pulses_user_date on daily_pulses(user_id, date);
