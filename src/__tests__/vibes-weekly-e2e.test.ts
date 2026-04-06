/**
 * Integration tests: /api/vibes + /api/weekly-insights
 *
 * Verifies:
 * 1. Both endpoints return valid structure.
 * 2. Text fields contain no bare numbers (REQ-F-transparency-rule).
 * 3. Guard correctly substitutes fallback when Gemini response contains bare numbers.
 *
 * Uses supertest with the actual server.mjs module, mocking:
 * - Supabase (auth.getUser, REST queries)
 * - @google/genai (Gemini client)
 */
import request from 'supertest';
import { beforeEach, describe, it, expect, vi } from 'vitest';

// ── Bare number detector (mirror of server.mjs containsBareNumbers) ──
function containsBareNumbers(text: unknown): boolean {
  if (typeof text !== 'string' || !text) return false;
  return /\d+\s*%|\b\d+[.,]\d+\b/.test(text);
}

// ── Mock helpers ────────────────────────────────────────────────────

/** Mock Supabase fetch: auth passes, REST queries return empty */
function mockSupabaseFetch() {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = typeof input === 'string' ? input
      : input instanceof URL ? input.toString()
        : (input as Request).url;

    if (url.includes('auth/v1/user')) {
      return {
        ok: true, status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ id: 'user-1', email: 't@test.com', aud: 'authenticated' }),
        text: async () => JSON.stringify({ id: 'user-1', email: 't@test.com', aud: 'authenticated' }),
      } as Response;
    }

    // Supabase REST — return empty list
    return {
      ok: true, status: 200,
      headers: new Headers({ 'content-type': 'application/json', 'content-range': '0-0/0' }),
      json: async () => [],
      text: async () => '[]',
    } as Response;
  });
}

function makeGeminiMock(responseJson: object) {
  const responseText = JSON.stringify(responseJson);
  return {
    GoogleGenAI: class {
      models = {
        generateContent: vi.fn().mockResolvedValue({ text: responseText }),
      };
      getGenerativeModel = vi.fn().mockReturnValue({
        generateContent: vi.fn().mockResolvedValue({ response: { text: () => '' } }),
      });
    },
  };
}

// ── App loader (resets modules each call for fresh state) ────────────

async function loadApp(geminiMock?: object) {
  vi.resetModules();
  process.env.NODE_ENV = 'test';
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

  if (geminiMock) {
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    vi.doMock('@google/genai', () => geminiMock);
  } else {
    delete process.env.GEMINI_API_KEY;
  }

  const mod = await import('../../server.mjs');
  return mod.app;
}

// ── Common fixtures ─────────────────────────────────────────────────

const AUTH_HEADER = { Authorization: 'Bearer test-token' };

// ── Tests ──────────────────────────────────────────────────────────

describe('/api/vibes — structure and no-bare-numbers guard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns valid vibes structure via deterministic fallback (no Gemini key)', async () => {
    mockSupabaseFetch();
    const app = await loadApp(); // no gemini key → fallback

    const res = await request(app)
      .post('/api/vibes')
      .set(AUTH_HEADER)
      .set('Content-Type', 'application/json')
      .send({ userId: 'user-1' });

    expect(res.status).toBe(200);
    expect(typeof res.body.kurzsignal).toBe('string');
    expect(Array.isArray(res.body.treiber)).toBe(true);
    expect(typeof res.body.erklaerung).toBe('string');
    expect(typeof res.body.explain).toBe('object');
    expect(typeof res.body.explain.signatur_context).toBe('string');
    expect(typeof res.body.explain.transit_context).toBe('string');
  });

  it('fallback text fields contain no bare numbers', async () => {
    mockSupabaseFetch();
    const app = await loadApp();

    const res = await request(app)
      .post('/api/vibes')
      .set(AUTH_HEADER)
      .set('Content-Type', 'application/json')
      .send({ userId: 'user-1' });

    expect(res.status).toBe(200);
    const { kurzsignal, erklaerung, explain } = res.body;
    expect(containsBareNumbers(kurzsignal)).toBe(false);
    expect(containsBareNumbers(erklaerung)).toBe(false);
    expect(containsBareNumbers(explain?.signatur_context)).toBe(false);
    expect(containsBareNumbers(explain?.transit_context)).toBe(false);
  });

  it('guard substitutes fallback when Gemini returns bare numbers in kurzsignal', async () => {
    mockSupabaseFetch();
    const contaminated = {
      kurzsignal: 'Deine Energie liegt bei 72% heute.',
      treiber: ['Feuer', 'Transformation'],
      erklaerung: 'Die Resonanz ist hoch.',
      explain: {
        signatur_context: 'Deine Signatur zeigt Holz.',
        transit_context: 'Die Konstellation begünstigt Fokus.',
      },
    };
    const app = await loadApp(makeGeminiMock(contaminated));

    const res = await request(app)
      .post('/api/vibes')
      .set(AUTH_HEADER)
      .set('Content-Type', 'application/json')
      .send({ userId: 'user-2' }); // fresh user, no cache

    expect(res.status).toBe(200);
    // Guard must have replaced the contaminated kurzsignal with fallback
    expect(containsBareNumbers(res.body.kurzsignal)).toBe(false);
    expect(res.body.kurzsignal).not.toContain('72%');
  });

  it('passes through clean Gemini output without modification', async () => {
    mockSupabaseFetch();
    const clean = {
      kurzsignal: 'Offenheit begünstigt neue Impulse in dieser Phase.',
      treiber: ['Klarheit', 'Verbindung', 'Fluss'],
      erklaerung: 'Die aktuelle Konstellation fördert ruhige Stärke.',
      explain: {
        signatur_context: 'Deine Signatur zeigt Yin-Holz in der Führungsachse.',
        transit_context: 'Die Erde-Phase begünstigt geerdetete Entscheidungen.',
      },
    };
    const app = await loadApp(makeGeminiMock(clean));

    const res = await request(app)
      .post('/api/vibes')
      .set(AUTH_HEADER)
      .set('Content-Type', 'application/json')
      .send({ userId: 'user-3' });

    expect(res.status).toBe(200);
    expect(res.body.kurzsignal).toBe(clean.kurzsignal);
    expect(res.body.erklaerung).toBe(clean.erklaerung);
  });
});

