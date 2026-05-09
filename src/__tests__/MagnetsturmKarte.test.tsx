import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MagnetsturmKarte } from '../components/dashboard/MagnetsturmKarte';
import type { SpaceWeatherState } from '../hooks/useSpaceWeather';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'de', t: (k: string) => k }),
}));

// NOTE (TASK-5.2): MagnetsturmKarte is now prop-driven. It no longer calls
// useSpaceWeather() — Dashboard.tsx is the single hook caller and passes the
// state down. Tests construct a SpaceWeatherState fixture and render the card
// with a `spaceWeather` prop.

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeWeather = (overrides: Partial<SpaceWeatherState> = {}): SpaceWeatherState => ({
  kpIndex: 0,
  solarPressure: 0,
  ringModulation: 1,
  intensityBoost: 0,
  triggerEffect: false,
  gScale: 'G0',
  xrayFlux: 0,
  xrayClass: 'A',
  protonFlux: 0,
  f107: 150,
  solarCyclePhase: 'ascending',
  events: [],
  alerts: [],
  lastUpdate: null,
  loading: false,
  error: null,
  ...overrides,
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('MagnetsturmKarte', () => {
  it('renders null when kpIndex is below threshold (< 4)', () => {
    const sw = makeWeather({ kpIndex: 3, gScale: 'G0' });
    const { container } = render(<MagnetsturmKarte spaceWeather={sw} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders null when kpIndex = 0', () => {
    const sw = makeWeather({ kpIndex: 0, gScale: 'G0' });
    const { container } = render(<MagnetsturmKarte spaceWeather={sw} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders null while loading', () => {
    const sw = makeWeather({ kpIndex: 7, gScale: 'G3', loading: true });
    const { container } = render(<MagnetsturmKarte spaceWeather={sw} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders card when kpIndex >= 4', () => {
    const sw = makeWeather({ kpIndex: 5, gScale: 'G1' });
    render(<MagnetsturmKarte spaceWeather={sw} />);
    expect(screen.getByTestId('magnetsturm-karte')).toBeInTheDocument();
  });

  it('shows G-scale badge and German label', () => {
    const sw = makeWeather({ kpIndex: 6, gScale: 'G2' });
    render(<MagnetsturmKarte spaceWeather={sw} />);
    expect(screen.getByText('G2')).toBeInTheDocument();
    expect(screen.getByText('Mäßiger Magnetsturm')).toBeInTheDocument();
  });

  it('shows Kp index value', () => {
    const sw = makeWeather({ kpIndex: 5.3, gScale: 'G1' });
    render(<MagnetsturmKarte spaceWeather={sw} />);
    expect(screen.getByText('5.3')).toBeInTheDocument();
  });

  it('shows AKTIV badge at G3+ (kpIndex >= 7)', () => {
    const sw = makeWeather({ kpIndex: 7, gScale: 'G3' });
    render(<MagnetsturmKarte spaceWeather={sw} />);
    expect(screen.getByText('AKTIV')).toBeInTheDocument();
  });

  it('does NOT show AKTIV badge below G3', () => {
    const sw = makeWeather({ kpIndex: 5, gScale: 'G1' });
    render(<MagnetsturmKarte spaceWeather={sw} />);
    expect(screen.queryByText('AKTIV')).toBeNull();
  });

  it('hides X-ray class when it is A (nominal)', () => {
    const sw = makeWeather({ kpIndex: 5, gScale: 'G1', xrayClass: 'A' });
    render(<MagnetsturmKarte spaceWeather={sw} />);
    expect(screen.queryByText('Röntgenklasse')).toBeNull();
  });

  it('shows X-ray class when elevated (M or X)', () => {
    const sw = makeWeather({ kpIndex: 7, gScale: 'G3', xrayClass: 'M5' });
    render(<MagnetsturmKarte spaceWeather={sw} />);
    expect(screen.getByText('Röntgenklasse')).toBeInTheDocument();
    expect(screen.getByText('M5')).toBeInTheDocument();
  });

  it('shows proton flux when elevated (>= 10 pfu)', () => {
    const sw = makeWeather({ kpIndex: 7, gScale: 'G3', protonFlux: 150 });
    render(<MagnetsturmKarte spaceWeather={sw} />);
    expect(screen.getByText('Protonenfluss')).toBeInTheDocument();
  });

  it('hides proton flux when below 10 pfu', () => {
    const sw = makeWeather({ kpIndex: 5, gScale: 'G1', protonFlux: 2 });
    render(<MagnetsturmKarte spaceWeather={sw} />);
    expect(screen.queryByText('Protonenfluss')).toBeNull();
  });
});
