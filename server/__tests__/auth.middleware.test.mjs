// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

const mockGetUser = vi.fn();
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
  }),
}));

describe('requireUserAuth (direct JSON response)', () => {
  let app;

  beforeEach(async () => {
    mockGetUser.mockReset();
    const { requireUserAuth } = await import('../middleware/auth.mjs');
    const { requestIdMiddleware } = await import('../middleware/requestId.mjs');
    app = express();
    app.use(requestIdMiddleware);
    app.get('/test', requireUserAuth, (req, res) =>
      res.json({ userId: req.userId }));
    // No error handler mounted on purpose — middleware must handle responses itself
  });

  it('AUTH-001: returns 401 AUTH_REQUIRED with structured envelope when no header', async () => {
    const res = await request(app).get('/test');
    expect(res.status).toBe(401);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body.error.code).toBe('AUTH_REQUIRED');
    expect(res.body.error.recoverable).toBe(false);
    expect(res.body.error.request_id).toMatch(/^req_/);
  });

  it('AUTH-002: returns 401 AUTH_REQUIRED for non-Bearer scheme', async () => {
    const res = await request(app).get('/test').set('Authorization', 'Basic abc');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_REQUIRED');
  });

  it('AUTH-003: returns 401 AUTH_INVALID with structured envelope when token invalid', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'bad' } });
    const res = await request(app).get('/test').set('Authorization', 'Bearer bad-token');
    expect(res.status).toBe(401);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body.error.code).toBe('AUTH_INVALID');
    expect(res.body.error.recoverable).toBe(false);
  });

  it('AUTH-004: sets req.userId on valid token', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-abc' } }, error: null });
    const res = await request(app).get('/test').set('Authorization', 'Bearer valid-token');
    expect(res.status).toBe(200);
    expect(res.body.userId).toBe('user-abc');
  });

  it('AUTH-005: returns 401 AUTH_INVALID when getUser throws', async () => {
    mockGetUser.mockRejectedValue(new Error('network'));
    const res = await request(app).get('/test').set('Authorization', 'Bearer x');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_INVALID');
  });
});
