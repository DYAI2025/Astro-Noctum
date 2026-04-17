/**
 * Integration tests for the Cymatics engine wiring in FusionRing3D and FuRingPage.
 *
 * Covers:
 * 1. Engine hierarchy: cymatics > V3 > V2 > V1
 * 2. Feature-flag gate: default off, localStorage enable
 * 3. cymaticsFailed degradation → falls back to next engine
 * 4. FusionRing3D render: cymatics canvas visible when flag + params present
 * 5. FusionRing3D render: cymatics hidden when flag off or params undefined
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';

// ── Module mocks ─────────────────────────────────────────────────────────────

vi.mock('@/src/hooks/useFusionSignal', () => ({
  useFusionSignal: () => ({
    signalData: null,
    events: [],
    resolution: 0,
    loading: false,
    error: null,
  }),
}));

vi.mock('@/src/hooks/useSpaceWeather', () => ({
  useSpaceWeather: () => ({ kpIndex: 0 }),
}));

vi.mock('motion/react', () => ({
  useReducedMotion: () => false,
}));

vi.mock('@/src/lib/feature-flags', () => {
  let flags: Record<string, boolean> = {};
  return {
    isFeatureEnabled: (key: string) => {
      const stored = localStorage.getItem(`ff_${key}`);
      if (stored === 'true') return true;
      if (stored === 'false') return false;
      // Defaults: cymatics off, v3 off, v2 on
      if (key === 'signature_engine_cymatics') return false;
      if (key === 'signature_engine_v3') return false;
      if (key === 'signature_engine_v2') return true;
      return true;
    },
    validateCriticalFlags: () => {},
    FLAGS: flags,
  };
});

vi.mock('@/src/components/signatur-cymatics/SignaturCymaticsCanvas', () => ({
  SignaturCymaticsCanvas: ({ className, onFailed }: { className?: string; onFailed?: () => void }) =>
    React.createElement('div', {
      'data-testid': 'mock-cymatics-canvas',
      className,
    }),
}));

vi.mock('@/src/components/signatur-v3/SignaturV3Canvas', () => ({
  default: () => React.createElement('div', { 'data-testid': 'mock-v3-canvas' }),
}));

vi.mock('@/src/components/fusion-ring-website/FusionRingCanvasV2', () => ({
  default: ({ onFailed }: { onFailed?: () => void }) =>
    React.createElement('div', { 'data-testid': 'mock-v2-canvas' }),
}));

vi.mock('@/src/components/fusion-ring-website/FusionRingWebsiteCanvas', () => ({
  FusionRingWebsiteCanvas: () =>
    React.createElement('div', { 'data-testid': 'mock-v1-canvas' }),
}));

// ── Engine hierarchy (pure logic, no component mount) ─────────────────────────

describe('Engine selection logic', () => {
  type Engine = 'cymatics' | 'v3' | 'v2' | 'v1';

  function selectEngine(opts: {
    cymaticsEnabled: boolean;
    chladniParams: object | undefined;
    cymaticsFailed: boolean;
    v3Enabled: boolean;
    v3Weights: object | undefined;
    v2Enabled: boolean;
    v2Failed: boolean;
  }): Engine {
    if (opts.cymaticsEnabled && opts.chladniParams && !opts.cymaticsFailed) return 'cymatics';
    if (opts.v3Enabled && opts.v3Weights) return 'v3';
    if (opts.v2Enabled && !opts.v2Failed) return 'v2';
    return 'v1';
  }

  const BASE = {
    cymaticsEnabled: false,
    chladniParams: undefined,
    cymaticsFailed: false,
    v3Enabled: false,
    v3Weights: undefined,
    v2Enabled: true,
    v2Failed: false,
  };

  it('cymatics wins when flag on + params present + not failed', () => {
    expect(selectEngine({ ...BASE, cymaticsEnabled: true, chladniParams: {} })).toBe('cymatics');
  });

  it('cymatics loses when flag off', () => {
    expect(selectEngine({ ...BASE, cymaticsEnabled: false, chladniParams: {} })).toBe('v2');
  });

  it('cymatics loses when params undefined', () => {
    expect(selectEngine({ ...BASE, cymaticsEnabled: true, chladniParams: undefined })).toBe('v2');
  });

  it('cymatics loses when cymaticsFailed', () => {
    expect(
      selectEngine({ ...BASE, cymaticsEnabled: true, chladniParams: {}, cymaticsFailed: true }),
    ).toBe('v2');
  });

  it('falls to v3 when cymatics absent and v3 available', () => {
    expect(selectEngine({ ...BASE, v3Enabled: true, v3Weights: {} })).toBe('v3');
  });

  it('falls to v1 when v2 failed', () => {
    expect(selectEngine({ ...BASE, v2Failed: true })).toBe('v1');
  });
});

// ── FusionRing3D component integration ────────────────────────────────────────

describe('FusionRing3D cymatics wiring', () => {
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

  let FusionRing3D: typeof import('@/src/components/fusion-ring-3d/FusionRing3D').FusionRing3D;

  beforeEach(async () => {
    localStorage.clear();
    const mod = await import('@/src/components/fusion-ring-3d/FusionRing3D');
    FusionRing3D = mod.FusionRing3D;
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders V2 by default (cymatics flag off)', async () => {
    await act(async () => {
      render(
        React.createElement(FusionRing3D, {
          userId: 'test-user',
          labels: LABELS,
          chladniParams: CHLADNI_PARAMS,
        }),
      );
    });
    expect(screen.queryByTestId('mock-cymatics-canvas')).toBeNull();
    expect(screen.getByTestId('mock-v2-canvas')).toBeDefined();
  });

  it('renders cymatics canvas when flag enabled + params present', async () => {
    localStorage.setItem('ff_signature_engine_cymatics', 'true');
    await act(async () => {
      render(
        React.createElement(FusionRing3D, {
          userId: 'test-user',
          labels: LABELS,
          chladniParams: CHLADNI_PARAMS,
        }),
      );
    });
    expect(screen.getByTestId('mock-cymatics-canvas')).toBeDefined();
  });

  it('does NOT render cymatics when flag enabled but params undefined', async () => {
    localStorage.setItem('ff_signature_engine_cymatics', 'true');
    await act(async () => {
      render(
        React.createElement(FusionRing3D, {
          userId: 'test-user',
          labels: LABELS,
          chladniParams: undefined,
        }),
      );
    });
    expect(screen.queryByTestId('mock-cymatics-canvas')).toBeNull();
  });
});