describe('/api/weekly-insights — structure and no-bare-numbers guard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns valid weekly structure via deterministic fallback (no Gemini key)', async () => {
    mockSupabaseFetch();
    const app = await loadApp();

    const res = await request(app)
      .post('/api/weekly-insights')
      .set(AUTH_HEADER)
      .set('Content-Type', 'application/json')
      .send({ userId: 'user-1' });

    expect(res.status).toBe(200);
    expect(typeof res.body.week).toBe('string');
    expect(Array.isArray(res.body.areas)).toBe(true);
    expect(res.body.areas.length).toBe(7);
  });

  it('fallback area text fields contain no bare numbers', async () => {
    mockSupabaseFetch();
    const app = await loadApp();

    const res = await request(app)
      .post('/api/weekly-insights')
      .set(AUTH_HEADER)
      .set('Content-Type', 'application/json')
      .send({ userId: 'user-1' });

    expect(res.status).toBe(200);
    for (const area of res.body.areas) {
      expect(containsBareNumbers(area.statement)).toBe(false);
      expect(containsBareNumbers(area.explain)).toBe(false);
      expect(containsBareNumbers(area.tendency)).toBe(false);
    }
  });

  it('guard substitutes fallback when Gemini returns bare numbers in area statement', async () => {
    mockSupabaseFetch();
    const contaminated = {
      areas: [
        { key: 'liebe', statement: 'Resonanz liegt bei 0.85 — günstige Phase.', tendency: 'Intensität', explain: 'Holz-Achse aktiv.' },
        { key: 'beruf', statement: 'Fokus und Ausdauer zahlen sich aus.', tendency: 'Stärke', explain: 'Struktur begünstigt Klarheit.' },
        { key: 'gesundheit', statement: 'Balance und Regeneration im Vordergrund.', tendency: 'Gleichgewicht', explain: 'Erde-Phase fördert Ruhe.' },
        { key: 'alltag', statement: 'Kleine Schritte schaffen Klarheit.', tendency: 'Ordnung', explain: 'Systematische Energie wirkt.' },
        { key: 'karriere', statement: 'Langfristige Ziele gewinnen an Kontur.', tendency: 'Aufbau', explain: 'Saturn-Energie strukturiert.' },
        { key: 'freundschaften', statement: 'Verbindungen vertiefen sich natürlich.', tendency: 'Tiefe', explain: 'Wasserachse fördert Empathie.' },
        { key: 'sex_zaertlichkeit', statement: 'Zärtlichkeit öffnet neue Räume.', tendency: 'Offenheit', explain: 'Venus-Energie präsent.' },
      ],
    };
    const app = await loadApp(makeGeminiMock(contaminated));

    const res = await request(app)
      .post('/api/weekly-insights')
      .set(AUTH_HEADER)
      .set('Content-Type', 'application/json')
      .send({ userId: 'user-4' });

    expect(res.status).toBe(200);
    const liebe = res.body.areas.find((a: { key: string }) => a.key === 'liebe');
    expect(liebe).toBeDefined();
    // Guard must have replaced the contaminated statement
    expect(containsBareNumbers(liebe.statement)).toBe(false);
    expect(liebe.statement).not.toContain('0.85');
  });
});
