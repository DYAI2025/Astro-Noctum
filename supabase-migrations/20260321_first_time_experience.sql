-- First-Time Experience columns
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS tour_completed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS signatur_intro_seen BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'de'
    CHECK (language IN ('de', 'en'));
