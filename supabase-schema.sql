-- ============================================================
-- Astro-Noctum: Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ── profiles (auto-created on signup via trigger) ──────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  display_name TEXT NOT NULL DEFAULT 'User',
  CONSTRAINT profiles_display_name_length CHECK (char_length(btrim(display_name)) BETWEEN 1 AND 50),
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

ALTER TABLE birth_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own birth_data" ON birth_data
  FOR ALL USING (auth.uid() = user_id);

-- ── astro_profiles (ONE per user — immutable after creation) ──────
-- This is the main profile row read by ElevenLabs and the Dashboard.
-- user_id is PRIMARY KEY → exactly one row per user.
-- All columns are nullable except user_id (graceful partial inserts).
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

GRANT ALL ON astro_profiles TO authenticated;

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

ALTER TABLE natal_charts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own charts" ON natal_charts
  FOR ALL USING (auth.uid() = user_id);

-- ── partner_profiles (N per user — synastry birth data) ─────────────
-- DEC-synastry-architecture: partner account not required; manual entry only.
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

-- ── agent_conversations (Levi session summaries) ────────────────────
CREATE TABLE IF NOT EXISTS agent_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  summary TEXT NOT NULL,
  topics JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE agent_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own conversations" ON agent_conversations
  FOR SELECT USING (auth.uid() = user_id);

-- === Premium Tier ===
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'free'
CHECK (tier IN ('free', 'premium'));

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stripe_payment_id TEXT;

-- Subscription state (set by Stripe webhook). Mirrors
-- supabase-migrations/20260324_stripe_subscription_columns.sql so a
-- clean rebuild from this schema file matches prod.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_end TIMESTAMPTZ;

COMMENT ON COLUMN profiles.stripe_subscription_id IS 'Stripe subscription ID (sub_xxx). Set on checkout.session.completed via webhook.';
COMMENT ON COLUMN profiles.subscription_end IS 'UTC timestamp when current subscription period ends. Set on subscription.updated/deleted/invoice.payment_succeeded. Used to grant access until period end on cancellation.';

CREATE INDEX IF NOT EXISTS idx_profiles_tier ON profiles(tier);

-- === Contribution Events (Quiz results for Fusion Ring) ===
CREATE TABLE IF NOT EXISTS public.contribution_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id),
  event_id text unique not null,
  module_id text not null,
  occurred_at timestamptz not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS idx_contribution_events_user_id ON public.contribution_events(user_id);
CREATE INDEX IF NOT EXISTS idx_contribution_events_module_id ON public.contribution_events(module_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_contribution_user_module ON public.contribution_events(user_id, module_id);

ALTER TABLE public.contribution_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_events" ON public.contribution_events
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "users_insert_own_events" ON public.contribution_events
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_update_own_events" ON public.contribution_events
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "users_delete_own_events" ON public.contribution_events
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "anon_insert_events" ON public.contribution_events
  FOR INSERT TO anon WITH CHECK (user_id IS NULL);

-- ── AI Quota tracking ─────────────────────────────────────────────────
-- Atomic per-user quota for AI provider calls (Gemini / OpenRouter).
-- Limits are passed as RPC arguments; server reads them from env vars.
-- See supabase-migrations/20260506_ai_quota.sql for the full migration.

CREATE TABLE IF NOT EXISTS ai_quota (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  route_group   TEXT        NOT NULL,
  period_start  TIMESTAMPTZ NOT NULL,
  period_end    TIMESTAMPTZ NOT NULL,
  "limit"       INTEGER     NOT NULL,
  used          INTEGER     NOT NULL DEFAULT 0,
  reserved      INTEGER     NOT NULL DEFAULT 0,
  tier          TEXT        NOT NULL DEFAULT 'free',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ai_quota_unique_period UNIQUE (user_id, route_group, period_start),
  CONSTRAINT ai_quota_used_nonneg CHECK (used >= 0),
  CONSTRAINT ai_quota_reserved_nonneg CHECK (reserved >= 0),
  CONSTRAINT ai_quota_limit_pos CHECK ("limit" > 0)
);

CREATE INDEX IF NOT EXISTS ai_quota_user_route_idx
  ON ai_quota (user_id, route_group, period_start);

ALTER TABLE ai_quota ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own quota" ON ai_quota
  FOR SELECT USING (auth.uid() = user_id);

-- RPCs: reserve_ai_quota, commit_ai_quota, refund_ai_quota
-- (Definitions live only in the migration file. EXECUTE granted to
-- service_role only — never authenticated. PostgREST cannot reach these.
-- Each function also raises 42501 if auth.uid() != p_user_id and the
-- caller is not service_role — defense in depth.)

-- ── Stripe webhook event dedup log ─────────────────────────────────
-- Mirrors supabase-migrations/20260507_stripe_events.sql. PRIMARY KEY
-- on the Stripe event ID is the dedup mechanism. RLS on with no policy
-- → service_role only.
CREATE TABLE IF NOT EXISTS stripe_events (
  id              TEXT        PRIMARY KEY,
  type            TEXT        NOT NULL,
  livemode        BOOLEAN     NOT NULL,
  api_version     TEXT,
  received_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at    TIMESTAMPTZ,
  process_error   TEXT,
  raw_payload     JSONB
);

CREATE INDEX IF NOT EXISTS stripe_events_type_idx ON stripe_events (type);
CREATE INDEX IF NOT EXISTS stripe_events_received_idx ON stripe_events (received_at DESC);

ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;
