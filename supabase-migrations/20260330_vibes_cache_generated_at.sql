ALTER TABLE vibes_cache ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ;

UPDATE vibes_cache
SET generated_at = NOW()
WHERE generated_at IS NULL;

ALTER TABLE vibes_cache
ALTER COLUMN generated_at SET DEFAULT NOW();
