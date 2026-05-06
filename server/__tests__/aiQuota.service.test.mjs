// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRpc = vi.fn();
const mockFrom = vi.fn();
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    rpc: mockRpc,
    from: mockFrom,
  }),
}));

describe('aiQuota.service', () => {
  let reserveAiQuota, commitAiQuota, refundAiQuota, getAiQuotaStatus;

  beforeEach(async () => {
    mockRpc.mockReset();
    mockFrom.mockReset();
    process.env.AI_DAILY_FREE_LIMIT = '20';
    process.env.AI_DAILY_PREMIUM_LIMIT = '100';
    const mod = await import('../services/aiQuota.service.mjs');
    reserveAiQuota = mod.reserveAiQuota;
    commitAiQuota = mod.commitAiQuota;
    refundAiQuota = mod.refundAiQuota;
    getAiQuotaStatus = mod.getAiQuotaStatus;
  });

  describe('reserveAiQuota', () => {
    it('AI-QUOTA-001: returns allowed=true with quota_remaining when reservation succeeds', async () => {
      mockRpc.mockResolvedValue({
        data: { allowed: true, quota_remaining: 9, quota_reset_at: '2026-05-07T00:00:00Z' },
        error: null,
      });
      const result = await reserveAiQuota('user-1', 'interpret', 'free');
      expect(result.allowed).toBe(true);
      expect(result.quotaRemaining).toBe(9);
      expect(result.quotaResetAt).toBe('2026-05-07T00:00:00Z');
    });

    it('AI-QUOTA-002: returns allowed=false when quota exceeded', async () => {
      mockRpc.mockResolvedValue({
        data: { allowed: false, quota_remaining: 0, quota_reset_at: '2026-05-07T00:00:00Z' },
        error: null,
      });
      const result = await reserveAiQuota('user-1', 'interpret', 'free');
      expect(result.allowed).toBe(false);
      expect(result.quotaRemaining).toBe(0);
    });

    it('AI-QUOTA-003: passes free-tier limit from env to RPC', async () => {
      mockRpc.mockResolvedValue({ data: { allowed: true, quota_remaining: 19 }, error: null });
      await reserveAiQuota('u', 'interpret', 'free', 'daily');
      expect(mockRpc).toHaveBeenCalledWith('reserve_ai_quota', expect.objectContaining({
        p_user_id: 'u',
        p_route_group: 'interpret',
        p_tier: 'free',
        p_period: 'daily',
        p_limit: 20,
      }));
    });

    it('AI-QUOTA-004: passes premium-tier limit from env to RPC', async () => {
      mockRpc.mockResolvedValue({ data: { allowed: true, quota_remaining: 99 }, error: null });
      await reserveAiQuota('u', 'interpret', 'premium', 'daily');
      expect(mockRpc).toHaveBeenCalledWith('reserve_ai_quota', expect.objectContaining({
        p_tier: 'premium',
        p_limit: 100,
      }));
    });

    it('AI-QUOTA-005: throws on Supabase RPC error', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'connection lost' } });
      await expect(reserveAiQuota('u', 'g', 'free')).rejects.toThrow(/connection lost/);
    });

    it('AI-QUOTA-006: monthly period uses monthly env limits', async () => {
      process.env.AI_MONTHLY_FREE_LIMIT = '500';
      // Force re-import so env is re-read
      vi.resetModules();
      const mod = await import('../services/aiQuota.service.mjs');
      mockRpc.mockResolvedValue({ data: { allowed: true, quota_remaining: 499 }, error: null });
      await mod.reserveAiQuota('u', 'interpret', 'free', 'monthly');
      expect(mockRpc).toHaveBeenCalledWith('reserve_ai_quota', expect.objectContaining({
        p_period: 'monthly',
        p_limit: 500,
      }));
    });
  });

  describe('commitAiQuota', () => {
    it('AI-QUOTA-007: calls commit_ai_quota RPC with user/route/period', async () => {
      mockRpc.mockResolvedValue({ data: null, error: null });
      await commitAiQuota('user-1', 'interpret', 'daily');
      expect(mockRpc).toHaveBeenCalledWith('commit_ai_quota', {
        p_user_id: 'user-1',
        p_route_group: 'interpret',
        p_period: 'daily',
      });
    });

    it('AI-QUOTA-008: swallows RPC errors (commit failure must not break user response)', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'transient' } });
      await expect(commitAiQuota('u', 'g', 'daily')).resolves.toBeUndefined();
    });
  });

  describe('refundAiQuota', () => {
    it('AI-QUOTA-009: calls refund_ai_quota RPC', async () => {
      mockRpc.mockResolvedValue({ data: null, error: null });
      await refundAiQuota('user-1', 'interpret', 'daily');
      expect(mockRpc).toHaveBeenCalledWith('refund_ai_quota', {
        p_user_id: 'user-1',
        p_route_group: 'interpret',
        p_period: 'daily',
      });
    });

    it('AI-QUOTA-010: swallows RPC errors', async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: 'transient' } });
      await expect(refundAiQuota('u', 'g', 'daily')).resolves.toBeUndefined();
    });
  });

  describe('getAiQuotaStatus', () => {
    it('AI-QUOTA-011: returns remaining + resetAt for active period', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({
          data: { used: 5, reserved: 1, limit: 20, period_end: '2026-05-07T00:00:00Z' },
          error: null,
        }),
      });
      const status = await getAiQuotaStatus('user-1', 'interpret');
      expect(status.used).toBe(5);
      expect(status.remaining).toBe(14); // 20 - 5 - 1
      expect(status.resetAt).toBe('2026-05-07T00:00:00Z');
    });

    it('AI-QUOTA-012: returns null when no quota row exists', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      });
      const status = await getAiQuotaStatus('user-1', 'interpret');
      expect(status).toBeNull();
    });
  });
});
