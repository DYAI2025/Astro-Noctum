// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// Single shared mock — all calls to createClient() return the same getUser fn
const mockGetUser = vi.fn();
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
  }),
}));

describe('requireUserAuth', () => {
  let app;

  beforeEach(async () => {
    mockGetUser.mockReset();
    const { requireUserAuth } = await import('../middleware/auth.mjs');
    app = express();
    app.get('/test', requireUserAuth, (req, res) =>
      res.json({ userId: req.userId }));
    // Minimal error handler for tests
    app.use((err, _req, res, _next) => {
      res.status(err.status ?? 500).json({ error: { code: err.code ?? 'INTERNAL_ERROR' } });
    });
  });

  it('AUTH-001: returns 401 AUTH_REQUIRED when no Authorization header', async () => {
    const res = await request(app).get('/test');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_REQUIRED');
  });

  it('AUTH-002: returns 401 AUTH_REQUIRED for non-Bearer scheme', async () => {
    const res = await request(app).get('/test').set('Authorization', 'Basic abc');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_REQUIRED');
  });

  it('AUTH-003: returns 401 AUTH_INVALID when token is invalid', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'bad token' } });
    const res = await request(app).get('/test').set('Authorization', 'Bearer bad-token');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_INVALID');
  });

  it('AUTH-004: sets req.userId on valid token', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-abc' } }, error: null });
    const res = await request(app).get('/test').set('Authorization', 'Bearer valid-token');
    expect(res.status).toBe(200);
    expect(res.body.userId).toBe('user-abc');
  });
});
