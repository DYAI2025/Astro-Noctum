import { describe, it, expect } from 'vitest';

describe('Space Weather Extended schema', () => {
  it('exports SpaceWeatherExtendedSchema', async () => {
    const mod = await import('@/src/lib/schemas/space-weather');
    expect(mod.SpaceWeatherExtendedSchema).toBeDefined();
  });

  it('validates a minimal response', async () => {
    const { SpaceWeatherExtendedSchema } = await import('@/src/lib/schemas/space-weather');
    const minimal = {
      current: { kp: 3, kpForecast3h: [], xrayFlux: 1e-6, xrayClass: 'C', protonFlux: 0.5 },
      events: [],
      alerts: [],
      epoch: { sunspotNumber: 120, f107: 145, solarCyclePhase: 'ascending' },
      meta: { fetchedAt: new Date().toISOString(), noaaVersion: 'v1' as const, cacheTtlSeconds: 300 },
    };
    const result = SpaceWeatherExtendedSchema.safeParse(minimal);
    expect(result.success).toBe(true);
  });

  it('rejects signature_weight > 0.5', async () => {
    const { SpaceWeatherContributionSchema } = await import('@/src/lib/schemas/space-weather');
    const overweight = {
      schema: 'sp.contribution.v1',
      event_id: 'test:1',
      type: 'flare',
      severity: 'G3',
      signature_weight: 0.8,
      started_at: new Date().toISOString(),
      expires_at: new Date().toISOString(),
    };
    const result = SpaceWeatherContributionSchema.safeParse(overweight);
    expect(result.success).toBe(false);
  });
});

describe('server.mjs space-weather/extended endpoint', () => {
  it('endpoint is registered in server code', async () => {
    const fs = await import('fs');
    const code = fs.readFileSync('server.mjs', 'utf8');
    expect(code).toContain('/api/space-weather/extended');
    expect(code).toContain('sp.contribution.v1');
  });

  it('DONKI events are filtered by expires_at', async () => {
    const fs = await import('fs');
    const code = fs.readFileSync('server.mjs', 'utf8');
    expect(code).toContain('expires_at');
    expect(code).toMatch(/filter.*expires_at/s);
  });

  // ── #127: WSA-ENLIL & Kp forecast ──────────────────────────────────

  it('WSA-ENLIL is included in DONKI fetch list', async () => {
    const fs = await import('fs');
    const code = fs.readFileSync('server.mjs', 'utf8');
    expect(code).toContain('WSAEnlilSimulations');
    expect(code).toContain('name === "wsa"');
  });

  it('WSA-ENLIL events are typed as geomagnetic_storm with weight cap 0.5', async () => {
    const fs = await import('fs');
    const code = fs.readFileSync('server.mjs', 'utf8');
    const wsaStart = code.indexOf('name === "wsa"');
    const wsaEnd = code.indexOf('name === "sep"');
    const wsaBlock = code.slice(wsaStart, wsaEnd);
    expect(wsaBlock).toContain('geomagnetic_storm');
    expect(wsaBlock).toContain('Math.min(0.5');
  });

  it('geomagnetic_storm is a valid type in SpaceWeatherContributionSchema', async () => {
    const { SpaceWeatherContributionSchema } = await import('@/src/lib/schemas/space-weather');
    const wsaEvent = {
      schema: 'sp.contribution.v1',
      event_id: 'wsa:sim001',
      type: 'geomagnetic_storm',
      severity: 'G2',
      signature_weight: 0.2,
      started_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 36 * 3600_000).toISOString(),
      description: 'WSA-ENLIL: solar wind arrival, Kp~6',
    };
    expect(SpaceWeatherContributionSchema.safeParse(wsaEvent).success).toBe(true);
  });

  it('kpForecast3h is populated from NOAA forecast endpoint (not hardcoded [])', async () => {
    const fs = await import('fs');
    const code = fs.readFileSync('server.mjs', 'utf8');
    expect(code).toContain('noaa-planetary-k-index-forecast.json');
    // Variable kpForecast3h must be used in payload, not []
    expect(code).not.toMatch(/kpForecast3h:\s*\[\]/);
  });

  it('meta.noaaVersion is dynamic (not hardcoded "v1")', async () => {
    const fs = await import('fs');
    const code = fs.readFileSync('server.mjs', 'utf8');
    expect(code).toContain('noaaAdapterVersion');
    expect(code).not.toMatch(/noaaVersion:\s*"v1"/);
  });

  it('KpForecastSchema rejects kp > 9', async () => {
    const { KpForecastSchema } = await import('@/src/lib/schemas/space-weather');
    const overRange = { timestamp: '2026-03-22T15:00:00Z', kp: 10, noaaScale: 'G0' };
    expect(KpForecastSchema.safeParse(overRange).success).toBe(false);
  });

  it('KpForecastSchema accepts a real forecast entry', async () => {
    const { KpForecastSchema } = await import('@/src/lib/schemas/space-weather');
    const valid = { timestamp: '2026-03-23T12:00:00Z', kp: 4.67, noaaScale: 'G2' };
    expect(KpForecastSchema.safeParse(valid).success).toBe(true);
  });
});
