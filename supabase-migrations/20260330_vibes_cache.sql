-- Vibes cache table for short-horizon vibes signal (2-3h windows)
-- L2 persistent cache backing the in-memory L1 vibes cache in server.mjs
-- PK: (user_id, time_slot, engine_version) — one entry per user per 30-min window per engine version

CREATE TABLE IF NOT EXISTS vibes_cache (
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  time_slot     TEXT NOT NULL,           -- stringified 30-min epoch slot: Math.floor(Date.now() / (30*60*1000))
  engine_version TEXT NOT NULL DEFAULT 'v1-gemini-vibes',
  payload_json  JSONB NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (user_id, time_slot, engine_version)
);

-- RLS: users can only read their own vibes cache
ALTER TABLE vibes_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own vibes cache"
  ON vibes_cache FOR SELECT
  USING (auth.uid() = user_id);

-- Service role (server.mjs) uses supabaseServer which bypasses RLS,
-- so no INSERT/UPDATE policy needed for end users.

-- Index for fast lookups by user + slot
CREATE INDEX IF NOT EXISTS idx_vibes_cache_user_slot
  ON vibes_cache (user_id, time_slot DESC);

-- Auto-update updated_at on upsert
CREATE OR REPLACE FUNCTION update_vibes_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_vibes_cache_updated_at
  BEFORE UPDATE ON vibes_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_vibes_cache_updated_at();
