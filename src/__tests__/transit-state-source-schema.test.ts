/**
 * TransitState / FusionSignalData — source marker roundtrip.
 *
 * Locks the no-placeholder-fake contract at the schema level: whenever
 * the server sends `_meta.source` it must survive Zod parsing and flow
 * into `FusionSignalData.source` unchanged. Legacy payloads without the
 * field default to `'live'` so cached responses from before this change
 * don't false-positive as fallback data.
 */
import { describe, it, expect } from 'vitest';
import {
  TransitStateSchema,
  FusionSignalDataSchema,
} from '../lib/schemas/transit-state';

function baseTransit(meta?: Record<string, unknown>) {
  return {
    ring: { sectors: new Array(12).fill(0.5) },
    soulprint: { sectors: new Array(12).fill(0.5) },
    transit_contribution: { transit_intensity: 0.5 },
    delta: { vs_30day_avg: { avg_sectors: new Array(12).fill(0.5) } },
    events: [],
    resolution: 75,
    ...(meta !== undefined ? { _meta: meta } : {}),
  };
}

describe('TransitStateSchema source marker', () => {
  it('accepts live source explicitly', () => {
    const parsed = TransitStateSchema.parse(baseTransit({ source: 'live' }));
    expect(parsed._meta?.source).toBe('live');
  });

  it('accepts fallback-profile + optional reason', () => {
    const parsed = TransitStateSchema.parse(
      baseTransit({ source: 'fallback-profile', reason: 'FuFirE 503' }),
    );
    expect(parsed._meta?.source).toBe('fallback-profile');
    expect(parsed._meta?.reason).toBe('FuFirE 503');
  });

  it('accepts fallback-neutral', () => {
    const parsed = TransitStateSchema.parse(baseTransit({ source: 'fallback-neutral' }));
    expect(parsed._meta?.source).toBe('fallback-neutral');
  });

  it('defaults legacy payloads without _meta to live', () => {
    const parsed = TransitStateSchema.parse(baseTransit());
    expect(parsed._meta?.source).toBe('live');
  });

  it('rejects unknown source values', () => {
    const result = TransitStateSchema.safeParse(baseTransit({ source: 'magic' }));
    expect(result.success).toBe(false);
  });
});

describe('FusionSignalDataSchema source field', () => {
  const base = {
    targetSignals: new Array(12).fill(0),
    baseSignals: new Array(12).fill(0.5),
    thirtyDayAvg: new Array(12).fill(0.5),
    transitIntensity: 0.5,
  };

  it('defaults source to live when omitted', () => {
    const parsed = FusionSignalDataSchema.parse(base);
    expect(parsed.source).toBe('live');
  });

  it('preserves fallback-profile + reason through the schema', () => {
    const parsed = FusionSignalDataSchema.parse({
      ...base,
      source: 'fallback-profile',
      sourceReason: 'FuFirE 503',
    });
    expect(parsed.source).toBe('fallback-profile');
    expect(parsed.sourceReason).toBe('FuFirE 503');
  });
});
