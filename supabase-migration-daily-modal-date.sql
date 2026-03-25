-- Migration: Replace daily_modal_seen (boolean) with daily_modal_seen_date (date text)
-- This allows the daily horoscope modal to appear once per calendar day
-- instead of only once ever.

-- Add new column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS daily_modal_seen_date TEXT DEFAULT NULL;

-- Migrate existing data: users who already saw the modal get today's date
-- so they won't see it again today, but will see it tomorrow.
UPDATE profiles
SET daily_modal_seen_date = CURRENT_DATE::TEXT
WHERE daily_modal_seen = TRUE
  AND daily_modal_seen_date IS NULL;

-- Note: We keep daily_modal_seen for backward compatibility during rollout.
-- It can be dropped in a future migration once all clients are updated.
