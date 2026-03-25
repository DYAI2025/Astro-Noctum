import { describe, it, expect } from 'vitest';
import { BootstrapResponseSchema, SignatureDeltaResponseSchema, DailyResponseSchema } from '../lib/schemas/experience';

describe('Experience API Schemas', () => {
  it('validates bootstrap response', () => {
    const data = {
      profile: { sun_sign: 'Loewe', moon_sign: 'Waage', ascendant_sign: 'Jungfrau', day_master: 'Xin', harmony_index: 0.78 },
      soulprint_sectors: [0.08, 0.02, 0.07, 0.10, 0.14, 0.12, 0.09, 0.05, 0.11, 0.10, 0.07, 0.05],
      narratives: { core_summary: 'Core', context_summary: 'Context', integration_summary: 'Integration' },
      signature_blueprint: { seed: 'sig_v1_test', visual: { symmetry: 0.76, curvature: 0.43, angularity: 0.58, density: 0.61, contrast: 0.47, orbit_count: 3 }, elements: { Holz: 0.22, Feuer: 0.28, Erde: 0.19, Metall: 0.16, Wasser: 0.15 } },
      meta: { engine_version: '1.0.0' }
    };
    expect(BootstrapResponseSchema.safeParse(data).success).toBe(true);
  });

  it('rejects bootstrap with wrong sector count', () => {
    const data = {
      profile: { sun_sign: 'Loewe', moon_sign: 'Waage', ascendant_sign: 'Jungfrau', day_master: 'Xin', harmony_index: 0.78 },
      soulprint_sectors: [0.08, 0.02],  // only 2 instead of 12
      signature_blueprint: { seed: 'sig_v1_test' },
      meta: { engine_version: '1.0.0' }
    };
    expect(BootstrapResponseSchema.safeParse(data).success).toBe(false);
  });

  it('validates signature delta response', () => {
    const data = {
      quiz_sectors: Array(12).fill(0.083),
      narratives: { core_summary: 'Core', context_summary: 'Context', integration_summary: 'Integration' },
      signature_delta: { curvature: 0.08, contrast: 0.11, density: -0.04 },
      signature_blueprint: { seed: 'sig_v1_test', visual: { symmetry: 0.76, curvature: 0.51, angularity: 0.58, density: 0.57, contrast: 0.58, orbit_count: 3 } },
    };
    expect(SignatureDeltaResponseSchema.safeParse(data).success).toBe(true);
  });

  it('validates daily response', () => {
    const data = {
      date: '2026-03-16',
      western: { summary: 'test', themes: ['Ausdruck'], caution: 'test', opportunity: 'test', evidence: { transit_sectors: [4, 8], natal_focus: ['sun'] } },
      eastern: { summary: 'test', themes: ['Disziplin'], caution: 'test', opportunity: 'test', evidence: { day_master: 'Xin', daily_pillar: { stem: 'Bing', branch: 'Wu' }, relation_to_day_master: 'power' } },
      fusion: { summary: 'test', synthesis: 'test', action: 'test', pushworthy: false, harmony_index: 0.52, day_mode: 'trace' },
      meta: { engine_version: '1.0.0', generated_at: '2026-03-16T06:00:00Z' }
    };
    expect(DailyResponseSchema.safeParse(data).success).toBe(true);
  });

  it('validates daily response with null push_text', () => {
    const data = {
      date: '2026-03-16',
      western: { summary: 'test', themes: ['Ausdruck'], caution: 'test', opportunity: 'test', evidence: {} },
      eastern: { summary: 'test', themes: ['Disziplin'], caution: 'test', opportunity: 'test', evidence: {} },
      fusion: { summary: 'test', synthesis: 'test', action: 'test', pushworthy: true, push_text: 'Push it', harmony_index: 0.43, day_mode: 'pulse' },
      meta: { engine_version: '1.0.0' }
    };
    expect(DailyResponseSchema.safeParse(data).success).toBe(true);
  });
});
