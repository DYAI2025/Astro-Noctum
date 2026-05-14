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
    // The unique constraint daily_interpretations_one_per_user_date rejects
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
            json: async () => ({ code: '23505', message: 'duplicate key value violates unique constraint "daily_interpretations_one_per_user_date"' }),
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

  it('DIN-RACE-002: 23505 from cross-locale concurrent insert → 409 with date-scoped winner', async () => {
    // Regression for PR #336 review: the pre-check is not sufficient on
    // its own. Two locale-switch requests can both see no interpretation
    // for the date and then race to insert different daily_pulse_id rows.
    // The DB must reject the loser with the date-scoped unique constraint,
    // and the server must re-fetch the winner across all pulse ids for the
    // date rather than only the requested EN pulse.
    const dePulse = { ...PULSE_ROW, id: 'pulse-de', locale: 'de' };
    const enPulse = { ...PULSE_ROW, id: 'pulse-en', locale: 'en' };
    const winnerRow = {
      id: 'int-winner-de',
      text: 'Concurrent DE winner picked mond',
      selected_archetype_key: 'mond',
      locale: 'de',
      daily_pulse_id: 'pulse-de',
    };

    let dailyPulsesGetCount = 0;
    let interpretationGetCount = 0;
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
        dailyPulsesGetCount += 1;
        const data = dailyPulsesGetCount === 1 ? [enPulse] : [dePulse, enPulse];
        return {
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => data,
          text: async () => JSON.stringify(data),
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
        if (method === 'POST') {
          return {
            ok: false, status: 409,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({ code: '23505', message: 'duplicate key value violates unique constraint "daily_interpretations_one_per_user_date"' }),
            text: async () => '{"code":"23505"}',
          };
        }
        interpretationGetCount += 1;
        const list = interpretationGetCount === 1 ? [] : [winnerRow];
        return {
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => list,
          text: async () => JSON.stringify(list),
        };
      }
      return {
        ok: true, status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
        text: async () => '{}',
      };
    });

    const app = await loadApp(makeGeminiTextMock('Generated EN text that loses the cross-locale race.'));

    const res = await request(app)
      .post('/api/daily-interpretation')
      .set(AUTH_HEADER)
      .set('Content-Type', 'application/json')
      .send({
        daily_pulse_id: 'pulse-en',
        selected_archetype_key: 'sonne',
        locale: 'en',
      });

    expect(res.status).toBe(409);
    expect(res.body?.error?.code).toBe('ALREADY_DECIDED');
    expect(res.body?.error?.locked_archetype_key).toBe('mond');
    expect(res.body?.error?.text).toBe('Concurrent DE winner picked mond');
    expect(interpretationGetCount).toBe(2);
  });

  it('DIN-LOOPHOLE-001: user has DE decision, EN pick for same Kalendertag returns 409 (cross-locale lock)', async () => {
    // Audit follow-up I-3: daily_pulses are keyed (user_id, date, locale)
    // so a user switching locale gets a NEW pulse_id. Without a
    // (user_id, date)-scoped lock, they could pick again — getting two
    // decisions on the same Kalendertag, violating spec C-3.
    //
    // Setup: user has TWO pulses today (pulse-de, pulse-en). User
    // already picked 'mond' on the DE pulse. Now they call the EN
    // endpoint with archetype='sonne'. Server must scope the lock by
    // (user, date), find the DE 'mond' decision, return 409.

    const dePulse = { ...PULSE_ROW, id: 'pulse-de', locale: 'de' };
    const enPulse = { ...PULSE_ROW, id: 'pulse-en', locale: 'en' };
    const lockedDeRow = {
      id: 'int-locked-de',
      text: 'Mond DE locked text',
      selected_archetype_key: 'mond',
      locale: 'de',
      daily_pulse_id: 'pulse-de',
    };

    let dailyPulsesGetCount = 0;
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
        dailyPulsesGetCount += 1;
        // 1st call: auth-boundary lookup (eq id, eq user_id) — request
        //           hits EN pulse, return that.
        // 2nd call: per-date scope lookup (eq user_id, eq date) — return
        //           BOTH pulses so the loophole-victim DE row is reachable.
        const data = dailyPulsesGetCount === 1 ? [enPulse] : [dePulse, enPulse];
        return {
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => data,
          text: async () => JSON.stringify(data),
        };
      }
      if (url.includes('/daily_interpretations')) {
        // .in('daily_pulse_id', ['pulse-de','pulse-en']).order().limit(1)
        // → returns earliest = the DE row
        return {
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => [lockedDeRow],
          text: async () => JSON.stringify([lockedDeRow]),
        };
      }
      // astro_profiles, etc. — should NOT be hit (lock short-circuits).
      return {
        ok: true, status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
        text: async () => '{}',
      };
    });

    const geminiClass = makeGeminiTextMock('SHOULD NOT BE CALLED — CROSS-LOCALE LOCK');
    const app = await loadApp(geminiClass);

    const res = await request(app)
      .post('/api/daily-interpretation')
      .set(AUTH_HEADER)
      .set('Content-Type', 'application/json')
      .send({
        daily_pulse_id: 'pulse-en',
        selected_archetype_key: 'sonne',
        locale: 'en',
      });

    expect(res.status).toBe(409);
    expect(res.body?.error?.code).toBe('ALREADY_DECIDED');
    expect(res.body?.error?.locked_archetype_key).toBe('mond');
    expect(res.body?.error?.text).toBe('Mond DE locked text');
  });

  it('DIN-CACHE-INVAL-001: POST invalidates L1 dailyPulseCache so next GET returns existing_decision', async () => {
    // PR-#331 follow-up C-1: dailyPulseCache (L1, 24h TTL) bakes
    // existing_decision into the cached payload but is never invalidated
    // by POST /api/daily-interpretation. A hard reload within 24h serves
    // the stale existing_decision: null payload, so useDailyPulse lands
    // in Phase 1 with active archetype buttons instead of the locked
    // Phase 2 — exactly the BUG-DAILY-003/004 regression the
    // existing_decision schema field was added to prevent.
    //
    // Scenario: GET (warm L1 with existing_decision: null) → POST → GET.
    // After fix, the 2nd GET must reflect the persisted decision rather
    // than serving the stale pre-POST payload.

    // Production astro_json shape (mirrors daily-pulse.test.mjs fixture so
    // the GET handler's harmonyIndexFromAstroJson + buildCouncilFromProfile
    // succeed and we reach the existing_decision lookup + cache write path).
    const profileAstroJson = {
      fusion: {
        cosmic_state: 0.8711,
        harmony_index: {
          method: 'dot_product',
          harmony_index: 0.8711, // → mode='trace'
          interpretation: 'Starke Resonanz',
        },
      },
      bazi: { day_master: 'Ding', zodiac_sign: 'Dog', pillars: { day: { stem: 'Ding' } } },
      western: { zodiac_sign: 'Taurus', moon_sign: 'Libra', ascendant_sign: 'Libra' },
      wuxing: { dominant_element: 'Holz' },
    };
    const aphorismRow = {
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
    const pulseAfterUpsert = {
      id: 'pulse-uuid-1',
      user_id: 'user-1',
      date: '2026-05-09',
      locale: 'de',
      mode: 'trace',
      intensity: 0.766,
      harmony_index: 0.8711,
      aphorism_id: aphorismRow.id,
      slot_1: aphorismRow.text_de,
      slot_2: 'Generated bridge sentence between aphorism and impulse.',
      slot_3: null,
      weather_stale: false,
    };
    // State: was the POST successful yet? Drives daily_interpretations GET.
    let interpretationPersisted = false;
    // Was the GET endpoint's /daily_pulses upsert run yet? Toggles whether
    // subsequent locale-scoped GETs return [] (cache miss → generate) or
    // [pulseAfterUpsert] (cache hit). Declared up here so the fetch-mock
    // closure binds cleanly (no TDZ surprises if the mock fires before the
    // var is initialized — which never happens, but cleaner this way).
    let upserted = false;
    const persistedRow = {
      id: 'interp-uuid-after-post',
      text: 'Dein Libra-Mond zeigt heute eine ruhige Wachsamkeit.',
      selected_archetype_key: 'mond',
      locale: 'de',
      daily_pulse_id: 'pulse-uuid-1',
      created_at: '2026-05-09T08:00:00Z',
    };

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

      if (url.includes('/astro_profiles')) {
        // GET endpoint reads .astro_json wrapper; POST endpoint also expects
        // the same shape (so the buildCouncilFromProfile reload in the
        // archetype-key path can extract signOrElement='Libra').
        const headers = init?.headers || {};
        const acceptRaw = headers instanceof Headers ? headers.get('accept') : (headers['Accept'] ?? headers.accept ?? '');
        const wantsObject = String(acceptRaw || '').includes('vnd.pgrst.object');
        const row = { astro_json: profileAstroJson };
        const body = wantsObject ? row : [row];
        return {
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => body,
          text: async () => JSON.stringify(body),
        };
      }

      if (url.includes('/daily_pulses')) {
        if (method === 'GET') {
          // First GET (locale-scoped): no existing row → generate-from-scratch.
          // Second GET (locale-scoped): row IS upserted now (we mirror this
          // in the cache layer, but the POST handler also fetches by id
          // which uses the same /daily_pulses?id=eq.X path → must succeed).
          // We always return [pulseAfterUpsert] here for any GET — the
          // first GET path enters the "no L2 row" branch only when the
          // locale-scoped query is empty. To force that, key off whether
          // the URL contains a locale filter (existing-row lookup) AND
          // whether the row has been "upserted" yet via POST upsert call.
          // Simpler: track an "upserted" flag separately so the first
          // locale-scoped GET returns [], all later GETs return [row].
          const isLocaleScoped = url.includes('locale=eq.');
          const isPulseIdScoped = url.includes('id=eq.');
          if (isPulseIdScoped) {
            // POST handler auth-boundary lookup — pulse must belong to user.
            return {
              ok: true, status: 200,
              headers: new Headers({ 'content-type': 'application/json' }),
              json: async () => [pulseAfterUpsert],
              text: async () => JSON.stringify([pulseAfterUpsert]),
            };
          }
          if (isLocaleScoped) {
            // GET endpoint L2 lookup: empty first time, populated after.
            // We use the upserted-flag set below by the POST upsert call.
            const data = upserted ? [pulseAfterUpsert] : [];
            return {
              ok: true, status: 200,
              headers: new Headers({ 'content-type': 'application/json' }),
              json: async () => data,
              text: async () => JSON.stringify(data),
            };
          }
          // Date-scoped (no locale filter): used to collect ALL pulse_ids
          // for the date (cross-locale lock check + existing_decision
          // hydration in GET endpoint).
          return {
            ok: true, status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => [{ id: pulseAfterUpsert.id }],
            text: async () => JSON.stringify([{ id: pulseAfterUpsert.id }]),
          };
        }
        // POST upsert (GET endpoint generate-from-scratch path).
        upserted = true;
        return {
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => [pulseAfterUpsert],
          text: async () => JSON.stringify([pulseAfterUpsert]),
        };
      }

      if (url.includes('/aphorisms') && !url.includes('aphorism_usage_events')) {
        if (url.includes('id=eq.')) {
          return {
            ok: true, status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => [aphorismRow],
            text: async () => JSON.stringify([aphorismRow]),
          };
        }
        return {
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => [aphorismRow],
          text: async () => JSON.stringify([aphorismRow]),
        };
      }

      if (url.includes('/aphorism_usage_events')) {
        return {
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => [],
          text: async () => '[]',
        };
      }

      if (url.includes('/daily_interpretations')) {
        const headers = init?.headers || {};
        const acceptRaw = headers instanceof Headers ? headers.get('accept') : (headers['Accept'] ?? headers.accept ?? '');
        const wantsObject = String(acceptRaw || '').includes('vnd.pgrst.object');

        if (method === 'POST') {
          // Successful insert — flip state so subsequent GETs see the row.
          interpretationPersisted = true;
          const body = wantsObject ? persistedRow : [persistedRow];
          return {
            ok: true, status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => body,
            text: async () => JSON.stringify(body),
          };
        }
        // GET — return row only if POST has happened.
        const list = interpretationPersisted ? [persistedRow] : [];
        const body = wantsObject ? (list[0] ?? null) : list;
        return {
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => body,
          text: async () => JSON.stringify(body),
        };
      }

      throw new Error(`Unhandled fetch mock request: ${method} ${url}`);
    });

    // GET endpoint also serializes the impulse_text via the slot-generation
    // helper which calls Gemini. Use a JSON-shaped response so the parser
    // accepts it. The interpretation POST also calls Gemini (plain string).
    const geminiBoth = {
      GoogleGenAI: class {
        models = {
          generateContent: vi.fn(async (req) => {
            const prompt = typeof req?.contents === 'string' ? req.contents : JSON.stringify(req?.contents ?? '');
            // The slot prompt asks for impulse_text JSON; the
            // interpretation prompt asks for free text. Disambiguate by
            // looking for the JSON-response hint.
            const wantsJson = req?.config?.responseMimeType === 'application/json'
              || /impulse_text/i.test(prompt);
            if (wantsJson) {
              return { text: JSON.stringify({ impulse_text: 'Generated bridge sentence between aphorism and impulse.' }) };
            }
            return { text: 'Dein Libra-Mond zeigt heute eine ruhige Wachsamkeit.' };
          }),
        };
        getGenerativeModel = vi.fn().mockReturnValue({
          generateContent: vi.fn().mockResolvedValue({ response: { text: () => '' } }),
        });
      },
    };
    const app = await loadApp(geminiBoth);

    // Step 1: warm L1 cache. GET with no existing decision → cached payload
    // has existing_decision: null.
    const r1 = await request(app)
      .get('/api/daily-pulse?date=2026-05-09&locale=de')
      .set(AUTH_HEADER);
    expect(r1.status).toBe(200);
    expect(r1.body.existing_decision).toBeNull();

    // Step 2: persist a decision.
    const post = await request(app)
      .post('/api/daily-interpretation')
      .set(AUTH_HEADER)
      .set('Content-Type', 'application/json')
      .send({
        daily_pulse_id: 'pulse-uuid-1',
        selected_archetype_key: 'mond',
        locale: 'de',
      });
    expect(post.status).toBe(200);
    expect(post.body.id).toBe('interp-uuid-after-post');

    // Step 3: GET again. Without the C-1 fix, the L1 cache hit short-circuits
    // before the existing_decision lookup, returning the stale null payload.
    // With the fix, the cache entry is invalidated and the handler re-reads
    // the DB, surfacing the persisted decision.
    const r2 = await request(app)
      .get('/api/daily-pulse?date=2026-05-09&locale=de')
      .set(AUTH_HEADER);
    expect(r2.status).toBe(200);
    expect(r2.body.existing_decision).not.toBeNull();
    expect(r2.body.existing_decision.archetype_key).toBe('mond');
    expect(r2.body.existing_decision.text).toBe('Dein Libra-Mond zeigt heute eine ruhige Wachsamkeit.');
  });

  it('DIN-CACHE-INVAL-002: POST invalidates locale-sibling cache (de POST clears en cache)', async () => {
    // PR-#331 follow-up C-1 (sibling case): cache rows exist per (userId,
    // date, locale). A user can warm both the de and en cache rows (e.g.
    // via the locale switcher) before picking. The POST must invalidate
    // BOTH locale siblings — otherwise switching locale after pick still
    // serves a stale Phase 1 payload.

    const profileAstroJson = {
      fusion: { cosmic_state: 0.8711, harmony_index: { method: 'dot_product', harmony_index: 0.8711, interpretation: 'Starke Resonanz' } },
      bazi: { day_master: 'Ding', zodiac_sign: 'Dog', pillars: { day: { stem: 'Ding' } } },
      western: { zodiac_sign: 'Taurus', moon_sign: 'Libra', ascendant_sign: 'Libra' },
      wuxing: { dominant_element: 'Holz' },
    };
    const aphorismRow = {
      id: 'aph-0001',
      text_de: 'Wer den Fluss kennt, fürchtet die Brücke nicht.',
      text_en: 'He who knows the river does not fear the bridge.',
      author: 'Anonymous', work: null, attribution_status: 'folkloric',
      mode_tags: ['trace', 'pulse'], quality_rating: 5, cooldown_days: 30,
    };
    // Distinct pulse rows per locale — pulses are keyed (user_id, date, locale).
    const pulseDe = {
      id: 'pulse-uuid-de', user_id: 'user-1', date: '2026-05-09', locale: 'de',
      mode: 'trace', intensity: 0.766, harmony_index: 0.8711,
      aphorism_id: aphorismRow.id, slot_1: aphorismRow.text_de,
      slot_2: 'Generated bridge DE.', slot_3: null, weather_stale: false,
    };
    const pulseEn = {
      id: 'pulse-uuid-en', user_id: 'user-1', date: '2026-05-09', locale: 'en',
      mode: 'trace', intensity: 0.766, harmony_index: 0.8711,
      aphorism_id: aphorismRow.id, slot_1: aphorismRow.text_en,
      slot_2: 'Generated bridge EN.', slot_3: null, weather_stale: false,
    };
    let upsertedDe = false;
    let upsertedEn = false;
    let interpretationPersisted = false;
    const persistedRow = {
      id: 'interp-uuid-after-post-de',
      text: 'Dein Libra-Mond zeigt heute eine ruhige Wachsamkeit.',
      selected_archetype_key: 'mond',
      locale: 'de',
      daily_pulse_id: 'pulse-uuid-de',
      created_at: '2026-05-09T08:00:00Z',
    };

    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = typeof input === 'string' ? input
        : input instanceof URL ? input.toString()
          : input?.url ?? '';
      const method = (init?.method || (typeof input === 'object' && input?.method) || 'GET').toUpperCase();

      if (url.includes('auth/v1/user')) {
        return {
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ id: 'user-1', email: 't@test.com', aud: 'authenticated' }),
          text: async () => JSON.stringify({ id: 'user-1' }),
        };
      }

      if (url.includes('/astro_profiles')) {
        const headers = init?.headers || {};
        const acceptRaw = headers instanceof Headers ? headers.get('accept') : (headers['Accept'] ?? headers.accept ?? '');
        const wantsObject = String(acceptRaw || '').includes('vnd.pgrst.object');
        const row = { astro_json: profileAstroJson };
        const body = wantsObject ? row : [row];
        return {
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => body,
          text: async () => JSON.stringify(body),
        };
      }

      if (url.includes('/daily_pulses')) {
        if (method === 'GET') {
          const isPulseIdScoped = url.includes('id=eq.');
          const isLocaleScoped = url.includes('locale=eq.');
          const isDe = url.includes('locale=eq.de');
          const isEn = url.includes('locale=eq.en');
          if (isPulseIdScoped) {
            // POST handler auth-boundary lookup — pulse-uuid-de.
            return {
              ok: true, status: 200,
              headers: new Headers({ 'content-type': 'application/json' }),
              json: async () => [pulseDe],
              text: async () => JSON.stringify([pulseDe]),
            };
          }
          if (isLocaleScoped) {
            const row = isDe ? (upsertedDe ? [pulseDe] : []) : isEn ? (upsertedEn ? [pulseEn] : []) : [];
            return {
              ok: true, status: 200,
              headers: new Headers({ 'content-type': 'application/json' }),
              json: async () => row,
              text: async () => JSON.stringify(row),
            };
          }
          // Date-scoped: return both upserted pulses (id-only projection).
          const ids = [];
          if (upsertedDe) ids.push({ id: pulseDe.id });
          if (upsertedEn) ids.push({ id: pulseEn.id });
          return {
            ok: true, status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ids,
            text: async () => JSON.stringify(ids),
          };
        }
        // POST upsert — pick row by body locale. Default to de since the
        // mock can't easily inspect the body; the two GET calls warm
        // distinct rows sequentially so we toggle by which flag is unset.
        let parsed = {};
        try { parsed = init?.body ? JSON.parse(init.body) : {}; } catch (e) { void e; }
        const isEn = parsed?.locale === 'en';
        if (isEn) {
          upsertedEn = true;
          return {
            ok: true, status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => [pulseEn],
            text: async () => JSON.stringify([pulseEn]),
          };
        }
        upsertedDe = true;
        return {
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => [pulseDe],
          text: async () => JSON.stringify([pulseDe]),
        };
      }

      if (url.includes('/aphorisms') && !url.includes('aphorism_usage_events')) {
        return {
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => [aphorismRow],
          text: async () => JSON.stringify([aphorismRow]),
        };
      }

      if (url.includes('/aphorism_usage_events')) {
        return {
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => [],
          text: async () => '[]',
        };
      }

      if (url.includes('/daily_interpretations')) {
        const headers = init?.headers || {};
        const acceptRaw = headers instanceof Headers ? headers.get('accept') : (headers['Accept'] ?? headers.accept ?? '');
        const wantsObject = String(acceptRaw || '').includes('vnd.pgrst.object');
        if (method === 'POST') {
          interpretationPersisted = true;
          const body = wantsObject ? persistedRow : [persistedRow];
          return {
            ok: true, status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => body,
            text: async () => JSON.stringify(body),
          };
        }
        const list = interpretationPersisted ? [persistedRow] : [];
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

    const geminiBoth = {
      GoogleGenAI: class {
        models = {
          generateContent: vi.fn(async (req) => {
            const prompt = typeof req?.contents === 'string' ? req.contents : JSON.stringify(req?.contents ?? '');
            const wantsJson = req?.config?.responseMimeType === 'application/json' || /impulse_text/i.test(prompt);
            if (wantsJson) {
              return { text: JSON.stringify({ impulse_text: 'Generated bridge sentence.' }) };
            }
            return { text: 'Dein Libra-Mond zeigt heute eine ruhige Wachsamkeit.' };
          }),
        };
        getGenerativeModel = vi.fn().mockReturnValue({
          generateContent: vi.fn().mockResolvedValue({ response: { text: () => '' } }),
        });
      },
    };
    const app = await loadApp(geminiBoth);

    // Warm both locale caches.
    const de1 = await request(app).get('/api/daily-pulse?date=2026-05-09&locale=de').set(AUTH_HEADER);
    expect(de1.status).toBe(200);
    expect(de1.body.existing_decision).toBeNull();

    const en1 = await request(app).get('/api/daily-pulse?date=2026-05-09&locale=en').set(AUTH_HEADER);
    expect(en1.status).toBe(200);
    expect(en1.body.existing_decision).toBeNull();

    // POST on de.
    const post = await request(app)
      .post('/api/daily-interpretation')
      .set(AUTH_HEADER)
      .set('Content-Type', 'application/json')
      .send({ daily_pulse_id: 'pulse-uuid-de', selected_archetype_key: 'mond', locale: 'de' });
    expect(post.status).toBe(200);

    // BOTH locale GETs must now reflect the decision. Without the en-sibling
    // invalidation, switching to en after pick still serves Phase 1.
    const de2 = await request(app).get('/api/daily-pulse?date=2026-05-09&locale=de').set(AUTH_HEADER);
    expect(de2.body.existing_decision?.archetype_key).toBe('mond');

    const en2 = await request(app).get('/api/daily-pulse?date=2026-05-09&locale=en').set(AUTH_HEADER);
    expect(en2.body.existing_decision?.archetype_key).toBe('mond');
  });

  it('DIN-LOOPHOLE-002: same archetype, different locale → 409 (locked text in original locale)', async () => {
    // Edge case: user has 'mond DE' decision, switches to EN, picks
    // 'mond' again. Same archetype but different locale. Per spec
    // C-3 ("first decision wins"), this is locked — user sees their
    // original DE text, not a fresh EN re-translation.
    const dePulse = { ...PULSE_ROW, id: 'pulse-de', locale: 'de' };
    const enPulse = { ...PULSE_ROW, id: 'pulse-en', locale: 'en' };
    const lockedDeRow = {
      id: 'int-locked-de',
      text: 'Original DE Mond text',
      selected_archetype_key: 'mond',
      locale: 'de',
      daily_pulse_id: 'pulse-de',
    };

    let dailyPulsesGetCount = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
      const url = typeof input === 'string' ? input
        : input instanceof URL ? input.toString()
          : input?.url ?? '';
      if (url.includes('auth/v1/user')) {
        return {
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ id: 'user-1', email: 't@test.com', aud: 'authenticated' }),
          text: async () => JSON.stringify({ id: 'user-1' }),
        };
      }
      if (url.includes('/daily_pulses')) {
        dailyPulsesGetCount += 1;
        const data = dailyPulsesGetCount === 1 ? [enPulse] : [dePulse, enPulse];
        return {
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => data,
          text: async () => JSON.stringify(data),
        };
      }
      if (url.includes('/daily_interpretations')) {
        return {
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => [lockedDeRow],
          text: async () => JSON.stringify([lockedDeRow]),
        };
      }
      return {
        ok: true, status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
        text: async () => '{}',
      };
    });

    const geminiClass = makeGeminiTextMock('SHOULD NOT BE CALLED');
    const app = await loadApp(geminiClass);

    const res = await request(app)
      .post('/api/daily-interpretation')
      .set(AUTH_HEADER)
      .set('Content-Type', 'application/json')
      .send({
        daily_pulse_id: 'pulse-en',
        selected_archetype_key: 'mond',  // same archetype
        locale: 'en',                    // different locale
      });

    expect(res.status).toBe(409);
    expect(res.body?.error?.code).toBe('ALREADY_DECIDED');
    expect(res.body?.error?.locked_archetype_key).toBe('mond');
    expect(res.body?.error?.text).toBe('Original DE Mond text');
  });
});
