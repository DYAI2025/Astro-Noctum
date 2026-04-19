import { describe, it, expect } from 'vitest';
import {
  baziToChladniParams,
  STEM_NAME_TO_INDEX,
  ELEMENT_COLORS,
  PLANET_FREQUENCIES,
  type WuxingElement,
} from '../lib/cymatics/bazi-to-chladni';
import { chladni, lerpParams } from '../lib/cymatics/chladni-math';

// ── helpers ─────────────────────────────────────────────────────────────────

const STEM_NAMES = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];

function makePillar(stem: string) {
  return { stem, branch: '子', animal: 'Rat', element: 'Water' };
}

const DEFAULT_WEIGHTS: Record<string, number> = {
  Wood: 0.1, Fire: 0.4, Earth: 0.1, Metal: 0.2, Water: 0.2,
};

function makeParams(yi: number, mi: number, di: number, hi: number, harmony = 0.5) {
  return baziToChladniParams(
    {
      year:  makePillar(STEM_NAMES[yi]),
      month: makePillar(STEM_NAMES[mi]),
      day:   makePillar(STEM_NAMES[di]),
      hour:  makePillar(STEM_NAMES[hi]),
    },
    DEFAULT_WEIGHTS,
    harmony,
  );
}

// ── STEM_NAME_TO_INDEX ────────────────────────────────────────────────────────

