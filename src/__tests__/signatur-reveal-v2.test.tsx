import { render, screen, act } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

vi.mock('@/src/lib/feature-flags', () => ({
  isFeatureEnabled: (flag: string) => flag === 'signature_engine_v3' || flag === 'signature_engine_v2',
}));
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
vi.mock('@/src/components/fusion-ring-website/signatur-bridge', () => ({
  soulprintToNatalWeights: () => ({ Sun: 0.5, Moon: 0.5 }),
  soulprintToDimensionWeights: () => ({ assertion: 0.5, empathy: 0.5, creativity: 0.5, logic: 0.5, intuition: 0.5, discipline: 0.5 }),
  quizSectorsToQuizWeights: vi.fn(),
}));

// Mock canvas components to avoid WebGL/Canvas
vi.mock('@/src/components/signatur-v3/SignaturV3Canvas', () => ({
  default: (props: any) => <div data-testid="v3-canvas" />,
}));
vi.mock('@/src/components/fusion-ring-website/FusionRingCanvasV2', () => ({
  default: (props: any) => <div data-testid="v2-canvas" />,
}));
vi.mock('@/src/components/fusion-ring-website/FusionRingWebsiteCanvas', () => ({
  FusionRingWebsiteCanvas: (props: any) => <div data-testid="v1-canvas" />,
}));

import { SignatureReveal } from '@/src/components/onboarding/SignatureReveal';

const mockBootstrap = {
  profile: { sun_sign: 'Aries', moon_sign: 'Cancer', ascendant_sign: 'Leo', day_master: 'Wood', harmony_index: 0.8 },
  soulprint_sectors: [0.5, 0.6, 0.7, 0.8, 0.5, 0.6, 0.7, 0.8, 0.5, 0.6, 0.7, 0.8],
  narratives: { core_summary: '', context_summary: '', integration_summary: '' },
  signature_blueprint: { seed: 'test' },
  meta: { engine_version: 'test' },
};

describe('SignatureReveal', () => {
  it('renders V3 canvas as default (V3 flag enabled)', async () => {
    render(<SignatureReveal bootstrapData={mockBootstrap as any} onComplete={vi.fn()} />);
    expect(await screen.findByTestId('v3-canvas')).toBeDefined();
  });

  it('does NOT render quiz options', async () => {
    await act(async () => {
      render(<SignatureReveal bootstrapData={mockBootstrap as any} onComplete={vi.fn()} />);
    });
    expect(screen.queryByText(/beschreibt dich/i)).toBeNull();
  });

  it('does NOT render profile summary', async () => {
    await act(async () => {
      render(<SignatureReveal bootstrapData={mockBootstrap as any} onComplete={vi.fn()} />);
    });
    expect(screen.queryByText('Aries')).toBeNull();
    expect(screen.queryByText(/harmonie/i)).toBeNull();
  });

  it('shows WEITER button after delay', async () => {
    vi.useFakeTimers();
    await act(async () => {
      render(<SignatureReveal bootstrapData={mockBootstrap as any} onComplete={vi.fn()} />);
    });
    expect(screen.queryByText(/weiter/i)).toBeNull();
    await act(() => vi.advanceTimersByTime(3500));
    expect(screen.getByText(/weiter/i)).toBeDefined();
    vi.useRealTimers();
  });
});
