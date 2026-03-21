import { describe, it, expect } from 'vitest';

describe('NOAA Adapter module', () => {
  it('exports createNoaaAdapter', async () => {
    const mod = await import('@/src/lib/space-weather/noaa-adapter');
    expect(mod.createNoaaAdapter).toBeDefined();
    expect(typeof mod.createNoaaAdapter).toBe('function');
  });

  it('adapter has all required methods', async () => {
    const { createNoaaAdapter } = await import(
      '@/src/lib/space-weather/noaa-adapter'
    );
    const adapter = createNoaaAdapter();
    expect(adapter.version).toBe('v2');
    expect(typeof adapter.fetchKp).toBe('function');
    expect(typeof adapter.fetchF107).toBe('function');
    expect(typeof adapter.fetchXray).toBe('function');
    expect(typeof adapter.fetchProton).toBe('function');
    expect(typeof adapter.fetchKpForecast).toBe('function');
    expect(typeof adapter.fetch3DayForecast).toBe('function');
  });
});

describe('Space Weather types', () => {
  it('exports all required types', async () => {
    const mod = await import('@/src/lib/space-weather/types');
    expect(mod).toBeDefined();
  });
});
