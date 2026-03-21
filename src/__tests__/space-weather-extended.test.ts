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
});
