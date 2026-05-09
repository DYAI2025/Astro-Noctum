// @vitest-environment node
/**
 * HOTFIX-B regression tests — refuse to cache server-side fallback payloads.
 *
 * Bug: when the AI provider returned empty / malformed JSON, the daily handler
 * fell back to buildDailyFallbackPayload() and unconditionally wrote the result
 * into both the L1 (in-memory horoscopeCache Map) and L2 (Supabase
 * daily_horoscope_cache) caches. For the next 24h every request for the same
 * (user, date, lang) returned the canned fallback text without retrying the
 * AI router — even after Gemini quota reset. Symptom: "100% of users see the
 * same Tagesimpuls" reported 2026-05-07.
 *
 * Fix: the fallback payload now carries `meta.engine_version === "v1-server-fallback"`,
 * and both cache writes are gated on that field. Real AI responses still cache
 * (engine_version === "v1-gemini-daily"); fallback responses go to the client
 * but force a retry on the next request.
 */
import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const AUTH_HEADER = { Authorization: 'Bearer test-token' };

const BIRTH_BODY = {
  birth: {
    date: '1990-06-15',
    time: '14:30:00',
    lat: 52.52,
    lon: 13.405,
    tz: 'Europe/Berlin',
  },
  target_date: '2026-05-09',
  locale: 'de',
};

/**
 * Mock global fetch:
 *   - Supabase auth.getUser returns user-1
 *   - Supabase REST (astro_profiles, daily_horoscope_cache) returns empty
 *   - BAFE /chart returns minimal natal data
 *   - Anything else returns empty 200
 */
function mockExternalFetch() {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = typeof input === 'string' ? input
      : input instanceof URL ? input.toString()
        : input?.url ?? '';

    if (url.includes('auth/v1/user')) {
      const userBody = { id: 'user-1', email: 't@test.com', aud: 'authenticated' };
      return {
        ok: true, status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => userBody,
        text: async () => JSON.stringify(userBody),
      };
    }

    if (url.includes('/chart')) {
      const bafe = {
        western: { zodiac_sign: 'gemini', moon_sign: 'libra' },
        bazi: { pillars: { day: { stem: 'jia' } } },
        wuxing: { wood: 0.3, fire: 0.2, earth: 0.2, metal: 0.15, water: 0.15 },
      };
      return {
        ok: true, status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => bafe,
        text: async () => JSON.stringify(bafe),
      };
    }

    // Supabase REST default — empty list
    return {
      ok: true, status: 200,
      headers: new Headers({ 'content-type': 'application/json', 'content-range': '0-0/0' }),
      json: async () => [],
      text: async () => '[]',
    };
  });
}

/** Wraps a Gemini SDK class returning a fixed text body. */
function makeGeminiTextMock(text) {
  return {
    GoogleGenAI: class {
      models = {
        generateContent: vi.fn().mockResolvedValue({ text }),
      };
      getGenerativeModel = vi.fn().mockReturnValue({
        generateContent: vi.fn().mockResolvedValue({ response: { text: () => '' } }),
      });
    },
  };
}

/** Wraps a Gemini SDK class whose `generateContent` always throws (router exhaustion). */
function makeGeminiAlwaysExhaustedMock() {
  const err = Object.assign(new Error('quota exceeded'), { status: 429 });
  return {
    GoogleGenAI: class {
      models = {
        generateContent: vi.fn().mockRejectedValue(err),
      };
      getGenerativeModel = vi.fn().mockReturnValue({
        generateContent: vi.fn().mockRejectedValue(err),
      });
    },
  };
}

/**
 * Reload server.mjs with a clean module graph + injected Gemini mock.
 * OPENROUTER_API_KEY is intentionally NOT set so the router has only one
 * provider (Gemini direct) — exhausting it means full chain exhaustion.
 */
async function loadApp(geminiMock) {
  vi.resetModules();
  process.env.NODE_ENV = 'test';
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  process.env.GEMINI_API_KEY = 'test-gemini-key';
  process.env.BAFE_BASE_URL = 'https://bafe.test';
  delete process.env.OPENROUTER_API_KEY;

  if (geminiMock) {
    vi.doMock('@google/genai', () => geminiMock);
  }

  const mod = await import('../../server.mjs');
  return mod.app;
}

