import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const loadTestApp = async () => {
  vi.resetModules();
  process.env.NODE_ENV = 'test';
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  process.env.GEMINI_API_KEY = 'test-gemini-key';
  process.env.BAFE_BASE_URL = 'https://bafe.test';
  const mod = await import('../../server.mjs');
  return mod.app;
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('Middleware Ordering', () => {
  describe('express.json() before requireUserAuth', () => {
    it('/api/experience/bootstrap: req.body is parsed before auth middleware', async () => {
      const app = await loadTestApp();

      // Mock Supabase auth
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
        const url = typeof input === 'string' ? input : (input as Request).url;
        if (url.includes('auth/v1/user')) {
          return {
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({ id: 'user-1', email: 'test@test.com', aud: 'authenticated' }),
            text: async () => JSON.stringify({ id: 'user-1', email: 'test@test.com', aud: 'authenticated' }),
          } as Response;
        }
        // BAFE /chart endpoint mock
        if (url.includes('/chart')) {
          return {
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({
              western: { zodiac_sign: 'aries' },
              bazi: { year: { stamm: 'jia', zweig: 'zi' } },
              wuxing: { wood: 0.3, fire: 0.2, earth: 0.2, metal: 0.15, water: 0.15 },
            }),
            text: async () => JSON.stringify({
              western: { zodiac_sign: 'aries' },
              bazi: { year: { stamm: 'jia', zweig: 'zi' } },
              wuxing: { wood: 0.3, fire: 0.2, earth: 0.2, metal: 0.15, water: 0.15 },
            }),
          } as Response;
        }
        // Default fallback
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({}),
          text: async () => '{}',
        } as Response;
      });

      const birthData = {
        birth: {
          date: '1990-06-15',
          time: '14:30:00',
          lat: 52.52,
          lon: 13.405,
          tz: 'Europe/Berlin',
        },
      };

      const response = await request(app)
        .post('/api/experience/bootstrap')
        .set('Authorization', 'Bearer test-token')
        .set('Content-Type', 'application/json')
        .send(birthData);

      // If middleware order is correct, body is parsed and we get past auth
      // Should not get 400 "Missing birth data" error
      expect(response.status).not.toBe(400);
      // Should either succeed or fail at BAFE proxy (which is mocked)
      expect([200, 502]).toContain(response.status);
    });

    it('/api/experience/signature-delta: req.body is parsed before auth middleware', async () => {
      const app = await loadTestApp();

      // Mock Supabase auth + profile fetch
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
        const url = typeof input === 'string' ? input : (input as Request).url;
        if (url.includes('auth/v1/user')) {
          return {
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({ id: 'user-1', email: 'test@test.com', aud: 'authenticated' }),
            text: async () => JSON.stringify({ id: 'user-1', email: 'test@test.com', aud: 'authenticated' }),
          } as Response;
        }
        // Supabase REST API for profile fetch
        if (url.includes('rest/v1/astro_profiles')) {
          return {
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => [{ astro_json: { western: { zodiac_sign: 'aries' } } }],
            text: async () => JSON.stringify([{ astro_json: { western: { zodiac_sign: 'aries' } } }]),
          } as Response;
        }
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({}),
          text: async () => '{}',
        } as Response;
      });

      const quizAnswer = {
        quiz_answer: [
          { id: 'marker.love.physical_touch', weight: 0.8 },
          { id: 'marker.emotion.empathy', weight: 0.6 },
        ],
      };

      const response = await request(app)
        .post('/api/experience/signature-delta')
        .set('Authorization', 'Bearer test-token')
        .set('Content-Type', 'application/json')
        .send(quizAnswer);

      // If middleware order is correct, body is parsed
      expect(response.status).not.toBe(400);
      expect([200, 502]).toContain(response.status);
    });

    it('/api/experience/daily: req.body is parsed before auth middleware', async () => {
      const app = await loadTestApp();

      // Mock Supabase auth + Gemini
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
        const url = typeof input === 'string' ? input : (input as Request).url;
        if (url.includes('auth/v1/user')) {
          return {
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({ id: 'user-1', email: 'test@test.com', aud: 'authenticated' }),
            text: async () => JSON.stringify({ id: 'user-1', email: 'test@test.com', aud: 'authenticated' }),
          } as Response;
        }
        // Gemini API mock
        if (url.includes('generativelanguage.googleapis.com')) {
          return {
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({
              candidates: [{ content: { parts: [{ text: '{"interpretation":"test"}' }] } }],
            }),
            text: async () => JSON.stringify({
              candidates: [{ content: { parts: [{ text: '{"interpretation":"test"}' }] } }],
            }),
          } as Response;
        }
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({}),
          text: async () => '{}',
        } as Response;
      });

      const dailyData = {
        birth: {
          date: '1990-06-15',
          time: '14:30:00',
          lat: 52.52,
          lon: 13.405,
          tz: 'Europe/Berlin',
        },
        target_date: '2026-03-26',
      };

      const response = await request(app)
        .post('/api/experience/daily')
        .set('Authorization', 'Bearer test-token')
        .set('Content-Type', 'application/json')
        .send(dailyData);

      // If middleware order is correct, body is parsed
      expect(response.status).not.toBe(400);
      // Should either succeed or fail at Gemini (which is mocked)
      expect([200, 502, 503]).toContain(response.status);
    });
  });

  describe('routes without express.json() should fail gracefully', () => {
    it('/api/calculate/bazi: body is still parsed (legacy middleware order)', async () => {
      const app = await loadTestApp();

      // Mock Supabase auth
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
        const url = typeof input === 'string' ? input : (input as Request).url;
        if (url.includes('auth/v1/user')) {
          return {
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({ id: 'user-1', email: 'test@test.com', aud: 'authenticated' }),
            text: async () => JSON.stringify({ id: 'user-1', email: 'test@test.com', aud: 'authenticated' }),
          } as Response;
        }
        // BAFE mock
        if (url.includes('/calculate/western')) {
          return {
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({ zodiac_sign: 'aries' }),
            text: async () => JSON.stringify({ zodiac_sign: 'aries' }),
          } as Response;
        }
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({}),
          text: async () => '{}',
        } as Response;
      });

      const birthData = {
        date: '1990-06-15T14:30:00',
        tz: 'Europe/Berlin',
        lat: 52.52,
        lon: 13.405,
      };

      const response = await request(app)
        .post('/api/calculate/bazi')
        .set('Authorization', 'Bearer test-token')
        .set('Content-Type', 'application/json')
        .send(birthData);

      // Even with legacy order, body should be parsed by global middleware
      expect(response.status).not.toBe(400);
    });
  });
});
