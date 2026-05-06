-- 20260507_stripe_events.sql — Stripe webhook event dedup log.
--
-- Stripe retries webhooks on 5xx (and on slow responses past their
-- timeout). To handle replays cleanly we record every processed event
-- ID and skip side-effects on duplicates. The PRIMARY KEY on the
-- Stripe event ID is the dedup mechanism — INSERT raises a unique
-- violation (23505) on retry; the application catches that and no-ops.
--
-- Enforcement strategy is "claim before act":
--   1. INSERT INTO stripe_events (id, type, …)
--   2. If 23505: this is a retry of an already-processed event → skip.
--   3. Otherwise: process the event, then UPDATE processed_at = now().

CREATE TABLE IF NOT EXISTS stripe_events (
  id              TEXT        PRIMARY KEY,           -- Stripe event ID (evt_…)
  type            TEXT        NOT NULL,
  livemode        BOOLEAN     NOT NULL,
  api_version     TEXT,
  received_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at    TIMESTAMPTZ,
  process_error   TEXT,
  raw_payload     JSONB
);

CREATE INDEX IF NOT EXISTS stripe_events_type_idx
  ON stripe_events (type);

CREATE INDEX IF NOT EXISTS stripe_events_received_idx
  ON stripe_events (received_at DESC);

ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;

-- No client should ever read this table. service_role only.
-- RLS = ON with no policy = nobody can read. Matches the policy
-- pattern used for ai_quota in the backend hardening sprint.
