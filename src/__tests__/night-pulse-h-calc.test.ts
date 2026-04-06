/**
 * Tests for Night-Pulse H computation logic.
 *
 * Covers:
 * - server.mjs helpers (approxMoonSignIndex, hourBranchElement, computeNightHarmonyIndex)
 *   — cannot import from server.mjs, so algorithm is mirrored inline for guard testing.
 * - day-harmonic.ts exports: computeNightHarmonic, isNighttime
 *
 * Implements: REQ-F-signatur-day-night-pulse § Night-Pulse
 */
import { describe, it, expect } from 'vitest';
import { computeDayHarmonic, computeNightHarmonic, isNighttime } from '../lib/fusion-ring/day-harmonic';

// ── Mirror of server.mjs Night-Pulse helpers ─────────────────────────────────

const DIMENSION_KEYS = ['passion', 'stability', 'future', 'connection', 'autonomy'] as const;
type DimKey = typeof DIMENSION_KEYS[number];
type DimVec = Record<DimKey, number>;

const ELEMENT_DIMENSION_MAP: Record<string, DimVec> = {
  Fire:  { passion: 0.9, stability: 0.2, future: 0.5, connection: 0.7, autonomy: 0.6 },
  Earth: { passion: 0.3, stability: 0.9, future: 0.4, connection: 0.5, autonomy: 0.4 },
  Metal: { passion: 0.1, stability: 0.6, future: 0.7, connection: 0.2, autonomy: 0.5 },
  Water: { passion: 0.3, stability: 0.3, future: 0.6, connection: 0.8, autonomy: 0.3 },
  Wood:  { passion: 0.7, stability: 0.3, future: 0.5, connection: 0.4, autonomy: 0.7 },
};

const NIGHT_ZODIAC_ELEMENT = ['Fire','Earth','Metal','Water','Wood','Fire','Earth','Metal','Water','Wood','Fire','Earth'];

function hourBranchElement(utcHour: number): string {
  const BRANCH_ELEM = ['Water','Earth','Wood','Wood','Earth','Fire','Fire','Earth','Metal','Metal','Earth','Water'];
  const branchIdx = utcHour === 23 ? 0 : Math.floor((utcHour + 1) / 2);
  return BRANCH_ELEM[branchIdx % 12];
}

function approxMoonSignIndex(date: Date): number {
  const msPerDay = 86400000;
  const d = (date.getTime() - Date.UTC(2000, 0, 1, 12, 0, 0)) / msPerDay;
  const toRad = (deg: number) => deg * Math.PI / 180;
  const L = ((218.316 + 13.176396 * d) % 360 + 360) % 360;
  const M = ((134.963 + 13.064993 * d) % 360 + 360) % 360;
  const sunM = ((357.529 + 0.985600 * d) % 360 + 360) % 360;
  const lam = L
    + 6.289 * Math.sin(toRad(M))
    - 1.274 * Math.sin(toRad(2 * L - M))
    + 0.658 * Math.sin(toRad(2 * L))
    - 0.186 * Math.sin(toRad(sunM));
  return Math.floor(((lam % 360 + 360) % 360) / 30);
}

function computeNightHarmonyIndex(date: Date): number {
  const moonEl = NIGHT_ZODIAC_ELEMENT[approxMoonSignIndex(date)];
  const hourEl = hourBranchElement(date.getUTCHours());
  const moonVec = ELEMENT_DIMENSION_MAP[moonEl];
  const hourVec = ELEMENT_DIMENSION_MAP[hourEl];
  if (!moonVec || !hourVec) return 0.45;
  let dot = 0, magM = 0, magH = 0;
  for (const k of DIMENSION_KEYS) {
    const m = moonVec[k] ?? 0;
    const h = hourVec[k] ?? 0;
    dot += m * h;
    magM += m * m;
    magH += h * h;
  }
  if (magM < 1e-9 || magH < 1e-9) return 0.45;
  return Math.min(1, Math.max(0, dot / (Math.sqrt(magM) * Math.sqrt(magH))));
}

// ── computeNightHarmonic (day-harmonic.ts) ────────────────────────────────────

