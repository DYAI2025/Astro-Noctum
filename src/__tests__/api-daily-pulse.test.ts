/**
 * Integration tests for the Tagespuls routes (Phase B + rate-limit branch from Phase C.4).
 *
 *   GET  /api/daily-pulse           — aphorism + slot_2/slot_3 + council
 *   POST /api/daily-interpretation  — archetype-specific Tagesdeutung
 *
 * These exercise the full Express + supabase-js path via supertest.
 * `globalThis.fetch` is mocked to satisfy:
 *   - Supabase GoTrue auth.getUser  → user-1 / authenticated
 *   - Supabase REST queries          → table-specific responses
 *   - Gemini generateContent         → JSON slot payload or interpretation text
 *
 * The L1 cache (module-scoped Map in server.mjs) is reset between cases via
 * the `__resetTagespulsCache` export. The rate-limiter naturally resets when
 * the test calls `loadTestApp()` because that function uses vi.resetModules().
 */

import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type FetchHandler = (
  url: string,
  init?: RequestInit,
) => Promise<Response> | Response | undefined;

const AUTH_HEADER = ['Authorization', 'Bearer test-token'] as const;

const ok = (body: unknown, extraHeaders: Record<string, string> = {}): Response =>
  ({
    ok: true,
    status: 200,
    headers: new Headers({ 'content-type': 'application/json', ...extraHeaders }),
    json: async () => body,
    text: async () => JSON.stringify(body),
  }) as unknown as Response;

const authUserResponse = (userId = 'user-1'): Response =>
  ok({ id: userId, email: 'test@test.com', aud: 'authenticated' });

interface InstallFetchOptions {
  /** Counter — every call (auth, supabase, gemini, …) increments this. */
  callCount?: { value: number };
  /**
   * Counts ONLY supabase REST calls (i.e. excludes the auth.getUser hop).
   * Used by the L1-cache test to assert that the second request did not
   * touch supabase at all.
   */
  supabaseCount?: { value: number };
  /** Optional gemini response handler. Default: empty {} (slots null). */
  gemini?: () => Response;
  /** Per-table handler. Returns Response or undefined (fall through). */
  table?: Record<string, FetchHandler>;
  /** Override auth response — default is user-1 authenticated. */
  auth?: () => Response;
}

const installFetch = (opts: InstallFetchOptions = {}) => {
  const { callCount, supabaseCount, gemini, table = {}, auth = authUserResponse } = opts;

  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    if (callCount) callCount.value += 1;

    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : (input as Request).url;

    if (url.includes('auth/v1/user')) {
      return auth();
    }

    if (url.includes('generativelanguage.googleapis.com') || url.includes('openrouter.ai')) {
      return gemini ? gemini() : ok({});
    }

    // Match supabase REST URLs: ".../rest/v1/<table>?..."
    const m = url.match(/\/rest\/v1\/([a-z_]+)/);
    if (m) {
      if (supabaseCount) supabaseCount.value += 1;
      const tableName = m[1];
      const handler = table[tableName];
      if (handler) {
        const result = await handler(url, init);
        if (result) return result;
      }
      // Default fallback: empty array (so .maybeSingle() yields null).
      return ok([]);
    }

    return ok({});
  });
};

const loadTestApp = async () => {
  vi.resetModules();
  process.env.NODE_ENV = 'test';
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  process.env.GEMINI_API_KEY = 'test-gemini-key';
  const mod = await import('../../server.mjs');
  if (typeof (mod as any).__resetTagespulsCache === 'function') {
    try {
      (mod as any).__resetTagespulsCache();
    } catch {
      /* no-op — guarded by NODE_ENV in non-test envs */
    }
  }
  return { app: mod.app, mod };
};

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ──────────────────────────────────────────────────────────────────────
// Fixtures
// ──────────────────────────────────────────────────────────────────────

const HARMONY_TRACE = 0.6; // → mode='trace', intensity ~ 0.27
const FULL_ASTRO_JSON = {
  fusion: { harmony_index: HARMONY_TRACE },
  western: { zodiac_sign: 'Taurus', moon_sign: 'Libra', ascendant_sign: 'Libra' },
  bazi: { day_master: 'Ding', zodiac_sign: 'Dog' },
  wuxing: { dominant_element: 'Holz' },
};

const APHORISM_ROW = {
  id: 'aph-001',
  text_de: 'Was du tust, gestalte mit Würde.',
  text_en: 'Whatever you do, do with dignity.',
  author: 'Marc Aurel',
  work: 'Selbstbetrachtungen',
  attribution_status: 'verified',
  mode_tags: ['trace', 'pulse'],
  quality_rating: 5,
  cooldown_days: 30,
};

