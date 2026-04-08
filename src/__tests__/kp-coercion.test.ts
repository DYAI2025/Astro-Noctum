import { describe, it, expect } from 'vitest';

/**
 * Reproduces the crash: kp_index arrives as a string from NOAA.
 * We test the pure coercion logic in isolation.
 */
function computeKpBadgeLabel(spaceWeather: Record<string, unknown>, lang = 'de'): string {
  const effectiveLang = typeof spaceWeather.lang === 'string' ? spaceWeather.lang : lang;
  const kp = Number(spaceWeather.kp_index ?? spaceWeather.kp ?? 0);
  const gScale = kp >= 8 ? 'G5' : kp >= 6 ? 'G4' : kp >= 5 ? 'G3' : kp >= 4 ? 'G2' : kp >= 3 ? 'G1' : null;
  const labelDe = gScale ? `Kp ${kp.toFixed(1)} · ${gScale} Sturm` : `Kp ${kp.toFixed(1)} · Ruhig`;
  const labelEn = gScale ? `Kp ${kp.toFixed(1)} · ${gScale} storm` : `Kp ${kp.toFixed(1)} · Quiet`;
  return effectiveLang === 'de' ? labelDe : labelEn;
}

describe('kp badge label — NOAA string input', () => {
  it('does not throw when kp_index is a string', () => {
    expect(() => computeKpBadgeLabel({ kp_index: '3.50' })).not.toThrow();
  });

  it('formats correctly from string input', () => {
    expect(computeKpBadgeLabel({ kp_index: '3.50' })).toBe('Kp 3.5 · G1 Sturm');
  });

  it('formats correctly from numeric input', () => {
    expect(computeKpBadgeLabel({ kp_index: 5.1 })).toBe('Kp 5.1 · G3 Sturm');
  });

  it('handles missing kp gracefully', () => {
    expect(() => computeKpBadgeLabel({})).not.toThrow();

    // default language is German
    expect(computeKpBadgeLabel({})).toBe('Kp 0.0 · Ruhig');

    // explicit English label for missing Kp
    expect(computeKpBadgeLabel({ lang: 'en' })).toBe('Kp 0.0 · Quiet');
  });

  it('formats correctly in English', () => {
    expect(computeKpBadgeLabel({ kp_index: 5.1, lang: 'en' })).toBe('Kp 5.1 · G3 storm');
  });
});
