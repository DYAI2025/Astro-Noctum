-- Migration: enforce display_name NOT NULL + max 50 chars on profiles
-- REQ-F-onboarding-display-name, DEC-display-name-db-only

-- Backfill existing rows that have NULL display_name with empty string
-- (so the NOT NULL constraint can be applied without breaking existing accounts)
UPDATE profiles SET display_name = '' WHERE display_name IS NULL;

-- Add length constraint (safe to run even if column already exists)
ALTER TABLE profiles
  ALTER COLUMN display_name SET NOT NULL,
  ALTER COLUMN display_name SET DEFAULT '';

-- Add length check (DROP first to make migration re-runnable)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_display_name_length;
ALTER TABLE profiles ADD CONSTRAINT profiles_display_name_length
  CHECK (char_length(display_name) <= 50);
