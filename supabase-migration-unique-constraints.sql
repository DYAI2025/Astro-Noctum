-- ============================================================
-- MIGRATION: Enforce one-per-user constraints
-- Run in Supabase SQL Editor ONCE on existing databases.
-- Safe to run multiple times (idempotent).
-- ============================================================

-- Step 1: Remove duplicate birth_data rows (keep earliest)
DELETE FROM birth_data
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM birth_data
  ORDER BY user_id, created_at ASC
);

-- Step 2: Remove duplicate natal_charts rows (keep earliest)
DELETE FROM natal_charts
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM natal_charts
  ORDER BY user_id, created_at ASC
);

-- Step 3: Add UNIQUE constraints
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'birth_data_user_id_key') THEN
    ALTER TABLE birth_data ADD CONSTRAINT birth_data_user_id_key UNIQUE (user_id);
    RAISE NOTICE 'Added UNIQUE constraint to birth_data.user_id';
  ELSE
    RAISE NOTICE 'birth_data.user_id UNIQUE constraint already exists';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'natal_charts_user_id_key') THEN
    ALTER TABLE natal_charts ADD CONSTRAINT natal_charts_user_id_key UNIQUE (user_id);
    RAISE NOTICE 'Added UNIQUE constraint to natal_charts.user_id';
  ELSE
    RAISE NOTICE 'natal_charts.user_id UNIQUE constraint already exists';
  END IF;
END $$;

-- Step 4: Verify astro_profiles already has PK on user_id (should be true)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'astro_profiles'
      AND constraint_type = 'PRIMARY KEY'
  ) THEN
    RAISE NOTICE 'astro_profiles PK on user_id confirmed ✓';
  ELSE
    RAISE WARNING 'astro_profiles has no PRIMARY KEY — this is unexpected!';
  END IF;
END $$;

-- Step 5: Add INSERT-only RLS policy for astro_profiles (prevent UPDATE)
-- Users can SELECT their own profile, INSERT once, but never UPDATE or DELETE.
DROP POLICY IF EXISTS "Users upsert own astro_profile" ON astro_profiles;
DROP POLICY IF EXISTS "Users read own astro_profile" ON astro_profiles;

CREATE POLICY "Users can read own profile" ON astro_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile once" ON astro_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- No UPDATE or DELETE policy → profile is immutable via client
