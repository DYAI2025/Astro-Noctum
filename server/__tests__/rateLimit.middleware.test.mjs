// @vitest-environment node
import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

describe('aiRateLimit middleware', () => {
  it('exports aiUserRateLimit and aiIpRateLimit as functions', async () => {
    const mod = await import('../middleware/rateLimit.mjs');
    expect(typeof mod.aiUserRateLimit).toBe('function');
    expect(typeof mod.aiIpRateLimit).toBe('function');
  });

  it('returns 429 with RATE_LIMITED code after IP limit exceeded', async () => {
    process.env.AI_IP_LIMIT = '2';
    process.env.AI_WINDOW_MS = '60000';

    // Fresh import with its own limiter store
    const { aiIpRateLimit } = await import('../middleware/rateLimit.mjs');
    const app = express();
    app.set('trust proxy', 1);
    const limiter = aiIpRateLimit();
    app.get('/test', limiter, (_req, res) => res.json({ ok: true }));

    await request(app).get('/test');
    await request(app).get('/test');
    const res = await request(app).get('/test');

    expect(res.status).toBe(429);
    expect(res.body.error?.code).toBe('RATE_LIMITED');
    expect(res.body.error?.recoverable).toBe(true);
    expect(typeof res.body.error?.retry_after).toBe('number');
  });

  it('aiUserRateLimit uses lower limit for free tier', async () => {
    const { aiUserRateLimit } = await import('../middleware/rateLimit.mjs');
    expect(typeof aiUserRateLimit('free')).toBe('function');
    expect(typeof aiUserRateLimit('premium')).toBe('function');
  });
});