describe('experience/daily — fallback payloads must NOT poison caches (HOTFIX-B)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Note: each test calls loadApp() which uses vi.doMock + vi.resetModules,
    // so we don't need (and can't safely use) vi.unmock at this scope —
    // hoisting would make it run before any tests, undermining doMock.
  });

  it('EDF-NCP-001: real AI response IS cached (engine_version v1-gemini-daily)', async () => {
    mockExternalFetch();
    const goodPayload = {
      date: '2026-05-09',
      western: { summary: 'real ai output', themes: ['a'], caution: 'c', opportunity: 'o', evidence: { transit_sectors: [1] } },
      eastern: { summary: 'real bazi', themes: ['b'], caution: 'c', opportunity: 'o', evidence: { day_master: 'jia' } },
      fusion: {
        summary: 'real fusion',
        synthesis: 'Holz trifft auf Feuer.',
        action: 'a',
        pushworthy: true,
        push_text: 'p',
        harmony_index: 0.55,
        day_mode: 'trace',
      },
      meta: { engine_version: 'v1-gemini-daily' },
    };
    const app = await loadApp(makeGeminiTextMock(JSON.stringify(goodPayload)));

    const first = await request(app)
      .post('/api/experience/daily')
      .set(AUTH_HEADER)
      .set('Content-Type', 'application/json')
      .send(BIRTH_BODY);

    expect(first.status).toBe(200);
    expect(first.body?.meta?.engine_version).toBe('v1-gemini-daily');
    expect(first.body?.fusion?.synthesis).toContain('Holz');

    // Second request with the same body must be served from L1 cache —
    // we verify by counting fetch calls to the BAFE /chart endpoint:
    // a cached response skips BAFE entirely.
    const fetchSpy = vi.mocked(globalThis.fetch);
    const chartCallsBefore = fetchSpy.mock.calls.filter(([u]) =>
      typeof u === 'string' && u.includes('/chart')
    ).length;

    const second = await request(app)
      .post('/api/experience/daily')
      .set(AUTH_HEADER)
      .set('Content-Type', 'application/json')
      .send(BIRTH_BODY);

    expect(second.status).toBe(200);
    expect(second.body?.fusion?.synthesis).toContain('Holz');

    const chartCallsAfter = fetchSpy.mock.calls.filter(([u]) =>
      typeof u === 'string' && u.includes('/chart')
    ).length;
    expect(chartCallsAfter).toBe(chartCallsBefore); // L1 cache hit, BAFE NOT re-fetched
  });

  it('EDF-NCP-002: server fallback payload is RETURNED to client but NOT cached', async () => {
    mockExternalFetch();
    // Empty Gemini response → handler falls back to buildDailyFallbackPayload()
    const app = await loadApp(makeGeminiTextMock(''));

    const first = await request(app)
      .post('/api/experience/daily')
      .set(AUTH_HEADER)
      .set('Content-Type', 'application/json')
      .send(BIRTH_BODY);

    expect(first.status).toBe(200);
    // Distinguishing marker: this is the server fallback, not a real AI response.
    expect(first.body?.meta?.engine_version).toBe('v1-server-fallback');

    // Now make a second request — if cache poisoning was happening, this
    // would skip the AI router. Instead, BAFE /chart should be called again.
    const fetchSpy = vi.mocked(globalThis.fetch);
    const chartCallsBefore = fetchSpy.mock.calls.filter(([u]) =>
      typeof u === 'string' && u.includes('/chart')
    ).length;

    const second = await request(app)
      .post('/api/experience/daily')
      .set(AUTH_HEADER)
      .set('Content-Type', 'application/json')
      .send(BIRTH_BODY);

    expect(second.status).toBe(200);

    const chartCallsAfter = fetchSpy.mock.calls.filter(([u]) =>
      typeof u === 'string' && u.includes('/chart')
    ).length;
    // Critical assertion: BAFE was re-fetched, meaning the fallback was NOT
    // served from L1 cache. The handler retried the full pipeline.
    expect(chartCallsAfter).toBeGreaterThan(chartCallsBefore);
  });

  it('EDF-NCP-003: AI router exhausted → 502 to client AND no cache write (regression for "stuck Tagesimpuls")', async () => {
    mockExternalFetch();
    // Router throws on every call. Since OPENROUTER_API_KEY is unset, the
    // chain is just Gemini direct → router fully exhausts → handler catches
    // and returns 502. Critically, no cache write happens at all.
    const app = await loadApp(makeGeminiAlwaysExhaustedMock());

    const fetchSpy = vi.mocked(globalThis.fetch);

    const first = await request(app)
      .post('/api/experience/daily')
      .set(AUTH_HEADER)
      .set('Content-Type', 'application/json')
      .send(BIRTH_BODY);

    expect(first.status).toBe(502);
    expect(first.body?.error).toBe('experience_unavailable');

    const chartCallsBefore = fetchSpy.mock.calls.filter(([u]) =>
      typeof u === 'string' && u.includes('/chart')
    ).length;

    // Second request must invoke the full pipeline again — not be served from
    // any cache layer. This is the user-reported "Heute fließt deine Energie
    // ruhig" regression: the second call must hit the AI router fresh.
    const second = await request(app)
      .post('/api/experience/daily')
      .set(AUTH_HEADER)
      .set('Content-Type', 'application/json')
      .send(BIRTH_BODY);

    expect(second.status).toBe(502);

    const chartCallsAfter = fetchSpy.mock.calls.filter(([u]) =>
      typeof u === 'string' && u.includes('/chart')
    ).length;
    expect(chartCallsAfter).toBeGreaterThan(chartCallsBefore); // BAFE hit again, no cache short-circuit
  });
});
