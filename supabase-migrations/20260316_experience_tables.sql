-- Signature state per user (persists across quiz interactions)
CREATE TABLE IF NOT EXISTS user_signature_state (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    signature_blueprint_json JSONB NOT NULL,
    soulprint_sectors JSONB NOT NULL,
    quiz_sectors JSONB DEFAULT '[]'::JSONB,
    quiz_version INTEGER DEFAULT 0,
    signature_version INTEGER DEFAULT 1,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_signature_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own signature" ON user_signature_state
    FOR ALL USING (auth.uid() = user_id);

-- Daily horoscope cache
CREATE TABLE IF NOT EXISTS daily_horoscope_cache (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    local_date DATE NOT NULL,
    engine_version TEXT NOT NULL,
    signature_version INTEGER NOT NULL DEFAULT 1,
    payload_json JSONB NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, local_date, engine_version, signature_version)
);

ALTER TABLE daily_horoscope_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own daily cache" ON daily_horoscope_cache
    FOR SELECT USING (auth.uid() = user_id);

-- Add soulprint_sectors column to astro_profiles if not exists
ALTER TABLE astro_profiles ADD COLUMN IF NOT EXISTS soulprint_sectors JSONB;

-- Track first-run daily modal state
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_modal_seen BOOLEAN DEFAULT FALSE;
