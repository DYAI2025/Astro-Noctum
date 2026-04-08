import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * BUG-23 regression guard.
 *
 * Two failure modes are guarded:
 *   A) pointer-events:none on body-level SDK overlays → call-flow buttons unclickable
 *   B) position:fixed without inset coordinates on body-level SDK overlays
 *      → overlay slides off-screen to the right (sliding regression)
 *
 * The ElevenLabsPortal in AgentFloatingWidget.tsx uses a full-viewport (inset:0)
 * fixed outer container so the SDK dialog has room to expand anywhere in the
 * viewport. The inner anchor positions the widget button at bottom-right.
 */
describe('BUG-23 regression — ElevenLabs overlay pointer-events', () => {
  const css = readFileSync(resolve(__dirname, '../index.css'), 'utf-8');

  it('body-level convai selector must not declare pointer-events:none', () => {
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
    const requiredPattern =
      /body\s*>\s*div\[[^\]]*eleven[^\]]*\][^{]*\{[^}]*pointer-events\s*:\s*auto/s;
    expect(
      requiredPattern.test(css),
      'Missing pointer-events:auto on body > div[*eleven] — ElevenLabs SDK overlays may be suppressed (BUG-23)',
    ).toBe(true);
  });

  it('elevenlabs-convai must have maximum z-index so widget is always on top', () => {
    // 2147483647 is the browser maximum z-index.
    // Nothing in our UI can be higher, ensuring the call UI is never covered.
    expect(
      css.includes('2147483647'),
      'elevenlabs-convai must use z-index: 2147483647 (browser max) to guarantee foreground visibility',
    ).toBe(true);
  });

  it('body-level SDK selector must NOT force position:fixed without inset — sliding regression guard', () => {
    // Forcing position:fixed on SDK-injected body divs without explicit top/left/bottom/right
    // causes the overlay to slide off-screen ("sliding to the right" regression).
    // The SDK manages its own overlay positioning; we must not override it.
    const brokenPattern =
      /body\s*>\s*div\[[^\]]*convai[^\]]*\][^{]*\{[^}]*position\s*:\s*fixed\s*!important/s;
    expect(
      brokenPattern.test(css),
      'Found position:fixed!important on body > div[*convai] — will break SDK overlay positioning (sliding regression)',
    ).toBe(false);
  });
});

describe('BUG-23 regression — ElevenLabs widget mounting (AgentFloatingWidget)', () => {
  const tsx = readFileSync(resolve(__dirname, '../components/AgentFloatingWidget.tsx'), 'utf-8');

  it('widget must use document.body.appendChild (not createPortal) to escape transform stacking context', () => {
    // createPortal still inherits ancestor stacking contexts (Framer Motion
    // will-change:transform). Direct document.body.appendChild does not.
    expect(
      tsx.includes('document.body.appendChild'),
      'elevenlabs-convai must be mounted via document.body.appendChild to escape Framer Motion transform traps',
    ).toBe(true);
  });

  it('must remove widget on cleanup (no orphaned elements)', () => {
    // Either el.remove() or document.body.removeChild(widget) is acceptable
    const hasCleanup = tsx.includes('el.remove()') || tsx.includes('removeChild(widget)');
    expect(
      hasCleanup,
      'useElevenLabsWidget must remove the widget in useEffect cleanup to avoid orphaned DOM elements',
    ).toBe(true);
  });

  it('must not use createPortal JSX call for elevenlabs-convai (transform trap regression guard)', () => {
    // createPortal(jsx, document.body) with Framer Motion will-change:transform
    // ancestor traps shadow-DOM fixed children, hiding the ToC/call overlay.
    // Comments mentioning createPortal are fine; an actual call is not.
    const hasActualPortalCall = /createPortal\s*\(/.test(tsx);
    expect(
      hasActualPortalCall,
      'elevenlabs-convai must not be rendered via createPortal() — use document.body.appendChild instead',
    ).toBe(false);
  });
});
