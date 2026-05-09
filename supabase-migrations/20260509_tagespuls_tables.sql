-- 20260509_tagespuls_tables.sql — Tagespuls neu-architecture (Phase B).
--
-- Reference: apps/tagespuls_package/packages/db/schema.sql
--
-- Five tables backing the new "no placeholders" Tagespuls flow:
--   1. aphorisms                  — curated quote corpus (Phase A populated)
--   2. cosmic_weather_snapshots   — daily astro weather payloads (date PK)
--   3. daily_pulses               — per-user-per-day pulse rows
--   4. daily_interpretations      — selected-archetype expansions (one per
--                                   pulse + archetype)
--   5. aphorism_usage_events      — cooldown ledger
--
-- Adaptations from the reference schema:
--
-- a. The reference schema's `user_astro_profiles` cache table is OMITTED.
--    Wuxing vectors are computed inline from the existing
--    `astro_profiles.astro_json` in the daily-pulse handler. One source of
--    truth, no separate populate pipeline.
--
-- b. All `user_id uuid` foreign keys reference `auth.users(id)` directly —
--    matching the project convention used by `astro_profiles`,
--    `birth_data`, `natal_charts`, `partner_profiles`, `ai_quota`, etc.
--
-- c. `daily_pulses.slot_2` and `slot_3` are NULLABLE (architecture gap from
--    the reference). When the LLM is unavailable, the row stores
--    aphorism + computed mode/intensity but null slots. Client renders
--    aphorism alone — no generic placeholder text.
--
-- d. RLS enabled with no policies on all 5 tables → service_role only.
--    Mirrors the `stripe_events` lockdown pattern. The Tagespuls handler
--    runs server-side with the service-role key; PostgREST cannot reach
--    these tables from the browser.

-- ── 1. Aphorisms ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS aphorisms (
  id                  TEXT        PRIMARY KEY,
  status              TEXT        NOT NULL CHECK (status IN ('approved','retired')),
  text_de             TEXT        NOT NULL,
  text_en             TEXT        NOT NULL,
  text_original       TEXT,
  author              TEXT        NOT NULL,
  work                TEXT,
  year                INTEGER,
  original_language   TEXT        NOT NULL,
  translator_de       TEXT,
  translator_en       TEXT,
  copyright           TEXT        NOT NULL,
  attribution_status  TEXT        NOT NULL,
  attribution_note    TEXT,
  mode_tags           TEXT[]      NOT NULL,
  tone_tags           TEXT[]      NOT NULL DEFAULT '{}',
  element_affinity    TEXT[]      NOT NULL DEFAULT '{}',
  figure_affinity     TEXT[]      NOT NULL DEFAULT '{}',
  season_affinity     TEXT[]      NOT NULL DEFAULT '{}',
  word_count_de       INTEGER     NOT NULL,
  word_count_en       INTEGER     NOT NULL,
  quality_rating      INTEGER     NOT NULL CHECK (quality_rating BETWEEN 1 AND 5),
  cooldown_days       INTEGER     NOT NULL DEFAULT 30,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aphorisms_mode_tags
  ON aphorisms USING GIN (mode_tags);
CREATE INDEX IF NOT EXISTS idx_aphorisms_element_affinity
  ON aphorisms USING GIN (element_affinity);

ALTER TABLE aphorisms ENABLE ROW LEVEL SECURITY;
-- No policies → service_role only.

-- ── 2. Cosmic weather snapshots ───────────────────────────────────
CREATE TABLE IF NOT EXISTS cosmic_weather_snapshots (
  date        DATE        PRIMARY KEY,
  payload     JSONB       NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cosmic_weather_snapshots ENABLE ROW LEVEL SECURITY;
-- No policies → service_role only.

-- ── 3. Daily pulses ───────────────────────────────────────────────
-- slot_2 + slot_3 are NULLABLE: when the LLM is unavailable we still
-- persist the row with the aphorism in slot_1 and null follow-up slots.
-- The client renders the aphorism alone in that case — no generic
-- placeholder text.
CREATE TABLE IF NOT EXISTS daily_pulses (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date            DATE        NOT NULL,
  locale          TEXT        NOT NULL DEFAULT 'de',
  mode            TEXT        NOT NULL CHECK (mode IN ('pulse','trace','spannung')),
  intensity       NUMERIC     NOT NULL CHECK (intensity >= 0 AND intensity <= 1),
  harmony_index   NUMERIC,
  aphorism_id     TEXT        REFERENCES aphorisms(id),
  slot_1          TEXT        NOT NULL,
  slot_2          TEXT,
  slot_3          TEXT,
  weather_stale   BOOLEAN     NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT daily_pulses_unique_user_date_locale UNIQUE (user_id, date, locale)
);

CREATE INDEX IF NOT EXISTS idx_daily_pulses_user_date
  ON daily_pulses (user_id, date);

ALTER TABLE daily_pulses ENABLE ROW LEVEL SECURITY;
-- No policies → service_role only.

-- ── 4. Daily interpretations ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_interpretations (
  id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_pulse_id           UUID        NOT NULL REFERENCES daily_pulses(id) ON DELETE CASCADE,
  selected_archetype_key   TEXT        NOT NULL CHECK (selected_archetype_key IN ('sonne','mond','aszendent','day_master','jahrestier','wuxing_dom')),
  locale                   TEXT        NOT NULL DEFAULT 'de',
  text                     TEXT        NOT NULL,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT daily_interpretations_unique_pulse_archetype_locale UNIQUE (daily_pulse_id, selected_archetype_key, locale)
);

ALTER TABLE daily_interpretations ENABLE ROW LEVEL SECURITY;
-- No policies → service_role only.

-- ── 5. Aphorism usage events (cooldown ledger) ────────────────────
CREATE TABLE IF NOT EXISTS aphorism_usage_events (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  aphorism_id     TEXT        NOT NULL REFERENCES aphorisms(id),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date            DATE        NOT NULL,
  daily_pulse_id  UUID        REFERENCES daily_pulses(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT aphorism_usage_events_unique_aphorism_user_date UNIQUE (aphorism_id, user_id, date)
);

ALTER TABLE aphorism_usage_events ENABLE ROW LEVEL SECURITY;
-- No policies → service_role only.