const geminiSlotResponse = (
  impulseText = 'Heute trägt dich Stille. Bewege dich langsam.',
) =>
  ok({
    candidates: [
      {
        content: {
          parts: [{ text: JSON.stringify({ impulse_text: impulseText }) }],
        },
      },
    ],
    text: JSON.stringify({ impulse_text: impulseText }),
  });

const geminiInterpretationResponse = (text = 'Ein klarer Moment für deine Sonne. ' + 'Lorem ipsum dolor sit amet, consectetur.') =>
  ok({
    candidates: [
      {
        content: {
          parts: [{ text }],
        },
      },
    ],
    text,
  });

// ──────────────────────────────────────────────────────────────────────
// GET /api/daily-pulse
// ──────────────────────────────────────────────────────────────────────

describe('GET /api/daily-pulse', () => {
  it('returns 400 INVALID_LOCALE for unknown locale param', async () => {
    const { app } = await loadTestApp();
    installFetch();

    const res = await request(app)
      .get('/api/daily-pulse')
      .query({ date: '2026-05-09', locale: 'zh' })
      .set(...AUTH_HEADER);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_LOCALE');
  });

  it('returns 400 INVALID_DATE for malformed date param', async () => {
    const { app } = await loadTestApp();
    installFetch();

    const res = await request(app)
      .get('/api/daily-pulse')
      .query({ date: '09-05-2026', locale: 'de' })
      .set(...AUTH_HEADER);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_DATE');
  });

  it('returns 422 PROFILE_REQUIRED when astro_profiles row missing', async () => {
    const { app } = await loadTestApp();
    installFetch({
      table: {
        daily_pulses: () => ok([]),
        astro_profiles: () => ok([]),
      },
    });

    const res = await request(app)
      .get('/api/daily-pulse')
      .query({ date: '2026-05-09', locale: 'de' })
      .set(...AUTH_HEADER);

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('PROFILE_REQUIRED');
  });

  it('returns 422 PROFILE_REQUIRED when astro_json is empty object', async () => {
    const { app } = await loadTestApp();
    installFetch({
      table: {
        daily_pulses: () => ok([]),
        astro_profiles: () => ok([{ astro_json: {} }]),
      },
    });

    const res = await request(app)
      .get('/api/daily-pulse')
      .query({ date: '2026-05-09', locale: 'de' })
      .set(...AUTH_HEADER);

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('PROFILE_REQUIRED');
  });

  it('returns 422 PROFILE_REQUIRED when harmony_index cannot be derived', async () => {
    const { app } = await loadTestApp();
    installFetch({
      table: {
        daily_pulses: () => ok([]),
        astro_profiles: () => ok([{ astro_json: { fusion: {} } }]),
      },
    });

    const res = await request(app)
      .get('/api/daily-pulse')
      .query({ date: '2026-05-09', locale: 'de' })
      .set(...AUTH_HEADER);

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('PROFILE_REQUIRED');
  });

  it('returns 503 APHORISM_POOL_EMPTY when no aphorism matches mode', async () => {
    const { app } = await loadTestApp();
    installFetch({
      table: {
        daily_pulses: () => ok([]),
        astro_profiles: () => ok([{ astro_json: FULL_ASTRO_JSON }]),
        aphorism_usage_events: () => ok([]),
        aphorisms: () => ok([]),
      },
    });

    const res = await request(app)
      .get('/api/daily-pulse')
      .query({ date: '2026-05-09', locale: 'de' })
      .set(...AUTH_HEADER);

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('APHORISM_POOL_EMPTY');
  });

  it('serves L1 cache hit without DB call', async () => {
    const { app } = await loadTestApp();

    // Call 1: full path → upsert → cache populated.
    const supabaseCount = { value: 0 };
    installFetch({
      supabaseCount,
      gemini: () => geminiSlotResponse(),
      table: {
        daily_pulses: (_url, init) => {
          // First request is the L2 .eq.eq.eq.maybeSingle() GET (returns []).
          // Subsequent POST is the .upsert(...).select().single() — must return
          // a single object, not an array (Accept: vnd.pgrst.object+json).
          if ((init?.method ?? 'GET').toUpperCase() === 'POST') {
            return ok({
              id: 'pulse-1',
              user_id: 'user-1',
              date: '2026-05-09',
              locale: 'de',
              mode: 'trace',
              intensity: 0.27,
              harmony_index: HARMONY_TRACE,
              aphorism_id: APHORISM_ROW.id,
              slot_1: APHORISM_ROW.text_de,
              // BUG-DAILY-001: server now writes consolidated text into
              // slot_2 (slot_3 NULL). Mirrors the parser output.
              slot_2: 'Heute trägt dich Stille. Bewege dich langsam.',
              slot_3: null,
              weather_stale: false,
            });
          }
          return ok([]);
        },
        astro_profiles: () => ok([{ astro_json: FULL_ASTRO_JSON }]),
        aphorism_usage_events: () => ok([]),
        aphorisms: () => ok([APHORISM_ROW]),
      },
    });

    const res1 = await request(app)
      .get('/api/daily-pulse')
      .query({ date: '2026-05-09', locale: 'de' })
      .set(...AUTH_HEADER);
    expect(res1.status).toBe(200);
    const supabaseCallsAfterFirst = supabaseCount.value;
    expect(supabaseCallsAfterFirst).toBeGreaterThan(0);

    // Call 2: should be served entirely from L1 — no further supabase calls.
    const res2 = await request(app)
      .get('/api/daily-pulse')
      .query({ date: '2026-05-09', locale: 'de' })
      .set(...AUTH_HEADER);
    expect(res2.status).toBe(200);
    expect(res2.body).toEqual(res1.body);
    expect(supabaseCount.value).toBe(supabaseCallsAfterFirst);
  });

  it('happy path: returns aphorism + impulse_text + council', async () => {
    // BUG-DAILY-001: prompt → { impulse_text }. Server mirrors it into
    // slot_2 (DB column reuse), exposes it on the wire as impulse_text.
    const consolidated = 'Heute trägt dich Stille. Bewege dich langsam.';
    const { app } = await loadTestApp();
    installFetch({
      gemini: () => geminiSlotResponse(consolidated),
      table: {
        daily_pulses: (_url, init) => {
          // POST = .upsert().select().single() — returns single object directly.
          if ((init?.method ?? 'GET').toUpperCase() === 'POST') {
            return ok({
              id: 'pulse-2',
              user_id: 'user-1',
              date: '2026-05-09',
              locale: 'de',
              mode: 'trace',
              intensity: 0.27,
              harmony_index: HARMONY_TRACE,
              aphorism_id: APHORISM_ROW.id,
              slot_1: APHORISM_ROW.text_de,
              slot_2: consolidated,
              slot_3: null,
              weather_stale: false,
            });
          }
          return ok([]);
        },
        astro_profiles: () => ok([{ astro_json: FULL_ASTRO_JSON }]),
        aphorism_usage_events: () => ok([]),
        aphorisms: () => ok([APHORISM_ROW]),
      },
    });

    const res = await request(app)
      .get('/api/daily-pulse')
      .query({ date: '2026-05-09', locale: 'de' })
      .set(...AUTH_HEADER);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('pulse-2');
    expect(res.body.mode).toBe('trace');
    expect(typeof res.body.intensity).toBe('number');
    expect(res.body.aphorism.slot_1).toBe(APHORISM_ROW.text_de);
    expect(res.body.aphorism.impulse_text).toBe(consolidated);
    // Back-compat: slot_2 mirrors impulse_text, slot_3 is null.
    expect(res.body.aphorism.slot_2).toBe(consolidated);
    expect(res.body.aphorism.slot_3).toBeNull();
    expect(Array.isArray(res.body.council)).toBe(true);
    expect(res.body.council).toHaveLength(6);
    const keys = res.body.council.map((c: { key: string }) => c.key);
    expect(keys).toEqual(['sonne', 'mond', 'aszendent', 'day_master', 'jahrestier', 'wuxing_dom']);
  });
});

