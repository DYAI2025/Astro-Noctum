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

  it('boost lifts a low-rank entry into top-5 (spec §7 line 128)', () => {
    // 6 pulse-eligible entries, all rating 4. Without boost, deterministic id-tiebreak
    // sort gives [a1, a2, a3, a4, a5, z]; top-5 = [a1..a5]; 'z' is never selected.
    // With dominantElement='feuer' boost, 'z' jumps to score 6 (top), bumping a5 out
    // of top-5 → 'z' is now selected for ~1/5 of users.
    const bigPool = [
      make('a1', ['pulse'], [], 4),
      make('a2', ['pulse'], [], 4),
      make('a3', ['pulse'], [], 4),
      make('a4', ['pulse'], [], 4),
      make('a5', ['pulse'], [], 4),
      make('z',  ['pulse'], ['feuer'], 4),
    ];

    const seenWithoutBoost = new Set<string>();
    for (let i = 0; i < 50; i++) {
      seenWithoutBoost.add(selectDailyAphorism(bigPool, `u${i}`, '2026-04-30', 'pulse').id);
    }
    expect(seenWithoutBoost.has('z')).toBe(false);

    const seenWithBoost = new Set<string>();
    for (let i = 0; i < 50; i++) {
      seenWithBoost.add(selectDailyAphorism(bigPool, `u${i}`, '2026-04-30', 'pulse', { dominantElement: 'feuer' }).id);
    }
    expect(seenWithBoost.has('z')).toBe(true);
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
    // 'zSharp' is alphabetically last, rating 4, tone='scharf'. Five filler entries
    // 'a1..a5' all rating 4 with no scharf/drängend tone. With top-5 selection +
    // id-tiebreak, zSharp is never in top-5 normally. The bump (4 * 1.2 = 4.8)
    // jumps zSharp to rank 1 → it now appears in top-5 sometimes.
    const zSharp = make('zSharp', ['trace'], [], 4); zSharp.tone_tags = ['scharf'];
    const fillers = ['a1','a2','a3','a4','a5'].map(id => make(id, ['trace'], [], 4));
    const tracePool = [...fillers, zSharp];

    // Without bump: zSharp out of top-5 across many users.
    const noBump = new Set<string>();
    for (let i = 0; i < 50; i++) {
      noBump.add(selectDailyAphorism(tracePool, `u${i}`, '2026-04-30', 'trace', { intensity: 0.3 }).id);
    }
    expect(noBump.has('zSharp')).toBe(false);

    // With bump (trace + intensity > 0.7 + scharf tone): zSharp lifted into top-5.
    const withBump = new Set<string>();
    for (let i = 0; i < 50; i++) {
      withBump.add(selectDailyAphorism(tracePool, `u${i}`, '2026-04-30', 'trace', { intensity: 0.8 }).id);
    }
    expect(withBump.has('zSharp')).toBe(true);

    // Bump applies only in trace mode — same scenario in pulse mode → no bump → zSharp out.
    const pulsePool = tracePool.map(a => ({ ...a, mode_tags: ['pulse'] }));
    const pulseHigh = new Set<string>();
    for (let i = 0; i < 50; i++) {
      pulseHigh.add(selectDailyAphorism(pulsePool, `u${i}`, '2026-04-30', 'pulse', { intensity: 0.9 }).id);
    }
    expect(pulseHigh.has('zSharp')).toBe(false);

    // Also accept 'draengend' (ASCII transliteration in spec).
    const zDraeng = { ...zSharp, id: 'zDraeng', tone_tags: ['draengend'] };
    const traceAscii = [...fillers, zDraeng];
    const asciiBump = new Set<string>();
    for (let i = 0; i < 50; i++) {
      asciiBump.add(selectDailyAphorism(traceAscii, `u${i}`, '2026-04-30', 'trace', { intensity: 0.8 }).id);
    }
    expect(asciiBump.has('zDraeng')).toBe(true);
  });
});
