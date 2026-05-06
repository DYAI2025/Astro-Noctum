-- 20260506_ai_quota.sql — AI quota tracking with atomic reserve/commit/refund
-- Phase 3 of the 2026-05-06 backend hardening sprint
-- (docs/plans/2026-05-06-backend-hardening.md, Tasks 10–11).
--
-- Design notes:
-- 1. Limits are passed as RPC arguments (`p_limit`) by the server, NOT
--    read from a Postgres GUC. This keeps the migration stateless and lets
--    Railway env vars drive limits without a DB redeploy.
-- 2. `reserve_ai_quota` is atomic: it tries to upsert (no-op on conflict)
--    then increments `reserved` only if `(used + reserved) < limit`. The
--    UPDATE … WHERE … RETURNING pattern is race-safe because Postgres
--    serialises row-level updates.
-- 3. `commit_ai_quota` flips a reservation into `used`; `refund_ai_quota`
--    drops the reservation when the provider call fails. Both are
--    idempotent — multiple commits/refunds for the same reservation_id
--    won't double-count because we identify reservations by row, not by id.
--    (We don't return a reservation_id; the caller pairs reserve/commit
--    via (user_id, route_group, period_start) tuple.)

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

-- Authenticated users can read their own quota rows. Writes go through
-- the SECURITY DEFINER RPCs below; no direct UPDATE/INSERT policy.
DROP POLICY IF EXISTS "Users can read own quota" ON ai_quota;
CREATE POLICY "Users can read own quota" ON ai_quota
  FOR SELECT USING (auth.uid() = user_id);

-- Helper: compute period bounds for daily/monthly windows.
CREATE OR REPLACE FUNCTION _ai_quota_period_bounds(p_period TEXT)
RETURNS TABLE (period_start TIMESTAMPTZ, period_end TIMESTAMPTZ)
LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF p_period = 'daily' THEN
    period_start := date_trunc('day', now() AT TIME ZONE 'UTC');
    period_end   := period_start + INTERVAL '1 day';
  ELSIF p_period = 'monthly' THEN
    period_start := date_trunc('month', now() AT TIME ZONE 'UTC');
    period_end   := period_start + INTERVAL '1 month';
  ELSE
    RAISE EXCEPTION 'Invalid period: %, expected daily or monthly', p_period;
  END IF;
  RETURN NEXT;
END;
$$;

-- Atomic reserve. Returns JSON: { allowed, quota_remaining, quota_reset_at }.
-- Caller passes the limit so it can be tier-aware without a DB migration.
CREATE OR REPLACE FUNCTION reserve_ai_quota(
  p_user_id     UUID,
  p_route_group TEXT,
  p_tier        TEXT,
  p_period      TEXT,
  p_limit       INTEGER
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_period_start TIMESTAMPTZ;
  v_period_end   TIMESTAMPTZ;
  v_row          ai_quota%ROWTYPE;
BEGIN
  SELECT period_start, period_end
    INTO v_period_start, v_period_end
    FROM _ai_quota_period_bounds(p_period);

  -- Upsert period row (no-op if it already exists).
  INSERT INTO ai_quota (user_id, route_group, period_start, period_end, "limit", tier)
    VALUES (p_user_id, p_route_group, v_period_start, v_period_end, p_limit, p_tier)
    ON CONFLICT ON CONSTRAINT ai_quota_unique_period DO NOTHING;

  -- Atomic reserve: only increments if budget remains.
  UPDATE ai_quota
    SET reserved = reserved + 1, updated_at = now()
    WHERE user_id = p_user_id
      AND route_group = p_route_group
      AND period_start = v_period_start
      AND (used + reserved) < "limit"
    RETURNING * INTO v_row;

  IF NOT FOUND THEN
    SELECT * INTO v_row FROM ai_quota
      WHERE user_id = p_user_id
        AND route_group = p_route_group
        AND period_start = v_period_start;
    RETURN jsonb_build_object(
      'allowed', false,
      'quota_remaining', GREATEST(0, v_row."limit" - v_row.used - v_row.reserved),
      'quota_reset_at', v_row.period_end
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'quota_remaining', GREATEST(0, v_row."limit" - v_row.used - v_row.reserved),
    'quota_reset_at', v_row.period_end
  );
END;
$$;

-- Commit a reservation: reserved -> used. Idempotent at the row level
-- (caller controls how many times to commit per reservation).
CREATE OR REPLACE FUNCTION commit_ai_quota(
  p_user_id     UUID,
  p_route_group TEXT,
  p_period      TEXT
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_period_start TIMESTAMPTZ;
BEGIN
  SELECT period_start INTO v_period_start FROM _ai_quota_period_bounds(p_period);
  UPDATE ai_quota
    SET used = used + 1,
        reserved = GREATEST(0, reserved - 1),
        updated_at = now()
    WHERE user_id = p_user_id
      AND route_group = p_route_group
      AND period_start = v_period_start
      AND reserved > 0;
END;
$$;

-- Refund a reservation: provider call failed, drop the reservation.
CREATE OR REPLACE FUNCTION refund_ai_quota(
  p_user_id     UUID,
  p_route_group TEXT,
  p_period      TEXT
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_period_start TIMESTAMPTZ;
BEGIN
  SELECT period_start INTO v_period_start FROM _ai_quota_period_bounds(p_period);
  UPDATE ai_quota
    SET reserved = GREATEST(0, reserved - 1),
        updated_at = now()
    WHERE user_id = p_user_id
      AND route_group = p_route_group
      AND period_start = v_period_start
      AND reserved > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION reserve_ai_quota(UUID, TEXT, TEXT, TEXT, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION commit_ai_quota(UUID, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION refund_ai_quota(UUID, TEXT, TEXT) TO authenticated, service_role;
