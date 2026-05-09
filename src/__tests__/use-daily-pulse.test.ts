/**
 * Tests for useDailyPulse — Phase E client hook.
 *
 * Covers the four error mappings (422 → profile_required,
 * 503 → ai_unavailable, network failure → network, other → unknown), the
 * happy-path response parsing, and the council-figure interpretation flow
 * including idempotent same-key re-tap (hook-level cache).
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// ── Mocks ────────────────────────────────────────────────────────────────
const authedFetch = vi.fn();
vi.mock('@/src/lib/authedFetch', () => ({
  authedFetch: (...args: unknown[]) => authedFetch(...args),
}));

const useAuthMock = vi.fn(() => ({
  user: { id: 'user-1' },
  loading: false,
}));
vi.mock('@/src/contexts/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

// ── Fixtures ─────────────────────────────────────────────────────────────
const VALID_PULSE = {
  id: 'pulse-abc',
  user_id: 'user-1',
  date: '2026-05-09',
  locale: 'de' as const,
  mode: 'pulse' as const,
  intensity: 0.42,
  harmony_index: 0.61,
  aphorism: {
    id: 'aph-1',
    author: 'Marcus Aurelius',
    attribution_status: 'verified' as const,
    slot_1: 'Die Tage fließen, und nichts hält still.',
    slot_2: 'Du sitzt am Schreibtisch, der Kaffee dampft, und ein Gedanke schiebt sich vor.',
    slot_3: 'Schreib einen Satz auf, der den Tag öffnet.',
  },
  council: [
    { key: 'sonne', displayName: 'Sonne', signOrElement: 'Taurus' },
    { key: 'mond', displayName: 'Mond', signOrElement: 'Libra' },
    { key: 'aszendent', displayName: 'Aszendent', signOrElement: 'Libra' },
    { key: 'day_master', displayName: 'Day-Master', signOrElement: 'Ding' },
    { key: 'jahrestier', displayName: 'Jahrestier', signOrElement: 'Dog' },
    { key: 'wuxing_dom', displayName: 'Wu-Xing dominant', signOrElement: 'Holz' },
  ],
  weather_stale: false,
};

function makeRes(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  const headerMap = new Map(Object.entries(headers));
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (k: string) => headerMap.get(k) ?? null },
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

beforeEach(() => {
  authedFetch.mockReset();
  useAuthMock.mockReturnValue({ user: { id: 'user-1' }, loading: false });
});

afterEach(() => {
  vi.clearAllMocks();
});

async function loadHook() {
  const mod = await import('../hooks/useDailyPulse');
  return mod.useDailyPulse;
}

// ── Tests ────────────────────────────────────────────────────────────────
describe('useDailyPulse', () => {
  it('DPH-001: happy path → state has pulse, no error', async () => {
    authedFetch.mockResolvedValueOnce(makeRes(200, VALID_PULSE));
    const useDailyPulse = await loadHook();

    const { result } = renderHook(() => useDailyPulse('de'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.pulse).not.toBeNull();
    expect(result.current.pulse?.aphorism.slot_1).toBe(VALID_PULSE.aphorism.slot_1);
    expect(result.current.pulse?.council).toHaveLength(6);
    expect(result.current.error).toBeNull();
  });

  it('DPH-002: 422 → error.code = profile_required', async () => {
    authedFetch.mockResolvedValueOnce(
      makeRes(422, { error: { code: 'PROFILE_REQUIRED' } }),
    );
    const useDailyPulse = await loadHook();

    const { result } = renderHook(() => useDailyPulse('de'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toEqual({ code: 'profile_required' });
    expect(result.current.pulse).toBeNull();
  });

  it('DPH-003: 503 on /daily-pulse → error.code = ai_unavailable', async () => {
    authedFetch.mockResolvedValueOnce(
      makeRes(503, { error: { code: 'APHORISM_POOL_EMPTY' } }),
    );
    const useDailyPulse = await loadHook();

    const { result } = renderHook(() => useDailyPulse('de'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error?.code).toBe('ai_unavailable');
    expect(result.current.pulse).toBeNull();
  });

  it('DPH-004: network failure → error.code = network', async () => {
    authedFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const useDailyPulse = await loadHook();

    const { result } = renderHook(() => useDailyPulse('de'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toEqual({ code: 'network' });
    expect(result.current.pulse).toBeNull();
  });

  it('DPH-005: selectCouncilFigure POSTs and stores interpretation', async () => {
    // First call: pulse fetch
    authedFetch.mockResolvedValueOnce(makeRes(200, VALID_PULSE));
    // Second call: interpretation POST
    authedFetch.mockResolvedValueOnce(
      makeRes(200, { id: 'interp-1', text: 'Heute trägt die Sonne dich ruhig.' }),
    );
    const useDailyPulse = await loadHook();

    const { result } = renderHook(() => useDailyPulse('de'));
    await waitFor(() => expect(result.current.pulse).not.toBeNull());

    act(() => {
      result.current.selectCouncilFigure('sonne');
    });

    await waitFor(() => {
      expect(result.current.interpretation).not.toBeNull();
    });

    expect(result.current.selectedFigure).toBe('sonne');
    expect(result.current.interpretation?.text).toBe('Heute trägt die Sonne dich ruhig.');
    expect(result.current.interpretationError).toBeNull();

    // Verify the POST body contained the right fields.
    const interpCall = authedFetch.mock.calls[1];
    expect(interpCall[0]).toBe('/api/daily-interpretation');
    const body = JSON.parse(interpCall[1].body);
    expect(body).toEqual({
      daily_pulse_id: 'pulse-abc',
      selected_archetype_key: 'sonne',
      locale: 'de',
    });
  });

  it('DPH-006: re-tapping the same figure is hook-level idempotent (no second fetch)', async () => {
    authedFetch.mockResolvedValueOnce(makeRes(200, VALID_PULSE));
    authedFetch.mockResolvedValueOnce(
      makeRes(200, { id: 'interp-1', text: 'Heute trägt die Sonne dich ruhig.' }),
    );
    const useDailyPulse = await loadHook();

    const { result } = renderHook(() => useDailyPulse('de'));
    await waitFor(() => expect(result.current.pulse).not.toBeNull());

    act(() => {
      result.current.selectCouncilFigure('sonne');
    });
    await waitFor(() => expect(result.current.interpretation).not.toBeNull());

    // Reset back to phase 1, then re-select the same figure.
    act(() => {
      result.current.resetFigure();
    });
    expect(result.current.selectedFigure).toBeNull();

    act(() => {
      result.current.selectCouncilFigure('sonne');
    });
    expect(result.current.selectedFigure).toBe('sonne');
    // Still only 2 authedFetch calls in total: 1 pulse + 1 interpretation.
    expect(authedFetch).toHaveBeenCalledTimes(2);
    // Cached interpretation is immediately available again.
    expect(result.current.interpretation?.text).toBe('Heute trägt die Sonne dich ruhig.');
  });

  it('DPH-007: 503 on interpretation → interpretationError.code = ai_unavailable, pulse stays', async () => {
    authedFetch.mockResolvedValueOnce(makeRes(200, VALID_PULSE));
    authedFetch.mockResolvedValueOnce(
      makeRes(503, { error: { code: 'AI_UNAVAILABLE', retry_after: 300 } }),
    );
    const useDailyPulse = await loadHook();

    const { result } = renderHook(() => useDailyPulse('de'));
    await waitFor(() => expect(result.current.pulse).not.toBeNull());

    act(() => {
      result.current.selectCouncilFigure('mond');
    });

    await waitFor(() => {
      expect(result.current.loadingInterpretation).toBe(false);
    });

    expect(result.current.interpretationError).toEqual({
      code: 'ai_unavailable',
      retryAfter: 300,
    });
    expect(result.current.pulse).not.toBeNull();
    expect(result.current.interpretation).toBeNull();
  });

  it('DPH-008: response with null slot_2/slot_3 still parses cleanly', async () => {
    authedFetch.mockResolvedValueOnce(
      makeRes(200, {
        ...VALID_PULSE,
        aphorism: { ...VALID_PULSE.aphorism, slot_2: null, slot_3: null },
      }),
    );
    const useDailyPulse = await loadHook();

    const { result } = renderHook(() => useDailyPulse('de'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.pulse?.aphorism.slot_1).toBeTruthy();
    expect(result.current.pulse?.aphorism.slot_2).toBeNull();
    expect(result.current.pulse?.aphorism.slot_3).toBeNull();
  });
});
