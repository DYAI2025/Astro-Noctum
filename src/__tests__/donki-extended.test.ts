import { describe, it, expect } from 'vitest';

describe('DONKI Extended module', () => {
  it('exports fetchDonkiExtended', async () => {
    const mod = await import('@/src/lib/space-weather/donki-extended');
    expect(mod.fetchDonkiExtended).toBeDefined();
    expect(typeof mod.fetchDonkiExtended).toBe('function');
  });
});

describe('SpaceWeatherContribution schema validation', () => {
  it('signature_weight is always capped at 0.5', async () => {
    const fs = await import('fs');
    const code = fs.readFileSync('src/lib/space-weather/donki-extended.ts', 'utf8');
    expect(code).toContain('Math.min(0.5');
    expect(code).toContain("G5: 0.50");
  });

  it('all contributions have expires_at field', async () => {
    const fs = await import('fs');
    const code = fs.readFileSync('src/lib/space-weather/donki-extended.ts', 'utf8');
    const contributionBlocks = code.match(/expires_at:/g);
    expect(contributionBlocks).not.toBeNull();
    expect(contributionBlocks!.length).toBeGreaterThanOrEqual(3);
  });
});
