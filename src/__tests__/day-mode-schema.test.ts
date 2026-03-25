import { describe, it, expect } from 'vitest';
import { DailyResponseSchema } from '../lib/schemas/experience';

describe('DailyResponseSchema — day_mode fields', () => {
  it('accepts a valid Day-Trace response', () => {
    const raw = {
      date: '2026-03-25',
      western: {
        summary: 'test', themes: ['a'], caution: 'c', opportunity: 'o',
        evidence: {},
      },
      eastern: {
        summary: 'test', themes: ['a'], caution: 'c', opportunity: 'o',
        evidence: {},
      },
      fusion: {
        summary: 'test', synthesis: 'syn', action: 'act',
        pushworthy: false, push_text: null,
        harmony_index: 0.62,
        day_mode: 'trace',
      },
      meta: { engine_version: '1.0' },
    };
    const result = DailyResponseSchema.safeParse(raw);
    expect(result.success).toBe(true);
    expect(result.data?.fusion.day_mode).toBe('trace');
    expect(result.data?.fusion.harmony_index).toBe(0.62);
  });

  it('accepts a valid Day-Pulse response', () => {
    const raw = {
      date: '2026-03-25',
      western: { summary: 'test', themes: ['a'], caution: 'c', opportunity: 'o', evidence: {} },
      eastern: { summary: 'test', themes: ['a'], caution: 'c', opportunity: 'o', evidence: {} },
      fusion: {
        summary: 'test', synthesis: 'syn', action: 'act',
        pushworthy: false, harmony_index: 0.38, day_mode: 'pulse',
      },
      meta: { engine_version: '1.0' },
    };
    expect(DailyResponseSchema.safeParse(raw).success).toBe(true);
  });

  it('rejects response without harmony_index', () => {
    const raw = {
      date: '2026-03-25',
      western: { summary: 'x', themes: [], caution: 'x', opportunity: 'x', evidence: {} },
      eastern: { summary: 'x', themes: [], caution: 'x', opportunity: 'x', evidence: {} },
      fusion: { summary: 'x', synthesis: 'x', action: 'x', pushworthy: false },
      meta: { engine_version: '1.0' },
    };
    expect(DailyResponseSchema.safeParse(raw).success).toBe(false);
  });
});
