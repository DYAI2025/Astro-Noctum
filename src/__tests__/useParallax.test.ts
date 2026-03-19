import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useParallax } from '../components/onboarding/useParallax';

describe('useParallax', () => {
  let addSpy: ReturnType<typeof vi.spyOn>;
  let removeSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 0; });
    vi.stubGlobal('cancelAnimationFrame', () => {});
    addSpy = vi.spyOn(window, 'addEventListener');
    removeSpy = vi.spyOn(window, 'removeEventListener');
    Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, writable: true });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('returns initial offset of {x: 0, y: 0}', () => {
    const { result } = renderHook(() => useParallax(30));
    expect(result.current).toEqual({ x: 0, y: 0 });
  });

  it('updates offset on mousemove (positive factor = follows mouse)', () => {
    const { result } = renderHook(() => useParallax(30));

    act(() => {
      const handler = addSpy.mock.calls.find(c => c[0] === 'mousemove')?.[1] as EventListener;
      handler(new MouseEvent('mousemove', { clientX: 768, clientY: 384 }));
    });

    // normalized: x = (768/1024 - 0.5)*2 = 0.5, y = (384/768 - 0.5)*2 = 0
    expect(result.current.x).toBeCloseTo(15, 0);
    expect(result.current.y).toBeCloseTo(0, 0);
  });

  it('negative factor inverts direction (opposing parallax)', () => {
    const { result } = renderHook(() => useParallax(-50));

    act(() => {
      const handler = addSpy.mock.calls.find(c => c[0] === 'mousemove')?.[1] as EventListener;
      handler(new MouseEvent('mousemove', { clientX: 768, clientY: 384 }));
    });

    expect(result.current.x).toBeCloseTo(-25, 0);
  });

  it('cleans up event listener on unmount', () => {
    const { unmount } = renderHook(() => useParallax(30));
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
  });

  it('returns {x:0, y:0} when disabled', () => {
    const { result } = renderHook(() => useParallax(30, false));

    act(() => {
      const mouseMoveCall = addSpy.mock.calls.find(c => c[0] === 'mousemove');
      expect(mouseMoveCall).toBeUndefined();
    });

    expect(result.current).toEqual({ x: 0, y: 0 });
  });
});
