// @vitest-environment node
/**
 * POST /api/daily-interpretation — no-placeholders integration tests (Phase D).
 *
 * Architecture invariants under test:
 *   * Auth boundary: pulse_id from another user → 404 (not 403, no leak).
 *   * Idempotent: same combo twice → second serves from daily_interpretations row.
 *   * AI exhausted → 503 AI_UNAVAILABLE (NOT a fallback string).
 *   * Bad input → 400 INVALID_BODY.
 */
import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const AUTH_HEADER = { Authorization: 'Bearer test-token' };

const PULSE_ROW = {
  id: 'pulse-uuid-1',
  user_id: 'user-1',
  date: '2026-05-09',
  locale: 'de',
  mode: 'trace',
  intensity: 0.72,
  slot_1: 'Wer den Fluss kennt, fürchtet die Brücke nicht.',
  slot_2: 'Du weißt heute mehr über deine Lage, als du dir zugestehst.',
  slot_3: 'Schau hin, ohne sofort zu bewerten.',
  aphorism_id: 'aph-0001',
};

/**
 * Default astro_profiles fixture used by mockFetch unless overridden via
 * opts.profile = null (= "no row, profile missing") or opts.profile = {...}.
 *
 * Has Libra moon so DIN-PERSONAL-001 can verify the prompt builder
 * surfaces 'Libra' for archetypeKey='mond'.
 */
const PROFILE_FIXTURE = {
  user_id: 'user-1',
  astro_json: {
    western: { zodiac_sign: 'Taurus', moon_sign: 'Libra', ascendant_sign: 'Libra' },
    bazi: { day_master: 'Ding', zodiac_sign: 'Dog' },
    wuxing: { dominant_element: 'Holz' },
  },
};

/**
 * @param {object} opts
 * @param {object|null} [opts.pulse]      — daily_pulses row or null
 * @param {object|null} [opts.existing]   — existing daily_interpretations row
 * @param {object|null} [opts.inserted]   — what insert returns (default uses 'gen-text')
 * @param {object|null} [opts.profile]    — astro_profiles row override (default PROFILE_FIXTURE)
 */
