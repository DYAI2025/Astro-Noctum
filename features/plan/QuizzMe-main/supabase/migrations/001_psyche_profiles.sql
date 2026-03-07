-- ===========================================
-- Supabase Migration: psyche_profiles table
-- ===========================================
-- Run this in Supabase SQL Editor:
-- Dashboard → SQL Editor → New Query → Paste & Run

CREATE TABLE IF NOT EXISTS psyche_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User identification (one of these should be set)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT,
  
  -- Core Stats (0..1 normalized)
  clarity REAL NOT NULL DEFAULT 0.5,
  courage REAL NOT NULL DEFAULT 0.5,
  connection REAL NOT NULL DEFAULT 0.5,
  "order" REAL NOT NULL DEFAULT 0.5,
  shadow REAL NOT NULL DEFAULT 0.5,
  
  -- Climate State (0..1 normalized)
  shadow_light REAL NOT NULL DEFAULT 0.5,
  cold_warm REAL NOT NULL DEFAULT 0.5,
  surface_depth REAL NOT NULL DEFAULT 0.5,
  me_we REAL NOT NULL DEFAULT 0.5,
  mind_heart REAL NOT NULL DEFAULT 0.5,
  
  -- Optional JSON fields
  meta_stats JSONB,
  archetype_params JSONB,
  narrative_snippet TEXT,
  last_delta JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT user_or_device CHECK (user_id IS NOT NULL OR device_id IS NOT NULL)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_psyche_profiles_user_id ON psyche_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_psyche_profiles_device_id ON psyche_profiles(device_id);
CREATE INDEX IF NOT EXISTS idx_psyche_profiles_updated_at ON psyche_profiles(updated_at DESC);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_psyche_profiles_updated_at ON psyche_profiles;
CREATE TRIGGER update_psyche_profiles_updated_at
  BEFORE UPDATE ON psyche_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE psyche_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profiles
CREATE POLICY "Users can read own profile" ON psyche_profiles
  FOR SELECT
  USING (
    auth.uid() = user_id
  );

-- Policy: Users can insert their own profiles
CREATE POLICY "Users can insert own profile" ON psyche_profiles
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id 
  );

-- Policy: Users can update their own profiles
CREATE POLICY "Users can update own profile" ON psyche_profiles
  FOR UPDATE
  USING (
    auth.uid() = user_id
  );

-- Grant access to anon and authenticated roles
GRANT SELECT, INSERT, UPDATE ON psyche_profiles TO anon, authenticated;
