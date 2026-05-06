-- 20260506_ai_quota_lockdown.sql — Quota RPC hardening (review fix).
--
-- The original 20260506_ai_quota.sql migration GRANTed EXECUTE on the
-- three quota RPCs to BOTH `authenticated` and `service_role`. The
-- `authenticated` grant is unused in production (the JS service uses the
-- service-role key) and exposes a cross-user DoS:
--
--   await supabase.rpc('reserve_ai_quota',
--     { p_user_id: '<victim>', p_route_group: 'interpret',
--       p_tier: 'free', p_period: 'daily', p_limit: 20 });
--
-- Repeated 20× exhausts the victim's daily AI quota. Two-layer fix:
-- (1) defense-in-depth check inside each function body, (2) REVOKE
-- the grant entirely so PostgREST routes can't reach the RPCs.

-- 1. Defense in depth: reject calls where auth.uid() != p_user_id, except
--    when the caller is service_role (server-side path). Wrapped functions
--    keep their original logic verbatim — only the caller-identity check
--    is added at the top.

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
  IF current_setting('request.jwt.claim.role', true) <> 'service_role'
     AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'forbidden: cannot reserve quota for another user'
      USING ERRCODE = '42501';
  END IF;

  SELECT period_start, period_end
    INTO v_period_start, v_period_end
    FROM _ai_quota_period_bounds(p_period);

  INSERT INTO ai_quota (user_id, route_group, period_start, period_end, "limit", tier)
    VALUES (p_user_id, p_route_group, v_period_start, v_period_end, p_limit, p_tier)
    ON CONFLICT ON CONSTRAINT ai_quota_unique_period DO NOTHING;

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

CREATE OR REPLACE FUNCTION commit_ai_quota(
  p_user_id     UUID,
  p_route_group TEXT,
  p_period      TEXT
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_period_start TIMESTAMPTZ;
BEGIN
  IF current_setting('request.jwt.claim.role', true) <> 'service_role'
     AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'forbidden: cannot commit quota for another user'
      USING ERRCODE = '42501';
  END IF;

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

CREATE OR REPLACE FUNCTION refund_ai_quota(
  p_user_id     UUID,
  p_route_group TEXT,
  p_period      TEXT
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_period_start TIMESTAMPTZ;
BEGIN
  IF current_setting('request.jwt.claim.role', true) <> 'service_role'
     AND auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'forbidden: cannot refund quota for another user'
      USING ERRCODE = '42501';
  END IF;

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

-- 2. REVOKE EXECUTE from authenticated. service_role retains access (it
--    holds the JWT claim that the body check exempts).
REVOKE EXECUTE ON FUNCTION reserve_ai_quota(UUID, TEXT, TEXT, TEXT, INTEGER) FROM authenticated;
REVOKE EXECUTE ON FUNCTION commit_ai_quota(UUID, TEXT, TEXT) FROM authenticated;
REVOKE EXECUTE ON FUNCTION refund_ai_quota(UUID, TEXT, TEXT) FROM authenticated;

-- service_role grant is a no-op (already granted by the original migration)
-- but stated explicitly so a fresh deploy of just this file works.
GRANT EXECUTE ON FUNCTION reserve_ai_quota(UUID, TEXT, TEXT, TEXT, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION commit_ai_quota(UUID, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION refund_ai_quota(UUID, TEXT, TEXT) TO service_role;
