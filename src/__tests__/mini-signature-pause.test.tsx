/**
 * Phase C2c — MiniSignature pause toggle with Cymatics canvas.
 *
 * Asserts:
 *   1. Clicking the pause button hides the Cymatics canvas and shows paused text.
 *   2. Pause state persists to localStorage (togglePause flips 'true' <-> 'false').
 *   3. Initial pause state is restored from localStorage on mount.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import type { ComponentProps } from 'react';
import type { ChladniParams } from '@/src/lib/cymatics/bazi-to-chladni';
import type { SignaturCymaticsCanvas as SignaturCymaticsCanvasType } from '@/src/components/signatur-cymatics/SignaturCymaticsCanvas';
import type { CymaticsFallback as CymaticsFallbackType } from '@/src/components/signatur-cymatics/CymaticsFallback';

// Language context — minimal translation stub
const MINI_T_MAP: Record<string, string> = {
  'dashboard.miniSignature.calculating': 'wird berechnet',
  'dashboard.miniSignature.paused': 'pausiert',
  'dashboard.miniSignature.expandLabel': 'Vergrößern',
  'dashboard.miniSignature.togglePause': 'Pause',
  'dashboard.miniSignature.label': 'Signatur',
};
vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ t: (k: string) => MINI_T_MAP[k] ?? k, language: 'de' }),
}));

// Mock Cymatics canvas
vi.mock('../components/signatur-cymatics/SignaturCymaticsCanvas', () => ({
  SignaturCymaticsCanvas: (props: Pick<ComponentProps<typeof SignaturCymaticsCanvasType>, 'params'>) => (
    <div
      data-testid="cymatics-canvas"
      data-m={props.params.m}
      data-n={props.params.n}
      data-element={props.params.dominantElement}
    />
  ),
}));

// Mock CymaticsFallback
vi.mock('../components/signatur-cymatics/CymaticsFallback', () => ({
  CymaticsFallback: (props: ComponentProps<typeof CymaticsFallbackType>) => (
    <div data-testid="cymatics-fallback" data-element={props.dominantElement ?? 'undefined'} />
  ),
}));

import MiniSignature from '../components/dashboard/MiniSignature';

const mockChladniParams: ChladniParams = {
  m: 4,
  n: 5,
  a: 0.7,
  b: 0.58,
  harmonyIndex: 0.6,
  dominantElement: 'Fire',
};

/** Flush React.lazy / Suspense microtasks */
async function flushLazy(ticks = 20) {
  for (let i = 0; i < ticks; i++) {
    await act(async () => { await Promise.resolve(); });
  }
}

beforeEach(() => {
  localStorage.clear();
});

describe('MiniSignature — Pause toggle with Cymatics (Phase C2c)', () => {
  it('renders pause toggle button', async () => {
    render(<MiniSignature chladniParams={mockChladniParams} />);
    await flushLazy();
    const btn = screen.getByRole('button', { name: /pause/i });
    expect(btn).toBeDefined();
  });

  it('toggling pause hides the canvas and shows paused text', async () => {
    render(<MiniSignature chladniParams={mockChladniParams} />);
    await flushLazy();

    // Canvas is visible initially (not paused)
    expect(screen.getByTestId('cymatics-canvas')).toBeDefined();
    expect(screen.queryByText('pausiert')).toBeNull();

    // Click pause button
    const btn = screen.getByRole('button', { name: /pause/i });
    fireEvent.click(btn);
    await flushLazy();

    // Canvas is gone, paused text is visible
    expect(screen.queryByTestId('cymatics-canvas')).toBeNull();
    expect(screen.getByText('pausiert')).toBeDefined();
  });

  it('pause state persists to localStorage (flips true <-> false on toggle)', async () => {
    render(<MiniSignature chladniParams={mockChladniParams} />);
    await flushLazy();

    const btn = screen.getByRole('button', { name: /pause/i });

    // First click → paused=true in localStorage
    fireEvent.click(btn);
    expect(localStorage.getItem('bazodiac_mini_signature_paused')).toBe('true');

    // Second click → paused=false in localStorage
    fireEvent.click(btn);
    expect(localStorage.getItem('bazodiac_mini_signature_paused')).toBe('false');
  });

  it('reads initial paused state from localStorage on mount', async () => {
    localStorage.setItem('bazodiac_mini_signature_paused', 'true');
    render(<MiniSignature chladniParams={mockChladniParams} />);
    await flushLazy();

    // Paused text is shown immediately, canvas is not rendered
    expect(screen.getByText('pausiert')).toBeDefined();
    expect(screen.queryByTestId('cymatics-canvas')).toBeNull();
  });
});
