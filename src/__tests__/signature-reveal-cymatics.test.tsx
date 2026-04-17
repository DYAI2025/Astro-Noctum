/**
 * Phase C1 — SignatureReveal migrated to Cymatics renderer.
 *
 * Asserts that after the V-chain removal:
 *   1. SignatureReveal renders SignaturCymaticsCanvas when sectors are present.
 *   2. It falls back to CymaticsFallback when sectors are missing / all zero.
 *   3. V1/V2/V3 canvases are NEVER mounted (testid assertions fail).
 *   4. Progress 0 yields neutral ChladniParams (m=3, n=3, a≈0.4).
 *   5. Progress 1 yields weight-derived params (m/n not necessarily 3).
 *   6. No code path imports FusionRingReveal.
 */
import { render, screen, act } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// Language context — minimal translation stub
const REVEAL_T_MAP: Record<string, string> = {
  'common.continue': 'Weiter',
  'signatureReveal.continueAnyway': 'Trotzdem weiter',
  'signatureReveal.signatureForming': 'Deine Signatur formt sich...',
  'signatureReveal.signaturePartialError': 'Signatur (Vorschau)',
  'signatureReveal.soulprintCalculating': 'Soulprint wird berechnet...',
  'signatureReveal.previewNote': 'Dies ist eine Vorschau.',
};
vi.mock('@/src/contexts/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'de', t: (k: string) => REVEAL_T_MAP[k] ?? k }),
}));

// Mock the Cymatics canvas so we can inspect props without running WebGL/Canvas2D.
const lastParamsRef = { current: null as any };
vi.mock('@/src/components/signatur-cymatics/SignaturCymaticsCanvas', () => ({
  SignaturCymaticsCanvas: (props: any) => {
    lastParamsRef.current = props.params;
    return <div data-testid="cymatics-canvas" data-m={props.params?.m} data-n={props.params?.n} data-a={props.params?.a} />;
  },
}));

// Mock CymaticsFallback so we can detect it
vi.mock('@/src/components/signatur-cymatics/CymaticsFallback', () => ({
  CymaticsFallback: (props: any) => (
    <div data-testid="cymatics-fallback" data-element={props.dominantElement} />
  ),
}));

// Assertion guards — if these modules get imported, force the test to fail.
vi.mock('@/src/components/signatur-v3/SignaturV3Canvas', () => ({
  default: () => <div data-testid="v3-canvas-should-not-appear" />,
}));
vi.mock('@/src/components/fusion-ring-website/FusionRingCanvasV2', () => ({
  default: () => <div data-testid="v2-canvas-should-not-appear" />,
}));
vi.mock('@/src/components/fusion-ring-website/FusionRingWebsiteCanvas', () => ({
  FusionRingWebsiteCanvas: () => <div data-testid="v1-canvas-should-not-appear" />,
}));

import { SignatureReveal } from '@/src/components/onboarding/SignatureReveal';

const mockBootstrap = {
  profile: { sun_sign: 'Aries', moon_sign: 'Cancer', ascendant_sign: 'Leo', day_master: 'Wood', harmony_index: 0.8 },
  soulprint_sectors: [0.9, 0.2, 0.3, 0.8, 0.1, 0.5, 0.6, 0.7, 0.9, 0.2, 0.3, 0.4],
  narratives: { core_summary: '', context_summary: '', integration_summary: '' },
  signature_blueprint: { seed: 'test' },
  meta: { engine_version: 'test' },
};

const mockBootstrapNoSectors = {
  ...mockBootstrap,
  soulprint_sectors: undefined as any,
};

/** Flush React.lazy / Suspense microtasks */
async function flushLazy(ticks = 20) {
  for (let i = 0; i < ticks; i++) {
    await act(async () => { await Promise.resolve(); });
  }
}

describe('SignatureReveal — Cymatics-only rendering (Phase C1)', () => {
  it('renders SignaturCymaticsCanvas when soulprint_sectors present', async () => {
    render(<SignatureReveal bootstrapData={mockBootstrap as any} onComplete={vi.fn()} />);
    await flushLazy();
    expect(screen.getByTestId('cymatics-canvas')).toBeDefined();
  });

  it('never renders V1, V2, or V3 canvases', async () => {
    render(<SignatureReveal bootstrapData={mockBootstrap as any} onComplete={vi.fn()} />);
    await flushLazy();
    expect(screen.queryByTestId('v1-canvas-should-not-appear')).toBeNull();
    expect(screen.queryByTestId('v2-canvas-should-not-appear')).toBeNull();
    expect(screen.queryByTestId('v3-canvas-should-not-appear')).toBeNull();
  });

  it('falls back to CymaticsFallback when soulprint_sectors is missing', async () => {
    render(<SignatureReveal bootstrapData={mockBootstrapNoSectors as any} onComplete={vi.fn()} />);
    await flushLazy();
    // Fallback branch — no canvas, just fallback.
    expect(screen.queryByTestId('cymatics-canvas')).toBeNull();
    expect(screen.getAllByTestId('cymatics-fallback').length).toBeGreaterThan(0);
  });

  it('starts with neutral ChladniParams at revealProgress=0 (m=3, n=3, a≈0.4)', async () => {
    vi.useFakeTimers();
    try {
      render(<SignatureReveal bootstrapData={mockBootstrap as any} onComplete={vi.fn()} />);
      // React effects still run with fake timers; flush the Suspense promise without advancing timers.
      await act(async () => { await Promise.resolve(); });
      await act(async () => { await Promise.resolve(); });
      await act(async () => { await Promise.resolve(); });
      await act(async () => { await Promise.resolve(); });
      // Before the 500ms morph timer fires, we should have neutral params.
      expect(lastParamsRef.current).toBeTruthy();
      expect(lastParamsRef.current.m).toBe(3);
      expect(lastParamsRef.current.n).toBe(3);
      expect(lastParamsRef.current.a).toBeCloseTo(0.4, 2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('morphs to weight-derived params by revealProgress=1', async () => {
    vi.useFakeTimers();
    try {
      render(<SignatureReveal bootstrapData={mockBootstrap as any} onComplete={vi.fn()} />);
      await act(async () => { await Promise.resolve(); });
      await act(async () => { await Promise.resolve(); });
      await act(async () => { await Promise.resolve(); });
      // Advance past the morph timer (500ms) + any RAF settle window.
      await act(async () => { vi.advanceTimersByTime(1000); });
      await act(async () => { await Promise.resolve(); });
      expect(lastParamsRef.current).toBeTruthy();
      // At progress=1 the params are derived from the weights. For the mock sectors above
      // (non-neutral distribution) the derived m or n must differ from the neutral 3
      // OR `a` must differ from 0.4 — otherwise the morph is a no-op.
      const p = lastParamsRef.current;
      const derived = p.m !== 3 || p.n !== 3 || Math.abs(p.a - 0.4) > 0.01;
      expect(derived).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('FusionRingReveal — must be fully removed (Phase C1)', () => {
  it('FusionRingReveal.tsx no longer exists on disk', () => {
    const p = path.resolve(
      __dirname,
      '..',
      'components',
      'onboarding',
      'FusionRingReveal.tsx',
    );
    expect(fs.existsSync(p)).toBe(false);
  });

  it('CosmicEncounter.tsx does not import FusionRingReveal', () => {
    const p = path.resolve(
      __dirname,
      '..',
      'components',
      'onboarding',
      'CosmicEncounter.tsx',
    );
    const src = fs.readFileSync(p, 'utf8');
    expect(src).not.toMatch(/FusionRingReveal/);
  });
});
