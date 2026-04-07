import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * BUG-23 regression guard.
 * Ensures no CSS rule forces pointer-events:none on ElevenLabs SDK body-level overlays.
 * If this test fails, the ElevenLabs call UI will be non-interactive again.
 */
describe('BUG-23 regression — ElevenLabs overlay pointer-events', () => {
  const css = readFileSync(resolve(__dirname, '../index.css'), 'utf-8');

  it('body-level convai selector must not declare pointer-events:none', () => {
    // The broken rule: body > div[class*="convai"] { pointer-events: none !important }
    // This matches ElevenLabs SDK-injected interactive overlays and kills them.
    const brokenPattern =
      /body\s*>\s*div\[[^\]]*convai[^\]]*\][^{]*\{[^}]*pointer-events\s*:\s*none/s;
    expect(
      brokenPattern.test(css),
      'Found pointer-events:none on body > div[*convai] — will break ElevenLabs call UI (BUG-23)',
    ).toBe(false);
  });

  it('body-level eleven selector must not declare pointer-events:none', () => {
    const brokenPattern =
      /body\s*>\s*div\[[^\]]*eleven[^\]]*\][^{]*\{[^}]*pointer-events\s*:\s*none/s;
    expect(
      brokenPattern.test(css),
      'Found pointer-events:none on body > div[*eleven] — will break ElevenLabs call UI (BUG-23)',
    ).toBe(false);
  });
});
