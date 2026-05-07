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

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('server api routes', () => {
  it('proxies /api/transit-state/:userId', async () => {
    const app = await loadTestApp();

    // Mock fetch: first call is Supabase auth (getUser), subsequent calls are the proxy
    const transitPayload = {
      ring: { sectors: Array(12).fill(0.6) },
      soulprint: { sectors: Array(12).fill(0.4) },
      transit_contribution: { transit_intensity: 0.7 },
      delta: { vs_30day_avg: { avg_sectors: Array(12).fill(0.35) } },
      events: [],
      resolution: 42,
    };

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;

      // Supabase GoTrue auth.getUser — expects GoTrue response with user object directly
      if (url.includes('auth/v1/user')) {
        return {
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ id: 'user-1', email: 'test@test.com', aud: 'authenticated' }),
          text: async () => JSON.stringify({ id: 'user-1', email: 'test@test.com', aud: 'authenticated' }),
        } as Response;
      }

      // Supabase REST API queries — return empty arrays/null
      if (url.includes('rest/v1') || url.includes('supabase')) {
        return {
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json', 'content-range': '0-0/0' }),
          json: async () => [],
          text: async () => '[]',
        } as Response;
      }

      // FuFirE proxy or any other call — return transit payload
      return {
        ok: true, status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => JSON.stringify(transitPayload),
        json: async () => transitPayload,
      } as Response;
    });

    const response = await request(app)
      .get('/api/transit-state/user-1')
      .set('Authorization', 'Bearer test-token');

    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.body.ring.sectors).toHaveLength(12);
  });

  it('returns neutral fallback from /api/space-weather when upstream fails', async () => {
    const app = await loadTestApp();

    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network unavailable'));

    const response = await request(app).get('/api/space-weather');

    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toContain('max-age=900');
    expect(response.body.kp_index).toBe(0);
    expect(response.body.source).toBe('fallback');
    expect(response.body.fetched_at).toEqual(expect.any(String));
    expect(response.body.cache_ttl_seconds).toBe(900);
  });

  describe('BAFE proxy auth guard', () => {
    // 2026-05-07 stripe rebuild Task 10: server.mjs's inline
    // requireUserAuth was deleted in favour of the import from
    // server/middleware/auth.mjs. All 15 routes that used the inline
    // version now return the structured envelope:
    //   { error: { code, message, request_id, recoverable, retry_after } }
    // instead of the legacy plain-string shape.
    it('returns 401 AUTH_REQUIRED when no Authorization header is sent', async () => {
      const app = await loadTestApp();
      // No fetch mock needed — middleware returns before any fetch is called
      const res = await request(app)
        .post('/api/calculate/bazi')
        .set('Content-Type', 'application/json')
        .send({ date: '2000-01-01T12:00:00', tz: 'UTC', lat: 52, lon: 13 });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('AUTH_REQUIRED');
      expect(res.body.error.recoverable).toBe(false);
    });

    it('returns 401 AUTH_INVALID when Authorization token is rejected by Supabase', async () => {
      const app = await loadTestApp();
      // Mock ALL fetch calls to simulate Supabase returning auth error.
      // The Supabase client calls fetch internally for auth.getUser().
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => JSON.stringify({ message: 'invalid JWT' }),
        json: async () => ({ message: 'invalid JWT' }),
      } as Response);

      const res = await request(app)
        .post('/api/calculate/bazi')
        .set('Content-Type', 'application/json')
        .set('Authorization', 'Bearer not-a-real-token')
        .send({ date: '2000-01-01T12:00:00', tz: 'UTC', lat: 52, lon: 13 });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('AUTH_INVALID');
    });

    it('returns 401 AUTH_REQUIRED on GET /api/chart when no Authorization header', async () => {
      const app = await loadTestApp();
      const res = await request(app)
        .get('/api/chart')
        .query({ date: '2000-01-01T12:00:00', tz: 'UTC', lat: '52', lon: '13' });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('AUTH_REQUIRED');
    });

    it('returns 401 on POST /api/checkout when no Authorization header', async () => {
      const app = await loadTestApp();
      const res = await request(app)
        .post('/api/checkout')
        .set('Content-Type', 'application/json')
        .send({});
      expect(res.status).toBe(401);
      // /api/checkout migrated to requireUserAuth middleware in
      // 2026-05-07 stripe rebuild Task 10 — now returns the structured
      // envelope { error: { code, message, request_id, recoverable } }
      // instead of the legacy plain-string { error: "Unauthorized" }.
      expect(res.body.error.code).toBe('AUTH_REQUIRED');
      expect(res.body.error.recoverable).toBe(false);
    });

    it('returns 401 on POST /api/customer-portal when no Authorization header', async () => {
      const app = await loadTestApp();
      const res = await request(app)
        .post('/api/customer-portal')
        .set('Content-Type', 'application/json')
        .send({});
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('AUTH_REQUIRED');
      expect(res.body.error.recoverable).toBe(false);
    });
  });
});
