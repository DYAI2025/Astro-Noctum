import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { SignaturCymaticsCanvas, CYMATICS_DARK_BG, CYMATICS_BRIGHT_BG } from '../components/signatur-cymatics/SignaturCymaticsCanvas';
import { CymaticsFallback } from '../components/signatur-cymatics/CymaticsFallback';
import type { ChladniParams } from '../lib/cymatics/bazi-to-chladni';

// ── helpers ─────────────────────────────────────────────────────────────────

const DEFAULT_PARAMS: ChladniParams = {
  m: 3, n: 4, a: 0.65, b: 0.61,
  dominantElement: 'Water',
  harmonyIndex: 0.5,
};

// ── BG color constants ────────────────────────────────────────────────────────

describe('CYMATICS_DARK_BG / CYMATICS_BRIGHT_BG', () => {
  it('dark bg matches #0a2030', () => {
    expect(CYMATICS_DARK_BG).toEqual({ r: 10, g: 32, b: 48 });
  });

  it('bright bg matches #f1f5f9', () => {
    expect(CYMATICS_BRIGHT_BG).toEqual({ r: 241, g: 245, b: 249 });
  });
});

// ── SignaturCymaticsCanvas — happy-path render ────────────────────────────────

describe('SignaturCymaticsCanvas — render', () => {
  it('renders container and canvas elements', () => {
    render(<SignaturCymaticsCanvas params={DEFAULT_PARAMS} />);
    expect(screen.getByTestId('cymatics-canvas-container')).toBeTruthy();
    expect(screen.getByTestId('cymatics-canvas')).toBeTruthy();
  });

  it('applies className to container', () => {
    render(<SignaturCymaticsCanvas params={DEFAULT_PARAMS} className="test-cls" />);
    expect(screen.getByTestId('cymatics-canvas-container').className).toContain('test-cls');
  });
});

// ── SignaturCymaticsCanvas — Canvas2D unavailable ─────────────────────────────

describe('SignaturCymaticsCanvas — onFailed fallback', () => {
  beforeEach(() => {
    // Stub getContext to return null — simulates Canvas2D unavailable
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls onFailed when getContext returns null', () => {
    const onFailed = vi.fn();
    render(<SignaturCymaticsCanvas params={DEFAULT_PARAMS} onFailed={onFailed} />);
    expect(onFailed).toHaveBeenCalledOnce();
  });
});

describe('SignaturCymaticsCanvas — getContext throws', () => {
  beforeEach(() => {
    HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation(() => {
      throw new Error('canvas not supported');
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls onFailed when getContext throws', () => {
    const onFailed = vi.fn();
    render(<SignaturCymaticsCanvas params={DEFAULT_PARAMS} onFailed={onFailed} />);
    expect(onFailed).toHaveBeenCalledOnce();
  });
});

// ── SignaturCymaticsCanvas — smooth morph / no abrupt reset ──────────────────
//
// When ChladniParams change the canvas must NOT remount (which would hard-reset
// particles). Instead, the live-ref update + lerp in the RAF loop produces a
// smooth morph. These tests verify the no-remount contract by asserting that
// the container DOM node is the same object before and after a prop change.

describe('SignaturCymaticsCanvas — smooth morph on param change', () => {
  const BASE: ChladniParams = {
    m: 3, n: 4, a: 0.65, b: 0.61,
    dominantElement: 'Water',
    harmonyIndex: 0.5,
  };

  it('does not remount canvas container when a/b change', () => {
    const { rerender } = render(<SignaturCymaticsCanvas params={BASE} />);
    const before = screen.getByTestId('cymatics-canvas-container');

    act(() => {
      rerender(<SignaturCymaticsCanvas params={{ ...BASE, a: 0.8, b: 0.52 }} />);
    });

    expect(screen.getByTestId('cymatics-canvas-container')).toBe(before);
  });

  it('does not remount canvas container when m/n change', () => {
    const { rerender } = render(<SignaturCymaticsCanvas params={BASE} />);
    const before = screen.getByTestId('cymatics-canvas-container');

    act(() => {
      rerender(<SignaturCymaticsCanvas params={{ ...BASE, m: 5, n: 2 }} />);
    });

    expect(screen.getByTestId('cymatics-canvas-container')).toBe(before);
  });

  it('does not remount canvas container when harmonyIndex changes', () => {
    const { rerender } = render(<SignaturCymaticsCanvas params={BASE} />);
    const before = screen.getByTestId('cymatics-canvas-container');

    act(() => {
      rerender(<SignaturCymaticsCanvas params={{ ...BASE, harmonyIndex: 0.9 }} />);
    });

    expect(screen.getByTestId('cymatics-canvas-container')).toBe(before);
  });

  it('does not remount canvas container when dominantElement changes', () => {
    const { rerender } = render(<SignaturCymaticsCanvas params={BASE} />);
    const before = screen.getByTestId('cymatics-canvas-container');

    act(() => {
      rerender(<SignaturCymaticsCanvas params={{ ...BASE, dominantElement: 'Fire' }} />);
    });

    expect(screen.getByTestId('cymatics-canvas-container')).toBe(before);
  });

  it('does not remount on repeated sequential param changes', () => {
    const { rerender } = render(<SignaturCymaticsCanvas params={BASE} />);
    const before = screen.getByTestId('cymatics-canvas-container');

    act(() => { rerender(<SignaturCymaticsCanvas params={{ ...BASE, m: 5, n: 2 }} />); });
    act(() => { rerender(<SignaturCymaticsCanvas params={{ ...BASE, m: 5, n: 2, a: 0.9, b: 0.46 }} />); });
    act(() => { rerender(<SignaturCymaticsCanvas params={{ ...BASE, m: 2, n: 5, a: 0.9, b: 0.46 }} />); });

    expect(screen.getByTestId('cymatics-canvas-container')).toBe(before);
  });
});

// ── CymaticsFallback — render ─────────────────────────────────────────────────

describe('CymaticsFallback', () => {
  it('renders with data-testid and data-element', () => {
    render(<CymaticsFallback dominantElement="Fire" />);
    const el = screen.getByTestId('cymatics-fallback');
    expect(el).toBeTruthy();
    expect(el.getAttribute('data-element')).toBe('Fire');
  });

  it('defaults to Water element', () => {
    render(<CymaticsFallback />);
    expect(screen.getByTestId('cymatics-fallback').getAttribute('data-element')).toBe('Water');
  });

  it('applies className prop', () => {
    render(<CymaticsFallback className="my-class" />);
    expect(screen.getByTestId('cymatics-fallback').className).toContain('my-class');
  });

  it('renders dark background in planetariumMode', () => {
    render(<CymaticsFallback dominantElement="Water" planetariumMode={true} />);
    const el = screen.getByTestId('cymatics-fallback');
    expect((el as HTMLElement).style.background).toBe('#0a2030');
  });

  it('renders bright background when planetariumMode=false', () => {
    render(<CymaticsFallback dominantElement="Metal" planetariumMode={false} />);
    const el = screen.getByTestId('cymatics-fallback');
    expect((el as HTMLElement).style.background).toBe('#f1f5f9');
  });

  it.each(['Wood', 'Fire', 'Earth', 'Metal', 'Water'] as const)(
    'renders without error for element %s',
    (element) => {
      expect(() => render(<CymaticsFallback dominantElement={element} />)).not.toThrow();
    },
  );
});
