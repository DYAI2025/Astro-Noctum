/**
 * Tests for server-side tier enforcement middleware.
 * DEC-conversion-tiers: "Tier gates are enforced server-side (not just hidden in UI)"
 */

import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const loadTestApp = async () => {
  vi.resetModules();
  process.env.NODE_ENV = 'test';
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  const mod = await import('../../server.mjs');
  return mod.app;
};

/** Build a fetch mock that returns `tier` from profiles REST calls */
function makeFetchMock(tier: 'premium' | 'free' | null) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input
      : input instanceof URL ? input.toString()
      : (input as Request).url;

    if (url.includes('auth/v1/user')) {
      return {
        ok: true, status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ id: 'user-1', email: 'test@test.com', aud: 'authenticated' }),
        text: async () => JSON.stringify({ id: 'user-1', email: 'test@test.com', aud: 'authenticated' }),
      } as Response;
    }

    // Supabase profiles table query — return tier data
    if (url.includes('rest/v1/profiles')) {
      const row = tier ? { id: 'user-1', tier } : null;
      const body = row ? [row] : [];
      return {
        ok: true, status: 200,
        headers: new Headers({ 'content-type': 'application/json', 'content-range': '0-0/1' }),
        json: async () => body,
        text: async () => JSON.stringify(body),
      } as Response;
    }

    // All other Supabase REST calls — empty response
    if (url.includes('rest/v1')) {
      return {
        ok: true, status: 200,
        headers: new Headers({ 'content-type': 'application/json', 'content-range': '0-0/0' }),
        json: async () => [],
        text: async () => '[]',
      } as Response;
    }

    // Default — 500 to surface unexpected calls
    return { ok: false, status: 500, headers: new Headers(), json: async () => ({}), text: async () => '' } as Response;
  });
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('requirePremium middleware', () => {
  it('returns 403 for free-tier user hitting /api/synastry', async () => {
    const app = await loadTestApp();
    vi.spyOn(globalThis, 'fetch').mockImplementation(makeFetchMock('free'));

    const res = await request(app)
      .post('/api/synastry')
      .set('Authorization', 'Bearer test-token')
      .send({ partner_id: 'some-partner-id' });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('premium_required');
  });

  it('returns 403 when profiles row is missing (null tier defaults to free)', async () => {
    const app = await loadTestApp();
    vi.spyOn(globalThis, 'fetch').mockImplementation(makeFetchMock(null));

    const res = await request(app)
      .post('/api/synastry')
      .set('Authorization', 'Bearer test-token')
      .send({ partner_id: 'some-partner-id' });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('premium_required');
  });

  it('allows premium-tier user past the gate (proceeds to handler logic)', async () => {
    const app = await loadTestApp();
    vi.spyOn(globalThis, 'fetch').mockImplementation(makeFetchMock('premium'));

    const res = await request(app)
      .post('/api/synastry')
      .set('Authorization', 'Bearer test-token')
      .send({ partner_id: 'some-partner-id' });

    // Premium gate passed — will 422 because user has no birth data (test env),
    // but must NOT be 401 or 403.
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });

  it('returns 401 without auth header (requireUserAuth runs before requirePremium)', async () => {
    const app = await loadTestApp();

    const res = await request(app)
      .post('/api/synastry')
      .send({ partner_id: 'some-partner-id' });

    expect(res.status).toBe(401);
  });
});
