-- Migration: partner_profiles table for synastry
-- DEC-synastry-architecture: manual partner birth data, no partner account required
-- Each user can store multiple partners; each partner has full birth coordinates for FuFirE.

CREATE TABLE IF NOT EXISTS partner_profiles (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  display_name  TEXT NOT NULL CHECK (char_length(btrim(display_name)) BETWEEN 1 AND 100),
  birth_date    DATE NOT NULL,
  birth_time    TEXT,                   -- HH:MM, nullable for unknown birth time
  iana_time_zone TEXT,                  -- required for FuFirE when birth_time is set
  birth_place   TEXT,                   -- human-readable label
  birth_lat     DOUBLE PRECISION,
  birth_lon     DOUBLE PRECISION,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE partner_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own partner_profiles" ON partner_profiles
  FOR ALL USING (auth.uid() = user_id);

GRANT ALL ON partner_profiles TO authenticated;

CREATE INDEX IF NOT EXISTS idx_partner_profiles_user_id ON partner_profiles(user_id);
