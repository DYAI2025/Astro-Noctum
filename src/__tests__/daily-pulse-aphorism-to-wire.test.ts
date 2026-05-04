import { describe, it, expect, vi } from 'vitest';
import { aphorismToWire } from '../lib/daily-pulse/aphorism-to-wire';
import { PulseAphorismSchema } from '../lib/schemas/daily-pulse';
import type { AphorismRecord } from '../lib/daily-pulse/aphorism-select';

const base: AphorismRecord = {
  id: 'aph-1', status: 'approved',
  text: { de: 'de text', en: 'en text', original: null },
  source: { author: 'Goethe', work: 'Faust', year: 1808, original_language: 'de', translator_de: null, translator_en: 'X' },
  copyright: 'PD', attribution_status: 'verified', attribution_note: null,
  mode_tags: ['pulse'], tone_tags: ['ruhig'], element_affinity: ['wasser'],
  figure_affinity: ['day_master'], season_affinity: ['fruehling'],
  word_count_de: 5, word_count_en: 5, quality_rating: 4, first_used: null, cooldown_days: 30,
};

describe('aphorismToWire', () => {
  it('flattens text/source into wire shape', () => {
    const wire = aphorismToWire(base);
    expect(wire).toMatchObject({
      id: 'aph-1', text_de: 'de text', text_en: 'en text',
      author: 'Goethe', work: 'Faust', copyright: 'PD',
      attribution_status: 'verified',
    });
  });

  it('preserves valid figure_affinity entries', () => {
    expect(aphorismToWire(base).figure_affinity).toEqual(['day_master']);
  });

  it('drops unknown figure_affinity values silently and warns', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const r = aphorismToWire({ ...base, figure_affinity: ['day_master', 'made_up_key'] as any });
    expect(r.figure_affinity).toEqual(['day_master']);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('made_up_key'));
    warn.mockRestore();
  });

  it('drops unknown mode_tags', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const r = aphorismToWire({ ...base, mode_tags: ['pulse', 'wibble'] as any });
    expect(r.mode_tags).toEqual(['pulse']);
    warn.mockRestore();
  });

  it('passes Zod PulseAphorismSchema validation', () => {
    const wire = aphorismToWire(base);
    expect(() => PulseAphorismSchema.parse(wire)).not.toThrow();
  });

  it('preserves null work field', () => {
    const wire = aphorismToWire({ ...base, source: { ...base.source, work: null } });
    expect(wire.work).toBeNull();
  });
});
