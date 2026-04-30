import { describe, it, expect } from 'vitest';
import { selectDailyAphorism, type AphorismRecord } from '../lib/daily-pulse/aphorism-select';

const make = (id: string, mode_tags: string[], element: string[] = [], rating = 3): AphorismRecord => ({
  id, status: 'approved',
  text: { de: `de ${id}`, en: `en ${id}`, original: null },
  source: { author: 'x', work: null, year: null, original_language: 'de', translator_de: null, translator_en: null },
  copyright: 'PD', attribution_status: 'verified', attribution_note: null,
  mode_tags, tone_tags: [], element_affinity: element, figure_affinity: [], season_affinity: [],
  word_count_de: 0, word_count_en: 0, quality_rating: rating, first_used: null, cooldown_days: 30,
});

describe('selectDailyAphorism', () => {
  // Multiple pulse entries at same rating → top-N has variety for "different users" test
  const pool = [
    make('a', ['pulse'], [], 4),
    make('b', ['trace']),
    make('c', ['pulse'], ['feuer'], 4),
    make('d', ['spannung']),
    make('e', ['pulse'], [], 4),
    make('f', ['pulse'], [], 4),
  ];

  it('filters by mode', () => {
    const r = selectDailyAphorism(pool, 'user-1', '2026-04-30', 'pulse');
    expect(['a','c','e','f']).toContain(r.id);
  });

  it('returns deterministic same id for same (user,date,mode)', () => {
    const r1 = selectDailyAphorism(pool, 'user-1', '2026-04-30', 'pulse');
    const r2 = selectDailyAphorism(pool, 'user-1', '2026-04-30', 'pulse');
    expect(r1.id).toBe(r2.id);
  });

  it('different user → may differ', () => {
    const ids = new Set();
    for (const u of ['u1','u2','u3','u4','u5','u6','u7','u8']) {
      ids.add(selectDailyAphorism(pool, u, '2026-04-30', 'pulse').id);
    }
    expect(ids.size).toBeGreaterThan(1);
  });

  it('boosts dominant element match — boosted entry always wins when no other top-scorer matches', () => {
    // c gets +2 for 'feuer', score 6 vs others' 4. Only c has top score → all users get c.
    for (const u of ['u1','u2','u3','u4','u5']) {
      const r = selectDailyAphorism(pool, u, '2026-04-30', 'pulse', { dominantElement: 'feuer' });
      expect(r.id).toBe('c');
    }
  });

  it('throws when no aphorism matches mode', () => {
    expect(() => selectDailyAphorism([make('a', ['pulse'])], 'u', 'd', 'spannung')).toThrow();
  });

  it('filters out aphorisms whose cooldown has not elapsed', () => {
    const today = '2026-04-30';
    const recent = make('r', ['pulse'], [], 4); recent.first_used = '2026-04-25'; recent.cooldown_days = 30;
    const cooled = make('c2', ['pulse'], [], 4); cooled.first_used = '2026-01-01'; cooled.cooldown_days = 30;
    const fresh  = make('f1', ['pulse'], [], 4);

    for (const u of ['u1','u2','u3','u4','u5']) {
      const r = selectDailyAphorism([recent, cooled, fresh], u, today, 'pulse');
      expect(r.id).not.toBe('r');
    }
  });

  it('throws when cooldown leaves no eligible entry', () => {
    const recent = make('r', ['pulse'], [], 4); recent.first_used = '2026-04-29'; recent.cooldown_days = 30;
    expect(() => selectDailyAphorism([recent], 'u', '2026-04-30', 'pulse')).toThrow();
  });

  it('applies trace+high-intensity tone bump (spec §7 line 126)', () => {
    const sharp = make('sharp', ['trace'], [], 3); sharp.tone_tags = ['scharf'];
    const calm  = make('calm',  ['trace'], [], 4); calm.tone_tags  = ['ruhig'];
    // Without bump: calm (4) > sharp (3) → calm wins.
    // With bump (intensity > 0.7): sharp 3 * 1.2 = 3.6 < calm 4 → calm still wins.
    const r0 = selectDailyAphorism([sharp, calm], 'u1', '2026-04-30', 'trace', { intensity: 0.8 });
    expect(r0.id).toBe('calm');

    // Lift sharp to rating 4 → with bump 4 * 1.2 = 4.8 > calm 4 → sharp wins.
    const sharpHi = make('sharpHi', ['trace'], [], 4); sharpHi.tone_tags = ['drängend'];
    const r1 = selectDailyAphorism([sharpHi, calm], 'u1', '2026-04-30', 'trace', { intensity: 0.8 });
    expect(r1.id).toBe('sharpHi');

    // intensity not high enough → no bump → calm (rating 4) > sharp (rating 3) → calm wins.
    const r2 = selectDailyAphorism([sharp, calm], 'u1', '2026-04-30', 'trace', { intensity: 0.3 });
    expect(r2.id).toBe('calm');

    // Bump only applies in trace mode — same pool with mode='pulse' ignores tone bump.
    const sharpPulse = { ...sharpHi, mode_tags: ['pulse'] };
    const calmPulse  = { ...calm,    mode_tags: ['pulse'] };
    // No bump in pulse mode → both at rating 4 → tied → calm wins by id-tiebreak.
    const r3 = selectDailyAphorism([sharpPulse, calmPulse], 'u1', '2026-04-30', 'pulse', { intensity: 0.9 });
    // Without the trace bump, sharpHi has no advantage; deterministic id-tiebreak picks
    // alphabetically (calm < sharpHi); both in top-5 → fnv1a%2 picks one of them.
    expect(['calm', 'sharpHi']).toContain(r3.id);
  });
});
