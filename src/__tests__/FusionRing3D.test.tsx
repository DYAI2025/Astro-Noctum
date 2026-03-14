import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FusionRing3D } from '@/src/components/fusion-ring-3d/FusionRing3D';

vi.mock('motion/react', async () => {
  const actual = await vi.importActual<typeof import('motion/react')>('motion/react');
  return {
    ...actual,
    useReducedMotion: () => true,
    motion: {
      path: 'path',
    },
  };
});

vi.mock('@/src/hooks/useFusionSignal', () => ({
  useFusionSignal: () => ({
    signalData: {
      targetSignals: Array(12).fill(0.4),
      baseSignals: Array(12).fill(0.3),
      thirtyDayAvg: Array(12).fill(0.35),
      transitIntensity: 0.6,
    },
    events: [],
    resolution: 50,
    loading: false,
    error: null,
    updateResolution: () => undefined,
  }),
}));

vi.mock('@/src/hooks/useSpaceWeather', () => ({
  useSpaceWeather: () => ({ kpIndex: 2, lastUpdate: new Date(), loading: false, error: null }),
}));

vi.mock('@/src/hooks/useRingAudio', () => ({
  useRingAudio: () => ({
    playSpikeChime: () => undefined,
    updateHumVolume: () => undefined,
    toggleMute: () => undefined,
    isMuted: true,
  }),
}));

const labels = {
  regionLabel: 'Fusion Ring',
  loading: 'Loading',
  reducedMotionHint: 'Reduced Motion / fallback mode active',
  resolution: 'Resolution',
  audioOn: 'Audio on',
  audioOff: 'Audio off',
  latestEvents: 'Latest',
  renderError: 'Renderer error',
  reload: 'Reload',
  eventAnnouncePrefix: 'Transit event',
};

describe('FusionRing3D', () => {
  it('uses 2D fallback when reduced motion is enabled', () => {
    render(<FusionRing3D userId="u1" labels={labels} />);

    expect(screen.getByText('Reduced Motion / fallback mode active')).toBeInTheDocument();
    expect(screen.getByText(/Resolution: 50%/i)).toBeInTheDocument();
  });
});
