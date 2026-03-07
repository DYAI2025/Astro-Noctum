-- ===========================================
-- Supabase Migration: astro_profiles extensions
-- ===========================================

-- Add onboarding + compute lifecycle columns
ALTER TABLE astro_profiles
  ADD COLUMN IF NOT EXISTS input_status TEXT NOT NULL DEFAULT 'ready' CHECK (input_status IN ('ready', 'computing', 'computed', 'error')),
  ADD COLUMN IF NOT EXISTS astro_meta_json JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS astro_validation_json JSONB DEFAULT '{}'::jsonb;

-- Add explicit local time column (mirror of birth_time)
ALTER TABLE astro_profiles
  ADD COLUMN IF NOT EXISTS birth_time_local TIME;

-- Backfill birth_time_local from birth_time when missing
UPDATE astro_profiles
SET birth_time_local = birth_time
WHERE birth_time_local IS NULL AND birth_time IS NOT NULL;