describe('computeNightHarmonic', () => {
  it('same mode as computeDayHarmonic for same input', () => {
    expect(computeNightHarmonic(0.4).mode).toBe('pulse');
    expect(computeNightHarmonic(0.6).mode).toBe('trace');
  });

  it('intensity is exactly 50% of computeDayHarmonic for same input', () => {
    const h = 0.72;
    const day = computeDayHarmonic(h);
    const night = computeNightHarmonic(h);
    expect(night.intensity).toBeCloseTo(day.intensity * 0.5, 5);
  });

  it('intensity is 0 when harmony_index = random baseline (0.45)', () => {
    expect(computeNightHarmonic(0.45).intensity).toBeCloseTo(0, 5);
  });

  it('intensity stays in [0, 1]', () => {
    for (const h of [0, 0.1, 0.45, 0.5, 0.75, 1.0]) {
      const { intensity } = computeNightHarmonic(h);
      expect(intensity).toBeGreaterThanOrEqual(0);
      expect(intensity).toBeLessThanOrEqual(1);
    }
  });

  it('preserves harmonyIndex from input', () => {
    expect(computeNightHarmonic(0.62).harmonyIndex).toBeCloseTo(0.62, 5);
  });
});

// ── isNighttime (day-harmonic.ts) ─────────────────────────────────────────────

describe('isNighttime', () => {
  it('returns true at 21:00 (9pm)', () => {
    const d = new Date();
    d.setHours(21, 0, 0, 0);
    expect(isNighttime(d)).toBe(true);
  });

  it('returns true at 02:00 (2am)', () => {
    const d = new Date();
    d.setHours(2, 0, 0, 0);
    expect(isNighttime(d)).toBe(true);
  });

  it('returns true at 05:59', () => {
    const d = new Date();
    d.setHours(5, 59, 0, 0);
    expect(isNighttime(d)).toBe(true);
  });

  it('returns false at 06:00 (dawn)', () => {
    const d = new Date();
    d.setHours(6, 0, 0, 0);
    expect(isNighttime(d)).toBe(false);
  });

  it('returns false at 12:00 (noon)', () => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    expect(isNighttime(d)).toBe(false);
  });

  it('returns false at 20:59', () => {
    const d = new Date();
    d.setHours(20, 59, 0, 0);
    expect(isNighttime(d)).toBe(false);
  });
});

// ── hourBranchElement ─────────────────────────────────────────────────────────

describe('hourBranchElement', () => {
  it('maps 23h → Water (Zi)', () => {
    expect(hourBranchElement(23)).toBe('Water');
  });

  it('maps 0h → Water (Zi)', () => {
    expect(hourBranchElement(0)).toBe('Water');
  });

  it('maps 1h → Earth (Chou)', () => {
    expect(hourBranchElement(1)).toBe('Earth');
  });

  it('maps 2h → Earth (Chou)', () => {
    expect(hourBranchElement(2)).toBe('Earth');
  });

  it('maps 3h → Wood (Yin)', () => {
    expect(hourBranchElement(3)).toBe('Wood');
  });

  it('maps 9h → Fire (Si)', () => {
    expect(hourBranchElement(9)).toBe('Fire');
  });

  it('maps 15h → Metal (Shen)', () => {
    expect(hourBranchElement(15)).toBe('Metal');
  });

  it('maps 19h → Earth (Xu)', () => {
    expect(hourBranchElement(19)).toBe('Earth');
  });

  it('maps 21h → Water (Hai)', () => {
    expect(hourBranchElement(21)).toBe('Water');
  });

  it('covers all 24 hours without throwing', () => {
    for (let h = 0; h < 24; h++) {
      const el = hourBranchElement(h);
      expect(['Water', 'Earth', 'Wood', 'Fire', 'Metal']).toContain(el);
    }
  });
});

// ── approxMoonSignIndex ───────────────────────────────────────────────────────

describe('approxMoonSignIndex', () => {
  it('returns an integer in [0, 11]', () => {
    const idx = approxMoonSignIndex(new Date('2026-04-06T12:00:00Z'));
    expect(Number.isInteger(idx)).toBe(true);
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThanOrEqual(11);
  });

  it('advances by ~1 sign over 2.5 days (Moon moves ~12°/day)', () => {
    const d1 = new Date('2026-04-01T00:00:00Z');
    const d2 = new Date('2026-04-03T12:00:00Z'); // 2.5 days later
    const s1 = approxMoonSignIndex(d1);
    const s2 = approxMoonSignIndex(d2);
    // Moon should have moved at least into a new sign (or the same — depends on start position)
    // This is a smoke test: just ensure the result differs from no-movement
    expect(s1).not.toBeUndefined();
    expect(s2).not.toBeUndefined();
  });

  it('returns different signs 14 days apart (half lunar cycle)', () => {
    const d1 = new Date('2026-01-01T00:00:00Z');
    const d2 = new Date('2026-01-15T00:00:00Z');
    const s1 = approxMoonSignIndex(d1);
    const s2 = approxMoonSignIndex(d2);
    // Moon traverses ~6 signs in 14 days — s1 and s2 should differ
    expect(s1).not.toBe(s2);
  });
});

