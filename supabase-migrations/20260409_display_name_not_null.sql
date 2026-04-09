-- Migration: enforce display_name NOT NULL + non-empty trimmed max 50 chars on profiles
-- REQ-F-onboarding-display-name, DEC-display-name-db-only

-- Backfill existing rows that have NULL or blank display_name with a non-empty placeholder
-- (so the NOT NULL and non-empty constraints can be applied without breaking existing accounts)
UPDATE profiles
SET display_name = 'User'
WHERE display_name IS NULL OR char_length(btrim(display_name)) = 0;

-- Add NOT NULL/default constraint (safe to run even if column already exists)
ALTER TABLE profiles
  ALTER COLUMN display_name SET NOT NULL,
  ALTER COLUMN display_name SET DEFAULT 'User';

-- Add non-empty trimmed length check (DROP first to make migration re-runnable)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_display_name_length;
ALTER TABLE profiles ADD CONSTRAINT profiles_display_name_length
  CHECK (char_length(btrim(display_name)) BETWEEN 1 AND 50);
