/**
 * Fallback-chain behaviour for server/ai-router.mjs.
 *
 * Covers:
 *   - Primary Gemini call succeeds → return directly, no fetch to OpenRouter.
 *   - Gemini throws 429/quota → rolls through OpenRouter free models.
 *   - First OpenRouter model 429 → rolls to the next in the chain.
 *   - Non-quota errors short-circuit (don't mask real bugs).
 *   - `getGenerativeModel(...).generateContent(prompt)` surface still returns
 *     a `{ response: { text() } }` shape for the legacy caller in server.mjs.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockGenerateContent = vi.fn();
vi.mock('@google/genai', () => ({
  // Class form so `new GoogleGenAI({...})` works at runtime.
  GoogleGenAI: class {
    models = { generateContent: mockGenerateContent };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    constructor(_config: any) {}
  },
}));

// Import AFTER the mock is registered.
// Using a dynamic import so the default export is re-evaluated fresh per test
// (not strictly necessary with vi.mock, but keeps the test easy to reason about).
import { createGenAiRouter, DEFAULT_FREE_MODEL_CHAIN } from '../../server/ai-router.mjs';

const originalFetch = globalThis.fetch;

function mockFetchOnce(responseOverrides: Array<{ ok?: boolean; status?: number; body?: unknown; text?: string }>) {
  const impls = responseOverrides.map((r) => () => {
    return Promise.resolve({
      ok: r.ok ?? true,
      status: r.status ?? 200,
      json: () => Promise.resolve(r.body ?? { choices: [{ message: { content: r.text ?? 'ok' } }] }),
      text: () => Promise.resolve(r.text ?? JSON.stringify(r.body ?? {})),
    } as unknown as Response);
  });
  const fn = vi.fn(() => {
    const next = impls.shift();
    if (!next) throw new Error('fetch called more times than expected');
    return next();
  });
  globalThis.fetch = fn as unknown as typeof fetch;
  return fn;
}

describe('createGenAiRouter — fallback chain', () => {
  beforeEach(() => {
    mockGenerateContent.mockReset();
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns null when neither GEMINI nor OPENROUTER key is set', () => {
    const router = createGenAiRouter({ geminiApiKey: undefined, openrouterApiKey: undefined });
    expect(router).toBeNull();
  });

  it('uses Gemini direct on success — never hits OpenRouter', async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    mockGenerateContent.mockResolvedValueOnce({ text: 'direct' });

    const router = createGenAiRouter({ geminiApiKey: 'g', openrouterApiKey: 'o' })!;
    const out = await router.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: 'hi',
      config: { temperature: 0.7 },
    });

    expect(out.text).toBe('direct');
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('falls through to OpenRouter when Gemini throws 429 quota error', async () => {
    mockGenerateContent.mockRejectedValueOnce(
      new Error('[GoogleGenerativeAI Error]: 429 RESOURCE_EXHAUSTED Quota exceeded'),
    );
    const fetchMock = mockFetchOnce([{ text: 'from-openrouter' }]);

    const router = createGenAiRouter({
      geminiApiKey: 'g',
      openrouterApiKey: 'o',
      freeModelChain: ['google/gemini-2.0-flash-exp:free'],
    })!;
    const out = await router.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: 'hi',
    });

    expect(out.text).toBe('from-openrouter');
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    expect((init as RequestInit).method).toBe('POST');
    const body = JSON.parse(String((init as RequestInit).body));
    expect(body.model).toBe('google/gemini-2.0-flash-exp:free');
    expect(body.messages).toEqual([{ role: 'user', content: 'hi' }]);
  });

  it('rolls through multiple OpenRouter models when each returns 429', async () => {
    mockGenerateContent.mockRejectedValueOnce(
      new Error('429 RESOURCE_EXHAUSTED'),
    );
    const fetchMock = mockFetchOnce([
      { ok: false, status: 429, text: '{"error":"rate limit"}' },
      { ok: false, status: 429, text: '{"error":"rate limit"}' },
      { text: 'third-wins' },
    ]);

    const router = createGenAiRouter({
      geminiApiKey: 'g',
      openrouterApiKey: 'o',
      freeModelChain: ['first:free', 'second:free', 'third:free'],
    })!;
    const out = await router.models.generateContent({ model: 'x', contents: 'q' });
    expect(out.text).toBe('third-wins');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('short-circuits on non-quota errors from Gemini (400 bad request)', async () => {
    mockGenerateContent.mockRejectedValueOnce(
      Object.assign(new Error('400 INVALID_ARGUMENT bad request'), { status: 400 }),
    );
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const router = createGenAiRouter({ geminiApiKey: 'g', openrouterApiKey: 'o' })!;
    await expect(
      router.models.generateContent({ model: 'x', contents: 'hi' }),
    ).rejects.toThrow(/400|INVALID_ARGUMENT/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('forwards responseMimeType=application/json as response_format for OpenRouter', async () => {
    mockGenerateContent.mockRejectedValueOnce(new Error('429 quota'));
    const fetchMock = mockFetchOnce([{ body: { choices: [{ message: { content: '{"k":1}' } }] } }]);

    const router = createGenAiRouter({
      geminiApiKey: 'g',
      openrouterApiKey: 'o',
      freeModelChain: ['only:free'],
    })!;
    await router.models.generateContent({
      model: 'x',
      contents: 'give json',
      config: { responseMimeType: 'application/json', temperature: 0.2, maxOutputTokens: 512 },
    });

    const body = JSON.parse(String((fetchMock.mock.calls[0][1] as RequestInit).body));
    expect(body.response_format).toEqual({ type: 'json_object' });
    expect(body.temperature).toBe(0.2);
    expect(body.max_tokens).toBe(512);
  });

  it('legacy getGenerativeModel().generateContent(prompt) returns response.text() as a function', async () => {
    mockGenerateContent.mockResolvedValueOnce({ text: 'legacy-style' });
    const router = createGenAiRouter({ geminiApiKey: 'g', openrouterApiKey: undefined })!;
    const model = router.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent('analyse this');
    expect(typeof result.response.text).toBe('function');
    expect(result.response.text()).toBe('legacy-style');
  });

  it('preserves OpenRouter default chain when no override is passed', () => {
    expect(DEFAULT_FREE_MODEL_CHAIN.length).toBeGreaterThan(0);
    expect(DEFAULT_FREE_MODEL_CHAIN.every((m) => m.includes(':free'))).toBe(true);
  });

  it('CASCADE-404: rolls through OpenRouter when first model returns 404 (model deprecated)', async () => {
    // Real-world failure mode 2026-05-09: google/gemini-*:free slots were
    // removed from OpenRouter and now return 404 "No endpoints found".
    // The router MUST treat that as cascadable (try the next model) instead
    // of bubbling — otherwise every Tagespuls slot generation returns null.
    mockGenerateContent.mockRejectedValueOnce(new Error('429 RESOURCE_EXHAUSTED'));
    const fetchMock = mockFetchOnce([
      { ok: false, status: 404, text: '{"error":"No endpoints found for google/gemini-flash-1.5:free"}' },
      { text: 'second-model-wins' },
    ]);

    const router = createGenAiRouter({
      geminiApiKey: 'g',
      openrouterApiKey: 'o',
      freeModelChain: ['google/gemini-flash-1.5:free', 'meta-llama/llama-3.3-70b-instruct:free'],
    })!;
    const out = await router.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: 'hi',
    });

    expect(out.text).toBe('second-model-wins');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('CASCADE-503: rolls through OpenRouter when first model returns 503 (overloaded)', async () => {
    mockGenerateContent.mockRejectedValueOnce(new Error('429 RESOURCE_EXHAUSTED'));
    const fetchMock = mockFetchOnce([
      { ok: false, status: 503, text: '{"error":"model overloaded"}' },
      { text: 'second-after-503' },
    ]);

    const router = createGenAiRouter({
      geminiApiKey: 'g',
      openrouterApiKey: 'o',
      freeModelChain: ['first:free', 'second:free'],
    })!;
    const out = await router.models.generateContent({ model: 'x', contents: 'q' });
    expect(out.text).toBe('second-after-503');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('CASCADE-502: rolls through OpenRouter when first model returns 502 (bad gateway)', async () => {
    mockGenerateContent.mockRejectedValueOnce(new Error('429 RESOURCE_EXHAUSTED'));
    const fetchMock = mockFetchOnce([
      { ok: false, status: 502, text: 'upstream provider error' },
      { text: 'second-after-502' },
    ]);

    const router = createGenAiRouter({
      geminiApiKey: 'g',
      openrouterApiKey: 'o',
      freeModelChain: ['first:free', 'second:free'],
    })!;
    const out = await router.models.generateContent({ model: 'x', contents: 'q' });
    expect(out.text).toBe('second-after-502');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('DEFAULT-CHAIN: does not include the deprecated google/gemini-*:free models', () => {
    // Guard: as of 2026-05-09 OpenRouter removed both google/gemini-2.0-flash-exp:free
    // and google/gemini-flash-1.5:free. Including them would make every Tagespuls
    // pulse generation start with two guaranteed 404s before reaching a working
    // model — pure latency tax.
    const deprecated = [
      'google/gemini-2.0-flash-exp:free',
      'google/gemini-flash-1.5:free',
    ];
    for (const dead of deprecated) {
      expect(
        DEFAULT_FREE_MODEL_CHAIN,
        `default chain still includes deprecated model "${dead}"`,
      ).not.toContain(dead);
    }
    // Sanity: chain still has at least 3 working models so the cascade is
    // meaningful when one provider is exhausted.
    expect(DEFAULT_FREE_MODEL_CHAIN.length).toBeGreaterThanOrEqual(3);
  });

  it('defaults the OpenRouter HTTP-Referer header to https://bazodiac.space', async () => {
    // Regression guard: default `referer` in createGenAiRouter must stay at
    // the production custom domain, not revert to a Railway-internal URL.
    mockGenerateContent.mockRejectedValueOnce(
      new Error('429 RESOURCE_EXHAUSTED'),
    );
    const fetchMock = mockFetchOnce([{ text: 'ok' }]);

    const router = createGenAiRouter({
      geminiApiKey: 'g',
      openrouterApiKey: 'o',
      freeModelChain: ['google/gemini-2.0-flash-exp:free'],
      // Note: NOT passing `referer` — we want to assert the default.
    })!;
    await router.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: 'hi',
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers['HTTP-Referer']).toBe('https://bazodiac.space');
  });
});
