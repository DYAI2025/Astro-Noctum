/**
 * Phase H6 — Integration tests for the 2D ↔ 3D view toggle in SignaturRenderer.
 *
 * Verifies:
 *   1. Default view is 2D (3D container carries the `hidden` class).
 *   2. Clicking the "3D" button flips visibility.
 *   3. Clicking "2D" flips back.
 *   4. Both containers persist in the DOM across toggles (no unmount → no
 *      canvas / scene reset).
 *   5. `aria-pressed` on each toggle button tracks the active mode.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import React from 'react';

// ── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('@/src/hooks/useSignaturSignal', () => ({
  useSignaturSignal: () => ({
    signalData: {
      baseSignals: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
    },
    events: [],
    resolution: 80,
    loading: false,
    error: null,
  }),
}));

vi.mock('@/src/hooks/useSpaceWeather', () => ({
  useSpaceWeather: () => ({ kpIndex: 2.5 }),
}));

vi.mock('motion/react', () => ({
  useReducedMotion: () => false,
}));

vi.mock('@/src/components/signatur-cymatics/SignaturCymaticsCanvas', () => ({
  SignaturCymaticsCanvas: ({ className }: { className?: string }) =>
    React.createElement('div', { 'data-testid': 'mock-2d-canvas', className }),
}));

vi.mock('@/src/components/signatur-cymatics/CymaticsFallback', () => ({
  CymaticsFallback: ({ className }: { className?: string }) =>
    React.createElement('div', { 'data-testid': 'mock-2d-fallback', className }),
}));

vi.mock('@/src/components/signatur-3d/SignatureSphere3D', () => ({
  SignatureSphere3D: ({ className }: { className?: string }) =>
    React.createElement('div', { 'data-testid': 'mock-3d-sphere', className }),
}));

// ── Tests ────────────────────────────────────────────────────────────────────

describe('SignaturRenderer 2D↔3D toggle', () => {
  const LABELS = {
    regionLabel: 'Signatur',
    loading: 'Laden',
    reducedMotionHint: '',
    resolution: 'Res',
    audioOn: '',
    audioOff: '',
    latestEvents: '',
    renderError: '',
    reload: '',
    eventAnnouncePrefix: '',
  };

  const CHLADNI_PARAMS = {
    m: 3,
    n: 2,
    a: 0.5,
    b: 0.5,
    harmonyIndex: 0.5,
    dominantElement: 'Fire' as const,
  };

  let SignaturRenderer: typeof import('@/src/components/signatur-renderer/SignaturRenderer').SignaturRenderer;

  beforeEach(async () => {
    localStorage.clear();
    const mod = await import('@/src/components/signatur-renderer/SignaturRenderer');
    SignaturRenderer = mod.SignaturRenderer;
  });

  afterEach(() => {
    localStorage.clear();
  });

  const renderRing = async () => {
    await act(async () => {
      render(
        React.createElement(SignaturRenderer, {
          userId: 'test-user',
          labels: LABELS,
          chladniParams: CHLADNI_PARAMS,
        }),
      );
    });
  };

  it('defaults to the 2D view', async () => {
    await renderRing();

    const container2d = screen.getByTestId('view-2d-container');
    const container3d = screen.getByTestId('view-3d-container');

    expect(container2d.className).not.toContain('hidden');
    expect(container3d.className).toContain('hidden');
  });

  it('switches to 3D when the 3D button is clicked', async () => {
    await renderRing();

    const btn3d = screen.getByRole('button', { name: '3D' });
    await act(async () => {
      fireEvent.click(btn3d);
    });

    const container2d = screen.getByTestId('view-2d-container');
    const container3d = screen.getByTestId('view-3d-container');

    expect(container2d.className).toContain('hidden');
    expect(container3d.className).not.toContain('hidden');
  });

  it('switches back to 2D after toggling to 3D and back', async () => {
    await renderRing();

    const btn3d = screen.getByRole('button', { name: '3D' });
    const btn2d = screen.getByRole('button', { name: '2D' });

    await act(async () => {
      fireEvent.click(btn3d);
    });
    await act(async () => {
      fireEvent.click(btn2d);
    });

    const container2d = screen.getByTestId('view-2d-container');
    const container3d = screen.getByTestId('view-3d-container');

    expect(container2d.className).not.toContain('hidden');
    expect(container3d.className).toContain('hidden');
  });

  it('keeps both canvas containers mounted across toggle cycles', async () => {
    await renderRing();

    // Baseline: both present in DOM.
    expect(screen.getByTestId('view-2d-container')).toBeTruthy();
    expect(screen.getByTestId('view-3d-container')).toBeTruthy();

    const btn3d = screen.getByRole('button', { name: '3D' });
    const btn2d = screen.getByRole('button', { name: '2D' });

    // Toggle to 3D → still both present.
    await act(async () => {
      fireEvent.click(btn3d);
    });
    expect(screen.getByTestId('view-2d-container')).toBeTruthy();
    expect(screen.getByTestId('view-3d-container')).toBeTruthy();

    // Toggle back to 2D → still both present.
    await act(async () => {
      fireEvent.click(btn2d);
    });
    expect(screen.getByTestId('view-2d-container')).toBeTruthy();
    expect(screen.getByTestId('view-3d-container')).toBeTruthy();
  });

  it('reflects the active mode via aria-pressed on the toggle buttons', async () => {
    await renderRing();

    const btn2d = screen.getByRole('button', { name: '2D' });
    const btn3d = screen.getByRole('button', { name: '3D' });

    // Default: 2D pressed.
    expect(btn2d.getAttribute('aria-pressed')).toBe('true');
    expect(btn3d.getAttribute('aria-pressed')).toBe('false');

    // Switch to 3D.
    await act(async () => {
      fireEvent.click(btn3d);
    });
    expect(btn2d.getAttribute('aria-pressed')).toBe('false');
    expect(btn3d.getAttribute('aria-pressed')).toBe('true');

    // Switch back.
    await act(async () => {
      fireEvent.click(btn2d);
    });
    expect(btn2d.getAttribute('aria-pressed')).toBe('true');
    expect(btn3d.getAttribute('aria-pressed')).toBe('false');
  });
});
