// @vitest-environment node
/**
 * GET /api/daily-pulse — no-placeholders integration tests (Phase D).
 *
 * Architecture invariants under test:
 *   * slot_1 (aphorism) is always real curated content.
 *   * slot_2/slot_3 are nullable. AI exhaustion → row stored with nulls.
 *   * Missing astro_profiles.astro_json → 422 PROFILE_REQUIRED.
 *   * Cache rows with null slots are NOT written to L1 — next request retries.
 */
import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const AUTH_HEADER = { Authorization: 'Bearer test-token' };

// Production astro_json shape (verified 2026-05-09 against prod Supabase).
const PROFILE_JSON = {
  fusion: {
    cosmic_state: 0.8711,
    harmony_index: {
      method: 'dot_product',
      harmony_index: 0.8711, // → mode = 'trace' (>= 0.5)
      interpretation: 'Starke Resonanz',
    },
  },
  bazi: {
    day_master: 'Ding',
    zodiac_sign: 'Dog',
    pillars: { day: { stem: 'Ding' } },
  },
  western: {
    zodiac_sign: 'Taurus',
    moon_sign: 'Libra',
    ascendant_sign: 'Libra',
  },
  wuxing: { dominant_element: 'Holz' },
};

const APHORISM_ROW = {
  id: 'aph-0001',
  text_de: 'Wer den Fluss kennt, fürchtet die Brücke nicht.',
  text_en: 'He who knows the river does not fear the bridge.',
  author: 'Anonymous',
  work: null,
  attribution_status: 'folkloric',
  mode_tags: ['trace', 'pulse'],
  quality_rating: 5,
  cooldown_days: 30,
};

/**
 * Build a fetch mock that routes by URL.
 * @param {object} opts
 * @param {object} [opts.profile]    — astro_json object or null (404)
 * @param {object} [opts.existingPulse] — daily_pulses row for L2 hit
 * @param {object[]} [opts.aphorismPool] — list returned by /aphorisms
 * @param {object} [opts.pulseAfterUpsert] — what /daily_pulses upsert returns
 */
function mockFetch(opts = {}) {
  const profile = 'profile' in opts ? opts.profile : PROFILE_JSON;
  const existingPulse = opts.existingPulse ?? null;
  const aphorismPool = opts.aphorismPool ?? [APHORISM_ROW];
  const pulseAfterUpsert = opts.pulseAfterUpsert ?? null;

  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = typeof input === 'string' ? input
      : input instanceof URL ? input.toString()
        : input?.url ?? '';
    const method = (init?.method || (typeof input === 'object' && input?.method) || 'GET').toUpperCase();

    // Supabase auth.getUser
    if (url.includes('auth/v1/user')) {
      const userBody = { id: 'user-1', email: 't@test.com', aud: 'authenticated' };
      return {
        ok: true, status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => userBody,
        text: async () => JSON.stringify(userBody),
      };
    }

    // PostgREST: astro_profiles
    if (url.includes('/astro_profiles')) {
      const data = profile === null ? [] : [{ astro_json: profile }];
      return {
        ok: true, status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => data,
        text: async () => JSON.stringify(data),
      };
    }

    // PostgREST: daily_pulses
    if (url.includes('/daily_pulses')) {
      if (method === 'GET') {
        const data = existingPulse ? [existingPulse] : [];
        return {
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => data,
          text: async () => JSON.stringify(data),
        };
      }
      // POST upsert / PATCH update — Supabase JS expects a representation
      // back when .select().single() is chained. Return a single-row array.
      const row = pulseAfterUpsert ?? {
        id: 'pulse-uuid-1',
        user_id: 'user-1',
        date: '2026-05-09',
        locale: 'de',
        mode: 'trace',
        intensity: 0.766,
        harmony_index: 0.8711,
        aphorism_id: APHORISM_ROW.id,
        slot_1: APHORISM_ROW.text_de,
        slot_2: null,
        slot_3: null,
        weather_stale: false,
      };
      return {
        ok: true, status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => [row],
        text: async () => JSON.stringify([row]),
      };
    }

    // PostgREST: aphorisms
    if (url.includes('/aphorisms') && !url.includes('aphorism_usage_events')) {
      // .maybeSingle() with id eq filter returns single matching row
      if (url.includes('id=eq.')) {
        const m = url.match(/id=eq\.([^&]+)/);
        const id = m ? decodeURIComponent(m[1]) : null;
        const row = aphorismPool.find((a) => a.id === id) || null;
        const data = row ? [row] : [];
        return {
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => data,
          text: async () => JSON.stringify(data),
        };
      }
      // ordered list query
      return {
        ok: true, status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => aphorismPool,
        text: async () => JSON.stringify(aphorismPool),
      };
    }

    // PostgREST: aphorism_usage_events
    if (url.includes('/aphorism_usage_events')) {
      return {
        ok: true, status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => [],
        text: async () => '[]',
      };
    }

    // Anything else (BAFE, etc.) — empty 200.
    return {
      ok: true, status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({}),
      text: async () => '{}',
    };
  });
}

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

