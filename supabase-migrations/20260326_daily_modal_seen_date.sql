-- Add date-based daily modal tracking (replaces boolean daily_modal_seen)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_modal_seen_date DATE;

-- Migrate existing boolean: users who already dismissed get yesterday's date
-- so they'll see the modal again tomorrow (not immediately)
UPDATE profiles SET daily_modal_seen_date = (CURRENT_DATE - INTERVAL '1 day')::DATE
  WHERE daily_modal_seen = TRUE AND daily_modal_seen_date IS NULL;
