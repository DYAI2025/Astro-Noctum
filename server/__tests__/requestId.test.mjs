// @vitest-environment node
import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { requestIdMiddleware } from '../middleware/requestId.mjs';

const app = express();
app.use(requestIdMiddleware);
app.get('/test', (req, res) => res.json({ id: req.requestId }));

describe('requestIdMiddleware', () => {
  it('generates a request ID when none provided', async () => {
    const res = await request(app).get('/test');
    expect(res.body.id).toMatch(/^req_[a-z0-9-]+$/);
    expect(res.headers['x-request-id']).toBe(res.body.id);
  });

  it('uses provided X-Request-Id if valid format', async () => {
    const res = await request(app)
      .get('/test')
      .set('X-Request-Id', 'req_custom-123');
    expect(res.body.id).toBe('req_custom-123');
  });

  it('ignores invalid X-Request-Id and generates new one', async () => {
    const res = await request(app)
      .get('/test')
      .set('X-Request-Id', '<script>xss</script>');
    expect(res.body.id).toMatch(/^req_/);
    expect(res.body.id).not.toContain('<script>');
  });

  it('ignores X-Request-Id that is too long', async () => {
    const res = await request(app)
      .get('/test')
      .set('X-Request-Id', 'req_' + 'a'.repeat(200));
    expect(res.body.id).toMatch(/^req_[a-z0-9-]{36}$/);
  });
});
