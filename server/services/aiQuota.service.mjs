import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'http://localhost',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder',
);

/**
 * Limit lookup. ENV-driven so tier upgrades don't need a DB migration.
 * Defaults are conservative — override via Railway env vars.
 */
function limitFor(tier, period) {
  if (period === 'monthly') {
    return tier === 'premium'
      ? parseInt(process.env.AI_MONTHLY_PREMIUM_LIMIT ?? '1000', 10)
      : parseInt(process.env.AI_MONTHLY_FREE_LIMIT ?? '100', 10);
  }
  // daily (default)
  return tier === 'premium'
    ? parseInt(process.env.AI_DAILY_PREMIUM_LIMIT ?? '100', 10)
    : parseInt(process.env.AI_DAILY_FREE_LIMIT ?? '20', 10);
}

/**
 * Atomically reserve one slot in the user's quota for `routeGroup`.
 *
 * @returns {Promise<{
 *   allowed: boolean,
 *   quotaRemaining: number,
 *   quotaResetAt: string | null,
 * }>}
 */
export async function reserveAiQuota(userId, routeGroup, tier = 'free', period = 'daily') {
  const { data, error } = await supabase.rpc('reserve_ai_quota', {
    p_user_id: userId,
    p_route_group: routeGroup,
    p_tier: tier,
    p_period: period,
    p_limit: limitFor(tier, period),
  });
  if (error) throw new Error(`AI quota reserve failed: ${error.message}`);
  return {
    allowed: !!data?.allowed,
    quotaRemaining: data?.quota_remaining ?? 0,
    quotaResetAt: data?.quota_reset_at ?? null,
  };
}

/**
 * Commit a previously reserved slot. Idempotent at the RPC level — calling
 * it without a matching reservation is a no-op. Errors are swallowed: a
 * commit failure must not break the user's response after the AI call has
 * already succeeded. Logged for observability.
 */
export async function commitAiQuota(userId, routeGroup, period = 'daily') {
  const { error } = await supabase.rpc('commit_ai_quota', {
    p_user_id: userId,
    p_route_group: routeGroup,
    p_period: period,
  });
  if (error) {
    console.error('[aiQuota] commit failed (non-fatal):', { userId, routeGroup, period, error: error.message });
  }
}

/**
 * Refund a reservation when the AI provider call fails.
 * Errors are swallowed for the same reason as commit.
 */
export async function refundAiQuota(userId, routeGroup, period = 'daily') {
  const { error } = await supabase.rpc('refund_ai_quota', {
    p_user_id: userId,
    p_route_group: routeGroup,
    p_period: period,
  });
  if (error) {
    console.error('[aiQuota] refund failed (non-fatal):', { userId, routeGroup, period, error: error.message });
  }
}

/**
 * Read-only view of the user's current quota for the active period.
 * Returns null if no row exists yet. Used for `quota_remaining`
 * response headers and admin/debug surfaces.
 */
export async function getAiQuotaStatus(userId, routeGroup) {
  const { data, error } = await supabase
    .from('ai_quota')
    .select('used, reserved, limit, period_end')
    .eq('user_id', userId)
    .eq('route_group', routeGroup)
    .gte('period_end', new Date().toISOString())
    .order('period_start', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return {
    used: data.used,
    reserved: data.reserved,
    limit: data.limit,
    remaining: Math.max(0, data.limit - data.used - data.reserved),
    resetAt: data.period_end,
  };
}
