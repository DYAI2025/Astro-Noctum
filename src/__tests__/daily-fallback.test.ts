import { describe, it, expect } from 'vitest';
import { buildFallbackDaily, todayKey } from '../hooks/useFirstRunDaily';

describe('buildFallbackDaily', () => {
  it('returns a valid DailyResponse with non-empty synthesis', () => {
    const result = buildFallbackDaily('de');
    expect(result.date).toBe(todayKey());
    expect(result.fusion.synthesis).toBeTruthy();
    expect(result.fusion.synthesis.length).toBeGreaterThan(10);
    expect(result.fusion.harmony_index).toBeGreaterThanOrEqual(0.3);
    expect(result.fusion.harmony_index).toBeLessThan(0.7);
    expect(result.fusion.day_mode).toMatch(/^(pulse|trace)$/);
    expect(result.meta.engine_version).toBe('v1-local-fallback');
  });

  it('returns English text for en locale', () => {
    const result = buildFallbackDaily('en');
    // English text should not contain German characters
    expect(result.fusion.synthesis).not.toMatch(/ü|ö|ä|ß/);
  });

  it('is deterministic for the same date', () => {
    const a = buildFallbackDaily('de');
    const b = buildFallbackDaily('de');
    expect(a.fusion.harmony_index).toBe(b.fusion.harmony_index);
    expect(a.fusion.day_mode).toBe(b.fusion.day_mode);
    expect(a.fusion.synthesis).toBe(b.fusion.synthesis);
  });

  it('has consistent mode/harmony relationship', () => {
    const result = buildFallbackDaily('de');
    if (result.fusion.harmony_index >= 0.50) {
      expect(result.fusion.day_mode).toBe('trace');
    } else {
      expect(result.fusion.day_mode).toBe('pulse');
    }
  });
});