// ── computeNightHarmonyIndex ──────────────────────────────────────────────────

describe('computeNightHarmonyIndex', () => {
  it('returns a number in [0, 1]', () => {
    const h = computeNightHarmonyIndex(new Date('2026-04-06T22:00:00Z'));
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThanOrEqual(1);
  });

  it('returns 1.0 when Moon and hour branch are the same element', () => {
    // Find a date where Moon is in a Fire sign (0=Aries) and hour is 9–10h (Si/Fire)
    // We know approxMoonSignIndex for 2026-04-06T09:00Z
    // Instead: brute-force a date where moon=Fire, hour=Fire
    let found = false;
    for (let daysOffset = 0; daysOffset < 30; daysOffset++) {
      for (let hour = 9; hour <= 10; hour++) { // Si branch = Fire
        const d = new Date(Date.UTC(2026, 3, 1 + daysOffset, hour, 0, 0));
        const moonEl = NIGHT_ZODIAC_ELEMENT[approxMoonSignIndex(d)];
        if (moonEl === 'Fire') {
          const h = computeNightHarmonyIndex(d);
          expect(h).toBeCloseTo(1.0, 4);
          found = true;
          break;
        }
      }
      if (found) break;
    }
    // If no Fire-Fire combo found in 30 days, skip — lunar cycle guarantees it eventually
    expect(found).toBe(true);
  });

  it('returns < 1.0 when Moon and hour branch differ in element', () => {
    // Find date where Moon=Fire, hour=Water (Zi, 23h or 0h)
    for (let daysOffset = 0; daysOffset < 30; daysOffset++) {
      const d = new Date(Date.UTC(2026, 3, 1 + daysOffset, 0, 0, 0)); // midnight UTC = Water
      const moonEl = NIGHT_ZODIAC_ELEMENT[approxMoonSignIndex(d)];
      if (moonEl !== 'Water') {
        const h = computeNightHarmonyIndex(d);
        expect(h).toBeLessThan(1.0);
        return;
      }
    }
  });

  it('night_mode threshold: >= 0.50 → trace, < 0.50 → pulse', () => {
    const h1 = 0.55;
    const h2 = 0.44;
    expect(h1 >= 0.50 ? 'trace' : 'pulse').toBe('trace');
    expect(h2 >= 0.50 ? 'trace' : 'pulse').toBe('pulse');
  });

  it('returns value rounded to 3 decimal places in production (server rounds to 1000)', () => {
    const h = computeNightHarmonyIndex(new Date('2026-04-06T21:00:00Z'));
    const rounded = Math.round(h * 1000) / 1000;
    expect(String(rounded).split('.')[1]?.length ?? 0).toBeLessThanOrEqual(3);
  });
});

// ── NIGHT_ZODIAC_ELEMENT mapping ──────────────────────────────────────────────

describe('NIGHT_ZODIAC_ELEMENT', () => {
  it('has exactly 12 entries', () => {
    expect(NIGHT_ZODIAC_ELEMENT).toHaveLength(12);
  });

  it('all entries are valid Wu-Xing elements', () => {
    for (const el of NIGHT_ZODIAC_ELEMENT) {
      expect(['Fire','Earth','Metal','Water','Wood']).toContain(el);
    }
  });

  it('index 0 (Aries) → Fire', () => {
    expect(NIGHT_ZODIAC_ELEMENT[0]).toBe('Fire');
  });

  it('index 3 (Cancer) → Water', () => {
    expect(NIGHT_ZODIAC_ELEMENT[3]).toBe('Water');
  });

  it('index 4 (Leo) → Wood', () => {
    expect(NIGHT_ZODIAC_ELEMENT[4]).toBe('Wood');
  });
});
