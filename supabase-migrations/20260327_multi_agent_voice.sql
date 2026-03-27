-- Multi-Agent Voice Architecture: add agent_type to agent_conversations
-- Supports Levi + Eve with per-agent conversation partitioning

ALTER TABLE agent_conversations
  ADD COLUMN IF NOT EXISTS agent_type TEXT NOT NULL DEFAULT 'levi';

ALTER TABLE agent_conversations
  ADD CONSTRAINT chk_agent_type CHECK (agent_type IN ('levi', 'eve'));

ALTER TABLE agent_conversations
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_agent_conversations_user_agent
  ON agent_conversations (user_id, agent_type);
