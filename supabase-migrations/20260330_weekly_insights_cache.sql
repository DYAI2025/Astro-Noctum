-- Weekly Insights cache table for life area insights (7-day windows)
-- L2 persistent cache backing the in-memory L1 weekly cache in server.mjs
-- PK: (user_id, iso_week, engine_version) — one entry per user per ISO week per engine version

CREATE TABLE IF NOT EXISTS weekly_insights_cache (
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  iso_week       TEXT NOT NULL,           -- ISO 8601 week string: "2026-W14"
  engine_version TEXT NOT NULL DEFAULT 'v1-gemini-weekly',
  payload_json   JSONB NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (user_id, iso_week, engine_version)
);

-- RLS: users can only read their own weekly cache
ALTER TABLE weekly_insights_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own weekly insights cache"
  ON weekly_insights_cache FOR SELECT
  USING (auth.uid() = user_id);

-- Service role (server.mjs) uses supabaseServer which bypasses RLS,
-- so no INSERT/UPDATE policy needed for end users.

-- Index for fast lookups by user + week
CREATE INDEX IF NOT EXISTS idx_weekly_insights_cache_user_week
  ON weekly_insights_cache (user_id, iso_week DESC);

-- Auto-update updated_at on upsert
CREATE OR REPLACE FUNCTION update_weekly_insights_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_weekly_insights_cache_updated_at
  BEFORE UPDATE ON weekly_insights_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_weekly_insights_cache_updated_at();
