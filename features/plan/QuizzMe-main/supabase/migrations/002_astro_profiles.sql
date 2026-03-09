-- ===========================================
-- Supabase Migration: astro_profiles table
-- ===========================================

CREATE TABLE IF NOT EXISTS astro_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Identity
  username TEXT NOT NULL,

  -- Birth (cosmic strict compatible)
  birth_date DATE NOT NULL,
  birth_time TIME NOT NULL,

  -- IANA timezone required in strict mode (e.g. "Europe/Berlin")
  iana_time_zone TEXT NOT NULL,

  -- DST disambiguation for ambiguous local times (0 or 1), nullable
  fold SMALLINT,
  CONSTRAINT astro_profiles_fold_check CHECK (fold IS NULL OR fold IN (0, 1)),

  -- Birth place (min required for compute)
  birth_place_name TEXT NOT NULL,
  birth_place_country TEXT,
  birth_lat DOUBLE PRECISION NOT NULL,
  birth_lng DOUBLE PRECISION NOT NULL,

  CONSTRAINT astro_profiles_lat_check CHECK (birth_lat >= -90 AND birth_lat <= 90),
  CONSTRAINT astro_profiles_lng_check CHECK (birth_lng >= -180 AND birth_lng <= 180),

  -- Quick-access anchors (optional, but practical for UI)
  sun_sign TEXT,
  moon_sign TEXT,
  asc_sign TEXT,

  -- Full computed payload (cosmic unified result)
  astro_json JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Idempotency / caching
  astro_compute_hash TEXT,
  astro_computed_at TIMESTAMPTZ,
  astro_validation_status TEXT,

  -- Monetization (later: billing provider can be separate)
  account_tier TEXT NOT NULL DEFAULT 'free',
  CONSTRAINT astro_profiles_account_tier_check CHECK (account_tier IN ('free', 'premium')),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for searching (not enforcing uniqueness by default)
CREATE INDEX IF NOT EXISTS astro_profiles_username_lower_idx
ON astro_profiles (lower(username));

-- updated_at trigger function (shared)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_astro_profiles_updated_at ON astro_profiles;
CREATE TRIGGER set_astro_profiles_updated_at
BEFORE UPDATE ON astro_profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- RLS Policies (strict: only authenticated owner)
ALTER TABLE astro_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own astro profile" ON astro_profiles;
CREATE POLICY "Users can read own astro profile" ON astro_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own astro profile" ON astro_profiles;
CREATE POLICY "Users can insert own astro profile" ON astro_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own astro profile" ON astro_profiles;
CREATE POLICY "Users can update own astro profile" ON astro_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Grant access to anon and authenticated roles
-- (anon can NOT pass RLS without auth.uid(), so safe)
GRANT SELECT, INSERT, UPDATE ON astro_profiles TO anon, authenticated;
