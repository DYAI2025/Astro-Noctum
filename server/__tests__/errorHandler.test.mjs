// @vitest-environment node
import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { ApiError } from '../errors/apiErrors.mjs';
import { errorHandler } from '../middleware/errorHandler.mjs';

function buildApp(throwFn) {
  const app = express();
  app.use((req, _res, next) => { req.requestId = 'req_test'; next(); });
  app.get('/test', (_req, _res, next) => { try { throwFn(); } catch (e) { next(e); } });
  app.use(errorHandler);
  return app;
}

describe('errorHandler', () => {
  it('formats ApiError correctly', async () => {
    const app = buildApp(() => { throw ApiError.fromCode('RATE_LIMITED'); });
    const res = await request(app).get('/test');
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('RATE_LIMITED');
    expect(res.body.error.request_id).toBe('req_test');
    expect(res.body.error.recoverable).toBe(true);
    expect(res.body.error.message).toBeDefined();
  });

  it('formats unknown error as INTERNAL_ERROR without leaking message', async () => {
    const app = buildApp(() => { throw new Error('secret internal detail'); });
    const res = await request(app).get('/test');
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
    expect(JSON.stringify(res.body)).not.toContain('secret internal detail');
  });

  it('never includes stack trace in response body', async () => {
    const app = buildApp(() => { throw new Error('oops'); });
    const res = await request(app).get('/test');
    expect(res.body.error.stack).toBeUndefined();
  });

  it('includes details array for ApiError with details', async () => {
    const app = buildApp(() => {
      throw ApiError.fromCode('VALIDATION_FAILED', [{ path: 'body.lang', message: 'Invalid enum value.' }]);
    });
    const res = await request(app).get('/test');
    expect(res.status).toBe(422);
    expect(res.body.error.details).toHaveLength(1);
    expect(res.body.error.details[0].path).toBe('body.lang');
  });

  it('sets retry_after for RATE_LIMITED with retryAfter', async () => {
    const app = buildApp(() => {
      throw new ApiError('RATE_LIMITED', 429, 'Too many', true, null, 42);
    });
    const res = await request(app).get('/test');
    expect(res.body.error.retry_after).toBe(42);
  });
});
