// @vitest-environment node
import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import { validateBody, validateQuery } from '../middleware/validate.mjs';

const schema = z.object({ lang: z.enum(['de', 'en']), text: z.string().max(100) });

const app = express();
app.use(express.json());
app.post('/test', validateBody(schema), (req, res) => res.json(req.body));
app.get('/query', validateQuery(z.object({ page: z.coerce.number().min(1) })), (req, res) => res.json(req.query));

describe('validateBody', () => {
  it('passes valid body and sets req.body to stripped result', async () => {
    const res = await request(app).post('/test').send({ lang: 'de', text: 'hello' });
    expect(res.status).toBe(200);
    expect(res.body.lang).toBe('de');
  });

  it('returns 422 VALIDATION_FAILED for invalid enum', async () => {
    const res = await request(app).post('/test').send({ lang: 'xx', text: 'hello' });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
    expect(res.body.error.details[0].path).toContain('lang');
    expect(res.body.error.recoverable).toBe(true);
  });

  it('strips unknown keys silently', async () => {
    const res = await request(app).post('/test').send({ lang: 'de', text: 'hi', evil: 'x' });
    expect(res.status).toBe(200);
    expect(res.body.evil).toBeUndefined();
  });

  it('returns 422 when string exceeds max length', async () => {
    const res = await request(app).post('/test').send({ lang: 'de', text: 'a'.repeat(101) });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
  });
});

describe('validateQuery', () => {
  it('passes valid query params', async () => {
    const res = await request(app).get('/query?page=3');
    expect(res.status).toBe(200);
    expect(res.body.page).toBe(3);
  });

  it('returns 422 for invalid query param', async () => {
    const res = await request(app).get('/query?page=0');
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
    expect(res.body.error.details[0].path).toContain('page');
  });
});
