-- ============================================================
-- Astro-Noctum: Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ── profiles (auto-created on signup via trigger) ──────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Trigger: auto-create profile row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── birth_data ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS birth_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  birth_utc TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lon DOUBLE PRECISION NOT NULL,
  place_label TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE birth_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own birth_data" ON birth_data
  FOR ALL USING (auth.uid() = user_id);

-- ── astro_profiles (main profile for ElevenLabs) ──────────────────
CREATE TABLE IF NOT EXISTS astro_profiles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  birth_date DATE,
  birth_time TEXT,
  iana_time_zone TEXT,
  birth_lat DOUBLE PRECISION,
  birth_lng DOUBLE PRECISION,
  birth_place_name TEXT,
  sun_sign TEXT,
  moon_sign TEXT,
  asc_sign TEXT,
  astro_json JSONB,
  astro_computed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE astro_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own astro_profile" ON astro_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users upsert own astro_profile" ON astro_profiles
  FOR ALL USING (auth.uid() = user_id);

-- ── natal_charts (calculation history) ────────────────────────────
CREATE TABLE IF NOT EXISTS natal_charts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  payload JSONB,
  engine_version TEXT,
  zodiac TEXT DEFAULT 'tropical',
  house_system TEXT DEFAULT 'placidus',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE natal_charts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own charts" ON natal_charts
  FOR ALL USING (auth.uid() = user_id);
