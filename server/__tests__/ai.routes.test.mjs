// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// Shared mock for Supabase auth
const mockGetUser = vi.fn();
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
  }),
}));

describe('POST /api/interpret (hardened router)', () => {
  let app;

  beforeEach(async () => {
    mockGetUser.mockReset();
    process.env.AI_IP_LIMIT = '1000';
    process.env.AI_FREE_USER_LIMIT = '1000';
    process.env.AI_WINDOW_MS = '60000';

    const { aiRouter } = await import('../routes/ai.routes.mjs');
    const { requestIdMiddleware } = await import('../middleware/requestId.mjs');
    const { errorHandler } = await import('../middleware/errorHandler.mjs');

    app = express();
    app.use(requestIdMiddleware);
    app.use(express.json());
    app.use('/api', aiRouter);

    // Fall-through handlers — what server.mjs would do post-harness
    app.post('/api/interpret', (req, res) =>
      res.json({ ok: true, lang: req.body.lang, hasData: !!req.body.data }));
    app.post('/api/analyze/conversation', (req, res) =>
      res.json({ ok: true, textLen: req.body.text?.length ?? 0 }));

    app.use(errorHandler);
  });

  it('AI-AUTH-001: returns 401 AUTH_REQUIRED without Authorization header', async () => {
    const res = await request(app).post('/api/interpret').send({ data: {}, lang: 'de' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_REQUIRED');
  });

  it('AI-AUTH-002: returns 401 AUTH_INVALID with invalid token', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'bad' } });
    const res = await request(app).post('/api/interpret')
      .set('Authorization', 'Bearer bad')
      .send({ data: {}, lang: 'de' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('AUTH_INVALID');
  });

  it('AI-VALID-001: returns 422 VALIDATION_FAILED for invalid lang', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    const res = await request(app).post('/api/interpret')
      .set('Authorization', 'Bearer ok')
      .send({ data: {}, lang: 'fr' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
  });

  it('AI-VALID-002: returns 422 when data field is missing', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    const res = await request(app).post('/api/interpret')
      .set('Authorization', 'Bearer ok')
      .send({ lang: 'de' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
  });

  it('AI-SEC-001: strips unknown keys before reaching handler', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    const res = await request(app).post('/api/interpret')
      .set('Authorization', 'Bearer ok')
      .send({ data: {}, lang: 'de', evil: 'x' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('AI-PAYLOAD-001: returns 413 PAYLOAD_TOO_LARGE when body > 50kb', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    // 51200 bytes is the default cap; build a >51200 payload
    const big = 'x'.repeat(60000);
    const res = await request(app).post('/api/interpret')
      .set('Authorization', 'Bearer ok')
      .send({ data: { blob: big }, lang: 'de' });
    expect(res.status).toBe(413);
    expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
  });

  it('AI-FALLTHROUGH-001: passes auth+validation, reaches downstream handler', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    const res = await request(app).post('/api/interpret')
      .set('Authorization', 'Bearer ok')
      .send({ data: { dayMaster: 'Wood' }, lang: 'de' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.lang).toBe('de');
    expect(res.body.hasData).toBe(true);
  });
});

describe('POST /api/analyze/conversation (hardened router)', () => {
  let app;

  beforeEach(async () => {
    mockGetUser.mockReset();
    process.env.AI_IP_LIMIT = '1000';
    process.env.AI_FREE_USER_LIMIT = '1000';
    process.env.AI_WINDOW_MS = '60000';

    const { aiRouter } = await import('../routes/ai.routes.mjs');
    const { requestIdMiddleware } = await import('../middleware/requestId.mjs');
    const { errorHandler } = await import('../middleware/errorHandler.mjs');

    app = express();
    app.use(requestIdMiddleware);
    app.use(express.json());
    app.use('/api', aiRouter);
    app.post('/api/analyze/conversation', (req, res) =>
      res.json({ ok: true, textLen: req.body.text?.length ?? 0 }));
    app.use(errorHandler);
  });

  it('returns 401 without auth', async () => {
    const res = await request(app).post('/api/analyze/conversation').send({ text: 'hi' });
    expect(res.status).toBe(401);
  });

  it('returns 422 when text is missing', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    const res = await request(app).post('/api/analyze/conversation')
      .set('Authorization', 'Bearer ok')
      .send({ lang: 'de' });
    expect(res.status).toBe(422);
  });

  it('falls through to handler with valid request', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
    const res = await request(app).post('/api/analyze/conversation')
      .set('Authorization', 'Bearer ok')
      .send({ text: 'A: hello\nB: hi', lang: 'de' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
