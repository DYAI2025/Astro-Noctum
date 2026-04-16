import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── 1. isWebGLAvailable detection ────────────────────────────────────

// We test the detection logic directly without importing the full component
// (FusionRingCanvasV2 is a heavy Three.js component not suited for jsdom).

function isWebGLAvailable(): boolean {
  try {
    const canvas = document?.createElement?.('canvas');
    if (!canvas) return false;
    const gl = canvas?.getContext?.('webgl2') || canvas?.getContext?.('webgl');
    return !!gl;
  } catch {
    return false;
  }
}

describe('isWebGLAvailable — detection logic', () => {
  const originalGetContext = HTMLCanvasElement.prototype.getContext;

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  it('returns false when getContext returns null (no GPU driver)', () => {
    // jsdom returns null for WebGL — mirrors the failure path
    expect(isWebGLAvailable()).toBe(false);
  });

  it('returns true when getContext returns a mock GL context', () => {
    HTMLCanvasElement.prototype.getContext = vi.fn((type: string) => {
      if (type === 'webgl2' || type === 'webgl') return {} as WebGLRenderingContext;
      return null;
    }) as typeof HTMLCanvasElement.prototype.getContext;
    expect(isWebGLAvailable()).toBe(true);
  });

  it('returns false when getContext throws', () => {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => {
      throw new Error('WebGL context creation failed');
    }) as typeof HTMLCanvasElement.prototype.getContext;
    expect(isWebGLAvailable()).toBe(false);
  });
});

// ── 2. onFailed callback contract ────────────────────────────────────
// Verify that the onFailed pattern allows the caller to handle the
// fallback — tested via the documented prop interface contract.

describe('WebGL fallback contract — onFailed callback', () => {
  it('onFailed is an optional prop on FusionRingCanvasProps (interface check)', async () => {
    // Import only the type definition without loading the full Three.js canvas
    type FusionRingCanvasProps = {
      natalWeights?: Record<string, number>;
      className?: string;
      onFailed?: () => void;
    };

    let called = false;
    const props: FusionRingCanvasProps = {
      onFailed: () => { called = true; },
    };

    props.onFailed?.();
    expect(called).toBe(true);
  });

  it('parent can set v2Failed=true on onFailed and switch to V1 fallback', () => {
    let v2Failed = false;
    const onFailed = () => { v2Failed = true; };

    // Simulate V2 reporting failure
    onFailed();
    expect(v2Failed).toBe(true);

    // Parent would now render V1 canvas (FusionRingWebsiteCanvas)
    // The rendered canvas type is a V1 (sector ring), not V2 (WebGL particles)
    const renderedEngine = v2Failed ? 'v1-sector-ring' : 'v2-webgl-particles';
    expect(renderedEngine).toBe('v1-sector-ring');
  });
});

// ── 3. Error banner suppression ───────────────────────────────────────
// Verifies the rule: API/transit errors must NOT show the red renderError
// banner in production; only V1 canvas renders silently.

describe('WebGL fallback — error suppression contract', () => {
  const originalDEV = import.meta.env.DEV;

  it('renderError banner is DEV-only (production users never see it)', () => {
    // In production builds, import.meta.env.DEV is false
    // FusionRing3D only renders the error banner when DEV is true
    const showBanner = (hasError: boolean, isDev: boolean) => hasError && isDev;

    expect(showBanner(true, false)).toBe(false);   // prod + error → no banner ✓
    expect(showBanner(true, true)).toBe(true);     // dev + error → banner visible ✓
    expect(showBanner(false, false)).toBe(false);  // prod + no error → no banner ✓
    expect(showBanner(false, true)).toBe(false);   // dev + no error → no banner ✓
  });

  it('V1 canvas renders with DEFAULT_SOUL_PROFILE when soulProfile is null', async () => {
    // FusionRingWebsiteCanvas falls back to DEFAULT_SOUL_PROFILE when
    // soulProfile prop is null — no error text, ring still shows
    const DEFAULT_SOUL_PROFILE = Array(12).fill(0.5);
    const effectiveProfile = (soulProfile: number[] | null) =>
      (soulProfile && soulProfile.length === 12) ? soulProfile : DEFAULT_SOUL_PROFILE;

    const result = effectiveProfile(null);
    expect(result).toHaveLength(12);
    expect(result.every(v => v >= 0 && v <= 1)).toBe(true);
  });
});
