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

-- ── birth_data (ONE per user — people have exactly one birthday) ──
CREATE TABLE IF NOT EXISTS birth_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  birth_utc TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lon DOUBLE PRECISION NOT NULL,
  place_label TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Migration: add unique constraint if table already exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'birth_data_user_id_key') THEN
    ALTER TABLE birth_data ADD CONSTRAINT birth_data_user_id_key UNIQUE (user_id);
  END IF;
END $$;

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

-- ── natal_charts (ONE per user — immutable birth chart) ───────────
CREATE TABLE IF NOT EXISTS natal_charts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  payload JSONB,
  engine_version TEXT,
  zodiac TEXT DEFAULT 'tropical',
  house_system TEXT DEFAULT 'placidus',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Migration: add unique constraint if table already exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'natal_charts_user_id_key') THEN
    ALTER TABLE natal_charts ADD CONSTRAINT natal_charts_user_id_key UNIQUE (user_id);
  END IF;
END $$;

ALTER TABLE natal_charts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own charts" ON natal_charts
  FOR ALL USING (auth.uid() = user_id);

-- ── agent_conversations (Levi session summaries) ────────────────────
CREATE TABLE IF NOT EXISTS agent_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  summary TEXT NOT NULL,
  topics JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE agent_conversations ENABLE ROW LEVEL SECURITY;
-- Server uses service_role key, so no RLS policy needed for inserts.
-- Users can read their own conversations (for potential future UI display).
CREATE POLICY "Users read own conversations" ON agent_conversations
  FOR SELECT USING (auth.uid() = user_id);
