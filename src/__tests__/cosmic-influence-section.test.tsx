import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CosmicInfluenceSection } from '../components/dashboard/CosmicInfluenceSection';
import type { SpaceWeatherState } from '../hooks/useSpaceWeather';

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({
    lang: 'de',
    t: (key: string) => {
      const map: Record<string, string> = {
        'dashboard.cosmicInfluence.sectionTitle': 'Kosmischer Einfluss',
        'dashboard.cosmicInfluence.liveLabel': 'LIVE',
        'dashboard.cosmicInfluence.noDataLabel': 'KEINE DATEN',
        'dashboard.cosmicInfluence.kpLabel': 'Geomagnetisch',
        'dashboard.cosmicInfluence.kpTooltip': 'Kp-Index Tooltip',
        'dashboard.cosmicInfluence.solarPressureLabel': 'Solar-Druck',
        'dashboard.cosmicInfluence.solarPressureTooltip': 'Solar-Druck Tooltip',
        'dashboard.cosmicInfluence.noEventsLabel': 'Ruhig — keine aktiven Weltraumereignisse',
        'dashboard.cosmicInfluence.eventCme': 'CME',
        'dashboard.cosmicInfluence.eventFlare': 'Flare',
        'dashboard.cosmicInfluence.eventStorm': 'Sturm',
        'dashboard.cosmicInfluence.eventSep': 'SEP',
        'dashboard.cosmicInfluence.eventHss': 'HSS',
        'dashboard.cosmicInfluence.eventAlert': 'Alert',
      };
      return map[key] || key;
    },
  }),
}));

vi.mock('../components/Tooltip', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const liveState: SpaceWeatherState = {
  kpIndex: 3,
  solarPressure: 0.4,
  ringModulation: 1.1,
  intensityBoost: 0.2,
  triggerEffect: false,
  gScale: 'G1',
  xrayFlux: 1e-6,
  xrayClass: 'C1',
  protonFlux: 0.1,
  f107: 150,
  solarCyclePhase: 'ascending',
  events: [],
  alerts: [],
  lastUpdate: new Date('2026-04-03T12:00:00Z'),
  loading: false,
  error: null,
};

const loadingState: SpaceWeatherState = {
  ...liveState,
  loading: true,
  error: null,
  kpIndex: 0,
  solarPressure: 0,
  gScale: 'G0',
  xrayClass: 'A',
};

const errorState: SpaceWeatherState = {
  ...liveState,
  loading: false,
  error: new Error('Network error'),
};

describe('CosmicInfluenceSection', () => {
  it('renders section title', () => {
    render(<CosmicInfluenceSection spaceWeather={liveState} />);
    expect(screen.getByText('Kosmischer Einfluss')).toBeDefined();
  });

  it('shows LIVE badge when data is available', () => {
    render(<CosmicInfluenceSection spaceWeather={liveState} />);
    expect(screen.getByText('LIVE')).toBeDefined();
    expect(screen.queryByText('KEINE DATEN')).toBeNull();
  });

  it('shows KEINE DATEN badge when loading', () => {
    render(<CosmicInfluenceSection spaceWeather={loadingState} />);
    expect(screen.getByText('KEINE DATEN')).toBeDefined();
    expect(screen.queryByText('LIVE')).toBeNull();
  });

  it('shows KEINE DATEN badge when error', () => {
    render(<CosmicInfluenceSection spaceWeather={errorState} />);
    expect(screen.getByText('KEINE DATEN')).toBeDefined();
  });

  it('renders Kp gauge label', () => {
    render(<CosmicInfluenceSection spaceWeather={liveState} />);
    expect(screen.getByText('Geomagnetisch')).toBeDefined();
  });

  it('renders solar pressure gauge label', () => {
    render(<CosmicInfluenceSection spaceWeather={liveState} />);
    expect(screen.getByText('Solar-Druck')).toBeDefined();
  });

  it('shows G-scale badge', () => {
    render(<CosmicInfluenceSection spaceWeather={liveState} />);
    expect(screen.getByText('G1')).toBeDefined();
  });

  it('shows X-ray class badge', () => {
    render(<CosmicInfluenceSection spaceWeather={liveState} />);
    expect(screen.getByText('C1')).toBeDefined();
  });

  it('shows "calm" message when no active events', () => {
    render(<CosmicInfluenceSection spaceWeather={liveState} />);
    expect(screen.getByText('Ruhig — keine aktiven Weltraumereignisse')).toBeDefined();
  });

  it('renders active event pills', () => {
    const futureExpiry = new Date(Date.now() + 3600_000).toISOString();
    const withEvents: SpaceWeatherState = {
      ...liveState,
      events: [
        {
          schema: 'sp.contribution.v1' as const,
          event_id: 'e1',
          type: 'cme_arrival',
          severity: 'moderate',
          signature_weight: 0.3,
          started_at: '2026-04-03T10:00:00Z',
          expires_at: futureExpiry,
        },
        {
          schema: 'sp.contribution.v1' as const,
          event_id: 'e2',
          type: 'geomagnetic_storm',
          severity: 'strong',
          signature_weight: 0.4,
          started_at: '2026-04-03T11:00:00Z',
          expires_at: futureExpiry,
        },
      ],
    };
    render(<CosmicInfluenceSection spaceWeather={withEvents} />);
    expect(screen.getByText('CME')).toBeDefined();
    expect(screen.getByText('Sturm')).toBeDefined();
    // No "calm" text when events are active
    expect(screen.queryByText('Ruhig — keine aktiven Weltraumereignisse')).toBeNull();
  });

  it('does not render event pills from expired events', () => {
    const pastExpiry = new Date(Date.now() - 3600_000).toISOString();
    const withExpiredEvents: SpaceWeatherState = {
      ...liveState,
      events: [{
        schema: 'sp.contribution.v1' as const,
        event_id: 'e1',
        type: 'sep',
        severity: 'minor',
        signature_weight: 0.1,
        started_at: '2026-04-02T10:00:00Z',
        expires_at: pastExpiry,
      }],
    };
    render(<CosmicInfluenceSection spaceWeather={withExpiredEvents} />);
    expect(screen.queryByText('SEP')).toBeNull();
    // Expired events → shows calm
    expect(screen.getByText('Ruhig — keine aktiven Weltraumereignisse')).toBeDefined();
  });

  it('shows correct Kp percentage in gauge', () => {
    // kpIndex=3, max=9 → 33%
    render(<CosmicInfluenceSection spaceWeather={{ ...liveState, kpIndex: 3 }} />);
    expect(screen.getByText('33%')).toBeDefined();
  });

  it('shows correct solar pressure percentage', () => {
    // solarPressure=0.4 → 40%
    render(<CosmicInfluenceSection spaceWeather={{ ...liveState, solarPressure: 0.4 }} />);
    expect(screen.getByText('40%')).toBeDefined();
  });

  it('falls back gracefully when solarPressure is 0 (calm/unavailable)', () => {
    render(<CosmicInfluenceSection spaceWeather={{ ...liveState, kpIndex: 0, solarPressure: 0, gScale: 'G0' }} />);
    // G0 badge shows
    expect(screen.getByText('G0')).toBeDefined();
    // 0% displayed
    const zeros = screen.getAllByText('0%');
    expect(zeros.length).toBeGreaterThanOrEqual(2);
  });
});
