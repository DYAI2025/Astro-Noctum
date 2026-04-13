/**
 * contract-synastry.test.ts
 *
 * Contract tests for /api/synastry endpoint.
 * Validates request body shape and expected response shape from computeSynastry.
 * deletePartner uses Supabase directly — tests validate its guards.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock supabase — used by computeSynastry (session) and deletePartner
vi.mock('@/src/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

import { supabase } from '@/src/lib/supabase';
import { computeSynastry, deletePartner } from '../services/synastry';
import type { SynastryResult } from '../services/synastry';

const mockSupabase = vi.mocked(supabase);

// ── computeSynastry — request contract ───────────────────────────────────────

describe('computeSynastry — request body contract', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });

  it('sends POST to /api/synastry', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'test-token' } },
    } as any);

    const mockResponse: SynastryResult = {
      partner: { id: 'p1', display_name: 'Luna', birth_place: 'München' },
      aspects: [],
      synastry_summary: 'Compatible energy.',
      narrative_source: 'template',
      user_positions: { Sun: 120, Moon: 45 },
      partner_positions: { Sun: 85, Moon: 200 },
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });
    vi.stubGlobal('fetch', mockFetch);

    await computeSynastry('partner-uuid-1');

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/synastry',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('sends { partner_id } in POST body', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'test-token' } },
    } as any);

    const mockResponse: SynastryResult = {
      partner: { id: 'p1', display_name: 'Luna', birth_place: null },
      aspects: [],
      synastry_summary: 'Strong connection.',
      narrative_source: 'gemini',
      user_positions: {},
      partner_positions: {},
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    });
    vi.stubGlobal('fetch', mockFetch);

    await computeSynastry('partner-uuid-42');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body as string);
    expect(body).toHaveProperty('partner_id', 'partner-uuid-42');
  });

  it('sends Authorization header with Bearer token', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'my-jwt-token' } },
    } as any);

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        partner: { id: 'p1', display_name: 'X', birth_place: null },
        aspects: [],
        synastry_summary: '',
        narrative_source: 'template',
        user_positions: {},
        partner_positions: {},
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    await computeSynastry('p1');

    const headers = mockFetch.mock.calls[0][1].headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer my-jwt-token');
  });

  it('throws "Not authenticated" when no session', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
    } as any);

    await expect(computeSynastry('p1')).rejects.toThrow('Not authenticated');
  });

  it('throws "premium_required" on 403 response', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { access_token: 'token' } },
    } as any);

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: 'premium_required' }),
    }));

    await expect(computeSynastry('p1')).rejects.toThrow('premium_required');
  });
});

// ── computeSynastry — response shape contract ─────────────────────────────────

describe('computeSynastry — response shape expectations', () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });

  const makeResponse = (overrides: Partial<SynastryResult> = {}): SynastryResult => ({
    partner: { id: 'p1', display_name: 'Luna', birth_place: 'Berlin' },
    aspects: [
      {
        planet1: 'Sun',
        planet2: 'Moon',
        type: 'Konjunktion',
        angle: 0.5,
        orb: 0.5,
        exact: false,
        narrative: 'Deep emotional resonance.',
      },
    ],
    synastry_summary: 'Strong synergy between Sun and Moon.',
    narrative_source: 'gemini',
    user_positions: { Sun: 120, Moon: 30 },
    partner_positions: { Sun: 120.5, Moon: 200 },
    ...overrides,
  });

  it('response includes partner object with id and display_name', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: { access_token: 'tok' } } } as any);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => makeResponse() }));

    const result = await computeSynastry('p1');
    expect(result.partner).toHaveProperty('id', 'p1');
    expect(result.partner).toHaveProperty('display_name', 'Luna');
  });

  it('response includes aspects array', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: { access_token: 'tok' } } } as any);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => makeResponse() }));

    const result = await computeSynastry('p1');
    expect(Array.isArray(result.aspects)).toBe(true);
  });

  it('each aspect has planet1, planet2, type, angle, orb, exact, narrative', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: { access_token: 'tok' } } } as any);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => makeResponse() }));

    const result = await computeSynastry('p1');
    const aspect = result.aspects[0];
    expect(aspect).toHaveProperty('planet1');
    expect(aspect).toHaveProperty('planet2');
    expect(aspect).toHaveProperty('type');
    expect(typeof aspect.angle).toBe('number');
    expect(typeof aspect.orb).toBe('number');
    expect(typeof aspect.exact).toBe('boolean');
    expect(typeof aspect.narrative).toBe('string');
  });

  it('response includes synastry_summary string', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: { access_token: 'tok' } } } as any);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => makeResponse() }));

    const result = await computeSynastry('p1');
    expect(typeof result.synastry_summary).toBe('string');
  });

  it('narrative_source is either "template" or "gemini"', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: { access_token: 'tok' } } } as any);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => makeResponse() }));

    const result = await computeSynastry('p1');
    expect(['template', 'gemini']).toContain(result.narrative_source);
  });

  it('response includes user_positions and partner_positions records', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: { access_token: 'tok' } } } as any);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => makeResponse() }));

    const result = await computeSynastry('p1');
    expect(typeof result.user_positions).toBe('object');
    expect(typeof result.partner_positions).toBe('object');
  });

  it('partner.birth_place can be null', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: { access_token: 'tok' } } } as any);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: async () => makeResponse({ partner: { id: 'p1', display_name: 'Luna', birth_place: null } }),
    }));

    const result = await computeSynastry('p1');
    expect(result.partner.birth_place).toBeNull();
  });
});

// ── deletePartner — defence-in-depth guard ────────────────────────────────────

describe('deletePartner — user_id guard', () => {
  afterEach(() => { vi.clearAllMocks(); });

  it('throws "Not authenticated" when no user in session', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null } as any);

    await expect(deletePartner('some-id')).rejects.toThrow('Not authenticated');
  });

  it('does not call supabase.from when user is null', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null } as any);
    const fromSpy = vi.spyOn(mockSupabase, 'from');

    try { await deletePartner('some-id'); } catch { /* expected */ }

    expect(fromSpy).not.toHaveBeenCalled();
  });

  it('scopes delete by user_id when user is authenticated', async () => {
    const userId = 'user-abc-123';
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: userId } }, error: null } as any);

    const mockDelete = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockEq2 = vi.fn().mockReturnThis();
    const mockChain = {
      delete: mockDelete,
      eq: mockEq.mockReturnValue({ eq: mockEq2.mockResolvedValue({ error: null }) }),
    };
    mockSupabase.from.mockReturnValue(mockChain as any);

    await deletePartner('partner-id-456');

    // Verify .eq('user_id', userId) is called — defence-in-depth row scoping
    expect(mockEq).toHaveBeenCalledWith('user_id', userId);
  });
});
