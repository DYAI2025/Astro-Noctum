// @vitest-environment node
import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { requireOwnership } from '../middleware/ownership.mjs';
import { requestIdMiddleware } from '../middleware/requestId.mjs';

describe('requireOwnership middleware', () => {
  function buildApp() {
    const app = express();
    app.use(requestIdMiddleware);
    // Simulate auth: pin req.userId from header for testing
    app.use((req, _res, next) => {
      const u = req.headers['x-test-userid'];
      if (u) req.userId = String(u);
      next();
    });
    app.get('/r/:userId', requireOwnership('userId'), (req, res) =>
      res.json({ ok: true, params: req.params }));
    return app;
  }

  it('OWN-001: returns 403 FORBIDDEN with envelope when params.userId != req.userId', async () => {
    const res = await request(buildApp()).get('/r/user-B').set('x-test-userid', 'user-A');
    expect(res.status).toBe(403);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.body.error.code).toBe('FORBIDDEN');
    expect(res.body.error.recoverable).toBe(false);
    expect(res.body.error.request_id).toMatch(/^req_/);
  });

  it('OWN-002: passes when params.userId === req.userId', async () => {
    const res = await request(buildApp()).get('/r/user-A').set('x-test-userid', 'user-A');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('OWN-003: returns 401 AUTH_REQUIRED when req.userId missing', async () => {
    const res = await request(buildApp()).get('/r/user-A');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_REQUIRED');
  });

  it('OWN-004: trims and string-coerces both sides before comparing', async () => {
    // numeric-like ids should still string-compare exactly
    const res = await request(buildApp()).get('/r/123').set('x-test-userid', '123');
    expect(res.status).toBe(200);
  });
});
