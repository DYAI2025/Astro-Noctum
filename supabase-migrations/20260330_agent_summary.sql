-- Agent auto-summary: stores a Gemini-synthesized user profile summary
-- derived from conversation history with Levi/Eve voice agents.
-- Populated by POST /api/agent/summary after >= 3 sessions.

ALTER TABLE astro_profiles ADD COLUMN IF NOT EXISTS agent_summary TEXT;
