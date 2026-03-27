-- Multi-Agent Voice Architecture: add agent_type to agent_conversations
-- Supports Levi + Eve with per-agent conversation partitioning

ALTER TABLE agent_conversations
  ADD COLUMN IF NOT EXISTS agent_type TEXT NOT NULL DEFAULT 'levi';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE c.conname = 'chk_agent_type'
      AND t.relname = 'agent_conversations'
      AND n.nspname = current_schema()
  ) THEN
    ALTER TABLE agent_conversations
      ADD CONSTRAINT chk_agent_type CHECK (agent_type IN ('levi', 'eve'));
  END IF;
END
$$;

ALTER TABLE agent_conversations
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_agent_conversations_user_agent
  ON agent_conversations (user_id, agent_type, created_at DESC);
