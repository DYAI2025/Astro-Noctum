/**
 * Tests for the chladniParams derivation pattern used in SignaturPage.
 *
 * SignaturPage derives ChladniParams via:
 *   baziToChladniParams(pillars, wuxingWeights, harmonyIndex)
 *
 * where:
 *   - pillars comes from apiData.bazi.pillars (undefined when no birth data)
 *   - wuxingWeights from apiData.wuxing.elements
 *   - harmonyIndex from apiData.wuxing['harmony_index'] ?? 0.5 (not a typed field)
 *
 * These tests verify the guard conditions and fallback behavior that the
 * SignaturPage useMemo relies on — without mounting the full page component.
 */
import { describe, it, expect } from 'vitest';
import { baziToChladniParams } from '../lib/cymatics/bazi-to-chladni';

const PILLARS = {
  year:  { stem: '甲', branch: '子', animal: 'Rat',    element: 'Water' },
  month: { stem: '丙', branch: '午', animal: 'Horse',  element: 'Fire'  },
  day:   { stem: '壬', branch: '申', animal: 'Monkey', element: 'Metal' },
  hour:  { stem: '癸', branch: '亥', animal: 'Pig',    element: 'Water' },
};
const WEIGHTS = { Wood: 0.1, Fire: 0.3, Earth: 0.2, Metal: 0.2, Water: 0.2 };

// ── Guard: undefined propagation ─────────────────────────────────────────────

describe('SignaturPage chladniParams guard conditions', () => {
  it('returns undefined when pillars is falsy', () => {
    // Mirrors the guard: if (!pillars || !wuxingWeights) return undefined
    const pillars = undefined;
    const result = pillars ? baziToChladniParams(pillars, WEIGHTS, 0.5) : undefined;
    expect(result).toBeUndefined();
  });

  it('returns undefined when wuxingWeights is falsy', () => {
    const wuxingWeights = undefined;
    const result = wuxingWeights ? baziToChladniParams(PILLARS, wuxingWeights, 0.5) : undefined;
    expect(result).toBeUndefined();
  });

  it('returns ChladniParams when both pillars and weights are present', () => {
    const result = baziToChladniParams(PILLARS, WEIGHTS, 0.5);
    expect(result).toBeDefined();
    expect(result.m).toBeGreaterThanOrEqual(2);
    expect(result.n).toBeGreaterThanOrEqual(2);
  });
});

// ── harmony_index extraction ──────────────────────────────────────────────────

describe('SignaturPage harmony_index extraction', () => {
  /** Mirrors: const rawHarmony = apiData?.wuxing?.['harmony_index'];
   *            const harmonyIndex = Number.isFinite(rawHarmony as number) ? ... : 0.5; */
  function extractHarmony(wuxing: Record<string, unknown>): number {
    const raw = wuxing['harmony_index'];
    return Number.isFinite(raw as number) ? (raw as number) : 0.5;
  }

  it('uses 0.5 when wuxing has no harmony_index field', () => {
    expect(extractHarmony({ elements: WEIGHTS, dominant_element: 'Fire' })).toBe(0.5);
  });

  it('uses harmony_index when present as a number', () => {
    expect(extractHarmony({ harmony_index: 0.8 })).toBe(0.8);
  });

  it('falls back to 0.5 when harmony_index is non-numeric', () => {
    expect(extractHarmony({ harmony_index: 'high' })).toBe(0.5);
    expect(extractHarmony({ harmony_index: null })).toBe(0.5);
  });

  it('falls back to 0.5 when harmony_index is NaN (typeof NaN === "number")', () => {
    expect(extractHarmony({ harmony_index: NaN })).toBe(0.5);
  });

  it('derived params differ with different harmony_index values', () => {
    const p1 = baziToChladniParams(PILLARS, WEIGHTS, 0.2);
    const p2 = baziToChladniParams(PILLARS, WEIGHTS, 0.8);
    // a and b must differ — harmonyIndex directly sets a = 0.3 + harmony*0.7
    expect(p1.a).not.toBeCloseTo(p2.a);
    expect(p1.b).not.toBeCloseTo(p2.b);
    // harmonyIndex echoed back
    expect(p1.harmonyIndex).toBeCloseTo(0.2);
    expect(p2.harmonyIndex).toBeCloseTo(0.8);
  });
});

// ── Determinism: same apiData → same chladniParams ───────────────────────────

describe('SignaturPage chladniParams determinism', () => {
  it('produces identical params on repeated calls with same inputs', () => {
    const a = baziToChladniParams(PILLARS, WEIGHTS, 0.5);
    const b = baziToChladniParams(PILLARS, WEIGHTS, 0.5);
    expect(a).toEqual(b);
  });

  it('dominant element matches the highest wuxing weight', () => {
    const { dominantElement } = baziToChladniParams(
      PILLARS,
      { Wood: 0.05, Fire: 0.60, Earth: 0.10, Metal: 0.15, Water: 0.10 },
      0.5,
    );
    expect(dominantElement).toBe('Fire');
  });
});