function mockFetch(opts = {}) {
  const pulse = 'pulse' in opts ? opts.pulse : PULSE_ROW;
  const existing = 'existing' in opts ? opts.existing : null;
  const inserted = opts.inserted ?? null;
  const profile = 'profile' in opts ? opts.profile : PROFILE_FIXTURE;

  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const url = typeof input === 'string' ? input
      : input instanceof URL ? input.toString()
        : input?.url ?? '';
    const method = (init?.method || (typeof input === 'object' && input?.method) || 'GET').toUpperCase();

    if (url.includes('auth/v1/user')) {
      const userBody = { id: 'user-1', email: 't@test.com', aud: 'authenticated' };
      return {
        ok: true, status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => userBody,
        text: async () => JSON.stringify(userBody),
      };
    }

    if (url.includes('/daily_pulses')) {
      const data = pulse ? [pulse] : [];
      return {
        ok: true, status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => data,
        text: async () => JSON.stringify(data),
      };
    }

    if (url.includes('/astro_profiles')) {
      // C-1: server reloads astro_profiles to inject the user's actual
      // signOrElement into the interpretation prompt. Tests get the
      // PROFILE_FIXTURE by default unless `profile: null` is passed.
      const headers = init?.headers || {};
      const acceptRaw = headers instanceof Headers ? headers.get('accept') : (headers['Accept'] ?? headers.accept ?? '');
      const wantsObject = String(acceptRaw || '').includes('vnd.pgrst.object');
      const list = profile ? [profile] : [];
      const body = wantsObject ? (list[0] ?? null) : list;
      return {
        ok: true, status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => body,
        text: async () => JSON.stringify(body),
      };
    }

    if (url.includes('/daily_interpretations')) {
      // Detect .single() / .maybeSingle() — both set Accept: application/vnd.pgrst.object+json
      const headers = init?.headers || {};
      const acceptRaw = headers instanceof Headers ? headers.get('accept') : (headers['Accept'] ?? headers.accept ?? '');
      const wantsObject = String(acceptRaw || '').includes('vnd.pgrst.object');

      if (method === 'POST') {
        // INSERT — return the persisted row.
        const row = inserted ?? {
          id: 'interp-uuid-1',
          text: 'GENERATED',
        };
        const body = wantsObject ? row : [row];
        return {
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => body,
          text: async () => JSON.stringify(body),
        };
      }
      // GET (idempotency check) — maybeSingle returns object or null
      const list = existing ? [existing] : [];
      const body = wantsObject ? (list[0] ?? null) : list;
      return {
        ok: true, status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => body,
        text: async () => JSON.stringify(body),
      };
    }

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

describe('POST /api/daily-interpretation — no-placeholders contract', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('DIN-001: happy path — pulse owned, AI succeeds → 200 with text', async () => {
    const generatedText =
      'Dein Skorpion-Mond bekommt heute Material zum Arbeiten. Du siehst eine Schicht unter der Oberfläche, die andere übersehen. Schau hin, ohne sofort zu bewerten.';
    mockFetch({ inserted: { id: 'interp-uuid-1', text: generatedText } });
    const app = await loadApp(makeGeminiTextMock(generatedText));

    const res = await request(app)
      .post('/api/daily-interpretation')
      .set(AUTH_HEADER)
      .set('Content-Type', 'application/json')
      .send({
        daily_pulse_id: 'pulse-uuid-1',
        selected_archetype_key: 'mond',
        locale: 'de',
      });

    expect(res.status).toBe(200);
    expect(res.body.text).toBe(generatedText);
    expect(res.body.id).toBe('interp-uuid-1');
  });

  it('DIN-002: pulse_id from another user → 404 PULSE_NOT_FOUND (auth boundary)', async () => {
    // The pulse-fetch query includes .eq('user_id', userId), so when the
    // pulse belongs to a different user the row simply isn't returned.
    // Mock that as "pulse: null".
    mockFetch({ pulse: null });
    const app = await loadApp(makeGeminiTextMock('SHOULD NOT BE CALLED'));

    const res = await request(app)
      .post('/api/daily-interpretation')
      .set(AUTH_HEADER)
      .set('Content-Type', 'application/json')
      .send({
        daily_pulse_id: 'pulse-of-user-2',
        selected_archetype_key: 'sonne',
        locale: 'de',
      });

    expect(res.status).toBe(404);
    expect(res.body?.error?.code).toBe('PULSE_NOT_FOUND');
  });

  it('DIN-003: AI exhausted → 503 AI_UNAVAILABLE (NOT a fallback string)', async () => {
    mockFetch();
    const app = await loadApp(makeGeminiAlwaysExhaustedMock());

    const res = await request(app)
      .post('/api/daily-interpretation')
      .set(AUTH_HEADER)
      .set('Content-Type', 'application/json')
      .send({
        daily_pulse_id: 'pulse-uuid-1',
        selected_archetype_key: 'mond',
        locale: 'de',
      });

    expect(res.status).toBe(503);
    expect(res.body?.error?.code).toBe('AI_UNAVAILABLE');
    expect(res.body?.error?.retry_after).toBe(300);
  });

  it('DIN-004: idempotent — second call serves from daily_interpretations row, no AI call', async () => {
    const cachedRow = {
      id: 'interp-uuid-cached',
      text: 'cached interpretation text from previous call',
      selected_archetype_key: 'mond',
      locale: 'de',
    };
    mockFetch({ existing: cachedRow });
    const app = await loadApp(makeGeminiTextMock('SHOULD NOT BE CALLED — IDEMPOTENT HIT'));

    const res = await request(app)
      .post('/api/daily-interpretation')
      .set(AUTH_HEADER)
      .set('Content-Type', 'application/json')
      .send({
        daily_pulse_id: 'pulse-uuid-1',
        selected_archetype_key: 'mond',
        locale: 'de',
      });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('interp-uuid-cached');
    expect(res.body.text).toBe('cached interpretation text from previous call');
    // The text is exactly the cached one — confirms no AI call (otherwise
    // the mock would have replaced it with "SHOULD NOT BE CALLED ...").
    expect(res.body.text).not.toContain('SHOULD NOT BE CALLED');
  });

  it('DIN-005: invalid archetype_key → 400 INVALID_BODY', async () => {
    mockFetch();
    const app = await loadApp(makeGeminiTextMock('any'));

    const res = await request(app)
      .post('/api/daily-interpretation')
      .set(AUTH_HEADER)
      .set('Content-Type', 'application/json')
      .send({
        daily_pulse_id: 'pulse-uuid-1',
        selected_archetype_key: 'not-a-figure',
        locale: 'de',
      });

    expect(res.status).toBe(400);
    expect(res.body?.error?.code).toBe('INVALID_BODY');
  });

  it('DIN-LOCK-001: 2nd different archetype on same pulse returns 409 ALREADY_DECIDED', async () => {
    // Per 2026-05-09 audit C-3: spec requires "Es geht nur einmal am Tag".
    // First pick already created a daily_interpretations row for 'mond'.
    // Second pick with a DIFFERENT archetype on the SAME pulse must NOT
    // create a 2nd row — server returns 409 with the locked decision in
    // the envelope so the client can render the locked Phase 2 instead
    // of nagging.
    const lockedRow = {
      id: 'int-existing',
      text: 'Locked Mond text',
      selected_archetype_key: 'mond',
      locale: 'de',
    };
    mockFetch({ existing: lockedRow });
    const geminiClass = makeGeminiTextMock('SHOULD NOT BE CALLED — LOCK GUARD');
    const app = await loadApp(geminiClass);

    const res = await request(app)
      .post('/api/daily-interpretation')
      .set(AUTH_HEADER)
      .set('Content-Type', 'application/json')
      .send({
        daily_pulse_id: 'pulse-uuid-1',
        selected_archetype_key: 'sonne',
        locale: 'de',
      });

    expect(res.status).toBe(409);
    expect(res.body?.error?.code).toBe('ALREADY_DECIDED');
    expect(res.body?.error?.locked_archetype_key).toBe('mond');
    expect(res.body?.error?.text).toBe('Locked Mond text');
  });

  it('DIN-LOCK-002: 2nd call with SAME archetype + locale → 200 idempotent (existing row returned)', async () => {
    // Page reload / double-click: same (pulse, archetype, locale) returns
    // the cached row, NOT 409. Pre-existing idempotency contract preserved
    // under the new pulse-id-only query.
    const lockedRow = {
      id: 'int-existing',
      text: 'Locked Mond text',
      selected_archetype_key: 'mond',
      locale: 'de',
    };
    mockFetch({ existing: lockedRow });
    const geminiClass = makeGeminiTextMock('SHOULD NOT BE CALLED — IDEMPOTENT HIT');
    const app = await loadApp(geminiClass);

    const res = await request(app)
      .post('/api/daily-interpretation')
      .set(AUTH_HEADER)
      .set('Content-Type', 'application/json')
      .send({
        daily_pulse_id: 'pulse-uuid-1',
        selected_archetype_key: 'mond',
        locale: 'de',
      });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('int-existing');
    expect(res.body.text).toBe('Locked Mond text');
    // Confirm no AI call (otherwise the mock would have replaced the text).
    expect(res.body.text).not.toContain('SHOULD NOT BE CALLED');
  });

  it('DIN-PERSONAL-001: prompt contains user\'s actual signOrElement (Libra), not just archetype key', async () => {
    // Spec C-1: spec requires "individuelle texte pro element/Zeichen"
    // — the LLM must NAME the user's actual sign for the picked
    // archetype. Without this, the LLM either stays generic or
    // hallucinates a random sign (e.g. invents "Skorpion-Mond" when
    // the user is actually a Libra moon).

    // Capture the prompt that the geminiClient receives.
    const captured = { prompt: '' };
    const geminiCapturingMock = {
      GoogleGenAI: class {
        models = {
          generateContent: vi.fn(async (req) => {
            captured.prompt =
              typeof req?.contents === 'string'
                ? req.contents
                : JSON.stringify(req?.contents ?? '');
            return { text: 'Dein Libra-Mond zeigt heute eine ruhige Wachsamkeit. Eine Schicht unter der Oberfläche wird sichtbar. Schau hin, ohne sofort zu bewerten.' };
          }),
        };
        getGenerativeModel = vi.fn().mockReturnValue({
          generateContent: vi.fn().mockResolvedValue({ response: { text: () => '' } }),
        });
      },
    };

    // Profile fixture has Libra moon; archetypeKey='mond' → server
    // must extract signOrElement='Libra' and inject it into the prompt.
    mockFetch({ inserted: { id: 'interp-personal', text: 'persisted' } });
    const app = await loadApp(geminiCapturingMock);

    const res = await request(app)
      .post('/api/daily-interpretation')
      .set(AUTH_HEADER)
      .set('Content-Type', 'application/json')
      .send({
        daily_pulse_id: 'pulse-uuid-1',
        selected_archetype_key: 'mond',
        locale: 'de',
      });

    expect(res.status).toBe(200);
    // Critical: the prompt must NAME the user's actual moon sign.
    expect(captured.prompt).toMatch(/Libra/);
    // Sanity: still contains the archetype key.
    expect(captured.prompt).toMatch(/mond/i);
    // Anti-hallucination guard: prompt explicitly states the
    // signOrElement, not leaving the LLM to invent one.
    expect(captured.prompt).toMatch(/signOrElement/i);
  });

  it('DIN-PERSONAL-002: missing astro_profiles → 422 PROFILE_REQUIRED (no AI call)', async () => {
    // Edge case: profile was deleted or zeroed between pulse-creation
    // and now. Server must not feed an empty profile to the prompt
    // builder (which would cascade into UNKNOWN sign + LLM may
    // hallucinate or stay generic). 422 forces the client to re-onboard.
    mockFetch({ profile: null });
    const geminiNoCall = makeGeminiTextMock('SHOULD NOT BE CALLED — PROFILE_REQUIRED');
    const app = await loadApp(geminiNoCall);

    const res = await request(app)
      .post('/api/daily-interpretation')
      .set(AUTH_HEADER)
      .set('Content-Type', 'application/json')
      .send({
        daily_pulse_id: 'pulse-uuid-1',
        selected_archetype_key: 'mond',
        locale: 'de',
      });

    expect(res.status).toBe(422);
    expect(res.body?.error?.code).toBe('PROFILE_REQUIRED');
  });

  it('DIN-RATE-001: 7th call within 1h window returns 429 RATE_LIMITED', async () => {
    // Fresh app instance → fresh in-memory limiter store. All 7 calls
    // share the same per-user (req.userId === 'user-1') bucket because
    // the auth mock resolves every Authorization header to user-1.
    // Calls 1–6 burn the quota (each is a normal happy-path 200), the
    // 7th must be blocked by the limiter BEFORE it reaches the handler.
    const generatedText = 'rate-limit test text';
    mockFetch({ inserted: { id: 'interp-uuid-rl', text: generatedText } });
    const app = await loadApp(makeGeminiTextMock(generatedText));

    const body = {
      daily_pulse_id: 'pulse-uuid-1',
      selected_archetype_key: 'mond',
      locale: 'de',
    };

    // Burn the 6-call quota.
    for (let i = 0; i < 6; i++) {
      const res = await request(app)
        .post('/api/daily-interpretation')
        .set(AUTH_HEADER)
        .set('Content-Type', 'application/json')
        .send(body);
      expect(res.status).toBe(200);
    }

    // 7th call → 429 RATE_LIMITED.
    const blocked = await request(app)
      .post('/api/daily-interpretation')
      .set(AUTH_HEADER)
      .set('Content-Type', 'application/json')
      .send(body);

    expect(blocked.status).toBe(429);
    expect(blocked.body?.error?.code).toBe('RATE_LIMITED');
    expect(blocked.body?.error?.retry_after).toBe(3600);
  });

  it('DIN-PERSONAL-003: prompt forbids paraphrasing slot_2 / slot_3', async () => {
    // Spec I-1: "Keine Wieerhlungen" — the interpretation must add
    // value beyond what slot_2 (Brücke) and slot_3 (Handlungsimpuls)
    // already said. Without an explicit guard, the LLM can rephrase
    // slot_2 in archetype-flavored language and call that the
    // Tagesdeutung — formally compliant but spec-violating.

    const captured = { prompt: '' };
    const geminiCapturingMock = {
      GoogleGenAI: class {
        models = {
          generateContent: vi.fn(async (req) => {
            captured.prompt =
              typeof req?.contents === 'string'
                ? req.contents
                : JSON.stringify(req?.contents ?? '');
            return { text: 'Dein Libra-Mond zeigt heute eine ruhige Wachsamkeit, eine Schicht unter der Oberfläche wird sichtbar.' };
          }),
        };
        getGenerativeModel = vi.fn().mockReturnValue({
          generateContent: vi.fn().mockResolvedValue({ response: { text: () => '' } }),
        });
      },
    };

    mockFetch({ inserted: { id: 'interp-anti-paraphrase', text: 'persisted' } });
    const app = await loadApp(geminiCapturingMock);

    const res = await request(app)
      .post('/api/daily-interpretation')
      .set(AUTH_HEADER)
      .set('Content-Type', 'application/json')
      .send({
        daily_pulse_id: 'pulse-uuid-1',
        selected_archetype_key: 'mond',
        locale: 'de',
      });

    expect(res.status).toBe(200);
    // Assert anti-paraphrase guards are present in the prompt:
    // POSITIVE rule: "MUSS Information ... nicht in slot_2 / slot_3"
    expect(captured.prompt).toMatch(/MUSS.+Information.+slot_2.*slot_3|slot_2.*slot_3.+NICHT.*enthielten/is);
    // NEGATIVE rule: explicit verbot of paraphrasing
    expect(captured.prompt).toMatch(/VERBOT.+paraphrasieren/i);
    // Regenerate clause: if output ≈ slot_2 or slot_3, regenerate.
    expect(captured.prompt).toMatch(/regener/i);
  });

  it('DIN-RACE-001: 23505 from concurrent insert → 409 ALREADY_DECIDED with re-fetched winner', async () => {
    // Audit follow-up I-2: between our pre-check (which sees null) and
    // our INSERT, a concurrent request can sneak in and create the row.
    // The unique constraint daily_interpretations_one_per_pulse rejects
    // us with Postgres 23505. We must NOT return generic 500 — instead
    // re-fetch the winning row and return 409 with the same envelope
    // shape as the pre-check path.

    let interpretationGetCount = 0;
    const winnerRow = {
      id: 'int-winner',
      text: 'Concurrent winner picked sonne',
      selected_archetype_key: 'sonne',
      locale: 'de',
    };

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = typeof input === 'string' ? input
        : input instanceof URL ? input.toString()
          : input?.url ?? '';
      const method = (init?.method || 'GET').toUpperCase();

      if (url.includes('auth/v1/user')) {
        return {
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ id: 'user-1', email: 't@test.com', aud: 'authenticated' }),
          text: async () => JSON.stringify({ id: 'user-1' }),
        };
      }
      if (url.includes('/daily_pulses')) {
        return {
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => [PULSE_ROW],
          text: async () => JSON.stringify([PULSE_ROW]),
        };
      }
      if (url.includes('/astro_profiles')) {
        return {
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => PROFILE_FIXTURE,
          text: async () => JSON.stringify(PROFILE_FIXTURE),
        };
      }
      if (url.includes('/daily_interpretations')) {
        const headers = init?.headers || {};
        const acceptRaw = headers instanceof Headers ? headers.get('accept') : (headers['Accept'] ?? headers.accept ?? '');
        const wantsObject = String(acceptRaw || '').includes('vnd.pgrst.object');

        if (method === 'POST') {
          // Simulate race-loser: concurrent insert beat us. Postgres
          // 23505 unique violation surfaces via PostgREST as 409 with
          // code='23505' in the body.
          return {
            ok: false, status: 409,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({ code: '23505', message: 'duplicate key value violates unique constraint "daily_interpretations_one_per_pulse"' }),
            text: async () => '{"code":"23505"}',
          };
        }
        // GET: first call (pre-check) returns null, second call
        // (re-fetch after 23505) returns the winner.
        interpretationGetCount += 1;
        const list = interpretationGetCount === 1 ? [] : [winnerRow];
        const body = wantsObject ? (list[0] ?? null) : list;
        return {
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => body,
          text: async () => JSON.stringify(body),
        };
      }
      return {
        ok: true, status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
        text: async () => '{}',
      };
    });

    const app = await loadApp(makeGeminiTextMock('Should not matter — race-loser path skips AI re-call.'));

    const res = await request(app)
      .post('/api/daily-interpretation')
      .set(AUTH_HEADER)
      .set('Content-Type', 'application/json')
      .send({
        daily_pulse_id: 'pulse-uuid-1',
        selected_archetype_key: 'mond',  // we tried mond, but sonne won the race
        locale: 'de',
      });

    expect(res.status).toBe(409);
    expect(res.body?.error?.code).toBe('ALREADY_DECIDED');
    expect(res.body?.error?.locked_archetype_key).toBe('sonne');
    expect(res.body?.error?.text).toBe('Concurrent winner picked sonne');
    // No locked_locale field (M-2 — dropped as unused).
    expect(res.body?.error?.locked_locale).toBeUndefined();
    // The pre-check GET fired once + the race-recovery re-fetch GET fired once = 2 total.
    expect(interpretationGetCount).toBe(2);
  });
});