describe('GET /api/daily-pulse — no-placeholders contract', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('DPL-001: happy path — profile + AI succeed → 200 with aphorism + impulse_text + council', async () => {
    // BUG-DAILY-001: prompt now emits a single { "impulse_text": "..." }
    // shape. Server mirrors it into slot_2 (DB column reuse) and exposes
    // it as impulse_text on the wire.
    mockFetch();
    const consolidated =
      'Du weißt heute mehr über deine Lage, als du dir zugestehst. Schau hin, ohne sofort zu bewerten.';
    const slots = JSON.stringify({ impulse_text: consolidated });
    const app = await loadApp(makeGeminiTextMock(slots));

    const res = await request(app)
      .get('/api/daily-pulse?date=2026-05-09&locale=de')
      .set(AUTH_HEADER);

    expect(res.status).toBe(200);
    expect(res.body.aphorism.slot_1).toBe(APHORISM_ROW.text_de);
    // Wire shape: impulse_text is the consolidated paragraph.
    expect(res.body.aphorism.impulse_text).toBe(consolidated);
    // Back-compat: slot_2 mirrors impulse_text, slot_3 is null.
    expect(res.body.aphorism.slot_2).toBe(consolidated);
    expect(res.body.aphorism.slot_3).toBeNull();
    expect(res.body.aphorism.author).toBe('Anonymous');
    expect(res.body.mode).toBe('trace'); // harmony 0.8711 >= 0.5
    expect(Array.isArray(res.body.council)).toBe(true);
    expect(res.body.council.length).toBe(6);
    const sonne = res.body.council.find((c) => c.key === 'sonne');
    expect(sonne.signOrElement).toBe('Taurus');
    const wuxingDom = res.body.council.find((c) => c.key === 'wuxing_dom');
    expect(wuxingDom.signOrElement).toBe('Holz');
    expect(res.body.harmony_index).toBeCloseTo(0.8711, 3);
  });

  it('DPL-002: profile missing → 422 PROFILE_REQUIRED (no fake horoscope)', async () => {
    mockFetch({ profile: null });
    const app = await loadApp(makeGeminiTextMock('{"slot_2":"x","slot_3":"y"}'));

    const res = await request(app)
      .get('/api/daily-pulse?date=2026-05-09&locale=de')
      .set(AUTH_HEADER);

    expect(res.status).toBe(422);
    expect(res.body?.error?.code).toBe('PROFILE_REQUIRED');
  });

  it('DPL-003: AI exhausted → 200 with aphorism but slot_2/slot_3 NULL (NOT a fallback string)', async () => {
    mockFetch();
    const app = await loadApp(makeGeminiAlwaysExhaustedMock());

    const res = await request(app)
      .get('/api/daily-pulse?date=2026-05-09&locale=de')
      .set(AUTH_HEADER);

    expect(res.status).toBe(200);
    // The aphorism is always real curated content.
    expect(res.body.aphorism.slot_1).toBe(APHORISM_ROW.text_de);
    expect(res.body.aphorism.id).toBe(APHORISM_ROW.id);
    // Slots are exactly null — not a fallback, not a generic string.
    expect(res.body.aphorism.slot_2).toBeNull();
    expect(res.body.aphorism.slot_3).toBeNull();
  });

  it('DPL-004: cache hit (existing daily_pulses row) → no AI call, served from DB', async () => {
    const existingPulse = {
      id: 'pulse-uuid-cached',
      user_id: 'user-1',
      date: '2026-05-09',
      locale: 'de',
      mode: 'trace',
      intensity: 0.5,
      harmony_index: 0.6,
      aphorism_id: APHORISM_ROW.id,
      slot_1: APHORISM_ROW.text_de,
      slot_2: 'cached bridge sentence',
      slot_3: 'cached impulse sentence',
      weather_stale: false,
    };
    mockFetch({ existingPulse });
    const geminiMock = makeGeminiTextMock('{"slot_2":"NEW","slot_3":"NEW"}');
    const app = await loadApp(geminiMock);

    const res = await request(app)
      .get('/api/daily-pulse?date=2026-05-09&locale=de')
      .set(AUTH_HEADER);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('pulse-uuid-cached');
    expect(res.body.aphorism.slot_2).toBe('cached bridge sentence');
    expect(res.body.aphorism.slot_3).toBe('cached impulse sentence');

    // The mock instance lives inside the dynamically-imported module,
    // so we verify "no AI call" via the cached values being preserved
    // rather than via spy assertions on a closed-over instance.
  });

  it('DPL-005a: invalid date → 400 INVALID_DATE', async () => {
    mockFetch();
    const app = await loadApp(makeGeminiTextMock('{"slot_2":"x","slot_3":"y"}'));

    const res = await request(app)
      .get('/api/daily-pulse?date=not-a-date&locale=de')
      .set(AUTH_HEADER);

    expect(res.status).toBe(400);
    expect(res.body?.error?.code).toBe('INVALID_DATE');
  });

  it('DPL-005b: invalid locale → 400 INVALID_LOCALE', async () => {
    mockFetch();
    const app = await loadApp(makeGeminiTextMock('{"slot_2":"x","slot_3":"y"}'));

    const res = await request(app)
      .get('/api/daily-pulse?date=2026-05-09&locale=fr')
      .set(AUTH_HEADER);

    expect(res.status).toBe(400);
    expect(res.body?.error?.code).toBe('INVALID_LOCALE');
  });
});
