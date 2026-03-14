import type { Meta, StoryObj } from '@storybook/react';
import { FusionRing3D, type FusionRing3DLabels } from '@/src/components/fusion-ring-3d/FusionRing3D';

const labels: FusionRing3DLabels = {
  regionLabel: 'Bazodiac Fusion Ring 3D',
  loading: 'Loading…',
  reducedMotionHint: 'Reduced Motion / fallback mode active',
  resolution: 'Resolution',
  audioOn: 'Audio on',
  audioOff: 'Audio off',
  latestEvents: 'Latest events',
  renderError: 'Renderer error. Fallback active.',
  reload: 'Reload',
  eventAnnouncePrefix: 'Transit event',
};

const mockProfiles = {
  fire: {
    ring: { sectors: [0.8, 0.2, 0.1, 0.3, 0.9, 0.2, 0.1, 0.4, 0.85, 0.15, 0.2, 0.3] },
    soulprint: { sectors: [0.7, 0.15, 0.05, 0.25, 0.8, 0.15, 0.05, 0.35, 0.75, 0.1, 0.15, 0.25] },
    transit_contribution: { transit_intensity: 0.85 },
    delta: { vs_30day_avg: { avg_sectors: [0.65, 0.18, 0.08, 0.28, 0.72, 0.18, 0.08, 0.38, 0.68, 0.12, 0.18, 0.28] } },
    events: [
      { id: 'evt_fire_1', type: 'resonance_jump', sector: 4, delta: 0.22, trigger_planet: 'Sun', trigger_symbol: '☉', sector_domain: 'Power' },
    ],
    resolution: 75,
  },
  water: {
    ring: { sectors: [0.1, 0.3, 0.85, 0.9, 0.2, 0.4, 0.15, 0.8, 0.1, 0.25, 0.95, 0.88] },
    soulprint: { sectors: [0.05, 0.25, 0.75, 0.82, 0.15, 0.35, 0.1, 0.72, 0.05, 0.2, 0.88, 0.8] },
    transit_contribution: { transit_intensity: 0.72 },
    delta: { vs_30day_avg: { avg_sectors: [0.08, 0.28, 0.78, 0.85, 0.18, 0.38, 0.12, 0.75, 0.08, 0.22, 0.9, 0.83] } },
    events: [
      { id: 'evt_water_1', type: 'resonance_jump', sector: 10, delta: 0.19, trigger_planet: 'Moon', trigger_symbol: '☽', sector_domain: 'Intuition' },
    ],
    resolution: 50,
  },
  earth: {
    ring: { sectors: [0.2, 0.88, 0.15, 0.25, 0.3, 0.92, 0.18, 0.22, 0.25, 0.85, 0.12, 0.28] },
    soulprint: { sectors: [0.15, 0.8, 0.1, 0.2, 0.25, 0.85, 0.15, 0.18, 0.2, 0.78, 0.08, 0.22] },
    transit_contribution: { transit_intensity: 0.65 },
    delta: { vs_30day_avg: { avg_sectors: [0.18, 0.82, 0.12, 0.22, 0.28, 0.88, 0.16, 0.2, 0.22, 0.8, 0.1, 0.25] } },
    events: [],
    resolution: 33,
  },
  mixed: {
    ring: { sectors: [0.45, 0.52, 0.38, 0.61, 0.49, 0.55, 0.42, 0.58, 0.47, 0.53, 0.44, 0.59] },
    soulprint: { sectors: [0.4, 0.48, 0.35, 0.55, 0.45, 0.5, 0.38, 0.52, 0.43, 0.49, 0.4, 0.54] },
    transit_contribution: { transit_intensity: 0.45 },
    delta: { vs_30day_avg: { avg_sectors: [0.42, 0.5, 0.36, 0.58, 0.47, 0.52, 0.4, 0.55, 0.45, 0.51, 0.42, 0.56] } },
    events: [],
    resolution: 100,
  },
};

const withMockFetch = (profile: keyof typeof mockProfiles) => {
  (globalThis as { fetch?: typeof fetch }).fetch = async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url.includes('/api/transit-state/')) {
      return {
        ok: true,
        status: 200,
        json: async () => mockProfiles[profile],
      } as Response;
    }

    if (url.includes('/api/space-weather')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          kp_index: 3.1,
          source: 'DONKI',
          fetched_at: new Date().toISOString(),
          cache_ttl_seconds: 900,
        }),
      } as Response;
    }

    return {
      ok: false,
      status: 404,
      json: async () => ({ error: 'not mocked' }),
    } as Response;
  };
};

const meta: Meta<typeof FusionRing3D> = {
  title: 'Bazodiac/FusionRing3D',
  component: FusionRing3D,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    userId: 'story-user',
    isInteractive: true,
    labels,
  },
};

export default meta;
type Story = StoryObj<typeof FusionRing3D>;

export const FeuerProfil: Story = {
  loaders: [async () => withMockFetch('fire')],
};

export const WasserProfil: Story = {
  loaders: [async () => withMockFetch('water')],
};

export const ErdeProfil: Story = {
  loaders: [async () => withMockFetch('earth')],
};

export const GemischtesProfil: Story = {
  loaders: [async () => withMockFetch('mixed')],
};

export const ReducedMotionFallback: Story = {
  loaders: [async () => withMockFetch('mixed')],
  decorators: [
    (StoryComponent) => {
      const original = window.matchMedia;
      window.matchMedia = ((query: string) => ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      })) as typeof window.matchMedia;

      const story = StoryComponent();
      window.matchMedia = original;
      return story;
    },
  ],
};

export const ErrorFallback: Story = {
  loaders: [
    async () => {
      (globalThis as { fetch?: typeof fetch }).fetch = async () => {
        throw new Error('mocked network failure');
      };
    },
  ],
};
