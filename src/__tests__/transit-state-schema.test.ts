import { describe, expect, it } from 'vitest';
import { TransitStateSchema, FusionSignalDataSchema } from '@/src/lib/schemas/transit-state';

describe('TransitStateSchema', () => {
  it('parses valid payload', () => {
    const valid = {
      ring: { sectors: Array(12).fill(0.4) },
      soulprint: { sectors: Array(12).fill(0.3) },
      transit_contribution: { transit_intensity: 0.7 },
      delta: { vs_30day_avg: { avg_sectors: Array(12).fill(0.35) } },
      events: [
        {
          id: 'evt-1',
          type: 'resonance_jump',
          sector: 4,
          delta: 0.22,
          trigger_planet: 'Sun',
          trigger_symbol: '☉',
          sector_domain: 'Power',
        },
      ],
      resolution: 72,
    };

    const parsed = TransitStateSchema.parse(valid);
    expect(parsed.ring.sectors).toHaveLength(12);
    expect(parsed.events[0].sector).toBe(4);
  });

  it('rejects malformed payload', () => {
    const malformed = {
      ring: { sectors: [0.1, 0.2] },
      soulprint: { sectors: Array(12).fill(0.3) },
      transit_contribution: { transit_intensity: 0.7 },
      delta: { vs_30day_avg: { avg_sectors: Array(12).fill(0.35) } },
      events: [],
    };

    const result = TransitStateSchema.safeParse(malformed);
    expect(result.success).toBe(false);
  });
});

describe('FusionSignalDataSchema', () => {
  it('accepts normalized arrays', () => {
    const payload = {
      targetSignals: Array(12).fill(0.1),
      baseSignals: Array(12).fill(0.4),
      thirtyDayAvg: Array(12).fill(0.35),
      transitIntensity: 0.8,
    };

    expect(FusionSignalDataSchema.parse(payload).targetSignals).toHaveLength(12);
  });
});
