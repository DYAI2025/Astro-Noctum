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

  it('body-level SDK selector block must declare pointer-events:auto', () => {
    // Affirmative guard: the block must actively permit pointer events.
    // A negative-only check (no "none") passes if the rule is deleted entirely.
    const requiredPattern =
      /body\s*>\s*div\[[^\]]*eleven[^\]]*\][^{]*\{[^}]*pointer-events\s*:\s*auto/s;
    expect(
      requiredPattern.test(css),
      'Missing pointer-events:auto on body > div[*eleven] — ElevenLabs SDK interactive overlays may be suppressed (BUG-23)',
    ).toBe(true);
  });
});
