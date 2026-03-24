-- Dissonance state columns for astro_profiles
-- Stores the three-layer dissonance snapshot and weight vectors
-- for restoring visual state on profile load.

ALTER TABLE astro_profiles
  ADD COLUMN IF NOT EXISTS natal_weights       JSONB,
  ADD COLUMN IF NOT EXISTS accumulated_weights JSONB,
  ADD COLUMN IF NOT EXISTS dissonance_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS quiz_count          INTEGER DEFAULT 0;

-- Index on quiz_count for quick filtering of engaged users
CREATE INDEX IF NOT EXISTS idx_astro_profiles_quiz_count
  ON astro_profiles (quiz_count)
  WHERE quiz_count > 0;

COMMENT ON COLUMN astro_profiles.natal_weights IS
  'Serialised Record<string, number> of 7-planet natal weights derived from birth soulprint';

COMMENT ON COLUMN astro_profiles.accumulated_weights IS
  'Serialised Record<string, number> of accumulated planet weights after all quiz completions';

COMMENT ON COLUMN astro_profiles.dissonance_snapshot IS
  'Latest DissonanceResult JSON {d_natal, d_accumulated, d_elemental, intensity} — updated on each quiz completion';

COMMENT ON COLUMN astro_profiles.quiz_count IS
  'Total number of quizzes completed — incremented on each contribution';