// ──────────────────────────────────────────────────────────────────────
// POST /api/daily-interpretation
// ──────────────────────────────────────────────────────────────────────

describe('POST /api/daily-interpretation', () => {
  it('IDOR: POST /api/daily-interpretation with mismatched user_id returns 404', async () => {
    const { app } = await loadTestApp();
    installFetch({
      table: {
        // Pulse belongs to a different user → .eq('user_id', userId) returns [].
        daily_pulses: () => ok([]),
      },
    });

    const res = await request(app)
      .post('/api/daily-interpretation')
      .set(...AUTH_HEADER)
      .set('Content-Type', 'application/json')
      .send({
        daily_pulse_id: 'pulse-belonging-to-someone-else',
        selected_archetype_key: 'sonne',
        locale: 'de',
      });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('PULSE_NOT_FOUND');
  });

  it('idempotent: POST /daily-interpretation twice returns same row', async () => {
    const { app } = await loadTestApp();

    const existingRow = {
      id: 'interp-1',
      daily_pulse_id: 'pulse-2',
      selected_archetype_key: 'sonne',
      locale: 'de',
      text: 'Bestehende Tagesdeutung.',
    };

    let interpretationsInsertCount = 0;

    installFetch({
      gemini: () => geminiInterpretationResponse('Frische Tagesdeutung.'),
      table: {
        // GET .eq.eq.maybeSingle() expects an array.
        daily_pulses: () =>
          ok([
            {
              id: 'pulse-2',
              user_id: 'user-1',
              date: '2026-05-09',
              locale: 'de',
              mode: 'trace',
              intensity: 0.27,
              slot_1: APHORISM_ROW.text_de,
              slot_2: 'a',
              slot_3: 'b',
              aphorism_id: APHORISM_ROW.id,
            },
          ]),
        daily_interpretations: (_url, init) => {
          const method = (init?.method ?? 'GET').toUpperCase();
          if (method === 'POST') {
            // .insert(...).select('id, text').single() → single object response.
            interpretationsInsertCount += 1;
            return ok(existingRow);
          }
          // GET .eq.eq.eq.maybeSingle() → array shape.
          // First call: empty (no row yet); subsequent: return existing row.
          if (interpretationsInsertCount > 0) {
            return ok([existingRow]);
          }
          return ok([]);
        },
      },
    });

    const body = {
      daily_pulse_id: 'pulse-2',
      selected_archetype_key: 'sonne',
      locale: 'de',
    };

    const res1 = await request(app)
      .post('/api/daily-interpretation')
      .set(...AUTH_HEADER)
      .set('Content-Type', 'application/json')
      .send(body);

    expect(res1.status).toBe(200);
    expect(res1.body.id).toBe('interp-1');

    const res2 = await request(app)
      .post('/api/daily-interpretation')
      .set(...AUTH_HEADER)
      .set('Content-Type', 'application/json')
      .send(body);

    expect(res2.status).toBe(200);
    expect(res2.body.id).toBe(res1.body.id);
    expect(res2.body.text).toBe(res1.body.text);
    // Idempotency invariant: the second call MUST hit the L2 idempotent-row
    // return path and NOT re-insert. Without this assertion, a regression
    // that double-writes would still pass via the "same id returned" check.
    expect(interpretationsInsertCount).toBe(1);
  });

  it('returns 429 RATE_LIMITED after 6 calls in 1h window', async () => {
    const { app } = await loadTestApp();

    installFetch({
      gemini: () => geminiInterpretationResponse(),
      table: {
        // Every call: pulse row exists; no existing interpretation → insert succeeds.
        daily_pulses: () =>
          ok([
            {
              id: 'pulse-3',
              user_id: 'user-1',
              date: '2026-05-09',
              locale: 'de',
              mode: 'trace',
              intensity: 0.27,
              slot_1: APHORISM_ROW.text_de,
              slot_2: 'a',
              slot_3: 'b',
              aphorism_id: APHORISM_ROW.id,
            },
          ]),
        daily_interpretations: (_url, init) => {
          const method = (init?.method ?? 'GET').toUpperCase();
          if (method === 'POST') {
            // .insert(...).select('id, text').single() → single object.
            return ok({
              id: `interp-${Math.random().toString(36).slice(2, 8)}`,
              text: 'Eine deutung.',
            });
          }
          return ok([]);
        },
      },
    });

    const body = {
      daily_pulse_id: 'pulse-3',
      selected_archetype_key: 'sonne',
      locale: 'de',
    };

    // 6 successful calls — limiter window is 1h, max 6 per req.userId.
    for (let i = 0; i < 6; i++) {
      const ok = await request(app)
        .post('/api/daily-interpretation')
        .set(...AUTH_HEADER)
        .set('Content-Type', 'application/json')
        .send(body);
      expect(ok.status, `call ${i + 1} should not be rate-limited`).not.toBe(429);
    }

    // 7th call → 429 RATE_LIMITED.
    const blocked = await request(app)
      .post('/api/daily-interpretation')
      .set(...AUTH_HEADER)
      .set('Content-Type', 'application/json')
      .send(body);

    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('RATE_LIMITED');
  });
});
