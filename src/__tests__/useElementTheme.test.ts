/**
 * Tests for useElementTheme hook.
 *
 * Verifies that the hook applies Wu-Xing element CSS tokens to :root
 * and cleans up on unmount, per DEC-wuxing-ui-mapping.
 */

import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useElementTheme } from '../hooks/useElementTheme';

function getRootProp(name: string): string {
  return document.documentElement.style.getPropertyValue(name).trim();
}

describe('useElementTheme', () => {
  beforeEach(() => {
    document.documentElement.style.cssText = '';
    document.body.removeAttribute('data-element');
  });

  afterEach(() => {
    document.documentElement.style.cssText = '';
    document.body.removeAttribute('data-element');
  });

  it('sets --element-accent CSS var to element token on :root', () => {
    renderHook(() => useElementTheme('Wood'));
    expect(getRootProp('--element-accent')).toBe('var(--color-element-wood)');
  });

  it('accepts German element name (API alias)', () => {
    renderHook(() => useElementTheme('Holz'));
    expect(getRootProp('--element-accent')).toBe('var(--color-element-wood)');
  });

  it('sets data-element attribute on <body>', () => {
    renderHook(() => useElementTheme('Fire'));
    expect(document.body.getAttribute('data-element')).toBe('Fire');
  });

  it('sets --ui-transition-duration for Fire (fast)', () => {
    renderHook(() => useElementTheme('Fire'));
    expect(getRootProp('--ui-transition-duration')).toBe('0.20s');
  });

  it('sets --ui-transition-duration for Water (slow)', () => {
    renderHook(() => useElementTheme('Water'));
    expect(getRootProp('--ui-transition-duration')).toBe('0.55s');
  });

  it('sets --ui-transition-duration for Metal (crisp)', () => {
    renderHook(() => useElementTheme('Metal'));
    expect(getRootProp('--ui-transition-duration')).toBe('0.25s');
  });

  it('sets --ui-transition-duration for Earth (grounded)', () => {
    renderHook(() => useElementTheme('Earth'));
    expect(getRootProp('--ui-transition-duration')).toBe('0.45s');
  });

  it('sets --ui-transition-duration for Wood (spring)', () => {
    renderHook(() => useElementTheme('Wood'));
    expect(getRootProp('--ui-transition-duration')).toBe('0.38s');
  });

  it('removes CSS vars on unmount', () => {
    const { unmount } = renderHook(() => useElementTheme('Wood'));
    unmount();
    expect(getRootProp('--element-accent')).toBe('');
    expect(getRootProp('--ui-transition-duration')).toBe('');
    expect(getRootProp('--ui-transition-easing')).toBe('');
  });

  it('removes data-element from <body> on unmount', () => {
    const { unmount } = renderHook(() => useElementTheme('Wood'));
    unmount();
    expect(document.body.getAttribute('data-element')).toBeNull();
  });

  it('does nothing for unknown element key', () => {
    renderHook(() => useElementTheme('Unknown'));
    expect(getRootProp('--element-accent')).toBe('');
    expect(document.body.getAttribute('data-element')).toBeNull();
  });

  it('does nothing for empty string', () => {
    renderHook(() => useElementTheme(''));
    expect(getRootProp('--element-accent')).toBe('');
    expect(document.body.getAttribute('data-element')).toBeNull();
  });

  it('updates CSS vars when dominantElement changes', () => {
    const { rerender } = renderHook(
      ({ el }) => useElementTheme(el),
      { initialProps: { el: 'Wood' } },
    );
    expect(getRootProp('--element-accent')).toBe('var(--color-element-wood)');
    expect(getRootProp('--ui-transition-duration')).toBe('0.38s');

    act(() => {
      rerender({ el: 'Fire' });
    });
    expect(getRootProp('--element-accent')).toBe('var(--color-element-fire)');
    expect(getRootProp('--ui-transition-duration')).toBe('0.20s');
    expect(document.body.getAttribute('data-element')).toBe('Fire');
  });

  it('accepts German alias Wasser → Water token', () => {
    renderHook(() => useElementTheme('Wasser'));
    expect(getRootProp('--element-accent')).toBe('var(--color-element-water)');
  });

  it('does not set any CSS vars on an element with .planetarium class', () => {
    // Simulate: hook sets data-element on body; but hook NEVER touches
    // elements with .planetarium class — that's handled by CSS cascade alone.
    // Confirm no inline style lands on a .planetarium div.
    const planetDiv = document.createElement('div');
    planetDiv.className = 'planetarium';
    document.body.appendChild(planetDiv);

    renderHook(() => useElementTheme('Wood'));

    expect(planetDiv.style.getPropertyValue('--tile-glow')).toBe('');
    expect(planetDiv.style.getPropertyValue('--tile-accent')).toBe('');

    document.body.removeChild(planetDiv);
  });

  it('sets data-element on body regardless of planetarium mode (CSS handles exclusion)', () => {
    // Hook always sets the attribute; CSS :not(:is(.planetarium *)) does the filtering.
    renderHook(() => useElementTheme('Water'));
    expect(document.body.getAttribute('data-element')).toBe('Water');
  });
});
