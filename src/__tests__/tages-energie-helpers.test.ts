/**
 * Unit tests for pure helper functions in DashboardTagesEnergie.
 * No React/JSDOM — plain Vitest unit tests.
 */
import { describe, it, expect } from 'vitest';

import {
  computeResonance,
  resonanceLabel,
  resolveElement,
  toBorderColor,
} from '../components/dashboard/DashboardTagesEnergie';

// ── computeResonance ─────────────────────────────────────────────────────────

describe('computeResonance', () => {
  it('returns 0 when both inputs are 0', () => {
    expect(computeResonance(0, 0)).toBe(0);
  });

  it('returns 1 when both inputs are 1', () => {
    expect(computeResonance(1, 1)).toBe(1);
  });

  it('clamps above 1', () => {
    expect(computeResonance(2, 2)).toBe(1);
  });

  it('clamps below 0', () => {
    expect(computeResonance(-1, -1)).toBe(0);
  });

  it('applies weight 0.65 to harmony, 0.35 to solar', () => {
    expect(computeResonance(1, 0)).toBeCloseTo(0.65);
    expect(computeResonance(0, 1)).toBeCloseTo(0.35);
  });
});

// ── resonanceLabel ───────────────────────────────────────────────────────────

describe('resonanceLabel', () => {
  it('returns "verstärkt" for r > 0.7', () => {
    expect(resonanceLabel(0.71)).toContain('verstärkt');
    expect(resonanceLabel(1.0)).toContain('verstärkt');
  });

  it('returns "schwingt" for 0.5 < r ≤ 0.7', () => {
    expect(resonanceLabel(0.51)).toContain('schwingt');
    expect(resonanceLabel(0.70)).toContain('schwingt');
  });

  it('returns "Berührung" for 0.3 < r ≤ 0.5', () => {
    expect(resonanceLabel(0.31)).toContain('Berührung');
    expect(resonanceLabel(0.50)).toContain('Berührung');
  });

  it('returns "unabhängig" for r ≤ 0.3', () => {
    expect(resonanceLabel(0.30)).toContain('unabhängig');
    expect(resonanceLabel(0)).toContain('unabhängig');
  });
});

// ── resolveElement ───────────────────────────────────────────────────────────

describe('resolveElement', () => {
  it('returns null for null daily', () => {
    expect(resolveElement(null)).toBeNull();
  });

  it('maps 甲 → holz', () => {
    expect(resolveElement({ eastern: { evidence: { day_master: '甲' } } } as never)).toBe('holz');
  });

  it('maps 丙 → feuer', () => {
    expect(resolveElement({ eastern: { evidence: { day_master: '丙' } } } as never)).toBe('feuer');
  });

  it('maps 戊 → erde', () => {
    expect(resolveElement({ eastern: { evidence: { day_master: '戊' } } } as never)).toBe('erde');
  });

  it('maps 庚 → metall', () => {
    expect(resolveElement({ eastern: { evidence: { day_master: '庚' } } } as never)).toBe('metall');
  });

  it('maps 壬 → wasser', () => {
    expect(resolveElement({ eastern: { evidence: { day_master: '壬' } } } as never)).toBe('wasser');
  });

  it('maps latin "JIA" → holz (case-insensitive)', () => {
    expect(resolveElement({ eastern: { evidence: { day_master: 'JIA' } } } as never)).toBe('holz');
  });

  it('returns null for unknown stem', () => {
    expect(resolveElement({ eastern: { evidence: { day_master: 'XYZ' } } } as never)).toBeNull();
  });
});

// ── toBorderColor ────────────────────────────────────────────────────────────

describe('toBorderColor', () => {
  it('appends 22 alpha to 7-char hex', () => {
    expect(toBorderColor('#D4AF37')).toBe('#D4AF3722');
    expect(toBorderColor('#ef4444')).toBe('#ef444422');
    expect(toBorderColor('#22d3ee')).toBe('#22d3ee22');
  });

  it('returns a valid fallback (no appended 22) for rgba colors', () => {
    const result = toBorderColor('rgba(255,255,255,0.5)');
    expect(result).not.toMatch(/\)22$/);
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns a valid fallback for rgba gold color', () => {
    const result = toBorderColor('rgba(212,175,55,0.7)');
    expect(result).not.toMatch(/\)22$/);
  });
});
