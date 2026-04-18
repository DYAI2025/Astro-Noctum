import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const SAMPLE_SECTORS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.5, 0.5, 0.5];

type UpsertCall = [unknown, unknown];

function buildMockClient(upsertResult: { data: unknown; error: unknown } | Error) {
  const upsert = vi.fn((..._args: UpsertCall) => ({
    select: vi.fn(async () => {
      if (upsertResult instanceof Error) {
        throw upsertResult;
      }
      return upsertResult;
    }),
  }));
  const from = vi.fn(() => ({ upsert }));
  return {
    client: { from },
    upsert,
    from,
  };
}

describe('persistSoulprintSectors', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  async function loadFn() {
    const mod = await import('../../server.mjs');
    return mod.persistSoulprintSectors as (
      client: unknown,
      userId: string,
      sectors: number[],
    ) => Promise<{ saved: boolean }>;
  }

  it('(a) calls upsert with user_id + soulprint_sectors only, onConflict user_id', async () => {
    const persistSoulprintSectors = await loadFn();
    const { client, upsert, from } = buildMockClient({
      data: [{ user_id: 'user-1' }],
      error: null,
    });

    const result = await persistSoulprintSectors(client, 'user-1', SAMPLE_SECTORS);

    expect(result).toEqual({ saved: true });
    expect(from).toHaveBeenCalledWith('astro_profiles');
    expect(upsert).toHaveBeenCalledTimes(1);
    const [payload, options] = upsert.mock.calls[0];
    // payload contains ONLY user_id + soulprint_sectors — no astro_json, no birth_*
    expect(payload).toEqual({
      user_id: 'user-1',
      soulprint_sectors: SAMPLE_SECTORS,
    });
    expect(Object.keys(payload as Record<string, unknown>).sort()).toEqual([
      'soulprint_sectors',
      'user_id',
    ]);
    expect(options).toEqual({ onConflict: 'user_id' });
  });

  it('(b) existing row: upsert payload still has only the two fields → Postgres preserves astro_json and other columns', async () => {
    // This is the client-boundary guarantee that backs the "existing row: only
    // soulprint_sectors + updated_at change" acceptance criterion. If we only
    // send two fields, Postgres ON CONFLICT DO UPDATE SET only touches those
    // two (plus updated_at via DB default). The preservation of astro_json is
    // a Postgres semantic, not something the client can violate.
    const persistSoulprintSectors = await loadFn();
    const { client, upsert } = buildMockClient({
      data: [{ user_id: 'existing-user' }],
      error: null,
    });

    await persistSoulprintSectors(client, 'existing-user', SAMPLE_SECTORS);

    const [payload] = upsert.mock.calls[0];
    expect(payload).not.toHaveProperty('astro_json');
    expect(payload).not.toHaveProperty('birth_date');
    expect(payload).not.toHaveProperty('sun_sign');
  });

  it('(c) upsert error → saved: false + warn log', async () => {
    const persistSoulprintSectors = await loadFn();
    const { client } = buildMockClient({
      data: null,
      error: { message: 'duplicate key value violates unique constraint' },
    });

    const result = await persistSoulprintSectors(client, 'user-err', SAMPLE_SECTORS);

    expect(result).toEqual({ saved: false });
    expect(console.warn).toHaveBeenCalledWith(
      '[bootstrap] soulprint save failed',
      'duplicate key value violates unique constraint',
    );
  });

  it('upsert throws (network error) → saved: false + warn log', async () => {
    const persistSoulprintSectors = await loadFn();
    const { client } = buildMockClient(new Error('network down'));

    const result = await persistSoulprintSectors(client, 'user-net', SAMPLE_SECTORS);

    expect(result).toEqual({ saved: false });
    expect(console.warn).toHaveBeenCalledWith(
      '[bootstrap] soulprint save threw',
      expect.any(Error),
    );
  });

  it('upsert returns empty data (defensive — affected 0 rows) → saved: false + warn log', async () => {
    const persistSoulprintSectors = await loadFn();
    const { client } = buildMockClient({ data: [], error: null });

    const result = await persistSoulprintSectors(client, 'user-zero', SAMPLE_SECTORS);

    expect(result).toEqual({ saved: false });
    expect(console.warn).toHaveBeenCalledWith(
      '[bootstrap] soulprint save affected 0 rows for user_id',
      'user-zero',
    );
  });

  it('null client → saved: false, no soulprint-related warn', async () => {
    const persistSoulprintSectors = await loadFn();

    const result = await persistSoulprintSectors(null, 'user-x', SAMPLE_SECTORS);

    expect(result).toEqual({ saved: false });
    // Module-init may emit unrelated warns (env vars, GoTrueClient, etc.) —
    // we only assert no soulprint-specific warn is logged in this path.
    expect(console.warn).not.toHaveBeenCalledWith(
      expect.stringMatching(/^\[bootstrap\] soulprint save/),
      expect.anything(),
    );
  });
});
