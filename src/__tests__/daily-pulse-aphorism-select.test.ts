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
});
