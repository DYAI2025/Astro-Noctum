// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

describe('elevenLabsAuth middleware', () => {
  const SECRET = 'test-elevenlabs-secret-1234567890';

  beforeEach(() => {
    process.env.ELEVENLABS_TOOL_SECRET = SECRET;
  });

  async function loadApp() {
    const { elevenLabsAuth } = await import('../middleware/elevenLabsAuth.mjs');
    const { requestIdMiddleware } = await import('../middleware/requestId.mjs');
    const app = express();
    app.use(requestIdMiddleware);
    app.get('/test', elevenLabsAuth, (_req, res) => res.json({ ok: true }));
    return app;
  }

  it('AUTH-EL-001: returns 401 AUTH_REQUIRED when no Authorization header', async () => {
    const app = await loadApp();
    const res = await request(app).get('/test');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_REQUIRED');
    expect(res.body.error.recoverable).toBe(false);
    expect(res.body.error.request_id).toMatch(/^req_/);
  });

  it('AUTH-EL-002: returns 401 AUTH_REQUIRED for non-Bearer scheme', async () => {
    const app = await loadApp();
    const res = await request(app).get('/test').set('Authorization', 'Basic abc');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_REQUIRED');
  });

  it('AUTH-EL-003: returns 401 AUTH_INVALID for wrong secret', async () => {
    const app = await loadApp();
    const res = await request(app).get('/test').set('Authorization', 'Bearer wrong-secret');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_INVALID');
  });

  it('AUTH-EL-004: returns 401 AUTH_INVALID for secret of different length (timing-safe)', async () => {
    const app = await loadApp();
    const res = await request(app).get('/test').set('Authorization', 'Bearer x');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_INVALID');
  });

  it('AUTH-EL-005: passes with the correct secret', async () => {
    const app = await loadApp();
    const res = await request(app).get('/test').set('Authorization', `Bearer ${SECRET}`);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('AUTH-EL-006: returns 503 AI_CONFIG_MISSING when secret env var is unset', async () => {
    delete process.env.ELEVENLABS_TOOL_SECRET;
    const app = await loadApp();
    const res = await request(app).get('/test').set('Authorization', 'Bearer anything');
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('AI_CONFIG_MISSING');
    expect(res.body.error.recoverable).toBe(false);
  });

  it('AUTH-EL-007: returns 503 even when secret is empty string', async () => {
    process.env.ELEVENLABS_TOOL_SECRET = '';
    const app = await loadApp();
    const res = await request(app).get('/test').set('Authorization', 'Bearer anything');
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('AI_CONFIG_MISSING');
  });
});
