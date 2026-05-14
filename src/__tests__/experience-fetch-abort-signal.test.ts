/**
 * F3 of docs/plans/2026-05-09-sustainable-findings-cleanup.md
 *
 * Pins that AbortSignal threads from `fetchDailyExperience` (the public
 * service surface) all the way down to the underlying `fetch()` call.
 *
 * Initial state: RED. The current `fetchDailyExperience` signature accepts
 * no signal and never forwards one. Callers can pass a signal at the hook
 * level, but it's advisory-only — when the React effect aborts mid-flight,
 * the network request still runs to completion. This wastes bandwidth and
 * (worse) lets in-flight responses race against unmount, occasionally
 * triggering "setState on unmounted component" warnings.
 *
 * Fix (F3 step 3): add an optional `options?: { signal?: AbortSignal }`
 * 8th parameter to `fetchDailyExperience` and forward it via the existing
 * `RequestInit.signal` slot through `authedFetch`. `authedFetch` already
 * spreads `init` into the `fetch()` call, so once `services/experience`
 * passes it through, no `authedFetch` change is needed.
 *
 * Per project doctrine: behavior described explicitly. The test checks
 * the contract at the seam where it matters — the global `fetch` call —
 * because that's the only point where the signal actually does work.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase auth to avoid VITE_SUPABASE_* env requirements in node test
vi.mock('@/src/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
  },
}));

// Capture every fetch invocation so we can inspect the signal slot.
// We resolve with a JSON-shaped payload that the daily schema accepts;
// the production-shape minimum is large but Zod parses unknown extras.
const fetchSpy = vi.fn();

beforeEach(() => {
  fetchSpy.mockReset();
  // Stub a minimally-valid DailyResponse JSON. Schema fields known to be
  // required: kpi.coherence (number), narrative.de (string), narrative.en
  // (string). Extra fields are ignored by Zod-parse.
  // Minimal-valid DailyResponse for Zod parse. Section/fusion fields all
  // required; meta requires engine_version. Kept tight on purpose — every
  // field added here is one more thing the test couples to schema drift.
  const section = {
    summary: 's',
    themes: [] as string[],
    caution: 'c',
    opportunity: 'o',
    evidence: {},
  };
  fetchSpy.mockResolvedValue(
    new Response(
      JSON.stringify({
        date: '2026-05-09',
        western: section,
        eastern: section,
        fusion: {
          summary: 's',
          synthesis: 'y',
          action: 'a',
          pushworthy: false,
          harmony_index: 0.5,
          day_mode: 'pulse',
        },
        meta: { engine_version: '1.0.0-test' },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    ),
  );
  vi.stubGlobal('fetch', fetchSpy);
});

import { fetchDailyExperience } from '@/src/services/experience';

describe('fetchDailyExperience — AbortSignal threading (F3)', () => {
  const baseArgs = {
    birth: { date: '1990-01-01', time: '12:00', tz: 'Europe/Berlin', lat: 52.52, lon: 13.4 },
    soulprintSectors: Array(12).fill(0.5),
    quizSectors: Array(12).fill(0.5),
    targetDate: '2026-05-09',
    locale: 'de-DE',
    transitInfluences: [],
    birthSign: 'Aries',
  };

  it('forwards options.signal as RequestInit.signal to the underlying fetch', async () => {
    const controller = new AbortController();

    await fetchDailyExperience(
      baseArgs.birth,
      baseArgs.soulprintSectors,
      baseArgs.quizSectors,
      baseArgs.targetDate,
      baseArgs.locale,
      baseArgs.transitInfluences,
      baseArgs.birthSign,
      // The 8th parameter — currently does not exist (this is the RED line).
      { signal: controller.signal },
    );

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, init] = fetchSpy.mock.calls[0];
    // Identity assertion — must be the SAME signal, not a fresh controller's.
    // This catches both "signal not threaded" and "wrong signal substituted".
    expect(init?.signal).toBe(controller.signal);
  });

  it('does not break the v1 call shape — omitting options leaves signal undefined', async () => {
    // Backwards-compat guarantee. Existing callers that pass 7 positional args
    // must continue to work; the new options arg is optional.
    await fetchDailyExperience(
      baseArgs.birth,
      baseArgs.soulprintSectors,
      baseArgs.quizSectors,
      baseArgs.targetDate,
      baseArgs.locale,
      baseArgs.transitInfluences,
      baseArgs.birthSign,
    );

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, init] = fetchSpy.mock.calls[0];
    expect(init?.signal).toBeUndefined();
  });

  it('aborting the controller after fetchDailyExperience returns does not retroactively flag the call', async () => {
    // Sanity: signal identity must be preserved even after the request resolves.
    // Catches a regression where authedFetch might clone init and lose ref equality.
    const controller = new AbortController();

    await fetchDailyExperience(
      baseArgs.birth,
      baseArgs.soulprintSectors,
      baseArgs.quizSectors,
      baseArgs.targetDate,
      baseArgs.locale,
      baseArgs.transitInfluences,
      baseArgs.birthSign,
      { signal: controller.signal },
    );

    const [, init] = fetchSpy.mock.calls[0];
    expect(init?.signal?.aborted).toBe(false);
    controller.abort();
    expect(init?.signal?.aborted).toBe(true);
    // ^ The controller still controls the captured signal because it's the
    //   same object — no defensive copy along the path.
  });
});
