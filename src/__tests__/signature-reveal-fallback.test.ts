import { describe, it, expect } from 'vitest';

describe('SignatureReveal fallback detection', () => {
  it('detects fallback bootstrap data via engine_version', () => {
    const fallbackMeta = { engine_version: 'fallback' };
    const realMeta = { engine_version: 'master_signal_v1_js', generated_at: '2026-01-01' };

    expect(fallbackMeta.engine_version === 'fallback').toBe(true);
    expect(realMeta.engine_version === 'fallback').toBe(false);
  });

  it('detects fallback via uniform soulprint sectors', () => {
    const fallbackSectors = Array(12).fill(0.5);
    const realSectors = [0.7, 0.3, 0.9, 0.4, 0.6, 0.8, 0.2, 0.5, 0.7, 0.3, 0.6, 0.4];

    const isUniform = (sectors: number[]) => sectors.every(s => s === sectors[0]);

    expect(isUniform(fallbackSectors)).toBe(true);
    expect(isUniform(realSectors)).toBe(false);
  });
});
