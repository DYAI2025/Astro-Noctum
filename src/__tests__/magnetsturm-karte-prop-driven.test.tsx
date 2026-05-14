/**
 * MagnetsturmKarte — prop-driven (TASK-5.2)
 *
 * Verifies that MagnetsturmKarte receives spaceWeather via props instead of
 * calling useSpaceWeather() directly. This deduplicates the NOAA poller when
 * Dashboard mounts both the hook and the card on the same page.
 *
 * Single-poller invariant: Dashboard.tsx is the sole caller of
 * useSpaceWeather() in the dashboard tree. MagnetsturmKarte must not poll on
 * its own.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MagnetsturmKarte } from '../components/dashboard/MagnetsturmKarte';
import type { SpaceWeatherState } from '../hooks/useSpaceWeather';

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({ lang: 'de' as const, t: (k: string) => k, setLang: vi.fn() }),
}));

// Critically: do NOT mock useSpaceWeather here. The component must not call
// it after the refactor. If it does, the test environment would error on
// fetch/setInterval calls or the dashed rendering would diverge.

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

describe('MagnetsturmKarte (TASK-5.2 prop-driven)', () => {
  it('MK-PROP-001: renders Kp value from prop without calling useSpaceWeather()', () => {
    const sw = makeWeather({ kpIndex: 5.3, gScale: 'G1' });
    render(<MagnetsturmKarte spaceWeather={sw} />);

    // Visible card means props were consumed.
    expect(screen.getByTestId('magnetsturm-karte')).toBeInTheDocument();
    // Kp value rendered from the prop, not from a polled hook.
    expect(screen.getByText('5.3')).toBeInTheDocument();
    expect(screen.getByText('G1')).toBeInTheDocument();
  });

  it('MK-PROP-002: self-hides from prop when kpIndex < 4', () => {
    const sw = makeWeather({ kpIndex: 2, gScale: 'G0' });
    const { container } = render(<MagnetsturmKarte spaceWeather={sw} />);
    expect(container.firstChild).toBeNull();
  });

  it('MK-PROP-003: self-hides from prop while loading', () => {
    const sw = makeWeather({ kpIndex: 7, gScale: 'G3', loading: true });
    const { container } = render(<MagnetsturmKarte spaceWeather={sw} />);
    expect(container.firstChild).toBeNull();
  });
});