describe('STEM_NAME_TO_INDEX', () => {
  it('maps all 10 heavenly stems (both Chinese characters and Pinyin) to indices 0..9', () => {
    const PAIRS: Array<[string, string]> = [
      ['甲', 'Jia'],  ['乙', 'Yi'],   ['丙', 'Bing'], ['丁', 'Ding'], ['戊', 'Wu'],
      ['己', 'Ji'],   ['庚', 'Geng'], ['辛', 'Xin'],  ['壬', 'Ren'],  ['癸', 'Gui'],
    ];

    for (const [index, [cn, py]] of PAIRS.entries()) {
      expect(STEM_NAME_TO_INDEX).toHaveProperty(cn);
      expect(STEM_NAME_TO_INDEX).toHaveProperty(py);
      expect(STEM_NAME_TO_INDEX[cn]).toBe(index);
      expect(STEM_NAME_TO_INDEX[py]).toBe(index);
    }

    const mappedIndices = new Set(
      PAIRS.flatMap(([cn, py]) => [STEM_NAME_TO_INDEX[cn], STEM_NAME_TO_INDEX[py]]),
    );
    expect([...mappedIndices].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('maps 甲→0 and 癸→9 (Chinese characters)', () => {
    expect(STEM_NAME_TO_INDEX['甲']).toBe(0);
    expect(STEM_NAME_TO_INDEX['癸']).toBe(9);
  });

  it('maps Jia→0 and Gui→9 (Pinyin — what BAFE returns)', () => {
    expect(STEM_NAME_TO_INDEX['Jia']).toBe(0);
    expect(STEM_NAME_TO_INDEX['Gui']).toBe(9);
  });

  it('Pinyin and Chinese-char pairs agree for every stem', () => {
    const PAIRS: Array<[string, string]> = [
      ['甲', 'Jia'],  ['乙', 'Yi'],  ['丙', 'Bing'], ['丁', 'Ding'], ['戊', 'Wu'],
      ['己', 'Ji'],   ['庚', 'Geng'], ['辛', 'Xin'],  ['壬', 'Ren'],  ['癸', 'Gui'],
    ];
    for (const [cn, py] of PAIRS) {
      expect(STEM_NAME_TO_INDEX[cn]).toBe(STEM_NAME_TO_INDEX[py]);
    }
  });

  it('covers every stem name used in makeParams', () => {
    for (const name of STEM_NAMES) {
      expect(STEM_NAME_TO_INDEX[name]).toBeGreaterThanOrEqual(0);
    }
  });
});

// ── PLANET_FREQUENCIES ───────────────────────────────────────────────────────

describe('PLANET_FREQUENCIES', () => {
  it('has exactly 10 entries', () => {
    expect(PLANET_FREQUENCIES).toHaveLength(10);
  });

  it('each entry has required fields', () => {
    for (const p of PLANET_FREQUENCIES) {
      expect(typeof p.hz).toBe('number');
      expect(p.hz).toBeGreaterThan(0);
      expect(typeof p.symbol).toBe('string');
      expect(typeof p.name_de).toBe('string');
      expect(['Wood','Fire','Earth','Metal','Water']).toContain(p.wuxing_element);
    }
  });

  it('includes Sun and Moon with correct Cousto frequencies', () => {
    const sun = PLANET_FREQUENCIES.find(p => p.name === 'Sun');
    const moon = PLANET_FREQUENCIES.find(p => p.name === 'Moon');
    expect(sun?.hz).toBeCloseTo(126.22, 1);
    expect(moon?.hz).toBeCloseTo(210.42, 1);
  });
});

// ── ELEMENT_COLORS ───────────────────────────────────────────────────────────

describe('ELEMENT_COLORS', () => {
  it('has an entry for each of the 5 Wu-Xing elements', () => {
    const elements: WuxingElement[] = ['Wood','Fire','Earth','Metal','Water'];
    for (const el of elements) {
      expect(ELEMENT_COLORS[el]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});

// ── baziToChladniParams — range constraints ──────────────────────────────────

describe('baziToChladniParams — output ranges', () => {
  it('m is always in 2..6', () => {
    for (let yi = 0; yi < 10; yi++) {
      for (let mi = 0; mi < 10; mi++) {
        const { m } = makeParams(yi, mi, 3, 7);
        expect(m).toBeGreaterThanOrEqual(2);
        expect(m).toBeLessThanOrEqual(6);
      }
    }
  });

  it('n is always in 2..6', () => {
    for (let di = 0; di < 10; di++) {
      for (let hi = 0; hi < 10; hi++) {
        const { n } = makeParams(0, 0, di, hi);
        expect(n).toBeGreaterThanOrEqual(2);
        expect(n).toBeLessThanOrEqual(6);
      }
    }
  });

  it('a is in 0.3..1.0 across harmony range', () => {
    for (const harmony of [0, 0.25, 0.5, 0.75, 1]) {
      const { a } = makeParams(0, 0, 0, 0, harmony);
      expect(a).toBeGreaterThanOrEqual(0.3 - 1e-9);
      expect(a).toBeLessThanOrEqual(1.0 + 1e-9);
    }
  });

  it('b satisfies b = 1 - a*0.6 (derived range ~0.40..0.82)', () => {
    // Formula: b = 1 - a*0.6 with a ∈ [0.30, 1.00] → b ∈ [0.40, 0.82].
    // Test verifies the formula holds exactly — not the REQ prose range.
    for (const harmony of [0, 0.25, 0.5, 0.75, 1]) {
      const { a, b } = makeParams(0, 0, 0, 0, harmony);
      expect(b).toBeCloseTo(1.0 - a * 0.6, 10);
    }
  });

  it('harmonyIndex is echoed back in params', () => {
    const { harmonyIndex } = makeParams(1, 2, 3, 4, 0.73);
    expect(harmonyIndex).toBeCloseTo(0.73);
  });
});

// ── baziToChladniParams — determinism ────────────────────────────────────────

describe('baziToChladniParams — determinism', () => {
  it('same inputs always produce identical output', () => {
    const a = makeParams(3, 7, 1, 5, 0.6);
    const b = makeParams(3, 7, 1, 5, 0.6);
    expect(a).toEqual(b);
  });

  it('different stem indices produce different output', () => {
    const p1 = makeParams(0, 0, 0, 0);
    const p2 = makeParams(9, 9, 9, 9);
    // At least one of m or n must differ
    expect(p1.m !== p2.m || p1.n !== p2.n).toBe(true);
  });
});

// ── baziToChladniParams — diversity test (AC-3) ──────────────────────────────

describe('baziToChladniParams — diversity', () => {
  it('≥80% distinct m×n pairs across the full 10×10 day×hour grid', () => {
    // m is determined entirely by hi (m = 2 + (numericSig%5), and 1000/100/10 are all
    // divisible by 5 so only hi%5 matters). n varies with the full numericSig.
    // Sweeping di×hi covers all 25 (m,n) pairs — this is the correct diversity slice.
    const seen = new Set<string>();
    for (let di = 0; di < 10; di++) {
      for (let hi = 0; hi < 10; hi++) {
        const { m, n } = makeParams(0, 0, di, hi);
        seen.add(`${m}x${n}`);
      }
    }
    // Expect all 25 possible m×n pairs (5×5) to appear — 100% > required ≥80%
    expect(seen.size).toBeGreaterThanOrEqual(20);
  });

  it('Pinyin stems (as BAFE actually returns them) produce distinct (m,n) per distinct stem tuple', () => {
    // Regression guard for the 2026-04-19 bug where STEM_NAME_TO_INDEX only had
    // Chinese characters — all Pinyin lookups fell back to 0, collapsing every
    // user to (m=2, n=2) regardless of BaZi. These four tuples are real prod
    // samples (BaZidiac 2026-04-19 — see GOAL-soulprint-persistence + this fix).
    const PROD_SAMPLES: Array<[string, string, string, string]> = [
      ['Geng', 'Ren',  'Wu',  'Geng'], // 14 users in prod
      ['Ji',   'Bing', 'Bing', 'Jia'], // 8 users in prod
      ['Xin',  'Ding', 'Gui',  'Bing'], // unique user
      ['Ren',  'Jia',  'Ding', 'Geng'], // unique user
    ];
    const seen = new Set<string>();
    for (const [y, mo, d, h] of PROD_SAMPLES) {
      const { m, n } = baziToChladniParams(
        {
          year:  makePillar(y),
          month: makePillar(mo),
          day:   makePillar(d),
          hour:  makePillar(h),
        },
        DEFAULT_WEIGHTS,
        0.5,
      );
      seen.add(`${m}x${n}`);
    }
    // Four distinct stem tuples must produce at least 3 distinct (m,n) pairs.
    // (Before the fix, all four produced (2,2).)
    expect(seen.size).toBeGreaterThanOrEqual(3);
  });

  it('missing/unknown stem names fall back to index 0 (degenerate data, not crash)', () => {
    const { m, n } = baziToChladniParams(
      {
        year:  makePillar('???'),
        month: makePillar(''),
        day:   makePillar('not-a-stem'),
        hour:  makePillar('undefined'),
      },
      DEFAULT_WEIGHTS,
      0.5,
    );
    // numericSig = 0 → m=2, n=2 — this is the documented degenerate output.
    expect(m).toBe(2);
    expect(n).toBe(2);
  });
});

// ── baziToChladniParams — dominant element ───────────────────────────────────

describe('baziToChladniParams — dominant element', () => {
  it('returns the element with highest weight', () => {
    const pillars = {
      year:  makePillar('甲'),
      month: makePillar('乙'),
      day:   makePillar('丙'),
      hour:  makePillar('丁'),
    };
    const { dominantElement } = baziToChladniParams(
      pillars,
      { Wood: 0.05, Fire: 0.60, Earth: 0.10, Metal: 0.15, Water: 0.10 },
      0.5,
    );
    expect(dominantElement).toBe('Fire');
  });

  it('falls back to Water when weights are empty', () => {
    const pillars = {
      year:  makePillar('甲'),
      month: makePillar('乙'),
      day:   makePillar('丙'),
      hour:  makePillar('丁'),
    };
    const { dominantElement } = baziToChladniParams(pillars, {}, 0.5);
    expect(dominantElement).toBe('Water');
  });
});

// ── baziToChladniParams — unknown stem fallback ──────────────────────────────

describe('baziToChladniParams — unknown stem graceful fallback', () => {
  it('uses index 0 for unknown stem characters without throwing', () => {
    const result = baziToChladniParams(
      {
        year:  makePillar('?'),
        month: makePillar('?'),
        day:   makePillar('?'),
        hour:  makePillar('?'),
      },
      DEFAULT_WEIGHTS,
      0.5,
    );
    expect(result.m).toBeGreaterThanOrEqual(2);
    expect(result.n).toBeGreaterThanOrEqual(2);
  });
});

// ── chladni() math ────────────────────────────────────────────────────────────

describe('chladni()', () => {
  it('returns 0 at corners (nodal intersection for most m,n)', () => {
    // f(0, 0) = a*sin(0)*... + b*sin(0)*... = 0 always
    expect(chladni(0, 0, 0.6, 0.4, 3, 4)).toBeCloseTo(0);
  });

  it('produces distinct values at different points', () => {
    const a = 0.6, b = 0.4, m = 3, n = 4;
    const v1 = chladni(0.3, 0.3, a, b, m, n);
    const v2 = chladni(0.7, 0.7, a, b, m, n);
    // Different sample points must not always give the same value
    expect(Math.abs(v1 - v2)).toBeGreaterThan(1e-6);
  });

  it('output magnitude is bounded by |a| + |b|', () => {
    const a = 0.7, b = 0.3;
    for (let x = 0.1; x <= 0.9; x += 0.2) {
      for (let y = 0.1; y <= 0.9; y += 0.2) {
        const v = chladni(x, y, a, b, 4, 3);
        expect(Math.abs(v)).toBeLessThanOrEqual(a + b + 1e-9);
      }
    }
  });
});

// ── lerpParams() ─────────────────────────────────────────────────────────────

describe('lerpParams()', () => {
  const from = makeParams(0, 0, 0, 0, 0.2);
  const to   = makeParams(9, 9, 9, 9, 0.8);

  it('at t=0 returns from', () => {
    const result = lerpParams(from, to, 0);
    expect(result.a).toBeCloseTo(from.a);
    expect(result.b).toBeCloseTo(from.b);
    expect(result.m).toBe(from.m);
    expect(result.n).toBe(from.n);
  });

  it('at t=1 returns to', () => {
    const result = lerpParams(from, to, 1);
    expect(result.a).toBeCloseTo(to.a);
    expect(result.b).toBeCloseTo(to.b);
    expect(result.m).toBe(to.m);
    expect(result.n).toBe(to.n);
  });

  it('a and b interpolate continuously', () => {
    const mid = lerpParams(from, to, 0.5);
    expect(mid.a).toBeCloseTo((from.a + to.a) / 2);
    expect(mid.b).toBeCloseTo((from.b + to.b) / 2);
  });

  it('m and n snap at t=0.5 (discrete)', () => {
    const justBelow = lerpParams(from, to, 0.49);
    const justAbove = lerpParams(from, to, 0.51);
    expect(justBelow.m).toBe(from.m);
    expect(justAbove.m).toBe(to.m);
  });

  it('clamps t outside [0,1]', () => {
    const below = lerpParams(from, to, -1);
    const above = lerpParams(from, to, 2);
    expect(below.a).toBeCloseTo(from.a);
    expect(above.a).toBeCloseTo(to.a);
  });
});
